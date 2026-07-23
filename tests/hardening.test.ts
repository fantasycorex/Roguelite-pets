import { describe, it, expect, beforeEach } from 'vitest';
import { RunRewardSettlementService } from '../src/core/services/RunRewardSettlementService';
import { SaveManager, CURRENT_SAVE_SCHEMA_VERSION } from '../src/core/save/SaveManager';
import { CombatEngine } from '../src/core/combat/CombatEngine';
import { BattleRunState } from '../src/core/state/BattleRunState';
import { DEFAULT_CREATURE_STATS, DEFAULT_CREATURE_PROFILE } from '../src/data/creatures.data';
import { TRAITS_DATA } from '../src/data/traits.data';

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

describe('Milestone 8 — Vertical Slice Hardening Tests', () => {
  beforeEach(() => {
    localStorageMock.clear();
    const service = RunRewardSettlementService.getInstance();
    service.clearSettledRuns();
  });

  it('RunRewardSettlementService settles rewards exactly once per runId (idempotent)', () => {
    const service = RunRewardSettlementService.getInstance();
    const payload = {
      runId: 'run_test_123',
      coinsEarned: 100,
      expEarned: 50,
      droppedEquipment: ['spiked_collar'],
    };

    const first = service.settleRunRewards(payload);
    expect(first.settled).toBe(true);
    expect(first.saveData.totalCoins).toBe(200); // 100 default + 100
    expect(first.saveData.inventory).toContain('spiked_collar');

    // Duplicate call with same runId
    const second = service.settleRunRewards(payload);
    expect(second.settled).toBe(false);
    expect(second.saveData.totalCoins).toBe(200); // Did not double add
  });

  it('CombatEngine guarantees one-time enemy death rewards and lifecycle states', () => {
    const waypoints = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ];
    const runState = new BattleRunState(DEFAULT_CREATURE_STATS);
    const engine = new CombatEngine(waypoints, { x: 100, y: 0 }, runState);

    engine.startWave({
      waveIndex: 1,
      enemies: [{ enemyTypeId: 'basic', count: 1, spawnIntervalMs: 0 }],
    });

    engine.update(0.6); // Enemy spawns
    expect(runState.activeEnemies.size).toBe(1);

    const enemy = Array.from(runState.activeEnemies.values())[0];
    expect(enemy.state).toBe('ALIVE');
    expect(enemy.rewardGranted).toBe(false);

    // Force damage to 0 twice
    enemy.currentHp = 0;
    engine.update(0.1);

    expect(runState.coinsCollected).toBe(5); // Basic beetle = 5 coins
    expect(enemy.rewardGranted).toBe(true);

    // Re-trigger update
    engine.update(0.1);
    expect(runState.coinsCollected).toBe(5); // No double coins
  });

  it('Special ability requires Vampiric Bite trait to unlock', () => {
    const waypoints = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ];
    const runState = new BattleRunState(DEFAULT_CREATURE_STATS);
    const engine = new CombatEngine(waypoints, { x: 100, y: 0 }, runState);

    expect(runState.hasSpecialAbility).toBe(false);

    // Apply vampiric_bite trait
    engine.selectTraitOffer(TRAITS_DATA.vampiric_bite);
    expect(runState.hasSpecialAbility).toBe(true);
    expect(runState.activeTraits).toContain('vampiric_bite');
  });

  it('SaveManager updates partial data without overwriting unlockedTraits or tutorialCompleted', () => {
    const initial = SaveManager.loadGame();
    expect(initial.version).toBe(CURRENT_SAVE_SCHEMA_VERSION);
    expect(initial.unlockedTraits.length).toBeGreaterThan(0);

    SaveManager.updateSaveData({ totalCoins: 300 });

    const updated = SaveManager.loadGame();
    expect(updated.totalCoins).toBe(300);
    expect(updated.unlockedTraits).toEqual(initial.unlockedTraits);
    expect(updated.tutorialCompleted).toBe(false);
  });

  it('SaveManager migrates V1 save schema to current version seamlessly', () => {
    const v1Data = {
      version: 1,
      creatureProfile: { ...DEFAULT_CREATURE_PROFILE },
      inventory: ['wooden_collar'],
      totalCoins: 75,
      unlockedTraits: ['sharp_claws'],
    };

    const migrated = SaveManager.migrateSaveData(v1Data);
    expect(migrated.version).toBe(CURRENT_SAVE_SCHEMA_VERSION);
    expect(migrated.totalCoins).toBe(75);
    expect(migrated.unlockedTraits).toEqual(['sharp_claws']);
    expect(migrated.tutorialCompleted).toBe(false);
  });
});
