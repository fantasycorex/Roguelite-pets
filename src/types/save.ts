import { OwnedCreature, PermanentCreatureProfile } from './creature';

export interface SaveDataSchema {
  version: number;
  activeCreatureInstanceId: string;
  ownedCreatures: OwnedCreature[];
  inventory: string[]; // equipment IDs
  totalCoins: number;
  unlockedTraits: string[];
  tutorialCompleted: boolean;
  creatureProfile?: PermanentCreatureProfile; // legacy profile fallback
}
