import { CreatureStats } from './creature';

export interface EquipmentConfig {
  id: string;
  name: string;
  slot: 'accessory';
  description: string;
  statBonus: Partial<CreatureStats>;
  iconKey: string;
}
