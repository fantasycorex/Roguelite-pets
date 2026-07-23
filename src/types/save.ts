import { OwnedCreature, PermanentCreatureProfile } from './creature';
import { FoodBuffType } from './food';

export interface SaveDataSchema {
  version: number;
  activeCreatureInstanceId: string;
  ownedCreatures: OwnedCreature[];
  inventory: string[]; // equipment IDs
  foodInventory: Record<string, number>; // foodId -> count
  totalCoins: number;
  unlockedTraits: string[];
  tutorialCompleted: boolean;
  activeNextRunBuff?: { type: FoodBuffType; multiplier: number };
  creatureProfile?: PermanentCreatureProfile; // legacy profile fallback
}
