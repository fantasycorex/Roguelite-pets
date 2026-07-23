import Phaser from 'phaser';
import { BattleRunState, ActiveEnemy } from '../../core/state/BattleRunState';
import { soundEngine } from '../../core/audio/SoundEngine';

export class CombatRenderer {
  private scene: Phaser.Scene;
  private petSprite!: Phaser.GameObjects.Sprite;
  private pathGraphics!: Phaser.GameObjects.Graphics;
  private enemySprites: Map<
    string,
    { sprite: Phaser.GameObjects.Sprite; hpBar: Phaser.GameObjects.Graphics }
  > = new Map();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public initMapGraphics(runState: BattleRunState): void {
    const waypoints = runState.mapConfig.waypoints;
    const secondaryWaypoints = runState.mapConfig.secondaryWaypoints;
    const towerPos = runState.mapConfig.towerPosition;

    this.pathGraphics = this.scene.add.graphics();
    this.pathGraphics.lineStyle(12, 0x334155, 0.8);
    this.pathGraphics.beginPath();
    this.pathGraphics.moveTo(waypoints[0].x, waypoints[0].y);
    for (let i = 1; i < waypoints.length; i++) {
      this.pathGraphics.lineTo(waypoints[i].x, waypoints[i].y);
    }
    this.pathGraphics.strokePath();

    if (secondaryWaypoints && secondaryWaypoints.length > 0) {
      this.pathGraphics.lineStyle(10, 0x475569, 0.7);
      this.pathGraphics.beginPath();
      this.pathGraphics.moveTo(secondaryWaypoints[0].x, secondaryWaypoints[0].y);
      for (let i = 1; i < secondaryWaypoints.length; i++) {
        this.pathGraphics.lineTo(secondaryWaypoints[i].x, secondaryWaypoints[i].y);
      }
      this.pathGraphics.strokePath();
    }

    this.scene.add.sprite(towerPos.x, towerPos.y, 'tower_texture');
    this.pathGraphics.lineStyle(2, 0x38b000, 0.3);
    this.pathGraphics.strokeCircle(towerPos.x, towerPos.y, runState.mapConfig.patrolRadius || 80);

    this.petSprite = this.scene.add.sprite(towerPos.x + 80, towerPos.y, 'pet_texture');
  }

  public spawnEnemySprite(enemy: ActiveEnemy): void {
    const spriteKey = `enemy_${enemy.config.id}`;
    const sprite = this.scene.add.sprite(
      enemy.x,
      enemy.y,
      this.scene.textures.exists(spriteKey) ? spriteKey : 'enemy_basic',
    );
    if (enemy.config.isBoss) {
      sprite.setScale(2.2);
    }
    const hpBar = this.scene.add.graphics();

    this.enemySprites.set(enemy.instanceId, { sprite, hpBar });
    this.updateHpBar(enemy.instanceId, enemy.currentHp, enemy.maxHp);
  }

  public removeEnemySprite(instanceId: string): void {
    const entry = this.enemySprites.get(instanceId);
    if (entry) {
      entry.hpBar.destroy();
      this.scene.tweens.add({
        targets: entry.sprite,
        scaleX: 1.5,
        scaleY: 1.5,
        alpha: 0,
        duration: 200,
        onComplete: () => entry.sprite.destroy(),
      });
      this.enemySprites.delete(instanceId);
    }
  }

  public renderLaserAttack(startX: number, startY: number, targetX: number, targetY: number): void {
    soundEngine.playAttackSound();
    const laser = this.scene.add.graphics();
    laser.lineStyle(3, 0x4cc9f0, 0.9);
    laser.lineBetween(startX, startY, targetX, targetY);

    this.scene.tweens.add({
      targets: laser,
      alpha: 0,
      duration: 120,
      onComplete: () => laser.destroy(),
    });
  }

  public renderSpecialBurst(x: number, y: number, radius: number): void {
    soundEngine.playAttackSound();
    const burst = this.scene.add.graphics();
    burst.fillStyle(0x7209b7, 0.4);
    burst.fillCircle(x, y, radius);
    burst.lineStyle(3, 0xf72585, 1);
    burst.strokeCircle(x, y, radius);

    this.scene.tweens.add({
      targets: burst,
      alpha: 0,
      duration: 350,
      onComplete: () => burst.destroy(),
    });
  }

  public update(runState: BattleRunState): void {
    this.petSprite.x = runState.petX;
    this.petSprite.y = runState.petY;

    if (runState.isCreatureDowned) {
      this.petSprite.setAlpha(0.4);
    } else {
      this.petSprite.setAlpha(1.0);
    }

    for (const enemy of runState.activeEnemies.values()) {
      const entry = this.enemySprites.get(enemy.instanceId);
      if (entry) {
        entry.sprite.x = enemy.x;
        entry.sprite.y = enemy.y;
        this.updateHpBar(enemy.instanceId, enemy.currentHp, enemy.maxHp);
      }
    }
  }

  private updateHpBar(instanceId: string, currentHp: number, maxHp: number): void {
    const entry = this.enemySprites.get(instanceId);
    if (!entry) return;

    const { sprite, hpBar } = entry;
    hpBar.clear();
    const ratio = Math.max(0, currentHp / maxHp);
    const width = 32;
    const height = 4;
    const x = sprite.x - width / 2;
    const y = sprite.y - 20;

    hpBar.fillStyle(0x000000, 0.6);
    hpBar.fillRect(x, y, width, height);

    hpBar.fillStyle(ratio > 0.4 ? 0x80ed99 : 0xff0054, 1);
    hpBar.fillRect(x, y, width * ratio, height);
  }

  public destroy(): void {
    this.enemySprites.forEach((entry) => {
      entry.hpBar.destroy();
      entry.sprite.destroy();
    });
    this.enemySprites.clear();
  }
}
