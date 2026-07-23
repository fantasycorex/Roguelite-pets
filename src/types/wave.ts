export interface WaveEnemyGroup {
  enemyTypeId: string;
  count: number;
  spawnIntervalMs: number;
}

export interface WaveConfig {
  waveIndex: number;
  enemies: WaveEnemyGroup[];
}
