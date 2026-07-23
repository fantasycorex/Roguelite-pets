import Phaser from 'phaser';
import { MAPS_DATA } from '../../data/maps.data';
import { DifficultyTier } from '../../core/director/RunDirector';

export class MapSelectionPanel {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private selectedDifficulty: DifficultyTier = 'normal';
  private customSeedText: string = '';

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0).setDepth(500).setVisible(false);
  }

  public getSelectedDifficulty(): DifficultyTier {
    return this.selectedDifficulty;
  }

  public getCustomSeed(): number | undefined {
    const num = parseInt(this.customSeedText, 10);
    return isNaN(num) ? undefined : num;
  }

  public open(
    selectedMapId: string,
    onSelectMap: (mapId: string) => void,
    onStart: (difficulty: DifficultyTier, seed?: number) => void,
  ): void {
    const { width, height } = this.scene.scale;
    this.container.removeAll(true);
    this.container.setVisible(true);

    const mapKeys = Object.keys(MAPS_DATA);
    let currentIndex = mapKeys.indexOf(selectedMapId);
    if (currentIndex < 0) currentIndex = 0;

    const overlay = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);
    const box = this.scene.add
      .rectangle(width / 2, height / 2, 600, 480, 0x1e293b)
      .setStrokeStyle(3, 0x38b000);

    const title = this.scene.add
      .text(width / 2, height / 2 - 210, 'SELECT BATTLE MAP & DIFFICULTY', {
        fontSize: '22px',
        color: '#ffbe0b',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.container.add([overlay, box, title]);

    const currentMapKey = mapKeys[currentIndex];
    const mapConfig = MAPS_DATA[currentMapKey];

    const mapTitle = this.scene.add
      .text(
        width / 2,
        height / 2 - 170,
        `[ MAP ${currentIndex + 1} / ${mapKeys.length} ]  ${mapConfig.name}`,
        {
          fontSize: '17px',
          color: '#80ed99',
          fontStyle: 'bold',
        },
      )
      .setOrigin(0.5);

    const mapDesc = this.scene.add
      .text(width / 2, height / 2 - 145, mapConfig.description, {
        fontSize: '12px',
        color: '#cbd5e1',
        align: 'center',
      })
      .setOrigin(0.5);

    // Map Preview Box
    const previewW = 380;
    const previewH = 150;
    const previewX = width / 2;
    const previewY = height / 2 - 40;

    const previewBg = this.scene.add
      .rectangle(previewX, previewY, previewW, previewH, 0x0f172a)
      .setStrokeStyle(2, 0x334155);

    const previewGfx = this.scene.add.graphics();
    const scaleX = previewW / width;
    const scaleY = previewH / height;
    const offsetX = previewX - previewW / 2;
    const offsetY = previewY - previewH / 2;

    previewGfx.lineStyle(5, 0x38b000, 0.9);
    previewGfx.beginPath();
    const p0 = mapConfig.waypoints[0];
    previewGfx.moveTo(offsetX + Math.max(10, p0.x * scaleX), offsetY + p0.y * scaleY);
    for (let i = 1; i < mapConfig.waypoints.length; i++) {
      const pt = mapConfig.waypoints[i];
      previewGfx.lineTo(offsetX + pt.x * scaleX, offsetY + pt.y * scaleY);
    }
    previewGfx.strokePath();

    if (mapConfig.secondaryWaypoints && mapConfig.secondaryWaypoints.length > 0) {
      previewGfx.lineStyle(5, 0xf72585, 0.9);
      previewGfx.beginPath();
      const s0 = mapConfig.secondaryWaypoints[0];
      previewGfx.moveTo(offsetX + Math.max(10, s0.x * scaleX), offsetY + s0.y * scaleY);
      for (let i = 1; i < mapConfig.secondaryWaypoints.length; i++) {
        const pt = mapConfig.secondaryWaypoints[i];
        previewGfx.lineTo(offsetX + pt.x * scaleX, offsetY + pt.y * scaleY);
      }
      previewGfx.strokePath();
    }

    const tw = mapConfig.towerPosition;
    previewGfx.fillStyle(0xffbe0b, 1);
    previewGfx.fillCircle(offsetX + tw.x * scaleX, offsetY + tw.y * scaleY, 7);

    const prevBtn = this.scene.add
      .rectangle(width / 2 - 245, previewY, 44, 70, 0x334155)
      .setStrokeStyle(2, 0x475569)
      .setInteractive({ useHandCursor: true });
    const prevTxt = this.scene.add
      .text(width / 2 - 245, previewY, '◄', {
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const nextBtn = this.scene.add
      .rectangle(width / 2 + 245, previewY, 44, 70, 0x334155)
      .setStrokeStyle(2, 0x475569)
      .setInteractive({ useHandCursor: true });
    const nextTxt = this.scene.add
      .text(width / 2 + 245, previewY, '►', {
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    prevBtn.on('pointerdown', () => {
      currentIndex = (currentIndex - 1 + mapKeys.length) % mapKeys.length;
      onSelectMap(mapKeys[currentIndex]);
      this.open(mapKeys[currentIndex], onSelectMap, onStart);
    });

    nextBtn.on('pointerdown', () => {
      currentIndex = (currentIndex + 1) % mapKeys.length;
      onSelectMap(mapKeys[currentIndex]);
      this.open(mapKeys[currentIndex], onSelectMap, onStart);
    });

    // Difficulty Selector Row
    const diffY = height / 2 + 75;
    const diffTitle = this.scene.add
      .text(width / 2, diffY - 22, 'DIFFICULTY TIER:', {
        fontSize: '12px',
        color: '#ffbe0b',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const difficulties: { id: DifficultyTier; label: string; color: number }[] = [
      { id: 'normal', label: 'NORMAL (1.0x)', color: 0x16a34a },
      { id: 'challenging', label: 'CHALLENGING (1.25x)', color: 0xd97706 },
      { id: 'guardian', label: 'GUARDIAN (1.5x)', color: 0xef4444 },
    ];

    this.container.add([
      mapTitle,
      mapDesc,
      previewBg,
      previewGfx,
      prevBtn,
      prevTxt,
      nextBtn,
      nextTxt,
      diffTitle,
    ]);

    difficulties.forEach((diff, idx) => {
      const btnX = width / 2 - 170 + idx * 170;
      const isSelected = this.selectedDifficulty === diff.id;

      const dBtn = this.scene.add
        .rectangle(btnX, diffY + 6, 150, 32, isSelected ? diff.color : 0x334155)
        .setStrokeStyle(2, isSelected ? 0xffbe0b : 0x475569)
        .setInteractive({ useHandCursor: true });

      const dTxt = this.scene.add
        .text(btnX, diffY + 6, diff.label, {
          fontSize: '11px',
          color: '#ffffff',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);

      dBtn.on('pointerdown', () => {
        this.selectedDifficulty = diff.id;
        this.open(mapKeys[currentIndex], onSelectMap, onStart);
      });

      this.container.add([dBtn, dTxt]);
    });

    // Start Button
    const startBtn = this.scene.add
      .rectangle(width / 2, height / 2 + 175, 230, 44, 0xf72585)
      .setInteractive({ useHandCursor: true });
    const startTxt = this.scene.add
      .text(width / 2, height / 2 + 175, 'LAUNCH DEFENSE RUN ⚔️', {
        fontSize: '15px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    startBtn.on('pointerdown', () => {
      this.container.setVisible(false);
      onStart(this.selectedDifficulty, this.getCustomSeed());
    });

    const closeBtn = this.scene.add
      .rectangle(width / 2 + 265, height / 2 - 210, 30, 30, 0xef4444)
      .setInteractive({ useHandCursor: true });
    const closeTxt = this.scene.add
      .text(width / 2 + 265, height / 2 - 210, '✕', {
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    closeBtn.on('pointerdown', () => this.container.setVisible(false));

    this.container.add([startBtn, startTxt, closeBtn, closeTxt]);
  }
}
