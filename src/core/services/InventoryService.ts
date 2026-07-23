import { OwnedCreature } from '../../types/creature';
import { EquipmentSlot } from '../../types/equipment';
import { EquipmentEngine } from '../equipment/EquipmentEngine';

export class InventoryService {
  public static equip(creature: OwnedCreature, inventory: string[], itemId: string): boolean {
    return EquipmentEngine.equipItem(creature, inventory, itemId);
  }

  public static unequip(
    creature: OwnedCreature,
    inventory: string[],
    slot: EquipmentSlot,
  ): boolean {
    return EquipmentEngine.unequipItem(creature, inventory, slot);
  }

  public static sellItem(inventory: string[], itemId: string): number {
    return EquipmentEngine.sellItem(inventory, itemId);
  }
}
