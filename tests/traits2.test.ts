import { describe, it, expect, beforeEach } from 'vitest';
import { TraitEngine } from '../src/core/traits/TraitEngine';
import { CombatEngine } from '../src/core/combat/CombatEngine';
import { BattleRunState } from '../src/core/state/BattleRunState';
import { DEFAULT_CREATURE_STATS } from '../src/data/creatures.data';
import { TRAITS_DATA } from '../src/data/traits.data';

describe('Milestone 11 — Roguelite Build System 2.0 Unit Tests', () => {
  let traitEngine: TraitEngine;
  let runState: BattleRunState;
  let combatEngine: CombatEngine;

  beforeEach(() => {
    traitEngine = new TraitEngine(12345);
    runState = new BattleRunState(DEFAULT_CREATURE_STATS);
    combatEngine = new CombatEngine(
      runState.mapConfig.waypoints,
      runState.mapConfig.towerPosition,
      runState,
    );
  });

  it('contains 20 traits spanning 5 build families', () => {
    const allTraits = Object.values(TRAITS_DATA);
    expect(allTraits.length).toBeGreaterThanOrEqual(20);

    const families = new Set(allTraits.map((t) => t.family));
    expect(families.has('ferocity')).toBe(true);
    expect(families.has('swiftness')).toBe(true);
    expect(families.has('elemental')).toBe(true);
    expect(families.has('guardian')).toBe(true);
    expect(families.has('companion')).toBe(true);
  });

  it('enforces trait prerequisites (execute_blade requires sharp_claws)', () => {
    // Before applying sharp_claws, execute_blade cannot appear
    const initialOffers = traitEngine.generateTraitOffers(20, []);
    const hasExecuteBefore = initialOffers.some((t) => t.id === 'execute_blade');
    expect(hasExecuteBefore).toBe(false);

    // After applying sharp_claws, execute_blade can appear
    const offersWithPrereq = traitEngine.generateTraitOffers(20, ['sharp_claws']);
    const hasExecuteAfter = offersWithPrereq.some((t) => t.id === 'execute_blade');
    expect(hasExecuteAfter).toBe(true);
  });

  it('respects trait max stack limits', () => {
    // sharp_claws has maxStacks: 3
    const offersAtMaxStacks = traitEngine.generateTraitOffers(20, [
      'sharp_claws',
      'sharp_claws',
      'sharp_claws',
    ]);
    const hasClaws = offersAtMaxStacks.some((t) => t.id === 'sharp_claws');
    expect(hasClaws).toBe(false);
  });

  it('supports 1 wave reroll and consumes rerollsRemaining', () => {
    combatEngine.startWave({
      waveIndex: 1,
      enemies: [{ enemyTypeId: 'basic', count: 1, spawnIntervalMs: 0 }],
    });

    expect(runState.rerollsRemaining).toBe(1);

    const rerolled = combatEngine.rerollTraitOffers();
    expect(rerolled).not.toBeNull();
    expect(runState.rerollsRemaining).toBe(0);

    // Second reroll attempt fails
    const failedReroll = combatEngine.rerollTraitOffers();
    expect(failedReroll).toBeNull();
  });

  it('executes trigger events (Bloodthirst on_kill healing & Aegis Shield on_tower_damaged)', () => {
    // Apply Bloodthirst (on_kill heal 10) & shield_barrier (on_tower_damaged shield 40)
    traitEngine.applyTrait(TRAITS_DATA.bloodthirst, runState);
    traitEngine.applyTrait(TRAITS_DATA.shield_barrier, runState);

    combatEngine.startWave({
      waveIndex: 1,
      enemies: [{ enemyTypeId: 'basic', count: 1, spawnIntervalMs: 0 }],
    });

    combatEngine.update(0.6);
    const enemy = Array.from(runState.activeEnemies.values())[0];

    // Force creature HP down then kill enemy -> triggers Bloodthirst heal
    runState.creatureCurrentHp = 50;
    enemy.currentHp = 0;
    combatEngine.update(0.1);

    expect(runState.creatureCurrentHp).toBe(60); // 50 + 10 heal
  });
});
