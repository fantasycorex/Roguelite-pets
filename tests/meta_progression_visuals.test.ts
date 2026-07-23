import { describe, it, expect, beforeEach } from 'vitest';
import { SaveManager } from '../src/core/save/SaveManager';
import { ProgressionService } from '../src/core/services/ProgressionService';
import { ObjectPool } from '../src/core/pooling/ObjectPool';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

describe('Milestones 19 & 20 — Meta-Progression & Production Visual/Audio Pass', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('Milestone 19: SaveManager handles export, import, and gentle offline care decay', () => {
    const data = SaveManager.loadGame();
    expect(data.discoveredEquipment).toBeDefined();
    expect(data.speciesMastery).toBeDefined();

    const exported = SaveManager.exportSavePayload();
    expect(exported).toContain('version');

    const imported = SaveManager.importSavePayload(exported);
    expect(imported.success).toBe(true);
  });

  it('Milestone 19: ProgressionService unlocks level traits, map victories, and species mastery', () => {
    const save = SaveManager.loadGame();
    const unlocks = ProgressionService.checkLevelUnlocks(save, 5);

    expect(unlocks).toContain('elemental_overload');
    expect(save.unlockedTraits).toContain('elemental_overload');

    ProgressionService.recordMapVictory(save, 'moonlit_crossing', 'challenging');
    expect(save.unlockedMaps).toContain('volcanic_ridge');
    expect(save.unlockedDifficulties).toContain('guardian');

    const mastery = ProgressionService.addSpeciesMasteryExp(save, 'spark_fox', 150);
    expect(mastery.level).toBe(2);
  });

  it('Milestone 20: ObjectPool acquires, releases and manages memory efficiently', () => {
    interface DummyItem {
      id: number;
      active: boolean;
    }
    let counter = 0;

    const pool = new ObjectPool<DummyItem>(
      () => ({ id: counter++, active: false }),
      (item) => {
        item.active = false;
      },
      5,
    );

    expect(pool.getFreeCount()).toBe(5);

    const item1 = pool.acquire();
    item1.active = true;
    expect(pool.getFreeCount()).toBe(4);

    pool.release(item1);
    expect(pool.getFreeCount()).toBe(5);
    expect(item1.active).toBe(false);
  });
});
