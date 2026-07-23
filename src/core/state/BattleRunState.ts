import { EnemyConfig } from '../../types/enemy';
import { CreatureStats } from '../../types/creature';
import { MapConfig, TowerConfig, ActiveStatusEffect, TargetingMode } from '../../types/combat';
import { MAPS_DATA } from '../../data/maps.data';
import { TOWERS_DATA } from '../../data/towers.data';
import { SPECIES_DATA } from '../../data/species.data';

export type EnemyLifecycleState = 'ALIVE' | 'DYING' | 'REMOVED';

export interface ActiveEnemy {
  instanceId: string;
  config: EnemyConfig;
  currentHp: number;
  maxHp: number;
  distanceCovered: number;
  x: number;
  y: number;
  state: EnemyLifecycleState;
  rewardGranted: boolean;
  isFightingCreature?: boolean;
  trackIndex?: number; // 0 = primary waypoints, 1 = secondary waypoints
  bossPhase?: 1 | 2;
  bossEnraged?: boolean;
  attackTimer?: number;
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
  isChain?: boolean;
}

export class BattleRunState {
  public runId: string;
  public selectedMapId: string = 'heartwood_clearing';
  public currentWave: number = 1;
  public totalWaves: number = 5;

  public mapConfig: MapConfig = MAPS_DATA.heartwood_clearing;
  public towerConfig: TowerConfig = TOWERS_DATA.nexus_core;

  public towerHp: number = 100;
  public maxTowerHp: number = 100;

  public speciesId: string = 'guardian_blob';
  public attackId: string = 'impact_bash';
  public abilityId: string = 'aegis_barrier';
  public behaviourStyle: string = 'guardian_taunt';
  public evolutionStage: number = 1;
  public personalityTraits: string[] = [];
  public normalAbilityId: string = 'impact_bash';
  public specialAbilityId: string = 'aegis_barrier';

  public creatureFullness: number = 100;
  public creatureAffection: number = 100;

  public creatureCurrentHp: number = 100;
  public creatureMaxHp: number = 100;
  public isCreatureDowned: boolean = false;
  public creatureDownedTimer: number = 0;

  public petStats: CreatureStats;
  public petX: number = 640;
  public petY: number = 360;
  public petPatrolAngle: number = 0;
  public petAttackCooldownTimer: number = 0;
  public petSpecialCooldownTimer: number = 0;
  public hasSpecialAbility: boolean = false;
  public targetingMode: TargetingMode = 'closest_to_tower';
  public rerollsRemaining: number = 1;

  public activeEnemies: Map<string, ActiveEnemy> = new Map();
  public activeProjectiles: ActiveProjectile[] = [];
  public activeTraits: string[] = [];
  public droppedEquipment: string[] = [];
  public coinsCollected: number = 0;
  public expEarned: number = 0;
  public runSeed: number = 12345;

  public activeStatusEffects: Map<string, ActiveStatusEffect[]> = new Map();

  // Developer Controls
  public timeScale: number = 1.0;
  public isPaused: boolean = false;

  constructor(
    petStats: CreatureStats,
    mapId: string = 'heartwood_clearing',
    speciesId: string = 'guardian_blob',
    fullness: number = 100,
    affection: number = 100,
  ) {
    this.petStats = { ...petStats };
    this.creatureMaxHp = petStats.maxHp;
    this.creatureCurrentHp = petStats.maxHp;
    this.selectedMapId = mapId;
    this.mapConfig = MAPS_DATA[mapId] || MAPS_DATA.heartwood_clearing;

    this.speciesId = speciesId;
    const speciesConfig = SPECIES_DATA[speciesId] || SPECIES_DATA.guardian_blob;
    this.attackId = speciesConfig.attackId || 'impact_bash';
    this.abilityId = speciesConfig.abilityId || 'aegis_barrier';
    this.behaviourStyle = speciesConfig.behaviourStyle || 'guardian_taunt';
    this.normalAbilityId = this.attackId;
    this.specialAbilityId = this.abilityId;

    this.creatureFullness = fullness;
    this.creatureAffection = affection;

    this.runSeed = Math.floor(Math.random() * 1000000);
    this.runId = `run_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
  }

  public resetRun(petStats: CreatureStats): void {
    this.currentWave = 1;
    this.towerHp = this.maxTowerHp;
    this.petStats = { ...petStats };
    this.creatureMaxHp = petStats.maxHp;
    this.creatureCurrentHp = petStats.maxHp;
    this.isCreatureDowned = false;
    this.creatureDownedTimer = 0;
    this.rerollsRemaining = 1;
    this.activeEnemies.clear();
    this.activeProjectiles = [];
    this.activeTraits = [];
    this.droppedEquipment = [];
    this.coinsCollected = 0;
    this.expEarned = 0;
    this.petAttackCooldownTimer = 0;
    this.petSpecialCooldownTimer = 0;
    this.hasSpecialAbility = false;
    this.activeStatusEffects.clear();
    this.runSeed = Math.floor(Math.random() * 1000000);
    this.runId = `run_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
  }
}
