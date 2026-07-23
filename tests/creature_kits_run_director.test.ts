import { describe, it, expect } from 'vitest';
import { SPECIES_DATA } from '../src/data/species.data';
import { ABILITIES_DATA } from '../src/data/abilities.data';
import { BattleRunState } from '../src/core/state/BattleRunState';
import { RunDirector } from '../src/core/director/RunDirector';
import { MAPS_DATA } from '../src/data/maps.data';
import { TargetingEngine } from '../src/core/combat/TargetingEngine';
import { DEFAULT_CREATURE_STATS } from '../src/data/creatures.data';

describe('Milestones 17 & 18 — Creature Combat Kits & Run Director Unit Tests', () => {
  it('Milestone 17: Guardian, Spark, and Prowler have distinct combat kit identities', () => {
    const guardian = SPECIES_DATA.guardian_blob;
    const spark = SPECIES_DATA.spark_fox;
    const prowler = SPECIES_DATA.prowler_lynx;

    expect(guardian.attackId).toBe('impact_bash');
    expect(guardian.abilityId).toBe('aegis_barrier');

    expect(spark.attackId).toBe('fire_bolt');
    expect(spark.abilityId).toBe('fire_blast');

    expect(prowler.attackId).toBe('shadow_strike');
    expect(prowler.abilityId).toBe('shadow_dash');

    // Verify ability configs exist in ABILITIES_DATA
    expect(ABILITIES_DATA[guardian.attackId]).toBeDefined();
    expect(ABILITIES_DATA[spark.attackId]).toBeDefined();
    expect(ABILITIES_DATA[prowler.attackId]).toBeDefined();
  });

  it('Milestone 17: BattleRunState binds creature combat kit fields cleanly', () => {
    const runState = new BattleRunState(DEFAULT_CREATURE_STATS, 'volcanic_ridge', 'prowler_lynx');

    expect(runState.speciesId).toBe('prowler_lynx');
    expect(runState.attackId).toBe('shadow_strike');
    expect(runState.abilityId).toBe('shadow_dash');
    expect(runState.behaviourStyle).toBe('prowler_interceptor');
  });

  it('Milestone 17: TargetingEngine prioritizes fast runners and saboteurs for Prowler role', () => {
    const enemies = [
      {
        instanceId: 'e1',
        x: 100,
        y: 100,
        currentHp: 50,
        maxHp: 50,
        distanceCovered: 10,
        config: { id: 'basic' },
      },
      {
        instanceId: 'e2',
        x: 100,
        y: 100,
        currentHp: 50,
        maxHp: 50,
        distanceCovered: 5,
        config: { id: 'saboteur' },
      },
    ];

    const target = TargetingEngine.selectTarget(100, 100, 200, enemies, 'closest_to_tower');
    expect(target?.instanceId).toBe('e2');
  });

  it('Milestone 18: RunDirector generates authored encounter paths and difficulty multipliers', () => {
    const diffNormal = RunDirector.getDifficultyMultipliers('normal');
    const diffGuardian = RunDirector.getDifficultyMultipliers('guardian');

    expect(diffGuardian.hpMult).toBeGreaterThan(diffNormal.hpMult);

    const path = RunDirector.generateEncounterPath(12345, 'challenging');
    expect(path).toHaveLength(5);
    expect(path[4][0].type).toBe('boss');
  });

  it('Milestone 18: Map 3 Volcanic Ridge is defined with triple converging routes', () => {
    const map3 = MAPS_DATA.volcanic_ridge;
    expect(map3).toBeDefined();
    expect(map3.waypoints).toBeDefined();
    expect(map3.secondaryWaypoints).toBeDefined();
  });
});
