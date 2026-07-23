import Phaser from 'phaser';
import { GamePhase } from '../types/phase';
import { phaseManager } from '../core/state/PhaseManager';
import { eventBus } from '../core/events/EventBus';
import { PetCareEngine } from '../core/pet/PetCareEngine';
import { PermanentCreatureProfile } from '../types/creature';
import { EquipmentEngine } from '../core/equipment/EquipmentEngine';
import { EQUIPMENT_DATA } from '../data/equipment.data';
import { SaveManager } from '../core/save/SaveManager';
import { soundEngine } from '../core/audio/SoundEngine';

export class HabitatScene extends Phaser.Scene {
  private profile!: PermanentCreatureProfile;
  private inventory: string[] = [];
  private totalCoins: number = 0;
  private tutorialCompleted: boolean = false;

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

  constructor() {
    super({ key: 'HabitatScene' });
  }

  init(): void {
    this.refreshFromSaveData();
  }

  private refreshFromSaveData(): void {
    const saveData = SaveManager.loadGame();
    this.profile = saveData.creatureProfile;
    this.inventory = saveData.inventory;
    this.totalCoins = saveData.totalCoins;
    this.tutorialCompleted = saveData.tutorialCompleted;
  }

  private persistState(): void {
    SaveManager.updateSaveData({
      creatureProfile: this.profile,
      inventory: this.inventory,
      totalCoins: this.totalCoins,
      tutorialCompleted: this.tutorialCompleted,
    });
  }

  create(): void {
    phaseManager.setPhase(GamePhase.HABITAT);
    this.refreshFromSaveData();
    const { width, height } = this.scale;

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x1d2d44);

    // Header Title & Coins
    this.add
      .text(width / 2, 40, 'PET HABITAT', {
        fontSize: '32px',
        color: '#f72585',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.coinsText = this.add.text(width - 160, 35, `Coins: ${this.totalCoins}`, {
      fontSize: '18px',
      color: '#ffbe0b',
      fontStyle: 'bold',
    });

    // Mute/Unmute Audio Toggle Button
    const audioBtn = this.add
      .rectangle(260, 40, 130, 36, 0x334155)
      .setInteractive({ useHandCursor: true });
    this.audioToggleText = this.add
      .text(260, 40, soundEngine.isMuted() ? '🔇 Audio: OFF' : '🔊 Audio: ON', {
        fontSize: '12px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    audioBtn.on('pointerdown', () => {
      const isMuted = soundEngine.toggleMute();
      this.audioToggleText.setText(isMuted ? '🔇 Audio: OFF' : '🔊 Audio: ON');
    });

    // Pet Sprite & Interactive Zone
    this.petSprite = this.add.sprite(width / 2 - 120, height / 2 - 20, 'pet_texture').setScale(2.5);
    this.petSprite.setInteractive({ useHandCursor: true });
    this.petSprite.on('pointerdown', () => this.petCreature());

    // Bounce Animation
    this.tweens.add({
      targets: this.petSprite,
      y: height / 2 - 35,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Care Status Bars
    this.hungerBar = this.add.graphics();
    this.affectionBar = this.add.graphics();

    this.hungerText = this.add.text(width / 2 - 340, height / 2 + 55, '', {
      fontSize: '15px',
      color: '#4cc9f0',
      fontStyle: 'bold',
    });

    this.affectionText = this.add.text(width / 2 - 120, height / 2 + 55, '', {
      fontSize: '15px',
      color: '#f72585',
      fontStyle: 'bold',
    });

    // Care Buff Badge
    this.buffBadgeText = this.add
      .text(width / 2 - 230, height / 2 + 130, '', {
        fontSize: '15px',
        color: '#80ed99',
        fontStyle: 'bold',
        backgroundColor: '#0f172a',
        padding: { x: 10, y: 6 },
      })
      .setOrigin(0.5);

    // Interactive Care Buttons
    this.createButton(width / 2 - 320, height - 70, 'FEED 🍖', 0x38b000, () => this.feedPet());
    this.createButton(width / 2 - 160, height - 70, 'PET ❤️', 0x7209b7, () => this.petCreature());
    this.createButton(width / 2, height - 70, 'DEFENSE ⚔️', 0xf72585, () => this.startDefenseRun());

    // Dev Controls Toggle Button
    const devBtn = this.add
      .rectangle(100, 40, 140, 36, 0x334155)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(100, 40, '🛠️ DEV TOOLS', {
        fontSize: '13px',
        color: '#cbd5e1',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    devBtn.on('pointerdown', () => this.toggleDevControlsModal());

    // Containers for Modals
    this.devModalContainer = this.add.container(0, 0).setDepth(300).setVisible(false);
    this.tutorialContainer = this.add.container(0, 0).setDepth(400).setVisible(false);

    // Setup Equipment Panel
    this.setupEquipmentPanel(width, height);

    this.updateCareUI();
    this.renderInventoryList();

    // Check tutorial status explicitly from save
    if (!this.tutorialCompleted) {
      this.showTutorialModal();
    }
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
        `1. FEED & PET your creature to keep Hunger low & Affection high.\n` +
          `2. HIGH CARE grants Combat Buffs (+15% Damage, +15% Speed)!\n` +
          `3. EQUIP collars to boost stats, then start DEFENSE RUN!\n` +
          `4. Clear 5 enemy waves and draft temporary Traits after each wave!`,
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
        label: 'MAX CARE (100/100)',
        color: 0x16a34a,
        onClick: () => {
          this.profile.hunger = 100;
          this.profile.affection = 100;
          this.persistState();
          this.updateCareUI();
        },
      },
      {
        label: 'GIVE SPIKED COLLAR',
        color: 0x9333ea,
        onClick: () => {
          this.inventory.push('spiked_collar');
          this.persistState();
          this.renderInventoryList();
        },
      },
      {
        label: 'RESET SAVE DATA',
        color: 0xd97706,
        onClick: () => {
          const fresh = SaveManager.resetSave();
          this.profile = fresh.creatureProfile;
          this.inventory = fresh.inventory;
          this.totalCoins = fresh.totalCoins;
          this.tutorialCompleted = fresh.tutorialCompleted;
          this.renderInventoryList();
          this.updateCareUI();
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

    const equippedItem = EquipmentEngine.getEquippedItem(this.profile);
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
        EquipmentEngine.unequipItem(this.profile, this.inventory);
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
        EquipmentEngine.equipItem(this.profile, this.inventory, itemId);
        this.persistState();
        this.renderInventoryList();
        this.updateCareUI();
      });

      this.inventoryContainer.add([itemBg, nameTxt, descTxt, equipBtn, btnTxt]);
    });
  }

  update(_time: number, delta: number): void {
    const deltaSeconds = delta / 1000;
    PetCareEngine.updateCareDecay(this.profile, deltaSeconds, 0.3);
    this.updateCareUI();
  }

  private feedPet(): void {
    PetCareEngine.feedPet(this.profile, 25);
    this.persistState();
    soundEngine.playFeedSound();
    eventBus.emit('PET_FED', { hunger: this.profile.hunger });

    this.tweens.add({
      targets: this.petSprite,
      scaleX: 3.0,
      scaleY: 1.8,
      duration: 120,
      yoyo: true,
      ease: 'Quad.easeOut',
    });

    this.showFloatingText(this.petSprite.x, this.petSprite.y - 40, '🍖 Hunger +25', '#38b000');
    this.updateCareUI();
  }

  private petCreature(): void {
    PetCareEngine.petCreature(this.profile, 10);
    this.persistState();
    soundEngine.playPetSound();
    eventBus.emit('PET_PETTED', { affection: this.profile.affection });

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
    const { hunger, affection } = this.profile;
    const barWidth = 160;
    const barHeight = 14;
    const xLeft = this.scale.width / 2 - 340;
    const xRight = this.scale.width / 2 - 120;
    const y = this.scale.height / 2 + 80;

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

    const careBonus = PetCareEngine.calculateCareBonus(this.profile);
    const effectiveStats = EquipmentEngine.getEffectiveStats(this.profile);

    const finalDamage = Math.round(effectiveStats.attackDamage * careBonus.damageMultiplier);
    const finalSpeed = (effectiveStats.attackSpeed * careBonus.speedMultiplier).toFixed(2);
    const finalHp = Math.round(effectiveStats.maxHp * careBonus.hpMultiplier);

    this.buffBadgeText.setText(
      `Combat Stats: Atk ${finalDamage} | Spd ${finalSpeed}/s | HP ${finalHp}`,
    );

    this.coinsText.setText(`Coins: ${this.totalCoins}`);
  }

  private startDefenseRun(): void {
    soundEngine.playAttackSound();
    const careBonus = PetCareEngine.calculateCareBonus(this.profile);
    const effectiveStats = EquipmentEngine.getEffectiveStats(this.profile);

    const modifiedStats = {
      ...effectiveStats,
      attackDamage: effectiveStats.attackDamage * careBonus.damageMultiplier,
      attackSpeed: effectiveStats.attackSpeed * careBonus.speedMultiplier,
      maxHp: effectiveStats.maxHp * careBonus.hpMultiplier,
    };

    this.scene.start('DefenseScene', { petStats: modifiedStats });
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
