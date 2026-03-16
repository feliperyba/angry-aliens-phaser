import Phaser from "phaser";
import { BlockShape } from "../config/assetManifest";

export interface BlockBodyConfig {
  width: number;
  height: number;
  density: number;
  restitution: number;
  friction: number;
  label: string;
}

export interface IBlockShapeStrategy {
  applyBody(matterImage: Phaser.Physics.Matter.Image, config: BlockBodyConfig): void;
}

class CircleShapeStrategy implements IBlockShapeStrategy {
  applyBody(matterImage: Phaser.Physics.Matter.Image, config: BlockBodyConfig): void {
    const radius = Math.min(config.width, config.height) / 2;
    matterImage.setCircle(radius, {
      density: config.density,
      restitution: config.restitution,
      friction: config.friction,
      label: config.label,
    });
  }
}

class TriangleShapeStrategy implements IBlockShapeStrategy {
  applyBody(matterImage: Phaser.Physics.Matter.Image, config: BlockBodyConfig): void {
    const { width, height } = config;

    const hw = width / 2;
    const hh = height / 2;
    const isRightAngled = width === height;
    let verts: string;

    if (isRightAngled) {
      // 1x1 (70x70): Right-angled triangle, right angle at bottom-left
      // Vertices in pixel coords: (0,0), (0,70), (70,70)
      // Vertices relative to center: (-hw,-hh), (-hw,hh), (hw,hh)
      verts = `${-hw} ${-hh} ${-hw} ${hh} ${hw} ${hh}`;
    } else {
      // 2x1 (140x70): Isosceles triangle pointing UP (apex at top)
      // Vertices in pixel coords: (0,70), (70,0), (140,70)
      // Vertices relative to center: (-hw,hh), (0,-hh), (hw,hh)
      verts = `${-hw} ${hh} 0 ${-hh} ${hw} ${hh}`;
    }

    matterImage.setBody(
      {
        type: "fromVertices",
        verts: verts,
      },
      {
        density: config.density,
        restitution: config.restitution,
        friction: config.friction,
        label: config.label,
      }
    );

    if (isRightAngled) {
      matterImage.setOrigin(0.35, 0.65);
    } else {
      matterImage.setOrigin(0.5, 0.65);
    }
  }
}

class RectangleShapeStrategy implements IBlockShapeStrategy {
  applyBody(matterImage: Phaser.Physics.Matter.Image, config: BlockBodyConfig): void {
    matterImage.setRectangle(config.width, config.height, {
      density: config.density,
      restitution: config.restitution,
      friction: config.friction,
      label: config.label,
    });
  }
}

export class BlockShapeFactory {
  private strategies: Map<BlockShape, IBlockShapeStrategy>;

  constructor() {
    this.strategies = new Map();
    this.registerDefaults();
  }

  private registerDefaults(): void {
    this.register("circle", new CircleShapeStrategy());
    this.register("triangle", new TriangleShapeStrategy());
    this.register("square", new RectangleShapeStrategy());
    this.register("rectangle", new RectangleShapeStrategy());
  }

  register(shape: BlockShape, strategy: IBlockShapeStrategy): void {
    this.strategies.set(shape, strategy);
  }

  applyBody(
    shape: BlockShape,
    matterImage: Phaser.Physics.Matter.Image,
    config: BlockBodyConfig
  ): void {
    const strategy = this.strategies.get(shape);
    if (!strategy) {
      this.strategies.get("rectangle")!.applyBody(matterImage, config);
      return;
    }

    strategy.applyBody(matterImage, config);
  }
}

export const blockShapeFactory = new BlockShapeFactory();
