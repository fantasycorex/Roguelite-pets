import Phaser from 'phaser';
import { GamePhase } from '../types/phase';
import { phaseManager } from '../core/state/PhaseManager';
import { HabitatController } from '../core/controllers/HabitatController';
import { CarePanel } from '../ui/habitat/CarePanel';
import { CreatureRosterPanel } from '../ui/habitat/CreatureRosterPanel';
import { FoodShopPanel } from '../ui/habitat/FoodShopPanel';
import { EquipmentPanel } from '../ui/habitat/EquipmentPanel';
import { MapSelectionPanel } from '../ui/habitat/MapSelectionPanel';
import { SPECIES_DATA } from '../data/species.data';
import { CreatureEngine } from '../core/creature/CreatureEngine';
import { soundEngine } from '../core/audio/SoundEngine';

export class HabitatScene extends Phaser.Scene {
  private controller!: HabitatController;
  private carePanel!: CarePanel;
  private rosterPanel!: CreatureRosterPanel;
  private shopPanel!: FoodShopPanel;
  private equipmentPanel!: EquipmentPanel;
  private mapSelectionPanel!: MapSelectionPanel;

  private petSprite!: Phaser.GameObjects.Sprite;
  private coinsText!: Phaser.GameObjects.Text;
  private audioToggleText!: Phaser.GameObjects.Text;
  private runBuffText!: Phaser.GameObjects.Text;
  private devModalContainer!: Phaser.GameObjects.Container;
  private tutorialContainer!: Phaser.GameObjects.Container;
  private evolveBtnContainer!: Phaser.GameObjects.Container;

  private currentPetMood: string = 'Happy';

  constructor() {
    super({ key: 'HabitatScene' });
  }

  init(): void {
    this.controller = new HabitatController();
  }

  create(): void {
    phaseManager.setPhase(GamePhase.HABITAT);
    this.controller.refreshState();

    const { width, height } = this.scale;
    const activeCreature = this.controller.getActiveCreature();
    const saveData = this.controller.getSaveData();

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x1d2d44);

    // Header Title & Coins
    this.add
      .text(width / 2, 35, 'PET HABITAT', {
        fontSize: '28px',
        color: '#f72585',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.coinsText = this.add.text(width - 160, 30, `Coins: ${saveData.totalCoins}`, {
      fontSize: '18px',
      color: '#ffbe0b',
      fontStyle: 'bold',
    });

    // Audio Mute Toggle Button
    const audioBtn = this.add
      .rectangle(260, 35, 120, 32, 0x334155)
      .setInteractive({ useHandCursor: true });
    this.audioToggleText = this.add
      .text(260, 35, soundEngine.isMuted() ? '🔇 Audio: OFF' : '🔊 Audio: ON', {
        fontSize: '11px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    audioBtn.on('pointerdown', () => {
      const isMuted = soundEngine.toggleMute();
      this.audioToggleText.setText(isMuted ? '🔇 Audio: OFF' : '🔊 Audio: ON');
    });

    // Feature UI Panels
    this.rosterPanel = new CreatureRosterPanel(this);
    this.carePanel = new CarePanel(this);
    this.shopPanel = new FoodShopPanel(this);
    this.equipmentPanel = new EquipmentPanel(this);
    this.mapSelectionPanel = new MapSelectionPanel(this);

    // Render Creature Roster Bar
    this.rosterPanel.render(
      saveData.ownedCreatures,
      saveData.activeCreatureInstanceId,
      (instanceId) => {
        this.controller.switchActiveCreature(instanceId);
        this.scene.restart();
      },
    );

    // Pet Sprite & Bounce Animation
    const speciesConfig = SPECIES_DATA[activeCreature.speciesId] || SPECIES_DATA.guardian_blob;
    this.petSprite = this.add.sprite(width / 2 - 120, height / 2 - 10, 'pet_texture').setScale(2.5);
    this.petSprite.setTint(speciesConfig.colorHex);
    this.petSprite.setInteractive({ useHandCursor: true });
    this.petSprite.on('pointerdown', () => this.handlePeting());

    this.tweens.add({
      targets: this.petSprite,
      y: height / 2 - 25,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Level / EXP Text
    const nextExp = CreatureEngine.getExpForNextLevel(activeCreature.level);
    this.add
      .text(
        width / 2 - 120,
        height / 2 + 35,
        `${activeCreature.nickname} (${speciesConfig.role.toUpperCase()}) | Lv.${activeCreature.level} [${activeCreature.currentExp}/${nextExp} EXP]`,
        {
          fontSize: '14px',
          color: '#ffbe0b',
          fontStyle: 'bold',
        },
      )
      .setOrigin(0.5);

    // Active Run Buff Text
    this.runBuffText = this.add
      .text(width / 2 - 230, height / 2 + 175, '', {
        fontSize: '12px',
        color: '#ffbe0b',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Evolution Button Container
    this.evolveBtnContainer = this.add
      .container(width / 2 - 120, height / 2 - 80)
      .setVisible(false);
    const evolveBg = this.add
      .rectangle(0, 0, 160, 36, 0xf72585)
      .setInteractive({ useHandCursor: true });
    const evolveTxt = this.add
      .text(0, 0, '⚡ EVOLVE NOW!', { fontSize: '13px', color: '#ffffff', fontStyle: 'bold' })
      .setOrigin(0.5);
    this.evolveBtnContainer.add([evolveBg, evolveTxt]);

    evolveBg.on('pointerdown', () => {
      if (this.controller.evolveCreature()) {
        soundEngine.playVictoryFanfare();
        this.scene.restart();
      }
    });

    // Care & Shop Interactive Buttons
    this.createButton(width / 2 - 340, height - 60, 'FEED 🍖', 0x38b000, () =>
      this.handleFeeding('basic_kibble'),
    );
    this.createButton(width / 2 - 210, height - 60, 'PET ❤️', 0x7209b7, () => this.handlePeting());
    this.createButton(width / 2 - 80, height - 60, 'FOOD SHOP 🛒', 0x0284c7, () =>
      this.openShopModal(),
    );
    this.createButton(width / 2 + 50, height - 60, 'DEFENSE ⚔️', 0xf72585, () =>
      this.openMapSelectionModal(),
    );

    // Dev Tools Button
    const devBtn = this.add
      .rectangle(90, 35, 120, 32, 0x334155)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(90, 35, '🛠️ DEV TOOLS', { fontSize: '12px', color: '#cbd5e1', fontStyle: 'bold' })
      .setOrigin(0.5);
    devBtn.on('pointerdown', () => this.toggleDevControlsModal());

    // Modals
    this.devModalContainer = this.add.container(0, 0).setDepth(300).setVisible(false);
    this.tutorialContainer = this.add.container(0, 0).setDepth(400).setVisible(false);

    // Equipment Panel Render
    this.renderEquipmentPanel();
    this.updateUI();

    if (!saveData.tutorialCompleted) {
      this.showTutorialModal();
    }
  }

  private renderEquipmentPanel(): void {
    const active = this.controller.getActiveCreature();
    const saveData = this.controller.getSaveData();

    this.equipmentPanel.render(
      active,
      saveData.inventory,
      (itemId) => {
        this.controller.equipItem(itemId);
        this.renderEquipmentPanel();
        this.updateUI();
      },
      (slot) => {
        this.controller.unequipItem(slot);
        this.renderEquipmentPanel();
        this.updateUI();
      },
      (itemId) => {
        this.controller.sellItem(itemId);
        this.renderEquipmentPanel();
        this.updateUI();
      },
    );
  }

  private handleFeeding(foodId: string): void {
    const res = this.controller.feedPet(foodId);
    if (!res.success) {
      this.showFloatingText(
        this.petSprite.x,
        this.petSprite.y - 40,
        res.message || 'No Food!',
        '#ff0054',
      );
      return;
    }
    soundEngine.playFeedSound();
    this.showFloatingText(this.petSprite.x, this.petSprite.y - 40, `🍖 Fed ${foodId}`, '#38b000');
    this.updateUI();
  }

  private handlePeting(): void {
    const petRes = this.controller.petCreature();
    this.currentPetMood = petRes.mood;
    soundEngine.playPetSound();

    const moodColor =
      petRes.mood === 'Happy' ? '#f72585' : petRes.mood === 'Neutral' ? '#ffbe0b' : '#ff0054';
    this.showFloatingText(
      this.petSprite.x,
      this.petSprite.y - 40,
      `❤️ +${petRes.gainedAffection} (${petRes.mood})`,
      moodColor,
    );
    this.updateUI();
  }

  private openShopModal(): void {
    const save = this.controller.getSaveData();
    this.shopPanel.open(save.totalCoins, save.foodInventory, (foodId) => {
      const res = this.controller.buyFood(foodId);
      this.updateUI();
      return res;
    });
  }

  private openMapSelectionModal(): void {
    this.mapSelectionPanel.open(
      this.controller.getSelectedMapId(),
      (mapId) => this.controller.setSelectedMapId(mapId),
      (difficulty, seed) => this.startDefenseRun(difficulty, seed),
    );
  }

  private startDefenseRun(difficulty: string = 'normal', seed?: number): void {
    soundEngine.playAttackSound();
    const payload = this.controller.prepareDefenseRun();

    this.scene.start('DefenseScene', {
      petStats: payload.petStats,
      mapId: this.controller.getSelectedMapId(),
      speciesId: payload.speciesId,
      fullness: payload.fullness,
      affection: payload.affection,
      activeNextRunBuff: payload.activeNextRunBuff,
      difficulty,
      runSeed: seed,
    });
  }

  private updateUI(): void {
    const active = this.controller.getActiveCreature();
    const save = this.controller.getSaveData();

    this.carePanel.update(active, this.currentPetMood);
    this.coinsText.setText(`Coins: ${save.totalCoins}`);
    this.evolveBtnContainer.setVisible(this.controller.canEvolve());

    if (save.activeNextRunBuff) {
      const label =
        save.activeNextRunBuff.type === 'exp_buff' ? '+10% EXP Buff' : '+15% Speed Buff';
      this.runBuffText.setText(`⚡ Next Run Buff Active: ${label}`);
    } else {
      this.runBuffText.setText('');
    }
  }

  update(_time: number, delta: number): void {
    const deltaSeconds = delta / 1000;
    this.controller.updateCareDecay(deltaSeconds);
    this.carePanel.update(this.controller.getActiveCreature(), this.currentPetMood);
  }

  private showFloatingText(x: number, y: number, text: string, color: string): void {
    const floatTxt = this.add
      .text(x, y, text, {
        fontSize: '18px',
        color,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: floatTxt,
      y: y - 40,
      alpha: 0,
      duration: 900,
      onComplete: () => floatTxt.destroy(),
    });
  }

  private showTutorialModal(): void {
    const { width, height } = this.scale;
    this.tutorialContainer.removeAll(true);
    this.tutorialContainer.setVisible(true);

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);
    const box = this.add
      .rectangle(width / 2, height / 2, 480, 340, 0x1e293b)
      .setStrokeStyle(3, 0x38b000);

    const title = this.add
      .text(width / 2, height / 2 - 120, 'WELCOME TO ROGUELITE PETS! 🐾', {
        fontSize: '22px',
        color: '#ffbe0b',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const guideText = this.add
      .text(
        width / 2,
        height / 2 - 20,
        `1. SELECT between 3 Creature Roles (Guardian, Spark, Prowler)!\n` +
          `2. FEED & PET to maintain High Care for Combat Multipliers!\n` +
          `3. EQUIP collars, charms & toys, clear waves, and LEVEL UP!\n` +
          `4. Reach Level 5 to EVOLVE your creature into Stage 2!`,
        {
          fontSize: '14px',
          color: '#cbd5e1',
          align: 'left',
          lineSpacing: 10,
        },
      )
      .setOrigin(0.5);

    const startBtn = this.add
      .rectangle(width / 2, height / 2 + 120, 180, 40, 0x3b82f6)
      .setInteractive({ useHandCursor: true });

    const btnTxt = this.add
      .text(width / 2, height / 2 + 120, "GOT IT, LET'S PLAY!", {
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    startBtn.on('pointerdown', () => {
      const save = this.controller.getSaveData();
      save.tutorialCompleted = true;
      this.tutorialContainer.setVisible(false);
    });

    this.tutorialContainer.add([overlay, box, title, guideText, startBtn, btnTxt]);
  }

  private toggleDevControlsModal(): void {
    if (this.devModalContainer.visible) {
      this.devModalContainer.setVisible(false);
      return;
    }

    const { width, height } = this.scale;
    this.devModalContainer.removeAll(true);
    this.devModalContainer.setVisible(true);

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);
    const box = this.add
      .rectangle(width / 2, height / 2, 400, 320, 0x1e293b)
      .setStrokeStyle(2, 0x38b000);

    const title = this.add
      .text(width / 2, height / 2 - 120, 'DEVELOPER TESTING TOOLS', {
        fontSize: '20px',
        color: '#38b000',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.devModalContainer.add([overlay, box, title]);

    const closeBtn = this.add
      .rectangle(width / 2, height / 2 + 130, 140, 36, 0x475569)
      .setInteractive({ useHandCursor: true });
    const closeTxt = this.add
      .text(width / 2, height / 2 + 130, 'CLOSE', {
        fontSize: '13px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    closeBtn.on('pointerdown', () => this.devModalContainer.setVisible(false));
    this.devModalContainer.add([closeBtn, closeTxt]);
  }

  private createButton(
    x: number,
    y: number,
    label: string,
    bgColor: number,
    onClick: () => void,
  ): void {
    const container = this.add.container(x, y);
    const bg = this.add
      .rectangle(0, 0, 120, 44, bgColor, 1)
      .setInteractive({ useHandCursor: true });
    const txt = this.add
      .text(0, 0, label, {
        fontSize: '11px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    container.add([bg, txt]);

    bg.on('pointerdown', () => {
      this.tweens.add({
        targets: container,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 80,
        yoyo: true,
        onComplete: onClick,
      });
    });
  }
}
