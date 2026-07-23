import Phaser from 'phaser';
import { GamePhase } from '../types/phase';
import { phaseManager } from '../core/state/PhaseManager';
import { eventBus } from '../core/events/EventBus';
import { RunController } from '../core/controllers/RunController';
import { CombatRenderer } from '../ui/defense/CombatRenderer';
import { CombatHUD } from '../ui/defense/CombatHUD';
import { TraitDraftPanel } from '../ui/defense/TraitDraftPanel';
import { BossPresentation } from '../ui/defense/BossPresentation';
import { ResultsPanel } from '../ui/defense/ResultsPanel';
import { DEFAULT_CREATURE_STATS } from '../data/creatures.data';
import { CreatureStats } from '../types/creature';
import { ActiveEnemy } from '../core/state/BattleRunState';
import { EquipmentConfig } from '../types/equipment';
import { soundEngine } from '../core/audio/SoundEngine';

export class DefenseScene extends Phaser.Scene {
  private runController!: RunController;
  private combatRenderer!: CombatRenderer;
  private hud!: CombatHUD;
  private traitDraftPanel!: TraitDraftPanel;
  private bossPresentation!: BossPresentation;
  private resultsPanel!: ResultsPanel;

  private petStats: CreatureStats = DEFAULT_CREATURE_STATS;
  private selectedMapId: string = 'heartwood_clearing';
  private speciesId: string = 'guardian_blob';
  private fullness: number = 100;
  private affection: number = 100;
  private activeNextRunBuff?: { type: string; multiplier: number };

  constructor() {
    super({ key: 'DefenseScene' });
  }

  init(data?: {
    petStats?: CreatureStats;
    mapId?: string;
    speciesId?: string;
    fullness?: number;
    affection?: number;
    activeNextRunBuff?: { type: string; multiplier: number };
  }): void {
    this.petStats = data?.petStats || { ...DEFAULT_CREATURE_STATS };
    this.selectedMapId = data?.mapId || 'heartwood_clearing';
    this.speciesId = data?.speciesId || 'guardian_blob';
    this.fullness = data?.fullness ?? 100;
    this.affection = data?.affection ?? 100;
    this.activeNextRunBuff = data?.activeNextRunBuff;
  }

  create(): void {
    phaseManager.setPhase(GamePhase.DEFENSE);
    const { width } = this.scale;

    // Run Controller Setup
    this.runController = new RunController(
      this.petStats,
      this.selectedMapId,
      this.speciesId,
      this.fullness,
      this.affection,
      this.activeNextRunBuff,
    );

    const runState = this.runController.getRunState();

    // Map Background
    this.add.rectangle(width / 2, this.scale.height / 2, width, this.scale.height, 0x0f172a);

    // Feature UI Panels & Renderers
    this.combatRenderer = new CombatRenderer(this);
    this.hud = new CombatHUD(this);
    this.traitDraftPanel = new TraitDraftPanel(this);
    this.bossPresentation = new BossPresentation(this);
    this.resultsPanel = new ResultsPanel(this);

    this.combatRenderer.initMapGraphics(runState);

    // Speed & Pause Control Buttons
    const speedBtn = this.add
      .rectangle(width - 320, 30, 70, 30, 0x334155)
      .setInteractive({ useHandCursor: true });
    this.hud.speedBtnText = this.add
      .text(width - 320, 30, '⚡ 1x', {
        fontSize: '12px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    speedBtn.on('pointerdown', () => {
      let nextScale = 1.0;
      if (runState.timeScale === 1.0) nextScale = 2.0;
      else if (runState.timeScale === 2.0) nextScale = 4.0;
      else nextScale = 1.0;
      this.runController.setTimeScale(nextScale);
      this.hud.speedBtnText.setText(`⚡ ${nextScale}x`);
    });

    const pauseBtn = this.add
      .rectangle(width - 230, 30, 70, 30, 0x334155)
      .setInteractive({ useHandCursor: true });
    this.hud.pauseBtnText = this.add
      .text(width - 230, 30, '⏸️ PAUSE', {
        fontSize: '11px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    pauseBtn.on('pointerdown', () => {
      const isPaused = this.runController.togglePause();
      this.hud.pauseBtnText.setText(isPaused ? '▶️ PLAY' : '⏸️ PAUSE');
      this.hud.bannerText.setText(isPaused ? 'GAME PAUSED' : '');
    });

    // Back to Habitat Button
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
      this.runController.settleRunRewards();
      eventBus.emit('DEFENSE_ABORTED');
      this.scene.start('HabitatScene');
    });

    // Keyboard Accessibility
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (event.code === 'Space' || event.code === 'KeyP') {
        const isPaused = this.runController.togglePause();
        this.hud.pauseBtnText.setText(isPaused ? '▶️ PLAY' : '⏸️ PAUSE');
        this.hud.bannerText.setText(isPaused ? 'GAME PAUSED' : '');
      } else if (this.traitDraftPanel.isVisible()) {
        const offers = this.runController.getTraitOffers();
        if (event.code === 'Digit1' && offers[0]) this.selectTrait(offers[0]);
        else if (event.code === 'Digit2' && offers[1]) this.selectTrait(offers[1]);
        else if (event.code === 'Digit3' && offers[2]) this.selectTrait(offers[2]);
        else if (event.code === 'KeyR' && runState.rerollsRemaining > 0) {
          const newOffers = this.runController.rerollTraitOffers();
          if (newOffers) {
            soundEngine.playCoinSound();
            this.traitDraftPanel.render(
              newOffers,
              runState.rerollsRemaining,
              (t) => this.selectTrait(t),
              () => this.runController.rerollTraitOffers(),
            );
          }
        }
      }
    });

    this.setupEventListeners();
    this.runController.startRun();
  }

  private setupEventListeners(): void {
    this.cleanupEvents();

    eventBus.on('ENEMY_SPAWNED', this.onEnemySpawned);
    eventBus.on('ENEMY_KILLED', this.onEnemyKilled);
    eventBus.on('EQUIPMENT_DROPPED', this.onEquipmentDropped);
    eventBus.on('CREATURE_ATTACKED', this.onCreatureAttacked);
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
    eventBus.off('ENEMY_KILLED', this.onEnemyKilled);
    eventBus.off('EQUIPMENT_DROPPED', this.onEquipmentDropped);
    eventBus.off('CREATURE_ATTACKED', this.onCreatureAttacked);
    eventBus.off('SPECIAL_ABILITY_USED', this.onSpecialAbilityUsed);
    eventBus.off('TOWER_DAMAGED', this.onTowerDamaged);
    eventBus.off('WAVE_STARTED', this.onWaveStarted);
    eventBus.off('WAVE_COMPLETED', this.onWaveCompleted);
    eventBus.off('TOWER_DESTROYED', this.onTowerDestroyed);
    eventBus.off('BOSS_PHASE_CHANGED', this.onBossPhaseChanged);
    eventBus.off('BOSS_TELEGRAPH', this.onBossTelegraph);
  };

  private onEnemySpawned = (data: unknown): void => {
    this.combatRenderer.spawnEnemySprite(data as ActiveEnemy);
  };

  private onEnemyKilled = (data: unknown): void => {
    const { instanceId, x, y, coinReward } = data as {
      instanceId: string;
      x: number;
      y: number;
      coinReward: number;
    };
    soundEngine.playCoinSound();
    this.combatRenderer.removeEnemySprite(instanceId);

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
    const runState = this.runController.getRunState();
    this.combatRenderer.renderLaserAttack(runState.petX, runState.petY, targetX, targetY);
  };

  private onSpecialAbilityUsed = (data: unknown): void => {
    const { x, y, radius } = data as { x: number; y: number; radius: number };
    this.combatRenderer.renderSpecialBurst(x, y, radius);
  };

  private onTowerDamaged = (): void => {
    soundEngine.playHitSound();
  };

  private onBossPhaseChanged = (data: unknown): void => {
    const { name } = data as { name: string };
    this.bossPresentation.presentPhase2(name, this.hud.bannerText);
  };

  private onBossTelegraph = (data: unknown): void => {
    const { x, y, radius, warningTimeMs } = data as {
      x: number;
      y: number;
      radius: number;
      warningTimeMs: number;
    };
    this.bossPresentation.presentTelegraph(x, y, radius, warningTimeMs);
  };

  private onWaveStarted = (data: unknown): void => {
    const { waveIndex } = data as { waveIndex: number };
    const runState = this.runController.getRunState();
    this.hud.waveText.setText(
      `${runState.mapConfig.name.toUpperCase()} • WAVE ${waveIndex} / ${runState.totalWaves}  (#${runState.runSeed})`,
    );
    this.hud.bannerText.setText(`WAVE ${waveIndex} START!`);
    this.time.delayedCall(1200, () => this.hud.bannerText.setText(''));
  };

  private onWaveCompleted = (data: unknown): void => {
    const { waveIndex } = data as { waveIndex: number };
    const runState = this.runController.getRunState();
    this.hud.bannerText.setText(`WAVE ${waveIndex} COMPLETED!`);

    if (waveIndex < runState.totalWaves) {
      this.time.delayedCall(1500, () => {
        this.hud.bannerText.setText('');
        this.openTraitSelectionModal();
      });
    } else {
      soundEngine.playVictoryFanfare();
      this.time.delayedCall(1000, () => this.openResultsModal(true));
    }
  };

  private openTraitSelectionModal(): void {
    phaseManager.setPhase(GamePhase.TRAIT_SELECTION);
    const offers = this.runController.getTraitOffers();
    const runState = this.runController.getRunState();

    this.traitDraftPanel.render(
      offers,
      runState.rerollsRemaining,
      (trait) => this.selectTrait(trait),
      () => this.runController.rerollTraitOffers(),
    );
  }

  private selectTrait(trait: TraitConfig): void {
    this.runController.selectTraitOffer(trait);
    phaseManager.setPhase(GamePhase.DEFENSE);
    this.hud.update(this.runController.getRunState());
  }

  private onTowerDestroyed = (): void => {
    soundEngine.playDefeatSound();
    this.hud.bannerText.setText('DEFEAT! TOWER DESTROYED');
    this.hud.bannerText.setColor('#ff0054');
    this.time.delayedCall(1200, () => this.openResultsModal(false));
  };

  private openResultsModal(isVictory: boolean): void {
    phaseManager.setPhase(GamePhase.RESULTS);
    this.runController.settleRunRewards();

    this.resultsPanel.open(this.runController.getRunState(), isVictory, () => {
      this.cleanupEvents();
      this.combatRenderer.destroy();
      this.scene.start('HabitatScene');
    });
  }

  update(_time: number, delta: number): void {
    const deltaSeconds = delta / 1000;
    this.runController.update(deltaSeconds);
    const runState = this.runController.getRunState();

    this.combatRenderer.update(runState);
    this.hud.update(runState);
  }
}
