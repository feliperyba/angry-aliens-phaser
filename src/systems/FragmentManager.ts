import Phaser from "phaser";
import Matter from "matter-js";
import { BlockMaterial } from "../constants/Materials";
import { CollisionCategory } from "../constants";
import { BodyLabels } from "../constants/BodyLabels";
import type { IFragmentManager, IFragmentCollidable } from "../interfaces/IFragmentManager";
import {
  FRAGMENT_CONFIG,
  FRAGMENT_BODY_CONFIG,
  FRAGMENT_MANAGER_CONFIG,
  FRAGMENT_DEVICE_DETECTION_CONFIG,
} from "../config/PhysicsConfig";
import { DesignTokens } from "../config/DesignTokens";
import { materialRegistry } from "../config/registries/MaterialConfigRegistry";
import { FragmentVelocity } from "./fragment/FragmentVelocity";
import { FragmentAtlasCache, type BlockPreWarmConfig } from "./fragment/FragmentAtlasCache";
import { PerformanceManager } from "./PerformanceManager";
import { FragmentWorkerClient } from "../workers/fragmentWorkerClient";
import { LEVEL_ATLAS_KEY } from "../config/assetManifest";
import type { IWakeCascadeManager } from "../interfaces/IWakeCascadeManager";

interface FragmentEntry {
  body: Phaser.Physics.Matter.Image;
  spawnTime: number;
  poolSlotIndex?: number;
  material: BlockMaterial;
  area: number;
}

interface PooledFragment {
  body: Phaser.Physics.Matter.Image;
  vertexString: string;
  inUse: boolean;
}

interface QueuedFragment {
  fragX: number;
  fragY: number;
  atlasKey: string;
  frameName: string;
  vertexString: string;
  originX: number;
  originY: number;
  rotation: number;
  vx: number;
  vy: number;
  angularVelocity: number;
  density: number;
  restitution: number;
  friction: number;
  spawnTime: number;
  material: BlockMaterial;
  area: number;
}

export type FragmentCollisionSoundCallback = (material: BlockMaterial, impactSpeed: number) => void;

export type FragmentCollisionHapticCallback = (
  material: BlockMaterial,
  impactSpeed: number,
  areaRatio: number
) => void;

export class FragmentManager implements IFragmentManager {
  private readonly minFragmentSpeedSquared = FRAGMENT_MANAGER_CONFIG.minFragmentSpeed ** 2;
  private readonly collisionRadiusSquared = FRAGMENT_MANAGER_CONFIG.collisionRadius ** 2;
  private readonly hapticCooldownMs = DesignTokens.mobile.hapticCooldowns.fragment;

  private scene: Phaser.Scene;
  private atlasCache: FragmentAtlasCache;
  private activeFragments: FragmentEntry[] = [];
  private fragmentPool: PooledFragment[] = [];
  private poolByVertexString: Map<string, number[]> = new Map();
  private availablePoolSlots: number[] = [];
  private fragmentQueue: QueuedFragment[] = [];
  private cleanupTimer: Phaser.Time.TimerEvent | null = null;
  private destroyed: boolean = false;
  private frameCreatedCount: number = 0;
  private isLowEndDevice: boolean;
  private wakeManager: IWakeCascadeManager | null = null;
  private collisionSoundCallback: FragmentCollisionSoundCallback | null = null;
  private collisionHapticCallback: FragmentCollisionHapticCallback | null = null;
  private lastCollisionSoundTime: number = 0;
  private lastCollisionHapticTime: number = 0;
  private maxFragmentArea: number = 0;

  constructor(scene: Phaser.Scene, atlasCache?: FragmentAtlasCache) {
    this.scene = scene;
    this.atlasCache = atlasCache ?? new FragmentAtlasCache(scene);
    this.isLowEndDevice = PerformanceManager.isLowEndCPU();
    this.startBatchCleanup();
  }

  public setCollisionSoundCallback(callback: FragmentCollisionSoundCallback | null): void {
    this.collisionSoundCallback = callback;
  }

  public setCollisionHapticCallback(callback: FragmentCollisionHapticCallback | null): void {
    this.collisionHapticCallback = callback;
  }

  public setWakeCascadeManager(manager: IWakeCascadeManager): void {
    this.wakeManager = manager;
  }

  private startBatchCleanup(): void {
    this.cleanupTimer = this.scene.time.addEvent({
      delay: FRAGMENT_MANAGER_CONFIG.cleanupIntervalMs,
      callback: this.processExpiredFragments,
      callbackScope: this,
      loop: true,
    });
  }

  private processExpiredFragments(): void {
    if (this.destroyed || this.activeFragments.length === 0) return;

    const now = Date.now();
    const wakePositions: { x: number; y: number }[] = [];

    for (let i = this.activeFragments.length - 1; i >= 0; i--) {
      const entry = this.activeFragments[i];

      if (now - entry.spawnTime >= FRAGMENT_CONFIG.lifetime) {
        if (this.wakeManager && entry.body.active) {
          const pos = entry.body.getCenter();
          wakePositions.push({ x: pos.x, y: pos.y });
        }

        this.releaseFragment(entry.body, entry.poolSlotIndex);
        this.activeFragments.splice(i, 1);
      }
    }

    if (wakePositions.length > 0 && this.wakeManager) {
      let minX = Infinity,
        maxX = -Infinity,
        minY = Infinity,
        maxY = -Infinity;

      for (const p of wakePositions) {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
      }

      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      const radius = Math.max(maxX - minX, maxY - minY) / 2 + FRAGMENT_MANAGER_CONFIG.wakeRadius;

      this.wakeManager.wakeInRadiusImmediate(centerX, centerY, radius);
    }
  }

  public async createFragments(
    x: number,
    y: number,
    textureKey: string,
    width: number,
    height: number,
    material: string,
    impactSpeed: number,
    impactAngle: number = Math.PI / 2,
    rotation: number = 0
  ): Promise<Phaser.Physics.Matter.Image[]> {
    if (this.destroyed) return [];

    const mat = material as BlockMaterial;
    const fragmentConfig = materialRegistry.getFragment(mat);
    const baseCount = fragmentConfig?.count ?? 5;
    const fragmentCount = PerformanceManager.getScaledCount(this.scene, baseCount, 1);
    const relaxationIterations = fragmentConfig?.voronoiRelaxation ?? 2;

    const workerClient = FragmentWorkerClient.getInstance();
    const fragments = await workerClient.getOrGenerate(
      width,
      height,
      material,
      fragmentCount,
      relaxationIterations
    );

    const atlas = await this.atlasCache.getOrCreateAsync(
      LEVEL_ATLAS_KEY,
      textureKey,
      fragments,
      width,
      height,
      material
    );
    if (!atlas) {
      return [];
    }

    this.enforceFragmentCap(fragments.length);

    const qualityMultiplier = PerformanceManager.getQualityMultiplier(this.scene);
    const isHighQuality = qualityMultiplier >= FRAGMENT_BODY_CONFIG.qualityThreshold;
    const fragmentImages: Phaser.Physics.Matter.Image[] = [];
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    const now = Date.now();

    const density = (fragmentConfig?.density ?? 0.006) * FRAGMENT_CONFIG.densityMultiplier;
    const restitution =
      fragmentConfig?.restitution ?? FRAGMENT_DEVICE_DETECTION_CONFIG.defaultRestitution;
    const friction = fragmentConfig?.friction ?? FRAGMENT_DEVICE_DETECTION_CONFIG.defaultFriction;

    const queuedItems: QueuedFragment[] = [];

    for (let index = 0; index < fragments.length; index++) {
      const fragment = fragments[index];

      if (fragment.area < FRAGMENT_CONFIG.minimumArea) {
        continue;
      }

      const vertexString = isHighQuality ? fragment.vertexStringHigh : fragment.vertexStringLow;
      // Count spaces instead of split (faster - avoids creating array)
      // "x y x y" has 3 spaces = 4 vertices, need 6 vertices = 5+ spaces
      if (!vertexString) continue;
      let spaceCount = 0;
      for (let i = 0; i < vertexString.length && spaceCount < 5; i++) {
        if (vertexString[i] === " ") spaceCount++;
      }
      if (spaceCount < 5) continue;

      const localX = fragment.centerX - width / 2;
      const localY = fragment.centerY - height / 2;
      const rotatedX = localX * cos - localY * sin;
      const rotatedY = localX * sin + localY * cos;
      const fragX = x + rotatedX;
      const fragY = y + rotatedY;

      const velocityData = FragmentVelocity.calculate(
        fragmentConfig,
        impactSpeed,
        impactAngle,
        fragment,
        width
      );

      queuedItems.push({
        fragX,
        fragY,
        atlasKey: atlas.atlasKey,
        frameName: atlas.frameNames[index],
        vertexString,
        originX: fragment.originX,
        originY: fragment.originY,
        rotation,
        vx: velocityData.vx,
        vy: velocityData.vy,
        angularVelocity: velocityData.angularVelocity,
        density,
        restitution,
        friction,
        spawnTime: now,
        material: mat,
        area: fragment.area,
      });
    }

    const maxArea = Math.max(...queuedItems.map((q) => q.area), 1);
    this.maxFragmentArea = Math.max(this.maxFragmentArea, maxArea);

    const immediateBudget = Math.max(
      0,
      FRAGMENT_MANAGER_CONFIG.fragmentsPerFrame - this.frameCreatedCount
    );
    const maxImmediate = this.isLowEndDevice
      ? FRAGMENT_MANAGER_CONFIG.lowEndImmediateFragments
      : FRAGMENT_MANAGER_CONFIG.immediateFragments;
    const immediateCount = Math.min(maxImmediate, queuedItems.length, immediateBudget);

    for (let i = 0; i < immediateCount; i++) {
      const data = queuedItems[i];
      try {
        const body = this.createFragmentFromQueueData(data);
        fragmentImages.push(body);
        this.frameCreatedCount++;
      } catch (e) {
        console.warn("Immediate fragment creation failed:", e);
      }
    }

    for (let i = immediateCount; i < queuedItems.length; i++) {
      this.fragmentQueue.push(queuedItems[i]);
    }

    return fragmentImages;
  }

  public processQueue(): void {
    this.frameCreatedCount = 0;

    if (this.destroyed || this.fragmentQueue.length === 0) return;

    const maxPerFrame = this.isLowEndDevice
      ? FRAGMENT_MANAGER_CONFIG.lowEndQueuePerFrame
      : FRAGMENT_MANAGER_CONFIG.maxQueueProcessingPerFrame;

    const toProcess = Math.min(maxPerFrame, this.fragmentQueue.length);

    for (let i = 0; i < toProcess; i++) {
      const data = this.fragmentQueue.shift()!;
      try {
        this.createFragmentFromQueueData(data);
      } catch (e) {
        console.warn("Queued fragment creation failed:", e);
      }
    }
  }

  public hasQueuedFragments(): boolean {
    return this.fragmentQueue.length > 0;
  }

  private createFragmentFromQueueData(data: QueuedFragment): Phaser.Physics.Matter.Image {
    const { body, poolSlotIndex } = this.acquireFragment(
      data.fragX,
      data.fragY,
      data.atlasKey,
      data.frameName,
      data.vertexString,
      data.originX,
      data.originY,
      data.density,
      data.restitution,
      data.friction,
      data.rotation
    );

    FragmentVelocity.applyFromData(body, {
      vx: data.vx,
      vy: data.vy,
      angularVelocity: data.angularVelocity,
    });

    body.setDepth(FRAGMENT_MANAGER_CONFIG.depth);
    body.setCollisionCategory(CollisionCategory.DEBRIS);
    body.setCollidesWith([
      CollisionCategory.BLOCK,
      CollisionCategory.GROUND,
      CollisionCategory.DEBRIS,
      CollisionCategory.PIG,
      CollisionCategory.BIRD,
    ]);

    if (body.body) {
      (body.body as Matter.Body).label = BodyLabels.FRAGMENT;
    }

    body.setOnCollide((event: Phaser.Types.Physics.Matter.MatterCollisionData) => {
      this.handleFragmentCollision(event, data.material, data.area);
    });

    this.activeFragments.push({
      body,
      spawnTime: data.spawnTime,
      poolSlotIndex,
      material: data.material,
      area: data.area,
    });

    return body;
  }

  private handleFragmentCollision(
    event: Phaser.Types.Physics.Matter.MatterCollisionData,
    material: BlockMaterial,
    area: number
  ): void {
    const velocityA = event.bodyA.velocity;
    const velocityB = event.bodyB.velocity;
    const relativeVelocity = {
      x: velocityA.x - velocityB.x,
      y: velocityA.y - velocityB.y,
    };
    const speedSquared = relativeVelocity.x ** 2 + relativeVelocity.y ** 2;

    if (speedSquared < FRAGMENT_MANAGER_CONFIG.minImpactSpeedForSound ** 2) return;

    const now = Date.now();
    const impactSpeed = Math.sqrt(speedSquared);
    const areaRatio = this.maxFragmentArea > 0 ? area / this.maxFragmentArea : 0.5;

    if (
      this.collisionSoundCallback &&
      now - this.lastCollisionSoundTime >= FRAGMENT_MANAGER_CONFIG.soundCooldownMs
    ) {
      this.lastCollisionSoundTime = now;
      this.collisionSoundCallback(material, impactSpeed);
    }

    if (
      this.collisionHapticCallback &&
      now - this.lastCollisionHapticTime >= this.hapticCooldownMs
    ) {
      this.lastCollisionHapticTime = now;
      this.collisionHapticCallback(material, impactSpeed, areaRatio);
    }
  }

  public hasActiveFragments(): boolean {
    return this.activeFragments.length > 0;
  }

  public getActiveFragmentCount(): number {
    return this.activeFragments.length;
  }

  private enforceFragmentCap(incomingCount: number): void {
    while (
      this.activeFragments.length > 0 &&
      this.activeFragments.length + incomingCount > FRAGMENT_MANAGER_CONFIG.maxActiveFragments
    ) {
      const entry = this.activeFragments.shift();
      if (entry) {
        this.releaseFragment(entry.body, entry.poolSlotIndex);
      }
    }
  }

  private acquireFragment(
    x: number,
    y: number,
    textureKey: string,
    frameName: string,
    vertexString: string,
    originX: number,
    originY: number,
    density: number,
    restitution: number,
    friction: number,
    rotation: number
  ): { body: Phaser.Physics.Matter.Image; poolSlotIndex?: number } {
    const pooled = this.tryGetFromPool(vertexString);
    if (pooled) {
      return {
        body: this.reinitializePooledFragment(
          pooled.body,
          x,
          y,
          textureKey,
          frameName,
          originX,
          originY,
          rotation
        ),
        poolSlotIndex: pooled.poolIdx,
      };
    }

    return {
      body: this.createFragmentBody(
        x,
        y,
        textureKey,
        frameName,
        vertexString,
        density,
        restitution,
        friction,
        originX,
        originY,
        rotation
      ),
    };
  }

  private tryGetFromPool(
    vertexString: string
  ): { body: Phaser.Physics.Matter.Image; poolIdx: number } | null {
    const indices = this.poolByVertexString.get(vertexString);
    if (!indices || indices.length === 0) {
      return null;
    }

    const poolIdx = indices.pop()!;
    const pooled = this.fragmentPool[poolIdx];

    if (indices.length === 0) {
      this.poolByVertexString.delete(vertexString);
    }

    pooled.inUse = true;

    return { body: pooled.body, poolIdx };
  }

  private reinitializePooledFragment(
    body: Phaser.Physics.Matter.Image,
    x: number,
    y: number,
    textureKey: string,
    frameName: string,
    originX: number,
    originY: number,
    rotation: number
  ): Phaser.Physics.Matter.Image {
    body
      .setActive(true)
      .setVisible(true)
      .setTexture(textureKey, frameName)
      .setFrame(frameName, true, true)
      .setPosition(x, y)
      .setRotation(rotation)
      .setOrigin(originX, originY)
      .setStatic(false)
      .setSensor(false)
      .setIgnoreGravity(false)
      .setAwake()
      .setDepth(FRAGMENT_MANAGER_CONFIG.depth);

    return body;
  }

  private createFragmentBody(
    x: number,
    y: number,
    textureKey: string,
    frameName: string,
    vertexString: string,
    density: number,
    restitution: number,
    friction: number,
    originX: number,
    originY: number,
    rotation: number
  ): Phaser.Physics.Matter.Image {
    const body = this.scene.matter.add.image(x, y, textureKey, frameName, {
      shape: {
        type: "fromVertices",
        verts: vertexString,
      },
      density,
      restitution,
      friction,
      frictionAir: FRAGMENT_CONFIG.frictionAir,
    });

    body
      .setOrigin(originX, originY)
      .setRotation(rotation)
      .setDepth(FRAGMENT_MANAGER_CONFIG.depth)
      .setCollisionCategory(CollisionCategory.DEBRIS)
      .setCollidesWith([
        CollisionCategory.BLOCK,
        CollisionCategory.GROUND,
        CollisionCategory.DEBRIS,
        CollisionCategory.PIG,
        CollisionCategory.BIRD,
      ]);

    if (body.body) {
      (body.body as Matter.Body).label = BodyLabels.FRAGMENT;
    }

    return body;
  }

  private releaseFragment(body: Phaser.Physics.Matter.Image, returnToSlot?: number): void {
    if (!body.scene || this.fragmentPool.length >= FRAGMENT_MANAGER_CONFIG.maxPoolSize) {
      if (body.scene) {
        body.destroy();
      }
      // Return slot to available if specified
      if (returnToSlot !== undefined) {
        this.availablePoolSlots.push(returnToSlot);
      }
      return;
    }

    const vertexString = this.extractVertexStringFromBody(body);

    body
      .setVelocity(0, 0)
      .setAngularVelocity(0)
      .setSensor(true)
      .setStatic(true)
      .setIgnoreGravity(true)
      .setPosition(
        FRAGMENT_MANAGER_CONFIG.poolHidePosition,
        FRAGMENT_MANAGER_CONFIG.poolHidePosition
      )
      .setVisible(false)
      .setActive(false)
      .setToSleep();

    let poolIdx: number;
    if (returnToSlot !== undefined && returnToSlot < this.fragmentPool.length) {
      // Return to the original slot
      poolIdx = returnToSlot;
      this.fragmentPool[poolIdx] = { body, vertexString, inUse: false };
    } else if (this.availablePoolSlots.length > 0) {
      poolIdx = this.availablePoolSlots.pop()!;
      this.fragmentPool[poolIdx] = { body, vertexString, inUse: false };
    } else {
      poolIdx = this.fragmentPool.length;
      this.fragmentPool.push({ body, vertexString, inUse: false });
    }

    if (vertexString) {
      if (!this.poolByVertexString.has(vertexString)) {
        this.poolByVertexString.set(vertexString, []);
      }
      this.poolByVertexString.get(vertexString)!.push(poolIdx);
    }
  }

  private extractVertexStringFromBody(body: Phaser.Physics.Matter.Image): string {
    const matterBody = body.body as Matter.Body;
    if (!matterBody || !matterBody.vertices || matterBody.vertices.length < 3) {
      return "";
    }

    const centroid = {
      x: matterBody.vertices.reduce((sum, v) => sum + v.x, 0) / matterBody.vertices.length,
      y: matterBody.vertices.reduce((sum, v) => sum + v.y, 0) / matterBody.vertices.length,
    };

    return matterBody.vertices
      .map((v) => `${(v.x - centroid.x).toFixed(2)} ${(v.y - centroid.y).toFixed(2)}`)
      .join(" ");
  }

  private cleanupFragment(body: Phaser.Physics.Matter.Image, poolSlotIndex?: number): void {
    if (this.destroyed) return;

    if (body.active) {
      this.releaseFragment(body, poolSlotIndex);
    }

    const idx = this.activeFragments.findIndex((entry) => entry.body === body);
    if (idx > -1) {
      this.activeFragments.splice(idx, 1);
    }
  }

  public checkFragmentPigCollisions(targets: IFragmentCollidable[]): void {
    if (this.destroyed || this.activeFragments.length === 0) return;
    if (!PerformanceManager.shouldRunFragmentDamage(this.scene)) return;

    const camera = this.scene.cameras.main;
    const viewLeft = camera.scrollX - FRAGMENT_MANAGER_CONFIG.outOfBoundsMargin;
    const viewRight = camera.scrollX + camera.width + FRAGMENT_MANAGER_CONFIG.outOfBoundsMargin;
    const viewTop = camera.scrollY - FRAGMENT_MANAGER_CONFIG.outOfBoundsMargin;
    const viewBottom = camera.scrollY + camera.height + FRAGMENT_MANAGER_CONFIG.outOfBoundsMargin;

    for (const entry of this.activeFragments) {
      const fragment = entry.body;
      if (!fragment.active) continue;

      const fragPos = fragment.getCenter();

      if (
        fragPos.x < viewLeft ||
        fragPos.x > viewRight ||
        fragPos.y < viewTop ||
        fragPos.y > viewBottom
      ) {
        continue;
      }

      const fragVelocity = fragment.body?.velocity ?? { x: 0, y: 0 };
      const speedSquared = fragVelocity.x * fragVelocity.x + fragVelocity.y * fragVelocity.y;
      if (speedSquared < this.minFragmentSpeedSquared) continue;

      for (const target of targets) {
        if (target.isDestroyed()) continue;

        const targetPos = target.getPosition();

        const dx = fragPos.x - targetPos.x;
        const dy = fragPos.y - targetPos.y;
        const distSquared = dx * dx + dy * dy;

        if (distSquared < this.collisionRadiusSquared) {
          target.takeDamage(1);
        }
      }
    }
  }

  public cleanupOutOfBoundsFragments(bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  }): void {
    if (this.destroyed || this.activeFragments.length === 0) return;

    const margin = FRAGMENT_MANAGER_CONFIG.outOfBoundsMargin;

    for (let i = this.activeFragments.length - 1; i >= 0; i--) {
      const entry = this.activeFragments[i];
      const fragment = entry.body;
      if (!fragment.active) {
        // Release inactive fragments to pool instead of orphaning them
        this.releaseFragment(fragment, entry.poolSlotIndex);
        this.activeFragments.splice(i, 1);
        continue;
      }

      const pos = fragment.getCenter();
      if (
        pos.x < bounds.minX - margin ||
        pos.x > bounds.maxX + margin ||
        pos.y < bounds.minY - margin ||
        pos.y > bounds.maxY + margin
      ) {
        this.cleanupFragment(fragment, entry.poolSlotIndex);
      }
    }
  }

  public applyExplosionToActiveFragments(
    explosionX: number,
    explosionY: number,
    radius: number,
    pushSpeed: number
  ): void {
    if (this.destroyed || this.activeFragments.length === 0) return;

    const radiusSquared = radius * radius;

    for (const entry of this.activeFragments) {
      const body = entry.body;
      if (!body || !body.body) continue;

      const matterBody = body.body as Matter.Body;
      if (matterBody.isStatic) continue;

      const dx = matterBody.position.x - explosionX;
      const dy = matterBody.position.y - explosionY;
      const distSquared = dx * dx + dy * dy;

      // Early exit using squared distance - no sqrt needed for rejection
      if (distSquared >= radiusSquared) continue;

      const distance = Math.sqrt(distSquared);

      if (matterBody.isSleeping) {
        Matter.Sleeping.set(matterBody, false);
      }

      const distanceRatio = distance / radius;
      let speed = pushSpeed * (1 - distanceRatio);
      const massFactor = 1 / (1 + matterBody.mass * FRAGMENT_MANAGER_CONFIG.explosionMassFactor);
      speed *= massFactor;

      let dirX: number;
      let dirY: number;
      if (distance <= 0) {
        const randomAngle = Math.random() * Math.PI * 2;
        dirX = Math.cos(randomAngle);
        dirY = Math.sin(randomAngle);
      } else {
        dirX = dx / distance;
        dirY = dy / distance;
      }

      Matter.Body.setVelocity(matterBody, {
        x: matterBody.velocity.x + dirX * speed,
        y: matterBody.velocity.y + dirY * speed,
      });
    }
  }

  /**
   * Pre-warm fragment atlases for the given block configurations.
   * This should be called during scene loading to avoid frame spikes during gameplay.
   */
  public async preWarmForLevel(configs: BlockPreWarmConfig[]): Promise<void> {
    return this.atlasCache.preWarmForLevel(configs);
  }

  /**
   * Reset state for a new level. Call this when transitioning between levels
   * to reset the max fragment area used for haptic intensity scaling.
   */
  public resetLevelState(): void {
    this.maxFragmentArea = 0;
    this.lastCollisionSoundTime = 0;
    this.lastCollisionHapticTime = 0;
  }

  public destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;

    if (this.cleanupTimer) {
      this.cleanupTimer.remove();
      this.cleanupTimer = null;
    }

    this.fragmentQueue = [];

    for (const entry of this.activeFragments) {
      if (entry.body.active) {
        entry.body.destroy();
      }
    }
    this.activeFragments = [];

    for (const pooled of this.fragmentPool) {
      if (pooled.body.scene) {
        pooled.body.destroy();
      }
    }
    this.fragmentPool = [];
    this.poolByVertexString.clear();
    this.availablePoolSlots = [];

    this.atlasCache.destroy();
  }
}
