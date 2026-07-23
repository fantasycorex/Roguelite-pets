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
import {
  StatusEffectConfig,
  ActiveStatusEffect,
  DamageEvent,
  StatusEffectType,
} from '../../types/combat';

export class CombatEngine {
  private pathEngine: PathEngine;
  private runState: BattleRunState;
  private traitEngine: TraitEngine;
  private rng: SeededRandom;

  private spawnQueue: { enemyTypeId: string; spawnTimeMs: number }[] = [];
  private waveElapsedTimeMs: number = 0;
  private isWaveActive: boolean = false;
  private instanceCounter: number = 0;
  private trackToggle: number = 0;

  private patrolRadius: number = 80;
  private towerCenter: Point;

  constructor(pathWaypoints: Point[], towerCenter: Point, runState: BattleRunState) {
    this.pathEngine = new PathEngine(pathWaypoints, runState.mapConfig.secondaryWaypoints);
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
    this.runState.rerollsRemaining = 1; // 1 Reroll per wave
    this.waveElapsedTimeMs = 0;
    this.spawnQueue = [];

    // Process 'tower_support' wave start traits (e.g. Tower Sentinel repair)
    for (const traitId of this.runState.activeTraits) {
      const trait = TRAITS_DATA[traitId];
      if (trait && trait.effect.type === 'tower_support') {
        this.runState.towerHp = Math.min(
          this.runState.maxTowerHp,
          this.runState.towerHp + trait.effect.value,
        );
      }
    }

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
    return this.traitEngine.generateTraitOffers(3, this.runState.activeTraits);
  }

  public rerollTraitOffers(): TraitConfig[] | null {
    if (this.runState.rerollsRemaining <= 0) return null;
    this.runState.rerollsRemaining--;
    return this.getTraitOffers();
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

  private spawnEnemy(enemyTypeId: string, overrideTrack?: number): void {
    const config = ENEMIES_DATA[enemyTypeId];
    if (!config) return;

    this.instanceCounter++;
    const instanceId = `enemy_${this.instanceCounter}`;
    const trackIndex =
      overrideTrack !== undefined
        ? overrideTrack
        : this.runState.mapConfig.secondaryWaypoints
          ? this.trackToggle++ % 2
          : 0;

    const startPos = this.pathEngine.getPositionAlongPath(0, trackIndex);

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
      trackIndex,
      bossPhase: config.isBoss ? 1 : undefined,
      bossEnraged: false,
      attackTimer: 0,
    };

    this.runState.activeEnemies.set(instanceId, enemy);
    eventBus.emit('ENEMY_SPAWNED', enemy);
  }

  private updatePetPatrol(deltaSeconds: number): void {
    const baseAngularSpeed = 1.5;
    let speedFactor = (this.runState.petStats.moveSpeed || 100) / 100;

    // Heart Bond trait (+15% patrol speed when affection >= 80)
    if (
      this.runState.creatureAffection >= 80 &&
      this.runState.activeTraits.includes('heart_bond')
    ) {
      speedFactor *= 1.15;
    }

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

      // Check Boss Phase 2 Transition (50% HP threshold)
      if (enemy.config.isBoss && enemy.bossPhase === 1 && enemy.currentHp <= enemy.maxHp * 0.5) {
        this.triggerBossPhase2(enemy);
      }

      if (this.hasStatusEffect(enemy.instanceId, 'stun')) {
        continue;
      }

      let effectiveSpeed = enemy.config.moveSpeed;
      if (enemy.bossEnraged) {
        effectiveSpeed *= 1.5; // +50% move speed in phase 2 enrage
      }
      if (this.hasStatusEffect(enemy.instanceId, 'slow')) {
        effectiveSpeed *= 0.5;
      }

      const behaviour = enemy.config.behaviour;
      const distToTower = Math.hypot(enemy.x - this.towerCenter.x, enemy.y - this.towerCenter.y);
      const distToPet = Math.hypot(enemy.x - this.runState.petX, enemy.y - this.runState.petY);

      // Handle Dedicated Boss behavior ('boss_sovereign')
      if (behaviour?.style === 'boss_sovereign') {
        enemy.attackTimer = (enemy.attackTimer || 0) + deltaSeconds;
        if (
          (distToPet <= behaviour.attackRange && !this.runState.isCreatureDowned) ||
          distToTower <= behaviour.attackRange
        ) {
          if (enemy.attackTimer >= 1 / behaviour.attackSpeed) {
            enemy.attackTimer = 0;
            if (!this.runState.isCreatureDowned && distToPet <= behaviour.attackRange) {
              this.damageCreature(
                enemy.instanceId,
                behaviour.attackDamage,
                behaviour.statusEffectsOnHit,
              );
            } else {
              this.runState.towerHp = Math.max(0, this.runState.towerHp - behaviour.attackDamage);
              this.triggerOnTowerDamaged(behaviour.attackDamage);
              eventBus.emit('TOWER_DAMAGED', {
                currentHp: this.runState.towerHp,
                maxHp: this.runState.maxTowerHp,
                damage: behaviour.attackDamage,
              });
            }
          }
          continue; // Pauses path movement while attacking boss target
        }
      }

      // Handle Ranged Enemy behavior ('ranged_path')
      if (
        behaviour?.style === 'ranged_path' &&
        (distToTower <= behaviour.attackRange || distToPet <= behaviour.attackRange)
      ) {
        enemy.attackTimer = (enemy.attackTimer || 0) + deltaSeconds;
        if (enemy.attackTimer >= 1 / behaviour.attackSpeed) {
          enemy.attackTimer = 0;
          if (behaviour.targetPriority === 'creature' && !this.runState.isCreatureDowned) {
            this.damageCreature(
              enemy.instanceId,
              behaviour.attackDamage,
              behaviour.statusEffectsOnHit,
            );
          } else {
            this.runState.towerHp = Math.max(0, this.runState.towerHp - behaviour.attackDamage);
            this.triggerOnTowerDamaged(behaviour.attackDamage);
            eventBus.emit('TOWER_DAMAGED', {
              currentHp: this.runState.towerHp,
              maxHp: this.runState.maxTowerHp,
              damage: behaviour.attackDamage,
            });
          }
        }
        // Advance at half speed while firing along path
        enemy.distanceCovered += effectiveSpeed * 0.5 * deltaSeconds;
        const pos = this.pathEngine.getPositionAlongPath(
          enemy.distanceCovered,
          enemy.trackIndex || 0,
        );
        enemy.x = pos.x;
        enemy.y = pos.y;
        if (pos.reachedEnd) {
          this.runState.towerHp = Math.max(0, this.runState.towerHp - enemy.config.damageToTower);
          this.triggerOnTowerDamaged(enemy.config.damageToTower);
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
        continue;
      }

      // Handle Tank Creature Fighter behavior ('fight_creature')
      if (
        behaviour?.style === 'fight_creature' &&
        !this.runState.isCreatureDowned &&
        distToPet <= (behaviour.attackRange || 95)
      ) {
        enemy.isFightingCreature = true;
        this.damageCreature(
          enemy.instanceId,
          behaviour.attackDamage * deltaSeconds,
          behaviour.statusEffectsOnHit,
        );
      } else {
        enemy.isFightingCreature = false;
        enemy.distanceCovered += effectiveSpeed * deltaSeconds;
        const pos = this.pathEngine.getPositionAlongPath(
          enemy.distanceCovered,
          enemy.trackIndex || 0,
        );

        enemy.x = pos.x;
        enemy.y = pos.y;

        if (pos.reachedEnd) {
          this.runState.towerHp = Math.max(0, this.runState.towerHp - enemy.config.damageToTower);

          // Apply status effects on hit (e.g. Shadow Wisp slow on hit)
          if (behaviour?.statusEffectsOnHit) {
            for (const eff of behaviour.statusEffectsOnHit) {
              this.applyStatusEffect('creature', eff, enemy.instanceId);
            }
          }

          // Process 'on_tower_damaged' traits (e.g., Aegis Shield barrier)
          this.triggerOnTowerDamaged(enemy.config.damageToTower);

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

  private triggerBossPhase2(boss: ActiveEnemy): void {
    boss.bossPhase = 2;
    boss.bossEnraged = true;

    // Clear negative status effects on transition
    this.runState.activeStatusEffects.delete(boss.instanceId);

    // Spawn Boss Minion reinforcement wave
    this.spawnEnemy('spitter', 0);
    this.spawnEnemy('basic', 1);

    // Emit Boss Phase 2 transition event
    eventBus.emit('BOSS_PHASE_CHANGED', {
      instanceId: boss.instanceId,
      name: boss.config.name,
      phase: 2,
    });

    // Perform Boss Telegraph AoE Burst
    const burstRadius = 160;
    const burstDamage = 30;

    eventBus.emit('BOSS_TELEGRAPH', {
      x: boss.x,
      y: boss.y,
      radius: burstRadius,
      warningTimeMs: 600,
    });

    const distToPet = Math.hypot(boss.x - this.runState.petX, boss.y - this.runState.petY);
    if (distToPet <= burstRadius) {
      this.damageCreature(boss.instanceId, burstDamage);
    }
  }

  private triggerOnTowerDamaged(_damage: number): void {
    for (const traitId of this.runState.activeTraits) {
      const trait = TRAITS_DATA[traitId];
      if (trait && trait.effect.type === 'on_tower_damaged') {
        if (trait.effect.statusType === 'shield') {
          this.applyStatusEffect('creature', {
            type: 'shield',
            duration: 8.0,
            value: trait.effect.value,
          });
        }
      }
    }
  }

  private damageCreature(
    sourceId: string,
    damageAmount: number,
    statusEffects?: StatusEffectConfig[],
  ): void {
    if (this.runState.isCreatureDowned) return;

    let finalDamage = damageAmount;

    // Check shield absorption
    const shields =
      this.runState.activeStatusEffects.get('creature')?.filter((e) => e.type === 'shield') || [];
    for (const shield of shields) {
      if (shield.value > 0) {
        const absorbed = Math.min(shield.value, finalDamage);
        shield.value -= absorbed;
        finalDamage -= absorbed;
        if (finalDamage <= 0) break;
      }
    }

    if (finalDamage > 0) {
      this.runState.creatureCurrentHp = Math.max(0, this.runState.creatureCurrentHp - finalDamage);

      const dmgEvent: DamageEvent = {
        sourceId,
        targetId: 'creature',
        targetType: 'creature',
        damage: finalDamage,
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
  }

  private updateCreatureDownedState(deltaSeconds: number): void {
    if (!this.runState.isCreatureDowned) return;

    this.runState.creatureDownedTimer -= deltaSeconds;
    if (this.runState.creatureDownedTimer <= 0) {
      this.runState.isCreatureDowned = false;
      this.runState.creatureCurrentHp = Math.round(this.runState.creatureMaxHp * 0.5);
      eventBus.emit('CREATURE_REVIVED', { currentHp: this.runState.creatureCurrentHp });
    }
  }

  private updatePetCombat(deltaSeconds: number): void {
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

        // Multi-Beam trait: fire at second target if available
        if (this.runState.activeTraits.includes('multi_beam') && activeEnemiesArray.length > 1) {
          const secondTarget = activeEnemiesArray.find((e) => e.instanceId !== target.instanceId);
          if (secondTarget) {
            this.fireProjectile(secondTarget);
          }
        }

        const cooldown = 1 / this.runState.petStats.attackSpeed;
        this.runState.petAttackCooldownTimer = cooldown;
      }
    }

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

    // Process 'on_kill' traits (e.g. Bloodthirst healing)
    for (const traitId of this.runState.activeTraits) {
      const trait = TRAITS_DATA[traitId];
      if (trait && trait.effect.type === 'on_kill') {
        this.runState.creatureCurrentHp = Math.min(
          this.runState.creatureMaxHp,
          this.runState.creatureCurrentHp + trait.effect.value,
        );
      }
    }

    const loot = LootEngine.rollLoot(enemy.config, this.rng, 30);

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
    const ability = ABILITIES_DATA[this.runState.specialAbilityId] || ABILITIES_DATA.aoe_pulse;
    const radius = ability.radius || 140;
    let aoeDamage = ability.damage || 40;

    // Apply traits to special ability
    if (
      this.runState.creatureFullness >= 80 &&
      this.runState.activeTraits.includes('full_belly_fury')
    ) {
      aoeDamage *= 1.2;
    }

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

        // Elemental Overload trait: apply burn status on special hit
        if (this.runState.activeTraits.includes('elemental_overload')) {
          this.applyStatusEffect(
            enemy.instanceId,
            { type: 'burn', duration: 3.0, value: 8, tickInterval: 1.0 },
            'creature',
          );
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
    const ability = ABILITIES_DATA[this.runState.normalAbilityId] || ABILITIES_DATA.basic_laser;
    let baseDamage = this.runState.petStats.attackDamage || ability.damage;

    // Full Belly Fury trait (+20% damage when fullness >= 80)
    if (
      this.runState.creatureFullness >= 80 &&
      this.runState.activeTraits.includes('full_belly_fury')
    ) {
      baseDamage *= 1.2;
    }

    // Protective Rage trait (+25% damage when tower HP <= 50%)
    if (
      this.runState.towerHp / this.runState.maxTowerHp <= 0.5 &&
      this.runState.activeTraits.includes('protective_rage')
    ) {
      baseDamage *= 1.25;
    }

    // Process 'on_critical' trait calculations
    let isCrit = false;
    for (const traitId of this.runState.activeTraits) {
      const trait = TRAITS_DATA[traitId];
      if (trait && trait.effect.type === 'on_critical' && trait.effect.chance) {
        if (this.rng.nextFloat() <= trait.effect.chance) {
          isCrit = true;
          baseDamage *= trait.effect.value;
          break;
        }
      }
    }

    // Execute low-HP enemy bonus damage
    for (const traitId of this.runState.activeTraits) {
      const trait = TRAITS_DATA[traitId];
      if (trait && trait.id === 'execute_blade' && target.currentHp / target.maxHp <= 0.3) {
        baseDamage *= trait.effect.value;
      }
    }

    const projectile: ActiveProjectile = {
      id: `proj_${Date.now()}_${Math.random()}`,
      startX: this.runState.petX,
      startY: this.runState.petY,
      targetX: target.x,
      targetY: target.y,
      targetEnemyInstanceId: target.instanceId,
      damage: baseDamage,
      progress: 0,
      speed: 4.0,
    };

    this.runState.activeProjectiles.push(projectile);
    eventBus.emit('CREATURE_ATTACKED', { targetX: target.x, targetY: target.y, isCrit });
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
        if (targetEnemy && targetEnemy.state === 'ALIVE') {
          targetEnemy.currentHp -= proj.damage;

          // Chain Lightning trait: fork projectile to next nearest enemy
          if (this.runState.activeTraits.includes('chain_lightning') && !proj.isChain) {
            const otherEnemies = Array.from(this.runState.activeEnemies.values()).filter(
              (e) => e.state === 'ALIVE' && e.instanceId !== targetEnemy.instanceId,
            );
            if (otherEnemies.length > 0) {
              const chainTarget = otherEnemies[0];
              this.runState.activeProjectiles.push({
                id: `proj_chain_${Date.now()}`,
                startX: targetEnemy.x,
                startY: targetEnemy.y,
                targetX: chainTarget.x,
                targetY: chainTarget.y,
                targetEnemyInstanceId: chainTarget.instanceId,
                damage: Math.round(proj.damage * 0.7),
                progress: 0,
                speed: 5.0,
                isChain: true,
              });
            }
          }

          // Apply status effects on hit (Ignite Touch burn, Frost Touch slow, Stun)
          for (const traitId of this.runState.activeTraits) {
            const trait = TRAITS_DATA[traitId];
            if (trait && trait.effect.type === 'status_application' && trait.effect.statusType) {
              const chance = trait.effect.chance || 1.0;
              if (this.rng.nextFloat() <= chance) {
                this.applyStatusEffect(
                  targetEnemy.instanceId,
                  {
                    type: trait.effect.statusType as StatusEffectType,
                    duration: trait.effect.value,
                    value: trait.effect.statusType === 'burn' ? 5 : 0.5,
                  },
                  'creature',
                );
              }
            }
          }

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

        if ((eff.type === 'burn' || eff.type === 'poison') && eff.tickInterval) {
          eff.tickTimer = (eff.tickTimer || 0) - deltaSeconds;
          if (eff.tickTimer <= 0) {
            eff.tickTimer = eff.tickInterval;
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
