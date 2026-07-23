import Phaser from 'phaser';
import { OwnedCreature } from '../../types/creature';
import { CareService } from '../../core/services/CareService';

export class CarePanel {
  private scene: Phaser.Scene;
  private hungerBar: Phaser.GameObjects.Graphics;
  private affectionBar: Phaser.GameObjects.Graphics;
  private hungerText: Phaser.GameObjects.Text;
  private affectionText: Phaser.GameObjects.Text;
  private moodText: Phaser.GameObjects.Text;
  private buffBadgeText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const { width, height } = scene.scale;

    this.hungerBar = scene.add.graphics();
    this.affectionBar = scene.add.graphics();

    this.hungerText = scene.add.text(width / 2 - 340, height / 2 + 85, '', {
      fontSize: '14px',
      color: '#4cc9f0',
      fontStyle: 'bold',
    });

    this.affectionText = scene.add.text(width / 2 - 120, height / 2 + 85, '', {
      fontSize: '14px',
      color: '#f72585',
      fontStyle: 'bold',
    });

    this.moodText = scene.add
      .text(width / 2 - 120, height / 2 + 55, '', {
        fontSize: '12px',
        color: '#80ed99',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.buffBadgeText = scene.add
      .text(width / 2 - 230, height / 2 + 140, '', {
        fontSize: '14px',
        color: '#80ed99',
        fontStyle: 'bold',
        backgroundColor: '#0f172a',
        padding: { x: 10, y: 6 },
      })
      .setOrigin(0.5);
  }

  public update(creature: OwnedCreature, mood: string): void {
    const { fullness, affection } = creature;
    const barWidth = 160;
    const barHeight = 14;
    const xLeft = this.scene.scale.width / 2 - 340;
    const xRight = this.scene.scale.width / 2 - 120;
    const y = this.scene.scale.height / 2 + 100;

    this.hungerBar.clear();
    this.hungerBar.fillStyle(0x0f172a, 0.8);
    this.hungerBar.fillRect(xLeft, y, barWidth, barHeight);
    this.hungerBar.fillStyle(fullness > 30 ? 0x38b000 : 0xff0054, 1);
    this.hungerBar.fillRect(xLeft, y, barWidth * (fullness / 100), barHeight);
    this.hungerText.setText(`Fullness: ${Math.round(fullness)}/100`);

    this.affectionBar.clear();
    this.affectionBar.fillStyle(0x0f172a, 0.8);
    this.affectionBar.fillRect(xRight, y, barWidth, barHeight);
    this.affectionBar.fillStyle(0xf72585, 1);
    this.affectionBar.fillRect(xRight, y, barWidth * (affection / 100), barHeight);
    this.affectionText.setText(`Affection: ${Math.round(affection)}/100`);

    this.moodText.setText(`Mood: ${mood}`);

    const careBonus = CareService.getCareBonus(creature);
    this.buffBadgeText.setText(
      `Combat Multipliers: Atk x${careBonus.damageMultiplier.toFixed(2)} | Spd x${careBonus.speedMultiplier.toFixed(2)}`,
    );
  }
}
