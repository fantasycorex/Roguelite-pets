import { CombatEngine } from '../combat/CombatEngine';
import { BattleRunState } from '../state/BattleRunState';
import { CreatureStats } from '../../types/creature';
import { WaveConfig } from '../../types/wave';
import { WAVES_DATA_MAP1, WAVES_DATA_MAP2 } from '../../data/waves.data';
import { TraitConfig } from '../../types/trait';
import { runRewardSettlementService } from '../services/RunRewardSettlementService';

export class RunController {
  private combatEngine: CombatEngine;
  private runState: BattleRunState;
  private waveSet: WaveConfig[];
  private activeNextRunBuff?: { type: string; multiplier: number };

  constructor(
    petStats: CreatureStats,
    mapId: string = 'heartwood_clearing',
    speciesId: string = 'guardian_blob',
    fullness: number = 100,
    affection: number = 100,
    activeNextRunBuff?: { type: string; multiplier: number },
  ) {
    this.selectedMapId = mapId;
    this.waveSet = mapId === 'moonlit_crossing' ? WAVES_DATA_MAP2 : WAVES_DATA_MAP1;
    this.activeNextRunBuff = activeNextRunBuff;

    this.runState = new BattleRunState(petStats, mapId, speciesId, fullness, affection);
    this.runState.totalWaves = this.waveSet.length;

    this.combatEngine = new CombatEngine(
      this.runState.mapConfig.waypoints,
      this.runState.mapConfig.towerPosition,
      this.runState,
    );
  }

  private selectedMapId: string;

  public getSelectedMapId(): string {
    return this.selectedMapId;
  }

  public startRun(): void {
    this.combatEngine.startWave(this.waveSet[0]);
  }

  public update(deltaSeconds: number): void {
    this.combatEngine.update(deltaSeconds);
  }

  public getRunState(): BattleRunState {
    return this.runState;
  }

  public getCombatEngine(): CombatEngine {
    return this.combatEngine;
  }

  public setTimeScale(scale: number): void {
    this.combatEngine.setTimeScale(scale);
  }

  public togglePause(): boolean {
    return this.combatEngine.togglePause();
  }

  public getTraitOffers(): TraitConfig[] {
    return this.combatEngine.getTraitOffers();
  }

  public rerollTraitOffers(): TraitConfig[] | null {
    return this.combatEngine.rerollTraitOffers();
  }

  public selectTraitOffer(trait: TraitConfig): void {
    this.combatEngine.selectTraitOffer(trait);
    const nextWaveIndex = this.runState.currentWave;
    if (nextWaveIndex < this.waveSet.length) {
      this.combatEngine.startWave(this.waveSet[nextWaveIndex]);
    }
  }

  public settleRunRewards(): void {
    runRewardSettlementService.settleRunRewards({
      runId: this.runState.runId,
      coinsEarned: this.runState.coinsCollected,
      expEarned: this.runState.expEarned,
      droppedEquipment: this.runState.droppedEquipment,
      expMultiplier:
        this.activeNextRunBuff?.type === 'exp_buff' ? this.activeNextRunBuff.multiplier : 1.0,
    });
  }
}
