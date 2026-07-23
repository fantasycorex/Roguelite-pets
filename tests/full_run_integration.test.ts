import { describe, it, expect, beforeEach } from 'vitest';
import { SaveManager } from '../src/core/save/SaveManager';
import { PetCareEngine } from '../src/core/pet/PetCareEngine';
import { CreatureEngine } from '../src/core/creature/CreatureEngine';
import { EquipmentEngine } from '../src/core/equipment/EquipmentEngine';
import { BattleRunState } from '../src/core/state/BattleRunState';
import { CombatEngine } from '../src/core/combat/CombatEngine';
import { runRewardSettlementService } from '../src/core/services/RunRewardSettlementService';
import { WAVES_DATA_MAP1 } from '../src/data/waves.data';

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

describe('Milestone 15 — Full Run Integration Test (Habitat -> Defense -> Results -> Save)', () => {
  beforeEach(() => {
    localStorageMock.clear();
    runRewardSettlementService.clearSettledRuns();
  });

  it('executes a complete end-to-end game run flow successfully', () => {
    // 1. Initialise & load game state from SaveManager
    const save = SaveManager.loadGame();
    expect(save.totalCoins).toBe(100);

    const activeCreature = SaveManager.getActiveCreature(save);
    expect(activeCreature.nickname).toBe('Ironback Slime');

    // 2. Perform Pet Care in Habitat (Feed & Pet)
    PetCareEngine.feedPet(activeCreature, 25);
    PetCareEngine.petCreature(activeCreature, 50);
    expect(activeCreature.fullness).toBe(100);
    expect(activeCreature.affection).toBe(100);

    // 3. Equip an Item from inventory
    EquipmentEngine.equipItem(activeCreature, save.inventory, 'wooden_collar');
    expect(activeCreature.equippedItems.collar).toBe('wooden_collar');

    // 4. Calculate effective combat stats & care bonus
    const careBonus = PetCareEngine.calculateCareBonus(activeCreature);
    const baseStats = CreatureEngine.getEffectiveStats(activeCreature);
    const effectiveStats = EquipmentEngine.getEffectiveStats(activeCreature, baseStats);

    expect(careBonus.damageMultiplier).toBeGreaterThan(1.0);
    expect(effectiveStats.attackDamage).toBeGreaterThan(baseStats.attackDamage);

    // 5. Launch Defense Run
    const runState = new BattleRunState(
      effectiveStats,
      'heartwood_clearing',
      activeCreature.speciesId,
      activeCreature.fullness,
      activeCreature.affection,
    );

    const combatEngine = new CombatEngine(
      runState.mapConfig.waypoints,
      runState.mapConfig.towerPosition,
      runState,
    );

    // 6. Simulate Wave 1 Combat Updates
    combatEngine.startWave(WAVES_DATA_MAP1[0]);
    for (let i = 0; i < 50; i++) {
      combatEngine.update(0.1);
    }

    // 7. Simulate Run End & Settle Rewards via RunRewardSettlementService
    const settlement = runRewardSettlementService.settleRunRewards({
      runId: runState.runId,
      coinsEarned: 50,
      expEarned: 120, // Enough EXP to trigger level up from Lv 1 -> Lv 2
      droppedEquipment: ['ruby_pendant'],
      expMultiplier: 1.1, // +10% Gourmet Treat buff
    });

    expect(settlement.settled).toBe(true);
    expect(settlement.saveData.totalCoins).toBe(150);
    expect(settlement.saveData.inventory).toContain('ruby_pendant');

    // 8. Verify Persisted Save Data
    const postRunSave = SaveManager.loadGame();
    const updatedCreature = SaveManager.getActiveCreature(postRunSave);

    expect(postRunSave.totalCoins).toBe(150);
    expect(updatedCreature.level).toBe(2);
  });
});
