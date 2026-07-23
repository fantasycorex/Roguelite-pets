import Phaser from 'phaser';
import { GamePhase } from '../types/phase';
import { phaseManager } from '../core/state/PhaseManager';
import { eventBus } from '../core/events/EventBus';
import { CombatEngine } from '../core/combat/CombatEngine';
import { BattleRunState, ActiveEnemy } from '../core/state/BattleRunState';
import { DEFAULT_CREATURE_STATS } from '../data/creatures.data';
import { WAVES_DATA_MAP1, WAVES_DATA_MAP2 } from '../data/waves.data';
import { TRAITS_DATA } from '../data/traits.data';
import { CreatureStats } from '../types/creature';
import { EquipmentConfig } from '../types/equipment';
import { TraitConfig } from '../types/trait';
import { runRewardSettlementService } from '../core/services/RunRewardSettlementService';
import { soundEngine } from '../core/audio/SoundEngine';
import { settingsEngine } from '../core/settings/SettingsEngine';
import { WaveConfig } from '../types/wave';

export class DefenseScene extends Phaser.Scene {
  private combatEngine!: CombatEngine;
  private runState!: BattleRunState;
  private petStats: CreatureStats = DEFAULT_CREATURE_STATS;
  private selectedMapId: string = 'heartwood_clearing';
  private waveSet: WaveConfig[] = WAVES_DATA_MAP1;
  private currentTraitOffers: TraitConfig[] = [];

  private enemySprites: Map<
    string,
    { sprite: Phaser.GameObjects.Sprite; hpBar: Phaser.GameObjects.Graphics }
  > = new Map();
  private petSprite!: Phaser.GameObjects.Sprite;
  private towerHpText!: Phaser.GameObjects.Text;
  private petHpText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private coinsText!: Phaser.GameObjects.Text;
  private bannerText!: Phaser.GameObjects.Text;
  private buildHudText!: Phaser.GameObjects.Text;
  private speedBtnText!: Phaser.GameObjects.Text;
  private pauseBtnText!: Phaser.GameObjects.Text;
  private pathGraphics!: Phaser.GameObjects.Graphics;
  private traitModalContainer!: Phaser.GameObjects.Container;
  private resultsModalContainer!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'DefenseScene' });
  }

  init(data?: { petStats?: CreatureStats; mapId?: string }): void {
    if (data && data.petStats) {
      this.petStats = { ...data.petStats };
    } else {
      this.petStats = { ...DEFAULT_CREATURE_STATS };
    }
    this.selectedMapId = data?.mapId || 'heartwood_clearing';
    this.waveSet = this.selectedMapId === 'moonlit_crossing' ? WAVES_DATA_MAP2 : WAVES_DATA_MAP1;
  }

  create(): void {
    phaseManager.setPhase(GamePhase.DEFENSE);
    const { width, height } = this.scale;

    // Run State & Map Config
    this.runState = new BattleRunState(this.petStats, this.selectedMapId);
    this.runState.totalWaves = this.waveSet.length;
    const waypoints = this.runState.mapConfig.waypoints;
    const secondaryWaypoints = this.runState.mapConfig.secondaryWaypoints;
    const towerPos = this.runState.mapConfig.towerPosition;

    // Map Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x0f172a);

    // Waypoints & Path Graphics (Primary + Secondary)
    this.pathGraphics = this.add.graphics();
    this.pathGraphics.lineStyle(12, 0x334155, 0.8);
    this.pathGraphics.beginPath();
    this.pathGraphics.moveTo(waypoints[0].x, waypoints[0].y);
    for (let i = 1; i < waypoints.length; i++) {
      this.pathGraphics.lineTo(waypoints[i].x, waypoints[i].y);
    }
    this.pathGraphics.strokePath();

    if (secondaryWaypoints && secondaryWaypoints.length > 0) {
      this.pathGraphics.lineStyle(10, 0x475569, 0.7);
      this.pathGraphics.beginPath();
      this.pathGraphics.moveTo(secondaryWaypoints[0].x, secondaryWaypoints[0].y);
      for (let i = 1; i < secondaryWaypoints.length; i++) {
        this.pathGraphics.lineTo(secondaryWaypoints[i].x, secondaryWaypoints[i].y);
      }
      this.pathGraphics.strokePath();
    }

    // Central Tower & Patrol Circle
    this.add.sprite(towerPos.x, towerPos.y, 'tower_texture');
    this.pathGraphics.lineStyle(2, 0x38b000, 0.3);
    this.pathGraphics.strokeCircle(towerPos.x, towerPos.y, this.runState.mapConfig.patrolRadius);

    // Pet Sprite
    this.petSprite = this.add.sprite(towerPos.x + 80, towerPos.y, 'pet_texture');

    // Initialize CombatEngine
    this.combatEngine = new CombatEngine(waypoints, towerPos, this.runState);

    // UI Header with dynamic wave & seed
    this.waveText = this.add
      .text(
        width / 2,
        25,
        `${this.runState.mapConfig.name.toUpperCase()} • WAVE 1 / ${this.waveSet.length}  (#${this.runState.runSeed})`,
        {
          fontSize: '18px',
          color: '#f72585',
          fontStyle: 'bold',
        },
      )
      .setOrigin(0.5);

    this.coinsText = this.add.text(width - 160, 25, 'Coins: 0', {
      fontSize: '18px',
      color: '#ffbe0b',
      fontStyle: 'bold',
    });

    this.towerHpText = this.add
      .text(towerPos.x - 120, towerPos.y - 65, 'Tower HP: 100/100', {
        fontSize: '14px',
        color: '#80ed99',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.petHpText = this.add
      .text(
        towerPos.x + 120,
        towerPos.y - 65,
        `Pet HP: ${this.runState.creatureCurrentHp}/${this.runState.creatureMaxHp}`,
        {
          fontSize: '14px',
          color: '#4cc9f0',
          fontStyle: 'bold',
        },
      )
      .setOrigin(0.5);

    this.bannerText = this.add
      .text(width / 2, height / 2 - 140, '', {
        fontSize: '30px',
        color: '#ffbe0b',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Current Build HUD Panel
    this.add.rectangle(140, height - 40, 260, 50, 0x0f172a, 0.9).setStrokeStyle(1, 0x334155);
    this.buildHudText = this.add.text(20, height - 58, 'Build: None', {
      fontSize: '12px',
      color: '#80ed99',
      fontStyle: 'bold',
    });

    // Developer Speed & Pause Controls
    const speedBtn = this.add
      .rectangle(width - 320, 30, 70, 30, 0x334155)
      .setInteractive({ useHandCursor: true });
    this.speedBtnText = this.add
      .text(width - 320, 30, '⚡ 1x', {
        fontSize: '12px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    speedBtn.on('pointerdown', () => {
      let nextScale = 1.0;
      if (this.runState.timeScale === 1.0) nextScale = 2.0;
      else if (this.runState.timeScale === 2.0) nextScale = 4.0;
      else nextScale = 1.0;
      this.combatEngine.setTimeScale(nextScale);
      this.speedBtnText.setText(`⚡ ${nextScale}x`);
    });

    const pauseBtn = this.add
      .rectangle(width - 230, 30, 70, 30, 0x334155)
      .setInteractive({ useHandCursor: true });
    this.pauseBtnText = this.add
      .text(width - 230, 30, '⏸️ PAUSE', {
        fontSize: '11px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    pauseBtn.on('pointerdown', () => {
      const isPaused = this.combatEngine.togglePause();
      this.pauseBtnText.setText(isPaused ? '▶️ PLAY' : '⏸️ PAUSE');
      this.bannerText.setText(isPaused ? 'GAME PAUSED' : '');
    });

    // Back Button
    const btn = this.add
      .rectangle(90, 30, 120, 32, 0x475569)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(90, 30, '← HABITAT', {
        fontSize: '13px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    btn.on('pointerdown', () => {
      this.cleanupEvents();
      runRewardSettlementService.settleRunRewards({
        runId: this.runState.runId,
        coinsEarned: this.runState.coinsCollected,
        expEarned: this.runState.expEarned,
        droppedEquipment: this.runState.droppedEquipment,
      });

      eventBus.emit('DEFENSE_ABORTED');
      this.scene.start('HabitatScene');
    });

    // Keyboard Shortcuts (Space to Pause, 1-3 to select traits, R to reroll)
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (event.code === 'Space' || event.code === 'KeyP') {
        const isPaused = this.combatEngine.togglePause();
        this.pauseBtnText.setText(isPaused ? '▶️ PLAY' : '⏸️ PAUSE');
        this.bannerText.setText(isPaused ? 'GAME PAUSED' : '');
      } else if (this.traitModalContainer.visible && this.currentTraitOffers.length > 0) {
        if (event.code === 'Digit1' && this.currentTraitOffers[0]) {
          this.selectTraitByShortcut(0);
        } else if (event.code === 'Digit2' && this.currentTraitOffers[1]) {
          this.selectTraitByShortcut(1);
        } else if (event.code === 'Digit3' && this.currentTraitOffers[2]) {
          this.selectTraitByShortcut(2);
        } else if (event.code === 'KeyR' && this.runState.rerollsRemaining > 0) {
          const newOffers = this.combatEngine.rerollTraitOffers();
          if (newOffers) {
            soundEngine.playCoinSound();
            this.renderTraitCards(newOffers, width, height);
          }
        }
      }
    });

    // Containers for Modals
    this.traitModalContainer = this.add.container(0, 0).setDepth(100).setVisible(false);
    this.resultsModalContainer = this.add.container(0, 0).setDepth(200).setVisible(false);

    // Subscribe to Combat Events
    this.setupEventListeners();

    // Start Wave 1
    this.combatEngine.startWave(this.waveSet[0]);
  }

  private selectTraitByShortcut(index: number): void {
    const trait = this.currentTraitOffers[index];
    if (!trait) return;

    soundEngine.playCoinSound();
    this.combatEngine.selectTraitOffer(trait);
    this.updateBuildHud();
    this.traitModalContainer.setVisible(false);
    phaseManager.setPhase(GamePhase.DEFENSE);

    const nextWaveIndex = this.runState.currentWave;
    this.combatEngine.startWave(this.waveSet[nextWaveIndex]);
  }

  private setupEventListeners(): void {
    this.cleanupEvents();

    eventBus.on('ENEMY_SPAWNED', this.onEnemySpawned);
    eventBus.on('ENEMY_DAMAGED', this.onEnemyDamaged);
    eventBus.on('ENEMY_KILLED', this.onEnemyKilled);
    eventBus.on('EQUIPMENT_DROPPED', this.onEquipmentDropped);
    eventBus.on('CREATURE_ATTACKED', this.onCreatureAttacked);
    eventBus.on('CREATURE_DAMAGED', this.onCreatureDamaged);
    eventBus.on('CREATURE_DOWNED', this.onCreatureDowned);
    eventBus.on('CREATURE_REVIVED', this.onCreatureRevived);
    eventBus.on('SPECIAL_ABILITY_USED', this.onSpecialAbilityUsed);
    eventBus.on('TOWER_DAMAGED', this.onTowerDamaged);
    eventBus.on('WAVE_STARTED', this.onWaveStarted);
    eventBus.on('WAVE_COMPLETED', this.onWaveCompleted);
    eventBus.on('TOWER_DESTROYED', this.onTowerDestroyed);
    eventBus.on('BOSS_PHASE_CHANGED', this.onBossPhaseChanged);
    eventBus.on('BOSS_TELEGRAPH', this.onBossTelegraph);
  }

  private cleanupEvents = (): void => {
    eventBus.off('ENEMY_SPAWNED', this.onEnemySpawned);
    eventBus.off('ENEMY_DAMAGED', this.onEnemyDamaged);
    eventBus.off('ENEMY_KILLED', this.onEnemyKilled);
    eventBus.off('EQUIPMENT_DROPPED', this.onEquipmentDropped);
    eventBus.off('CREATURE_ATTACKED', this.onCreatureAttacked);
    eventBus.off('CREATURE_DAMAGED', this.onCreatureDamaged);
    eventBus.off('CREATURE_DOWNED', this.onCreatureDowned);
    eventBus.off('CREATURE_REVIVED', this.onCreatureRevived);
    eventBus.off('SPECIAL_ABILITY_USED', this.onSpecialAbilityUsed);
    eventBus.off('TOWER_DAMAGED', this.onTowerDamaged);
    eventBus.off('WAVE_STARTED', this.onWaveStarted);
    eventBus.off('WAVE_COMPLETED', this.onWaveCompleted);
    eventBus.off('TOWER_DESTROYED', this.onTowerDestroyed);
    eventBus.off('BOSS_PHASE_CHANGED', this.onBossPhaseChanged);
    eventBus.off('BOSS_TELEGRAPH', this.onBossTelegraph);
  };

  private onEnemySpawned = (data: unknown): void => {
    const enemy = data as ActiveEnemy;
    const spriteKey = `enemy_${enemy.config.id}`;
    const sprite = this.add.sprite(
      enemy.x,
      enemy.y,
      this.textures.exists(spriteKey) ? spriteKey : 'enemy_basic',
    );
    if (enemy.config.isBoss) {
      sprite.setScale(2.2);
    }
    const hpBar = this.add.graphics();

    this.enemySprites.set(enemy.instanceId, { sprite, hpBar });
    this.updateHpBar(enemy.instanceId, enemy.currentHp, enemy.maxHp);
  };

  private onBossPhaseChanged = (data: unknown): void => {
    const { name } = data as { name: string; phase: number };
    soundEngine.playHitSound();
    if (settingsEngine.isScreenShakeEnabled()) {
      this.cameras.main.shake(300, 0.015);
    }
    this.bannerText.setText(`⚡ ${name.toUpperCase()} ENRAGED! (PHASE 2)`);
    this.bannerText.setColor('#f72585');
    this.time.delayedCall(2000, () => this.bannerText.setText(''));
  };

  private onBossTelegraph = (data: unknown): void => {
    const { x, y, radius, warningTimeMs } = data as {
      x: number;
      y: number;
      radius: number;
      warningTimeMs: number;
    };
    soundEngine.playHitSound();

    const ring = this.add.graphics();
    ring.lineStyle(3, 0xff0054, 0.9);
    ring.strokeCircle(x, y, radius);

    this.tweens.add({
      targets: ring,
      alpha: 0,
      duration: warningTimeMs,
      onComplete: () => ring.destroy(),
    });
  };

  private onEnemyDamaged = (data: unknown): void => {
    const { instanceId, currentHp, maxHp } = data as {
      instanceId: string;
      currentHp: number;
      maxHp: number;
    };
    soundEngine.playHitSound();
    this.updateHpBar(instanceId, currentHp, maxHp);
  };

  private onCreatureDamaged = (data: unknown): void => {
    const { currentHp, maxHp } = data as { currentHp: number; maxHp: number };
    soundEngine.playHitSound();
    this.petHpText.setText(`Pet HP: ${Math.round(currentHp)}/${maxHp}`);
  };

  private onCreatureDowned = (): void => {
    soundEngine.playHitSound();
    this.petSprite.setAlpha(0.4);
    this.petHpText.setText('Pet HP: DOWNED (Reviving...)');
    this.petHpText.setColor('#ff0054');
  };

  private onCreatureRevived = (data: unknown): void => {
    const { currentHp } = data as { currentHp: number };
    this.petSprite.setAlpha(1.0);
    this.petHpText.setText(`Pet HP: ${Math.round(currentHp)}/${this.runState.creatureMaxHp}`);
    this.petHpText.setColor('#4cc9f0');
  };

  private onEnemyKilled = (data: unknown): void => {
    const { instanceId, x, y, coinReward } = data as {
      instanceId: string;
      x: number;
      y: number;
      coinReward: number;
    };
    soundEngine.playCoinSound();

    const entry = this.enemySprites.get(instanceId);
    if (entry) {
      entry.hpBar.destroy();
      this.tweens.add({
        targets: entry.sprite,
        scaleX: 1.5,
        scaleY: 1.5,
        alpha: 0,
        duration: 200,
        onComplete: () => entry.sprite.destroy(),
      });
      this.enemySprites.delete(instanceId);
    }

    const coinText = this.add.text(x, y, `+${coinReward}g`, {
      fontSize: '16px',
      color: '#ffbe0b',
      fontStyle: 'bold',
    });
    this.tweens.add({
      targets: coinText,
      y: y - 30,
      alpha: 0,
      duration: 800,
      onComplete: () => coinText.destroy(),
    });

    this.coinsText.setText(`Coins: ${this.runState.coinsCollected}`);
  };

  private onEquipmentDropped = (data: unknown): void => {
    const { equipment, x, y } = data as { equipment: EquipmentConfig; x: number; y: number };
    soundEngine.playCoinSound();

    const dropText = this.add.text(x, y - 20, `🎁 ${equipment.name}!`, {
      fontSize: '16px',
      color: '#80ed99',
      fontStyle: 'bold',
      backgroundColor: '#0f172a',
      padding: { x: 6, y: 4 },
    });

    this.tweens.add({
      targets: dropText,
      y: y - 60,
      alpha: 0,
      duration: 1500,
      onComplete: () => dropText.destroy(),
    });
  };

  private onCreatureAttacked = (data: unknown): void => {
    const { targetX, targetY } = data as { targetX: number; targetY: number };
    soundEngine.playAttackSound();

    const laser = this.add.graphics();
    laser.lineStyle(3, 0x4cc9f0, 0.9);
    laser.lineBetween(this.petSprite.x, this.petSprite.y, targetX, targetY);

    this.tweens.add({
      targets: laser,
      alpha: 0,
      duration: 120,
      onComplete: () => laser.destroy(),
    });
  };

  private onSpecialAbilityUsed = (data: unknown): void => {
    const { x, y, radius } = data as { x: number; y: number; radius: number };
    soundEngine.playAttackSound();

    const burst = this.add.graphics();
    burst.fillStyle(0x7209b7, 0.4);
    burst.fillCircle(x, y, radius);
    burst.lineStyle(3, 0xf72585, 1);
    burst.strokeCircle(x, y, radius);

    this.tweens.add({
      targets: burst,
      alpha: 0,
      duration: 350,
      onComplete: () => burst.destroy(),
    });
  };

  private onTowerDamaged = (data: unknown): void => {
    const { currentHp, maxHp } = data as { currentHp: number; maxHp: number };
    soundEngine.playHitSound();
    this.towerHpText.setText(`Tower HP: ${currentHp}/${maxHp}`);
    if (settingsEngine.isScreenShakeEnabled()) {
      this.cameras.main.shake(150, 0.008);
    }
  };

  private onWaveStarted = (data: unknown): void => {
    const { waveIndex } = data as { waveIndex: number };
    this.waveText.setText(
      `${this.runState.mapConfig.name.toUpperCase()} • WAVE ${waveIndex} / ${this.waveSet.length}  (#${this.runState.runSeed})`,
    );
    this.bannerText.setText(`WAVE ${waveIndex} START!`);
    this.time.delayedCall(1200, () => this.bannerText.setText(''));
  };

  private onWaveCompleted = (data: unknown): void => {
    const { waveIndex } = data as { waveIndex: number };
    this.bannerText.setText(`WAVE ${waveIndex} COMPLETED!`);

    if (waveIndex < this.waveSet.length) {
      this.time.delayedCall(1500, () => {
        this.bannerText.setText('');
        this.openTraitSelectionModal();
      });
    } else {
      soundEngine.playVictoryFanfare();
      this.time.delayedCall(1000, () => this.openResultsModal(true));
    }
  };

  private openTraitSelectionModal(): void {
    phaseManager.setPhase(GamePhase.TRAIT_SELECTION);
    const { width, height } = this.scale;
    const offers = this.combatEngine.getTraitOffers();

    this.renderTraitCards(offers, width, height);
  }

  private renderTraitCards(offers: TraitConfig[], width: number, height: number): void {
    this.currentTraitOffers = offers;
    this.traitModalContainer.removeAll(true);
    this.traitModalContainer.setVisible(true);

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.75);
    const modalTitle = this.add
      .text(width / 2, 90, 'CHOOSE A TRAIT UPGRADE (Keys: 1, 2, 3)', {
        fontSize: '24px',
        color: '#ffbe0b',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Reroll Button
    const canReroll = this.runState.rerollsRemaining > 0;
    const rerollBtn = this.add
      .rectangle(width / 2, 135, 180, 34, canReroll ? 0x0284c7 : 0x475569)
      .setInteractive({ useHandCursor: canReroll });

    const rerollTxt = this.add
      .text(width / 2, 135, `🎲 REROLL (Key R) [${this.runState.rerollsRemaining}]`, {
        fontSize: '12px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    rerollBtn.on('pointerdown', () => {
      const newOffers = this.combatEngine.rerollTraitOffers();
      if (newOffers) {
        soundEngine.playCoinSound();
        this.renderTraitCards(newOffers, width, height);
      }
    });

    this.traitModalContainer.add([overlay, modalTitle, rerollBtn, rerollTxt]);

    const cardWidth = 220;
    const cardHeight = 260;
    const spacing = 40;
    const startX = width / 2 - (cardWidth * 3 + spacing * 2) / 2 + cardWidth / 2;

    offers.forEach((trait, i) => {
      const cardX = startX + i * (cardWidth + spacing);
      const cardY = height / 2 + 30;

      const cardBg = this.add
        .rectangle(cardX, cardY, cardWidth, cardHeight, 0x1e293b, 0.95)
        .setStrokeStyle(
          3,
          trait.rarity === 'epic' ? 0xf72585 : trait.rarity === 'rare' ? 0x4cc9f0 : 0x80ed99,
        )
        .setInteractive({ useHandCursor: true });

      const title = this.add
        .text(cardX, cardY - 80, `[${i + 1}] ${trait.name}`, {
          fontSize: '17px',
          color: '#ffffff',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);

      const familyBadge = this.add
        .text(cardX, cardY - 50, `${trait.family.toUpperCase()} • ${trait.rarity.toUpperCase()}`, {
          fontSize: '11px',
          color:
            trait.rarity === 'epic' ? '#f72585' : trait.rarity === 'rare' ? '#4cc9f0' : '#80ed99',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);

      const desc = this.add
        .text(cardX, cardY, trait.description, {
          fontSize: '13px',
          color: '#cbd5e1',
          align: 'center',
          wordWrap: { width: cardWidth - 30 },
        })
        .setOrigin(0.5);

      const selectBtn = this.add
        .rectangle(cardX, cardY + 80, 140, 36, 0x3b82f6)
        .setInteractive({ useHandCursor: true });

      const btnTxt = this.add
        .text(cardX, cardY + 80, `SELECT [${i + 1}]`, {
          fontSize: '14px',
          color: '#ffffff',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);

      this.traitModalContainer.add([cardBg, title, familyBadge, desc, selectBtn, btnTxt]);

      const onSelect = () => {
        soundEngine.playCoinSound();
        this.combatEngine.selectTraitOffer(trait);
        this.updateBuildHud();
        this.traitModalContainer.setVisible(false);
        phaseManager.setPhase(GamePhase.DEFENSE);

        const nextWaveIndex = this.runState.currentWave;
        this.combatEngine.startWave(this.waveSet[nextWaveIndex]);
      };

      cardBg.on('pointerdown', onSelect);
      selectBtn.on('pointerdown', onSelect);
    });
  }

  private updateBuildHud(): void {
    if (this.runState.activeTraits.length === 0) {
      this.buildHudText.setText('Build: None');
      return;
    }

    const traitNames = this.runState.activeTraits
      .map((id) => TRAITS_DATA[id]?.name || id)
      .slice(-3);
    this.buildHudText.setText(
      `Build (${this.runState.activeTraits.length}): ${traitNames.join(', ')}`,
    );
  }

  private onTowerDestroyed = (): void => {
    soundEngine.playDefeatSound();
    this.bannerText.setText('DEFEAT! TOWER DESTROYED');
    this.bannerText.setColor('#ff0054');
    this.time.delayedCall(1200, () => this.openResultsModal(false));
  };

  private openResultsModal(isVictory: boolean): void {
    phaseManager.setPhase(GamePhase.RESULTS);
    const { width, height } = this.scale;

    this.resultsModalContainer.removeAll(true);
    this.resultsModalContainer.setVisible(true);

    // Commit rewards idempotently via service
    runRewardSettlementService.settleRunRewards({
      runId: this.runState.runId,
      coinsEarned: this.runState.coinsCollected,
      expEarned: this.runState.expEarned,
      droppedEquipment: this.runState.droppedEquipment,
    });

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);
    const box = this.add
      .rectangle(width / 2, height / 2, 450, 360, 0x1e293b)
      .setStrokeStyle(3, isVictory ? 0x80ed99 : 0xff0054);

    const title = this.add
      .text(width / 2, height / 2 - 130, isVictory ? 'DEFENSE VICTORY! 🏆' : 'RUN DEFEATED 💀', {
        fontSize: '28px',
        color: isVictory ? '#80ed99' : '#ff0054',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const summaryText = this.add
      .text(
        width / 2,
        height / 2 - 20,
        `Map: ${this.runState.mapConfig.name}\n` +
          `Waves Cleared: ${this.runState.currentWave} / ${this.waveSet.length}\n\n` +
          `Coins Earned: +${this.runState.coinsCollected}g\n` +
          `EXP Earned: +${this.runState.expEarned} exp\n` +
          `Equipment Looted: ${this.runState.droppedEquipment.length} items`,
        {
          fontSize: '18px',
          color: '#f8fafc',
          align: 'center',
          lineSpacing: 8,
        },
      )
      .setOrigin(0.5);

    const contBtn = this.add
      .rectangle(width / 2, height / 2 + 120, 220, 48, 0x3b82f6)
      .setInteractive({ useHandCursor: true });

    const contTxt = this.add
      .text(width / 2, height / 2 + 120, 'RETURN TO HABITAT', {
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    let returned = false;
    contBtn.on('pointerdown', () => {
      if (returned) return;
      returned = true;
      this.cleanupEvents();
      this.scene.start('HabitatScene');
    });

    this.resultsModalContainer.add([overlay, box, title, summaryText, contBtn, contTxt]);
  }

  private updateHpBar(instanceId: string, currentHp: number, maxHp: number): void {
    const entry = this.enemySprites.get(instanceId);
    if (!entry) return;

    const { sprite, hpBar } = entry;
    hpBar.clear();
    const ratio = Math.max(0, currentHp / maxHp);
    const width = 32;
    const height = 4;
    const x = sprite.x - width / 2;
    const y = sprite.y - 20;

    hpBar.fillStyle(0x000000, 0.6);
    hpBar.fillRect(x, y, width, height);

    hpBar.fillStyle(ratio > 0.4 ? 0x80ed99 : 0xff0054, 1);
    hpBar.fillRect(x, y, width * ratio, height);
  }

  update(_time: number, delta: number): void {
    const deltaSeconds = delta / 1000;
    this.combatEngine.update(deltaSeconds);

    this.petSprite.x = this.runState.petX;
    this.petSprite.y = this.runState.petY;

    for (const enemy of this.runState.activeEnemies.values()) {
      const entry = this.enemySprites.get(enemy.instanceId);
      if (entry) {
        entry.sprite.x = enemy.x;
        entry.sprite.y = enemy.y;
        this.updateHpBar(enemy.instanceId, enemy.currentHp, enemy.maxHp);
      }
    }
  }
}
