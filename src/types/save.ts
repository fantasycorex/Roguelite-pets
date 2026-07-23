import { PermanentCreatureProfile } from './creature';

export interface SaveDataSchema {
  version: number;
  creatureProfile: PermanentCreatureProfile;
  inventory: string[]; // equipment IDs
  totalCoins: number;
  unlockedTraits: string[];
}
