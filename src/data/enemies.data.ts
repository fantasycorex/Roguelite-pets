import { EnemyConfig } from '../types/enemy';

export const ENEMIES_DATA: Record<string, EnemyConfig> = {
  basic: {
    id: 'basic',
    name: 'Gloom Beetle',
    maxHp: 50,
    moveSpeed: 60, // pixels per sec
    damageToTower: 10,
    coinReward: 5,
    expReward: 10,
    colorHex: 0xff0054,
  },
  fast: {
    id: 'fast',
    name: 'Shadow Runner',
    maxHp: 30,
    moveSpeed: 110,
    damageToTower: 5,
    coinReward: 8,
    expReward: 15,
    colorHex: 0xffbd00,
  },
  tank: {
    id: 'tank',
    name: 'Void Golem',
    maxHp: 150,
    moveSpeed: 35,
    damageToTower: 25,
    coinReward: 20,
    expReward: 35,
    colorHex: 0x7209b7,
  },
};
