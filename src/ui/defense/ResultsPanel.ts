import Phaser from 'phaser';
import { BattleRunState } from '../../core/state/BattleRunState';

export class ResultsPanel {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0).setDepth(200).setVisible(false);
  }

  public open(runState: BattleRunState, isVictory: boolean, onReturn: () => void): void {
    const { width, height } = this.scene.scale;
    this.container.removeAll(true);
    this.container.setVisible(true);

    const overlay = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);
    const box = this.scene.add
      .rectangle(width / 2, height / 2, 450, 360, 0x1e293b)
      .setStrokeStyle(3, isVictory ? 0x80ed99 : 0xff0054);

    const title = this.scene.add
      .text(width / 2, height / 2 - 130, isVictory ? 'DEFENSE VICTORY! 🏆' : 'RUN DEFEATED 💀', {
        fontSize: '28px',
        color: isVictory ? '#80ed99' : '#ff0054',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const summaryText = this.scene.add
      .text(
        width / 2,
        height / 2 - 20,
        `Map: ${runState.mapConfig.name}\n` +
          `Waves Cleared: ${runState.currentWave} / ${runState.totalWaves}\n\n` +
          `Coins Earned: +${runState.coinsCollected}g\n` +
          `EXP Earned: +${runState.expEarned} exp\n` +
          `Equipment Looted: ${runState.droppedEquipment.length} items`,
        {
          fontSize: '18px',
          color: '#f8fafc',
          align: 'center',
          lineSpacing: 8,
        },
      )
      .setOrigin(0.5);

    const contBtn = this.scene.add
      .rectangle(width / 2, height / 2 + 120, 220, 48, 0x3b82f6)
      .setInteractive({ useHandCursor: true });

    const contTxt = this.scene.add
      .text(width / 2, height / 2 + 120, 'RETURN TO HABITAT', {
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    contBtn.on('pointerdown', onReturn);
    this.container.add([overlay, box, title, summaryText, contBtn, contTxt]);
  }
}
