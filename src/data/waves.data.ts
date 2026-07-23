import { WaveConfig } from '../types/wave';

export const WAVES_DATA_MAP1: WaveConfig[] = [
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
      { enemyTypeId: 'spitter', count: 3, spawnIntervalMs: 1500 },
      { enemyTypeId: 'tank', count: 1, spawnIntervalMs: 2000 },
    ],
  },
  {
    waveIndex: 4,
    enemies: [
      { enemyTypeId: 'fast', count: 8, spawnIntervalMs: 600 },
      { enemyTypeId: 'wisp', count: 4, spawnIntervalMs: 1000 },
      { enemyTypeId: 'tank', count: 2, spawnIntervalMs: 1800 },
    ],
  },
  {
    waveIndex: 5,
    enemies: [
      { enemyTypeId: 'basic', count: 8, spawnIntervalMs: 800 },
      { enemyTypeId: 'saboteur', count: 3, spawnIntervalMs: 1200 },
      { enemyTypeId: 'tank', count: 3, spawnIntervalMs: 1500 },
    ],
  },
];

export const WAVES_DATA_MAP2: WaveConfig[] = [
  {
    waveIndex: 1,
    enemies: [
      { enemyTypeId: 'basic', count: 6, spawnIntervalMs: 1200 },
      { enemyTypeId: 'fast', count: 4, spawnIntervalMs: 1000 },
    ],
  },
  {
    waveIndex: 2,
    enemies: [
      { enemyTypeId: 'spitter', count: 4, spawnIntervalMs: 1200 },
      { enemyTypeId: 'wisp', count: 5, spawnIntervalMs: 800 },
    ],
  },
  {
    waveIndex: 3,
    enemies: [
      { enemyTypeId: 'saboteur', count: 3, spawnIntervalMs: 1500 },
      { enemyTypeId: 'tank', count: 2, spawnIntervalMs: 2000 },
      { enemyTypeId: 'spitter', count: 4, spawnIntervalMs: 1000 },
    ],
  },
  {
    waveIndex: 4,
    enemies: [
      { enemyTypeId: 'fast', count: 10, spawnIntervalMs: 500 },
      { enemyTypeId: 'saboteur', count: 4, spawnIntervalMs: 1000 },
      { enemyTypeId: 'wisp', count: 6, spawnIntervalMs: 800 },
    ],
  },
  {
    waveIndex: 5,
    enemies: [
      { enemyTypeId: 'boss_sovereign', count: 1, spawnIntervalMs: 0 },
      { enemyTypeId: 'spitter', count: 4, spawnIntervalMs: 2000 },
    ],
  },
];

// Fallback legacy export
export const WAVES_DATA = WAVES_DATA_MAP1;
