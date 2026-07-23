export interface CreatureStats {
  maxHp: number;
  attackDamage: number;
  attackSpeed: number; // attacks per second
  attackRange: number; // pixels
  moveSpeed: number; // pixels per second
  specialCooldown: number; // seconds
}

export type CreatureRole = 'guardian' | 'spark' | 'prowler';

export interface CreatureSpeciesConfig {
  id: string;
  name: string;
  role: CreatureRole;
  description: string;
  baseStats: CreatureStats;
  statGrowthPerLevel: Partial<CreatureStats>;
  attackId: string;
  abilityId: string;
  behaviourStyle: string;
  evolutionIds: string[];
  colorHex: number;
}

export interface OwnedCreature {
  instanceId: string;
  speciesId: string;
  nickname: string;
  level: number;
  currentExp: number;
  evolutionStage: number; // 1 = Starter, 2 = Evolved
  affection: number; // 0 to 100
  fullness: number; // 0 to 100 (hunger = 100 - fullness)
  personalityTraits: string[];
  equippedItems: Record<string, string | null>; // slot -> itemId
}

// Legacy profile interface for backward compatibility migration
export interface PermanentCreatureProfile {
  id: string;
  name: string;
  level: number;
  currentExp: number;
  hunger: number;
  affection: number;
  lastCareTimestamp: number;
  equippedItemId: string | null;
  baseStats: CreatureStats;
}
