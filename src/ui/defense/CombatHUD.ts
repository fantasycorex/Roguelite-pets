import Phaser from 'phaser';
import { BattleRunState } from '../../core/state/BattleRunState';
import { TRAITS_DATA } from '../../data/traits.data';

export class CombatHUD {
  private scene: Phaser.Scene;
  public getScene(): Phaser.Scene {
    return this.scene;
  }
  public waveText!: Phaser.GameObjects.Text;
  public coinsText!: Phaser.GameObjects.Text;
  public towerHpText!: Phaser.GameObjects.Text;
  public petHpText!: Phaser.GameObjects.Text;
  public bannerText!: Phaser.GameObjects.Text;
  public buildHudText!: Phaser.GameObjects.Text;
  public speedBtnText!: Phaser.GameObjects.Text;
  public pauseBtnText!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const { width, height } = scene.scale;

    this.waveText = scene.add
      .text(width / 2, 25, '', {
        fontSize: '18px',
        color: '#f72585',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.coinsText = scene.add.text(width - 160, 25, 'Coins: 0', {
      fontSize: '18px',
      color: '#ffbe0b',
      fontStyle: 'bold',
    });

    this.towerHpText = scene.add
      .text(width / 2 - 120, height / 2 - 65, '', {
        fontSize: '14px',
        color: '#80ed99',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.petHpText = scene.add
      .text(width / 2 + 120, height / 2 - 65, '', {
        fontSize: '14px',
        color: '#4cc9f0',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.bannerText = scene.add
      .text(width / 2, height / 2 - 140, '', {
        fontSize: '30px',
        color: '#ffbe0b',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    scene.add.rectangle(140, height - 40, 260, 50, 0x0f172a, 0.9).setStrokeStyle(1, 0x334155);
    this.buildHudText = scene.add.text(20, height - 58, 'Build: None', {
      fontSize: '12px',
      color: '#80ed99',
      fontStyle: 'bold',
    });
  }

  public update(runState: BattleRunState): void {
    this.coinsText.setText(`Coins: ${runState.coinsCollected}`);
    this.towerHpText.setText(`Tower HP: ${runState.towerHp}/${runState.maxTowerHp}`);

    if (runState.isCreatureDowned) {
      this.petHpText.setText('Pet HP: DOWNED (Reviving...)');
      this.petHpText.setColor('#ff0054');
    } else {
      this.petHpText.setText(
        `Pet HP: ${Math.round(runState.creatureCurrentHp)}/${runState.creatureMaxHp}`,
      );
      this.petHpText.setColor('#4cc9f0');
    }

    if (runState.activeTraits.length === 0) {
      this.buildHudText.setText('Build: None');
    } else {
      const traitNames = runState.activeTraits.map((id) => TRAITS_DATA[id]?.name || id).slice(-3);
      this.buildHudText.setText(
        `Build (${runState.activeTraits.length}): ${traitNames.join(', ')}`,
      );
    }
  }
}
