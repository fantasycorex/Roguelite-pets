import Phaser from 'phaser';
import { OwnedCreature } from '../../types/creature';
import { SPECIES_DATA } from '../../data/species.data';

export class CreatureRosterPanel {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);
  }

  public render(
    ownedCreatures: OwnedCreature[],
    activeInstanceId: string,
    onSelect: (instanceId: string) => void,
  ): void {
    this.container.removeAll(true);
    const width = this.scene.scale.width;
    const startX = width / 2 - 180;
    const y = 70;

    ownedCreatures.forEach((creature, idx) => {
      const btnX = startX + idx * 180;
      const species = SPECIES_DATA[creature.speciesId] || SPECIES_DATA.guardian_blob;
      const isActive = creature.instanceId === activeInstanceId;

      const bg = this.scene.add
        .rectangle(btnX, y, 160, 30, isActive ? species.colorHex : 0x334155, 0.9)
        .setStrokeStyle(2, isActive ? 0xffbe0b : 0x475569)
        .setInteractive({ useHandCursor: true });

      const txt = this.scene.add
        .text(btnX, y, `${species.name} (Lv.${creature.level})`, {
          fontSize: '11px',
          color: '#ffffff',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);

      bg.on('pointerdown', () => onSelect(creature.instanceId));
      this.container.add([bg, txt]);
    });
  }
}
