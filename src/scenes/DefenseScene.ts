import Phaser from 'phaser';
import { GamePhase } from '../types/phase';
import { phaseManager } from '../core/state/PhaseManager';
import { eventBus } from '../core/events/EventBus';
import { CombatEngine } from '../core/combat/CombatEngine';
import { BattleRunState, ActiveEnemy } from '../core/state/BattleRunState';
import { DEFAULT_CREATURE_STATS } from '../data/creatures.data';
import { WAVES_DATA } from '../data/waves.data';
import { CreatureStats } from '../types/creature';
import { EquipmentConfig } from '../types/equipment';
import { runRewardSettlementService } from '../core/services/RunRewardSettlementService';
import { soundEngine } from '../core/audio/SoundEngine';

export class DefenseScene extends Phaser.Scene {
  private combatEngine!: CombatEngine;
  private runState!: BattleRunState;
  private petStats: CreatureStats = DEFAULT_CREATURE_STATS;

  private enemySprites: Map<
    string,
    { sprite: Phaser.GameObjects.Sprite; hpBar: Phaser.GameObjects.Graphics }
  > = new Map();
  private petSprite!: Phaser.GameObjects.Sprite;
  private towerHpText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private coinsText!: Phaser.GameObjects.Text;
  private bannerText!: Phaser.GameObjects.Text;
  private pathGraphics!: Phaser.GameObjects.Graphics;
  private traitModalContainer!: Phaser.GameObjects.Container;
  private resultsModalContainer!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'DefenseScene' });
  }

  init(data?: { petStats?: CreatureStats }): void {
    if (data && data.petStats) {
      this.petStats = { ...data.petStats };
    } else {
      this.petStats = { ...DEFAULT_CREATURE_STATS };
    }
  }

  create(): void {
    phaseManager.setPhase(GamePhase.DEFENSE);
    const { width, height } = this.scale;

    // Map Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x0f172a);

    // Waypoints & Path
    const waypoints = [
      { x: -30, y: height / 2 },
      { x: 320, y: 180 },
      { x: 640, y: 540 },
      { x: 960, y: 360 },
      { x: width / 2, y: height / 2 },
    ];
    const towerPos = { x: width / 2, y: height / 2 };

    this.pathGraphics = this.add.graphics();
    this.pathGraphics.lineStyle(12, 0x334155, 0.8);
    this.pathGraphics.beginPath();
    this.pathGraphics.moveTo(waypoints[0].x, waypoints[0].y);
    for (let i = 1; i < waypoints.length; i++) {
      this.pathGraphics.lineTo(waypoints[i].x, waypoints[i].y);
    }
    this.pathGraphics.strokePath();

    // Central Tower & Patrol Circle
    this.add.sprite(towerPos.x, towerPos.y, 'tower_texture');
    this.pathGraphics.lineStyle(2, 0x38b000, 0.3);
    this.pathGraphics.strokeCircle(towerPos.x, towerPos.y, 80);

    // Pet Sprite
    this.petSprite = this.add.sprite(towerPos.x + 80, towerPos.y, 'pet_texture');

    // Combat Engine & Run State
    this.runState = new BattleRunState(this.petStats);
    this.runState.totalWaves = WAVES_DATA.length;
    this.combatEngine = new CombatEngine(waypoints, towerPos, this.runState);

    // UI Header with dynamic total wave count
    this.waveText = this.add
      .text(width / 2, 30, `WAVE 1 / ${WAVES_DATA.length}`, {
        fontSize: '24px',
        color: '#f72585',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.coinsText = this.add.text(width - 160, 30, 'Coins: 0', {
      fontSize: '20px',
      color: '#ffbe0b',
      fontStyle: 'bold',
    });

    this.towerHpText = this.add
      .text(towerPos.x, towerPos.y - 65, 'Tower HP: 100/100', {
        fontSize: '16px',
        color: '#80ed99',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.bannerText = this.add
      .text(width / 2, height / 2 - 140, '', {
        fontSize: '32px',
        color: '#ffbe0b',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Back Button
    const btn = this.add
      .rectangle(100, 40, 140, 40, 0x475569)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(100, 40, '← HABITAT', {
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    btn.on('pointerdown', () => {
      this.cleanupEvents();
      // Settle rewards once via service
      runRewardSettlementService.settleRunRewards({
        runId: this.runState.runId,
        coinsEarned: this.runState.coinsCollected,
        expEarned: this.runState.expEarned,
        droppedEquipment: this.runState.droppedEquipment,
      });

      eventBus.emit('DEFENSE_ABORTED');
      this.scene.start('HabitatScene');
    });

    // Containers for Modals
    this.traitModalContainer = this.add.container(0, 0).setDepth(100).setVisible(false);
    this.resultsModalContainer = this.add.container(0, 0).setDepth(200).setVisible(false);

    // Subscribe to Combat Events
    this.setupEventListeners();

    // Start Wave 1
    this.combatEngine.startWave(WAVES_DATA[0]);
  }

  private setupEventListeners(): void {
    this.cleanupEvents();

    eventBus.on('ENEMY_SPAWNED', this.onEnemySpawned);
    eventBus.on('ENEMY_DAMAGED', this.onEnemyDamaged);
    eventBus.on('ENEMY_KILLED', this.onEnemyKilled);
    eventBus.on('EQUIPMENT_DROPPED', this.onEquipmentDropped);
    eventBus.on('CREATURE_ATTACKED', this.onCreatureAttacked);
    eventBus.on('SPECIAL_ABILITY_USED', this.onSpecialAbilityUsed);
    eventBus.on('TOWER_DAMAGED', this.onTowerDamaged);
    eventBus.on('WAVE_STARTED', this.onWaveStarted);
    eventBus.on('WAVE_COMPLETED', this.onWaveCompleted);
    eventBus.on('TOWER_DESTROYED', this.onTowerDestroyed);
  }

  private cleanupEvents = (): void => {
    eventBus.off('ENEMY_SPAWNED', this.onEnemySpawned);
    eventBus.off('ENEMY_DAMAGED', this.onEnemyDamaged);
    eventBus.off('ENEMY_KILLED', this.onEnemyKilled);
    eventBus.off('EQUIPMENT_DROPPED', this.onEquipmentDropped);
    eventBus.off('CREATURE_ATTACKED', this.onCreatureAttacked);
    eventBus.off('SPECIAL_ABILITY_USED', this.onSpecialAbilityUsed);
    eventBus.off('TOWER_DAMAGED', this.onTowerDamaged);
    eventBus.off('WAVE_STARTED', this.onWaveStarted);
    eventBus.off('WAVE_COMPLETED', this.onWaveCompleted);
    eventBus.off('TOWER_DESTROYED', this.onTowerDestroyed);
  };

  private onEnemySpawned = (data: unknown): void => {
    const enemy = data as ActiveEnemy;
    const spriteKey = `enemy_${enemy.config.id}`;
    const sprite = this.add.sprite(
      enemy.x,
      enemy.y,
      this.textures.exists(spriteKey) ? spriteKey : 'enemy_basic',
    );
    const hpBar = this.add.graphics();

    this.enemySprites.set(enemy.instanceId, { sprite, hpBar });
    this.updateHpBar(enemy.instanceId, enemy.currentHp, enemy.maxHp);
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
    this.cameras.main.shake(150, 0.008);
  };

  private onWaveStarted = (data: unknown): void => {
    const { waveIndex } = data as { waveIndex: number };
    this.waveText.setText(`WAVE ${waveIndex} / ${WAVES_DATA.length}`);
    this.bannerText.setText(`WAVE ${waveIndex} START!`);
    this.time.delayedCall(1200, () => this.bannerText.setText(''));
  };

  private onWaveCompleted = (data: unknown): void => {
    const { waveIndex } = data as { waveIndex: number };
    this.bannerText.setText(`WAVE ${waveIndex} COMPLETED!`);

    if (waveIndex < WAVES_DATA.length) {
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

    this.traitModalContainer.removeAll(true);
    this.traitModalContainer.setVisible(true);

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.75);
    const modalTitle = this.add
      .text(width / 2, 120, 'CHOOSE A TRAIT UPGRADE', {
        fontSize: '28px',
        color: '#ffbe0b',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.traitModalContainer.add([overlay, modalTitle]);

    const cardWidth = 220;
    const cardHeight = 260;
    const spacing = 40;
    const startX = width / 2 - (cardWidth * 3 + spacing * 2) / 2 + cardWidth / 2;

    offers.forEach((trait, i) => {
      const cardX = startX + i * (cardWidth + spacing);
      const cardY = height / 2 + 20;

      const cardBg = this.add
        .rectangle(cardX, cardY, cardWidth, cardHeight, 0x1e293b, 0.95)
        .setStrokeStyle(
          3,
          trait.rarity === 'epic' ? 0xf72585 : trait.rarity === 'rare' ? 0x4cc9f0 : 0x80ed99,
        )
        .setInteractive({ useHandCursor: true });

      const title = this.add
        .text(cardX, cardY - 80, trait.name, {
          fontSize: '18px',
          color: '#ffffff',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);

      const rarityBadge = this.add
        .text(cardX, cardY - 50, trait.rarity.toUpperCase(), {
          fontSize: '12px',
          color:
            trait.rarity === 'epic' ? '#f72585' : trait.rarity === 'rare' ? '#4cc9f0' : '#80ed99',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);

      const desc = this.add
        .text(cardX, cardY, trait.description, {
          fontSize: '14px',
          color: '#cbd5e1',
          align: 'center',
          wordWrap: { width: cardWidth - 30 },
        })
        .setOrigin(0.5);

      const selectBtn = this.add
        .rectangle(cardX, cardY + 80, 140, 36, 0x3b82f6)
        .setInteractive({ useHandCursor: true });

      const btnTxt = this.add
        .text(cardX, cardY + 80, 'SELECT', {
          fontSize: '14px',
          color: '#ffffff',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);

      this.traitModalContainer.add([cardBg, title, rarityBadge, desc, selectBtn, btnTxt]);

      const onSelect = () => {
        soundEngine.playCoinSound();
        this.combatEngine.selectTraitOffer(trait);
        this.traitModalContainer.setVisible(false);
        phaseManager.setPhase(GamePhase.DEFENSE);

        const nextWaveIndex = this.runState.currentWave;
        this.combatEngine.startWave(WAVES_DATA[nextWaveIndex]);
      };

      cardBg.on('pointerdown', onSelect);
      selectBtn.on('pointerdown', onSelect);
    });
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
        `Waves Cleared: ${this.runState.currentWave} / ${WAVES_DATA.length}\n\n` +
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
      if (returned) return; // Prevent double trigger
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
