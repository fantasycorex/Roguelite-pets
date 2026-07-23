import { EquipmentConfig } from '../types/equipment';

export const EQUIPMENT_DATA: Record<string, EquipmentConfig> = {
  // Collars
  wooden_collar: {
    id: 'wooden_collar',
    name: 'Wooden Collar',
    slot: 'collar',
    description: '+15 Max HP, +5 Attack Damage',
    statBonus: {
      maxHp: 15,
      attackDamage: 5,
    },
    iconKey: 'equip_wooden_collar',
    sellValue: 10,
  },
  spiked_collar: {
    id: 'spiked_collar',
    name: 'Spiked Collar',
    slot: 'collar',
    description: '+12 Attack Damage, +0.15 Attack Speed',
    statBonus: {
      attackDamage: 12,
      attackSpeed: 0.15,
    },
    iconKey: 'equip_spiked_collar',
    sellValue: 25,
  },
  titan_collar: {
    id: 'titan_collar',
    name: 'Titan Collar',
    slot: 'collar',
    description: '+40 Max HP, +15 Attack Damage',
    statBonus: {
      maxHp: 40,
      attackDamage: 15,
    },
    iconKey: 'equip_titan_collar',
    sellValue: 45,
  },

  // Charms
  swift_bell: {
    id: 'swift_bell',
    name: 'Swift Bell',
    slot: 'charm',
    description: '+0.25 Attack Speed, +20 Move Speed',
    statBonus: {
      attackSpeed: 0.25,
      moveSpeed: 20,
    },
    iconKey: 'equip_swift_bell',
    sellValue: 20,
  },
  ruby_pendant: {
    id: 'ruby_pendant',
    name: 'Ruby Pendant',
    slot: 'charm',
    description: '+20 Attack Damage, +25 Max HP',
    statBonus: {
      attackDamage: 20,
      maxHp: 25,
    },
    iconKey: 'equip_ruby_pendant',
    sellValue: 35,
  },
  phoenix_feather: {
    id: 'phoenix_feather',
    name: 'Phoenix Feather',
    slot: 'charm',
    description: '+15 Attack Damage, -1.0s Special Cooldown',
    statBonus: {
      attackDamage: 15,
      specialCooldown: -1.0,
    },
    iconKey: 'equip_phoenix_feather',
    sellValue: 50,
  },

  // Toys
  squeaky_ball: {
    id: 'squeaky_ball',
    name: 'Squeaky Ball',
    slot: 'toy',
    description: '+10 Max HP, +0.10 Attack Speed',
    statBonus: {
      maxHp: 10,
      attackSpeed: 0.1,
    },
    iconKey: 'equip_squeaky_ball',
    sellValue: 15,
  },
  chew_bone: {
    id: 'chew_bone',
    name: 'Chew Bone',
    slot: 'toy',
    description: '+25 Max HP, +8 Attack Damage',
    statBonus: {
      maxHp: 25,
      attackDamage: 8,
    },
    iconKey: 'equip_chew_bone',
    sellValue: 20,
  },
  magic_yarn: {
    id: 'magic_yarn',
    name: 'Magic Yarn',
    slot: 'toy',
    description: '+15 Attack Damage, +25 Move Speed',
    statBonus: {
      attackDamage: 15,
      moveSpeed: 25,
    },
    iconKey: 'equip_magic_yarn',
    sellValue: 30,
  },
};
