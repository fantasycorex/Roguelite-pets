import { SaveDataSchema } from '../../types/save';
import { CreatureEngine } from '../creature/CreatureEngine';
import { OwnedCreature } from '../../types/creature';

export const CURRENT_SAVE_SCHEMA_VERSION = 4;
export const SAVE_STORAGE_KEY = 'ROGUELITE_PETS_SAVE_DATA_V4';
export const LEGACY_SAVE_STORAGE_KEY_V3 = 'ROGUELITE_PETS_SAVE_DATA_V3';
export const LEGACY_SAVE_STORAGE_KEY_V2 = 'ROGUELITE_PETS_SAVE_DATA_V2';
export const LEGACY_SAVE_STORAGE_KEY_V1 = 'ROGUELITE_PETS_SAVE_DATA_V1';

export const DEFAULT_SAVE_DATA: SaveDataSchema = {
  version: CURRENT_SAVE_SCHEMA_VERSION,
  activeCreatureInstanceId: 'c_guardian_1',
  ownedCreatures: CreatureEngine.createDefaultOwnedCreatures(),
  inventory: ['wooden_collar', 'swift_bell', 'squeaky_ball'],
  foodInventory: { basic_kibble: 3, gourmet_treat: 1, energy_berry: 1 },
  totalCoins: 100,
  unlockedTraits: ['sharp_claws', 'swift_fury'],
  tutorialCompleted: false,
  runHistory: [],
  discoveredEquipment: ['wooden_collar', 'swift_bell', 'squeaky_ball'],
  unlockedMaps: ['heartwood_clearing', 'moonlit_crossing'],
  unlockedDifficulties: ['normal', 'challenging'],
  speciesMastery: {
    guardian_blob: { level: 1, exp: 0 },
    spark_fox: { level: 1, exp: 0 },
    prowler_lynx: { level: 1, exp: 0 },
  },
  lastCareTimestamp: Date.now(),
};

export class SaveManager {
  public static saveGame(data: SaveDataSchema): boolean {
    try {
      data.version = CURRENT_SAVE_SCHEMA_VERSION;
      data.lastCareTimestamp = Date.now();
      const json = JSON.stringify(data);
      localStorage.setItem(SAVE_STORAGE_KEY, json);
      return true;
    } catch (e) {
      console.error('Failed to save game data:', e);
      return false;
    }
  }

  public static updateSaveData(updates: Partial<SaveDataSchema>): SaveDataSchema {
    const current = this.loadGame();
    const updated: SaveDataSchema = {
      ...current,
      ...updates,
      ownedCreatures: updates.ownedCreatures || current.ownedCreatures,
      foodInventory: updates.foodInventory || current.foodInventory,
      version: CURRENT_SAVE_SCHEMA_VERSION,
      lastCareTimestamp: Date.now(),
    };
    this.saveGame(updated);
    return updated;
  }

  public static loadGame(): SaveDataSchema {
    try {
      let json = localStorage.getItem(SAVE_STORAGE_KEY);

      if (!json) {
        const v3Json = localStorage.getItem(LEGACY_SAVE_STORAGE_KEY_V3);
        if (v3Json) json = v3Json;
      }
      if (!json) {
        const v2Json = localStorage.getItem(LEGACY_SAVE_STORAGE_KEY_V2);
        if (v2Json) json = v2Json;
      }
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

  public static getActiveCreature(saveData?: SaveDataSchema): OwnedCreature {
    const save = saveData || this.loadGame();
    const found = save.ownedCreatures.find((c) => c.instanceId === save.activeCreatureInstanceId);
    return found || save.ownedCreatures[0] || DEFAULT_SAVE_DATA.ownedCreatures[0];
  }

  public static resetSave(): SaveDataSchema {
    try {
      localStorage.removeItem(SAVE_STORAGE_KEY);
      localStorage.removeItem(LEGACY_SAVE_STORAGE_KEY_V3);
      localStorage.removeItem(LEGACY_SAVE_STORAGE_KEY_V2);
      localStorage.removeItem(LEGACY_SAVE_STORAGE_KEY_V1);
    } catch (e) {
      console.error('Failed to clear save data:', e);
    }
    const defaults = this.createDefaultSave();
    this.saveGame(defaults);
    return defaults;
  }

  public static exportSavePayload(): string {
    const data = this.loadGame();
    return JSON.stringify(data, null, 2);
  }

  public static importSavePayload(jsonStr: string): { success: boolean; message?: string } {
    try {
      const parsed = JSON.parse(jsonStr) as SaveDataSchema;
      if (!parsed || typeof parsed.version !== 'number' || !Array.isArray(parsed.ownedCreatures)) {
        return { success: false, message: 'Invalid save payload structure!' };
      }
      this.saveGame(parsed);
      return { success: true };
    } catch {
      return { success: false, message: 'Failed to parse JSON string!' };
    }
  }

  private static createDefaultSave(): SaveDataSchema {
    return JSON.parse(JSON.stringify(DEFAULT_SAVE_DATA));
  }

  public static migrateSaveData(oldData: Partial<SaveDataSchema>): SaveDataSchema {
    const defaultCreatures = CreatureEngine.createDefaultOwnedCreatures();

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
      inventory:
        Array.isArray(oldData.inventory) && oldData.inventory.length > 0
          ? oldData.inventory
          : ['wooden_collar', 'swift_bell', 'squeaky_ball'],
      foodInventory: oldData.foodInventory || {
        basic_kibble: 3,
        gourmet_treat: 1,
        energy_berry: 1,
      },
      totalCoins: typeof oldData.totalCoins === 'number' ? oldData.totalCoins : 100,
      unlockedTraits:
        Array.isArray(oldData.unlockedTraits) && oldData.unlockedTraits.length > 0
          ? oldData.unlockedTraits
          : ['sharp_claws', 'swift_fury'],
      tutorialCompleted:
        typeof oldData.tutorialCompleted === 'boolean' ? oldData.tutorialCompleted : false,
      activeNextRunBuff: oldData.activeNextRunBuff,
      runHistory: oldData.runHistory || [],
      discoveredEquipment: oldData.discoveredEquipment || ['wooden_collar', 'swift_bell'],
      unlockedMaps: oldData.unlockedMaps || ['heartwood_clearing', 'moonlit_crossing'],
      unlockedDifficulties: oldData.unlockedDifficulties || ['normal', 'challenging'],
      speciesMastery: oldData.speciesMastery || {
        guardian_blob: { level: 1, exp: 0 },
        spark_fox: { level: 1, exp: 0 },
        prowler_lynx: { level: 1, exp: 0 },
      },
      lastCareTimestamp: Date.now(),
    };
    this.saveGame(migrated);
    return migrated;
  }

  private static ensureCompleteSchema(data: SaveDataSchema): SaveDataSchema {
    if (!Array.isArray(data.ownedCreatures) || data.ownedCreatures.length === 0) {
      data.ownedCreatures = CreatureEngine.createDefaultOwnedCreatures();
      data.activeCreatureInstanceId = 'c_guardian_1';
    }
    if (!data.foodInventory) {
      data.foodInventory = { basic_kibble: 3, gourmet_treat: 1, energy_berry: 1 };
    }
    if (!Array.isArray(data.unlockedTraits)) {
      data.unlockedTraits = ['sharp_claws', 'swift_fury'];
    }
    if (typeof data.tutorialCompleted !== 'boolean') {
      data.tutorialCompleted = false;
    }
    if (!Array.isArray(data.runHistory)) {
      data.runHistory = [];
    }
    if (!Array.isArray(data.discoveredEquipment)) {
      data.discoveredEquipment = ['wooden_collar', 'swift_bell', 'squeaky_ball'];
    }
    if (!Array.isArray(data.unlockedMaps)) {
      data.unlockedMaps = ['heartwood_clearing', 'moonlit_crossing'];
    }
    if (!Array.isArray(data.unlockedDifficulties)) {
      data.unlockedDifficulties = ['normal', 'challenging'];
    }
    if (!data.speciesMastery) {
      data.speciesMastery = {
        guardian_blob: { level: 1, exp: 0 },
        spark_fox: { level: 1, exp: 0 },
        prowler_lynx: { level: 1, exp: 0 },
      };
    }

    // Gentle offline care decay calculation (capped at 50% max decay)
    if (data.lastCareTimestamp && data.lastCareTimestamp > 0) {
      const now = Date.now();
      const elapsedHours = (now - data.lastCareTimestamp) / (1000 * 60 * 60);
      if (elapsedHours > 0.5) {
        const decayAmount = Math.min(50, Math.floor(elapsedHours * 5));
        data.ownedCreatures.forEach((c) => {
          c.fullness = Math.max(25, c.fullness - decayAmount);
        });
      }
    }

    return data;
  }
}
