import Phaser from 'phaser';
import { GamePhase } from '../types/phase';
import { phaseManager } from '../core/state/PhaseManager';
import { eventBus } from '../core/events/EventBus';
import { PetCareEngine } from '../core/pet/PetCareEngine';
import { OwnedCreature, PermanentCreatureProfile } from '../types/creature';
import { EquipmentEngine } from '../core/equipment/EquipmentEngine';
import { EQUIPMENT_DATA } from '../data/equipment.data';
import { SPECIES_DATA } from '../data/species.data';
import { MAPS_DATA } from '../data/maps.data';
import { SaveManager } from '../core/save/SaveManager';
import { CreatureEngine } from '../core/creature/CreatureEngine';
import { soundEngine } from '../core/audio/SoundEngine';

export class HabitatScene extends Phaser.Scene {
  private activeCreature!: OwnedCreature;
  private ownedCreatures: OwnedCreature[] = [];
  private inventory: string[] = [];
  private totalCoins: number = 0;
  private tutorialCompleted: boolean = false;
  private selectedMapId: string = 'heartwood_clearing';

  private hungerBar!: Phaser.GameObjects.Graphics;
  private affectionBar!: Phaser.GameObjects.Graphics;
  private hungerText!: Phaser.GameObjects.Text;
  private affectionText!: Phaser.GameObjects.Text;
  private buffBadgeText!: Phaser.GameObjects.Text;
  private equipStatusText!: Phaser.GameObjects.Text;
  private coinsText!: Phaser.GameObjects.Text;
  private audioToggleText!: Phaser.GameObjects.Text;
  private petSprite!: Phaser.GameObjects.Sprite;
  private inventoryContainer!: Phaser.GameObjects.Container;
  private devModalContainer!: Phaser.GameObjects.Container;
  private tutorialContainer!: Phaser.GameObjects.Container;
  private mapSelectContainer!: Phaser.GameObjects.Container;
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
    this.totalCoins = saveData.totalCoins;
    this.tutorialCompleted = saveData.tutorialCompleted;
  }

  private persistState(): void {
    SaveManager.updateSaveData({
      activeCreatureInstanceId: this.activeCreature.instanceId,
      ownedCreatures: this.ownedCreatures,
      inventory: this.inventory,
      totalCoins: this.totalCoins,
      tutorialCompleted: this.tutorialCompleted,
    });
  }

  // Convert OwnedCreature to legacy profile payload for care engine compatibility
  private getProfileFromOwned(c: OwnedCreature): PermanentCreatureProfile {
    const effectiveStats = CreatureEngine.getEffectiveStats(c);
    const equippedItemId = c.equippedItems.accessory || null;
    return {
      id: c.instanceId,
      name: c.nickname,
      level: c.level,
      currentExp: c.currentExp,
      hunger: 100 - c.fullness,
      affection: c.affection,
      lastCareTimestamp: Date.now(),
      equippedItemId,
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

    // Care Status Bars
    this.hungerBar = this.add.graphics();
    this.affectionBar = this.add.graphics();

    this.hungerText = this.add.text(width / 2 - 340, height / 2 + 75, '', {
      fontSize: '14px',
      color: '#4cc9f0',
      fontStyle: 'bold',
    });

    this.affectionText = this.add.text(width / 2 - 120, height / 2 + 75, '', {
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

    // Interactive Care Buttons
    this.createButton(width / 2 - 320, height - 60, 'FEED 🍖', 0x38b000, () => this.feedPet());
    this.createButton(width / 2 - 160, height - 60, 'PET ❤️', 0x7209b7, () => this.petCreature());
    this.createButton(width / 2, height - 60, 'DEFENSE ⚔️', 0xf72585, () =>
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

  private openMapSelectionModal(): void {
    const { width, height } = this.scale;
    this.mapSelectContainer.removeAll(true);
    this.mapSelectContainer.setVisible(true);

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);
    const box = this.add
      .rectangle(width / 2, height / 2, 520, 360, 0x1e293b)
      .setStrokeStyle(3, 0x38b000);

    const title = this.add
      .text(width / 2, height / 2 - 130, 'SELECT BATTLE MAP', {
        fontSize: '24px',
        color: '#ffbe0b',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const maps = [
      {
        id: 'heartwood_clearing',
        name: MAPS_DATA.heartwood_clearing.name,
        desc: 'Single winding lane (Standard Enemies)',
        color: 0x0284c7,
      },
      {
        id: 'moonlit_crossing',
        name: MAPS_DATA.moonlit_crossing.name,
        desc: 'Dual merging tracks + 2-Phase Boss Void Sovereign!',
        color: 0x9333ea,
      },
    ];

    maps.forEach((m, idx) => {
      const cardY = height / 2 - 40 + idx * 95;
      const isSelected = this.selectedMapId === m.id;

      const cardBg = this.add
        .rectangle(width / 2, cardY, 440, 75, isSelected ? m.color : 0x334155)
        .setStrokeStyle(2, isSelected ? 0xffbe0b : 0x475569)
        .setInteractive({ useHandCursor: true });

      const nameTxt = this.add.text(width / 2 - 190, cardY - 18, m.name, {
        fontSize: '18px',
        color: '#ffffff',
        fontStyle: 'bold',
      });

      const descTxt = this.add.text(width / 2 - 190, cardY + 8, m.desc, {
        fontSize: '12px',
        color: '#cbd5e1',
      });

      cardBg.on('pointerdown', () => {
        this.selectedMapId = m.id;
        this.openMapSelectionModal();
      });

      this.mapSelectContainer.add([cardBg, nameTxt, descTxt]);
    });

    const startBtn = this.add
      .rectangle(width / 2, height / 2 + 130, 200, 42, 0xf72585)
      .setInteractive({ useHandCursor: true });
    const startTxt = this.add
      .text(width / 2, height / 2 + 130, 'START DEFENSE RUN ⚔️', {
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    startBtn.on('pointerdown', () => {
      this.mapSelectContainer.setVisible(false);
      this.startDefenseRun();
    });

    this.mapSelectContainer.add([overlay, box, title, startBtn, startTxt]);
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
          `3. EQUIP collars, clear 5 defense waves, and earn EXP to LEVEL UP!\n` +
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

  private setupEquipmentPanel(width: number, height: number): void {
    const panelX = width - 340;
    const panelY = height / 2 + 10;
    const panelW = 300;
    const panelH = 540;

    this.add.rectangle(panelX, panelY, panelW, panelH, 0x0f172a, 0.95).setStrokeStyle(2, 0x334155);

    this.add
      .text(panelX, panelY - panelH / 2 + 30, 'EQUIPMENT & INVENTORY', {
        fontSize: '18px',
        color: '#ffbe0b',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.equipStatusText = this.add.text(panelX - 130, panelY - panelH / 2 + 65, 'Equipped: None', {
      fontSize: '15px',
      color: '#ffffff',
      fontStyle: 'bold',
    });

    this.inventoryContainer = this.add.container(0, 0);
  }

  private renderInventoryList(): void {
    this.inventoryContainer.removeAll(true);

    const width = this.scale.width;
    const height = this.scale.height;
    const panelX = width - 340;
    const startY = height / 2 - 140;

    const legacyProfile = this.getProfileFromOwned(this.activeCreature);
    const equippedItem = EquipmentEngine.getEquippedItem(legacyProfile);
    if (equippedItem) {
      this.equipStatusText.setText(`Equipped: ${equippedItem.name}`);

      const unequipBtn = this.add
        .rectangle(panelX + 90, height / 2 - 195, 80, 26, 0xef4444)
        .setInteractive({ useHandCursor: true });
      const unequipTxt = this.add
        .text(panelX + 90, height / 2 - 195, 'UNEQUIP', {
          fontSize: '11px',
          color: '#ffffff',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);

      unequipBtn.on('pointerdown', () => {
        EquipmentEngine.unequipItem(legacyProfile, this.inventory);
        this.activeCreature.equippedItems.accessory = legacyProfile.equippedItemId;
        this.persistState();
        this.renderInventoryList();
        this.updateCareUI();
      });

      this.inventoryContainer.add([unequipBtn, unequipTxt]);
    } else {
      this.equipStatusText.setText('Equipped: None');
    }

    if (this.inventory.length === 0) {
      const emptyText = this.add
        .text(panelX, startY + 40, 'Inventory Empty\n(Defeat enemies in Defense run)', {
          fontSize: '13px',
          color: '#64748b',
          align: 'center',
        })
        .setOrigin(0.5);
      this.inventoryContainer.add(emptyText);
      return;
    }

    this.inventory.forEach((itemId, idx) => {
      const itemConfig = EQUIPMENT_DATA[itemId];
      if (!itemConfig) return;

      const itemY = startY + idx * 75;

      const itemBg = this.add
        .rectangle(panelX, itemY, 270, 65, 0x1e293b)
        .setStrokeStyle(1, 0x475569);
      const nameTxt = this.add.text(panelX - 120, itemY - 20, itemConfig.name, {
        fontSize: '14px',
        color: '#f8fafc',
        fontStyle: 'bold',
      });
      const descTxt = this.add.text(panelX - 120, itemY + 2, itemConfig.description, {
        fontSize: '11px',
        color: '#94a3b8',
      });
      const equipBtn = this.add
        .rectangle(panelX + 90, itemY, 65, 28, 0x3b82f6)
        .setInteractive({ useHandCursor: true });
      const btnTxt = this.add
        .text(panelX + 90, itemY, 'EQUIP', {
          fontSize: '11px',
          color: '#ffffff',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);

      equipBtn.on('pointerdown', () => {
        EquipmentEngine.equipItem(legacyProfile, this.inventory, itemId);
        this.activeCreature.equippedItems.accessory = legacyProfile.equippedItemId;
        this.persistState();
        this.renderInventoryList();
        this.updateCareUI();
      });

      this.inventoryContainer.add([itemBg, nameTxt, descTxt, equipBtn, btnTxt]);
    });
  }

  update(_time: number, delta: number): void {
    const deltaSeconds = delta / 1000;
    const legacyProfile = this.getProfileFromOwned(this.activeCreature);
    PetCareEngine.updateCareDecay(legacyProfile, deltaSeconds, 0.3);
    this.activeCreature.fullness = 100 - legacyProfile.hunger;
    this.updateCareUI();
  }

  private feedPet(): void {
    const legacyProfile = this.getProfileFromOwned(this.activeCreature);
    PetCareEngine.feedPet(legacyProfile, 25);
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

    this.showFloatingText(this.petSprite.x, this.petSprite.y - 40, '🍖 Hunger -25', '#38b000');
    this.updateCareUI();
  }

  private petCreature(): void {
    const legacyProfile = this.getProfileFromOwned(this.activeCreature);
    PetCareEngine.petCreature(legacyProfile, 10);
    this.activeCreature.affection = legacyProfile.affection;
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

    this.showFloatingText(this.petSprite.x, this.petSprite.y - 40, '❤️ Affection +10', '#f72585');
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
    this.hungerText.setText(`Hunger: ${Math.round(hunger)}/100`);

    this.affectionBar.clear();
    this.affectionBar.fillStyle(0x0f172a, 0.8);
    this.affectionBar.fillRect(xRight, y, barWidth, barHeight);
    this.affectionBar.fillStyle(0xf72585, 1);
    this.affectionBar.fillRect(xRight, y, barWidth * (affection / 100), barHeight);
    this.affectionText.setText(`Affection: ${Math.round(affection)}/100`);

    const careBonus = PetCareEngine.calculateCareBonus(legacyProfile);
    const effectiveStats = EquipmentEngine.getEffectiveStats(legacyProfile);

    const finalDamage = Math.round(effectiveStats.attackDamage * careBonus.damageMultiplier);
    const finalSpeed = (effectiveStats.attackSpeed * careBonus.speedMultiplier).toFixed(2);
    const finalHp = Math.round(effectiveStats.maxHp * careBonus.hpMultiplier);

    this.buffBadgeText.setText(
      `Combat Stats: Atk ${finalDamage} | Spd ${finalSpeed}/s | HP ${finalHp}`,
    );

    this.evolveBtnContainer.setVisible(CreatureEngine.canEvolve(this.activeCreature));
    this.coinsText.setText(`Coins: ${this.totalCoins}`);
  }

  private startDefenseRun(): void {
    soundEngine.playAttackSound();
    const legacyProfile = this.getProfileFromOwned(this.activeCreature);
    const careBonus = PetCareEngine.calculateCareBonus(legacyProfile);
    const effectiveStats = EquipmentEngine.getEffectiveStats(legacyProfile);

    const modifiedStats = {
      ...effectiveStats,
      attackDamage: effectiveStats.attackDamage * careBonus.damageMultiplier,
      attackSpeed: effectiveStats.attackSpeed * careBonus.speedMultiplier,
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
      .rectangle(0, 0, 130, 44, bgColor, 1)
      .setInteractive({ useHandCursor: true });
    const txt = this.add
      .text(0, 0, label, {
        fontSize: '12px',
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
