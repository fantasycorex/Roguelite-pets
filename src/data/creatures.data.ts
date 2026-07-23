import { CreatureStats, PermanentCreatureProfile } from '../types/creature';

export const DEFAULT_CREATURE_STATS: CreatureStats = {
  maxHp: 100,
  attackDamage: 25,
  attackSpeed: 1.2, // attacks per sec
  attackRange: 160, // pixels
  moveSpeed: 100,
  specialCooldown: 8,
};

export const DEFAULT_CREATURE_PROFILE: PermanentCreatureProfile = {
  id: 'blobby_01',
  name: 'Blobby',
  level: 1,
  currentExp: 0,
  hunger: 100,
  affection: 100,
  lastCareTimestamp: Date.now(),
  equippedItemId: null,
  baseStats: DEFAULT_CREATURE_STATS,
};
