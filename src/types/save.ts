import { OwnedCreature, PermanentCreatureProfile } from './creature';
import { FoodBuffType } from './food';
import { RunHistoryRecord } from '../core/director/RunDirector';

export interface SpeciesMasteryData {
  level: number;
  exp: number;
}

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
  discoveredEquipment?: string[];
  unlockedMaps?: string[];
  unlockedDifficulties?: string[];
  speciesMastery?: Record<string, SpeciesMasteryData>;
  lastCareTimestamp?: number;
  creatureProfile?: PermanentCreatureProfile; // legacy profile fallback
}
