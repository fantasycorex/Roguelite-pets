import { SaveManager } from '../save/SaveManager';
import { SaveDataSchema } from '../../types/save';

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
   * Settles run rewards exactly once per run ID (idempotent)
   */
  public settleRunRewards(payload: RunRewardPayload): {
    settled: boolean;
    saveData: SaveDataSchema;
  } {
    if (!payload.runId || this.settledRunIds.has(payload.runId)) {
      return { settled: false, saveData: SaveManager.loadGame() };
    }

    this.settledRunIds.add(payload.runId);

    const currentSave = SaveManager.loadGame();
    const updatedCoins = currentSave.totalCoins + Math.max(0, payload.coinsEarned);
    const updatedExp = currentSave.creatureProfile.currentExp + Math.max(0, payload.expEarned);
    const updatedInventory = [...currentSave.inventory];

    if (payload.droppedEquipment && payload.droppedEquipment.length > 0) {
      updatedInventory.push(...payload.droppedEquipment);
    }

    const updatedSave = SaveManager.updateSaveData({
      totalCoins: updatedCoins,
      inventory: updatedInventory,
      creatureProfile: {
        ...currentSave.creatureProfile,
        currentExp: updatedExp,
      },
    });

    return { settled: true, saveData: updatedSave };
  }

  public isRunSettled(runId: string): boolean {
    return this.settledRunIds.has(runId);
  }

  public clearSettledRuns(): void {
    this.settledRunIds.clear();
  }
}

export const runRewardSettlementService = RunRewardSettlementService.getInstance();
