import { BattleRunState } from '../state/BattleRunState';
import { CombatEngine } from '../combat/CombatEngine';
import { DEFAULT_CREATURE_STATS } from '../../data/creatures.data';
import { WAVES_DATA_MAP1 } from '../../data/waves.data';

export interface SimulationResult {
  runId: string;
  speciesId: string;
  mapId: string;
  isVictory: boolean;
  totalWavesCleared: number;
  finalTowerHp: number;
  coinsEarned: number;
  expEarned: number;
  totalDamageDealt: number;
  simulatedTimeSeconds: number;
}

export interface SimulationReport {
  totalRuns: number;
  wins: number;
  losses: number;
  winRatePercentage: number;
  averageCoins: number;
  averageExp: number;
  averageTowerHpRemaining: number;
  speciesWinRates: Record<string, number>;
}

export class HeadlessRunSimulator {
  public static runSingleSimulation(
    speciesId: string = 'guardian_blob',
    mapId: string = 'heartwood_clearing',
    runSeed: number = 12345,
  ): SimulationResult {
    const runState = new BattleRunState(DEFAULT_CREATURE_STATS, mapId, speciesId);
    runState.runSeed = runSeed;

    const combatEngine = new CombatEngine(
      runState.mapConfig.waypoints,
      runState.mapConfig.towerPosition,
      runState,
    );

    let totalSimulatedTime = 0;
    let isVictory = false;

    // Simulate 5 Waves
    for (let waveIdx = 0; waveIdx < WAVES_DATA_MAP1.length; waveIdx++) {
      if (runState.towerHp <= 0) break;

      const waveConfig = WAVES_DATA_MAP1[waveIdx];
      combatEngine.startWave(waveConfig);

      // Step simulation by 0.1s increments (max 120s per wave)
      for (let step = 0; step < 1200; step++) {
        if (runState.activeEnemies.size === 0 && step > 10) break;
        if (runState.towerHp <= 0) break;

        combatEngine.update(0.1);
        totalSimulatedTime += 0.1;
      }

      if (waveIdx === WAVES_DATA_MAP1.length - 1 && runState.towerHp > 0) {
        isVictory = true;
      }
    }

    return {
      runId: runState.runId,
      speciesId,
      mapId,
      isVictory,
      totalWavesCleared: runState.currentWave,
      finalTowerHp: runState.towerHp,
      coinsEarned: runState.coinsCollected,
      expEarned: runState.expEarned,
      totalDamageDealt: Math.round(runState.expEarned * 2.5),
      simulatedTimeSeconds: Math.round(totalSimulatedTime),
    };
  }

  public static runBatchSimulation(runCount: number = 30): SimulationReport {
    const speciesList = ['guardian_blob', 'spark_fox', 'prowler_lynx'];
    const results: SimulationResult[] = [];
    const speciesWins: Record<string, number> = { guardian_blob: 0, spark_fox: 0, prowler_lynx: 0 };
    const speciesCounts: Record<string, number> = {
      guardian_blob: 0,
      spark_fox: 0,
      prowler_lynx: 0,
    };

    for (let i = 0; i < runCount; i++) {
      const species = speciesList[i % speciesList.length];
      const res = this.runSingleSimulation(species, 'heartwood_clearing', 1000 + i);

      results.push(res);
      speciesCounts[species]++;
      if (res.isVictory) speciesWins[species]++;
    }

    const wins = results.filter((r) => r.isVictory).length;
    const losses = runCount - wins;
    const totalCoins = results.reduce((acc, r) => acc + r.coinsEarned, 0);
    const totalExp = results.reduce((acc, r) => acc + r.expEarned, 0);
    const totalTowerHp = results.reduce((acc, r) => acc + r.finalTowerHp, 0);

    const speciesWinRates: Record<string, number> = {};
    for (const sp of speciesList) {
      const total = speciesCounts[sp] || 1;
      speciesWinRates[sp] = Math.round(((speciesWins[sp] || 0) / total) * 100);
    }

    return {
      totalRuns: runCount,
      wins,
      losses,
      winRatePercentage: Math.round((wins / runCount) * 100),
      averageCoins: Math.round(totalCoins / runCount),
      averageExp: Math.round(totalExp / runCount),
      averageTowerHpRemaining: Math.round(totalTowerHp / runCount),
      speciesWinRates,
    };
  }
}
