import { EnemyBehaviourConfig } from './combat';

export interface EnemyConfig {
  id: string;
  name: string;
  maxHp: number;
  moveSpeed: number; // pixels per second
  damageToTower: number;
  coinReward: number;
  expReward: number;
  colorHex: number;
  behaviour?: EnemyBehaviourConfig;
}
