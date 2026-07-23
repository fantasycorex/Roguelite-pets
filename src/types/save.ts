import { OwnedCreature, PermanentCreatureProfile } from './creature';
import { FoodBuffType } from './food';
import { RunHistoryRecord } from '../core/director/RunDirector';

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
  runHistory?: RunHistoryRecord[];
  creatureProfile?: PermanentCreatureProfile; // legacy profile fallback
}
