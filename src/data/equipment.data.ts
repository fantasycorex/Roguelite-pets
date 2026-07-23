import { EquipmentConfig } from '../types/equipment';

export const EQUIPMENT_DATA: Record<string, EquipmentConfig> = {
  wooden_collar: {
    id: 'wooden_collar',
    name: 'Wooden Collar',
    slot: 'accessory',
    description: '+15 Max HP, +5 Attack Damage',
    statBonus: {
      maxHp: 15,
      attackDamage: 5,
    },
    iconKey: 'equip_wooden_collar',
  },
  spiked_collar: {
    id: 'spiked_collar',
    name: 'Spiked Collar',
    slot: 'accessory',
    description: '+12 Attack Damage, +15% Attack Speed',
    statBonus: {
      attackDamage: 12,
      attackSpeed: 0.15,
    },
    iconKey: 'equip_spiked_collar',
  },
  swift_bell: {
    id: 'swift_bell',
    name: 'Swift Bell',
    slot: 'accessory',
    description: '+25% Attack Speed, +20 Move Speed',
    statBonus: {
      attackSpeed: 0.25,
      moveSpeed: 20,
    },
    iconKey: 'equip_swift_bell',
  },
  ruby_pendant: {
    id: 'ruby_pendant',
    name: 'Ruby Pendant',
    slot: 'accessory',
    description: '+20 Attack Damage, +25 Max HP',
    statBonus: {
      attackDamage: 20,
      maxHp: 25,
    },
    iconKey: 'equip_ruby_pendant',
  },
};
