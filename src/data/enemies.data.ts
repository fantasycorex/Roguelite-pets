import { EnemyConfig } from '../types/enemy';

export const ENEMIES_DATA: Record<string, EnemyConfig> = {
  // 1. Standard Beetle
  basic: {
    id: 'basic',
    name: 'Gloom Beetle',
    maxHp: 35,
    moveSpeed: 60,
    damageToTower: 10,
    coinReward: 5,
    expReward: 10,
    colorHex: 0xff0054,
    behaviour: {
      style: 'standard',
      attackRange: 40,
      attackSpeed: 1.0,
      attackDamage: 10,
      targetPriority: 'tower',
    },
  },

  // 2. Fast Tower Rusher
  fast: {
    id: 'fast',
    name: 'Shadow Runner',
    maxHp: 20,
    moveSpeed: 120,
    damageToTower: 8,
    coinReward: 8,
    expReward: 15,
    colorHex: 0xffbd00,
    behaviour: {
      style: 'rush_tower',
      attackRange: 20,
      attackSpeed: 1.0,
      attackDamage: 5,
      targetPriority: 'tower',
    },
  },

  // 3. Tank Creature Fighter
  tank: {
    id: 'tank',
    name: 'Void Golem',
    maxHp: 120,
    moveSpeed: 35,
    damageToTower: 25,
    coinReward: 20,
    expReward: 35,
    colorHex: 0x7209b7,
    behaviour: {
      style: 'fight_creature',
      attackRange: 95,
      attackSpeed: 0.8,
      attackDamage: 15,
      targetPriority: 'creature',
    },
  },

  // 4. Ranged Path Attacker
  spitter: {
    id: 'spitter',
    name: 'Gloom Spitter',
    maxHp: 45,
    moveSpeed: 50,
    damageToTower: 12,
    coinReward: 12,
    expReward: 20,
    colorHex: 0x38b000,
    behaviour: {
      style: 'ranged_path',
      attackRange: 200,
      attackSpeed: 0.8,
      attackDamage: 8,
      targetPriority: 'tower',
    },
  },

  // 5. Fast Floating Disruptor
  wisp: {
    id: 'wisp',
    name: 'Shadow Wisp',
    maxHp: 25,
    moveSpeed: 140,
    damageToTower: 6,
    coinReward: 10,
    expReward: 18,
    colorHex: 0x4cc9f0,
    behaviour: {
      style: 'standard',
      attackRange: 30,
      attackSpeed: 1.2,
      attackDamage: 6,
      targetPriority: 'tower',
      statusEffectsOnHit: [{ type: 'slow', duration: 2.0, value: 0.5 }],
    },
  },

  // 6. Stealth High-Tower-Damage Saboteur
  saboteur: {
    id: 'saboteur',
    name: 'Abyssal Saboteur',
    maxHp: 60,
    moveSpeed: 110,
    damageToTower: 35,
    coinReward: 25,
    expReward: 40,
    colorHex: 0xef4444,
    behaviour: {
      style: 'rush_tower',
      attackRange: 25,
      attackSpeed: 1.0,
      attackDamage: 20,
      targetPriority: 'tower',
    },
  },

  // 7. TWO-PHASE BOSS ENCOUNTER
  boss_sovereign: {
    id: 'boss_sovereign',
    name: 'Void Sovereign',
    maxHp: 500,
    moveSpeed: 30,
    damageToTower: 50,
    coinReward: 100,
    expReward: 200,
    colorHex: 0x9333ea,
    isBoss: true,
    behaviour: {
      style: 'boss_sovereign',
      attackRange: 150,
      attackSpeed: 0.6,
      attackDamage: 25,
      targetPriority: 'creature',
    },
  },
};
