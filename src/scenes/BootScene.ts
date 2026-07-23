import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Immediate setup if any base assets needed
  }

  create(): void {
    this.scene.start('PreloadScene');
  }
}
