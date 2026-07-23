import { PathEngine, Point } from './PathEngine';
import { TargetingEngine } from './TargetingEngine';
import { BattleRunState, ActiveEnemy, ActiveProjectile } from '../state/BattleRunState';
import { WaveConfig } from '../../types/wave';
import { ENEMIES_DATA } from '../../data/enemies.data';
import { eventBus } from '../events/EventBus';
import { TraitEngine } from '../traits/TraitEngine';
import { TraitConfig } from '../../types/trait';
import { LootEngine } from '../loot/LootEngine';
import { SeededRandom } from '../utils/SeededRandom';

export class CombatEngine {
  private pathEngine: PathEngine;
  private runState: BattleRunState;
  private traitEngine: TraitEngine;
  private rng: SeededRandom;

  private spawnQueue: { enemyTypeId: string; spawnTimeMs: number }[] = [];
  private waveElapsedTimeMs: number = 0;
  private isWaveActive: boolean = false;
  private instanceCounter: number = 0;

  private patrolRadius: number = 80;
  private towerCenter: Point;

  constructor(pathWaypoints: Point[], towerCenter: Point, runState: BattleRunState) {
    this.pathEngine = new PathEngine(pathWaypoints);
    this.towerCenter = towerCenter;
    this.runState = runState;
    this.rng = new SeededRandom(runState.runSeed);
    this.traitEngine = new TraitEngine(runState.runSeed);
  }

  public startWave(waveConfig: WaveConfig): void {
    this.runState.currentWave = waveConfig.waveIndex;
    this.runState.activeEnemies.clear();
    this.runState.activeProjectiles = [];
    this.waveElapsedTimeMs = 0;
    this.spawnQueue = [];

    let currentOffset = 500; // start 500ms into wave
    for (const group of waveConfig.enemies) {
      for (let i = 0; i < group.count; i++) {
        this.spawnQueue.push({
          enemyTypeId: group.enemyTypeId,
          spawnTimeMs: currentOffset,
        });
        currentOffset += group.spawnIntervalMs;
      }
    }

    this.isWaveActive = true;
    eventBus.emit('WAVE_STARTED', { waveIndex: waveConfig.waveIndex });
  }

  public selectTraitOffer(trait: TraitConfig): void {
    this.traitEngine.applyTrait(trait, this.runState);
    eventBus.emit('TRAIT_SELECTED', { trait });
  }

  public getTraitOffers(): TraitConfig[] {
    return this.traitEngine.generateTraitOffers(3);
  }

  public update(deltaSeconds: number): void {
    if (!this.isWaveActive) return;

    const deltaMs = deltaSeconds * 1000;
    this.waveElapsedTimeMs += deltaMs;

    // 1. Process Spawner Queue
    while (this.spawnQueue.length > 0 && this.spawnQueue[0].spawnTimeMs <= this.waveElapsedTimeMs) {
      const spawnItem = this.spawnQueue.shift()!;
      this.spawnEnemy(spawnItem.enemyTypeId);
    }

    // 2. Move Pet in Patrol Orbit
    this.updatePetPatrol(deltaSeconds);

    // 3. Move Active Enemies
    this.updateEnemies(deltaSeconds);

    // 4. Pet Attack Logic
    this.updatePetCombat(deltaSeconds);

    // 5. Update Projectiles
    this.updateProjectiles(deltaSeconds);

    // 6. Check Wave Completion
    if (this.spawnQueue.length === 0 && this.runState.activeEnemies.size === 0) {
      this.isWaveActive = false;
      eventBus.emit('WAVE_COMPLETED', {
        waveIndex: this.runState.currentWave,
        coinsEarned: this.runState.coinsCollected,
      });
    }
  }

  private spawnEnemy(enemyTypeId: string): void {
    const config = ENEMIES_DATA[enemyTypeId];
    if (!config) return;

    this.instanceCounter++;
    const instanceId = `enemy_${this.instanceCounter}`;
    const startPos = this.pathEngine.getPositionAlongPath(0);

    const enemy: ActiveEnemy = {
      instanceId,
      config,
      currentHp: config.maxHp,
      maxHp: config.maxHp,
      distanceCovered: 0,
      x: startPos.x,
      y: startPos.y,
    };

    this.runState.activeEnemies.set(instanceId, enemy);
    eventBus.emit('ENEMY_SPAWNED', enemy);
  }

  private updatePetPatrol(deltaSeconds: number): void {
    this.runState.petPatrolAngle += deltaSeconds * 1.5;
    this.runState.petX =
      this.towerCenter.x + Math.cos(this.runState.petPatrolAngle) * this.patrolRadius;
    this.runState.petY =
      this.towerCenter.y + Math.sin(this.runState.petPatrolAngle) * this.patrolRadius;
  }

  private updateEnemies(deltaSeconds: number): void {
    const enemiesToRemove: string[] = [];

    for (const enemy of this.runState.activeEnemies.values()) {
      if (enemy.currentHp <= 0) {
        enemiesToRemove.push(enemy.instanceId);
        continue;
      }

      enemy.distanceCovered += enemy.config.moveSpeed * deltaSeconds;
      const pos = this.pathEngine.getPositionAlongPath(enemy.distanceCovered);

      enemy.x = pos.x;
      enemy.y = pos.y;

      // Check reached tower
      if (pos.reachedEnd) {
        this.runState.towerHp = Math.max(0, this.runState.towerHp - enemy.config.damageToTower);
        eventBus.emit('TOWER_DAMAGED', {
          currentHp: this.runState.towerHp,
          maxHp: this.runState.maxTowerHp,
          damage: enemy.config.damageToTower,
        });

        enemiesToRemove.push(enemy.instanceId);

        if (this.runState.towerHp <= 0) {
          this.isWaveActive = false;
          eventBus.emit('TOWER_DESTROYED');
          break;
        }
      }
    }

    for (const id of enemiesToRemove) {
      this.runState.activeEnemies.delete(id);
    }
  }

  private updatePetCombat(deltaSeconds: number): void {
    // Normal attack cooldown
    if (this.runState.petAttackCooldownTimer > 0) {
      this.runState.petAttackCooldownTimer -= deltaSeconds;
    }

    if (this.runState.petAttackCooldownTimer <= 0) {
      const activeEnemiesArray = Array.from(this.runState.activeEnemies.values());
      const target = TargetingEngine.selectTarget(
        this.runState.petX,
        this.runState.petY,
        this.runState.petStats.attackRange,
        activeEnemiesArray,
      );

      if (target) {
        this.fireProjectile(target);
        const cooldown = 1 / this.runState.petStats.attackSpeed;
        this.runState.petAttackCooldownTimer = cooldown;
      }
    }

    // Special Ability cooldown
    if (this.runState.petSpecialCooldownTimer > 0) {
      this.runState.petSpecialCooldownTimer -= deltaSeconds;
    } else if (this.runState.activeEnemies.size > 0) {
      this.triggerSpecialAbility();
      this.runState.petSpecialCooldownTimer = this.runState.petStats.specialCooldown;
    }
  }

  private handleEnemyDeath(enemy: ActiveEnemy): void {
    const loot = LootEngine.rollLoot(enemy.config, this.rng, 30); // 30% equip drop chance

    this.runState.coinsCollected += loot.coins;
    this.runState.expEarned += loot.exp;

    if (loot.equipment) {
      this.runState.droppedEquipment.push(loot.equipment.id);
      eventBus.emit('EQUIPMENT_DROPPED', {
        equipment: loot.equipment,
        x: enemy.x,
        y: enemy.y,
      });
    }

    eventBus.emit('ENEMY_KILLED', {
      instanceId: enemy.instanceId,
      x: enemy.x,
      y: enemy.y,
      coinReward: loot.coins,
      expReward: loot.exp,
      equipment: loot.equipment,
    });
  }

  private triggerSpecialAbility(): void {
    const radius = 140;
    const aoeDamage = 40;
    const hitEnemies: string[] = [];

    for (const enemy of this.runState.activeEnemies.values()) {
      const dist = Math.hypot(enemy.x - this.runState.petX, enemy.y - this.runState.petY);
      if (dist <= radius) {
        enemy.currentHp -= aoeDamage;
        hitEnemies.push(enemy.instanceId);

        eventBus.emit('ENEMY_DAMAGED', {
          instanceId: enemy.instanceId,
          currentHp: enemy.currentHp,
          maxHp: enemy.maxHp,
        });

        if (enemy.currentHp <= 0) {
          this.handleEnemyDeath(enemy);
        }
      }
    }

    eventBus.emit('SPECIAL_ABILITY_USED', {
      x: this.runState.petX,
      y: this.runState.petY,
      radius,
      damage: aoeDamage,
      hitCount: hitEnemies.length,
    });
  }

  private fireProjectile(target: ActiveEnemy): void {
    const projectile: ActiveProjectile = {
      id: `proj_${Date.now()}_${Math.random()}`,
      startX: this.runState.petX,
      startY: this.runState.petY,
      targetX: target.x,
      targetY: target.y,
      targetEnemyInstanceId: target.instanceId,
      damage: this.runState.petStats.attackDamage,
      progress: 0,
      speed: 4.0, // progress units per sec
    };

    this.runState.activeProjectiles.push(projectile);
    eventBus.emit('CREATURE_ATTACKED', { targetX: target.x, targetY: target.y });
  }

  private updateProjectiles(deltaSeconds: number): void {
    const remainingProjectiles: ActiveProjectile[] = [];

    for (const proj of this.runState.activeProjectiles) {
      proj.progress += proj.speed * deltaSeconds;

      const targetEnemy = this.runState.activeEnemies.get(proj.targetEnemyInstanceId);
      if (targetEnemy) {
        proj.targetX = targetEnemy.x;
        proj.targetY = targetEnemy.y;
      }

      if (proj.progress >= 1.0) {
        // Impact
        if (targetEnemy) {
          targetEnemy.currentHp -= proj.damage;
          eventBus.emit('ENEMY_DAMAGED', {
            instanceId: targetEnemy.instanceId,
            currentHp: targetEnemy.currentHp,
            maxHp: targetEnemy.maxHp,
          });

          if (targetEnemy.currentHp <= 0) {
            this.handleEnemyDeath(targetEnemy);
            this.runState.activeEnemies.delete(targetEnemy.instanceId);
          }
        }
      } else {
        remainingProjectiles.push(proj);
      }
    }

    this.runState.activeProjectiles = remainingProjectiles;
  }

  public getRunState(): BattleRunState {
    return this.runState;
  }

  public getPathEngine(): PathEngine {
    return this.pathEngine;
  }

  public getTraitEngine(): TraitEngine {
    return this.traitEngine;
  }
}
