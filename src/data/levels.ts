import { BirdType } from "../types/BirdType";
import { PigSize } from "../constants";
import { BlockMaterial } from "../constants/Materials";
import { BlockShape } from "../config/assetManifest";
import {
  GRID_UNIT,
  ThemeType,
  SLINGSHOT_X,
  STRUCTURE_START_X,
  GROUND_Y,
} from "../config/GameConfig";
import type { Position } from "../types/Vector2";

export type { ThemeType };

export interface StarThresholds {
  oneStar: number;
  twoStars: number;
  threeStars: number;
}

export interface LevelBirdConfig {
  type: BirdType;
}

export interface LevelBlockConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  material: BlockMaterial;
  rotation: number;
  elementIndex?: string;
}

export interface LevelPigConfig {
  x: number;
  y: number;
  size: PigSize;
}

export interface LevelSlingshotConfig {
  x: number;
  y: number;
}

export interface LevelData {
  levelId: number;
  name: string;
  description: string;
  theme: ThemeType;
  birds: LevelBirdConfig[];
  structures: LevelBlockConfig[];
  pigs: LevelPigConfig[];
  slingshot: LevelSlingshotConfig;
  starThresholds: StarThresholds;
  teachingFocus: string;
}

export interface GridBlockConfig {
  col: number;
  row: number;
  gridW: number;
  gridH: number;
  material: BlockMaterial;
  shape: BlockShape;
  rotation?: 0 | 45 | 90 | 180 | 270;
}

export interface GridPigConfig {
  col: number;
  row: number;
  size: PigSize;
}

export interface GridLevelData {
  levelId: number;
  name: string;
  description: string;
  theme: ThemeType;
  birds: LevelBirdConfig[];
  blocks: GridBlockConfig[];
  pigs: GridPigConfig[];
  slingshot: LevelSlingshotConfig;
  starThresholds: StarThresholds;
  teachingFocus: string;
}

const SLINGSHOT_Y = GROUND_Y - GRID_UNIT;

interface GridLevelBlueprint extends Omit<GridLevelData, "starThresholds"> {
  minBirdsToClear: number;
}

const SLINGSHOT: LevelSlingshotConfig = { x: SLINGSHOT_X, y: SLINGSHOT_Y };

const BLOCK_SCORE_MULTIPLIER: Record<BlockMaterial, number> = {
  [BlockMaterial.GLASS]: 1,
  [BlockMaterial.WOOD]: 2,
  [BlockMaterial.STONE]: 3,
  [BlockMaterial.METAL]: 4,
  [BlockMaterial.EXPLOSIVE]: 5,
};

function estimateStarThresholds(level: GridLevelBlueprint): StarThresholds {
  const pigScore = level.pigs.length * 5000;
  const blockScore = level.blocks.reduce(
    (total, block) => total + 500 * BLOCK_SCORE_MULTIPLIER[block.material],
    0
  );
  const explosiveBonus =
    level.blocks.filter((block) => block.material === BlockMaterial.EXPLOSIVE).length * 500;
  const spareBirdBonus = Math.max(0, level.birds.length - level.minBirdsToClear) * 10000;
  const impactBonus = Math.max(1500, level.blocks.length * 140);
  const perfectScore = pigScore + blockScore + explosiveBonus + spareBirdBonus + impactBonus;

  return {
    oneStar: pigScore,
    twoStars: Math.floor(perfectScore * 0.6),
    threeStars: Math.floor(perfectScore * 0.86),
  };
}

function createGridLevel(level: GridLevelBlueprint): GridLevelData {
  const { minBirdsToClear: _minBirdsToClear, ...gridLevel } = level;
  return {
    ...gridLevel,
    starThresholds: estimateStarThresholds(level),
  };
}

/*
 * GRID COORDINATE SYSTEM:
 * - Block at (col, row) with size (gridW x gridH) spans from col to col+gridW and row to row+gridH
 * - Block anchor is CENTER: x = STRUCTURE_START_X + (col + gridW/2) * 70
 * - greeneling anchor is BOTTOM-CENTER: y = GROUND_Y - row * 70 - pigSize * 35
 * - greeneling at row 0 sits ON GROUND
 *
 * Example: Lean-to with greeneling in middle gap
 * - Left wall: col:0, gridW:1 (spans cols 0-1)
 * - Right wall: col:2, gridW:1 (spans cols 2-3)
 * - Roof: col:0, gridW:3, gridH:1 (spans cols 0-3)
 * - greeneling at col:1, row:0 (centered in gap between walls)
 */

const GRID_LEVELS: GridLevelData[] = [
  // ============================================================
  // CHAPTER 1: TUTORIAL PROGRESSION (Levels 1-5)
  // Each level introduces ONE core mechanic
  // ============================================================

  // Level 1 — First Blood
  // Tutorial: Basic slingshot aiming - impossible to fail
  // Genius Moment: First shot = instant greeneling destruction
  createGridLevel({
    levelId: 1,
    name: "First Blood",
    description: "A single greeneling in a glass house. Easy pickings!",
    theme: "forest",
    teachingFocus: "Aim and release! Glass shatters easily.",
    birds: [{ type: BirdType.RED }],
    blocks: [
      // Simple glass box - left wall
      { col: 3, row: 0, gridW: 1, gridH: 2, material: BlockMaterial.GLASS, shape: "rectangle" },
      // Right wall
      { col: 5, row: 0, gridW: 1, gridH: 2, material: BlockMaterial.GLASS, shape: "rectangle" },
      // Roof
      { col: 3, row: 2, gridW: 3, gridH: 1, material: BlockMaterial.GLASS, shape: "rectangle" },
      // Triangle roof peak
      {
        col: 4,
        row: 3,
        gridW: 1,
        gridH: 1,
        material: BlockMaterial.GLASS,
        shape: "triangle",
        rotation: 0,
      },
    ],
    pigs: [
      // One greeneling centered in the box
      { col: 4, row: 0, size: PigSize.SMALL },
    ],
    slingshot: SLINGSHOT,
    minBirdsToClear: 1,
  }),

  // Level 2 — Cold Snap
  // Teaches: Blue alien splits into 3, shatters glass (4x damage)
  // Genius Moment: Perfect split hits all walls simultaneously
  createGridLevel({
    levelId: 2,
    name: "Glass Snap",
    description: "Glass blocks hide hidden greenelings. Blue alien reveals the secret!",
    theme: "forest",
    teachingFocus: "Tap to split Blue alien into three! Glass shatters instantly.",
    birds: [{ type: BirdType.BLUE }, { type: BirdType.RED }],
    blocks: [
      // Glass formation - left glass pillar
      { col: 2, row: 0, gridW: 1, gridH: 4, material: BlockMaterial.GLASS, shape: "rectangle" },
      // Right glass pillar
      { col: 4, row: 0, gridW: 1, gridH: 4, material: BlockMaterial.GLASS, shape: "rectangle" },
      // Bridge between glass pillars (extends to support upper pillars)
      { col: 2, row: 4, gridW: 3, gridH: 1, material: BlockMaterial.GLASS, shape: "rectangle" },
      // Upper glass  cage - left pillar (on the bridge)
      { col: 2, row: 5, gridW: 1, gridH: 2, material: BlockMaterial.GLASS, shape: "rectangle" },
      // Upper glass  cage - right pillar (on the bridge)
      { col: 4, row: 5, gridW: 1, gridH: 2, material: BlockMaterial.GLASS, shape: "rectangle" },
      // Top cap
      { col: 2, row: 7, gridW: 3, gridH: 1, material: BlockMaterial.GLASS, shape: "rectangle" },
      // Triangle roof peak
      {
        col: 3,
        row: 8,
        gridW: 1,
        gridH: 1,
        material: BlockMaterial.GLASS,
        shape: "triangle",
        rotation: 0,
      },
      // Circle decorations on top cap corners (top cap ends at row 8)
      { col: 2, row: 8, gridW: 1, gridH: 1, material: BlockMaterial.GLASS, shape: "circle" },
      { col: 4, row: 8, gridW: 1, gridH: 1, material: BlockMaterial.GLASS, shape: "circle" },
    ],
    pigs: [
      // Ground greeneling in center gap
      { col: 3, row: 0, size: PigSize.SMALL },
      // Upper greeneling in glass cage (on top of bridge at row 5)
      { col: 3, row: 5, size: PigSize.SMALL },
    ],
    slingshot: SLINGSHOT,
    minBirdsToClear: 1,
  }),

  // Level 3 — Timber!
  // Teaches: Yellow alien speed boost (2.8x) and wood bonus (2.5x damage)
  // Genius Moment: Speed-boosted YELLOW pierces through all wood layers
  createGridLevel({
    levelId: 3,
    name: "Timber!",
    description: "Wood structures need speed. Yellow alien accelerates!",
    theme: "forest",
    teachingFocus: "Tap Yellow alien for a speed boost! It pierces wood easily.",
    birds: [{ type: BirdType.YELLOW }, { type: BirdType.RED }, { type: BirdType.RED }],
    blocks: [
      // Desert log cabin - left wall (only 2 rows tall to not overlap with porch roof)
      { col: 1, row: 0, gridW: 1, gridH: 2, material: BlockMaterial.WOOD, shape: "rectangle" },
      // Right wall (only 2 rows tall)
      { col: 5, row: 0, gridW: 1, gridH: 2, material: BlockMaterial.WOOD, shape: "rectangle" },
      // Porch roof (supports the cabin walls)
      { col: 0, row: 2, gridW: 7, gridH: 1, material: BlockMaterial.WOOD, shape: "rectangle" },
      // Cabin roof on top of porch roof
      { col: 1, row: 3, gridW: 5, gridH: 1, material: BlockMaterial.WOOD, shape: "rectangle" },
      // Front porch left pillar
      { col: 0, row: 0, gridW: 1, gridH: 2, material: BlockMaterial.WOOD, shape: "rectangle" },
      // Front porch right pillar
      { col: 6, row: 0, gridW: 1, gridH: 2, material: BlockMaterial.WOOD, shape: "rectangle" },
      // Triangle roof accents
      {
        col: 0,
        row: 3,
        gridW: 1,
        gridH: 1,
        material: BlockMaterial.WOOD,
        shape: "triangle",
        rotation: 0,
      },
      {
        col: 6,
        row: 3,
        gridW: 1,
        gridH: 1,
        material: BlockMaterial.WOOD,
        shape: "triangle",
        rotation: 0,
      },
      // Decorative circle on cabin roof corner (cabin roof ends at row 4)
      { col: 1, row: 4, gridW: 1, gridH: 1, material: BlockMaterial.STONE, shape: "circle" },
    ],
    pigs: [
      // Inside cabin left
      { col: 2, row: 0, size: PigSize.SMALL },
      // Inside cabin right
      { col: 4, row: 0, size: PigSize.SMALL },
      // On cabin roof (porch roof ends at row 3)
      { col: 3, row: 4, size: PigSize.SMALL },
    ],
    slingshot: SLINGSHOT,
    minBirdsToClear: 1,
  }),

  // Level 4 — Frozen Fortress
  // Teaches: BLACK alien explodes and excels vs stone (2x damage)
  // Genius Moment: Explosion in fortress center reaches distant glass tower
  createGridLevel({
    levelId: 4,
    name: "Forest Fortress",
    description: "A forest fortress guards the greenelings. Stone requires brute force!",
    theme: "forest",
    teachingFocus: "Black alien explodes! It crushes stone with ease.",
    birds: [{ type: BirdType.BLACK }, { type: BirdType.BLUE }, { type: BirdType.RED }],
    blocks: [
      // Stone fortress - left tower
      { col: 0, row: 0, gridW: 1, gridH: 3, material: BlockMaterial.STONE, shape: "rectangle" },
      // Stone fortress - right tower (same height as left)
      { col: 2, row: 0, gridW: 1, gridH: 3, material: BlockMaterial.STONE, shape: "rectangle" },
      // Stone fortress top (between towers, at row 3)
      { col: 0, row: 3, gridW: 3, gridH: 1, material: BlockMaterial.STONE, shape: "rectangle" },
      // Wood bridge extending from fortress top to glass tower
      { col: 3, row: 3, gridW: 3, gridH: 1, material: BlockMaterial.WOOD, shape: "rectangle" },
      // Glass tower (grounded, reaches up to bridge level)
      { col: 3, row: 0, gridW: 1, gridH: 3, material: BlockMaterial.GLASS, shape: "rectangle" },
      // Glass tower (grounded, reaches up to bridge level)
      { col: 5, row: 0, gridW: 1, gridH: 3, material: BlockMaterial.GLASS, shape: "rectangle" },
      // Glass tower cap (on top of bridge at row 4)
      { col: 5, row: 4, gridW: 1, gridH: 1, material: BlockMaterial.GLASS, shape: "square" },
      // Triangle roof on fortress
      {
        col: 1,
        row: 4,
        gridW: 1,
        gridH: 1,
        material: BlockMaterial.STONE,
        shape: "triangle",
        rotation: 0,
      },
      // Decorative circles
      { col: 0, row: 4, gridW: 1, gridH: 1, material: BlockMaterial.STONE, shape: "circle" },
      { col: 2, row: 4, gridW: 1, gridH: 1, material: BlockMaterial.STONE, shape: "circle" },
    ],
    pigs: [
      // Inside stone fortress
      { col: 1, row: 0, size: PigSize.SMALL },
      // Left of glass tower
      { col: 4, row: 0, size: PigSize.SMALL },
      // On glass tower cap (cap ends at row 5)
      { col: 5, row: 5, size: PigSize.SMALL },
    ],
    slingshot: SLINGSHOT,
    minBirdsToClear: 2,
  }),

  // Level 5 — King's Keep
  // Teaches: Multi-material structure requiring strategic alien selection
  // Genius Moment: Hit the glass crown - entire tower pancakes down
  createGridLevel({
    levelId: 5,
    name: "King's Keep",
    description: "The king greeneling hides at the top. Bring down the castle!",
    theme: "castle",
    teachingFocus: "Match birds to materials for maximum destruction!",
    birds: [
      { type: BirdType.RED },
      { type: BirdType.YELLOW },
      { type: BirdType.BLACK },
      { type: BirdType.BLUE },
    ],
    blocks: [
      // Castle base - stone foundation left
      { col: 0, row: 0, gridW: 1, gridH: 2, material: BlockMaterial.STONE, shape: "rectangle" },
      // Stone foundation right
      { col: 6, row: 0, gridW: 1, gridH: 2, material: BlockMaterial.STONE, shape: "rectangle" },
      // Stone floor
      { col: 0, row: 2, gridW: 7, gridH: 1, material: BlockMaterial.STONE, shape: "rectangle" },
      // Middle layer - wood walls left
      { col: 1, row: 3, gridW: 1, gridH: 3, material: BlockMaterial.WOOD, shape: "rectangle" },
      // Wood walls right
      { col: 5, row: 3, gridW: 1, gridH: 3, material: BlockMaterial.WOOD, shape: "rectangle" },
      // Wood floor
      { col: 1, row: 6, gridW: 5, gridH: 1, material: BlockMaterial.WOOD, shape: "rectangle" },
      // Tower - glass observation left
      { col: 2, row: 7, gridW: 1, gridH: 2, material: BlockMaterial.GLASS, shape: "rectangle" },
      // Glass observation right
      { col: 4, row: 7, gridW: 1, gridH: 2, material: BlockMaterial.GLASS, shape: "rectangle" },
      // Glass roof
      { col: 2, row: 9, gridW: 3, gridH: 1, material: BlockMaterial.GLASS, shape: "rectangle" },
      // Crown - THE PRESSURE POINT
      { col: 3, row: 10, gridW: 1, gridH: 1, material: BlockMaterial.GLASS, shape: "square" },
      // Triangle roof peaks
      {
        col: 1,
        row: 7,
        gridW: 1,
        gridH: 1,
        material: BlockMaterial.WOOD,
        shape: "triangle",
        rotation: 0,
      },
      {
        col: 5,
        row: 7,
        gridW: 1,
        gridH: 1,
        material: BlockMaterial.WOOD,
        shape: "triangle",
        rotation: 0,
      },
      // Decorative circles on stone foundation
      { col: 0, row: 2, gridW: 1, gridH: 1, material: BlockMaterial.STONE, shape: "circle" },
      { col: 6, row: 2, gridW: 1, gridH: 1, material: BlockMaterial.STONE, shape: "circle" },
      // Triangle crown accent
      {
        col: 3,
        row: 11,
        gridW: 1,
        gridH: 1,
        material: BlockMaterial.GLASS,
        shape: "triangle",
        rotation: 180,
      },
    ],
    pigs: [
      // Dungeon left
      { col: 2, row: 0, size: PigSize.SMALL },
      // Dungeon right
      { col: 4, row: 0, size: PigSize.SMALL },
      // Throne room (medium greeneling on stone floor at row 3)
      { col: 3, row: 3, size: PigSize.MEDIUM },
      // Guard tower (on wood floor at row 7)
      { col: 3, row: 8, size: PigSize.SMALL },
      // King's perch (on crown at row 11, triangle accent at row 11)
      { col: 3, row: 12, size: PigSize.SMALL },
    ],
    slingshot: SLINGSHOT,
    minBirdsToClear: 2,
  }),

  // ============================================================
  // CHAPTER 2: DESERT — Chain Reactions & Rolling Hazards (Levels 6-10)
  // Dynamic physics puzzles with cascading destruction
  // ============================================================

  // Level 6 — Rolling Thunder (REDESIGNED)
  // Hook: Stone boulders perched on tiered platforms ready to cascade down
  // Archetype: Boulder Cascade (★★★★☆)
  // Genius Moment: Hit top platform → boulder rolls → triggers chain through all tiers
  createGridLevel({
    levelId: 6,
    name: "Rolling Thunder",
    description:
      "Stone boulders wait atop tiered platforms! Hit them right to start a devastating cascade.",
    theme: "desert",
    teachingFocus: "Hit platforms to release boulders! Watch them crush everything below.",
    birds: [{ type: BirdType.RED }, { type: BirdType.YELLOW }, { type: BirdType.RED }],
    blocks: [
      // === UPPER TIER (row 5-6) - Boulder platform ===
      // Stone pillar ends at row 5 to support platform
      { col: 0, row: 0, gridW: 1, gridH: 5, material: BlockMaterial.STONE, shape: "rectangle" },
      // Right support for upper platform
      { col: 2, row: 0, gridW: 1, gridH: 5, material: BlockMaterial.STONE, shape: "rectangle" },
      // Platform sits on supports ending at row 5
      { col: 1, row: 5, gridW: 2, gridH: 1, material: BlockMaterial.WOOD, shape: "rectangle" },
      // Boulder on platform (platform ends at row 6)
      { col: 1.5, row: 6, gridW: 1, gridH: 1, material: BlockMaterial.STONE, shape: "circle" },
      // === MIDDLE TIER (row 3-4) - Second boulder platform ===
      { col: 4, row: 0, gridW: 1, gridH: 3, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 6, row: 0, gridW: 1, gridH: 3, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 5, row: 3, gridW: 2, gridH: 1, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 5.5, row: 4, gridW: 1, gridH: 1, material: BlockMaterial.STONE, shape: "circle" },
      // === LOWER TIER (row 1-2) - Third boulder platform ===
      { col: 8, row: 0, gridW: 1, gridH: 1, material: BlockMaterial.STONE, shape: "square" },
      { col: 10, row: 0, gridW: 1, gridH: 1, material: BlockMaterial.STONE, shape: "square" },
      { col: 9, row: 1, gridW: 2, gridH: 1, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 9.5, row: 2, gridW: 1, gridH: 1, material: BlockMaterial.STONE, shape: "circle" },
      // === TRIANGLE DEFLECTOR SUPPORTS ===
      { col: 3, row: 0, gridW: 1, gridH: 5, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 7, row: 0, gridW: 1, gridH: 3, material: BlockMaterial.WOOD, shape: "rectangle" },
      // === TRIANGLE DEFLECTORS ===
      {
        col: 3,
        row: 5,
        gridW: 1,
        gridH: 1,
        material: BlockMaterial.STONE,
        shape: "triangle",
        rotation: 270,
      },
      {
        col: 7,
        row: 3,
        gridW: 1,
        gridH: 1,
        material: BlockMaterial.STONE,
        shape: "triangle",
        rotation: 270,
      },
      // === FORTRESS AT RIGHT (with 3x2 base) ===
      { col: 12, row: 0, gridW: 3, gridH: 2, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 12, row: 2, gridW: 1, gridH: 2, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 14, row: 2, gridW: 1, gridH: 2, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 12, row: 4, gridW: 3, gridH: 1, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 12, row: 5, gridW: 1, gridH: 1, material: BlockMaterial.GLASS, shape: "square" },
      { col: 14, row: 5, gridW: 1, gridH: 1, material: BlockMaterial.GLASS, shape: "square" },
      { col: 13, row: 5, gridW: 1, gridH: 1, material: BlockMaterial.GLASS, shape: "square" },
    ],
    pigs: [
      { col: 13, row: 2, size: PigSize.SMALL },
      { col: 13, row: 6, size: PigSize.SMALL },
    ],
    slingshot: SLINGSHOT,
    minBirdsToClear: 1,
  }),

  // Level 7 — TNT Chain (REDESIGNED)
  // Hook: Three towers connected by TNT bridges - one explosion triggers chain reaction
  // Archetype: TNT Chain (★★★★☆)
  // Genius Moment: Hit ANY TNT → entire chain detonates → all three towers collapse
  createGridLevel({
    levelId: 7,
    name: "TNT Chain",
    description:
      "Three towers connected by explosive bridges! One well-placed shot triggers total destruction.",
    theme: "desert",
    teachingFocus: "TNT chains devastate everything! Find the weak link in the chain.",
    birds: [{ type: BirdType.YELLOW }, { type: BirdType.BLACK }, { type: BirdType.RED }],
    blocks: [
      // === LEFT TOWER (Stone base with 2x3 platform) ===
      { col: -2, row: 0, gridW: 2, gridH: 3, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 0, row: 0, gridW: 1, gridH: 3, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: -2, row: 3, gridW: 1, gridH: 2, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 0, row: 3, gridW: 1, gridH: 2, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: -2, row: 5, gridW: 3, gridH: 1, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: -1, row: 6, gridW: 1, gridH: 1, material: BlockMaterial.STONE, shape: "circle" },
      {
        col: -2,
        row: 7,
        gridW: 3,
        gridH: 1,
        material: BlockMaterial.WOOD,
        shape: "triangle",
        rotation: 0,
      },
      // === TNT BRIDGE #1 (Left to Center) - Support + TNT on top ===
      { col: 1, row: 0, gridW: 1, gridH: 3, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 1, row: 3, gridW: 1, gridH: 1, material: BlockMaterial.WOOD, shape: "square" },
      { col: 2, row: 0, gridW: 1, gridH: 3, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 2, row: 3, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      // === CENTER TOWER (Wood with TNT Core) ===
      { col: 3, row: 0, gridW: 1, gridH: 3, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 5, row: 0, gridW: 1, gridH: 3, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 4, row: 0, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      { col: 3, row: 3, gridW: 3, gridH: 1, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 3.5, row: 4, gridW: 1, gridH: 1, material: BlockMaterial.STONE, shape: "circle" },
      { col: 4.5, row: 4, gridW: 1, gridH: 1, material: BlockMaterial.STONE, shape: "circle" },
      {
        col: 3,
        row: 5,
        gridW: 3,
        gridH: 1,
        material: BlockMaterial.WOOD,
        shape: "triangle",
        rotation: 0,
      },
      // === TNT BRIDGE #2 (Center to Right) - Support + TNT on top ===
      { col: 6, row: 0, gridW: 1, gridH: 3, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 6, row: 3, gridW: 1, gridH: 1, material: BlockMaterial.WOOD, shape: "square" },
      { col: 7, row: 0, gridW: 1, gridH: 3, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 7, row: 3, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      // === RIGHT TOWER (Stone/Wood with 2x3 base) ===
      { col: 8, row: 0, gridW: 2, gridH: 3, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 10, row: 0, gridW: 1, gridH: 3, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 8, row: 3, gridW: 1, gridH: 2, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 10, row: 3, gridW: 1, gridH: 2, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 8, row: 5, gridW: 3, gridH: 1, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 9, row: 6, gridW: 1, gridH: 1, material: BlockMaterial.STONE, shape: "circle" },
      {
        col: 8,
        row: 7,
        gridW: 3,
        gridH: 1,
        material: BlockMaterial.WOOD,
        shape: "triangle",
        rotation: 0,
      },
    ],
    pigs: [
      { col: -1, row: 3, size: PigSize.SMALL },
      { col: 0, row: 6, size: PigSize.SMALL },
      { col: 2, row: 4, size: PigSize.SMALL },
      { col: 9, row: 3, size: PigSize.SMALL },
      { col: 10, row: 6, size: PigSize.SMALL },
    ],
    slingshot: SLINGSHOT,
    minBirdsToClear: 1,
  }),

  // Level 8 — Temple of Boom (REDESIGNED)
  // Hook: Glass pyramid with TNT chamber inside - decorative circles and triangles
  // Archetype: Glass House with TNT Core (★★★★☆)
  // Genius Moment: Blue alien shatters glass → triggers TNT chamber → explosion destroys everything
  createGridLevel({
    levelId: 8,
    name: "Temple of Boom",
    description: "A glass pyramid hides explosive secrets! Blue birds reveal the truth.",
    theme: "desert",
    teachingFocus: "Glass facades hide TNT cores! Blue birds shatter glass for maximum damage.",
    birds: [
      { type: BirdType.BLUE },
      { type: BirdType.RED },
      { type: BirdType.BLACK },
      { type: BirdType.RED },
    ],
    blocks: [
      // === GLASS PYRAMID BASE (left and right walls) ===
      { col: 0, row: 0, gridW: 1, gridH: 5, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 6, row: 0, gridW: 1, gridH: 5, material: BlockMaterial.GLASS, shape: "rectangle" },
      // Wood floor inside pyramid
      { col: 1, row: 0, gridW: 5, gridH: 1, material: BlockMaterial.WOOD, shape: "rectangle" },
      // Glass roof layers (stepped pyramid)
      { col: 0, row: 5, gridW: 7, gridH: 1, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 1, row: 6, gridW: 5, gridH: 1, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 2, row: 7, gridW: 3, gridH: 1, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 3, row: 8, gridW: 1, gridH: 1, material: BlockMaterial.GLASS, shape: "square" },
      // === TNT CHAMBER (center of pyramid, elevated on wood) ===
      { col: 2, row: 1, gridW: 1, gridH: 1, material: BlockMaterial.WOOD, shape: "square" },
      { col: 4, row: 1, gridW: 1, gridH: 1, material: BlockMaterial.WOOD, shape: "square" },
      { col: 2, row: 2, gridW: 3, gridH: 1, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 2, row: 3, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      { col: 3, row: 3, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      { col: 4, row: 3, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      // === DECORATIVE ELEMENTS (on top of roof layers, not inside) ===
      { col: 0, row: 6, gridW: 1, gridH: 1, material: BlockMaterial.STONE, shape: "circle" },
      { col: 6, row: 6, gridW: 1, gridH: 1, material: BlockMaterial.STONE, shape: "circle" },
      {
        col: 3,
        row: 9,
        gridW: 1,
        gridH: 1,
        material: BlockMaterial.GLASS,
        shape: "triangle",
        rotation: 0,
      },
      // === OUTPOST (right side with TNT) ===
      { col: 8, row: 0, gridW: 1, gridH: 2, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 10, row: 0, gridW: 1, gridH: 2, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 8, row: 2, gridW: 3, gridH: 1, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 9, row: 0, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      { col: 9, row: 3, gridW: 1, gridH: 1, material: BlockMaterial.STONE, shape: "circle" },
    ],
    pigs: [
      { col: 2, row: 4, size: PigSize.SMALL },
      { col: 4, row: 4, size: PigSize.SMALL },
      { col: 0, row: 7, size: PigSize.MEDIUM },
      { col: 9, row: 4, size: PigSize.SMALL },
      { col: 5, row: 7, size: PigSize.SMALL },
    ],
    slingshot: SLINGSHOT,
    minBirdsToClear: 2,
  }),

  // Level 9 — Catacomb Collapse (REDESIGNED)
  // Hook: Three connected chambers with strategic wood supports and TNT
  // Archetype: Enclosed Structure with Collapse (★★★★☆)
  // Genius Moment: Yellow alien pierces wood supports → ceiling collapses → chain through all chambers
  createGridLevel({
    levelId: 9,
    name: "Catacomb Collapse",
    description:
      "Ancient catacombs with weak supports! Collapse the ceiling to bury the greenelings.",
    theme: "desert",
    teachingFocus: "Wood supports hold up stone! Yellow birds pierce through for chain collapse.",
    birds: [
      { type: BirdType.RED },
      { type: BirdType.YELLOW },
      { type: BirdType.BLACK },
      { type: BirdType.BLUE },
    ],
    blocks: [
      // === LEFT CHAMBER ===
      { col: -1, row: 0, gridW: 1, gridH: 4, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 1, row: 0, gridW: 1, gridH: 4, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: -1, row: 4, gridW: 3, gridH: 1, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 0, row: 0, gridW: 1, gridH: 2, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 0, row: 2, gridW: 1, gridH: 2, material: BlockMaterial.WOOD, shape: "rectangle" },
      // === CENTER CHAMBER (with TNT) ===
      { col: 2, row: 0, gridW: 1, gridH: 4, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 5, row: 0, gridW: 1, gridH: 4, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 2, row: 4, gridW: 4, gridH: 1, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 3, row: 0, gridW: 1, gridH: 1, material: BlockMaterial.WOOD, shape: "square" },
      { col: 4, row: 0, gridW: 1, gridH: 1, material: BlockMaterial.WOOD, shape: "square" },
      { col: 3, row: 1, gridW: 1, gridH: 2, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 4, row: 1, gridW: 1, gridH: 2, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 3, row: 3, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      { col: 4, row: 3, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      // === RIGHT CHAMBER ===
      { col: 6, row: 0, gridW: 1, gridH: 4, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 8, row: 0, gridW: 1, gridH: 4, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 6, row: 4, gridW: 3, gridH: 1, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 7, row: 0, gridW: 1, gridH: 2, material: BlockMaterial.WOOD, shape: "rectangle" },
      // === UPPER SHRINE (on collapsed ceiling) ===
      { col: 2, row: 5, gridW: 1, gridH: 3, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 5, row: 5, gridW: 1, gridH: 3, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 2, row: 8, gridW: 4, gridH: 1, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 3, row: 9, gridW: 1, gridH: 2, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 4, row: 9, gridW: 1, gridH: 2, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 3, row: 11, gridW: 2, gridH: 1, material: BlockMaterial.GLASS, shape: "rectangle" },
      // === DECORATIVE CIRCLES (on top of ceiling, not inside) ===
      { col: -0.5, row: 5, gridW: 1, gridH: 1, material: BlockMaterial.STONE, shape: "circle" },
      { col: 7.5, row: 5, gridW: 1, gridH: 1, material: BlockMaterial.STONE, shape: "circle" },
      // === TRIANGLE ROOF ===
      {
        col: 2,
        row: 12,
        gridW: 4,
        gridH: 1,
        material: BlockMaterial.GLASS,
        shape: "triangle",
        rotation: 0,
      },
    ],
    pigs: [
      { col: 1, row: 5, size: PigSize.SMALL },
      { col: -0.5, row: 6, size: PigSize.SMALL },
      { col: 3.5, row: 5, size: PigSize.SMALL },
      { col: 7, row: 2, size: PigSize.SMALL },
      { col: 6.5, row: 5, size: PigSize.SMALL },
      { col: 8, row: 6, size: PigSize.SMALL },
    ],
    slingshot: SLINGSHOT,
    minBirdsToClear: 1,
  }),

  // Level 10 — Desert Citadel (REDESIGNED)
  // Hook: Three sections connected by wood bridges - each requires different alien
  // Archetype: Multi-Tower Fortress (★★★★☆)
  // Genius Moment: Destroy bridge supports → citadel sections collapse into each other
  createGridLevel({
    levelId: 10,
    name: "Desert Citadel",
    description:
      "A grand citadel of glass, stone, and metal! Each tower requires a different strategy.",
    theme: "desert",
    teachingFocus: "Match birds to materials! Bridges connect the sections for chain destruction.",
    birds: [
      { type: BirdType.BLUE },
      { type: BirdType.YELLOW },
      { type: BirdType.BLACK },
      { type: BirdType.BLACK },
      { type: BirdType.RED },
    ],
    blocks: [
      // === LEFT WING: Glass Tower (open design) ===
      { col: -4, row: 0, gridW: 1, gridH: 4, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: -2, row: 0, gridW: 1, gridH: 4, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: -4, row: 4, gridW: 3, gridH: 1, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: -4, row: 5, gridW: 1, gridH: 3, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: -2, row: 5, gridW: 1, gridH: 3, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: -4, row: 8, gridW: 3, gridH: 1, material: BlockMaterial.GLASS, shape: "rectangle" },
      // === BRIDGE #1: Left to Center ===
      { col: -1, row: 0, gridW: 1, gridH: 2, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: -1, row: 2, gridW: 2, gridH: 1, material: BlockMaterial.WOOD, shape: "rectangle" },
      // === CENTRAL KEEP: Stone with TNT (3x2 base) ===
      { col: 1, row: 0, gridW: 3, gridH: 2, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 1, row: 2, gridW: 1, gridH: 2, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 3, row: 2, gridW: 1, gridH: 2, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 1, row: 4, gridW: 3, gridH: 1, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 1, row: 5, gridW: 1, gridH: 3, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 3, row: 5, gridW: 1, gridH: 3, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 1, row: 8, gridW: 3, gridH: 1, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 2, row: 2, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      { col: 2, row: 9, gridW: 1, gridH: 1, material: BlockMaterial.STONE, shape: "circle" },
      // === BRIDGE #2: Center to Right ===
      { col: 5, row: 0, gridW: 1, gridH: 3, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 5, row: 3, gridW: 2, gridH: 1, material: BlockMaterial.WOOD, shape: "rectangle" },
      // === RIGHT WING: Metal Bunker (2x3 base, open design) ===
      { col: 7, row: 0, gridW: 2, gridH: 3, material: BlockMaterial.METAL, shape: "rectangle" },
      { col: 7, row: 3, gridW: 1, gridH: 3, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 8, row: 3, gridW: 1, gridH: 3, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 7, row: 6, gridW: 2, gridH: 1, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 7, row: 7, gridW: 1, gridH: 2, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 8, row: 7, gridW: 1, gridH: 2, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 7, row: 9, gridW: 2, gridH: 1, material: BlockMaterial.WOOD, shape: "rectangle" },
    ],
    pigs: [
      { col: -3, row: 0, size: PigSize.SMALL },
      { col: -3, row: 5, size: PigSize.SMALL },
      { col: 2, row: 5, size: PigSize.SMALL },
      { col: 2, row: 10, size: PigSize.SMALL },
      { col: 7.5, row: 10, size: PigSize.SMALL },
      { col: 8.5, row: 10, size: PigSize.SMALL },
    ],
    slingshot: SLINGSHOT,
    minBirdsToClear: 3,
  }),

  // ============================================================
  // CHAPTER 3: CASTLE — Metal & Stone (Levels 11-15)
  // Heavy fortifications requiring strategic demolition
  // ============================================================

  // Level 11 — Iron Gate Fortress
  createGridLevel({
    levelId: 11,
    name: "Iron Gate",
    description: "Metal-reinforced castle entrance!",
    theme: "castle",
    birds: [
      { type: BirdType.BLACK },
      { type: BirdType.BLACK },
      { type: BirdType.RED },
      { type: BirdType.BLACK },
    ],
    blocks: [
      { col: 0, row: 0, gridW: 1, gridH: 5, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 6, row: 0, gridW: 1, gridH: 5, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 0, row: 5, gridW: 7, gridH: 1, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 2, row: 0, gridW: 1, gridH: 3, material: BlockMaterial.METAL, shape: "rectangle" },
      { col: 4, row: 0, gridW: 1, gridH: 3, material: BlockMaterial.METAL, shape: "rectangle" },
      { col: 2, row: 3, gridW: 3, gridH: 1, material: BlockMaterial.METAL, shape: "rectangle" },
      { col: 3, row: 4, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      { col: 1, row: 6, gridW: 1, gridH: 3, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 5, row: 6, gridW: 1, gridH: 3, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 1, row: 9, gridW: 5, gridH: 1, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 3, row: 10, gridW: 1, gridH: 2, material: BlockMaterial.GLASS, shape: "rectangle" },
      // Triangle roof accents
      {
        col: 0,
        row: 6,
        gridW: 1,
        gridH: 1,
        material: BlockMaterial.STONE,
        shape: "triangle",
        rotation: 0,
      },
      {
        col: 6,
        row: 6,
        gridW: 1,
        gridH: 1,
        material: BlockMaterial.STONE,
        shape: "triangle",
        rotation: 0,
      },
      // Decorative circles on wood platform top (moved to avoid greeneling overlap)
      { col: 2, row: 10, gridW: 1, gridH: 1, material: BlockMaterial.STONE, shape: "circle" },
      { col: 4, row: 10, gridW: 1, gridH: 1, material: BlockMaterial.STONE, shape: "circle" },
    ],
    pigs: [
      { col: 1, row: 0, size: PigSize.SMALL },
      { col: 3, row: 6, size: PigSize.MEDIUM },
      { col: 5, row: 0, size: PigSize.SMALL },
      { col: 2, row: 6, size: PigSize.SMALL },
      { col: 3, row: 12, size: PigSize.SMALL },
    ],
    slingshot: SLINGSHOT,
    teachingFocus: "The metal gate hides explosive secrets!",
    minBirdsToClear: 2,
  }),

  // Level 12 — Triple Tower Keep
  createGridLevel({
    levelId: 12,
    name: "Triple Keep",
    description: "Three interconnected towers!",
    theme: "castle",
    birds: [
      { type: BirdType.YELLOW },
      { type: BirdType.BLUE },
      { type: BirdType.BLACK },
      { type: BirdType.WHITE },
    ],
    blocks: [
      { col: 0, row: 0, gridW: 1, gridH: 4, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 2, row: 0, gridW: 1, gridH: 4, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 0, row: 4, gridW: 3, gridH: 1, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 0, row: 5, gridW: 1, gridH: 3, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 2, row: 5, gridW: 1, gridH: 3, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 0, row: 8, gridW: 3, gridH: 1, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 5, row: 0, gridW: 1, gridH: 6, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 7, row: 0, gridW: 1, gridH: 6, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 5, row: 6, gridW: 3, gridH: 1, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 5, row: 7, gridW: 1, gridH: 2, material: BlockMaterial.METAL, shape: "rectangle" },
      { col: 7, row: 7, gridW: 1, gridH: 2, material: BlockMaterial.METAL, shape: "rectangle" },
      { col: 5, row: 9, gridW: 3, gridH: 1, material: BlockMaterial.METAL, shape: "rectangle" },
      { col: 6, row: 10, gridW: 1, gridH: 2, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 10, row: 0, gridW: 1, gridH: 4, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 12, row: 0, gridW: 1, gridH: 4, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 10, row: 4, gridW: 3, gridH: 1, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 10, row: 5, gridW: 1, gridH: 3, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 12, row: 5, gridW: 1, gridH: 3, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 10, row: 8, gridW: 3, gridH: 1, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 6, row: 0, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      { col: 3, row: 0, gridW: 1, gridH: 1, material: BlockMaterial.GLASS, shape: "square" },
      { col: 4, row: 0, gridW: 1, gridH: 1, material: BlockMaterial.GLASS, shape: "square" },
      // Triangle roof accents on each tower
      {
        col: 0,
        row: 9,
        gridW: 3,
        gridH: 1,
        material: BlockMaterial.WOOD,
        shape: "triangle",
        rotation: 0,
      },
      {
        col: 5,
        row: 12,
        gridW: 3,
        gridH: 1,
        material: BlockMaterial.METAL,
        shape: "triangle",
        rotation: 0,
      },
      {
        col: 10,
        row: 9,
        gridW: 3,
        gridH: 1,
        material: BlockMaterial.WOOD,
        shape: "triangle",
        rotation: 0,
      },
    ],
    pigs: [
      { col: 1, row: 0, size: PigSize.SMALL },
      { col: 1, row: 5, size: PigSize.SMALL },
      { col: 6, row: 7, size: PigSize.SMALL },
      { col: 7, row: 10, size: PigSize.SMALL },
      { col: 11, row: 0, size: PigSize.SMALL },
      { col: 11, row: 5, size: PigSize.SMALL },
      { col: 5, row: 10, size: PigSize.SMALL },
    ],
    slingshot: SLINGSHOT,
    teachingFocus: "Connect the towers through the bridges!",
    minBirdsToClear: 3,
  }),

  // Level 13 — Castle Dungeon
  createGridLevel({
    levelId: 13,
    name: "Dungeon Depths",
    description: "Multi-level dungeon with trapped greenelings!",
    theme: "castle",
    birds: [
      { type: BirdType.RED },
      { type: BirdType.BLUE },
      { type: BirdType.BLACK },
      { type: BirdType.WHITE },
      { type: BirdType.RED },
    ],
    blocks: [
      { col: 0, row: 0, gridW: 1, gridH: 2, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 8, row: 0, gridW: 1, gridH: 2, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 0, row: 2, gridW: 9, gridH: 1, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 1, row: 3, gridW: 1, gridH: 2, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 3, row: 3, gridW: 1, gridH: 2, material: BlockMaterial.METAL, shape: "rectangle" },
      { col: 5, row: 3, gridW: 1, gridH: 2, material: BlockMaterial.METAL, shape: "rectangle" },
      { col: 7, row: 3, gridW: 1, gridH: 2, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 1, row: 5, gridW: 7, gridH: 1, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 2, row: 6, gridW: 1, gridH: 2, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 4, row: 6, gridW: 1, gridH: 2, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 6, row: 6, gridW: 1, gridH: 2, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 2, row: 8, gridW: 5, gridH: 1, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 3, row: 9, gridW: 1, gridH: 2, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 5, row: 9, gridW: 1, gridH: 2, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 3, row: 11, gridW: 3, gridH: 1, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 4, row: 12, gridW: 1, gridH: 2, material: BlockMaterial.METAL, shape: "rectangle" },
      { col: 4, row: 0, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      { col: 4, row: 9, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      // Triangle roof accents (on platform at row 2)
      {
        col: 0,
        row: 3,
        gridW: 1,
        gridH: 1,
        material: BlockMaterial.STONE,
        shape: "triangle",
        rotation: 0,
      },
      {
        col: 8,
        row: 3,
        gridW: 1,
        gridH: 1,
        material: BlockMaterial.STONE,
        shape: "triangle",
        rotation: 0,
      },
      // Decorative circles on platform (moved to avoid wood column overlap)
      { col: 2, row: 3, gridW: 1, gridH: 1, material: BlockMaterial.STONE, shape: "circle" },
      { col: 6, row: 3, gridW: 1, gridH: 1, material: BlockMaterial.STONE, shape: "circle" },
    ],
    pigs: [
      { col: 2, row: 0, size: PigSize.SMALL },
      { col: 1, row: 6, size: PigSize.SMALL },
      { col: 6, row: 0, size: PigSize.SMALL },
      { col: 5, row: 6, size: PigSize.SMALL },
      { col: 6, row: 9, size: PigSize.SMALL },
      { col: 4, row: 14, size: PigSize.LARGE },
    ],
    slingshot: SLINGSHOT,
    teachingFocus: "Descend through the dungeon layers!",
    minBirdsToClear: 3,
  }),

  // Level 14 — Armored Bastion
  createGridLevel({
    levelId: 14,
    name: "Armored Bastion",
    description: "Metal-plated fortress with explosive core!",
    theme: "castle",
    birds: [
      { type: BirdType.BLACK },
      { type: BirdType.BLACK },
      { type: BirdType.YELLOW },
      { type: BirdType.BLACK },
      { type: BirdType.WHITE },
    ],
    blocks: [
      { col: 0, row: 0, gridW: 1, gridH: 4, material: BlockMaterial.METAL, shape: "rectangle" },
      { col: 8, row: 0, gridW: 1, gridH: 4, material: BlockMaterial.METAL, shape: "rectangle" },
      { col: 0, row: 4, gridW: 9, gridH: 1, material: BlockMaterial.METAL, shape: "rectangle" },
      { col: 1, row: 5, gridW: 1, gridH: 3, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 3, row: 5, gridW: 1, gridH: 3, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 5, row: 5, gridW: 1, gridH: 3, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 7, row: 5, gridW: 1, gridH: 3, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 1, row: 8, gridW: 7, gridH: 1, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 2, row: 9, gridW: 1, gridH: 3, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 4, row: 9, gridW: 1, gridH: 3, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 6, row: 9, gridW: 1, gridH: 3, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 2, row: 12, gridW: 5, gridH: 1, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 4, row: 13, gridW: 1, gridH: 2, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 2, row: 0, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      { col: 4, row: 0, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      { col: 6, row: 0, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      { col: 4, row: 5, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      // Triangle roof accents (on top of metal platform at row 4)
      {
        col: 0,
        row: 5,
        gridW: 1,
        gridH: 1,
        material: BlockMaterial.METAL,
        shape: "triangle",
        rotation: 0,
      },
      {
        col: 8,
        row: 5,
        gridW: 1,
        gridH: 1,
        material: BlockMaterial.METAL,
        shape: "triangle",
        rotation: 0,
      },
    ],
    pigs: [
      { col: 2, row: 1, size: PigSize.SMALL },
      { col: 4, row: 1, size: PigSize.MEDIUM },
      { col: 6, row: 1, size: PigSize.SMALL },
      { col: 2, row: 5, size: PigSize.SMALL },
      { col: 4, row: 6, size: PigSize.SMALL },
      { col: 6, row: 5, size: PigSize.SMALL },
      { col: 4, row: 15, size: PigSize.LARGE },
    ],
    slingshot: SLINGSHOT,
    teachingFocus: "Explosive chain reactions breach the armor!",
    minBirdsToClear: 3,
  }),

  // Level 15 — King's Throne Room
  createGridLevel({
    levelId: 15,
    name: "Throne Room",
    description: "The ultimate castle stronghold!",
    theme: "castle",
    birds: [
      { type: BirdType.RED },
      { type: BirdType.YELLOW },
      { type: BirdType.BLUE },
      { type: BirdType.BLACK },
      { type: BirdType.BLACK },
      { type: BirdType.WHITE },
    ],
    blocks: [
      { col: 0, row: 0, gridW: 1, gridH: 3, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 12, row: 0, gridW: 1, gridH: 3, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 0, row: 3, gridW: 13, gridH: 1, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 1, row: 4, gridW: 1, gridH: 4, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 3, row: 4, gridW: 1, gridH: 4, material: BlockMaterial.METAL, shape: "rectangle" },
      { col: 5, row: 4, gridW: 1, gridH: 4, material: BlockMaterial.METAL, shape: "rectangle" },
      { col: 7, row: 4, gridW: 1, gridH: 4, material: BlockMaterial.METAL, shape: "rectangle" },
      { col: 9, row: 4, gridW: 1, gridH: 4, material: BlockMaterial.METAL, shape: "rectangle" },
      { col: 11, row: 4, gridW: 1, gridH: 4, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 1, row: 8, gridW: 11, gridH: 1, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 2, row: 9, gridW: 1, gridH: 3, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 4, row: 9, gridW: 1, gridH: 3, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 6, row: 9, gridW: 1, gridH: 3, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 8, row: 9, gridW: 1, gridH: 3, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 10, row: 9, gridW: 1, gridH: 3, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 2, row: 12, gridW: 9, gridH: 1, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 4, row: 13, gridW: 1, gridH: 2, material: BlockMaterial.METAL, shape: "rectangle" },
      { col: 6, row: 13, gridW: 1, gridH: 2, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 8, row: 13, gridW: 1, gridH: 2, material: BlockMaterial.METAL, shape: "rectangle" },
      { col: 4, row: 15, gridW: 5, gridH: 1, material: BlockMaterial.METAL, shape: "rectangle" },
      { col: 6, row: 16, gridW: 1, gridH: 3, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 2, row: 0, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      { col: 6, row: 0, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      { col: 10, row: 0, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      { col: 6, row: 4, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      // Triangle roof accents
      {
        col: 0,
        row: 4,
        gridW: 1,
        gridH: 1,
        material: BlockMaterial.STONE,
        shape: "triangle",
        rotation: 0,
      },
      {
        col: 12,
        row: 4,
        gridW: 1,
        gridH: 1,
        material: BlockMaterial.STONE,
        shape: "triangle",
        rotation: 0,
      },
      // Decorative circles on platform (moved to avoid wood column overlap)
      { col: 2, row: 4, gridW: 1, gridH: 1, material: BlockMaterial.STONE, shape: "circle" },
      { col: 10, row: 4, gridW: 1, gridH: 1, material: BlockMaterial.STONE, shape: "circle" },
    ],
    pigs: [
      { col: 2, row: 1, size: PigSize.SMALL },
      { col: 6, row: 1, size: PigSize.SMALL },
      { col: 10, row: 1, size: PigSize.SMALL },
      { col: 4, row: 4, size: PigSize.SMALL },
      { col: 4, row: 16, size: PigSize.MEDIUM },
      { col: 8, row: 4, size: PigSize.SMALL },
      { col: 7, row: 16, size: PigSize.SMALL },
      { col: 6, row: 19, size: PigSize.LARGE },
    ],
    slingshot: SLINGSHOT,
    teachingFocus: "The King is protected by layers of defenses!",
    minBirdsToClear: 5,
  }),

  // ============================================================
  // CHAPTER 4: ICE — Extreme Complexity (Levels 16-20)
  // Massive structures with intricate destruction paths
  // ============================================================

  // Level 16 — Crystal Palace
  createGridLevel({
    levelId: 16,
    name: "Crystal Palace",
    description: "Massive glass palace with fragile supports!",
    theme: "ice",
    birds: [
      { type: BirdType.BLUE },
      { type: BirdType.BLUE },
      { type: BirdType.BLUE },
      { type: BirdType.RED },
    ],
    blocks: [
      { col: 0, row: 0, gridW: 1, gridH: 5, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 10, row: 0, gridW: 1, gridH: 5, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 0, row: 5, gridW: 11, gridH: 1, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 1, row: 6, gridW: 1, gridH: 4, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 3, row: 6, gridW: 1, gridH: 4, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 5, row: 6, gridW: 1, gridH: 4, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 7, row: 6, gridW: 1, gridH: 4, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 9, row: 6, gridW: 1, gridH: 4, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 1, row: 10, gridW: 9, gridH: 1, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 2, row: 11, gridW: 1, gridH: 3, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 4, row: 11, gridW: 1, gridH: 3, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 6, row: 11, gridW: 1, gridH: 3, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 8, row: 11, gridW: 1, gridH: 3, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 2, row: 14, gridW: 7, gridH: 1, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 5, row: 15, gridW: 1, gridH: 4, material: BlockMaterial.GLASS, shape: "rectangle" },
      // Triangle roof accents
      {
        col: 0,
        row: 6,
        gridW: 1,
        gridH: 1,
        material: BlockMaterial.GLASS,
        shape: "triangle",
        rotation: 0,
      },
      {
        col: 10,
        row: 6,
        gridW: 1,
        gridH: 1,
        material: BlockMaterial.GLASS,
        shape: "triangle",
        rotation: 0,
      },
      // Decorative circles (ice crystals, moved to avoid glass column overlap)
      { col: 1, row: 11, gridW: 1, gridH: 1, material: BlockMaterial.GLASS, shape: "circle" },
      { col: 9, row: 11, gridW: 1, gridH: 1, material: BlockMaterial.GLASS, shape: "circle" },
      { col: 5, row: 19, gridW: 1, gridH: 1, material: BlockMaterial.GLASS, shape: "circle" },
    ],
    pigs: [
      { col: 2, row: 0, size: PigSize.SMALL },
      { col: 4, row: 0, size: PigSize.SMALL },
      { col: 6, row: 0, size: PigSize.MEDIUM },
      { col: 8, row: 0, size: PigSize.SMALL },
      { col: 2, row: 6, size: PigSize.SMALL },
      { col: 4, row: 6, size: PigSize.SMALL },
      { col: 6, row: 6, size: PigSize.SMALL },
      { col: 8, row: 6, size: PigSize.SMALL },
      { col: 5, row: 20, size: PigSize.LARGE },
    ],
    slingshot: SLINGSHOT,
    teachingFocus: "Blue birds shatter glass in spectacular fashion!",
    minBirdsToClear: 3,
  }),

  // Level 17 — Frozen Waterfall
  createGridLevel({
    levelId: 17,
    name: "Frozen Falls",
    description: "Cascading platforms with hidden TNT!",
    theme: "ice",
    birds: [
      { type: BirdType.YELLOW },
      { type: BirdType.BLUE },
      { type: BirdType.BLACK },
      { type: BirdType.WHITE },
    ],
    blocks: [
      { col: 0, row: 0, gridW: 1, gridH: 4, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 3, row: 0, gridW: 1, gridH: 4, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 6, row: 0, gridW: 1, gridH: 4, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 9, row: 0, gridW: 1, gridH: 4, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 0, row: 4, gridW: 3, gridH: 1, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 3, row: 4, gridW: 3, gridH: 1, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 6, row: 4, gridW: 3, gridH: 1, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 9, row: 4, gridW: 3, gridH: 1, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 1, row: 5, gridW: 1, gridH: 2, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 4, row: 5, gridW: 1, gridH: 2, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 7, row: 5, gridW: 1, gridH: 2, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 10, row: 5, gridW: 1, gridH: 2, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 1, row: 7, gridW: 2, gridH: 1, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 4, row: 7, gridW: 2, gridH: 1, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 7, row: 7, gridW: 2, gridH: 1, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 10, row: 7, gridW: 2, gridH: 1, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 11, row: 8, gridW: 1, gridH: 2, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 2, row: 0, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      { col: 5, row: 0, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      { col: 8, row: 0, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      { col: 11, row: 0, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      // Triangle roof accents
      {
        col: 0,
        row: 5,
        gridW: 1,
        gridH: 1,
        material: BlockMaterial.WOOD,
        shape: "triangle",
        rotation: 0,
      },
      {
        col: 9,
        row: 5,
        gridW: 1,
        gridH: 1,
        material: BlockMaterial.WOOD,
        shape: "triangle",
        rotation: 0,
      },
      // Decorative circles on stone pillars (on top of wood platforms at row 5)
      { col: 2, row: 5, gridW: 1, gridH: 1, material: BlockMaterial.STONE, shape: "circle" },
      { col: 8, row: 5, gridW: 1, gridH: 1, material: BlockMaterial.STONE, shape: "circle" },
    ],
    pigs: [
      { col: 1, row: 0, size: PigSize.SMALL },
      { col: 4, row: 8, size: PigSize.SMALL },
      { col: 7, row: 8, size: PigSize.SMALL },
      { col: 10, row: 10, size: PigSize.MEDIUM },
      { col: 2, row: 8, size: PigSize.SMALL },
      { col: 5, row: 8, size: PigSize.SMALL },
      { col: 8, row: 8, size: PigSize.SMALL },
      { col: 10, row: 8, size: PigSize.SMALL },
    ],
    slingshot: SLINGSHOT,
    teachingFocus: "Cascade destruction down the waterfall!",
    minBirdsToClear: 3,
  }),

  // Level 18 — Ice Cube Matrix
  createGridLevel({
    levelId: 18,
    name: "Cube Matrix",
    description: "Grid of ice cubes with TNT intersections!",
    theme: "ice",
    birds: [
      { type: BirdType.BLUE },
      { type: BirdType.RED },
      { type: BirdType.BLUE },
      { type: BirdType.BLACK },
    ],
    blocks: [
      { col: 0, row: 0, gridW: 1, gridH: 3, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 2, row: 0, gridW: 1, gridH: 3, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 4, row: 0, gridW: 1, gridH: 3, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 6, row: 0, gridW: 1, gridH: 3, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 8, row: 0, gridW: 1, gridH: 3, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 1, row: 0, gridW: 1, gridH: 2, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 3, row: 0, gridW: 1, gridH: 2, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 5, row: 0, gridW: 1, gridH: 2, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 7, row: 0, gridW: 1, gridH: 2, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 9, row: 0, gridW: 1, gridH: 2, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 0, row: 3, gridW: 10, gridH: 1, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 0, row: 4, gridW: 1, gridH: 1, material: BlockMaterial.GLASS, shape: "square" },
      { col: 2, row: 4, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      { col: 4, row: 4, gridW: 1, gridH: 1, material: BlockMaterial.GLASS, shape: "square" },
      { col: 6, row: 4, gridW: 1, gridH: 1, material: BlockMaterial.GLASS, shape: "square" },
      { col: 8, row: 4, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      // Triangle accents on corners
      {
        col: 1,
        row: 4,
        gridW: 1,
        gridH: 1,
        material: BlockMaterial.STONE,
        shape: "triangle",
        rotation: 0,
      },
      {
        col: 9,
        row: 4,
        gridW: 1,
        gridH: 1,
        material: BlockMaterial.STONE,
        shape: "triangle",
        rotation: 0,
      },
      // Decorative circles (moved to avoid greeneling overlap)
      { col: 5, row: 4, gridW: 1, gridH: 1, material: BlockMaterial.GLASS, shape: "circle" },
    ],
    pigs: [
      { col: 3, row: 4, size: PigSize.SMALL },
      { col: 7, row: 4, size: PigSize.SMALL },
      { col: 4, row: 5, size: PigSize.SMALL },
      { col: 0.5, row: 5, size: PigSize.SMALL },
      { col: 2.5, row: 5, size: PigSize.SMALL },
      { col: 5, row: 5, size: PigSize.MEDIUM },
      { col: 8.5, row: 5, size: PigSize.SMALL },
    ],
    slingshot: SLINGSHOT,
    teachingFocus: "TNT chain reactions clear the matrix!",
    minBirdsToClear: 3,
  }),

  // Level 19 — Glacial Fortress
  createGridLevel({
    levelId: 19,
    name: "Glacial Fortress",
    description: "Massive ice fortress with metal core!",
    theme: "ice",
    birds: [
      { type: BirdType.RED },
      { type: BirdType.YELLOW },
      { type: BirdType.BLUE },
      { type: BirdType.BLACK },
      { type: BirdType.BLACK },
      { type: BirdType.WHITE },
    ],
    blocks: [
      { col: 0, row: 0, gridW: 1, gridH: 4, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 12, row: 0, gridW: 1, gridH: 4, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 0, row: 4, gridW: 13, gridH: 1, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 1, row: 5, gridW: 1, gridH: 4, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 3, row: 5, gridW: 1, gridH: 4, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 5, row: 5, gridW: 1, gridH: 4, material: BlockMaterial.METAL, shape: "rectangle" },
      { col: 7, row: 5, gridW: 1, gridH: 4, material: BlockMaterial.METAL, shape: "rectangle" },
      { col: 9, row: 5, gridW: 1, gridH: 4, material: BlockMaterial.METAL, shape: "rectangle" },
      { col: 11, row: 5, gridW: 1, gridH: 4, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 1, row: 9, gridW: 11, gridH: 1, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 2, row: 10, gridW: 1, gridH: 3, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 4, row: 10, gridW: 1, gridH: 3, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 6, row: 10, gridW: 1, gridH: 3, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 8, row: 10, gridW: 1, gridH: 3, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 10, row: 10, gridW: 1, gridH: 3, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 3, row: 13, gridW: 7, gridH: 1, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 3, row: 14, gridW: 1, gridH: 2, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 5, row: 14, gridW: 1, gridH: 2, material: BlockMaterial.METAL, shape: "rectangle" },
      { col: 6, row: 14, gridW: 1, gridH: 2, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 7, row: 14, gridW: 1, gridH: 2, material: BlockMaterial.METAL, shape: "rectangle" },
      { col: 9, row: 14, gridW: 1, gridH: 2, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 3, row: 16, gridW: 7, gridH: 1, material: BlockMaterial.METAL, shape: "rectangle" },
      { col: 6, row: 17, gridW: 1, gridH: 4, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 2, row: 0, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      { col: 6, row: 0, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      { col: 10, row: 0, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      { col: 6, row: 5, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      // Triangle roof accents (moved to row 5 to avoid overlap with rectangle at row 4)
      {
        col: 0,
        row: 5,
        gridW: 1,
        gridH: 1,
        material: BlockMaterial.STONE,
        shape: "triangle",
        rotation: 0,
      },
      {
        col: 12,
        row: 5,
        gridW: 1,
        gridH: 1,
        material: BlockMaterial.STONE,
        shape: "triangle",
        rotation: 0,
      },
      // Decorative circles on towers (moved to avoid greeneling overlap)
      { col: 4, row: 5, gridW: 1, gridH: 1, material: BlockMaterial.STONE, shape: "circle" },
      { col: 8, row: 5, gridW: 1, gridH: 1, material: BlockMaterial.STONE, shape: "circle" },
      { col: 6, row: 21, gridW: 1, gridH: 1, material: BlockMaterial.GLASS, shape: "circle" },
    ],
    pigs: [
      { col: 2, row: 1, size: PigSize.SMALL },
      { col: 6, row: 1, size: PigSize.MEDIUM },
      { col: 10, row: 1, size: PigSize.SMALL },
      { col: 2, row: 5, size: PigSize.SMALL },
      { col: 6, row: 6, size: PigSize.SMALL },
      { col: 10, row: 5, size: PigSize.SMALL },
      { col: 4, row: 14, size: PigSize.SMALL },
      { col: 8, row: 14, size: PigSize.SMALL },
      { col: 5, row: 17, size: PigSize.SMALL },
      { col: 6, row: 22, size: PigSize.LARGE },
    ],
    slingshot: SLINGSHOT,
    teachingFocus: "Breach the metal core to destroy the fortress!",
    minBirdsToClear: 5,
  }),

  // Level 20 — Arctic Apocalypse
  createGridLevel({
    levelId: 20,
    name: "Arctic Apocalypse",
    description: "The ultimate challenge - maximum destruction!",
    theme: "ice",
    birds: [
      { type: BirdType.RED },
      { type: BirdType.YELLOW },
      { type: BirdType.BLUE },
      { type: BirdType.BLACK },
      { type: BirdType.BLACK },
      { type: BirdType.WHITE },
      { type: BirdType.RED },
    ],
    blocks: [
      { col: 0, row: 0, gridW: 1, gridH: 3, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 14, row: 0, gridW: 1, gridH: 3, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 0, row: 3, gridW: 15, gridH: 1, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 1, row: 4, gridW: 1, gridH: 4, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 3, row: 4, gridW: 1, gridH: 4, material: BlockMaterial.METAL, shape: "rectangle" },
      { col: 5, row: 4, gridW: 1, gridH: 4, material: BlockMaterial.METAL, shape: "rectangle" },
      { col: 7, row: 4, gridW: 1, gridH: 4, material: BlockMaterial.METAL, shape: "rectangle" },
      { col: 9, row: 4, gridW: 1, gridH: 4, material: BlockMaterial.METAL, shape: "rectangle" },
      { col: 11, row: 4, gridW: 1, gridH: 4, material: BlockMaterial.METAL, shape: "rectangle" },
      { col: 13, row: 4, gridW: 1, gridH: 4, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 1, row: 8, gridW: 13, gridH: 1, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 2, row: 9, gridW: 1, gridH: 3, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 4, row: 9, gridW: 1, gridH: 3, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 6, row: 9, gridW: 1, gridH: 3, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 7, row: 9, gridW: 1, gridH: 3, material: BlockMaterial.METAL, shape: "rectangle" },
      { col: 8, row: 9, gridW: 1, gridH: 3, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 10, row: 9, gridW: 1, gridH: 3, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 12, row: 9, gridW: 1, gridH: 3, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 2, row: 12, gridW: 11, gridH: 1, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 3, row: 13, gridW: 1, gridH: 2, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 5, row: 13, gridW: 1, gridH: 2, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 7, row: 13, gridW: 1, gridH: 2, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 9, row: 13, gridW: 1, gridH: 2, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 11, row: 13, gridW: 1, gridH: 2, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 3, row: 15, gridW: 9, gridH: 1, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 4, row: 16, gridW: 1, gridH: 2, material: BlockMaterial.METAL, shape: "rectangle" },
      { col: 6, row: 16, gridW: 1, gridH: 2, material: BlockMaterial.METAL, shape: "rectangle" },
      { col: 7, row: 16, gridW: 1, gridH: 2, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 8, row: 16, gridW: 1, gridH: 2, material: BlockMaterial.METAL, shape: "rectangle" },
      { col: 10, row: 16, gridW: 1, gridH: 2, material: BlockMaterial.METAL, shape: "rectangle" },
      { col: 4, row: 18, gridW: 7, gridH: 1, material: BlockMaterial.METAL, shape: "rectangle" },
      { col: 7, row: 19, gridW: 1, gridH: 3, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 2, row: 0, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      { col: 5, row: 0, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      { col: 7, row: 0, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      { col: 9, row: 0, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      { col: 12, row: 0, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      // Triangle roof accents (moved to avoid rectangle overlap)
      {
        col: 0,
        row: 5,
        gridW: 1,
        gridH: 1,
        material: BlockMaterial.STONE,
        shape: "triangle",
        rotation: 0,
      },
      {
        col: 14,
        row: 5,
        gridW: 1,
        gridH: 1,
        material: BlockMaterial.STONE,
        shape: "triangle",
        rotation: 0,
      },
      // Decorative circles
      { col: 0, row: 4, gridW: 1, gridH: 1, material: BlockMaterial.STONE, shape: "circle" },
      { col: 14, row: 4, gridW: 1, gridH: 1, material: BlockMaterial.STONE, shape: "circle" },
    ],
    pigs: [
      { col: 2, row: 13, size: PigSize.SMALL },
      { col: 4, row: 13, size: PigSize.SMALL },
      { col: 8, row: 13, size: PigSize.SMALL },
      { col: 12, row: 13, size: PigSize.SMALL },
      { col: 3, row: 16, size: PigSize.SMALL },
      { col: 5, row: 16, size: PigSize.SMALL },
      { col: 6, row: 19, size: PigSize.SMALL },
      { col: 9, row: 16, size: PigSize.SMALL },
      { col: 5, row: 19, size: PigSize.SMALL },
      { col: 10, row: 19, size: PigSize.SMALL },
      { col: 8, row: 19, size: PigSize.MEDIUM },
      { col: 7, row: 22, size: PigSize.LARGE },
    ],
    slingshot: SLINGSHOT,
    teachingFocus: "The ultimate test - destroy everything!",
    minBirdsToClear: 6,
  }),

  // ============================================================
  // CHAPTER 5: VOLCANO THEME (Levels 21-25)
  // Fiery challenges requiring precision and strategy
  // ============================================================

  // Level 21 — Inferno Cascade (REDESIGNED)
  // Hook: TNT chain reaction through volcanic vent - stone pillars connected by TNT
  // Genius Moment: Black alien triggers TNT chain → cascading explosions level all towers
  createGridLevel({
    levelId: 21,
    name: "Inferno Cascade",
    description: "Stone pillars connected by explosive chains! One spark ignites the inferno!",
    theme: "volcano",
    teachingFocus: "Trigger TNT chains to cascade destruction through all structures!",
    birds: [{ type: BirdType.BLACK }, { type: BirdType.YELLOW }, { type: BirdType.BLACK }],
    blocks: [
      // === LEFT TOWER (cols 0-2) ===
      { col: 0, row: 0, gridW: 1, gridH: 5, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 2, row: 0, gridW: 1, gridH: 5, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 0, row: 5, gridW: 3, gridH: 1, material: BlockMaterial.STONE, shape: "rectangle" },
      // Upper wood tower
      { col: 0, row: 6, gridW: 1, gridH: 3, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 2, row: 6, gridW: 1, gridH: 3, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 0, row: 9, gridW: 3, gridH: 1, material: BlockMaterial.WOOD, shape: "rectangle" },
      // TNT trigger in left tower
      { col: 1, row: 0, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      // Glass cap on top
      { col: 1, row: 10, gridW: 1, gridH: 1, material: BlockMaterial.GLASS, shape: "square" },
      // Decorative circle on tower
      { col: 1, row: 6, gridW: 1, gridH: 1, material: BlockMaterial.STONE, shape: "circle" },
      // === TNT BRIDGE 1 (connecting to center tower) ===
      { col: 3, row: 0, gridW: 1, gridH: 3, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 3, row: 3, gridW: 1, gridH: 3, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 3, row: 6, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      // === CENTER TOWER (cols 5-7) ===
      { col: 5, row: 0, gridW: 1, gridH: 4, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 7, row: 0, gridW: 1, gridH: 4, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 5, row: 4, gridW: 3, gridH: 1, material: BlockMaterial.STONE, shape: "rectangle" },
      // Upper wood section
      { col: 5, row: 5, gridW: 1, gridH: 2, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 7, row: 5, gridW: 1, gridH: 2, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 5, row: 7, gridW: 3, gridH: 1, material: BlockMaterial.WOOD, shape: "rectangle" },
      // TNT trigger in center tower
      { col: 6, row: 0, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      // Glass cap on top
      { col: 6, row: 8, gridW: 1, gridH: 1, material: BlockMaterial.GLASS, shape: "square" },
      // Decorative circle on tower
      { col: 6, row: 5, gridW: 1, gridH: 1, material: BlockMaterial.STONE, shape: "circle" },
      // === TNT BRIDGE 2 (connecting to right tower) ===
      { col: 8, row: 0, gridW: 1, gridH: 3, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 8, row: 3, gridW: 1, gridH: 3, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 8, row: 6, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      // === RIGHT TOWER (cols 10-12) ===
      { col: 10, row: 0, gridW: 1, gridH: 6, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 12, row: 0, gridW: 1, gridH: 6, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 10, row: 6, gridW: 3, gridH: 1, material: BlockMaterial.STONE, shape: "rectangle" },
      // Upper glass tower
      { col: 10, row: 7, gridW: 1, gridH: 3, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 12, row: 7, gridW: 1, gridH: 3, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 10, row: 10, gridW: 3, gridH: 1, material: BlockMaterial.GLASS, shape: "rectangle" },
      // TNT trigger in right tower
      { col: 11, row: 0, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
    ],
    pigs: [
      // Left tower greeneling - on glass cap (row 11 = row 10 + 1)
      { col: 1, row: 11, size: PigSize.SMALL },
      // Center tower greeneling - on glass cap (row 9 = row 8 + 1)
      { col: 6, row: 9, size: PigSize.SMALL },
      // Right tower greeneling - on glass roof (row 11 = row 10 + 1)
      { col: 11, row: 11, size: PigSize.MEDIUM },
      // Ground pigs between towers
      { col: 4, row: 0, size: PigSize.SMALL },
      { col: 9, row: 0, size: PigSize.SMALL },
    ],
    slingshot: SLINGSHOT,
    minBirdsToClear: 2,
  }),

  // Level 22 — Molten Fortress (REDESIGNED)
  // Hook: Metal-reinforced bunker with glass ceiling weak point
  // Genius Moment: Blue alien shatters glass ceiling → debris triggers TNT → fortress collapses
  createGridLevel({
    levelId: 22,
    name: "Molten Fortress",
    description: "An impenetrable metal fortress with a glass ceiling. Find the weak point!",
    theme: "volcano",
    teachingFocus: "Glass ceilings are the Achilles heel! Blue birds reveal hidden weaknesses.",
    birds: [
      { type: BirdType.BLUE },
      { type: BirdType.BLACK },
      { type: BirdType.YELLOW },
      { type: BirdType.BLACK },
    ],
    blocks: [
      // === LEFT FORTRESS (cols 0-6) ===
      // Metal base
      { col: 0, row: 0, gridW: 1, gridH: 4, material: BlockMaterial.METAL, shape: "rectangle" },
      { col: 6, row: 0, gridW: 1, gridH: 4, material: BlockMaterial.METAL, shape: "rectangle" },
      { col: 0, row: 4, gridW: 7, gridH: 1, material: BlockMaterial.METAL, shape: "rectangle" },
      // Stone middle tier
      { col: 1, row: 5, gridW: 1, gridH: 3, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 3, row: 5, gridW: 1, gridH: 3, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 5, row: 5, gridW: 1, gridH: 3, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 1, row: 8, gridW: 5, gridH: 1, material: BlockMaterial.STONE, shape: "rectangle" },
      // Glass ceiling - Blue alien target
      { col: 1, row: 9, gridW: 1, gridH: 2, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 3, row: 9, gridW: 1, gridH: 2, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 5, row: 9, gridW: 1, gridH: 2, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 1, row: 11, gridW: 5, gridH: 1, material: BlockMaterial.GLASS, shape: "rectangle" },
      // TNT in base
      { col: 2, row: 5, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      { col: 4, row: 5, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      // Connector bridge (with support from ground)
      { col: 7, row: 0, gridW: 1, gridH: 3, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 7, row: 3, gridW: 1, gridH: 2, material: BlockMaterial.WOOD, shape: "rectangle" },
      // === RIGHT FORTRESS (cols 8-14) ===
      // Stone/metal base
      { col: 8, row: 0, gridW: 1, gridH: 5, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 9, row: 0, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      { col: 12, row: 0, gridW: 1, gridH: 5, material: BlockMaterial.METAL, shape: "rectangle" },
      { col: 14, row: 0, gridW: 1, gridH: 5, material: BlockMaterial.METAL, shape: "rectangle" },
      { col: 13, row: 0, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      // Platform
      { col: 8, row: 5, gridW: 7, gridH: 1, material: BlockMaterial.STONE, shape: "rectangle" },
      // TNT on platform (now has proper support)
      { col: 11, row: 0, gridW: 1, gridH: 5, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 11, row: 6, gridW: 1, gridH: 3, material: BlockMaterial.WOOD, shape: "rectangle" },
      // Glass tower on top (no TNT here to avoid overlap)
      { col: 11, row: 10, gridW: 1, gridH: 2, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 11, row: 12, gridW: 1, gridH: 1, material: BlockMaterial.GLASS, shape: "square" },
      // Wood towers
      { col: 9, row: 6, gridW: 1, gridH: 3, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 13, row: 6, gridW: 1, gridH: 3, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 9, row: 9, gridW: 5, gridH: 1, material: BlockMaterial.WOOD, shape: "rectangle" },
      // Glass tower on top (moved above)
      // Decorative circles on fortress corners
      { col: 0, row: 5, gridW: 1, gridH: 1, material: BlockMaterial.STONE, shape: "circle" },
      { col: 6, row: 5, gridW: 1, gridH: 1, material: BlockMaterial.STONE, shape: "circle" },
      { col: 8, row: 6, gridW: 1, gridH: 1, material: BlockMaterial.STONE, shape: "circle" },
      { col: 14, row: 6, gridW: 1, gridH: 1, material: BlockMaterial.STONE, shape: "circle" },
    ],
    pigs: [
      // Left fortress ground pigs
      { col: 2, row: 0, size: PigSize.SMALL },
      { col: 4, row: 0, size: PigSize.SMALL },
      // Left fortress on glass ceiling (row 12 = row 11 + 1)
      { col: 3, row: 12, size: PigSize.MEDIUM },
      // Right fortress ground greeneling
      { col: 10, row: 0, size: PigSize.SMALL },
      // Right fortress on wood platform (row 6 = row 5 + 1, not overlapping wood column)
      { col: 10, row: 6, size: PigSize.SMALL },
      // Right fortress on glass top (row 13 = row 12 + 1)
      { col: 11, row: 13, size: PigSize.SMALL },
    ],
    slingshot: SLINGSHOT,
    minBirdsToClear: 3,
  }),

  // Level 23 — Eruption Protocol (REDESIGNED)
  // Hook: THREE-TIER cascade structure - destruction flows downward like lava
  // Genius Moment: Blue alien shatters top glass → TNT cascade collapses entire structure
  createGridLevel({
    levelId: 23,
    name: "Eruption Protocol",
    description: "A three-tier volcanic fortress! Trigger the eruption from the summit!",
    theme: "volcano",
    teachingFocus:
      "Shatter the glass apex to trigger the cascading eruption! Each tier requires different birds!",
    birds: [
      { type: BirdType.BLUE },
      { type: BirdType.YELLOW },
      { type: BirdType.BLACK },
      { type: BirdType.BLACK },
      { type: BirdType.RED },
    ],
    blocks: [
      // =====================================================
      // TOP TIER - GLASS CROWN (rows 16-19) - Blue alien target
      // =====================================================
      // Glass pillars supporting the crown
      { col: 5, row: 16, gridW: 1, gridH: 2, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 7, row: 16, gridW: 1, gridH: 2, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 9, row: 16, gridW: 1, gridH: 2, material: BlockMaterial.GLASS, shape: "rectangle" },
      // Glass platform at top
      { col: 4, row: 18, gridW: 7, gridH: 1, material: BlockMaterial.GLASS, shape: "rectangle" },
      // TNT crown that triggers cascade
      { col: 5, row: 19, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      { col: 6, row: 19, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      { col: 7, row: 19, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      { col: 8, row: 19, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      { col: 9, row: 19, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      // Glass roof
      { col: 5, row: 20, gridW: 5, gridH: 1, material: BlockMaterial.GLASS, shape: "rectangle" },
      // Glass side panels (shortened to avoid overlap with platform)
      { col: 4, row: 16, gridW: 1, gridH: 2, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 10, row: 16, gridW: 1, gridH: 2, material: BlockMaterial.GLASS, shape: "rectangle" },

      // =====================================================
      // MIDDLE TIER - WOOD/STONE PLATFORM (rows 10-15) - Yellow/Black target
      // =====================================================
      // Support columns from bottom tier to middle tier
      { col: 3, row: 7, gridW: 1, gridH: 3, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 11, row: 7, gridW: 1, gridH: 3, material: BlockMaterial.WOOD, shape: "rectangle" },
      // Stone pillars supporting middle tier
      { col: 3, row: 10, gridW: 1, gridH: 6, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 11, row: 10, gridW: 1, gridH: 6, material: BlockMaterial.STONE, shape: "rectangle" },
      // Additional support columns under wood platform
      { col: 4, row: 7, gridW: 1, gridH: 3, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 10, row: 7, gridW: 1, gridH: 3, material: BlockMaterial.WOOD, shape: "rectangle" },
      // Wood cross beams
      { col: 4, row: 10, gridW: 7, gridH: 1, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 4, row: 15, gridW: 7, gridH: 1, material: BlockMaterial.WOOD, shape: "rectangle" },
      // Wood vertical supports
      { col: 5, row: 11, gridW: 1, gridH: 4, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 7, row: 11, gridW: 1, gridH: 4, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 9, row: 11, gridW: 1, gridH: 4, material: BlockMaterial.WOOD, shape: "rectangle" },
      // TNT embedded in middle tier - chains to top tier collapse
      { col: 6, row: 11, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      { col: 8, row: 11, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      // Stone reinforcement blocks
      { col: 4, row: 11, gridW: 1, gridH: 3, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 10, row: 11, gridW: 1, gridH: 3, material: BlockMaterial.STONE, shape: "rectangle" },
      // Wood supports under glass windows
      { col: 6, row: 12, gridW: 1, gridH: 1, material: BlockMaterial.WOOD, shape: "square" },
      { col: 8, row: 12, gridW: 1, gridH: 1, material: BlockMaterial.WOOD, shape: "square" },
      // Glass windows for Blue alien alternate path
      { col: 6, row: 13, gridW: 1, gridH: 2, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 8, row: 13, gridW: 1, gridH: 2, material: BlockMaterial.GLASS, shape: "rectangle" },

      // =====================================================
      // BOTTOM TIER - METAL FORTRESS (rows 0-9) - Black alien target
      // =====================================================
      // Metal outer walls
      { col: 0, row: 0, gridW: 1, gridH: 5, material: BlockMaterial.METAL, shape: "rectangle" },
      { col: 14, row: 0, gridW: 1, gridH: 5, material: BlockMaterial.METAL, shape: "rectangle" },
      // Metal platform base
      { col: 0, row: 5, gridW: 15, gridH: 1, material: BlockMaterial.METAL, shape: "rectangle" },
      // Stone inner supports
      { col: 2, row: 0, gridW: 1, gridH: 5, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 6, row: 0, gridW: 1, gridH: 5, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 8, row: 0, gridW: 1, gridH: 5, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 12, row: 0, gridW: 1, gridH: 5, material: BlockMaterial.STONE, shape: "rectangle" },
      // Wood inner structure
      { col: 3, row: 0, gridW: 1, gridH: 4, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 4, row: 0, gridW: 1, gridH: 4, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 10, row: 0, gridW: 1, gridH: 4, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 11, row: 0, gridW: 1, gridH: 4, material: BlockMaterial.WOOD, shape: "rectangle" },
      // TNT traps in bottom tier
      { col: 5, row: 0, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      { col: 7, row: 0, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      { col: 9, row: 0, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      // Stone blocks to catch falling debris (shortened to avoid overlap)
      { col: 1, row: 6, gridW: 1, gridH: 3, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 13, row: 6, gridW: 1, gridH: 3, material: BlockMaterial.STONE, shape: "rectangle" },
      // Upper metal reinforcement
      { col: 2, row: 6, gridW: 1, gridH: 3, material: BlockMaterial.METAL, shape: "rectangle" },
      { col: 12, row: 6, gridW: 1, gridH: 3, material: BlockMaterial.METAL, shape: "rectangle" },
      // Wood platform above metal
      { col: 3, row: 6, gridW: 9, gridH: 1, material: BlockMaterial.WOOD, shape: "rectangle" },
      // Side towers
      { col: 0, row: 6, gridW: 1, gridH: 3, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 14, row: 6, gridW: 1, gridH: 3, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 0, row: 9, gridW: 2, gridH: 1, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 13, row: 9, gridW: 2, gridH: 1, material: BlockMaterial.WOOD, shape: "rectangle" },
      // Triangle roof accents on side towers
      {
        col: 0,
        row: 10,
        gridW: 2,
        gridH: 1,
        material: BlockMaterial.STONE,
        shape: "triangle",
        rotation: 0,
      },
      {
        col: 13,
        row: 10,
        gridW: 2,
        gridH: 1,
        material: BlockMaterial.STONE,
        shape: "triangle",
        rotation: 0,
      },
    ],
    pigs: [
      // Top tier pigs (protected by glass) - on top of glass roof
      { col: 6, row: 21, size: PigSize.SMALL },
      { col: 8, row: 21, size: PigSize.SMALL },
      { col: 5, row: 21, size: PigSize.SMALL },
      // Middle tier pigs - on glass platform edges (row:19), avoiding TNT at cols 5-9
      { col: 4, row: 19, size: PigSize.SMALL },
      { col: 10, row: 19, size: PigSize.MEDIUM },
      // Bottom tier pigs (protected by metal) - on ground and platforms
      { col: 5, row: 1, size: PigSize.SMALL },
      { col: 9, row: 1, size: PigSize.SMALL },
      { col: 7, row: 21, size: PigSize.SMALL },
      { col: 7, row: 7, size: PigSize.SMALL },
    ],
    slingshot: SLINGSHOT,
    minBirdsToClear: 4,
  }),

  // Level 24 — Caldera Core (REDESIGNED)
  // Hook: CONCENTRIC RINGS around central TNT core - radial destruction puzzle
  // Genius Moment: Perfect Blue split hits all 4 glass windows simultaneously → complete cascade
  createGridLevel({
    levelId: 24,
    name: "Caldera Core",
    description:
      "A volcanic caldera with concentric rings of destruction! Shatter all glass to trigger the core!",
    theme: "volcano",
    teachingFocus:
      "Perfect Blue alien timing! Split to hit all four glass windows and unleash the eruption!",
    birds: [
      { type: BirdType.BLUE },
      { type: BirdType.YELLOW },
      { type: BirdType.BLACK },
      { type: BirdType.BLUE },
      { type: BirdType.RED },
    ],
    blocks: [
      // =====================================================
      // OUTER RING - METAL FORTRESS WALLS (cols 0-2, 12-14)
      // =====================================================
      // Left metal wall (ends at row 5, stone platform sits on top)
      { col: 0, row: 0, gridW: 1, gridH: 5, material: BlockMaterial.METAL, shape: "rectangle" },
      { col: 1, row: 0, gridW: 1, gridH: 5, material: BlockMaterial.METAL, shape: "rectangle" },
      { col: 2, row: 0, gridW: 1, gridH: 4, material: BlockMaterial.STONE, shape: "rectangle" },
      // Right metal wall (ends at row 5, stone platform sits on top)
      { col: 12, row: 0, gridW: 1, gridH: 4, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 13, row: 0, gridW: 1, gridH: 5, material: BlockMaterial.METAL, shape: "rectangle" },
      { col: 14, row: 0, gridW: 1, gridH: 5, material: BlockMaterial.METAL, shape: "rectangle" },
      // Outer ring TNT (cascades inward) - on top of stone
      { col: 2, row: 4, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      { col: 12, row: 4, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      // Stone platforms in outer ring (on top of TNT)
      { col: 0, row: 5, gridW: 3, gridH: 1, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 12, row: 5, gridW: 3, gridH: 1, material: BlockMaterial.STONE, shape: "rectangle" },
      // Wood towers on outer platforms (on top of stone)
      { col: 1, row: 6, gridW: 1, gridH: 3, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 13, row: 6, gridW: 1, gridH: 3, material: BlockMaterial.WOOD, shape: "rectangle" },

      // =====================================================
      // MIDDLE RING - STONE RING (cols 4-5, 9-10)
      // =====================================================
      // Left stone pillars
      { col: 4, row: 0, gridW: 1, gridH: 5, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 5, row: 0, gridW: 1, gridH: 5, material: BlockMaterial.STONE, shape: "rectangle" },
      // Right stone pillars
      { col: 9, row: 0, gridW: 1, gridH: 5, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 10, row: 0, gridW: 1, gridH: 5, material: BlockMaterial.STONE, shape: "rectangle" },
      // Stone ring platform
      { col: 4, row: 5, gridW: 7, gridH: 1, material: BlockMaterial.STONE, shape: "rectangle" },
      // TNT embedded in middle ring (on top of stone platform)
      { col: 5, row: 6, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      { col: 9, row: 6, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      // Wood supports on middle ring (on top of stone platform)
      { col: 4, row: 6, gridW: 1, gridH: 2, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 10, row: 6, gridW: 1, gridH: 2, material: BlockMaterial.WOOD, shape: "rectangle" },
      // Middle ring top (on top of wood supports)
      { col: 4, row: 8, gridW: 7, gridH: 1, material: BlockMaterial.WOOD, shape: "rectangle" },

      // =====================================================
      // INNER RING - WOOD WITH GLASS WINDOWS (cols 6-8)
      // =====================================================
      // Wood corner posts
      { col: 6, row: 0, gridW: 1, gridH: 4, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 7, row: 0, gridW: 1, gridH: 4, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 8, row: 0, gridW: 1, gridH: 4, material: BlockMaterial.WOOD, shape: "rectangle" },
      // Glass windows - Blue alien targets (between wood posts, on top of wood)
      { col: 6, row: 4, gridW: 1, gridH: 1, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 7, row: 4, gridW: 1, gridH: 1, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 8, row: 4, gridW: 1, gridH: 1, material: BlockMaterial.GLASS, shape: "rectangle" },
      // Inner platform
      { col: 6, row: 6, gridW: 3, gridH: 1, material: BlockMaterial.WOOD, shape: "rectangle" },

      // =====================================================
      // CENTRAL TNT CORE - THE ERUPTION TRIGGER
      // =====================================================
      // Core TNT blocks (multiple for massive explosion) - on inner platform
      { col: 7, row: 7, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      { col: 6, row: 7, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      { col: 8, row: 7, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      // TNT chain connecting to middle ring (on wood top)
      { col: 5, row: 9, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      { col: 9, row: 9, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      // TNT chain connecting to outer ring
      { col: 3, row: 6, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      { col: 11, row: 6, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      // Elevated TNT that creates vertical cascade
      { col: 7, row: 9, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },

      // =====================================================
      // BRIDGE CONNECTORS - TNT chains between rings (with supports)
      // =====================================================
      // Left bridge supports
      { col: 3, row: 0, gridW: 1, gridH: 3, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 3, row: 3, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      { col: 3, row: 4, gridW: 1, gridH: 1, material: BlockMaterial.WOOD, shape: "square" },
      { col: 3, row: 5, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      // Right bridge supports
      { col: 11, row: 0, gridW: 1, gridH: 3, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 11, row: 3, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      { col: 11, row: 4, gridW: 1, gridH: 1, material: BlockMaterial.WOOD, shape: "square" },
      { col: 11, row: 5, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },

      // =====================================================
      // DECORATIVE ELEMENTS - Glass accents (on wood towers)
      // =====================================================
      { col: 1, row: 9, gridW: 1, gridH: 1, material: BlockMaterial.GLASS, shape: "square" },
      { col: 13, row: 9, gridW: 1, gridH: 1, material: BlockMaterial.GLASS, shape: "square" },
      { col: 4, row: 9, gridW: 1, gridH: 1, material: BlockMaterial.GLASS, shape: "square" },
      { col: 10, row: 9, gridW: 1, gridH: 1, material: BlockMaterial.GLASS, shape: "square" },
      // Triangle accents on outer ring
      {
        col: 0,
        row: 6,
        gridW: 1,
        gridH: 1,
        material: BlockMaterial.STONE,
        shape: "triangle",
        rotation: 0,
      },
      {
        col: 14,
        row: 6,
        gridW: 1,
        gridH: 1,
        material: BlockMaterial.STONE,
        shape: "triangle",
        rotation: 0,
      },
    ],
    pigs: [
      // Outer ring pigs - on top of glass decorations (row:9 ends at row:10)
      { col: 1, row: 10, size: PigSize.SMALL },
      { col: 13, row: 10, size: PigSize.SMALL },
      // Middle ring pigs - on top of middle ring TNT (row:6 ends at row:7)
      { col: 5, row: 7, size: PigSize.SMALL },
      { col: 9, row: 7, size: PigSize.SMALL },
      // Inner ring pigs - on top of wood platform (row:8 ends at row:9)
      { col: 6, row: 9, size: PigSize.SMALL },
      { col: 8, row: 9, size: PigSize.SMALL },
      // Core greeneling - on top of elevated TNT (row:9 ends at row:10)
      { col: 7, row: 10, size: PigSize.LARGE },
    ],
    slingshot: SLINGSHOT,
    minBirdsToClear: 3,
  }),

  // Level 25 — Volcano Throne - BOSS LEVEL
  // Hook: Four interconnected fortresses with TNT bridges - one genius shot clears all
  // Genius Moment: Chain TNT bridges connect all sections - find the domino path
  createGridLevel({
    levelId: 25,
    name: "Volcano Throne",
    description: "The ultimate volcano fortress! Four sections connected by explosive bridges!",
    theme: "volcano",
    teachingFocus:
      "Master all birds! Chain reactions connect all sections - find the genius solution!",
    birds: [
      { type: BirdType.BLUE },
      { type: BirdType.BLACK },
      { type: BirdType.YELLOW },
      { type: BirdType.WHITE },
      { type: BirdType.RED },
      { type: BirdType.BLACK },
    ],
    blocks: [
      // SECTION 1: LEFT - Metal Bunker (cols -1 to 2)
      { col: -1, row: 0, gridW: 1, gridH: 4, material: BlockMaterial.METAL, shape: "rectangle" },
      { col: 0, row: 0, gridW: 1, gridH: 4, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 1, row: 0, gridW: 1, gridH: 4, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 2, row: 0, gridW: 1, gridH: 4, material: BlockMaterial.METAL, shape: "rectangle" },
      { col: -1, row: 4, gridW: 4, gridH: 1, material: BlockMaterial.METAL, shape: "rectangle" },
      // Glass corner towers
      { col: -1, row: 5, gridW: 1, gridH: 2, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 2, row: 5, gridW: 1, gridH: 2, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: -1, row: 7, gridW: 4, gridH: 1, material: BlockMaterial.GLASS, shape: "rectangle" },
      // TNT bridge connector to section 2
      { col: 3, row: 2, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },

      // SECTION 2: CENTER-LEFT - Stone Tower with Glass Windows (cols 4-7)
      { col: 4, row: 0, gridW: 1, gridH: 6, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 7, row: 0, gridW: 1, gridH: 6, material: BlockMaterial.STONE, shape: "rectangle" },
      // Glass windows - Blue alien entry
      { col: 5, row: 1, gridW: 1, gridH: 2, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 6, row: 1, gridW: 1, gridH: 2, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 5, row: 4, gridW: 1, gridH: 2, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 6, row: 4, gridW: 1, gridH: 2, material: BlockMaterial.GLASS, shape: "rectangle" },
      // Stone floors
      { col: 4, row: 3, gridW: 4, gridH: 1, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 4, row: 6, gridW: 4, gridH: 1, material: BlockMaterial.STONE, shape: "rectangle" },
      // TNT inside tower base
      { col: 5, row: 0, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      { col: 6, row: 0, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      // TNT bridge to section 3
      { col: 8, row: 4, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },

      // SECTION 3: CENTER-RIGHT - Wood Structure with TNT Core (cols 9-12)
      { col: 9, row: 0, gridW: 1, gridH: 4, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 10, row: 0, gridW: 1, gridH: 4, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 11, row: 0, gridW: 1, gridH: 4, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 12, row: 0, gridW: 1, gridH: 4, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 9, row: 4, gridW: 4, gridH: 1, material: BlockMaterial.WOOD, shape: "rectangle" },
      // TNT core - Yellow alien target (on floor)
      { col: 10, row: 1, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      { col: 11, row: 1, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      // Upper platform
      { col: 9, row: 5, gridW: 1, gridH: 2, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 12, row: 5, gridW: 1, gridH: 2, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 9, row: 7, gridW: 4, gridH: 1, material: BlockMaterial.WOOD, shape: "rectangle" },
      // TNT bridge to section 4
      { col: 13, row: 4, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },

      // SECTION 4: RIGHT - King's Throne (cols 14-17) - Mixed materials with elevated king
      // Base supports
      { col: 14, row: 0, gridW: 1, gridH: 3, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 15, row: 0, gridW: 1, gridH: 3, material: BlockMaterial.METAL, shape: "rectangle" },
      { col: 16, row: 0, gridW: 1, gridH: 3, material: BlockMaterial.METAL, shape: "rectangle" },
      { col: 17, row: 0, gridW: 1, gridH: 3, material: BlockMaterial.STONE, shape: "rectangle" },
      // First platform
      { col: 14, row: 3, gridW: 4, gridH: 1, material: BlockMaterial.METAL, shape: "rectangle" },
      // TNT under king's platform - Black alien target
      { col: 15, row: 3, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      { col: 16, row: 3, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      // Second tier supports
      { col: 14, row: 4, gridW: 1, gridH: 3, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 17, row: 4, gridW: 1, gridH: 3, material: BlockMaterial.STONE, shape: "rectangle" },
      // Glass throne windows - Blue alien entry
      { col: 15, row: 4, gridW: 1, gridH: 2, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 16, row: 4, gridW: 1, gridH: 2, material: BlockMaterial.GLASS, shape: "rectangle" },
      // King's platform
      { col: 14, row: 7, gridW: 4, gridH: 1, material: BlockMaterial.STONE, shape: "rectangle" },
      // Throne crown - glass
      { col: 15, row: 8, gridW: 2, gridH: 1, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 15, row: 9, gridW: 1, gridH: 2, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 16, row: 9, gridW: 1, gridH: 2, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 15, row: 11, gridW: 2, gridH: 1, material: BlockMaterial.GLASS, shape: "rectangle" },
      // Triangle roof accents on Section 1 glass roof
      {
        col: 0,
        row: 8,
        gridW: 1,
        gridH: 1,
        material: BlockMaterial.GLASS,
        shape: "triangle",
        rotation: 0,
      },
      {
        col: 1,
        row: 8,
        gridW: 1,
        gridH: 1,
        material: BlockMaterial.GLASS,
        shape: "triangle",
        rotation: 0,
      },
      // Circle decorations on metal corners
      { col: -1, row: 5, gridW: 1, gridH: 1, material: BlockMaterial.METAL, shape: "circle" },
      { col: 2, row: 5, gridW: 1, gridH: 1, material: BlockMaterial.METAL, shape: "circle" },
      { col: 14, row: 4, gridW: 1, gridH: 1, material: BlockMaterial.STONE, shape: "circle" },
      { col: 17, row: 4, gridW: 1, gridH: 1, material: BlockMaterial.STONE, shape: "circle" },
    ],
    pigs: [
      // Section 1 pigs (metal bunker)
      { col: 0, row: 6, size: PigSize.SMALL },
      { col: 1, row: 5, size: PigSize.SMALL },
      { col: -1, row: 8, size: PigSize.SMALL },
      // Section 2 pigs (stone tower)
      { col: 5, row: 7, size: PigSize.SMALL },
      { col: 6, row: 7, size: PigSize.MEDIUM },
      // Section 3 pigs (wood structure)
      { col: 10, row: 5, size: PigSize.SMALL },
      { col: 11, row: 5, size: PigSize.SMALL },
      // Section 4 - THE KING (elevated large greeneling)
      { col: 15, row: 8, size: PigSize.LARGE },
      // Ground pigs
      { col: 3, row: 0, size: PigSize.SMALL },
      { col: 8, row: 0, size: PigSize.SMALL },
      { col: 13, row: 0, size: PigSize.SMALL },
    ],
    slingshot: SLINGSHOT,
    minBirdsToClear: 4,
  }),

  // ============================================================
  // CHAPTER 6: JUNGLE THEME (Levels 26-30)
  // Lush greenery with vertical and bridge challenges
  // ============================================================

  // Level 26 — Canopy Shatter (REDESIGNED)
  // Hook: Tall vertical glass treehouse with pigs at three tiers
  // Genius Moment: Perfect timed split shatters all glass platforms simultaneously
  createGridLevel({
    levelId: 26,
    name: "Canopy Shatter",
    description:
      "A towering glass treehouse with greenelings on every level. Split to shatter all tiers!",
    theme: "jungle",
    teachingFocus: "Time your Blue alien split to hit all three glass platforms at once!",
    birds: [{ type: BirdType.BLUE }, { type: BirdType.BLUE }, { type: BirdType.YELLOW }],
    blocks: [
      // === CENTRAL TREE TRUNK (wood supports) ===
      { col: 5, row: 0, gridW: 1, gridH: 4, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 7, row: 0, gridW: 1, gridH: 4, material: BlockMaterial.WOOD, shape: "rectangle" },
      // === TIER 1: Ground level glass platform ===
      { col: 3, row: 4, gridW: 7, gridH: 1, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 3, row: 0, gridW: 1, gridH: 4, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 9, row: 0, gridW: 1, gridH: 4, material: BlockMaterial.GLASS, shape: "rectangle" },
      // === TIER 1: Wood supports going up ===
      { col: 4, row: 5, gridW: 1, gridH: 3, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 6, row: 5, gridW: 1, gridH: 3, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 8, row: 5, gridW: 1, gridH: 3, material: BlockMaterial.WOOD, shape: "rectangle" },
      // === TIER 2: Mid-level glass platform ===
      { col: 3, row: 8, gridW: 7, gridH: 1, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 3, row: 5, gridW: 1, gridH: 3, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 9, row: 5, gridW: 1, gridH: 3, material: BlockMaterial.GLASS, shape: "rectangle" },
      // === TIER 2: Upper wood supports ===
      { col: 4, row: 9, gridW: 1, gridH: 3, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 6, row: 9, gridW: 1, gridH: 3, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 8, row: 9, gridW: 1, gridH: 3, material: BlockMaterial.WOOD, shape: "rectangle" },
      // === TIER 3: Top glass canopy ===
      { col: 3, row: 12, gridW: 7, gridH: 1, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 3, row: 9, gridW: 1, gridH: 3, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 9, row: 9, gridW: 1, gridH: 3, material: BlockMaterial.GLASS, shape: "rectangle" },
      // === GLASS ROOF PEAK ===
      { col: 4, row: 13, gridW: 1, gridH: 2, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 6, row: 13, gridW: 1, gridH: 2, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 8, row: 13, gridW: 1, gridH: 2, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 4, row: 15, gridW: 5, gridH: 1, material: BlockMaterial.GLASS, shape: "rectangle" },
      // === DECORATIVE VINES (wood) on sides with support columns ===
      { col: 1, row: 0, gridW: 1, gridH: 2, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 1, row: 2, gridW: 1, gridH: 4, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 11, row: 0, gridW: 1, gridH: 2, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 11, row: 2, gridW: 1, gridH: 4, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 1, row: 6, gridW: 1, gridH: 1, material: BlockMaterial.WOOD, shape: "square" },
      { col: 11, row: 6, gridW: 1, gridH: 1, material: BlockMaterial.WOOD, shape: "square" },
      { col: 1, row: 7, gridW: 1, gridH: 3, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 11, row: 7, gridW: 1, gridH: 3, material: BlockMaterial.WOOD, shape: "rectangle" },
      // === GLASS DECORATIONS (on glass platform at row 4, supported by wood columns) ===
      { col: 2, row: 0, gridW: 1, gridH: 5, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 10, row: 0, gridW: 1, gridH: 5, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 2, row: 5, gridW: 1, gridH: 1, material: BlockMaterial.GLASS, shape: "square" },
      { col: 10, row: 5, gridW: 1, gridH: 1, material: BlockMaterial.GLASS, shape: "square" },
      { col: 2, row: 6, gridW: 1, gridH: 3, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 10, row: 6, gridW: 1, gridH: 3, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 2, row: 9, gridW: 1, gridH: 1, material: BlockMaterial.GLASS, shape: "square" },
      { col: 10, row: 9, gridW: 1, gridH: 1, material: BlockMaterial.GLASS, shape: "square" },
      { col: 2, row: 10, gridW: 1, gridH: 3, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 10, row: 10, gridW: 1, gridH: 3, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 2, row: 13, gridW: 1, gridH: 1, material: BlockMaterial.GLASS, shape: "square" },
      { col: 10, row: 13, gridW: 1, gridH: 1, material: BlockMaterial.GLASS, shape: "square" },
      // === TOP CROWN ===
      { col: 6, row: 16, gridW: 1, gridH: 1, material: BlockMaterial.GLASS, shape: "square" },
      // Triangle roof accents on glass peak
      {
        col: 5,
        row: 16,
        gridW: 1,
        gridH: 1,
        material: BlockMaterial.GLASS,
        shape: "triangle",
        rotation: 0,
      },
      {
        col: 7,
        row: 16,
        gridW: 1,
        gridH: 1,
        material: BlockMaterial.GLASS,
        shape: "triangle",
        rotation: 0,
      },
      // Circle decorations on wood columns (placed on ground nearby)
      { col: 0, row: 0, gridW: 1, gridH: 1, material: BlockMaterial.WOOD, shape: "circle" },
      { col: 12, row: 0, gridW: 1, gridH: 1, material: BlockMaterial.WOOD, shape: "circle" },
    ],
    pigs: [
      // Section 1 pigs - on ground
      { col: 4, row: 0, size: PigSize.SMALL },
      // On top of glass roof (row:15 ends at row:16, avoiding triangles/squares at cols 5-8 and glass at col 6)
      { col: 4, row: 16, size: PigSize.SMALL },
      { col: 8, row: 16, size: PigSize.SMALL },
      // On top of glass platform (row:8 ends at row:9)
      { col: 7, row: 9, size: PigSize.SMALL },
      // On top of glass decorations (row:13 ends at row:14)
      { col: 2, row: 14, size: PigSize.SMALL },
      { col: 10, row: 14, size: PigSize.SMALL },
      // On top of glass square at col 6 (row:15 ends at row:16)
      { col: 6, row: 17, size: PigSize.LARGE },
    ],
    slingshot: SLINGSHOT,
    minBirdsToClear: 2,
  }),

  // Level 27 — Vine Bridge (REDESIGNED)
  // Hook: Five wooden bridges connecting stone tower islands
  // Genius Moment: Perfect Yellow alien boost pierces through all five bridges
  createGridLevel({
    levelId: 27,
    name: "Vine Bridge",
    description: "Five wooden vine bridges connect the stone towers. Pierce through them all!",
    theme: "jungle",
    teachingFocus: "Boost Yellow alien to pierce through multiple wood bridges in one shot!",
    birds: [{ type: BirdType.YELLOW }, { type: BirdType.YELLOW }, { type: BirdType.BLACK }],
    blocks: [
      // === TOWER 1: Left stone pillar ===
      { col: 0, row: 0, gridW: 1, gridH: 5, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 2, row: 0, gridW: 1, gridH: 5, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 0, row: 5, gridW: 3, gridH: 1, material: BlockMaterial.STONE, shape: "rectangle" },
      // === BRIDGE 1 (with support column, platform sits on top) ===
      { col: 3, row: 0, gridW: 1, gridH: 3, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 3, row: 3, gridW: 2, gridH: 1, material: BlockMaterial.WOOD, shape: "rectangle" },
      // === BRIDGE 5 (upper crossing, supported by column at col 3) ===
      { col: 3, row: 4, gridW: 1, gridH: 1, material: BlockMaterial.WOOD, shape: "square" },
      { col: 3, row: 5, gridW: 3, gridH: 1, material: BlockMaterial.WOOD, shape: "rectangle" },
      // === TOWER 2: First island ===
      { col: 5, row: 0, gridW: 1, gridH: 2, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 5, row: 2, gridW: 2, gridH: 1, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 6, row: 3, gridW: 1, gridH: 1, material: BlockMaterial.STONE, shape: "square" },
      // === BRIDGE 2 (with support column) ===
      { col: 7, row: 0, gridW: 1, gridH: 2, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 7, row: 2, gridW: 2, gridH: 1, material: BlockMaterial.WOOD, shape: "rectangle" },
      // === TOWER 3: Central tall tower ===
      { col: 9, row: 0, gridW: 1, gridH: 6, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 11, row: 0, gridW: 1, gridH: 6, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 9, row: 6, gridW: 3, gridH: 1, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 10, row: 7, gridW: 1, gridH: 2, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 9, row: 9, gridW: 3, gridH: 1, material: BlockMaterial.WOOD, shape: "rectangle" },
      // === BRIDGE 3 (with support column) ===
      { col: 12, row: 0, gridW: 1, gridH: 4, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 12, row: 4, gridW: 2, gridH: 1, material: BlockMaterial.WOOD, shape: "rectangle" },
      // === TOWER 4: Right island ===
      { col: 14, row: 0, gridW: 1, gridH: 3, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 14, row: 3, gridW: 2, gridH: 1, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 15, row: 4, gridW: 1, gridH: 1, material: BlockMaterial.STONE, shape: "square" },
      // === BRIDGE 4 (with support column) ===
      { col: 16, row: 0, gridW: 1, gridH: 2, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 16, row: 2, gridW: 2, gridH: 1, material: BlockMaterial.WOOD, shape: "rectangle" },
      // === TOWER 5: Far right stone pillar ===
      { col: 18, row: 0, gridW: 1, gridH: 4, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 20, row: 0, gridW: 1, gridH: 4, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 18, row: 4, gridW: 3, gridH: 1, material: BlockMaterial.STONE, shape: "rectangle" },
      // === ADDITIONAL STRUCTURE: Elevated platform on Tower 1 ===
      { col: 0, row: 6, gridW: 1, gridH: 2, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 2, row: 6, gridW: 1, gridH: 2, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 0, row: 8, gridW: 3, gridH: 1, material: BlockMaterial.WOOD, shape: "rectangle" },
      // Triangle roof accents on tower tops
      {
        col: 0,
        row: 9,
        gridW: 3,
        gridH: 1,
        material: BlockMaterial.WOOD,
        shape: "triangle",
        rotation: 0,
      },
      {
        col: 9,
        row: 10,
        gridW: 3,
        gridH: 1,
        material: BlockMaterial.STONE,
        shape: "triangle",
        rotation: 0,
      },
      {
        col: 18,
        row: 5,
        gridW: 3,
        gridH: 1,
        material: BlockMaterial.STONE,
        shape: "triangle",
        rotation: 0,
      },
    ],
    pigs: [
      // Tower 1 pigs - on ground and on top of stone platform (row:5 ends at row:6)
      { col: 1, row: 0, size: PigSize.SMALL },
      { col: 1, row: 6, size: PigSize.SMALL },
      // Bridge 1 greeneling - on top of Bridge 5 (row:5 ends at row:6)
      { col: 4, row: 6, size: PigSize.SMALL },
      // Tower 2 greeneling - on top of stone (row:2 ends at row:3)
      { col: 5, row: 3, size: PigSize.SMALL },
      // Tower 3 pigs - on top of wood platform (row:9 ends at row:10, avoiding triangles at cols 9-12, 13-15, 18-21)
      { col: 14, row: 4, size: PigSize.SMALL },
      // Tower 5 pigs - on ground only (triangle at cols 18-21 blocks platform access)
      { col: 19, row: 0, size: PigSize.SMALL },
    ],
    slingshot: SLINGSHOT,
    minBirdsToClear: 2,
  }),

  // Level 28 — Stone Idol
  // Focus: Black alien explosion chain through ancient stone temple
  createGridLevel({
    levelId: 28,
    name: "Stone Idol",
    description: "An ancient stone temple with metal idols. Trigger the explosion chain!",
    theme: "jungle",
    teachingFocus: "Black alien explosions can chain through TNT! Find the weak point.",
    birds: [{ type: BirdType.BLACK }, { type: BirdType.BLACK }, { type: BirdType.YELLOW }],
    blocks: [
      { col: 3, row: 0, gridW: 1, gridH: 5, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 4, row: 0, gridW: 1, gridH: 5, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 5, row: 0, gridW: 1, gridH: 5, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 6, row: 0, gridW: 1, gridH: 5, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 7, row: 0, gridW: 1, gridH: 5, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 8, row: 0, gridW: 1, gridH: 5, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 9, row: 0, gridW: 1, gridH: 5, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 4, row: 5, gridW: 1, gridH: 1, material: BlockMaterial.METAL, shape: "square" },
      { col: 5, row: 5, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      { col: 6, row: 5, gridW: 1, gridH: 1, material: BlockMaterial.METAL, shape: "square" },
      { col: 7, row: 5, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      { col: 8, row: 5, gridW: 1, gridH: 1, material: BlockMaterial.METAL, shape: "square" },
      { col: 5, row: 6, gridW: 1, gridH: 3, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 6, row: 6, gridW: 1, gridH: 3, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 7, row: 6, gridW: 1, gridH: 3, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 5, row: 9, gridW: 3, gridH: 1, material: BlockMaterial.STONE, shape: "rectangle" },
      // Triangle roof accent on top
      {
        col: 5,
        row: 10,
        gridW: 3,
        gridH: 1,
        material: BlockMaterial.STONE,
        shape: "triangle",
        rotation: 0,
      },
      // Circle decorations on temple corners (placed on top of stone base)
      { col: 3, row: 5, gridW: 1, gridH: 1, material: BlockMaterial.STONE, shape: "circle" },
      { col: 9, row: 5, gridW: 1, gridH: 1, material: BlockMaterial.STONE, shape: "circle" },
    ],
    pigs: [
      { col: 4, row: 6, size: PigSize.SMALL },
      { col: 8, row: 6, size: PigSize.SMALL },
      { col: 3, row: 6, size: PigSize.SMALL },
    ],
    slingshot: SLINGSHOT,
    minBirdsToClear: 2,
  }),

  // Level 29 — Treetop Siege
  // Focus: White alien egg drops on elevated fortress with leaf canopy
  createGridLevel({
    levelId: 29,
    name: "Treetop Siege",
    description: "An elevated greeneling fortress with a leaf canopy. Drop eggs from above!",
    theme: "jungle",
    teachingFocus: "White alien can fly high and drop eggs on elevated targets!",
    birds: [{ type: BirdType.WHITE }, { type: BirdType.WHITE }, { type: BirdType.BLUE }],
    blocks: [
      { col: 3, row: 0, gridW: 1, gridH: 10, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 4, row: 0, gridW: 1, gridH: 10, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 5, row: 0, gridW: 1, gridH: 10, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 6, row: 0, gridW: 1, gridH: 10, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 7, row: 0, gridW: 1, gridH: 10, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 8, row: 0, gridW: 1, gridH: 10, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 9, row: 0, gridW: 1, gridH: 10, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 3, row: 10, gridW: 7, gridH: 1, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 3, row: 11, gridW: 1, gridH: 2, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 5, row: 11, gridW: 1, gridH: 2, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 7, row: 11, gridW: 1, gridH: 2, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 9, row: 11, gridW: 1, gridH: 2, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 3, row: 13, gridW: 7, gridH: 1, material: BlockMaterial.GLASS, shape: "rectangle" },
      // Triangle roof accents on glass canopy
      {
        col: 4,
        row: 14,
        gridW: 1,
        gridH: 1,
        material: BlockMaterial.GLASS,
        shape: "triangle",
        rotation: 0,
      },
      {
        col: 6,
        row: 14,
        gridW: 1,
        gridH: 1,
        material: BlockMaterial.GLASS,
        shape: "triangle",
        rotation: 0,
      },
      {
        col: 8,
        row: 14,
        gridW: 1,
        gridH: 1,
        material: BlockMaterial.GLASS,
        shape: "triangle",
        rotation: 0,
      },
      // Circle decorations (placed on glass canopy and on top of wood platform)
      { col: 3, row: 14, gridW: 1, gridH: 1, material: BlockMaterial.GLASS, shape: "circle" },
      { col: 4, row: 11, gridW: 1, gridH: 1, material: BlockMaterial.WOOD, shape: "circle" },
    ],
    pigs: [
      { col: 5, row: 14, size: PigSize.SMALL },
      { col: 7, row: 14, size: PigSize.SMALL },
      { col: 9, row: 14, size: PigSize.SMALL },
      { col: 6, row: 11, size: PigSize.SMALL },
      { col: 8, row: 11, size: PigSize.SMALL },
    ],
    slingshot: SLINGSHOT,
    minBirdsToClear: 2,
  }),

  // Level 30 — JUNGLE CITADEL: ULTIMATE MASTERY BOSS LEVEL
  // Focus: All birds - epic 4-section fortress with chain reaction puzzle
  // Chain: Blue→Glass→TNT→Gatehouse→Bridge→Citadel→ThroneRoom→KingPig falls
  createGridLevel({
    levelId: 30,
    name: "Jungle Citadel",
    description: "THE FINAL CHALLENGE! Storm the ancient citadel and defeat the King greeneling!",
    theme: "jungle",
    teachingFocus: "Master ALL birds! Find the perfect chain reaction to topple the King!",
    birds: [
      { type: BirdType.BLUE },
      { type: BirdType.YELLOW },
      { type: BirdType.BLACK },
      { type: BirdType.WHITE },
      { type: BirdType.BLACK },
      { type: BirdType.RED },
    ],
    blocks: [
      // ===== SECTION 1: THE GATEHOUSE (cols 2-5) =====
      { col: 2, row: 0, gridW: 1, gridH: 8, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 3, row: 0, gridW: 1, gridH: 8, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 2, row: 8, gridW: 2, gridH: 1, material: BlockMaterial.METAL, shape: "rectangle" },
      { col: 4, row: 0, gridW: 1, gridH: 3, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 4, row: 3, gridW: 1, gridH: 1, material: BlockMaterial.EXPLOSIVE, shape: "square" },
      { col: 5, row: 0, gridW: 1, gridH: 4, material: BlockMaterial.STONE, shape: "rectangle" },
      {
        col: 3,
        row: 9,
        gridW: 2,
        gridH: 2,
        material: BlockMaterial.STONE,
        shape: "triangle",
        rotation: 0,
      },
      { col: 4, row: 4, gridW: 1, gridH: 1, material: BlockMaterial.WOOD, shape: "square" },

      // ===== SECTION 2: THE BRIDGE (cols 6-7) =====
      { col: 6, row: 0, gridW: 1, gridH: 5, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 7, row: 0, gridW: 1, gridH: 5, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 6, row: 5, gridW: 2, gridH: 1, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 6, row: 6, gridW: 2, gridH: 1, material: BlockMaterial.WOOD, shape: "rectangle" },
      { col: 6, row: 7, gridW: 2, gridH: 1, material: BlockMaterial.WOOD, shape: "rectangle" },

      // ===== SECTION 3: THE MAIN CITADEL (cols 8-12) =====
      // Outer walls
      { col: 8, row: 0, gridW: 1, gridH: 10, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 12, row: 0, gridW: 1, gridH: 10, material: BlockMaterial.STONE, shape: "rectangle" },
      // Inner structure - platforms supported by columns
      { col: 9, row: 0, gridW: 1, gridH: 4, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 11, row: 0, gridW: 1, gridH: 4, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 9, row: 4, gridW: 3, gridH: 1, material: BlockMaterial.WOOD, shape: "rectangle" },
      // Upper level columns on platform
      { col: 9, row: 5, gridW: 1, gridH: 2, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 11, row: 5, gridW: 1, gridH: 2, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 9, row: 7, gridW: 3, gridH: 1, material: BlockMaterial.WOOD, shape: "rectangle" },
      // Top level
      { col: 9, row: 8, gridW: 1, gridH: 2, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 11, row: 8, gridW: 1, gridH: 2, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 9, row: 10, gridW: 3, gridH: 1, material: BlockMaterial.WOOD, shape: "rectangle" },
      // Roof
      { col: 8, row: 10, gridW: 1, gridH: 1, material: BlockMaterial.METAL, shape: "square" },
      { col: 12, row: 10, gridW: 1, gridH: 1, material: BlockMaterial.METAL, shape: "square" },
      {
        col: 8,
        row: 11,
        gridW: 1,
        gridH: 1,
        material: BlockMaterial.STONE,
        shape: "triangle",
        rotation: 0,
      },
      {
        col: 9,
        row: 11,
        gridW: 3,
        gridH: 2,
        material: BlockMaterial.STONE,
        shape: "triangle",
        rotation: 0,
      },
      {
        col: 12,
        row: 11,
        gridW: 1,
        gridH: 1,
        material: BlockMaterial.STONE,
        shape: "triangle",
        rotation: 0,
      },

      // ===== SECTION 4: THE THRONE ROOM (cols 13-16) =====
      { col: 13, row: 0, gridW: 1, gridH: 4, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 16, row: 0, gridW: 1, gridH: 4, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 14, row: 0, gridW: 2, gridH: 4, material: BlockMaterial.GLASS, shape: "rectangle" },
      { col: 13, row: 4, gridW: 1, gridH: 4, material: BlockMaterial.METAL, shape: "rectangle" },
      { col: 16, row: 4, gridW: 1, gridH: 4, material: BlockMaterial.METAL, shape: "rectangle" },
      { col: 14, row: 4, gridW: 2, gridH: 4, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 13, row: 8, gridW: 4, gridH: 1, material: BlockMaterial.METAL, shape: "rectangle" },
      { col: 13, row: 9, gridW: 4, gridH: 1, material: BlockMaterial.STONE, shape: "rectangle" },
      { col: 13, row: 10, gridW: 4, gridH: 1, material: BlockMaterial.STONE, shape: "rectangle" },
      {
        col: 13,
        row: 11,
        gridW: 4,
        gridH: 2,
        material: BlockMaterial.STONE,
        shape: "triangle",
        rotation: 0,
      },
      // Circle decorations on citadel corners (moved to avoid overlaps)
      { col: 4, row: 5, gridW: 1, gridH: 1, material: BlockMaterial.STONE, shape: "circle" },
    ],
    pigs: [
      // Section 1 pigs - on metal roof (row:8 ends at row:9)
      { col: 2, row: 9, size: PigSize.SMALL },
      // Section 2 pigs - on top of bridge platforms
      { col: 6, row: 8, size: PigSize.SMALL },
      { col: 7, row: 8, size: PigSize.SMALL },
      // Section 3 pigs - on platforms (row:10 ends at row:11)
      { col: 10, row: 5, size: PigSize.SMALL },
      { col: 10, row: 8, size: PigSize.SMALL },
      // Section 4 pigs - on metal platform (row:8 ends at row:9)
    ],
    slingshot: SLINGSHOT,
    minBirdsToClear: 5,
  }),
];

function gridToPixelBlock(block: GridBlockConfig): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const pixelW = block.gridW * GRID_UNIT;
  const pixelH = block.gridH * GRID_UNIT;

  let xOffset = block.gridW / 2;
  let yOffset = block.gridH / 2;

  if (block.shape === "triangle") {
    yOffset = block.gridH * 0.35;
    if (block.gridW === 1) {
      xOffset = block.gridW * 0.35;
    }
  }

  return {
    x: STRUCTURE_START_X + (block.col + xOffset) * GRID_UNIT,
    y: GROUND_Y - (block.row + yOffset) * GRID_UNIT,
    width: pixelW,
    height: pixelH,
  };
}

function gridToPixelPig(greeneling: GridPigConfig): Position {
  const pigGridSizes: Record<PigSize, number> = {
    [PigSize.SMALL]: 1,
    [PigSize.MEDIUM]: 2,
    [PigSize.LARGE]: 3,
  };

  const pigSize = pigGridSizes[greeneling.size];
  const pigPixelSize = pigSize * GRID_UNIT;

  return {
    x: STRUCTURE_START_X + (greeneling.col + pigSize / 2) * GRID_UNIT,
    y: GROUND_Y - greeneling.row * GRID_UNIT - pigPixelSize / 2,
  };
}

function convertGridLevelToLevelData(gridLevel: GridLevelData): LevelData {
  const structures: LevelBlockConfig[] = gridLevel.blocks.map((block) => {
    const pixelPos = gridToPixelBlock(block);

    const isVerticalRectangle = block.shape === "rectangle" && block.gridW < block.gridH;
    const canonicalW = isVerticalRectangle ? block.gridH : block.gridW;
    const canonicalH = isVerticalRectangle ? block.gridW : block.gridH;
    const rotation = isVerticalRectangle ? (block.rotation ?? 0) + 90 : (block.rotation ?? 0);

    const elementIndex = `${block.material}_${block.shape}_pristine_${canonicalW}x${canonicalH}`;

    return {
      x: pixelPos.x,
      y: pixelPos.y,
      width: pixelPos.width,
      height: pixelPos.height,
      material: block.material,
      rotation,
      elementIndex,
    };
  });

  const pigs: LevelPigConfig[] = gridLevel.pigs.map((greeneling) => {
    const pixelPos = gridToPixelPig(greeneling);
    return {
      x: pixelPos.x,
      y: pixelPos.y,
      size: greeneling.size,
    };
  });

  return {
    levelId: gridLevel.levelId,
    name: gridLevel.name,
    description: gridLevel.description,
    theme: gridLevel.theme,
    birds: gridLevel.birds,
    structures,
    pigs,
    slingshot: gridLevel.slingshot,
    starThresholds: gridLevel.starThresholds,
    teachingFocus: gridLevel.teachingFocus,
  };
}

export const LEVELS: LevelData[] = GRID_LEVELS.map(convertGridLevelToLevelData);

export function getLevelById(id: number): LevelData | undefined {
  return LEVELS.find((level) => level.levelId === id);
}

export function getTotalLevels(): number {
  return LEVELS.length;
}
