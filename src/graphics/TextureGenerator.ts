import Phaser from 'phaser';

export class TextureGenerator {
  public static generatePlaceholders(scene: Phaser.Scene): void {
    // 1. Pet Texture (Cute Blue Slime / Creature)
    if (!scene.textures.exists('pet_texture')) {
      const canvas = scene.textures.createCanvas('pet_texture', 64, 64);
      if (canvas) {
        const ctx = canvas.getContext();
        ctx.fillStyle = '#3a86ff';
        ctx.beginPath();
        ctx.arc(32, 36, 24, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(24, 30, 6, 0, Math.PI * 2);
        ctx.arc(40, 30, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(25, 30, 3, 0, Math.PI * 2);
        ctx.arc(41, 30, 3, 0, Math.PI * 2);
        ctx.fill();

        // Cheeks
        ctx.fillStyle = 'rgba(255, 0, 110, 0.4)';
        ctx.beginPath();
        ctx.arc(18, 38, 4, 0, Math.PI * 2);
        ctx.arc(46, 38, 4, 0, Math.PI * 2);
        ctx.fill();

        canvas.refresh();
      }
    }

    // 2. Tower Texture (Central Nexus Structure)
    if (!scene.textures.exists('tower_texture')) {
      const canvas = scene.textures.createCanvas('tower_texture', 96, 96);
      if (canvas) {
        const ctx = canvas.getContext();
        // Base
        ctx.fillStyle = '#4a4e69';
        ctx.fillRect(16, 48, 64, 40);

        // Tower Body
        ctx.fillStyle = '#9a8c98';
        ctx.fillRect(28, 20, 40, 60);

        // Core Crystal
        ctx.fillStyle = '#80ed99';
        ctx.beginPath();
        ctx.moveTo(48, 10);
        ctx.lineTo(60, 30);
        ctx.lineTo(48, 45);
        ctx.lineTo(36, 30);
        ctx.closePath();
        ctx.fill();

        canvas.refresh();
      }
    }

    // 3. Enemy Textures (Basic Creep, Fast Crawler, Heavy Tank)
    const enemies = [
      { key: 'enemy_basic', color: '#ff0054', size: 32 },
      { key: 'enemy_fast', color: '#ffbd00', size: 24 },
      { key: 'enemy_tank', color: '#7209b7', size: 48 },
    ];

    enemies.forEach((enemy) => {
      if (!scene.textures.exists(enemy.key)) {
        const canvas = scene.textures.createCanvas(enemy.key, enemy.size, enemy.size);
        if (canvas) {
          const ctx = canvas.getContext();
          const r = enemy.size / 2;
          ctx.fillStyle = enemy.color;
          ctx.beginPath();
          ctx.arc(r, r, r - 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Angry Eyes
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(r - 8, r - 4, 4, 4);
          ctx.fillRect(r + 4, r - 4, 4, 4);

          canvas.refresh();
        }
      }
    });

    // 4. Coin Texture
    if (!scene.textures.exists('coin_texture')) {
      const canvas = scene.textures.createCanvas('coin_texture', 24, 24);
      if (canvas) {
        const ctx = canvas.getContext();
        ctx.fillStyle = '#ffbe0b';
        ctx.beginPath();
        ctx.arc(12, 12, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fb5607';
        ctx.lineWidth = 2;
        ctx.stroke();

        canvas.refresh();
      }
    }

    // 5. Particle Dot Texture
    if (!scene.textures.exists('particle_dot')) {
      const canvas = scene.textures.createCanvas('particle_dot', 16, 16);
      if (canvas) {
        const ctx = canvas.getContext();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(8, 8, 6, 0, Math.PI * 2);
        ctx.fill();

        canvas.refresh();
      }
    }
  }
}
