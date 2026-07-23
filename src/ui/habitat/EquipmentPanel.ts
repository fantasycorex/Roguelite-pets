import Phaser from 'phaser';
import { OwnedCreature } from '../../types/creature';
import { EquipmentSlot } from '../../types/equipment';
import { EquipmentEngine } from '../../core/equipment/EquipmentEngine';
import { EQUIPMENT_DATA } from '../../data/equipment.data';
import { soundEngine } from '../../core/audio/SoundEngine';

export class EquipmentPanel {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private inventoryPage: number = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const { width, height } = scene.scale;
    const panelX = width - 340;
    const panelY = height / 2 + 10;
    const panelW = 310;
    const panelH = 540;

    scene.add.rectangle(panelX, panelY, panelW, panelH, 0x0f172a, 0.95).setStrokeStyle(2, 0x334155);

    scene.add
      .text(panelX, panelY - panelH / 2 + 25, 'EQUIPMENT & INVENTORY', {
        fontSize: '16px',
        color: '#ffbe0b',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.container = scene.add.container(0, 0);
  }

  public render(
    creature: OwnedCreature,
    inventory: string[],
    onEquip: (itemId: string) => void,
    onUnequip: (slot: EquipmentSlot) => void,
    onSell: (itemId: string) => void,
  ): void {
    this.container.removeAll(true);
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;
    const panelX = width - 340;
    const panelTopY = height / 2 - 220;

    const equipped = EquipmentEngine.getEquippedItems(creature);
    const slots: EquipmentSlot[] = ['collar', 'charm', 'toy'];

    // 1. Render 3 Equipped Slot Cards
    slots.forEach((slot, idx) => {
      const slotY = panelTopY + idx * 36;
      const item = equipped[slot];

      const slotBg = this.scene.add
        .rectangle(panelX, slotY, 290, 32, 0x1e293b)
        .setStrokeStyle(1, item ? 0x80ed99 : 0x334155);

      const slotLabelText = `${slot.toUpperCase()}: ${item ? item.name : 'Empty'}`;
      const slotTxt = this.scene.add.text(panelX - 135, slotY - 7, slotLabelText, {
        fontSize: '11px',
        color: item ? '#ffffff' : '#64748b',
        fontStyle: item ? 'bold' : 'normal',
      });

      this.container.add([slotBg, slotTxt]);

      if (item) {
        const unequipBtn = this.scene.add
          .rectangle(panelX + 105, slotY, 65, 22, 0xef4444)
          .setInteractive({ useHandCursor: true });
        const unequipTxt = this.scene.add
          .text(panelX + 105, slotY, 'UNEQUIP', {
            fontSize: '9px',
            color: '#ffffff',
            fontStyle: 'bold',
          })
          .setOrigin(0.5);

        unequipBtn.on('pointerdown', () => onUnequip(slot));
        this.container.add([unequipBtn, unequipTxt]);
      }
    });

    // 2. Inventory Bag Header & Pagination Controls
    const invHeaderY = panelTopY + 120;
    const itemsPerPage = 4;
    const totalPages = Math.max(1, Math.ceil(inventory.length / itemsPerPage));
    if (this.inventoryPage >= totalPages) this.inventoryPage = totalPages - 1;

    const invHeaderBg = this.scene.add.rectangle(panelX, invHeaderY, 290, 26, 0x334155);
    const invTitleTxt = this.scene.add.text(
      panelX - 135,
      invHeaderY - 6,
      `INVENTORY BAG (${inventory.length}) - Pg ${this.inventoryPage + 1}/${totalPages}`,
      {
        fontSize: '11px',
        color: '#ffbe0b',
        fontStyle: 'bold',
      },
    );

    this.container.add([invHeaderBg, invTitleTxt]);

    if (totalPages > 1) {
      const prevPgBtn = this.scene.add
        .rectangle(panelX + 90, invHeaderY, 28, 20, 0x475569)
        .setInteractive({ useHandCursor: true });
      const prevPgTxt = this.scene.add
        .text(panelX + 90, invHeaderY, '◄', { fontSize: '10px', color: '#ffffff' })
        .setOrigin(0.5);

      const nextPgBtn = this.scene.add
        .rectangle(panelX + 125, invHeaderY, 28, 20, 0x475569)
        .setInteractive({ useHandCursor: true });
      const nextPgTxt = this.scene.add
        .text(panelX + 125, invHeaderY, '►', { fontSize: '10px', color: '#ffffff' })
        .setOrigin(0.5);

      prevPgBtn.on('pointerdown', () => {
        this.inventoryPage = (this.inventoryPage - 1 + totalPages) % totalPages;
        this.render(creature, inventory, onEquip, onUnequip, onSell);
      });

      nextPgBtn.on('pointerdown', () => {
        this.inventoryPage = (this.inventoryPage + 1) % totalPages;
        this.render(creature, inventory, onEquip, onUnequip, onSell);
      });

      this.container.add([prevPgBtn, prevPgTxt, nextPgBtn, nextPgTxt]);
    }

    // 3. Paginated Inventory Items List (Max 4 per page)
    const pageItems = inventory.slice(
      this.inventoryPage * itemsPerPage,
      (this.inventoryPage + 1) * itemsPerPage,
    );

    if (pageItems.length === 0) {
      const emptyText = this.scene.add
        .text(panelX, invHeaderY + 60, 'Inventory Empty\n(Defeat enemies in Defense run)', {
          fontSize: '12px',
          color: '#64748b',
          align: 'center',
        })
        .setOrigin(0.5);
      this.container.add(emptyText);
      return;
    }

    pageItems.forEach((itemId, idx) => {
      const itemConfig = EQUIPMENT_DATA[itemId];
      if (!itemConfig) return;

      const itemY = invHeaderY + 45 + idx * 62;

      const itemBg = this.scene.add
        .rectangle(panelX, itemY, 290, 54, 0x1e293b)
        .setStrokeStyle(1, 0x475569);

      const displayName =
        itemConfig.name.length > 15 ? itemConfig.name.substring(0, 14) + '..' : itemConfig.name;
      const nameTxt = this.scene.add.text(
        panelX - 135,
        itemY - 18,
        `${displayName} [${itemConfig.slot.toUpperCase()}]`,
        {
          fontSize: '11px',
          color: '#f8fafc',
          fontStyle: 'bold',
        },
      );

      const descTxt = this.scene.add.text(panelX - 135, itemY + 2, itemConfig.description, {
        fontSize: '9px',
        color: '#94a3b8',
      });

      const equipBtn = this.scene.add
        .rectangle(panelX + 50, itemY, 52, 24, 0x3b82f6)
        .setInteractive({ useHandCursor: true });
      const btnTxt = this.scene.add
        .text(panelX + 50, itemY, 'EQUIP', {
          fontSize: '10px',
          color: '#ffffff',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);

      equipBtn.on('pointerdown', () => onEquip(itemId));

      const sellBtn = this.scene.add
        .rectangle(panelX + 110, itemY, 55, 24, 0xd97706)
        .setInteractive({ useHandCursor: true });
      const sellTxt = this.scene.add
        .text(panelX + 110, itemY, `SELL ${itemConfig.sellValue}g`, {
          fontSize: '9px',
          color: '#ffffff',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);

      sellBtn.on('pointerdown', () => {
        soundEngine.playCoinSound();
        onSell(itemId);
      });

      this.container.add([itemBg, nameTxt, descTxt, equipBtn, btnTxt, sellBtn, sellTxt]);
    });
  }
}
