import { CreatureSpeciesConfig } from '../types/creature';

export const SPECIES_DATA: Record<string, CreatureSpeciesConfig> = {
  // 1. Guardian Roster
  guardian_blob: {
    id: 'guardian_blob',
    name: 'Ironback Slime',
    role: 'guardian',
    description:
      'High HP tank that taunts enemies, blocks damage, and benefits strongly from affection.',
    baseStats: {
      maxHp: 180,
      attackDamage: 24,
      attackSpeed: 0.9,
      attackRange: 100,
      moveSpeed: 80,
      specialCooldown: 8.0,
    },
    statGrowthPerLevel: {
      maxHp: 25,
      attackDamage: 3,
    },
    attackId: 'impact_bash',
    abilityId: 'aegis_barrier',
    behaviourStyle: 'guardian_taunt',
    evolutionIds: ['guardian_titan'],
    colorHex: 0x3a86ff,
  },
  guardian_titan: {
    id: 'guardian_titan',
    name: 'Aegis Titan',
    role: 'guardian',
    description:
      'Evolved armored titan with massive HP, larger block radius, and impenetrable barriers.',
    baseStats: {
      maxHp: 320,
      attackDamage: 38,
      attackSpeed: 1.0,
      attackRange: 120,
      moveSpeed: 90,
      specialCooldown: 6.5,
    },
    statGrowthPerLevel: {
      maxHp: 40,
      attackDamage: 5,
    },
    attackId: 'impact_bash',
    abilityId: 'aegis_barrier',
    behaviourStyle: 'guardian_taunt',
    evolutionIds: [],
    colorHex: 0x0284c7,
  },

  // 2. Spark Roster
  spark_fox: {
    id: 'spark_fox',
    name: 'Ember Sprite',
    role: 'spark',
    description:
      'Long-range fire caster with splash burn damage. Benefits strongly from a full belly.',
    baseStats: {
      maxHp: 90,
      attackDamage: 28,
      attackSpeed: 1.25,
      attackRange: 240,
      moveSpeed: 110,
      specialCooldown: 5.5,
    },
    statGrowthPerLevel: {
      maxHp: 12,
      attackDamage: 6,
      attackSpeed: 0.05,
    },
    attackId: 'fire_bolt',
    abilityId: 'fire_blast',
    behaviourStyle: 'spark_caster',
    evolutionIds: ['spark_phoenix'],
    colorHex: 0xffbe0b,
  },
  spark_phoenix: {
    id: 'spark_phoenix',
    name: 'Infernal Drake',
    role: 'spark',
    description:
      'Evolved fiery dragon unleashing devastating flame storms and continuous fire zones.',
    baseStats: {
      maxHp: 150,
      attackDamage: 48,
      attackSpeed: 1.5,
      attackRange: 260,
      moveSpeed: 130,
      specialCooldown: 4.0,
    },
    statGrowthPerLevel: {
      maxHp: 20,
      attackDamage: 10,
      attackSpeed: 0.08,
    },
    attackId: 'fire_bolt',
    abilityId: 'fire_blast',
    behaviourStyle: 'spark_caster',
    evolutionIds: [],
    colorHex: 0xd97706,
  },

  // 3. Prowler Roster
  prowler_lynx: {
    id: 'prowler_lynx',
    name: 'Shadow Stalker',
    role: 'prowler',
    description:
      'Ultra-fast interceptor that prioritizes runners/saboteurs with lethal precision strikes.',
    baseStats: {
      maxHp: 110,
      attackDamage: 20,
      attackSpeed: 1.8,
      attackRange: 140,
      moveSpeed: 160,
      specialCooldown: 4.5,
    },
    statGrowthPerLevel: {
      maxHp: 15,
      attackDamage: 5,
      moveSpeed: 6,
    },
    attackId: 'shadow_strike',
    abilityId: 'shadow_dash',
    behaviourStyle: 'prowler_interceptor',
    evolutionIds: ['prowler_phantom'],
    colorHex: 0x7209b7,
  },
  prowler_phantom: {
    id: 'prowler_phantom',
    name: 'Void Specter',
    role: 'prowler',
    description:
      'Evolved shadow assassin striking with critical execution force and multi-target dashes.',
    baseStats: {
      maxHp: 190,
      attackDamage: 38,
      attackSpeed: 2.4,
      attackRange: 160,
      moveSpeed: 200,
      specialCooldown: 3.5,
    },
    statGrowthPerLevel: {
      maxHp: 24,
      attackDamage: 8,
      moveSpeed: 10,
    },
    attackId: 'shadow_strike',
    abilityId: 'shadow_dash',
    behaviourStyle: 'prowler_interceptor',
    evolutionIds: [],
    colorHex: 0x581c87,
  },
};
