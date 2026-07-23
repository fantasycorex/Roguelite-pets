import { PathEngine, Point } from './PathEngine';
import { TargetingEngine } from './TargetingEngine';
import { BattleRunState, ActiveEnemy, ActiveProjectile } from '../state/BattleRunState';
import { WaveConfig } from '../../types/wave';
import { ENEMIES_DATA } from '../../data/enemies.data';
import { ABILITIES_DATA } from '../../data/abilities.data';
import { eventBus } from '../events/EventBus';
import { TraitEngine } from '../traits/TraitEngine';
import { TraitConfig } from '../../types/trait';
import { TRAITS_DATA } from '../../data/traits.data';
import { LootEngine } from '../loot/LootEngine';
import { SeededRandom } from '../utils/SeededRandom';
import { StatusEffectConfig, ActiveStatusEffect, DamageEvent } from '../../types/combat';

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
    this.patrolRadius = runState.mapConfig.patrolRadius || 80;
    this.rng = new SeededRandom(runState.runSeed);
    this.traitEngine = new TraitEngine(runState.runSeed);
  }

  public startWave(waveConfig: WaveConfig): void {
    this.runState.currentWave = waveConfig.waveIndex;
    this.runState.activeEnemies.clear();
    this.runState.activeProjectiles = [];
    this.runState.activeStatusEffects.clear();
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

  // Developer Controls
  public setTimeScale(scale: number): void {
    this.runState.timeScale = Math.max(0.25, Math.min(4.0, scale));
  }

  public togglePause(): boolean {
    this.runState.isPaused = !this.runState.isPaused;
    return this.runState.isPaused;
  }

  public update(deltaSeconds: number): void {
    if (!this.isWaveActive || this.runState.isPaused) return;

    // Apply timeScale
    const scaledDelta = deltaSeconds * this.runState.timeScale;
    const deltaMs = scaledDelta * 1000;
    this.waveElapsedTimeMs += deltaMs;

    // 1. Process Status Effects Ticks
    this.updateStatusEffects(scaledDelta);

    // 2. Process Creature Downed Recovery
    this.updateCreatureDownedState(scaledDelta);

    // 3. Process Spawner Queue
    while (this.spawnQueue.length > 0 && this.spawnQueue[0].spawnTimeMs <= this.waveElapsedTimeMs) {
      const spawnItem = this.spawnQueue.shift()!;
      this.spawnEnemy(spawnItem.enemyTypeId);
    }

    // 4. Move Pet in Patrol Orbit (unless downed/stunned)
    if (!this.runState.isCreatureDowned && !this.hasStatusEffect('creature', 'stun')) {
      this.updatePetPatrol(scaledDelta);
    }

    // 5. Move Active Enemies & handle combat behaviors
    this.updateEnemies(scaledDelta);

    // 6. Pet Attack Logic
    if (!this.runState.isCreatureDowned && !this.hasStatusEffect('creature', 'stun')) {
      this.updatePetCombat(scaledDelta);
    }

    // 7. Update Projectiles
    this.updateProjectiles(scaledDelta);

    // 8. Check Wave Completion
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
      state: 'ALIVE',
      rewardGranted: false,
    };

    this.runState.activeEnemies.set(instanceId, enemy);
    eventBus.emit('ENEMY_SPAWNED', enemy);
  }

  private updatePetPatrol(deltaSeconds: number): void {
    const baseAngularSpeed = 1.5;
    let speedFactor = (this.runState.petStats.moveSpeed || 100) / 100;

    // Slow status effect on creature
    if (this.hasStatusEffect('creature', 'slow')) {
      speedFactor *= 0.5;
    }

    this.runState.petPatrolAngle += deltaSeconds * baseAngularSpeed * speedFactor;

    this.runState.petX =
      this.towerCenter.x + Math.cos(this.runState.petPatrolAngle) * this.patrolRadius;
    this.runState.petY =
      this.towerCenter.y + Math.sin(this.runState.petPatrolAngle) * this.patrolRadius;
  }

  private updateEnemies(deltaSeconds: number): void {
    const enemiesToRemove: string[] = [];

    for (const enemy of this.runState.activeEnemies.values()) {
      if (enemy.state !== 'ALIVE') {
        enemiesToRemove.push(enemy.instanceId);
        continue;
      }

      if (enemy.currentHp <= 0) {
        this.handleEnemyDeath(enemy);
        enemiesToRemove.push(enemy.instanceId);
        continue;
      }

      // Check stun
      if (this.hasStatusEffect(enemy.instanceId, 'stun')) {
        continue; // Stunned enemies do not move or attack
      }

      // Calculate effective move speed with slow effect
      let effectiveSpeed = enemy.config.moveSpeed;
      if (this.hasStatusEffect(enemy.instanceId, 'slow')) {
        effectiveSpeed *= 0.5;
      }

      const behaviour = enemy.config.behaviour;
      const distToPet = Math.hypot(enemy.x - this.runState.petX, enemy.y - this.runState.petY);

      // Tank behavior: stop and fight creature if in attack range
      if (
        behaviour?.style === 'fight_creature' &&
        !this.runState.isCreatureDowned &&
        distToPet <= (behaviour.attackRange || 70)
      ) {
        enemy.isFightingCreature = true;
        // Attack creature periodically
        this.damageCreature(
          enemy.instanceId,
          behaviour.attackDamage * deltaSeconds,
          behaviour.statusEffectsOnHit,
        );
      } else {
        enemy.isFightingCreature = false;
        enemy.distanceCovered += effectiveSpeed * deltaSeconds;
        const pos = this.pathEngine.getPositionAlongPath(enemy.distanceCovered);

        enemy.x = pos.x;
        enemy.y = pos.y;

        // Check reached tower
        if (pos.reachedEnd) {
          this.runState.towerHp = Math.max(0, this.runState.towerHp - enemy.config.damageToTower);

          const dmgEvent: DamageEvent = {
            sourceId: enemy.instanceId,
            targetId: 'tower',
            targetType: 'tower',
            damage: enemy.config.damageToTower,
          };
          eventBus.emit('DAMAGE_DEALT', dmgEvent);

          eventBus.emit('TOWER_DAMAGED', {
            currentHp: this.runState.towerHp,
            maxHp: this.runState.maxTowerHp,
            damage: enemy.config.damageToTower,
          });

          enemy.state = 'DYING';
          enemiesToRemove.push(enemy.instanceId);

          if (this.runState.towerHp <= 0) {
            this.isWaveActive = false;
            eventBus.emit('TOWER_DESTROYED');
            break;
          }
        }
      }
    }

    for (const id of enemiesToRemove) {
      const e = this.runState.activeEnemies.get(id);
      if (e) e.state = 'REMOVED';
      this.runState.activeEnemies.delete(id);
      this.runState.activeStatusEffects.delete(id);
    }
  }

  private damageCreature(
    sourceId: string,
    damageAmount: number,
    statusEffects?: StatusEffectConfig[],
  ): void {
    if (this.runState.isCreatureDowned) return;

    this.runState.creatureCurrentHp = Math.max(0, this.runState.creatureCurrentHp - damageAmount);

    const dmgEvent: DamageEvent = {
      sourceId,
      targetId: 'creature',
      targetType: 'creature',
      damage: damageAmount,
    };
    eventBus.emit('DAMAGE_DEALT', dmgEvent);
    eventBus.emit('CREATURE_DAMAGED', {
      currentHp: this.runState.creatureCurrentHp,
      maxHp: this.runState.creatureMaxHp,
    });

    if (statusEffects) {
      for (const eff of statusEffects) {
        this.applyStatusEffect('creature', eff, sourceId);
      }
    }

    if (this.runState.creatureCurrentHp <= 0) {
      this.runState.isCreatureDowned = true;
      this.runState.creatureDownedTimer = 5.0; // 5 sec revive timer
      eventBus.emit('CREATURE_DOWNED', { reviveTime: 5.0 });
    }
  }

  private updateCreatureDownedState(deltaSeconds: number): void {
    if (!this.runState.isCreatureDowned) return;

    this.runState.creatureDownedTimer -= deltaSeconds;
    if (this.runState.creatureDownedTimer <= 0) {
      this.runState.isCreatureDowned = false;
      this.runState.creatureCurrentHp = Math.round(this.runState.creatureMaxHp * 0.5); // Revive with 50% HP
      eventBus.emit('CREATURE_REVIVED', { currentHp: this.runState.creatureCurrentHp });
    }
  }

  private updatePetCombat(deltaSeconds: number): void {
    // Normal attack cooldown
    if (this.runState.petAttackCooldownTimer > 0) {
      this.runState.petAttackCooldownTimer -= deltaSeconds;
    }

    if (this.runState.petAttackCooldownTimer <= 0) {
      const activeEnemiesArray = Array.from(this.runState.activeEnemies.values()).filter(
        (e) => e.state === 'ALIVE',
      );
      const target = TargetingEngine.selectTarget(
        this.runState.petX,
        this.runState.petY,
        this.runState.petStats.attackRange,
        activeEnemiesArray,
        this.runState.targetingMode,
      );

      if (target) {
        this.fireProjectile(target as ActiveEnemy);
        const cooldown = 1 / this.runState.petStats.attackSpeed;
        this.runState.petAttackCooldownTimer = cooldown;
      }
    }

    // Special Ability cooldown (data-driven ability)
    const hasSpecialUnlocked =
      this.runState.hasSpecialAbility ||
      this.runState.activeTraits.some((id) => TRAITS_DATA[id]?.effect.type === 'special_ability');

    if (hasSpecialUnlocked) {
      if (this.runState.petSpecialCooldownTimer > 0) {
        this.runState.petSpecialCooldownTimer -= deltaSeconds;
      } else if (this.runState.activeEnemies.size > 0) {
        this.triggerSpecialAbility();
        this.runState.petSpecialCooldownTimer = this.runState.petStats.specialCooldown;
      }
    }
  }

  private handleEnemyDeath(enemy: ActiveEnemy): void {
    if (enemy.rewardGranted || enemy.state === 'REMOVED') return;

    enemy.state = 'DYING';
    enemy.rewardGranted = true;

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
    const ability = ABILITIES_DATA.aoe_pulse;
    const radius = ability.radius || 140;
    const aoeDamage = ability.damage || 40;
    const hitEnemies: string[] = [];

    for (const enemy of this.runState.activeEnemies.values()) {
      if (enemy.state !== 'ALIVE') continue;

      const dist = Math.hypot(enemy.x - this.runState.petX, enemy.y - this.runState.petY);
      if (dist <= radius) {
        enemy.currentHp -= aoeDamage;
        hitEnemies.push(enemy.instanceId);

        const dmgEvent: DamageEvent = {
          sourceId: 'creature',
          targetId: enemy.instanceId,
          targetType: 'enemy',
          damage: aoeDamage,
        };
        eventBus.emit('DAMAGE_DEALT', dmgEvent);

        eventBus.emit('ENEMY_DAMAGED', {
          instanceId: enemy.instanceId,
          currentHp: enemy.currentHp,
          maxHp: enemy.maxHp,
        });

        if (ability.statusEffects) {
          for (const eff of ability.statusEffects) {
            this.applyStatusEffect(enemy.instanceId, eff, 'creature');
          }
        }

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
    const ability = ABILITIES_DATA.basic_laser;
    const projectile: ActiveProjectile = {
      id: `proj_${Date.now()}_${Math.random()}`,
      startX: this.runState.petX,
      startY: this.runState.petY,
      targetX: target.x,
      targetY: target.y,
      targetEnemyInstanceId: target.instanceId,
      damage: this.runState.petStats.attackDamage || ability.damage,
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
      if (targetEnemy && targetEnemy.state === 'ALIVE') {
        proj.targetX = targetEnemy.x;
        proj.targetY = targetEnemy.y;
      }

      if (proj.progress >= 1.0) {
        // Impact
        if (targetEnemy && targetEnemy.state === 'ALIVE') {
          targetEnemy.currentHp -= proj.damage;

          const dmgEvent: DamageEvent = {
            sourceId: 'creature',
            targetId: targetEnemy.instanceId,
            targetType: 'enemy',
            damage: proj.damage,
          };
          eventBus.emit('DAMAGE_DEALT', dmgEvent);

          eventBus.emit('ENEMY_DAMAGED', {
            instanceId: targetEnemy.instanceId,
            currentHp: targetEnemy.currentHp,
            maxHp: targetEnemy.maxHp,
          });

          if (targetEnemy.currentHp <= 0) {
            this.handleEnemyDeath(targetEnemy);
          }
        }
      } else {
        remainingProjectiles.push(proj);
      }
    }

    this.runState.activeProjectiles = remainingProjectiles;
  }

  // Status Effects Engine
  public applyStatusEffect(
    targetId: string,
    effectConfig: StatusEffectConfig,
    sourceId?: string,
  ): void {
    let list = this.runState.activeStatusEffects.get(targetId);
    if (!list) {
      list = [];
      this.runState.activeStatusEffects.set(targetId, list);
    }

    // Refresh existing effect duration if present
    const existing = list.find((e) => e.type === effectConfig.type);
    if (existing) {
      existing.durationRemaining = Math.max(existing.durationRemaining, effectConfig.duration);
      existing.value = effectConfig.value;
    } else {
      list.push({
        id: `eff_${Date.now()}_${Math.random()}`,
        type: effectConfig.type,
        durationRemaining: effectConfig.duration,
        value: effectConfig.value,
        tickInterval: effectConfig.tickInterval,
        tickTimer: effectConfig.tickInterval || 0,
        sourceId,
      });
    }

    eventBus.emit('STATUS_EFFECT_APPLIED', { targetId, effect: effectConfig.type });
  }

  public hasStatusEffect(targetId: string, effectType: string): boolean {
    const list = this.runState.activeStatusEffects.get(targetId);
    return !!(list && list.some((e) => e.type === effectType && e.durationRemaining > 0));
  }

  private updateStatusEffects(deltaSeconds: number): void {
    for (const [targetId, list] of this.runState.activeStatusEffects.entries()) {
      const activeList: ActiveStatusEffect[] = [];

      for (const eff of list) {
        eff.durationRemaining -= deltaSeconds;

        // Periodic tick effects (burn, poison)
        if ((eff.type === 'burn' || eff.type === 'poison') && eff.tickInterval) {
          eff.tickTimer = (eff.tickTimer || 0) - deltaSeconds;
          if (eff.tickTimer <= 0) {
            eff.tickTimer = eff.tickInterval;
            // Deal tick damage
            if (targetId === 'creature') {
              this.damageCreature(eff.sourceId || 'status', eff.value);
            } else {
              const enemy = this.runState.activeEnemies.get(targetId);
              if (enemy && enemy.state === 'ALIVE') {
                enemy.currentHp -= eff.value;
                if (enemy.currentHp <= 0) {
                  this.handleEnemyDeath(enemy);
                }
              }
            }
          }
        }

        if (eff.durationRemaining > 0) {
          activeList.push(eff);
        }
      }

      if (activeList.length > 0) {
        this.runState.activeStatusEffects.set(targetId, activeList);
      } else {
        this.runState.activeStatusEffects.delete(targetId);
      }
    }
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
