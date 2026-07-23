import { describe, it, expect, beforeEach } from 'vitest';
import { SaveManager, CURRENT_SAVE_SCHEMA_VERSION } from '../src/core/save/SaveManager';
import { SaveDataSchema } from '../src/types/save';
import { DEFAULT_CREATURE_PROFILE } from '../src/data/creatures.data';

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

describe('SaveManager Unit Tests', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('loadGame returns default save data when storage is empty', () => {
    const data = SaveManager.loadGame();
    expect(data.version).toBe(CURRENT_SAVE_SCHEMA_VERSION);
    expect(data.totalCoins).toBe(50);
    expect(data.creatureProfile.id).toBe(DEFAULT_CREATURE_PROFILE.id);
  });

  it('saveGame serializes and loadGame deserializes payload accurately', () => {
    const customSave: SaveDataSchema = {
      version: CURRENT_SAVE_SCHEMA_VERSION,
      creatureProfile: { ...DEFAULT_CREATURE_PROFILE, hunger: 95, affection: 90 },
      inventory: ['wooden_collar', 'ruby_pendant'],
      totalCoins: 250,
      unlockedTraits: ['sharp_claws'],
      tutorialCompleted: false,
    };

    const saved = SaveManager.saveGame(customSave);
    expect(saved).toBe(true);

    const loaded = SaveManager.loadGame();
    expect(loaded.totalCoins).toBe(250);
    expect(loaded.creatureProfile.hunger).toBe(95);
    expect(loaded.inventory).toContain('ruby_pendant');
  });

  it('resetSave removes stored data and re-initializes defaults', () => {
    const customSave: SaveDataSchema = {
      version: CURRENT_SAVE_SCHEMA_VERSION,
      creatureProfile: { ...DEFAULT_CREATURE_PROFILE },
      inventory: ['ruby_pendant'],
      totalCoins: 999,
      unlockedTraits: [],
      tutorialCompleted: true,
    };

    SaveManager.saveGame(customSave);
    const reset = SaveManager.resetSave();

    expect(reset.totalCoins).toBe(50);
    expect(reset.inventory).toEqual(['wooden_collar']);
  });
});
