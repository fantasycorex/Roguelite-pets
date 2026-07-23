import { SaveManager } from '../save/SaveManager';
import { SaveDataSchema } from '../../types/save';
import { CreatureEngine } from '../creature/CreatureEngine';

export interface RunRewardPayload {
  runId: string;
  coinsEarned: number;
  expEarned: number;
  droppedEquipment: string[];
}

export class RunRewardSettlementService {
  private static instance: RunRewardSettlementService;
  private settledRunIds: Set<string> = new Set();

  private constructor() {}

  public static getInstance(): RunRewardSettlementService {
    if (!RunRewardSettlementService.instance) {
      RunRewardSettlementService.instance = new RunRewardSettlementService();
    }
    return RunRewardSettlementService.instance;
  }

  /**
   * Settles run rewards exactly once per run ID (idempotent), resolving EXP level ups
   */
  public settleRunRewards(payload: RunRewardPayload): {
    settled: boolean;
    saveData: SaveDataSchema;
    levelsGained: number;
  } {
    if (!payload.runId || this.settledRunIds.has(payload.runId)) {
      return { settled: false, saveData: SaveManager.loadGame(), levelsGained: 0 };
    }

    this.settledRunIds.add(payload.runId);

    const currentSave = SaveManager.loadGame();
    const updatedCoins = currentSave.totalCoins + Math.max(0, payload.coinsEarned);
    const updatedInventory = [...currentSave.inventory];

    if (payload.droppedEquipment && payload.droppedEquipment.length > 0) {
      updatedInventory.push(...payload.droppedEquipment);
    }

    // Resolve EXP onto active creature
    const activeCreature = SaveManager.getActiveCreature(currentSave);
    const { levelsGained } = CreatureEngine.addExpToCreature(activeCreature, payload.expEarned);

    const updatedSave = SaveManager.updateSaveData({
      totalCoins: updatedCoins,
      inventory: updatedInventory,
      ownedCreatures: currentSave.ownedCreatures,
    });

    return { settled: true, saveData: updatedSave, levelsGained };
  }

  public isRunSettled(runId: string): boolean {
    return this.settledRunIds.has(runId);
  }

  public clearSettledRuns(): void {
    this.settledRunIds.clear();
  }
}

export const runRewardSettlementService = RunRewardSettlementService.getInstance();
