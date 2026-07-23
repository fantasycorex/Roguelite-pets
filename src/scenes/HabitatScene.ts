import Phaser from 'phaser';
import { GamePhase } from '../types/phase';
import { phaseManager } from '../core/state/PhaseManager';
import { eventBus } from '../core/events/EventBus';
import { PetCareEngine, PetMood } from '../core/pet/PetCareEngine';
import { OwnedCreature, PermanentCreatureProfile } from '../types/creature';
import { EquipmentEngine } from '../core/equipment/EquipmentEngine';
import { EquipmentSlot } from '../types/equipment';
import { EQUIPMENT_DATA } from '../data/equipment.data';
import { SPECIES_DATA } from '../data/species.data';
import { MAPS_DATA } from '../data/maps.data';
import { FOOD_DATA } from '../data/food.data';
import { FoodBuffType } from '../types/food';
import { SaveManager } from '../core/save/SaveManager';
import { CreatureEngine } from '../core/creature/CreatureEngine';
import { soundEngine } from '../core/audio/SoundEngine';

export class HabitatScene extends Phaser.Scene {
  private activeCreature!: OwnedCreature;
  private ownedCreatures: OwnedCreature[] = [];
  private inventory: string[] = [];
  private foodInventory: Record<string, number> = {
    basic_kibble: 3,
    gourmet_treat: 1,
    energy_berry: 1,
  };
  private totalCoins: number = 0;
  private tutorialCompleted: boolean = false;
  private selectedMapId: string = 'heartwood_clearing';
  private activeNextRunBuff?: { type: FoodBuffType; multiplier: number };
  private currentPetMood: PetMood = 'Happy';
  private inventoryPage: number = 0;

  private hungerBar!: Phaser.GameObjects.Graphics;
  private affectionBar!: Phaser.GameObjects.Graphics;
  private hungerText!: Phaser.GameObjects.Text;
  private affectionText!: Phaser.GameObjects.Text;
  private buffBadgeText!: Phaser.GameObjects.Text;
  private moodText!: Phaser.GameObjects.Text;
  private runBuffText!: Phaser.GameObjects.Text;
  private coinsText!: Phaser.GameObjects.Text;
  private audioToggleText!: Phaser.GameObjects.Text;
  private petSprite!: Phaser.GameObjects.Sprite;
  private inventoryContainer!: Phaser.GameObjects.Container;
  private devModalContainer!: Phaser.GameObjects.Container;
  private tutorialContainer!: Phaser.GameObjects.Container;
  private mapSelectContainer!: Phaser.GameObjects.Container;
  private shopModalContainer!: Phaser.GameObjects.Container;
  private evolveBtnContainer!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'HabitatScene' });
  }

  init(): void {
    this.refreshFromSaveData();
  }

  private refreshFromSaveData(): void {
    const saveData = SaveManager.loadGame();
    this.ownedCreatures = saveData.ownedCreatures;
    this.activeCreature = SaveManager.getActiveCreature(saveData);
    this.inventory = saveData.inventory;
    this.foodInventory = saveData.foodInventory || {
      basic_kibble: 3,
      gourmet_treat: 1,
      energy_berry: 1,
    };
    this.totalCoins = saveData.totalCoins;
    this.tutorialCompleted = saveData.tutorialCompleted;
    this.activeNextRunBuff = saveData.activeNextRunBuff;
  }

  private persistState(): void {
    SaveManager.updateSaveData({
      activeCreatureInstanceId: this.activeCreature.instanceId,
      ownedCreatures: this.ownedCreatures,
      inventory: this.inventory,
      foodInventory: this.foodInventory,
      totalCoins: this.totalCoins,
      tutorialCompleted: this.tutorialCompleted,
      activeNextRunBuff: this.activeNextRunBuff,
    });
  }

  private getProfileFromOwned(c: OwnedCreature): PermanentCreatureProfile {
    const effectiveStats = CreatureEngine.getEffectiveStats(c);
    return {
      id: c.instanceId,
      name: c.nickname,
      level: c.level,
      currentExp: c.currentExp,
      hunger: 100 - c.fullness,
      affection: c.affection,
      lastCareTimestamp: Date.now(),
      equippedItemId: null,
      baseStats: effectiveStats,
    };
  }

  create(): void {
    phaseManager.setPhase(GamePhase.HABITAT);
    this.refreshFromSaveData();
    const { width, height } = this.scale;

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

    this.coinsText = this.add.text(width - 160, 30, `Coins: ${this.totalCoins}`, {
      fontSize: '18px',
      color: '#ffbe0b',
      fontStyle: 'bold',
    });

    // Mute/Unmute Audio Toggle Button
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

    // Roster Switcher Bar
    this.createRosterSwitcher(width);

    // Pet Sprite & Interactive Zone
    const speciesConfig = SPECIES_DATA[this.activeCreature.speciesId] || SPECIES_DATA.guardian_blob;
    this.petSprite = this.add.sprite(width / 2 - 120, height / 2 - 10, 'pet_texture').setScale(2.5);
    this.petSprite.setTint(speciesConfig.colorHex);
    this.petSprite.setInteractive({ useHandCursor: true });
    this.petSprite.on('pointerdown', () => this.petCreature());

    // Bounce Animation
    this.tweens.add({
      targets: this.petSprite,
      y: height / 2 - 25,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Creature Info & Level / EXP Text
    const nextExp = CreatureEngine.getExpForNextLevel(this.activeCreature.level);
    this.add
      .text(
        width / 2 - 120,
        height / 2 + 35,
        `${this.activeCreature.nickname} (${speciesConfig.role.toUpperCase()}) | Lv.${this.activeCreature.level} [${this.activeCreature.currentExp}/${nextExp} EXP]`,
        {
          fontSize: '14px',
          color: '#ffbe0b',
          fontStyle: 'bold',
        },
      )
      .setOrigin(0.5);

    // Pet Mood Badge
    this.moodText = this.add
      .text(width / 2 - 120, height / 2 + 55, `Mood: ${this.currentPetMood}`, {
        fontSize: '12px',
        color: '#80ed99',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Care Status Bars
    this.hungerBar = this.add.graphics();
    this.affectionBar = this.add.graphics();

    this.hungerText = this.add.text(width / 2 - 340, height / 2 + 85, '', {
      fontSize: '14px',
      color: '#4cc9f0',
      fontStyle: 'bold',
    });

    this.affectionText = this.add.text(width / 2 - 120, height / 2 + 85, '', {
      fontSize: '14px',
      color: '#f72585',
      fontStyle: 'bold',
    });

    // Care Buff Badge
    this.buffBadgeText = this.add
      .text(width / 2 - 230, height / 2 + 140, '', {
        fontSize: '14px',
        color: '#80ed99',
        fontStyle: 'bold',
        backgroundColor: '#0f172a',
        padding: { x: 10, y: 6 },
      })
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
      if (CreatureEngine.evolveCreature(this.activeCreature)) {
        soundEngine.playVictoryFanfare();
        this.persistState();
        this.scene.restart();
      }
    });

    // Interactive Care & Shop Buttons
    this.createButton(width / 2 - 340, height - 60, 'FEED 🍖', 0x38b000, () =>
      this.feedPet('basic_kibble'),
    );
    this.createButton(width / 2 - 210, height - 60, 'PET ❤️', 0x7209b7, () => this.petCreature());
    this.createButton(width / 2 - 80, height - 60, 'FOOD SHOP 🛒', 0x0284c7, () =>
      this.openShopModal(),
    );
    this.createButton(width / 2 + 50, height - 60, 'DEFENSE ⚔️', 0xf72585, () =>
      this.openMapSelectionModal(),
    );

    // Dev Controls Toggle Button
    const devBtn = this.add
      .rectangle(90, 35, 120, 32, 0x334155)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(90, 35, '🛠️ DEV TOOLS', { fontSize: '12px', color: '#cbd5e1', fontStyle: 'bold' })
      .setOrigin(0.5);
    devBtn.on('pointerdown', () => this.toggleDevControlsModal());

    // Containers for Modals
    this.devModalContainer = this.add.container(0, 0).setDepth(300).setVisible(false);
    this.tutorialContainer = this.add.container(0, 0).setDepth(400).setVisible(false);
    this.mapSelectContainer = this.add.container(0, 0).setDepth(500).setVisible(false);
    this.shopModalContainer = this.add.container(0, 0).setDepth(600).setVisible(false);

    // Setup Equipment Panel
    this.setupEquipmentPanel(width, height);

    this.updateCareUI();
    this.renderInventoryList();

    if (!this.tutorialCompleted) {
      this.showTutorialModal();
    }
  }

  private createRosterSwitcher(width: number): void {
    const startX = width / 2 - 180;
    const y = 70;

    this.ownedCreatures.forEach((creature, idx) => {
      const btnX = startX + idx * 180;
      const species = SPECIES_DATA[creature.speciesId] || SPECIES_DATA.guardian_blob;
      const isActive = creature.instanceId === this.activeCreature.instanceId;

      const bg = this.add
        .rectangle(btnX, y, 160, 30, isActive ? species.colorHex : 0x334155, 0.9)
        .setStrokeStyle(2, isActive ? 0xffbe0b : 0x475569)
        .setInteractive({ useHandCursor: true });

      this.add
        .text(btnX, y, `${species.name} (Lv.${creature.level})`, {
          fontSize: '11px',
          color: '#ffffff',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);

      bg.on('pointerdown', () => {
        this.activeCreature = creature;
        this.persistState();
        this.scene.restart();
      });
    });
  }

  // PET FOOD SHOP MODAL (Fixed Z-Ordering & Clean Cards Layout)
  private openShopModal(): void {
    const { width, height } = this.scale;
    this.shopModalContainer.removeAll(true);
    this.shopModalContainer.setVisible(true);

    // 1. Add Overlay, Modal Box and Header Title FIRST (Fixes layer coverage bug)
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);
    const box = this.add
      .rectangle(width / 2, height / 2, 540, 420, 0x1e293b)
      .setStrokeStyle(3, 0x0284c7);

    const title = this.add
      .text(width / 2, height / 2 - 170, 'PET FOOD SHOP 🛒', {
        fontSize: '24px',
        color: '#ffbe0b',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const coinsDisplay = this.add
      .text(width / 2, height / 2 - 142, `Your Coins: ${this.totalCoins}g`, {
        fontSize: '14px',
        color: '#80ed99',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.shopModalContainer.add([overlay, box, title, coinsDisplay]);

    // 2. Render Food Items Cards
    const shopItems = Object.values(FOOD_DATA);
    shopItems.forEach((food, idx) => {
      const cardY = height / 2 - 90 + idx * 95;

      const bg = this.add
        .rectangle(width / 2, cardY, 480, 80, 0x0f172a)
        .setStrokeStyle(1.5, 0x334155);

      const foodEmoji =
        food.id === 'basic_kibble' ? '🍖' : food.id === 'gourmet_treat' ? '🧁' : '🫐';
      const nameTxt = this.add.text(width / 2 - 225, cardY - 26, `${foodEmoji} ${food.name}`, {
        fontSize: '17px',
        color: '#ffffff',
        fontStyle: 'bold',
      });

      const descTxt = this.add.text(width / 2 - 225, cardY - 2, food.description, {
        fontSize: '11px',
        color: '#cbd5e1',
        wordWrap: { width: 290 },
      });

      const ownedCount = this.foodInventory[food.id] || 0;

      // Buy Button & Counter
      const buyBtn = this.add
        .rectangle(width / 2 + 165, cardY - 8, 100, 36, 0x16a34a)
        .setInteractive({ useHandCursor: true });
      const buyTxt = this.add
        .text(width / 2 + 165, cardY - 8, `BUY ${food.price}g`, {
          fontSize: '13px',
          color: '#ffffff',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);

      const ownedTxt = this.add
        .text(width / 2 + 165, cardY + 18, `Owned: ${ownedCount}`, {
          fontSize: '11px',
          color: '#ffbe0b',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);

      buyBtn.on('pointerdown', () => {
        if (this.totalCoins >= food.price) {
          this.totalCoins -= food.price;
          this.foodInventory[food.id] = (this.foodInventory[food.id] || 0) + 1;
          soundEngine.playCoinSound();
          this.persistState();
          this.openShopModal();
          this.updateCareUI();
        } else {
          this.showFloatingText(width / 2 + 165, cardY - 8, 'Not enough coins!', '#ff0054');
        }
      });

      this.shopModalContainer.add([bg, nameTxt, descTxt, buyBtn, buyTxt, ownedTxt]);
    });

    // Close Button
    const closeBtn = this.add
      .rectangle(width / 2, height / 2 + 165, 140, 36, 0x475569)
      .setInteractive({ useHandCursor: true });
    const closeTxt = this.add
      .text(width / 2, height / 2 + 165, 'CLOSE', {
        fontSize: '13px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    closeBtn.on('pointerdown', () => this.shopModalContainer.setVisible(false));
    this.shopModalContainer.add([closeBtn, closeTxt]);
  }

  private openMapSelectionModal(): void {
    const { width, height } = this.scale;
    this.mapSelectContainer.removeAll(true);
    this.mapSelectContainer.setVisible(true);

    const mapKeys = Object.keys(MAPS_DATA);
    let currentIndex = mapKeys.indexOf(this.selectedMapId);
    if (currentIndex < 0) currentIndex = 0;

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);
    const box = this.add
      .rectangle(width / 2, height / 2, 580, 420, 0x1e293b)
      .setStrokeStyle(3, 0x38b000);

    const title = this.add
      .text(width / 2, height / 2 - 170, 'SELECT BATTLE MAP', {
        fontSize: '24px',
        color: '#ffbe0b',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.mapSelectContainer.add([overlay, box, title]);

    const currentMapKey = mapKeys[currentIndex];
    const mapConfig = MAPS_DATA[currentMapKey];
    this.selectedMapId = currentMapKey;

    const mapTitle = this.add
      .text(
        width / 2,
        height / 2 - 130,
        `[ MAP ${currentIndex + 1} / ${mapKeys.length} ]  ${mapConfig.name}`,
        {
          fontSize: '18px',
          color: '#80ed99',
          fontStyle: 'bold',
        },
      )
      .setOrigin(0.5);

    const mapDesc = this.add
      .text(width / 2, height / 2 - 105, mapConfig.description, {
        fontSize: '13px',
        color: '#cbd5e1',
        align: 'center',
      })
      .setOrigin(0.5);

    const previewW = 380;
    const previewH = 180;
    const previewX = width / 2;
    const previewY = height / 2 + 5;

    const previewBg = this.add
      .rectangle(previewX, previewY, previewW, previewH, 0x0f172a)
      .setStrokeStyle(2, 0x334155);

    const previewGfx = this.add.graphics();
    const scaleX = previewW / width;
    const scaleY = previewH / height;
    const offsetX = previewX - previewW / 2;
    const offsetY = previewY - previewH / 2;

    previewGfx.lineStyle(6, 0x38b000, 0.9);
    previewGfx.beginPath();
    const p0 = mapConfig.waypoints[0];
    previewGfx.moveTo(offsetX + Math.max(10, p0.x * scaleX), offsetY + p0.y * scaleY);
    for (let i = 1; i < mapConfig.waypoints.length; i++) {
      const pt = mapConfig.waypoints[i];
      previewGfx.lineTo(offsetX + pt.x * scaleX, offsetY + pt.y * scaleY);
    }
    previewGfx.strokePath();

    if (mapConfig.secondaryWaypoints && mapConfig.secondaryWaypoints.length > 0) {
      previewGfx.lineStyle(6, 0xf72585, 0.9);
      previewGfx.beginPath();
      const s0 = mapConfig.secondaryWaypoints[0];
      previewGfx.moveTo(offsetX + Math.max(10, s0.x * scaleX), offsetY + s0.y * scaleY);
      for (let i = 1; i < mapConfig.secondaryWaypoints.length; i++) {
        const pt = mapConfig.secondaryWaypoints[i];
        previewGfx.lineTo(offsetX + pt.x * scaleX, offsetY + pt.y * scaleY);
      }
      previewGfx.strokePath();
    }

    const tw = mapConfig.towerPosition;
    previewGfx.fillStyle(0xffbe0b, 1);
    previewGfx.fillCircle(offsetX + tw.x * scaleX, offsetY + tw.y * scaleY, 8);

    const prevBtn = this.add
      .rectangle(width / 2 - 245, previewY, 44, 80, 0x334155)
      .setStrokeStyle(2, 0x475569)
      .setInteractive({ useHandCursor: true });
    const prevTxt = this.add
      .text(width / 2 - 245, previewY, '◄', {
        fontSize: '22px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const nextBtn = this.add
      .rectangle(width / 2 + 245, previewY, 44, 80, 0x334155)
      .setStrokeStyle(2, 0x475569)
      .setInteractive({ useHandCursor: true });
    const nextTxt = this.add
      .text(width / 2 + 245, previewY, '►', {
        fontSize: '22px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    prevBtn.on('pointerdown', () => {
      currentIndex = (currentIndex - 1 + mapKeys.length) % mapKeys.length;
      this.selectedMapId = mapKeys[currentIndex];
      this.openMapSelectionModal();
    });

    nextBtn.on('pointerdown', () => {
      currentIndex = (currentIndex + 1) % mapKeys.length;
      this.selectedMapId = mapKeys[currentIndex];
      this.openMapSelectionModal();
    });

    const startBtn = this.add
      .rectangle(width / 2, height / 2 + 150, 220, 44, 0xf72585)
      .setInteractive({ useHandCursor: true });
    const startTxt = this.add
      .text(width / 2, height / 2 + 150, 'START DEFENSE RUN ⚔️', {
        fontSize: '15px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    startBtn.on('pointerdown', () => {
      this.mapSelectContainer.setVisible(false);
      this.startDefenseRun();
    });

    const closeBtn = this.add
      .rectangle(width / 2 + 245, height / 2 - 170, 30, 30, 0xef4444)
      .setInteractive({ useHandCursor: true });
    const closeTxt = this.add
      .text(width / 2 + 245, height / 2 - 170, '✕', {
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    closeBtn.on('pointerdown', () => this.mapSelectContainer.setVisible(false));

    this.mapSelectContainer.add([
      mapTitle,
      mapDesc,
      previewBg,
      previewGfx,
      prevBtn,
      prevTxt,
      nextBtn,
      nextTxt,
      startBtn,
      startTxt,
      closeBtn,
      closeTxt,
    ]);
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
      this.tutorialCompleted = true;
      this.persistState();
      this.tutorialContainer.setVisible(false);
    });

    this.tutorialContainer.add([overlay, box, title, guideText, startBtn, btnTxt]);
  }

  private toggleDevControlsModal(): void {
    const isVisible = this.devModalContainer.visible;
    if (isVisible) {
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

    const actions = [
      {
        label: '+100 COINS',
        color: 0x0284c7,
        onClick: () => {
          this.totalCoins += 100;
          this.persistState();
          this.updateCareUI();
        },
      },
      {
        label: '+500 EXP (INSTANT LEVEL UP)',
        color: 0x16a34a,
        onClick: () => {
          CreatureEngine.addExpToCreature(this.activeCreature, 500);
          this.persistState();
          this.scene.restart();
        },
      },
      {
        label: 'MAX CARE (100/100)',
        color: 0x9333ea,
        onClick: () => {
          this.activeCreature.fullness = 100;
          this.activeCreature.affection = 100;
          this.persistState();
          this.updateCareUI();
        },
      },
      {
        label: 'RESET SAVE DATA',
        color: 0xd97706,
        onClick: () => {
          SaveManager.resetSave();
          this.scene.restart();
        },
      },
    ];

    actions.forEach((act, idx) => {
      const btnY = height / 2 - 50 + idx * 50;
      const b = this.add
        .rectangle(width / 2, btnY, 260, 40, act.color)
        .setInteractive({ useHandCursor: true });
      const t = this.add
        .text(width / 2, btnY, act.label, {
          fontSize: '14px',
          color: '#ffffff',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);

      b.on('pointerdown', () => {
        act.onClick();
        this.showFloatingText(width / 2, btnY, 'Done!', '#80ed99');
      });

      this.devModalContainer.add([b, t]);
    });

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

  // REDESIGNED EQUIPMENT & INVENTORY PANEL (No Overlapping, Clean Slots + Pagination)
  private setupEquipmentPanel(width: number, height: number): void {
    const panelX = width - 340;
    const panelY = height / 2 + 10;
    const panelW = 310;
    const panelH = 540;

    this.add.rectangle(panelX, panelY, panelW, panelH, 0x0f172a, 0.95).setStrokeStyle(2, 0x334155);

    this.add
      .text(panelX, panelY - panelH / 2 + 25, 'EQUIPMENT & INVENTORY', {
        fontSize: '16px',
        color: '#ffbe0b',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.inventoryContainer = this.add.container(0, 0);
  }

  private renderInventoryList(): void {
    this.inventoryContainer.removeAll(true);

    const width = this.scale.width;
    const height = this.scale.height;
    const panelX = width - 340;
    const panelTopY = height / 2 - 220;

    const equipped = EquipmentEngine.getEquippedItems(this.activeCreature);
    const slots: EquipmentSlot[] = ['collar', 'charm', 'toy'];

    // 1. Render 3 Clean Equipped Slot Cards at top of panel
    slots.forEach((slot, idx) => {
      const slotY = panelTopY + idx * 36;
      const item = equipped[slot];

      const slotBg = this.add
        .rectangle(panelX, slotY, 290, 32, 0x1e293b)
        .setStrokeStyle(1, item ? 0x80ed99 : 0x334155);

      const slotLabelText = `${slot.toUpperCase()}: ${item ? item.name : 'Empty'}`;
      const slotTxt = this.add.text(panelX - 135, slotY - 7, slotLabelText, {
        fontSize: '11px',
        color: item ? '#ffffff' : '#64748b',
        fontStyle: item ? 'bold' : 'normal',
      });

      this.inventoryContainer.add([slotBg, slotTxt]);

      if (item) {
        const unequipBtn = this.add
          .rectangle(panelX + 105, slotY, 65, 22, 0xef4444)
          .setInteractive({ useHandCursor: true });
        const unequipTxt = this.add
          .text(panelX + 105, slotY, 'UNEQUIP', {
            fontSize: '9px',
            color: '#ffffff',
            fontStyle: 'bold',
          })
          .setOrigin(0.5);

        unequipBtn.on('pointerdown', () => {
          EquipmentEngine.unequipItem(this.activeCreature, this.inventory, slot);
          this.persistState();
          this.renderInventoryList();
          this.updateCareUI();
        });

        this.inventoryContainer.add([unequipBtn, unequipTxt]);
      }
    });

    // 2. Inventory Section Divider & Pagination Controls
    const invHeaderY = panelTopY + 120;
    const itemsPerPage = 4;
    const totalPages = Math.max(1, Math.ceil(this.inventory.length / itemsPerPage));
    if (this.inventoryPage >= totalPages) this.inventoryPage = totalPages - 1;

    const invHeaderBg = this.add.rectangle(panelX, invHeaderY, 290, 26, 0x334155);
    const invTitleTxt = this.add.text(
      panelX - 135,
      invHeaderY - 6,
      `INVENTORY BAG (${this.inventory.length}) - Pg ${this.inventoryPage + 1}/${totalPages}`,
      {
        fontSize: '11px',
        color: '#ffbe0b',
        fontStyle: 'bold',
      },
    );

    this.inventoryContainer.add([invHeaderBg, invTitleTxt]);

    if (totalPages > 1) {
      const prevPgBtn = this.add
        .rectangle(panelX + 90, invHeaderY, 28, 20, 0x475569)
        .setInteractive({ useHandCursor: true });
      const prevPgTxt = this.add
        .text(panelX + 90, invHeaderY, '◄', { fontSize: '10px', color: '#ffffff' })
        .setOrigin(0.5);

      const nextPgBtn = this.add
        .rectangle(panelX + 125, invHeaderY, 28, 20, 0x475569)
        .setInteractive({ useHandCursor: true });
      const nextPgTxt = this.add
        .text(panelX + 125, invHeaderY, '►', { fontSize: '10px', color: '#ffffff' })
        .setOrigin(0.5);

      prevPgBtn.on('pointerdown', () => {
        this.inventoryPage = (this.inventoryPage - 1 + totalPages) % totalPages;
        this.renderInventoryList();
      });

      nextPgBtn.on('pointerdown', () => {
        this.inventoryPage = (this.inventoryPage + 1) % totalPages;
        this.renderInventoryList();
      });

      this.inventoryContainer.add([prevPgBtn, prevPgTxt, nextPgBtn, nextPgTxt]);
    }

    // 3. Inventory Items List for Current Page (Max 4 items visible, no overflow)
    const pageItems = this.inventory.slice(
      this.inventoryPage * itemsPerPage,
      (this.inventoryPage + 1) * itemsPerPage,
    );

    if (pageItems.length === 0) {
      const emptyText = this.add
        .text(panelX, invHeaderY + 60, 'Inventory Empty\n(Defeat enemies in Defense run)', {
          fontSize: '12px',
          color: '#64748b',
          align: 'center',
        })
        .setOrigin(0.5);
      this.inventoryContainer.add(emptyText);
      return;
    }

    pageItems.forEach((itemId, idx) => {
      const itemConfig = EQUIPMENT_DATA[itemId];
      if (!itemConfig) return;

      const itemY = invHeaderY + 45 + idx * 62;

      const itemBg = this.add
        .rectangle(panelX, itemY, 290, 54, 0x1e293b)
        .setStrokeStyle(1, 0x475569);

      // Truncate name if long
      const displayName =
        itemConfig.name.length > 15 ? itemConfig.name.substring(0, 14) + '..' : itemConfig.name;
      const nameTxt = this.add.text(
        panelX - 135,
        itemY - 18,
        `${displayName} [${itemConfig.slot.toUpperCase()}]`,
        {
          fontSize: '11px',
          color: '#f8fafc',
          fontStyle: 'bold',
        },
      );

      const descTxt = this.add.text(panelX - 135, itemY + 2, itemConfig.description, {
        fontSize: '9px',
        color: '#94a3b8',
      });

      // EQUIP Button
      const equipBtn = this.add
        .rectangle(panelX + 50, itemY, 52, 24, 0x3b82f6)
        .setInteractive({ useHandCursor: true });
      const btnTxt = this.add
        .text(panelX + 50, itemY, 'EQUIP', {
          fontSize: '10px',
          color: '#ffffff',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);

      equipBtn.on('pointerdown', () => {
        EquipmentEngine.equipItem(this.activeCreature, this.inventory, itemId);
        this.persistState();
        this.renderInventoryList();
        this.updateCareUI();
      });

      // SELL Button (+Coins)
      const sellBtn = this.add
        .rectangle(panelX + 110, itemY, 55, 24, 0xd97706)
        .setInteractive({ useHandCursor: true });
      const sellTxt = this.add
        .text(panelX + 110, itemY, `SELL ${itemConfig.sellValue}g`, {
          fontSize: '9px',
          color: '#ffffff',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);

      sellBtn.on('pointerdown', () => {
        const value = EquipmentEngine.sellItem(this.inventory, itemId);
        this.totalCoins += value;
        soundEngine.playCoinSound();
        this.persistState();
        this.renderInventoryList();
        this.updateCareUI();
      });

      this.inventoryContainer.add([itemBg, nameTxt, descTxt, equipBtn, btnTxt, sellBtn, sellTxt]);
    });
  }

  update(_time: number, delta: number): void {
    const deltaSeconds = delta / 1000;
    const legacyProfile = this.getProfileFromOwned(this.activeCreature);
    PetCareEngine.updateCareDecay(legacyProfile, deltaSeconds, 0.3);
    this.activeCreature.fullness = 100 - legacyProfile.hunger;
    this.updateCareUI();
  }

  private feedPet(foodId: string = 'basic_kibble'): void {
    const foodConfig = FOOD_DATA[foodId] || FOOD_DATA.basic_kibble;
    const ownedCount = this.foodInventory[foodId] || 0;

    if (ownedCount <= 0) {
      this.showFloatingText(
        this.petSprite.x,
        this.petSprite.y - 40,
        `No ${foodConfig.name}! Buy in Shop`,
        '#ff0054',
      );
      return;
    }

    this.foodInventory[foodId]--;
    const legacyProfile = this.getProfileFromOwned(this.activeCreature);

    PetCareEngine.feedPet(legacyProfile, foodConfig.fullnessRestore);
    if (foodConfig.affectionRestore > 0) {
      this.activeCreature.affection = Math.min(
        100,
        this.activeCreature.affection + foodConfig.affectionRestore,
      );
    }

    if (foodConfig.buffEffect) {
      this.activeNextRunBuff = {
        type: foodConfig.buffEffect.type,
        multiplier: foodConfig.buffEffect.multiplier,
      };
    }

    this.activeCreature.fullness = 100 - legacyProfile.hunger;
    this.persistState();
    soundEngine.playFeedSound();
    eventBus.emit('PET_FED', { hunger: legacyProfile.hunger });

    this.tweens.add({
      targets: this.petSprite,
      scaleX: 3.0,
      scaleY: 1.8,
      duration: 120,
      yoyo: true,
      ease: 'Quad.easeOut',
    });

    this.showFloatingText(
      this.petSprite.x,
      this.petSprite.y - 40,
      `🍖 Fed ${foodConfig.name}`,
      '#38b000',
    );
    this.updateCareUI();
  }

  private petCreature(): void {
    const legacyProfile = this.getProfileFromOwned(this.activeCreature);
    const petResult = PetCareEngine.petCreature(legacyProfile, 10);
    this.activeCreature.affection = legacyProfile.affection;
    this.currentPetMood = petResult.mood;
    this.persistState();

    soundEngine.playPetSound();
    eventBus.emit('PET_PETTED', { affection: legacyProfile.affection });

    this.tweens.add({
      targets: this.petSprite,
      scaleX: 2.2,
      scaleY: 2.9,
      duration: 150,
      yoyo: true,
      ease: 'Back.easeOut',
    });

    const moodColor =
      petResult.mood === 'Happy' ? '#f72585' : petResult.mood === 'Neutral' ? '#ffbe0b' : '#ff0054';
    this.showFloatingText(
      this.petSprite.x,
      this.petSprite.y - 40,
      `❤️ +${petResult.gainedAffection} (${petResult.mood})`,
      moodColor,
    );
    this.updateCareUI();
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

  private updateCareUI(): void {
    const legacyProfile = this.getProfileFromOwned(this.activeCreature);
    const { hunger, affection } = legacyProfile;
    const barWidth = 160;
    const barHeight = 14;
    const xLeft = this.scale.width / 2 - 340;
    const xRight = this.scale.width / 2 - 120;
    const y = this.scale.height / 2 + 100;

    this.hungerBar.clear();
    this.hungerBar.fillStyle(0x0f172a, 0.8);
    this.hungerBar.fillRect(xLeft, y, barWidth, barHeight);
    this.hungerBar.fillStyle(hunger > 30 ? 0x38b000 : 0xff0054, 1);
    this.hungerBar.fillRect(xLeft, y, barWidth * (hunger / 100), barHeight);
    this.hungerText.setText(`Fullness: ${Math.round(100 - hunger)}/100`);

    this.affectionBar.clear();
    this.affectionBar.fillStyle(0x0f172a, 0.8);
    this.affectionBar.fillRect(xRight, y, barWidth, barHeight);
    this.affectionBar.fillStyle(0xf72585, 1);
    this.affectionBar.fillRect(xRight, y, barWidth * (affection / 100), barHeight);
    this.affectionText.setText(`Affection: ${Math.round(affection)}/100`);

    this.moodText.setText(`Mood: ${this.currentPetMood}`);

    const careBonus = PetCareEngine.calculateCareBonus(legacyProfile);
    const baseStats = CreatureEngine.getEffectiveStats(this.activeCreature);
    const effectiveStats = EquipmentEngine.getEffectiveStats(this.activeCreature, baseStats);

    const finalDamage = Math.round(effectiveStats.attackDamage * careBonus.damageMultiplier);
    const finalSpeed = (effectiveStats.attackSpeed * careBonus.speedMultiplier).toFixed(2);
    const finalHp = Math.round(effectiveStats.maxHp * careBonus.hpMultiplier);

    this.buffBadgeText.setText(
      `Combat Stats: Atk ${finalDamage} | Spd ${finalSpeed}/s | HP ${finalHp}`,
    );

    if (this.activeNextRunBuff) {
      const buffLabel =
        this.activeNextRunBuff.type === 'exp_buff' ? '+10% EXP Buff' : '+15% Speed Buff';
      this.runBuffText.setText(`⚡ Next Run Buff Active: ${buffLabel}`);
    } else {
      this.runBuffText.setText('');
    }

    this.evolveBtnContainer.setVisible(CreatureEngine.canEvolve(this.activeCreature));
    this.coinsText.setText(`Coins: ${this.totalCoins}`);
  }

  private startDefenseRun(): void {
    soundEngine.playAttackSound();
    const legacyProfile = this.getProfileFromOwned(this.activeCreature);
    const careBonus = PetCareEngine.calculateCareBonus(legacyProfile);
    const baseStats = CreatureEngine.getEffectiveStats(this.activeCreature);
    const effectiveStats = EquipmentEngine.getEffectiveStats(this.activeCreature, baseStats);

    let speedMult = careBonus.speedMultiplier;
    if (this.activeNextRunBuff?.type === 'speed_buff') {
      speedMult *= this.activeNextRunBuff.multiplier;
    }

    const modifiedStats = {
      ...effectiveStats,
      attackDamage: effectiveStats.attackDamage * careBonus.damageMultiplier,
      attackSpeed: effectiveStats.attackSpeed * speedMult,
      maxHp: effectiveStats.maxHp * careBonus.hpMultiplier,
    };

    this.scene.start('DefenseScene', {
      petStats: modifiedStats,
      mapId: this.selectedMapId,
    });
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
