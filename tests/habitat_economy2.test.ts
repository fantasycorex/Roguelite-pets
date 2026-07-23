import { describe, it, expect, beforeEach } from 'vitest';
import { EquipmentEngine } from '../src/core/equipment/EquipmentEngine';
import { PetCareEngine } from '../src/core/pet/PetCareEngine';
import { SaveManager, CURRENT_SAVE_SCHEMA_VERSION } from '../src/core/save/SaveManager';
import { FOOD_DATA } from '../src/data/food.data';
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

describe('Milestone 13 — Habitat, Equipment & Economy 2.0 Unit Tests', () => {
  beforeEach(() => {
    localStorageMock.clear();
    PetCareEngine.resetPettingCooldown();
  });

  it('defines 3 distinct food types with prices, care restores, and buffs', () => {
    expect(FOOD_DATA.basic_kibble.price).toBe(10);
    expect(FOOD_DATA.gourmet_treat.price).toBe(25);
    expect(FOOD_DATA.energy_berry.price).toBe(30);

    expect(FOOD_DATA.gourmet_treat.buffEffect?.type).toBe('exp_buff');
    expect(FOOD_DATA.energy_berry.buffEffect?.type).toBe('speed_buff');
  });

  it('equips items across 3 slots (collar, charm, toy) and aggregates stat bonuses', () => {
    const creature: OwnedCreature = {
      instanceId: 'c_test_equip',
      speciesId: 'guardian_blob',
      nickname: 'Slime',
      level: 1,
      currentExp: 0,
      evolutionStage: 1,
      affection: 50,
      fullness: 80,
      personalityTraits: [],
      equippedItems: { collar: null, charm: null, toy: null },
    };

    const inventory = ['spiked_collar', 'swift_bell', 'magic_yarn'];

    // Equip Collar
    EquipmentEngine.equipItem(creature, inventory, 'spiked_collar');
    expect(creature.equippedItems.collar).toBe('spiked_collar');

    // Equip Charm
    EquipmentEngine.equipItem(creature, inventory, 'swift_bell');
    expect(creature.equippedItems.charm).toBe('swift_bell');

    // Equip Toy
    EquipmentEngine.equipItem(creature, inventory, 'magic_yarn');
    expect(creature.equippedItems.toy).toBe('magic_yarn');

    // Inventory should be empty after equipping all 3
    expect(inventory.length).toBe(0);

    // Calculate effective stats with all 3 items
    const baseStats = {
      maxHp: 100,
      attackDamage: 10,
      attackSpeed: 1.0,
      attackRange: 100,
      moveSpeed: 100,
      specialCooldown: 8.0,
    };

    const effective = EquipmentEngine.getEffectiveStats(creature, baseStats);

    // spiked_collar (+12 Atk), magic_yarn (+15 Atk) -> +27 Atk
    expect(effective.attackDamage).toBe(37);
  });

  it('sells inventory items for 50% coin value refund', () => {
    const inventory = ['titan_collar', 'phoenix_feather'];

    // titan_collar sellValue is 45
    const value1 = EquipmentEngine.sellItem(inventory, 'titan_collar');
    expect(value1).toBe(45);
    expect(inventory).toEqual(['phoenix_feather']);

    // phoenix_feather sellValue is 50
    const value2 = EquipmentEngine.sellItem(inventory, 'phoenix_feather');
    expect(value2).toBe(50);
    expect(inventory.length).toBe(0);
  });

  it('applies diminishing returns on rapid petting and sets mood to Tired', () => {
    const profile = {
      id: 'p_test',
      name: 'Pet',
      level: 1,
      currentExp: 0,
      hunger: 50,
      affection: 50,
      lastCareTimestamp: Date.now(),
      equippedItemId: null,
      baseStats: {
        maxHp: 100,
        attackDamage: 10,
        attackSpeed: 1.0,
        attackRange: 100,
        moveSpeed: 100,
        specialCooldown: 8.0,
      },
    };

    // First pet -> Happy (full gain)
    const pet1 = PetCareEngine.petCreature(profile, 10);
    expect(pet1.mood).toBe('Happy');
    expect(pet1.gainedAffection).toBe(10);

    // Rapid second pet -> Neutral
    const pet2 = PetCareEngine.petCreature(profile, 10);
    expect(pet2.mood).toBe('Neutral');
    expect(pet2.gainedAffection).toBe(5);

    // Rapid third pet -> Tired (diminished gain)
    const pet3 = PetCareEngine.petCreature(profile, 10);
    expect(pet3.mood).toBe('Tired');
    expect(pet3.gainedAffection).toBe(2);
  });

  it('migrates save schema V3 to V4 with foodInventory', () => {
    const v3Data = {
      version: 3,
      activeCreatureInstanceId: 'c_guardian_1',
      ownedCreatures: [],
      inventory: ['wooden_collar'],
      totalCoins: 150,
      unlockedTraits: ['sharp_claws'],
      tutorialCompleted: true,
    };

    const migrated = SaveManager.migrateSaveData(v3Data);
    expect(migrated.version).toBe(CURRENT_SAVE_SCHEMA_VERSION);
    expect(migrated.foodInventory.basic_kibble).toBeGreaterThan(0);
    expect(migrated.totalCoins).toBe(150);
  });
});
