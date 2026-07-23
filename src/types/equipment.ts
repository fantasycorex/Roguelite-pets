import { CreatureStats } from './creature';

export type EquipmentSlot = 'collar' | 'charm' | 'toy';

export interface EquipmentConfig {
  id: string;
  name: string;
  slot: EquipmentSlot;
  description: string;
  statBonus: Partial<CreatureStats>;
  iconKey: string;
  sellValue: number; // coin refund when sold
}
