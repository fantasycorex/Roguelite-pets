import { SaveDataSchema } from '../../types/save';
import { DEFAULT_CREATURE_PROFILE } from '../../data/creatures.data';

export const CURRENT_SAVE_SCHEMA_VERSION = 2;
export const SAVE_STORAGE_KEY = 'ROGUELITE_PETS_SAVE_DATA_V2';
export const LEGACY_SAVE_STORAGE_KEY_V1 = 'ROGUELITE_PETS_SAVE_DATA_V1';

export const DEFAULT_SAVE_DATA: SaveDataSchema = {
  version: CURRENT_SAVE_SCHEMA_VERSION,
  creatureProfile: { ...DEFAULT_CREATURE_PROFILE },
  inventory: ['wooden_collar'],
  totalCoins: 50,
  unlockedTraits: ['sharp_claws', 'swift_fury'],
  tutorialCompleted: false,
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
   * Performs partial save update preserving all unmentioned fields
   */
  public static updateSaveData(updates: Partial<SaveDataSchema>): SaveDataSchema {
    const current = this.loadGame();
    const updated: SaveDataSchema = {
      ...current,
      ...updates,
      creatureProfile: updates.creatureProfile
        ? { ...current.creatureProfile, ...updates.creatureProfile }
        : current.creatureProfile,
      version: CURRENT_SAVE_SCHEMA_VERSION,
    };
    this.saveGame(updated);
    return updated;
  }

  /**
   * Loads game state from localStorage with fallback & version migration verification
   */
  public static loadGame(): SaveDataSchema {
    try {
      let json = localStorage.getItem(SAVE_STORAGE_KEY);

      // Fallback check for legacy V1 save key
      if (!json) {
        const legacyJson = localStorage.getItem(LEGACY_SAVE_STORAGE_KEY_V1);
        if (legacyJson) {
          json = legacyJson;
        }
      }

      if (!json) return this.createDefaultSave();

      const parsed = JSON.parse(json) as Partial<SaveDataSchema>;
      if (!parsed || typeof parsed.version !== 'number') {
        return this.createDefaultSave();
      }

      if (parsed.version < CURRENT_SAVE_SCHEMA_VERSION) {
        return this.migrateSaveData(parsed);
      }

      return this.ensureCompleteSchema(parsed as SaveDataSchema);
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
      localStorage.removeItem(LEGACY_SAVE_STORAGE_KEY_V1);
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

  public static migrateSaveData(oldData: Partial<SaveDataSchema>): SaveDataSchema {
    const migrated: SaveDataSchema = {
      version: CURRENT_SAVE_SCHEMA_VERSION,
      creatureProfile: oldData.creatureProfile
        ? { ...DEFAULT_CREATURE_PROFILE, ...oldData.creatureProfile }
        : { ...DEFAULT_CREATURE_PROFILE },
      inventory: Array.isArray(oldData.inventory) ? oldData.inventory : ['wooden_collar'],
      totalCoins: typeof oldData.totalCoins === 'number' ? oldData.totalCoins : 50,
      unlockedTraits:
        Array.isArray(oldData.unlockedTraits) && oldData.unlockedTraits.length > 0
          ? oldData.unlockedTraits
          : ['sharp_claws', 'swift_fury'],
      tutorialCompleted:
        typeof oldData.tutorialCompleted === 'boolean' ? oldData.tutorialCompleted : false,
    };
    this.saveGame(migrated);
    return migrated;
  }

  private static ensureCompleteSchema(data: SaveDataSchema): SaveDataSchema {
    if (!Array.isArray(data.unlockedTraits)) {
      data.unlockedTraits = ['sharp_claws', 'swift_fury'];
    }
    if (typeof data.tutorialCompleted !== 'boolean') {
      data.tutorialCompleted = false;
    }
    return data;
  }
}
