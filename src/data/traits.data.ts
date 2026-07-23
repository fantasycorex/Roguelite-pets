import { TraitConfig } from '../types/trait';

export const TRAITS_DATA: Record<string, TraitConfig> = {
  sharp_claws: {
    id: 'sharp_claws',
    name: 'Sharp Claws',
    description: '+25% Attack Damage',
    iconKey: 'trait_damage',
    rarity: 'common',
    effect: {
      type: 'stat_multiplier',
      targetStat: 'attackDamage',
      value: 1.25,
    },
  },
  swift_fury: {
    id: 'swift_fury',
    name: 'Swift Fury',
    description: '+30% Attack Speed',
    iconKey: 'trait_speed',
    rarity: 'common',
    effect: {
      type: 'stat_multiplier',
      targetStat: 'attackSpeed',
      value: 1.3,
    },
  },
  vitality_surge: {
    id: 'vitality_surge',
    name: 'Vitality Surge',
    description: '+30 Max HP',
    iconKey: 'trait_hp',
    rarity: 'common',
    effect: {
      type: 'flat_stat',
      targetStat: 'maxHp',
      value: 30,
    },
  },
  far_sight: {
    id: 'far_sight',
    name: 'Far Sight',
    description: '+40 Attack Range',
    iconKey: 'trait_range',
    rarity: 'rare',
    effect: {
      type: 'flat_stat',
      targetStat: 'attackRange',
      value: 40,
    },
  },
  overclock: {
    id: 'overclock',
    name: 'Overclock',
    description: '-25% Special Ability Cooldown',
    iconKey: 'trait_cooldown',
    rarity: 'rare',
    effect: {
      type: 'stat_multiplier',
      targetStat: 'specialCooldown',
      value: 0.75,
    },
  },
  vampiric_bite: {
    id: 'vampiric_bite',
    name: 'Vampiric Bite',
    description: 'Special Ability: AoE Burst on Cooldown',
    iconKey: 'trait_vampire',
    rarity: 'epic',
    effect: {
      type: 'special_ability',
      value: 50, // 50 AoE damage
    },
  },
};
