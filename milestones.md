# Roguelite Pets - Development Milestones

## Milestone 1 — Project Foundation
- [ ] Phaser 3 + TypeScript + Vite project setup.
- [ ] ESLint, Prettier, and Vitest configuration.
- [ ] Responsive canvas resolution & scaling manager (Desktop + Mobile Landscape).
- [ ] Scene skeleton setup: BootScene, PreloadScene, HabitatScene, DefenseScene.
- [ ] Scene transitions and UI container overlays.
- [ ] Geometric placeholder graphics generator for pet, enemies, tower, and background.
- [ ] Basic automated smoke tests validating core event bus and state initialization.
- [ ] Project documentation (`AGENTS.md`, `README.md`, `milestones.md`).

## Milestone 2 — Combat Sandbox
- [ ] Fixed path tile/coordinate system for defense map.
- [ ] Central structure (Tower) with HP and damage handling.
- [ ] Enemy spawning pipeline along fixed path (3 placeholder enemy types).
- [ ] Autonomous creature pathfinding/patrol logic around central structure.
- [ ] Auto-targeting system for nearest enemy in attack range.
- [ ] Normal creature attack execution & hit detection.
- [ ] Enemy destruction and basic wave completion criteria.

## Milestone 3 — Roguelite Progression
- [ ] Experience points system for creature during runs.
- [ ] Wave end trigger -> Trait selection phase (`TRAIT_SELECTION`).
- [ ] Seeded deterministic RNG engine for trait generation.
- [ ] 3 random trait choices offered per wave clear.
- [ ] Trait application system (stat boosts, special attacks, attack speed buffs).
- [ ] Creature special ability implementation.

## Milestone 4 — Habitat & Pet Care
- [ ] Habitat phase (`HABITAT`) state management.
- [ ] Pet stats: Hunger (0-100) and Affection (0-100).
- [ ] Feed interaction: Consumes food item, reduces hunger, increases affection.
- [ ] Pet interaction: Direct tapping/rubbing pet, increases affection.
- [ ] Simple pet visual states & micro-animations (idle, happy, hungry).
- [ ] Care-to-Combat bonus: High affection/full belly grants stat multipliers during defense runs.

## Milestone 5 — RPG Loot & Equipment
- [ ] Enemy coin drops on defeat + coin collection mechanic.
- [ ] Loot drop table system (coins + equipment drops based on enemy type).
- [ ] Single equipment slot system (e.g., Weapon or Collar).
- [ ] Core inventory data structure and equipment stat modifiers.
- [ ] Habitat UI for equipping, unequipping, and viewing pet stats.

## Milestone 6 — Complete Vertical Slice
- [ ] 5-Wave defense run loop with increasing difficulty.
- [ ] Explicit game phases: `HABITAT`, `PREPARATION`, `DEFENSE`, `LOOT`, `TRAIT_SELECTION`, `RESULTS`.
- [ ] Victory (Wave 5 clear) and Defeat (Tower destroyed) conditions.
- [ ] End-of-run Results screen displaying summary stats, coins gained, and permanent EXP.
- [ ] Versioned local storage save/load system (`SaveManager`).
- [ ] Temporary developer test controls (instant win, add coins, trigger level up).
- [ ] Game balancing pass for waves, enemy health, damage, and traits.

## Milestone 7 — Presentation & Polish
- [ ] High-contrast clean vector/sprite placeholders or SVG-rendered textures.
- [ ] Web Audio API SFX implementation (attacks, hits, coin pickup, pet sounds).
- [ ] Background music loops (Habitat ambient & Defense action theme).
- [ ] Particle systems (pet affection hearts, hit impacts, enemy death bursts).
- [ ] Screen shake & hit flash camera effects.
- [ ] Interactive tooltips for traits, stats, and equipment.
- [ ] Quick interactive onboarding tutorial.
