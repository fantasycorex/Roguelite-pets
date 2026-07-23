# AGENTS.md - Project Guidelines & Boundaries

## Project Overview
**Roguelite Pets** is a small 2D web-first game combining digital-pet care (feeding, petting, hunger, affection), roguelite progression (wave traits, seeded RNG), tower defense (pathing enemies, central tower structure, autonomous patrolling pet), RPG progression (coins, equipment drops, leveling), and light idle convenience.

## Architecture Boundaries
1. **Core Logic Decoupling**: All combat, calculations, state transitions, pet logic, equipment, traits, and save data must exist in pure, framework-agnostic TypeScript modules inside `src/core/`.
2. **Thin Phaser Scenes**: Phaser scenes in `src/scenes/` handle only input capture, visual rendering, animations, and sound. Scenes MUST NOT contain domain logic or combat math directly.
3. **Event-Driven Communication**: Communication between core engine state and Phaser rendering/UI occurs through a lightweight EventBus (`src/core/events/EventBus.ts`).
4. **Data-Driven Definitions**: Content (creatures, enemies, traits, equipment, waves) is specified strictly via typed data config files in `src/data/`. No hard-coding magic numbers in scenes.
5. **No Global Mutable State**: State is held within structured state managers passed explicitly or accessed via state container singletons with controlled mutators.
6. **Persistence Abstraction**: Use a versioned save-data schema (`src/core/save/SaveManager.ts`) stored in `localStorage`. Include schema versioning for backward compatibility.

## Tech Stack & Tooling
- **Framework**: Phaser 3 (2D Rendering, Input, Scene Management)
- **Language**: TypeScript (Strict mode enabled)
- **Build Tool**: Vite
- **Testing**: Vitest (Unit tests for pure non-visual TS engine logic)
- **Code Quality**: ESLint + Prettier

## Commands
- `npm run dev`: Start Vite development server
- `npm run build`: Build production assets (`tsc && vite build`)
- `npm run preview`: Preview production build locally
- `npm run test`: Run unit tests via Vitest
- `npm run lint`: Run ESLint checks
- `npm run format`: Check formatting with Prettier
- `npm run format:fix`: Fix formatting issues automatically

## Out-of-Scope Features (Do Not Implement)
- Multiplayer / Online features
- User Authentication / Accounts
- Cloud Saves
- Breeding mechanics
- Procedural map generation
- Multiple active creatures in combat simultaneously
- Real-money purchases / Microtransactions
- Advertisements
- Daily missions or timed login incentives
- Social / Guild systems
- Native mobile packaging (Capacitor/Cordova)
- Complex crafting trees
- Advanced offline / AFK simulation
- High-fidelity production artwork (use geometric shapes or simple generated canvas primitives)
