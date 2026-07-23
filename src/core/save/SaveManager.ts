import { SaveDataSchema } from '../../types/save';
import { DEFAULT_CREATURE_PROFILE } from '../../data/creatures.data';

export const CURRENT_SAVE_SCHEMA_VERSION = 1;
export const SAVE_STORAGE_KEY = 'ROGUELITE_PETS_SAVE_DATA_V1';

export const DEFAULT_SAVE_DATA: SaveDataSchema = {
  version: CURRENT_SAVE_SCHEMA_VERSION,
  creatureProfile: { ...DEFAULT_CREATURE_PROFILE },
  inventory: ['wooden_collar'],
  totalCoins: 50,
  unlockedTraits: ['sharp_claws', 'swift_fury'],
};

export class SaveManager {
  /**
   * Saves game state payload to localStorage
   */
  public static saveGame(data: SaveDataSchema): boolean {
    try {
      data.version = CURRENT_SAVE_SCHEMA_VERSION;
      const json = JSON.stringify(data);
      localStorage.setItem(SAVE_STORAGE_KEY, json);
      return true;
    } catch (e) {
      console.error('Failed to save game data:', e);
      return false;
    }
  }

  /**
   * Loads game state from localStorage with fallback & version verification
   */
  public static loadGame(): SaveDataSchema {
    try {
      const json = localStorage.getItem(SAVE_STORAGE_KEY);
      if (!json) return this.createDefaultSave();

      const parsed = JSON.parse(json) as SaveDataSchema;
      if (!parsed || typeof parsed.version !== 'number') {
        return this.createDefaultSave();
      }

      // Schema Migration check if needed in future
      if (parsed.version < CURRENT_SAVE_SCHEMA_VERSION) {
        return this.migrateSaveData(parsed);
      }

      return parsed;
    } catch (e) {
      console.error('Failed to load save data, loading defaults:', e);
      return this.createDefaultSave();
    }
  }

  /**
   * Resets save data back to default initial state
   */
  public static resetSave(): SaveDataSchema {
    try {
      localStorage.removeItem(SAVE_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear save data:', e);
    }
    const defaults = this.createDefaultSave();
    this.saveGame(defaults);
    return defaults;
  }

  private static createDefaultSave(): SaveDataSchema {
    return JSON.parse(JSON.stringify(DEFAULT_SAVE_DATA));
  }

  private static migrateSaveData(oldData: SaveDataSchema): SaveDataSchema {
    // Migration logic for future versions
    oldData.version = CURRENT_SAVE_SCHEMA_VERSION;
    return oldData;
  }
}
