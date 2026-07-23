import { SaveDataSchema } from '../../types/save';
import { SaveManager } from '../save/SaveManager';

export class ProgressionService {
  public static checkLevelUnlocks(saveData: SaveDataSchema, creatureLevel: number): string[] {
    const newlyUnlocked: string[] = [];

    const levelTraitsMap: Record<number, string[]> = {
      2: ['bloodthirst', 'iron_skin'],
      3: ['multi_beam', 'chain_lightning'],
      5: ['elemental_overload', 'protective_rage'],
    };

    for (const [lvlStr, traits] of Object.entries(levelTraitsMap)) {
      const lvl = parseInt(lvlStr, 10);
      if (creatureLevel >= lvl) {
        for (const traitId of traits) {
          if (!saveData.unlockedTraits.includes(traitId)) {
            saveData.unlockedTraits.push(traitId);
            newlyUnlocked.push(traitId);
          }
        }
      }
    }

    if (newlyUnlocked.length > 0) {
      SaveManager.saveGame(saveData);
    }
    return newlyUnlocked;
  }

  public static recordMapVictory(
    saveData: SaveDataSchema,
    mapId: string,
    difficulty: string,
  ): void {
    if (!saveData.unlockedMaps) saveData.unlockedMaps = ['heartwood_clearing', 'moonlit_crossing'];
    if (!saveData.unlockedDifficulties) saveData.unlockedDifficulties = ['normal', 'challenging'];

    if (mapId === 'moonlit_crossing' && !saveData.unlockedMaps.includes('volcanic_ridge')) {
      saveData.unlockedMaps.push('volcanic_ridge');
    }
    if (difficulty === 'challenging' && !saveData.unlockedDifficulties.includes('guardian')) {
      saveData.unlockedDifficulties.push('guardian');
    }

    SaveManager.saveGame(saveData);
  }

  public static addSpeciesMasteryExp(
    saveData: SaveDataSchema,
    speciesId: string,
    expAmount: number,
  ): { level: number; exp: number; leveledUp: boolean } {
    if (!saveData.speciesMastery) {
      saveData.speciesMastery = {};
    }
    if (!saveData.speciesMastery[speciesId]) {
      saveData.speciesMastery[speciesId] = { level: 1, exp: 0 };
    }

    const current = saveData.speciesMastery[speciesId];
    current.exp += expAmount;
    let leveledUp = false;

    const nextLevelReq = current.level * 100;
    if (current.exp >= nextLevelReq && current.level < 5) {
      current.level++;
      current.exp -= nextLevelReq;
      leveledUp = true;
    }

    SaveManager.saveGame(saveData);
    return { level: current.level, exp: current.exp, leveledUp };
  }

  public static discoverEquipment(saveData: SaveDataSchema, equipmentId: string): boolean {
    if (!saveData.discoveredEquipment) {
      saveData.discoveredEquipment = [];
    }

    if (!saveData.discoveredEquipment.includes(equipmentId)) {
      saveData.discoveredEquipment.push(equipmentId);
      SaveManager.saveGame(saveData);
      return true;
    }
    return false;
  }
}
