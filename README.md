# Angry Aliens

> A physics-based puzzle game built with Phaser 3 & Matter.js

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Phaser](https://img.shields.io/badge/Phaser-3.90-6E5494)](https://phaser.io/)
[![Vite](https://img.shields.io/badge/Vite-6.3-646CFF?logo=vite)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

![Gameplay Screenshot](./repo/angry-header.png)

---

## About The Project

Angry Aliens is an Angry Birds-style physics puzzle game built as a portfolio project to demonstrate modern game development practices, clean architecture patterns, and the capabilities of web-based game engines.

Launch aliens from a slingshot to destroy structures and defeat the Greenelings. Each alien type has unique abilities, and different materials respond realistically to impacts. The game features 30 levels across 6 thematic worlds, with a star-based scoring system that rewards precision and strategy, with several effects and programming techniques displayed.

🎮 [Play here!](https://feliperyba.github.io/angry-aliens-phaser/)

### Why This Project?

- **Learning**: Deep dive into physics-based game development with Matter.js
- **Architecture**: Showcase clean code patterns (DI, State Machines, Event-driven design)
- **Modern Tooling**: TypeScript, Vite, ESLint, and professional development workflows
- **Fun**: Building games is awesome!

---

## Features

![Gameplay GIF](./repo/gameplay.gif)

### Gameplay

- **5 Alien Types** - Each with unique abilities and material effectiveness
  - Red - Balanced, no ability
  - Yellow (Chuck) - Speed boost, wood specialist (2x damage)
  - Blue - Splits into 3, glass specialist (2x damage)
  - Beige (Bomb) - Explosion, stone/metal specialist (2x damage)
  - Red Square - Drops explosive clone, balanced effectiveness

- **5 Destructible Materials** - With realistic physics properties
  - Glass - Fragile, shatters easily
  - Wood - Medium durability
  - Stone - Heavy and strong
  - Metal - toughest material
  - Explosive (TNT) - Chain reaction trigger

- **30 Hand-Crafted Levels** - Across 6 thematic worlds
  - Forest (Tutorial) - Desert - Castle - Ice - Volcano - Jungle

- **Scoring System** - Star ratings, combo multipliers, unused alien bonuses

### Physics

- **Realistic Destruction** - Voronoi-based fragmentation creates unique debris patterns
- **Chain Reactions** - Explosions trigger cascading destruction
- **Material Physics** - Each material has unique density, friction, and restitution
- **Bird-Material Interactions** - Damage multipliers reward strategic bird selection

### Technical

- **Clean Architecture** - Dependency injection, event-driven design
- **Type-Safe** - Full TypeScript with strict mode
- **Performance Optimized** - Body sleeping, object pooling, adaptive quality
- **Responsive Design** - Works on desktop and mobile devices

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- 
---

## Tech Stack

| Category    | Technology                                    | Version |
| ----------- | --------------------------------------------- | ------- |
| Game Engine | [Phaser](https://phaser.io/)                  | 3.90    |
| Physics     | [Matter.js](https://brm.io/matter-js/)        | 0.20    |
| Language    | [TypeScript](https://www.typescriptlang.org/) | 5.7     |
| Build Tool  | [Vite](https://vitejs.dev/)                   | 6.3     |
| Linting     | [ESLint](https://eslint.org/)                 | 10.0    |
| Formatting  | [Prettier](https://prettier.io/)              | 3.8     |

---

### Architecture Decisions

- **DI Container** - Makes testing and refactoring much easier; systems are loosely coupled
- **EventBus** - Decouples UI from game logic; scenes don't need direct references to each other
- **State Machines** - Perfect for entities with clear lifecycle states (birds, pigs, slingshot)
- **Factory Pattern** - Centralized creation logic makes it easy to add new entity types

### Web Workers

- **Offload heavy computation** - Voronoi fragmentation runs in a worker thread
- **Template caching** - Cache generated fragment shapes to avoid regenerating identical patterns
- **Message passing** - Keep worker communication minimal to avoid overhead

---

### Directory Structure

```
src/
├── abilities/           # Bird abilities (Strategy pattern)
│   ├── SpeedBoostAbility.ts
│   ├── SplitAbility.ts
│   ├── ExplosionAbility.ts
│   └── EggDropAbility.ts
├── config/              # Game configurations
│   ├── GameConfig.ts    # Core game constants
│   ├── PhysicsConfig.ts # Bird & slingshot physics
│   ├── bootstrap.ts     # DI container setup
│   └── registries/      # Service & ability registries
├── constants/           # Enums and constants
│   ├── CollisionCategory.ts
│   ├── Materials.ts
│   └── BodyLabels.ts
├── data/                # Level definitions
│   └── levels.ts        # 31 levels (2658 lines)
├── entities/            # Base entity classes
├── events/              # Typed EventBus
├── factories/           # Object factories
├── interfaces/          # TypeScript contracts (IDamageable, etc.)
├── objects/             # Game objects
│   ├── Bird.ts          # Bird with state machine
│   ├── Pig.ts           # Pig with damage system
│   ├── Block.ts         # Block with material physics
│   └── Slingshot.ts     # Launch mechanic
├── scenes/              # Phaser scenes
├── systems/             # Game systems (15+)
├── types/               # Type definitions
├── ui/                  # UI components
│   ├── components/      # Button, Panel, Modal, etc.
│   ├── dialogs/         # Pause, Settings, Results
│   └── hud/             # ScorePanel, BirdQueue
├── utils/               # Helper functions
└── workers/             # Web Workers (fragmentation)
```

---

## Physics System

### Matter.js Configuration

```typescript
physics: {
  default: "matter",
  matter: {
    gravity: { x: 0, y: 0.9 },
    enableSleeping: true,
    sleepThreshold: 300,
    positionIterations: 6,
    velocityIterations: 6,
  },
}
```

### Damage Multipliers

Different bird types deal varying damage to materials:

| Alien          | Glass    | Wood     | Stone    | Metal    | Explosive |
| -------------- | -------- | -------- | -------- | -------- | --------- |
| Red            | 1.0x     | 1.0x     | 0.75x    | 0.75x    | 1.0x      |
| Yellow (Chuck) | 0.5x     | **2.0x** | 0.5x     | 0.3x     | 1.0x      |
| Blue           | **2.0x** | 0.5x     | 0.25x    | 0.15x    | 1.0x      |
| Beige (Bomb)   | 1.0x     | 1.5x     | **2.0x** | **2.0x** | 1.0x      |
| Red Square     | 1.5x     | 1.5x     | 1.5x     | 1.5x     | 1.0x      |

### Destruction Mechanics

1. **Damage Accumulation** - Blocks take damage until health reaches 0
2. **Visual States** - Texture changes: pristine → dented → cracked → destroyed
3. **Fragmentation** - Voronoi-based debris generated via Web Workers
4. **Wake Cascade** - Destruction wakes nearby sleeping bodies for chain reactions

---

## Extending The Project

### Adding a New Alien Type

1. **Define the type** in `src/types/BirdType.ts`:

```typescript
export enum BirdType {
  RED = "RED",
  YELLOW = "YELLOW",
  // Add your new alien
  PURPLE = "PURPLE",
}
```

2. **Configure physics** in `src/config/PhysicsConfig.ts`:

```typescript
BIRD_PHYSICS: {
  PURPLE: {
    density: 0.0025,
    restitution: 0.4,
    friction: 0.4,
    frictionAir: 0.0005,
    radius: 35,
    hasAbility: true,
  },
}
```

3. **Create the ability** in `src/abilities/PurpleAbility.ts`:

```typescript
export class PurpleAbility implements IAbility {
  execute(bird: Bird, scene: Phaser.Scene): void {
    // Your ability logic here
  }
}
```

4. **Register the ability** in `src/config/registries/AbilityRegistry.ts`:

```typescript
this.register(BirdType.PURPLE, new PurpleAbility());
```

5. **Add sprites** to `game-assets/atlases/level.png` with naming:
   - `bird_purple.png`

### Creating New Levels

Levels use a grid-based coordinate system (70px units):

```typescript
// In src/data/levels.ts
createGridLevel({
  levelId: 32,
  name: "My Custom Level",
  description: "A challenging new level!",
  theme: "forest",
  teachingFocus: "Master the purple bird!",

  birds: [{ type: BirdType.RED }, { type: BirdType.YELLOW }],

  blocks: [
    // col, row = grid position (70px units)
    // gridW, gridH = size in grid units
    { col: 0, row: 0, gridW: 1, gridH: 2, material: "wood", shape: "rectangle" },
    { col: 1, row: 0, gridW: 1, gridH: 2, material: "glass", shape: "rectangle" },
    { col: 0.5, row: 2, gridW: 2, gridH: 1, material: "wood", shape: "rectangle" },
  ],

  pigs: [{ col: 0.5, row: 2.5, size: "SMALL" }],

  slingshot: { col: -10, row: 0 },
  minBirdsToClear: 1,
});
```

**Grid Tips:**

- Row 0 = ground level
- Columns increase to the right
- Half-unit positioning: `col: 0.5` centers between columns 0 and 1
- Star thresholds are auto-calculated based on level composition

### Adding New Materials

1. **Add to enum** in `src/constants/Materials.ts`:

```typescript
export enum BlockMaterial {
  GLASS = "glass",
  // Add your material
  ICE = "ice",
}
```

2. **Configure physics** in `src/config/materials/MaterialPhysicsConfig.ts`:

```typescript
MATERIAL_PHYSICS: {
  ICE: {
    density: 0.001,
    restitution: 0.3,
    friction: 0.1,
    health: 15,
  },
}
```

3. **Add damage multipliers** in `src/config/GameConfig.ts`:

```typescript
DAMAGE_MULTIPLIERS: {
  RED: { ...existing, ICE: 1.0 },
  YELLOW: { ...existing, ICE: 0.8 },
  // etc.
}
```

4. **Add sprites** with damage states:
   - `ice_rectangle_pristine_2x1.png`
   - `ice_rectangle_dented_2x1.png`
   - `ice_rectangle_cracked_2x1.png`

### Adding New Themes

1. **Add to enum** in `src/types/ThemeType.ts`
2. **Configure colors** in `src/config/ThemeConfig.ts`
3. **Add background sprites** to `game-assets/atlases/background.png`
4. **Add music** to audio sprite in `game-assets/audio/sprites/`

---

## Acknowledgments

- [Phaser](https://phaser.io/) - Excellent HTML5 game framework
- [Matter.js](https://brm.io/matter-js/) - Realistic 2D physics engine
- [Kenney](https://www.kenney.nl/) - Beautiful game assets and fonts
- [Vite](https://vitejs.dev/) - Lightning-fast build tool
