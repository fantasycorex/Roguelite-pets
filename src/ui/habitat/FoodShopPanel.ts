import Phaser from 'phaser';
import { FOOD_DATA } from '../../data/food.data';
import { soundEngine } from '../../core/audio/SoundEngine';

export class FoodShopPanel {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0).setDepth(600).setVisible(false);
  }

  public open(
    totalCoins: number,
    foodInventory: Record<string, number>,
    onBuy: (foodId: string) => { success: boolean; message?: string },
  ): void {
    const { width, height } = this.scene.scale;
    this.container.removeAll(true);
    this.container.setVisible(true);

    const overlay = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);
    const box = this.scene.add
      .rectangle(width / 2, height / 2, 540, 420, 0x1e293b)
      .setStrokeStyle(3, 0x0284c7);

    const title = this.scene.add
      .text(width / 2, height / 2 - 170, 'PET FOOD SHOP 🛒', {
        fontSize: '24px',
        color: '#ffbe0b',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const coinsDisplay = this.scene.add
      .text(width / 2, height / 2 - 142, `Your Coins: ${totalCoins}g`, {
        fontSize: '14px',
        color: '#80ed99',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.container.add([overlay, box, title, coinsDisplay]);

    const shopItems = Object.values(FOOD_DATA);
    shopItems.forEach((food, idx) => {
      const cardY = height / 2 - 90 + idx * 95;

      const bg = this.scene.add
        .rectangle(width / 2, cardY, 480, 80, 0x0f172a)
        .setStrokeStyle(1.5, 0x334155);

      const foodEmoji =
        food.id === 'basic_kibble' ? '🍖' : food.id === 'gourmet_treat' ? '🧁' : '🫐';
      const nameTxt = this.scene.add.text(
        width / 2 - 225,
        cardY - 26,
        `${foodEmoji} ${food.name}`,
        {
          fontSize: '17px',
          color: '#ffffff',
          fontStyle: 'bold',
        },
      );

      const descTxt = this.scene.add.text(width / 2 - 225, cardY - 2, food.description, {
        fontSize: '11px',
        color: '#cbd5e1',
        wordWrap: { width: 290 },
      });

      const ownedCount = foodInventory[food.id] || 0;

      const buyBtn = this.scene.add
        .rectangle(width / 2 + 165, cardY - 8, 100, 36, 0x16a34a)
        .setInteractive({ useHandCursor: true });
      const buyTxt = this.scene.add
        .text(width / 2 + 165, cardY - 8, `BUY ${food.price}g`, {
          fontSize: '13px',
          color: '#ffffff',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);

      const ownedTxt = this.scene.add
        .text(width / 2 + 165, cardY + 18, `Owned: ${ownedCount}`, {
          fontSize: '11px',
          color: '#ffbe0b',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);

      buyBtn.on('pointerdown', () => {
        const res = onBuy(food.id);
        if (res.success) {
          soundEngine.playCoinSound();
          this.open(totalCoins - food.price, foodInventory, onBuy);
        }
      });

      this.container.add([bg, nameTxt, descTxt, buyBtn, buyTxt, ownedTxt]);
    });

    const closeBtn = this.scene.add
      .rectangle(width / 2, height / 2 + 165, 140, 36, 0x475569)
      .setInteractive({ useHandCursor: true });
    const closeTxt = this.scene.add
      .text(width / 2, height / 2 + 165, 'CLOSE', {
        fontSize: '13px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    closeBtn.on('pointerdown', () => this.container.setVisible(false));
    this.container.add([closeBtn, closeTxt]);
  }
}
