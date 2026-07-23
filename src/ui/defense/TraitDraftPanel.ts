import Phaser from 'phaser';
import { TraitConfig } from '../../types/trait';
import { soundEngine } from '../../core/audio/SoundEngine';

export class TraitDraftPanel {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0).setDepth(100).setVisible(false);
  }

  public render(
    offers: TraitConfig[],
    rerollsRemaining: number,
    onSelect: (trait: TraitConfig) => void,
    onReroll: () => TraitConfig[] | null,
  ): void {
    const { width, height } = this.scene.scale;
    this.container.removeAll(true);
    this.container.setVisible(true);

    const overlay = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.75);
    const modalTitle = this.scene.add
      .text(width / 2, 90, 'CHOOSE A TRAIT UPGRADE (Keys: 1, 2, 3)', {
        fontSize: '24px',
        color: '#ffbe0b',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const canReroll = rerollsRemaining > 0;
    const rerollBtn = this.scene.add
      .rectangle(width / 2, 135, 180, 34, canReroll ? 0x0284c7 : 0x475569)
      .setInteractive({ useHandCursor: canReroll });

    const rerollTxt = this.scene.add
      .text(width / 2, 135, `🎲 REROLL (Key R) [${rerollsRemaining}]`, {
        fontSize: '12px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    rerollBtn.on('pointerdown', () => {
      const newOffers = onReroll();
      if (newOffers) {
        soundEngine.playCoinSound();
        this.render(newOffers, rerollsRemaining - 1, onSelect, onReroll);
      }
    });

    this.container.add([overlay, modalTitle, rerollBtn, rerollTxt]);

    const cardWidth = 220;
    const cardHeight = 260;
    const spacing = 40;
    const startX = width / 2 - (cardWidth * 3 + spacing * 2) / 2 + cardWidth / 2;

    offers.forEach((trait, i) => {
      const cardX = startX + i * (cardWidth + spacing);
      const cardY = height / 2 + 30;

      const cardBg = this.scene.add
        .rectangle(cardX, cardY, cardWidth, cardHeight, 0x1e293b, 0.95)
        .setStrokeStyle(
          3,
          trait.rarity === 'epic' ? 0xf72585 : trait.rarity === 'rare' ? 0x4cc9f0 : 0x80ed99,
        )
        .setInteractive({ useHandCursor: true });

      const title = this.scene.add
        .text(cardX, cardY - 80, `[${i + 1}] ${trait.name}`, {
          fontSize: '17px',
          color: '#ffffff',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);

      const familyBadge = this.scene.add
        .text(cardX, cardY - 50, `${trait.family.toUpperCase()} • ${trait.rarity.toUpperCase()}`, {
          fontSize: '11px',
          color:
            trait.rarity === 'epic' ? '#f72585' : trait.rarity === 'rare' ? '#4cc9f0' : '#80ed99',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);

      const desc = this.scene.add
        .text(cardX, cardY, trait.description, {
          fontSize: '13px',
          color: '#cbd5e1',
          align: 'center',
          wordWrap: { width: cardWidth - 30 },
        })
        .setOrigin(0.5);

      const selectBtn = this.scene.add
        .rectangle(cardX, cardY + 80, 140, 36, 0x3b82f6)
        .setInteractive({ useHandCursor: true });

      const btnTxt = this.scene.add
        .text(cardX, cardY + 80, `SELECT [${i + 1}]`, {
          fontSize: '14px',
          color: '#ffffff',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);

      this.container.add([cardBg, title, familyBadge, desc, selectBtn, btnTxt]);

      const handleSelect = () => {
        soundEngine.playCoinSound();
        this.container.setVisible(false);
        onSelect(trait);
      };

      cardBg.on('pointerdown', handleSelect);
      selectBtn.on('pointerdown', handleSelect);
    });
  }

  public hide(): void {
    this.container.setVisible(false);
  }

  public isVisible(): boolean {
    return this.container.visible;
  }
}
