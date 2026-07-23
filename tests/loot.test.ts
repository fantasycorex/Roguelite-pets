import { describe, it, expect, beforeEach } from 'vitest';
import { EquipmentEngine } from '../src/core/equipment/EquipmentEngine';
import { LootEngine } from '../src/core/loot/LootEngine';
import { SeededRandom } from '../src/core/utils/SeededRandom';
import { DEFAULT_CREATURE_PROFILE } from '../src/data/creatures.data';
import { ENEMIES_DATA } from '../src/data/enemies.data';
import { PermanentCreatureProfile } from '../src/types/creature';

describe('EquipmentEngine Unit Tests', () => {
  let profile: PermanentCreatureProfile;
  let inventory: string[];

  beforeEach(() => {
    profile = { ...DEFAULT_CREATURE_PROFILE, equippedItemId: null };
    inventory = ['wooden_collar', 'spiked_collar'];
  });

  it('equipItem equips item from inventory onto pet', () => {
    const success = EquipmentEngine.equipItem(profile, inventory, 'wooden_collar');

    expect(success).toBe(true);
    expect(profile.equippedItemId).toBe('wooden_collar');
    expect(inventory).toEqual(['spiked_collar']);
  });

  it('equipItem swaps existing equipped item back to inventory', () => {
    EquipmentEngine.equipItem(profile, inventory, 'wooden_collar');
    EquipmentEngine.equipItem(profile, inventory, 'spiked_collar');

    expect(profile.equippedItemId).toBe('spiked_collar');
    expect(inventory).toContain('wooden_collar');
  });

  it('unequipItem removes equipped item and moves to inventory', () => {
    EquipmentEngine.equipItem(profile, inventory, 'wooden_collar');
    const success = EquipmentEngine.unequipItem(profile, inventory);

    expect(success).toBe(true);
    expect(profile.equippedItemId).toBeNull();
    expect(inventory).toContain('wooden_collar');
  });

  it('getEffectiveStats calculates base stats + equipped bonuses', () => {
    EquipmentEngine.equipItem(profile, inventory, 'wooden_collar'); // +15 Max HP, +5 Attack Damage
    const stats = EquipmentEngine.getEffectiveStats(profile);

    expect(stats.maxHp).toBe(profile.baseStats.maxHp + 15);
    expect(stats.attackDamage).toBe(profile.baseStats.attackDamage + 5);
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
    expect(drop.equipment?.slot).toBe('accessory');
  });
});
