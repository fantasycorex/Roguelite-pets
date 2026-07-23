import Phaser from 'phaser';

export type CreatureAnimState =
  | 'idle'
  | 'move'
  | 'attack'
  | 'special'
  | 'hurt'
  | 'downed'
  | 'revive'
  | 'happy'
  | 'eating'
  | 'evolving';

export class CreatureAnimationStateMachine {
  private scene: Phaser.Scene;
  private sprite: Phaser.GameObjects.Sprite;
  private currentState: CreatureAnimState = 'idle';
  private activeTween?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, sprite: Phaser.GameObjects.Sprite) {
    this.scene = scene;
    this.sprite = sprite;
  }

  public getState(): CreatureAnimState {
    return this.currentState;
  }

  public setState(nextState: CreatureAnimState): void {
    if (this.currentState === nextState && nextState !== 'attack') return;
    this.currentState = nextState;

    if (this.activeTween) {
      this.activeTween.stop();
      this.activeTween = undefined;
    }

    switch (nextState) {
      case 'idle':
        this.sprite.setAlpha(1.0).setTint(0xffffff);
        this.activeTween = this.scene.tweens.add({
          targets: this.sprite,
          y: this.sprite.y - 4,
          duration: 700,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
        break;

      case 'move':
        this.sprite.setAlpha(1.0);
        this.activeTween = this.scene.tweens.add({
          targets: this.sprite,
          scaleX: 1.1,
          scaleY: 0.9,
          duration: 250,
          yoyo: true,
          repeat: -1,
        });
        break;

      case 'attack':
        this.activeTween = this.scene.tweens.add({
          targets: this.sprite,
          scaleX: 1.25,
          scaleY: 1.25,
          duration: 120,
          yoyo: true,
          onComplete: () => this.setState('idle'),
        });
        break;

      case 'special':
        this.sprite.setTint(0xffbe0b);
        this.activeTween = this.scene.tweens.add({
          targets: this.sprite,
          angle: 360,
          duration: 400,
          onComplete: () => {
            this.sprite.setAngle(0).clearTint();
            this.setState('idle');
          },
        });
        break;

      case 'hurt':
        this.sprite.setTint(0xff0054);
        this.activeTween = this.scene.tweens.add({
          targets: this.sprite,
          alpha: 0.4,
          duration: 150,
          yoyo: true,
          repeat: 2,
          onComplete: () => {
            this.sprite.clearTint().setAlpha(1.0);
            this.setState('idle');
          },
        });
        break;

      case 'downed':
        this.sprite.setTint(0x64748b).setAlpha(0.4);
        break;

      case 'revive':
        this.sprite.clearTint().setAlpha(1.0);
        this.activeTween = this.scene.tweens.add({
          targets: this.sprite,
          scaleX: 1.4,
          scaleY: 1.4,
          duration: 300,
          yoyo: true,
          onComplete: () => this.setState('idle'),
        });
        break;

      case 'happy':
        this.sprite.setTint(0x80ed99);
        this.activeTween = this.scene.tweens.add({
          targets: this.sprite,
          y: this.sprite.y - 20,
          duration: 300,
          yoyo: true,
          repeat: 1,
          onComplete: () => {
            this.sprite.clearTint();
            this.setState('idle');
          },
        });
        break;

      case 'eating':
        this.sprite.setTint(0x38b000);
        this.activeTween = this.scene.tweens.add({
          targets: this.sprite,
          scaleX: 1.15,
          scaleY: 0.85,
          duration: 200,
          yoyo: true,
          repeat: 2,
          onComplete: () => {
            this.sprite.clearTint();
            this.setState('idle');
          },
        });
        break;

      case 'evolving':
        this.sprite.setTint(0xf72585);
        this.activeTween = this.scene.tweens.add({
          targets: this.sprite,
          angle: 720,
          scaleX: 2.0,
          scaleY: 2.0,
          duration: 1200,
          onComplete: () => {
            this.sprite.setAngle(0).clearTint();
            this.setState('idle');
          },
        });
        break;
    }
  }
}
