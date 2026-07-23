import { PermanentCreatureProfile, CreatureStats } from '../../types/creature';
import { EQUIPMENT_DATA } from '../../data/equipment.data';
import { EquipmentConfig } from '../../types/equipment';

export class EquipmentEngine {
  /**
   * Equips an item from inventory onto pet. If an item is already equipped, returns old item to inventory.
   */
  public static equipItem(
    profile: PermanentCreatureProfile,
    inventory: string[],
    itemId: string,
  ): boolean {
    const itemIdx = inventory.indexOf(itemId);
    if (itemIdx === -1 || !EQUIPMENT_DATA[itemId]) {
      return false;
    }

    // Unequip currently equipped item if exists
    if (profile.equippedItemId) {
      inventory.push(profile.equippedItemId);
    }

    // Remove new item from inventory and set equipped
    inventory.splice(itemIdx, 1);
    profile.equippedItemId = itemId;
    return true;
  }

  /**
   * Unequips currently equipped item and moves it back to inventory
   */
  public static unequipItem(profile: PermanentCreatureProfile, inventory: string[]): boolean {
    if (!profile.equippedItemId) return false;

    inventory.push(profile.equippedItemId);
    profile.equippedItemId = null;
    return true;
  }

  /**
   * Calculates total stats by combining base stats + equipped item stat bonuses
   */
  public static getEffectiveStats(profile: PermanentCreatureProfile): CreatureStats {
    const stats: CreatureStats = { ...profile.baseStats };
    if (!profile.equippedItemId) return stats;

    const equip = EQUIPMENT_DATA[profile.equippedItemId];
    if (!equip) return stats;

    const { statBonus } = equip;

    if (statBonus.maxHp) stats.maxHp += statBonus.maxHp;
    if (statBonus.attackDamage) stats.attackDamage += statBonus.attackDamage;
    if (statBonus.attackSpeed) stats.attackSpeed += statBonus.attackSpeed;
    if (statBonus.attackRange) stats.attackRange += statBonus.attackRange;
    if (statBonus.moveSpeed) stats.moveSpeed += statBonus.moveSpeed;

    return stats;
  }

  public static getEquippedItem(profile: PermanentCreatureProfile): EquipmentConfig | null {
    if (!profile.equippedItemId) return null;
    return EQUIPMENT_DATA[profile.equippedItemId] || null;
  }
}
