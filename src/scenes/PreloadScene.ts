import Phaser from 'phaser';
import { TextureGenerator } from '../graphics/TextureGenerator';
import { ContentValidationService } from '../core/validation/ContentValidationService';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  create(): void {
    // 1. Run startup content validation check
    const report = ContentValidationService.validateAllContent();
    if (!report.isValid) {
      console.error('Content Validation Errors:', report.errors);
    } else {
      console.log('Content Validation Passed: All species, waves, traits & maps verified.');
    }

    // 2. Generate placeholder textures dynamically
    TextureGenerator.generatePlaceholders(this);

    // 3. Transition to Title Scene
    this.scene.start('TitleScene');
  }
}
