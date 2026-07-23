# Roguelite Pets - Development Milestones

## Phase 1 — Vertical Slice Prototype

### Milestone 1 — Project Foundation
- [x] Phaser 3 + TypeScript + Vite project setup.
- [x] ESLint, Prettier, and Vitest configuration.
- [x] Responsive canvas resolution & scaling manager (Desktop + Mobile Landscape).
- [x] Scene skeleton setup: BootScene, PreloadScene, HabitatScene, DefenseScene.
- [x] Scene transitions and UI container overlays.
- [x] Geometric placeholder graphics generator for pet, enemies, tower, and background.
- [x] Basic automated smoke tests validating core event bus and state initialization.
- [x] Project documentation (`AGENTS.md`, `README.md`, `milestones.md`).

### Milestone 2 — Combat Sandbox
- [x] Fixed path tile/coordinate system for defense map.
- [x] Central structure (Tower) with HP and damage handling.
- [x] Enemy spawning pipeline along fixed path (3 placeholder enemy types).
- [x] Autonomous creature pathfinding/patrol logic around central structure.
- [x] Auto-targeting system for nearest enemy in attack range.
- [x] Normal creature attack execution & hit detection.
- [x] Enemy destruction and basic wave completion criteria.

### Milestone 3 — Roguelite Progression
- [x] Experience points system for creature during runs.
- [x] Wave end trigger -> Trait selection phase (`TRAIT_SELECTION`).
- [x] Seeded deterministic RNG engine for trait generation (`SeededRandom`).
- [x] 3 random trait choices offered per wave clear.
- [x] Trait application system (stat boosts, special attacks, attack speed buffs).
- [x] Creature special ability implementation.

### Milestone 4 — Habitat & Pet Care
- [x] Habitat phase (`HABITAT`) state management.
- [x] Pet stats: Hunger (0-100) and Affection (0-100).
- [x] Feed interaction: Consumes food item, reduces hunger, increases affection.
- [x] Pet interaction: Direct tapping/rubbing pet, increases affection.
- [x] Simple pet visual states & micro-animations (idle, happy, hungry).
- [x] Care-to-Combat bonus: High affection/full belly grants stat multipliers during defense runs.

### Milestone 5 — RPG Loot & Equipment
- [x] Enemy coin drops on defeat + coin collection mechanic.
- [x] Loot drop table system (coins + equipment drops based on enemy type).
- [x] Single equipment slot system (Accessory slot).
- [x] Core inventory data structure and equipment stat modifiers.
- [x] Habitat UI for equipping, unequipping, and viewing pet stats.

### Milestone 6 — Complete Vertical Slice
- [x] 5-Wave defense run loop with increasing difficulty.
- [x] Explicit game phases: `HABITAT`, `PREPARATION`, `DEFENSE`, `LOOT`, `TRAIT_SELECTION`, `RESULTS`.
- [x] Victory (Wave 5 clear) and Defeat (Tower destroyed) conditions.
- [x] End-of-run Results screen displaying summary stats, coins gained, and permanent EXP.
- [x] Versioned local storage save/load system (`SaveManager`).
- [x] Temporary developer test controls (instant win, add coins, trigger level up).
- [x] Game balancing pass for waves, enemy health, damage, and traits.

### Milestone 7 — Presentation & Polish
- [x] High-contrast clean vector/sprite placeholders.
- [x] Web Audio API SFX implementation (`SoundEngine` - attacks, hits, coin pickup, pet sounds).
- [x] Audio mute/unmute toggle controls.
- [x] Particle systems (floating care popups, hit impacts, enemy death bursts).
- [x] Screen shake camera effects on damage.
- [x] Onboarding tutorial modal overlay.

---

## Phase 2 — Playable Alpha Roadmap

### Milestone 8 — Vertical Slice Hardening
- [x] Centralised, idempotent run reward settlement (`RunRewardSettlementService`).
- [x] Guaranteed one-time enemy death rewards (`rewardGranted` & lifecycle state).
- [x] Proper handling for every trait effect type (`special_ability` unlock, `moveSpeed` patrol scaling, `creatureMaxHp`).
- [x] Preserve all save fields during partial updates (`SaveManager.updateSaveData`).
- [x] Implement save schema version 2 and migration tests.
- [x] Replace hard-coded total-wave UI values with values derived from `WAVES_DATA.length`.
- [x] Add explicit `tutorialCompleted` save flag instead of inventory inference.
- [x] Add regression unit tests for reward settlement, death rewards, trait unlocks, and save schema migrations.

### Milestone 9 — Data-Driven Combat 2.0
- [x] Typed definitions for `MapConfig`, `TowerConfig`, `CreatureCombatConfig`, `AbilityConfig`, `EnemyBehaviourConfig`, `StatusEffectConfig`.
- [x] Creature current HP & downed state handling (5-second revive timer).
- [x] Enemy behavior variations:
  - Fast runners (`Shadow Runner`) ignoring pet to rush tower.
  - Tanks (`Void Golem`) stopping to attack pet (`fight_creature`).
  - Ranged enemies attacking from path.
- [x] Patrol & interception speed driven by creature `moveSpeed`.
- [x] Targeting modes: Nearest, Closest to tower, Lowest HP, Highest threat.
- [x] Status effects engine: Slow, Burn, Poison, Stun, Shield.
- [x] Data-driven normal & special abilities (`abilities.data.ts`).
- [x] Developer pause, resume, and game speed controls (1x, 2x, 4x).
- [x] Exit condition: New ability, enemy behavior, or map addable primarily through typed data without modifying `CombatEngine`.

### Milestone 10 — Creature Identity, Level and Evolution Framework
- [x] Separate `CreatureSpeciesConfig` from `OwnedCreature` saved state.
- [x] Initial 3 starter creatures with distinct roles:
  - **Guardian** (`Ironback Slime`): High HP, short range, taunts/blocks, benefits strongly from affection.
  - **Spark** (`Ember Sprite`): Ranged attacks, fire blast, lower HP, benefits from full belly.
  - **Prowler** (`Shadow Stalker`): Fast interception, critical hits/attack-speed builds.
- [x] EXP level-up thresholds & multi-level run resolution (`CreatureEngine.addExpToCreature`).
- [x] Stat growth curves per level.
- [x] Evolution prerequisites (Level 5+) and Stage 2 evolutions (`Aegis Titan`, `Infernal Drake`, `Void Specter`).
- [x] Save schema version 3 migration (`ownedCreatures`, `activeCreatureInstanceId`).
- [x] Exit condition: 3 creatures require noticeably different combat decisions and stat scaling.

### Milestone 11 — Roguelite Build System 2.0
- [x] Expanded trait triggers: `on_hit`, `on_kill`, `on_critical`, `on_special`, `on_tower_damaged`, `periodic`, `status_application`, `ability_modifier`, `conditional_stat`, `tower_support`.
- [x] 5 core build families: Ferocity, Swiftness, Elemental, Guardian, Companion.
- [x] Trait tags, stack limits, prerequisites, and upgrade chains.
- [x] Weighted rarity drafting, duplicate protection, 1 reroll per wave (`🎲 REROLL (1)`).
- [x] Current-build HUD panel & run seed display in DefenseScene (`Seed: #12345`).
- [x] Target pool of 20 traits across 5 build families.
- [x] Exit condition: At least 4 recognisably different builds viable across repeated runs.

### Milestone 12 — Maps, Enemies and Boss Encounter
- [x] Map 1 — Heartwood Clearing (Single winding path).
- [x] Map 2 — Moonlit Crossing (Dual merging spawn tracks).
- [x] Expanded enemy roster (6 types): Gloom Beetle, Shadow Runner, Void Golem, Gloom Spitter (ranged), Shadow Wisp (slow disruptor), Abyssal Saboteur (stealth tower rusher).
- [x] Boss encounter: Two-Phase `Void Sovereign` boss with phase 2 enrage (+50% speed), minion spawns, and AoE telegraph burst warning circles.
- [x] Map Selection modal in HabitatScene before launching defense run.

### Milestone 13 — Habitat, Equipment and Economy 2.0
- [x] Food Inventory & Food Shop (`basic_kibble`, `gourmet_treat` +10% EXP buff, `energy_berry` +15% Speed buff).
- [x] Petting Cooldown & Diminishing Returns mood tracking (`Happy`, `Neutral`, `Tired`).
- [x] 3 Equipment Slots: Collar, Charm, Toy (`EquipmentEngine.getEquippedItems`).
- [x] Item Selling for coins (50% value refund) in Inventory panel.
- [x] Save schema version 4 migration (`foodInventory`, `activeNextRunBuff`).

### Milestone 14 — Alpha UX, Accessibility and Playtesting
- [x] Title screen & Main menu (`TitleScene` with Play Game, Settings, How to Play, Credits).
- [x] Settings menu & audio controls (Master volume slider, Audio Mute toggle, Screen Shake toggle, Reduced Motion toggle).
- [x] Touch target parity (min 44px height) & Keyboard accessibility (`SPACE` to pause, `1`-`3` to select traits, `R` to reroll, `ENTER` to play).
- [x] GitHub Actions CI pipeline (`.github/workflows/ci.yml` running lint, format, test, and build).

---

## Phase 3 — Closed Beta and Productisation

### Milestone 15 — Phase 2 Certification and Correctness
- [x] Replace legacy hunger/fullness bridge with canonical `fullness` care model.
- [x] Correct V1–V4 save migrations & backward compatibility tests.
- [x] Apply and consume next-run food buffs (+10% EXP, +15% Speed) exactly once per treat.
- [x] Wire all trait effects (`multi_beam`, `chain_lightning`, `full_belly_fury`, `heart_bond`, `protective_rage`, `elemental_overload`).
- [x] Wire enemy & boss combat behaviors (Shadow Wisp slow status on hit & Void Sovereign boss melee attack loop).
- [x] Repair `highest_threat` targeting mode to inspect nested `config.damageToTower`.
- [x] Implement explicit run abort reward policy in `DefenseScene` (keep partial coins/EXP earned up to abort).
- [x] Synchronise persisted settings with `SoundEngine` on startup.
- [x] Fix volume label display string interpolation in `TitleScene`.
- [x] Verify every interactive button against 44px minimum touch-target requirement.
- [x] Comprehensive test suite covering every food item, trait effect, ability, and enemy behavior.
- [x] End-to-end integration test (`tests/full_run_integration.test.ts`) covering `HabitatScene` -> `DefenseScene` -> `Results` -> `SaveManager`.

### Milestone 16 — Architecture Refactor and Content Validation
- [x] Extract feature controllers & UI components (`HabitatController`, `RunController`, `CarePanel`, `CreatureRosterPanel`, `FoodShopPanel`, `EquipmentPanel`, `MapSelectionPanel`, `CombatRenderer`, `CombatHUD`, `TraitDraftPanel`, `BossPresentation`, `ResultsPanel`).
- [x] Add domain services (`CareService`, `ShopService`, `RunPreparationService`, `InventoryService`, `EvolutionService`, `SettingsCoordinator`).
- [x] Implement startup content validation checking all data definitions (`ContentValidationService` in `PreloadScene`).
- [x] Unit test suites (`tests/content_validation.test.ts` & `tests/services_architecture.test.ts`).
- [x] Exit condition achieved: Scenes orchestrate input and rendering but do not directly perform economy, progression, or care calculations.

### Milestone 17 — True Creature Combat Kits
- [x] **Guardian**: Short-range `impact_bash` attack, `guardian_taunt` behaviour, `aegis_barrier` shield pulse.
- [x] **Spark**: Long-range `fire_bolt` attack, `spark_caster` splash burn, `fire_blast` explosion.
- [x] **Prowler**: Fast precision `shadow_strike` attack, `prowler_interceptor` targeting runners/saboteurs, `shadow_dash` multi-strike.
- [x] Wired combat identity fields through `BattleRunState` (`speciesId`, `attackId`, `abilityId`, `behaviourStyle`, `evolutionStage`, `personalityTraits`).
- [x] Exit condition achieved: Distinct visual attacks, ranges, targeting preferences, and special abilities make every creature identifiable without HUD.

### Milestone 18 — Run Director and Replayability
- [x] Authored run structure & encounter configs (`RunDirector.ts` with `normal`, `elite`, `rest`, `boss` nodes).
- [x] Difficulty tiers (`Normal`, `Challenging`, `Guardian` scaling enemy HP, damage, and rewards).
- [x] Seed entry & replayability in Map Selection modal.
- [x] Run History tracking in `SaveManager` (`runHistory`).
- [x] Map 3 — `Volcanic Ridge` with triple converging assault paths.
- [x] Boss mechanics with phase 2 enrage, minion summoning, and telegraph warning graphics.

### Milestone 19 — Meaningful Meta-Progression
- [ ] Trait unlock progression through creature levels, victories, and evolutions.
- [ ] Equipment discovery, map/difficulty unlocks, species mastery tracks, save export/import.

### Milestone 20 — Production Visual and Audio Pass
- [ ] Sprite atlas pipeline & animation state machine (idle, move, attack, special, hurt, downed, happy, eating, evolving).
- [ ] Object pooling for projectiles & VFX, audio buses (music, SFX, master volume).

### Milestone 21 — Balance, Performance and Accessibility
- [ ] Headless deterministic run simulator for automated balancing & win-rate reporting.
- [ ] Mobile-browser performance profiling, responsive HUD, colorblind-safe rarity indicators.

### Milestone 22 — Release Engineering and Closed Beta
- [ ] Playwright browser E2E tests, visual regression screenshots, automated smoke test.
- [ ] Production build size report, diagnostic report downloader, release tag `v0.3.0-beta.1`.
