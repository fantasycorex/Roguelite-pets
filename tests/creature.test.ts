import { describe, it, expect, beforeEach } from 'vitest';
import { CreatureEngine } from '../src/core/creature/CreatureEngine';
import { SaveManager, CURRENT_SAVE_SCHEMA_VERSION } from '../src/core/save/SaveManager';
import { SPECIES_DATA } from '../src/data/species.data';
import { OwnedCreature } from '../src/types/creature';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

describe('Milestone 10 — Creature Identity, Level and Evolution Unit Tests', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('defines 3 distinct combat species roles (Guardian, Spark, Prowler)', () => {
    expect(SPECIES_DATA.guardian_blob.role).toBe('guardian');
    expect(SPECIES_DATA.spark_fox.role).toBe('spark');
    expect(SPECIES_DATA.prowler_lynx.role).toBe('prowler');

    // Guardian has highest HP
    expect(SPECIES_DATA.guardian_blob.baseStats.maxHp).toBeGreaterThan(
      SPECIES_DATA.spark_fox.baseStats.maxHp,
    );
    // Spark has highest range
    expect(SPECIES_DATA.spark_fox.baseStats.attackRange).toBeGreaterThan(
      SPECIES_DATA.prowler_lynx.baseStats.attackRange,
    );
    // Prowler has highest moveSpeed
    expect(SPECIES_DATA.prowler_lynx.baseStats.moveSpeed).toBeGreaterThan(
      SPECIES_DATA.guardian_blob.baseStats.moveSpeed,
    );
  });

  it('resolves multi-level gains accurately from run EXP', () => {
    const creature: OwnedCreature = {
      instanceId: 'c_test',
      speciesId: 'spark_fox',
      nickname: 'Sparky',
      level: 1,
      currentExp: 0,
      evolutionStage: 1,
      affection: 50,
      fullness: 80,
      personalityTraits: [],
      equippedItems: {},
    };

    // 100 EXP needed for Lv 2, 120 EXP needed for Lv 3 -> Total 220
    const result = CreatureEngine.addExpToCreature(creature, 350);

    expect(result.levelsGained).toBeGreaterThanOrEqual(2);
    expect(creature.level).toBeGreaterThanOrEqual(3);
  });

  it('scales stats proportionally with level growth curves', () => {
    const creatureLv1: OwnedCreature = {
      instanceId: 'c_1',
      speciesId: 'guardian_blob',
      nickname: 'Guardian',
      level: 1,
      currentExp: 0,
      evolutionStage: 1,
      affection: 50,
      fullness: 80,
      personalityTraits: [],
      equippedItems: {},
    };

    const statsLv1 = CreatureEngine.getEffectiveStats(creatureLv1);

    const creatureLv5 = { ...creatureLv1, level: 5 };
    const statsLv5 = CreatureEngine.getEffectiveStats(creatureLv5);

    expect(statsLv5.maxHp).toBe(statsLv1.maxHp + 25 * 4); // +25 per level offset
    expect(statsLv5.attackDamage).toBe(statsLv1.attackDamage + 3 * 4);
  });

  it('validates evolution prerequisites and transforms species to Stage 2', () => {
    const creature: OwnedCreature = {
      instanceId: 'c_evo',
      speciesId: 'guardian_blob',
      nickname: 'Ironback Slime',
      level: 4,
      currentExp: 0,
      evolutionStage: 1,
      affection: 50,
      fullness: 80,
      personalityTraits: [],
      equippedItems: {},
    };

    expect(CreatureEngine.canEvolve(creature)).toBe(false);

    creature.level = 5;
    expect(CreatureEngine.canEvolve(creature)).toBe(true);

    const evolved = CreatureEngine.evolveCreature(creature);
    expect(evolved).toBe(true);
    expect(creature.speciesId).toBe('guardian_titan');
    expect(creature.evolutionStage).toBe(2);
    expect(CreatureEngine.canEvolve(creature)).toBe(false);
  });

  it('migrates save schema V2 to V3 with 3 owned creatures', () => {
    const v2Data = {
      version: 2,
      creatureProfile: {
        id: 'blobby_01',
        name: 'Blobby',
        level: 3,
        currentExp: 40,
        hunger: 10,
        affection: 80,
        lastCareTimestamp: Date.now(),
        equippedItemId: 'wooden_collar',
        baseStats: SPECIES_DATA.guardian_blob.baseStats,
      },
      inventory: ['wooden_collar'],
      totalCoins: 120,
      unlockedTraits: ['sharp_claws'],
      tutorialCompleted: true,
    };

    const migrated = SaveManager.migrateSaveData(v2Data);
    expect(migrated.version).toBe(CURRENT_SAVE_SCHEMA_VERSION);
    expect(migrated.ownedCreatures.length).toBe(3);
    expect(migrated.ownedCreatures[0].level).toBe(3);
    expect(migrated.ownedCreatures[0].affection).toBe(80);
  });
});
