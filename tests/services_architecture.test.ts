import { describe, it, expect, beforeEach } from 'vitest';
import { CareService } from '../src/core/services/CareService';
import { ShopService } from '../src/core/services/ShopService';
import { InventoryService } from '../src/core/services/InventoryService';
import { EvolutionService } from '../src/core/services/EvolutionService';
import { RunPreparationService } from '../src/core/services/RunPreparationService';
import { SettingsCoordinator } from '../src/core/services/SettingsCoordinator';
import { HabitatController } from '../src/core/controllers/HabitatController';
import { RunController } from '../src/core/controllers/RunController';
import { DEFAULT_CREATURE_STATS } from '../src/data/creatures.data';
import { OwnedCreature } from '../src/types/creature';

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

describe('Milestone 16 — Domain Services & Architecture Tests', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('CareService executes care decay, feeding and care bonus calculation', () => {
    const creature: OwnedCreature = {
      instanceId: 'c1',
      speciesId: 'guardian_blob',
      nickname: 'Slimey',
      level: 1,
      currentExp: 0,
      fullness: 50,
      affection: 50,
      equippedItems: {},
      evolutionStage: 1,
      personalityTraits: [],
    };

    CareService.feed(creature, 25);
    expect(creature.fullness).toBe(75);

    CareService.updateDecay(creature, 10);
    expect(creature.fullness).toBe(72);

    const bonus = CareService.getCareBonus(creature);
    expect(bonus).toBeDefined();
  });

  it('ShopService validates coin costs and grants food inventory items', () => {
    const res = ShopService.buyFood('basic_kibble', 100, {});
    expect(res.success).toBe(true);
    expect(res.totalCoins).toBe(90);
    expect(res.foodInventory.basic_kibble).toBe(1);

    const fail = ShopService.buyFood('gourmet_treat', 5, {});
    expect(fail.success).toBe(false);
  });

  it('InventoryService equips, unequips and sells items cleanly', () => {
    const creature: OwnedCreature = {
      instanceId: 'c1',
      speciesId: 'guardian_blob',
      nickname: 'Slimey',
      level: 1,
      currentExp: 0,
      fullness: 80,
      affection: 80,
      equippedItems: {},
      evolutionStage: 1,
      personalityTraits: [],
    };
    const inventory = ['wooden_collar', 'ruby_pendant'];

    const equipped = InventoryService.equip(creature, inventory, 'wooden_collar');
    expect(equipped).toBe(true);
    expect(creature.equippedItems.collar).toBe('wooden_collar');

    const sold = InventoryService.sellItem(inventory, 'ruby_pendant');
    expect(sold).toBe(35);
  });

  it('RunPreparationService prepares modified petStats payload with food buffs', () => {
    const creature: OwnedCreature = {
      instanceId: 'c1',
      speciesId: 'spark_fox',
      nickname: 'Ember',
      level: 1,
      currentExp: 0,
      fullness: 100,
      affection: 100,
      equippedItems: {},
      evolutionStage: 1,
      personalityTraits: [],
    };

    const prepared = RunPreparationService.prepareRun(creature, {
      type: 'speed_buff',
      multiplier: 1.15,
    });
    expect(prepared.speciesId).toBe('spark_fox');
    expect(prepared.petStats.attackSpeed).toBeGreaterThan(0);
  });

  it('SettingsCoordinator synchronizes settings and audio states', () => {
    SettingsCoordinator.syncAudioOnStartup();
    const updated = SettingsCoordinator.updateMasterVolume(0.8);
    expect(updated.masterVolume).toBe(0.8);
  });

  it('HabitatController & RunController orchestrate input & execution without scene dependency', () => {
    const habitatCtrl = new HabitatController();
    expect(habitatCtrl.getActiveCreature()).toBeDefined();

    const runCtrl = new RunController(
      DEFAULT_CREATURE_STATS,
      'heartwood_clearing',
      'guardian_blob',
    );
    runCtrl.startRun();
    expect(runCtrl.getRunState()).toBeDefined();

    expect(EvolutionService.canEvolve(habitatCtrl.getActiveCreature())).toBe(false);
  });
});
