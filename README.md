# Roguelite Pets

A 2D web-first game combining digital-pet care, roguelite trait progression, autonomous tower defense, RPG progression, and light idle mechanics.

## Tech Stack
- **Framework**: Phaser 3 (2D rendering & canvas scaling)
- **Language**: TypeScript (Strict mode enabled)
- **Build Tool**: Vite
- **Testing**: Vitest
- **Code Formatting & Linting**: ESLint + Prettier

## Quick Start & Setup

### Prerequisites
- Node.js (v18+)
- npm

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### Verification & Building

#### 1. Type Check & Production Build
```bash
npm run build
```

#### 2. Run Unit Tests
```bash
npm run test
```

#### 3. Run Lint Checks
```bash
npm run lint
```

#### 4. Run Code Formatter Check
```bash
npm run format
```

## Architecture Summary
- **Decoupled Engine Logic**: `src/core/` contains pure TypeScript logic for pet state, game phases, event bus, combat, and persistence.
- **Thin Phaser Rendering**: `src/scenes/` contains Phaser 3 scenes that render canvas graphics, handle animations, and route user input back into the engine via `EventBus`.
- **Responsive Layout**: Designed landscape-first (16:9 base aspect ratio) with automatic fitting for mobile and desktop screens.
