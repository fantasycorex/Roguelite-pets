import { EnemyConfig } from '../../types/enemy';
import { CreatureStats } from '../../types/creature';

export interface ActiveEnemy {
  instanceId: string;
  config: EnemyConfig;
  currentHp: number;
  maxHp: number;
  distanceCovered: number;
  x: number;
  y: number;
}

export interface ActiveProjectile {
  id: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  targetEnemyInstanceId: string;
  damage: number;
  progress: number; // 0 to 1
  speed: number;
}

export class BattleRunState {
  public currentWave: number = 1;
  public totalWaves: number = 5;
  public towerHp: number = 100;
  public maxTowerHp: number = 100;

  public petStats: CreatureStats;
  public petX: number = 640;
  public petY: number = 360;
  public petPatrolAngle: number = 0;
  public petAttackCooldownTimer: number = 0;
  public petSpecialCooldownTimer: number = 0;

  public activeEnemies: Map<string, ActiveEnemy> = new Map();
  public activeProjectiles: ActiveProjectile[] = [];
  public activeTraits: string[] = [];
  public droppedEquipment: string[] = [];
  public coinsCollected: number = 0;
  public expEarned: number = 0;
  public runSeed: number = 12345;

  constructor(petStats: CreatureStats) {
    this.petStats = { ...petStats };
    this.runSeed = Math.floor(Math.random() * 1000000);
  }

  public resetRun(petStats: CreatureStats): void {
    this.currentWave = 1;
    this.towerHp = this.maxTowerHp;
    this.petStats = { ...petStats };
    this.activeEnemies.clear();
    this.activeProjectiles = [];
    this.activeTraits = [];
    this.droppedEquipment = [];
    this.coinsCollected = 0;
    this.expEarned = 0;
    this.petAttackCooldownTimer = 0;
    this.petSpecialCooldownTimer = 0;
    this.runSeed = Math.floor(Math.random() * 1000000);
  }
}
