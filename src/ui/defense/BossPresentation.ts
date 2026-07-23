import Phaser from 'phaser';
import { soundEngine } from '../../core/audio/SoundEngine';
import { settingsEngine } from '../../core/settings/SettingsEngine';

export class BossPresentation {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public presentPhase2(bossName: string, bannerText: Phaser.GameObjects.Text): void {
    soundEngine.playHitSound();
    if (settingsEngine.isScreenShakeEnabled()) {
      this.scene.cameras.main.shake(300, 0.015);
    }
    bannerText.setText(`⚡ ${bossName.toUpperCase()} ENRAGED! (PHASE 2)`);
    bannerText.setColor('#f72585');
    this.scene.time.delayedCall(2000, () => bannerText.setText(''));
  }

  public presentTelegraph(x: number, y: number, radius: number, warningTimeMs: number): void {
    soundEngine.playHitSound();
    const ring = this.scene.add.graphics();
    ring.lineStyle(3, 0xff0054, 0.9);
    ring.strokeCircle(x, y, radius);

    this.scene.tweens.add({
      targets: ring,
      alpha: 0,
      duration: warningTimeMs,
      onComplete: () => ring.destroy(),
    });
  }
}
