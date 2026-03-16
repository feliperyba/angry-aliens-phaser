import Matter from "matter-js";
import Phaser from "phaser";
import { TUNNELING_PREVENTION_CONFIG } from "../config/PhysicsConfig";

export interface TunnelingCollisionResult {
  body: Matter.Body;
  position: Matter.Vector;
  normal: Matter.Vector;
}

let detectorInstance: FastBodyCollisionDetector | null = null;

export function initializeFastBodyCollisionDetector(
  scene: Phaser.Scene
): FastBodyCollisionDetector {
  if (!detectorInstance) {
    detectorInstance = new FastBodyCollisionDetector(scene);
    detectorInstance.initialize();
  }
  return detectorInstance;
}

export function getFastBodyCollisionDetector(): FastBodyCollisionDetector | null {
  return detectorInstance;
}

export function destroyFastBodyCollisionDetector(): void {
  if (detectorInstance) {
    detectorInstance.destroy();
    detectorInstance = null;
  }
}

class FastBodyCollisionDetector {
  private scene: Phaser.Scene;
  private engine: Matter.Engine | null = null;
  private boostedBirds: Map<string, number> = new Map();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public initialize(): void {
    if (this.scene.matter?.world?.engine) {
      this.engine = this.scene.matter.world.engine as Matter.Engine;
    }
  }

  public registerBoostedBird(birdId: string): void {
    this.boostedBirds.set(birdId, Date.now());
  }

  public unregisterBird(birdId: string): void {
    this.boostedBirds.delete(birdId);
  }

  public isBoostedBird(birdId: string): boolean {
    const boostTime = this.boostedBirds.get(birdId);
    if (!boostTime) return false;

    const elapsed = Date.now() - boostTime;
    if (elapsed > TUNNELING_PREVENTION_CONFIG.boostDetectionWindowMs) {
      this.boostedBirds.delete(birdId);
      return false;
    }
    return true;
  }

  public checkForTunneling(
    body: Matter.Body,
    velocity: Matter.Vector
  ): TunnelingCollisionResult | null {
    if (!this.engine) return null;

    const speedSq = velocity.x ** 2 + velocity.y ** 2;
    if (speedSq < TUNNELING_PREVENTION_CONFIG.velocityThresholdSq) {
      return null;
    }

    const speed = Math.sqrt(speedSq);
    const rayLength = Math.min(speed, TUNNELING_PREVENTION_CONFIG.maxRayLength);

    if (rayLength < 1) return null;

    const startX = body.position.x;
    const startY = body.position.y;
    const normalizedVelX = velocity.x / speed;
    const normalizedVelY = velocity.y / speed;

    const endX = startX + normalizedVelX * rayLength;
    const endY = startY + normalizedVelY * rayLength;

    const bodies = Matter.Composite.allBodies(this.engine.world);
    const collidableBodies = bodies.filter((b) => {
      if (b === body) return false;
      if (b.isStatic === false && b.mass === 0) return false;
      if (!b.collisionFilter?.mask) return false;
      if (!b.collisionFilter?.category) return false;

      const bodyMask = body.collisionFilter?.mask ?? 0;
      const bCategory = b.collisionFilter.category;

      if ((bCategory & bodyMask) === 0) return false;

      return true;
    });

    const raycastResult = Matter.Query.ray(
      collidableBodies,
      { x: startX, y: startY },
      { x: endX, y: endY }
    );

    if (raycastResult.length === 0) return null;

    const firstHit = raycastResult[0];
    const hitBody = firstHit.bodyA === body ? firstHit.bodyB : firstHit.bodyA;

    if (!hitBody) return null;

    const hitPoint = {
      x: startX + normalizedVelX * rayLength * 0.5,
      y: startY + normalizedVelY * rayLength * 0.5,
    };

    return {
      body: hitBody,
      position: hitPoint,
      normal: { x: -normalizedVelX, y: -normalizedVelY },
    };
  }

  public shouldCheckForTunneling(birdId: string, velocity: Matter.Vector): boolean {
    if (!this.isBoostedBird(birdId)) return false;

    const speedSq = velocity.x ** 2 + velocity.y ** 2;
    return speedSq >= TUNNELING_PREVENTION_CONFIG.velocityThresholdSq;
  }

  public destroy(): void {
    this.boostedBirds.clear();
    this.engine = null;
  }
}
