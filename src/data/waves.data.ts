import { WaveConfig } from '../types/wave';

export const WAVES_DATA: WaveConfig[] = [
  {
    waveIndex: 1,
    enemies: [{ enemyTypeId: 'basic', count: 5, spawnIntervalMs: 1500 }],
  },
  {
    waveIndex: 2,
    enemies: [
      { enemyTypeId: 'basic', count: 5, spawnIntervalMs: 1200 },
      { enemyTypeId: 'fast', count: 3, spawnIntervalMs: 1000 },
    ],
  },
  {
    waveIndex: 3,
    enemies: [
      { enemyTypeId: 'basic', count: 6, spawnIntervalMs: 1000 },
      { enemyTypeId: 'fast', count: 4, spawnIntervalMs: 800 },
      { enemyTypeId: 'tank', count: 1, spawnIntervalMs: 2000 },
    ],
  },
  {
    waveIndex: 4,
    enemies: [
      { enemyTypeId: 'fast', count: 8, spawnIntervalMs: 600 },
      { enemyTypeId: 'tank', count: 2, spawnIntervalMs: 1800 },
    ],
  },
  {
    waveIndex: 5,
    enemies: [
      { enemyTypeId: 'basic', count: 8, spawnIntervalMs: 800 },
      { enemyTypeId: 'fast', count: 6, spawnIntervalMs: 600 },
      { enemyTypeId: 'tank', count: 3, spawnIntervalMs: 1500 },
    ],
  },
];
