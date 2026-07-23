import { CreatureStats, OwnedCreature, PermanentCreatureProfile } from '../../types/creature';
import { EquipmentConfig, EquipmentSlot } from '../../types/equipment';
import { EQUIPMENT_DATA } from '../../data/equipment.data';

export class EquipmentEngine {
  private static ensureEquippedItemsMap(creature: OwnedCreature): void {
    if (!creature.equippedItems) {
      creature.equippedItems = { collar: null, charm: null, toy: null };
    }
  }

  /**
   * Retrieves equipped items across all 3 slots for an OwnedCreature
   */
  public static getEquippedItems(
    creature: OwnedCreature,
  ): Record<EquipmentSlot, EquipmentConfig | null> {
    this.ensureEquippedItemsMap(creature);

    const result: Record<EquipmentSlot, EquipmentConfig | null> = {
      collar: null,
      charm: null,
      toy: null,
    };

    if (creature.equippedItems.collar) {
      result.collar = EQUIPMENT_DATA[creature.equippedItems.collar] || null;
    }
    if (creature.equippedItems.charm) {
      result.charm = EQUIPMENT_DATA[creature.equippedItems.charm] || null;
    }
    if (creature.equippedItems.toy) {
      result.toy = EQUIPMENT_DATA[creature.equippedItems.toy] || null;
    }

    return result;
  }

  /**
   * Calculates effective stats by combining species/profile base stats with bonuses from all equipped slots
   */
  public static getEffectiveStats(
    profileOrCreature: PermanentCreatureProfile | OwnedCreature,
    baseStatsInput?: CreatureStats,
  ): CreatureStats {
    const isOwned = 'equippedItems' in profileOrCreature;
    const baseStats: CreatureStats = isOwned
      ? baseStatsInput || {
          maxHp: 100,
          attackDamage: 15,
          attackSpeed: 1.0,
          attackRange: 150,
          moveSpeed: 100,
          specialCooldown: 8.0,
        }
      : profileOrCreature.baseStats;

    const stats: CreatureStats = { ...baseStats };

    if (isOwned) {
      const equipped = this.getEquippedItems(profileOrCreature as OwnedCreature);
      const items = [equipped.collar, equipped.charm, equipped.toy].filter(
        (item): item is EquipmentConfig => item !== null,
      );

      for (const item of items) {
        this.applyStatBonus(stats, item.statBonus);
      }
    } else {
      // Legacy profile fallback
      if (profileOrCreature.equippedItemId) {
        const item = EQUIPMENT_DATA[profileOrCreature.equippedItemId];
        if (item) {
          this.applyStatBonus(stats, item.statBonus);
        }
      }
    }

    return stats;
  }

  private static applyStatBonus(stats: CreatureStats, bonus: Partial<CreatureStats>): void {
    if (bonus.maxHp) stats.maxHp += bonus.maxHp;
    if (bonus.attackDamage) stats.attackDamage += bonus.attackDamage;
    if (bonus.attackSpeed) {
      stats.attackSpeed = Number((stats.attackSpeed + bonus.attackSpeed).toFixed(2));
    }
    if (bonus.attackRange) stats.attackRange += bonus.attackRange;
    if (bonus.moveSpeed) stats.moveSpeed += bonus.moveSpeed;
    if (bonus.specialCooldown) {
      stats.specialCooldown = Math.max(2.0, stats.specialCooldown + bonus.specialCooldown);
    }
  }

  /**
   * Equips item into its designated slot on OwnedCreature, returning previously equipped item to inventory
   */
  public static equipItem(creature: OwnedCreature, inventory: string[], itemId: string): boolean {
    this.ensureEquippedItemsMap(creature);

    const itemConfig = EQUIPMENT_DATA[itemId];
    if (!itemConfig) return false;

    const invIdx = inventory.indexOf(itemId);
    if (invIdx === -1) return false;

    // Remove new item from inventory
    inventory.splice(invIdx, 1);

    // Unequip currently equipped item in target slot (if any)
    const slot = itemConfig.slot;
    const currentEquippedId = creature.equippedItems[slot];
    if (currentEquippedId) {
      inventory.push(currentEquippedId);
    }

    // Assign new item to slot
    creature.equippedItems[slot] = itemId;
    return true;
  }

  /**
   * Unequips item from slot on OwnedCreature and returns it to inventory
   */
  public static unequipItem(
    creature: OwnedCreature,
    inventory: string[],
    slot: EquipmentSlot,
  ): boolean {
    this.ensureEquippedItemsMap(creature);

    const currentEquippedId = creature.equippedItems[slot];
    if (!currentEquippedId) return false;

    inventory.push(currentEquippedId);
    creature.equippedItems[slot] = null;
    return true;
  }

  /**
   * Sells an item from inventory for coins (50% value refund)
   */
  public static sellItem(inventory: string[], itemId: string): number {
    const invIdx = inventory.indexOf(itemId);
    if (invIdx === -1) return 0;

    const config = EQUIPMENT_DATA[itemId];
    const sellValue = config ? config.sellValue : 10;

    inventory.splice(invIdx, 1);
    return sellValue;
  }
}
