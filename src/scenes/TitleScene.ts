import Phaser from 'phaser';
import { GamePhase } from '../types/phase';
import { phaseManager } from '../core/state/PhaseManager';
import { settingsEngine } from '../core/settings/SettingsEngine';
import { soundEngine } from '../core/audio/SoundEngine';

export class TitleScene extends Phaser.Scene {
  private settingsModalContainer!: Phaser.GameObjects.Container;
  private guideModalContainer!: Phaser.GameObjects.Container;
  private creditsModalContainer!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'TitleScene' });
  }

  create(): void {
    phaseManager.setPhase(GamePhase.PREPARATION);
    const { width, height } = this.scale;

    // Deep slate background
    this.add.rectangle(width / 2, height / 2, width, height, 0x0f172a);

    // Decorative background path ring
    const gfx = this.add.graphics();
    gfx.lineStyle(4, 0x1e293b, 0.8);
    gfx.strokeCircle(width / 2, height / 2 - 30, 220);
    gfx.lineStyle(2, 0x334155, 0.5);
    gfx.strokeCircle(width / 2, height / 2 - 30, 320);

    // Main Title Text
    const titleText = this.add
      .text(width / 2, height / 2 - 140, 'ROGUELITE PETS', {
        fontSize: '48px',
        color: '#f72585',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    // Subtitle Text
    this.add
      .text(width / 2, height / 2 - 80, '🐾 A 2D Digital-Pet Roguelite Tower Defense', {
        fontSize: '18px',
        color: '#ffbe0b',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Pulsing animation for title (unless reduced motion is enabled)
    if (!settingsEngine.isReducedMotionEnabled()) {
      this.tweens.add({
        targets: titleText,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // Main Action Buttons
    this.createButton(width / 2, height / 2 + 20, 'PLAY GAME ⚔️', 0xf72585, () => {
      soundEngine.playAttackSound();
      this.scene.start('HabitatScene');
    });

    this.createButton(width / 2, height / 2 + 85, 'SETTINGS & ACCESSIBILITY ⚙️', 0x0284c7, () => {
      soundEngine.playCoinSound();
      this.openSettingsModal();
    });

    this.createButton(width / 2, height / 2 + 150, 'HOW TO PLAY 📖', 0x38b000, () => {
      soundEngine.playCoinSound();
      this.openGuideModal();
    });

    this.createButton(width / 2, height / 2 + 215, 'CREDITS 🏆', 0x475569, () => {
      soundEngine.playCoinSound();
      this.openCreditsModal();
    });

    // Version Tag
    this.add
      .text(width - 20, height - 20, 'v0.14.0 Alpha', {
        fontSize: '12px',
        color: '#64748b',
      })
      .setOrigin(1.0, 1.0);

    // Keyboard accessibility listener
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (event.code === 'Enter' || event.code === 'Space') {
        soundEngine.playAttackSound();
        this.scene.start('HabitatScene');
      } else if (event.code === 'KeyS') {
        this.openSettingsModal();
      }
    });

    // Modal Containers
    this.settingsModalContainer = this.add.container(0, 0).setDepth(100).setVisible(false);
    this.guideModalContainer = this.add.container(0, 0).setDepth(200).setVisible(false);
    this.creditsModalContainer = this.add.container(0, 0).setDepth(300).setVisible(false);
  }

  private createButton(
    x: number,
    y: number,
    label: string,
    colorHex: number,
    onClick: () => void,
  ): void {
    const bg = this.add
      .rectangle(x, y, 280, 48, colorHex)
      .setStrokeStyle(2, 0xffffff, 0.4)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(x, y, label, {
        fontSize: '15px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    bg.on('pointerdown', onClick);
  }

  private openSettingsModal(): void {
    const { width, height } = this.scale;
    this.settingsModalContainer.removeAll(true);
    this.settingsModalContainer.setVisible(true);

    const currentSettings = settingsEngine.getSettings();

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);
    const box = this.add
      .rectangle(width / 2, height / 2, 500, 380, 0x1e293b)
      .setStrokeStyle(3, 0x0284c7);

    const title = this.add
      .text(width / 2, height / 2 - 145, 'SETTINGS & ACCESSIBILITY ⚙️', {
        fontSize: '22px',
        color: '#ffbe0b',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // 1. Audio Mute Toggle
    const muteLabel = this.add.text(width / 2 - 190, height / 2 - 80, 'Audio Mute:', {
      fontSize: '16px',
      color: '#ffffff',
    });
    const muteBtn = this.add
      .rectangle(
        width / 2 + 100,
        height / 2 - 70,
        140,
        36,
        currentSettings.isMuted ? 0xef4444 : 0x16a34a,
      )
      .setInteractive({ useHandCursor: true });
    const muteTxt = this.add
      .text(width / 2 + 100, height / 2 - 70, currentSettings.isMuted ? 'MUTED 🔇' : 'UNMUTED 🔊', {
        fontSize: '13px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    muteBtn.on('pointerdown', () => {
      const isMuted = soundEngine.toggleMute();
      settingsEngine.updateSettings({ isMuted });
      this.openSettingsModal();
    });

    // 2. Master Volume Controls
    const volLabel = this.add.text(
      width / 2 - 190,
      height / 2 - 20,
      `Master Volume: Math.round(${currentSettings.masterVolume * 100})%`,
      { fontSize: '16px', color: '#ffffff' },
    );

    const volDownBtn = this.add
      .rectangle(width / 2 + 50, height / 2 - 10, 44, 32, 0x334155)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(width / 2 + 50, height / 2 - 10, '-', {
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const volUpBtn = this.add
      .rectangle(width / 2 + 130, height / 2 - 10, 44, 32, 0x334155)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(width / 2 + 130, height / 2 - 10, '+', {
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    volDownBtn.on('pointerdown', () => {
      const newVol = Math.max(0, currentSettings.masterVolume - 0.1);
      soundEngine.setVolume(newVol);
      settingsEngine.updateSettings({ masterVolume: newVol });
      this.openSettingsModal();
    });

    volUpBtn.on('pointerdown', () => {
      const newVol = Math.min(1.0, currentSettings.masterVolume + 0.1);
      soundEngine.setVolume(newVol);
      settingsEngine.updateSettings({ masterVolume: newVol });
      this.openSettingsModal();
    });

    // 3. Screen Shake Toggle
    this.add.text(width / 2 - 190, height / 2 + 40, 'Screen Shake Effects:', {
      fontSize: '16px',
      color: '#ffffff',
    });
    const shakeBtn = this.add
      .rectangle(
        width / 2 + 100,
        height / 2 + 50,
        140,
        36,
        currentSettings.screenShakeEnabled ? 0x16a34a : 0x475569,
      )
      .setInteractive({ useHandCursor: true });
    const shakeTxt = this.add
      .text(
        width / 2 + 100,
        height / 2 + 50,
        currentSettings.screenShakeEnabled ? 'ENABLED 📳' : 'DISABLED 🛑',
        {
          fontSize: '13px',
          color: '#ffffff',
          fontStyle: 'bold',
        },
      )
      .setOrigin(0.5);

    shakeBtn.on('pointerdown', () => {
      settingsEngine.updateSettings({
        screenShakeEnabled: !currentSettings.screenShakeEnabled,
      });
      this.openSettingsModal();
    });

    // 4. Reduced Motion Toggle
    this.add.text(width / 2 - 190, height / 2 + 100, 'Reduced Motion Mode:', {
      fontSize: '16px',
      color: '#ffffff',
    });
    const motionBtn = this.add
      .rectangle(
        width / 2 + 100,
        height / 2 + 110,
        140,
        36,
        currentSettings.reducedMotionEnabled ? 0x9333ea : 0x475569,
      )
      .setInteractive({ useHandCursor: true });
    const motionTxt = this.add
      .text(
        width / 2 + 100,
        height / 2 + 110,
        currentSettings.reducedMotionEnabled ? 'ACTIVE ♿' : 'OFF',
        {
          fontSize: '13px',
          color: '#ffffff',
          fontStyle: 'bold',
        },
      )
      .setOrigin(0.5);

    motionBtn.on('pointerdown', () => {
      settingsEngine.updateSettings({
        reducedMotionEnabled: !currentSettings.reducedMotionEnabled,
      });
      this.openSettingsModal();
    });

    // Close Button
    const closeBtn = this.add
      .rectangle(width / 2, height / 2 + 160, 140, 36, 0x475569)
      .setInteractive({ useHandCursor: true });
    const closeTxt = this.add
      .text(width / 2, height / 2 + 160, 'CLOSE', {
        fontSize: '13px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    closeBtn.on('pointerdown', () => this.settingsModalContainer.setVisible(false));

    this.settingsModalContainer.add([
      overlay,
      box,
      title,
      muteLabel,
      muteBtn,
      muteTxt,
      volLabel,
      volDownBtn,
      volUpBtn,
      shakeBtn,
      shakeTxt,
      motionBtn,
      motionTxt,
      closeBtn,
      closeTxt,
    ]);
  }

  private openGuideModal(): void {
    const { width, height } = this.scale;
    this.guideModalContainer.removeAll(true);
    this.guideModalContainer.setVisible(true);

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);
    const box = this.add
      .rectangle(width / 2, height / 2, 520, 380, 0x1e293b)
      .setStrokeStyle(3, 0x38b000);

    const title = this.add
      .text(width / 2, height / 2 - 145, 'HOW TO PLAY 📖', {
        fontSize: '22px',
        color: '#ffbe0b',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const text = this.add
      .text(
        width / 2,
        height / 2 - 10,
        `• CARE & FEEDING: Feed kibble/treats & pet your creature in Habitat.\n` +
          `  High Fullness & Affection grant combat damage & speed multipliers!\n\n` +
          `• DEFENSE WAVE COMBAT: Your creature automatically orbits the tower,\n` +
          `  attacking oncoming enemies. Protect the Nexus Core from destruction!\n\n` +
          `• ROGUELITE BUILDS: Draft powerful traits after clearing each wave.\n` +
          `  Combine 20 traits across 5 families (Ferocity, Swiftness, etc).\n\n` +
          `• EQUIPMENT & EVOLUTION: Defeat enemies for coin loot & equipment drops.\n` +
          `  Reach Level 5 to Evolve your pet into Stage 2!`,
        {
          fontSize: '13px',
          color: '#cbd5e1',
          lineSpacing: 6,
          align: 'left',
          wordWrap: { width: 460 },
        },
      )
      .setOrigin(0.5);

    const closeBtn = this.add
      .rectangle(width / 2, height / 2 + 150, 140, 36, 0x475569)
      .setInteractive({ useHandCursor: true });
    const closeTxt = this.add
      .text(width / 2, height / 2 + 150, 'GOT IT', {
        fontSize: '13px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    closeBtn.on('pointerdown', () => this.guideModalContainer.setVisible(false));
    this.guideModalContainer.add([overlay, box, title, text, closeBtn, closeTxt]);
  }

  private openCreditsModal(): void {
    const { width, height } = this.scale;
    this.creditsModalContainer.removeAll(true);
    this.creditsModalContainer.setVisible(true);

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);
    const box = this.add
      .rectangle(width / 2, height / 2, 450, 320, 0x1e293b)
      .setStrokeStyle(3, 0xf72585);

    const title = this.add
      .text(width / 2, height / 2 - 120, 'ROGUELITE PETS CREDITS 🏆', {
        fontSize: '20px',
        color: '#ffbe0b',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const text = this.add
      .text(
        width / 2,
        height / 2 - 10,
        `Framework: Phaser 3 + Vite + TypeScript\n` +
          `Audio: Web Audio API Procedural Synthesizer\n` +
          `Testing: Vitest (61 Unit Test Suite)\n\n` +
          `Developed by fantasycorex\n` +
          `GitHub Repository: fantasycorex/Roguelite-pets`,
        {
          fontSize: '14px',
          color: '#cbd5e1',
          lineSpacing: 8,
          align: 'center',
        },
      )
      .setOrigin(0.5);

    const closeBtn = this.add
      .rectangle(width / 2, height / 2 + 120, 140, 36, 0x475569)
      .setInteractive({ useHandCursor: true });
    const closeTxt = this.add
      .text(width / 2, height / 2 + 120, 'CLOSE', {
        fontSize: '13px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    closeBtn.on('pointerdown', () => this.creditsModalContainer.setVisible(false));
    this.creditsModalContainer.add([overlay, box, title, text, closeBtn, closeTxt]);
  }
}
