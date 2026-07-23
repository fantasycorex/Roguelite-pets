import { describe, it, expect, beforeEach } from 'vitest';
import { SeededRandom } from '../src/core/utils/SeededRandom';
import { TraitEngine } from '../src/core/traits/TraitEngine';
import { BattleRunState } from '../src/core/state/BattleRunState';
import { DEFAULT_CREATURE_STATS } from '../src/data/creatures.data';
import { TRAITS_DATA } from '../src/data/traits.data';

describe('SeededRandom PRNG Tests', () => {
  it('produces deterministic output sequence for same seed', () => {
    const rng1 = new SeededRandom(12345);
    const rng2 = new SeededRandom(12345);

    const seq1 = [rng1.nextFloat(), rng1.nextFloat(), rng1.nextFloat()];
    const seq2 = [rng2.nextFloat(), rng2.nextFloat(), rng2.nextFloat()];

    expect(seq1).toEqual(seq2);
  });

  it('produces different sequences for different seeds', () => {
    const rng1 = new SeededRandom(12345);
    const rng2 = new SeededRandom(54321);

    expect(rng1.nextFloat()).not.toEqual(rng2.nextFloat());
  });

  it('samples N unique items from array', () => {
    const rng = new SeededRandom(999);
    const pool = ['a', 'b', 'c', 'd', 'e'];
    const sampled = rng.sample(pool, 3);

    expect(sampled.length).toBe(3);
    const unique = new Set(sampled);
    expect(unique.size).toBe(3);
  });
});

describe('TraitEngine Tests', () => {
  let traitEngine: TraitEngine;
  let runState: BattleRunState;

  beforeEach(() => {
    traitEngine = new TraitEngine(12345);
    runState = new BattleRunState(DEFAULT_CREATURE_STATS);
  });

  it('generates 3 unique trait choices', () => {
    const offers = traitEngine.generateTraitOffers(3);
    expect(offers.length).toBe(3);
    const uniqueIds = new Set(offers.map((t) => t.id));
    expect(uniqueIds.size).toBe(3);
  });

  it('applies stat_multiplier trait effect correctly', () => {
    const sharpClaws = TRAITS_DATA.sharp_claws; // +25% attack damage
    const initialDamage = runState.petStats.attackDamage;

    traitEngine.applyTrait(sharpClaws, runState);

    expect(runState.petStats.attackDamage).toBeCloseTo(initialDamage * 1.25);
    expect(runState.activeTraits).toContain('sharp_claws');
  });

  it('applies flat_stat trait effect correctly', () => {
    const vitalitySurge = TRAITS_DATA.vitality_surge; // +30 max HP
    const initialHp = runState.petStats.maxHp;

    traitEngine.applyTrait(vitalitySurge, runState);

    expect(runState.petStats.maxHp).toBe(initialHp + 30);
    expect(runState.activeTraits).toContain('vitality_surge');
  });

  it('calculates modified stats from trait IDs list', () => {
    const modified = traitEngine.calculateModifiedStats(DEFAULT_CREATURE_STATS, [
      'sharp_claws',
      'vitality_surge',
    ]);

    expect(modified.attackDamage).toBeCloseTo(DEFAULT_CREATURE_STATS.attackDamage * 1.25);
    expect(modified.maxHp).toBe(DEFAULT_CREATURE_STATS.maxHp + 30);
  });
});
