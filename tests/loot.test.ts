import { describe, it, expect, beforeEach } from 'vitest';
import { EquipmentEngine } from '../src/core/equipment/EquipmentEngine';
import { LootEngine } from '../src/core/loot/LootEngine';
import { SeededRandom } from '../src/core/utils/SeededRandom';
import { ENEMIES_DATA } from '../src/data/enemies.data';
import { OwnedCreature } from '../src/types/creature';

describe('EquipmentEngine Unit Tests', () => {
  let creature: OwnedCreature;
  let inventory: string[];

  beforeEach(() => {
    creature = {
      instanceId: 'c_test',
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
    inventory = ['wooden_collar', 'spiked_collar'];
  });

  it('equipItem equips item from inventory onto pet', () => {
    const success = EquipmentEngine.equipItem(creature, inventory, 'wooden_collar');

    expect(success).toBe(true);
    expect(creature.equippedItems.collar).toBe('wooden_collar');
    expect(inventory).toEqual(['spiked_collar']);
  });

  it('equipItem swaps existing equipped item back to inventory', () => {
    EquipmentEngine.equipItem(creature, inventory, 'wooden_collar');
    EquipmentEngine.equipItem(creature, inventory, 'spiked_collar');

    expect(creature.equippedItems.collar).toBe('spiked_collar');
    expect(inventory).toContain('wooden_collar');
  });

  it('unequipItem removes equipped item and moves to inventory', () => {
    EquipmentEngine.equipItem(creature, inventory, 'wooden_collar');
    const success = EquipmentEngine.unequipItem(creature, inventory, 'collar');

    expect(success).toBe(true);
    expect(creature.equippedItems.collar).toBeNull();
    expect(inventory).toContain('wooden_collar');
  });

  it('getEffectiveStats calculates base stats + equipped bonuses', () => {
    EquipmentEngine.equipItem(creature, inventory, 'wooden_collar'); // +15 Max HP, +5 Attack Damage
    const stats = EquipmentEngine.getEffectiveStats(creature);

    expect(stats.maxHp).toBe(115);
    expect(stats.attackDamage).toBe(20);
  });
});

describe('LootEngine Unit Tests', () => {
  it('rollLoot returns coin and exp rewards from enemy config', () => {
    const rng = new SeededRandom(12345);
    const drop = LootEngine.rollLoot(ENEMIES_DATA.basic, rng, 0); // 0% drop chance

    expect(drop.coins).toBe(ENEMIES_DATA.basic.coinReward);
    expect(drop.exp).toBe(ENEMIES_DATA.basic.expReward);
    expect(drop.equipment).toBeNull();
  });

  it('rollLoot returns equipment drop when roll succeeds', () => {
    const rng = new SeededRandom(12345);
    const drop = LootEngine.rollLoot(ENEMIES_DATA.basic, rng, 100); // 100% drop chance

    expect(drop.equipment).not.toBeNull();
    expect(drop.equipment?.slot).toBe('collar');
  });
});
