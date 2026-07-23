import { SaveDataSchema } from '../../types/save';
import { CreatureEngine } from '../creature/CreatureEngine';
import { OwnedCreature } from '../../types/creature';

export const CURRENT_SAVE_SCHEMA_VERSION = 3;
export const SAVE_STORAGE_KEY = 'ROGUELITE_PETS_SAVE_DATA_V3';
export const LEGACY_SAVE_STORAGE_KEY_V2 = 'ROGUELITE_PETS_SAVE_DATA_V2';
export const LEGACY_SAVE_STORAGE_KEY_V1 = 'ROGUELITE_PETS_SAVE_DATA_V1';

export const DEFAULT_SAVE_DATA: SaveDataSchema = {
  version: CURRENT_SAVE_SCHEMA_VERSION,
  activeCreatureInstanceId: 'c_guardian_1',
  ownedCreatures: CreatureEngine.createDefaultOwnedCreatures(),
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
      ownedCreatures: updates.ownedCreatures || current.ownedCreatures,
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

      // Fallback check for legacy V2 save key
      if (!json) {
        const v2Json = localStorage.getItem(LEGACY_SAVE_STORAGE_KEY_V2);
        if (v2Json) json = v2Json;
      }
      // Fallback check for legacy V1 save key
      if (!json) {
        const v1Json = localStorage.getItem(LEGACY_SAVE_STORAGE_KEY_V1);
        if (v1Json) json = v1Json;
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
   * Gets active owned creature object from save
   */
  public static getActiveCreature(saveData?: SaveDataSchema): OwnedCreature {
    const save = saveData || this.loadGame();
    const found = save.ownedCreatures.find((c) => c.instanceId === save.activeCreatureInstanceId);
    return found || save.ownedCreatures[0] || DEFAULT_SAVE_DATA.ownedCreatures[0];
  }

  /**
   * Resets save data back to default initial state
   */
  public static resetSave(): SaveDataSchema {
    try {
      localStorage.removeItem(SAVE_STORAGE_KEY);
      localStorage.removeItem(LEGACY_SAVE_STORAGE_KEY_V2);
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
    const defaultCreatures = CreatureEngine.createDefaultOwnedCreatures();

    // Migrate legacy profile fields if present
    if (oldData.creatureProfile) {
      const p = oldData.creatureProfile;
      defaultCreatures[0].level = Math.max(1, p.level || 1);
      defaultCreatures[0].currentExp = p.currentExp || 0;
      defaultCreatures[0].affection = p.affection || 50;
      defaultCreatures[0].fullness = 100 - (p.hunger || 20);
    }

    const migrated: SaveDataSchema = {
      version: CURRENT_SAVE_SCHEMA_VERSION,
      activeCreatureInstanceId: oldData.activeCreatureInstanceId || 'c_guardian_1',
      ownedCreatures:
        Array.isArray(oldData.ownedCreatures) && oldData.ownedCreatures.length > 0
          ? oldData.ownedCreatures
          : defaultCreatures,
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
    if (!Array.isArray(data.ownedCreatures) || data.ownedCreatures.length === 0) {
      data.ownedCreatures = CreatureEngine.createDefaultOwnedCreatures();
      data.activeCreatureInstanceId = 'c_guardian_1';
    }
    if (!Array.isArray(data.unlockedTraits)) {
      data.unlockedTraits = ['sharp_claws', 'swift_fury'];
    }
    if (typeof data.tutorialCompleted !== 'boolean') {
      data.tutorialCompleted = false;
    }
    return data;
  }
}
