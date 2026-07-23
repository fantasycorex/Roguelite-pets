import Phaser from 'phaser';
import { TextureGenerator } from '../graphics/TextureGenerator';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  create(): void {
    // Generate placeholder textures dynamically
    TextureGenerator.generatePlaceholders(this);

    // Transition to Title Scene
    this.scene.start('TitleScene');
  }
}
