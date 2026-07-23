export interface CreatureStats {
  maxHp: number;
  attackDamage: number;
  attackSpeed: number; // attacks per second
  attackRange: number; // pixels
  moveSpeed: number; // pixels per second
  specialCooldown: number; // seconds
}

export interface PermanentCreatureProfile {
  id: string;
  name: string;
  level: number;
  currentExp: number;
  hunger: number; // 0 to 100
  affection: number; // 0 to 100
  lastCareTimestamp: number;
  equippedItemId: string | null;
  baseStats: CreatureStats;
}
