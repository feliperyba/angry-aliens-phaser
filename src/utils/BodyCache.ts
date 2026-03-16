import Matter from "matter-js";
import Phaser from "phaser";

type MatterEngine = Matter.Engine | MatterJS.Engine;

export class BodyCache {
  private static instance: BodyCache | null = null;

  private cachedBodies: Matter.Body[] | null = null;
  private cacheFrame: number = -1;
  private scene: Phaser.Scene | null = null;
  private cacheExpiryFrames: number = 1;

  static getInstance(): BodyCache {
    if (!BodyCache.instance) {
      BodyCache.instance = new BodyCache();
    }
    return BodyCache.instance;
  }

  initialize(scene: Phaser.Scene): void {
    this.scene = scene;
    this.cachedBodies = null;
    this.cacheFrame = -1;
    this.cacheExpiryFrames = 1;
  }

  reset(): void {
    this.cachedBodies = null;
    this.cacheFrame = -1;
    this.cacheExpiryFrames = 1;
  }

  destroy(): void {
    this.cachedBodies = null;
    this.scene = null;
    this.cacheFrame = -1;
    this.cacheExpiryFrames = 1;
  }

  /**
   * Enable/disable destruction mode for extended cache validity.
   * During destruction events, multiple delayed wake operations occur,
   * so extending cache validity reduces repeated full body queries.
   */
  setDestructionMode(enabled: boolean): void {
    this.cacheExpiryFrames = enabled ? 5 : 1; // 5 frames during destruction
  }

  getAllBodies(engine: MatterEngine): Matter.Body[] {
    const currentFrame = this.scene?.time?.now ?? 0;

    // Cache valid for cacheExpiryFrames (1 normally, 5 during destruction)
    if (this.cachedBodies !== null && currentFrame - this.cacheFrame < this.cacheExpiryFrames) {
      return this.cachedBodies;
    }

    this.cachedBodies = Matter.Composite.allBodies(
      (engine as Matter.Engine).world as unknown as Matter.Composite
    );
    this.cacheFrame = currentFrame;

    return this.cachedBodies;
  }

  getBodiesInRegion(
    engine: MatterEngine,
    bounds: { min: { x: number; y: number }; max: { x: number; y: number } }
  ): Matter.Body[] {
    const allBodies = this.getAllBodies(engine);
    return Matter.Query.region(allBodies, bounds);
  }
}
