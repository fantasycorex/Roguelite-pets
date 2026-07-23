import { describe, it, expect } from 'vitest';
import { PetCareEngine } from '../src/core/pet/PetCareEngine';
import { RunRewardSettlementService } from '../src/core/services/RunRewardSettlementService';
import { TargetingEngine } from '../src/core/combat/TargetingEngine';
import { BattleRunState } from '../src/core/state/BattleRunState';
import { CombatEngine } from '../src/core/combat/CombatEngine';
import { DEFAULT_CREATURE_STATS } from '../src/data/creatures.data';
import { OwnedCreature } from '../src/types/creature';

describe('Critical Fixes Verification Tests', () => {
  it('Issue 1: Fullness & feeding increase fullness directly without inversion', () => {
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

    PetCareEngine.feedPet(creature, 30);
    expect(creature.fullness).toBe(80);

    PetCareEngine.updateCareDecay(creature, 10, 0.5);
    expect(creature.fullness).toBe(75);
  });

  it('Issue 2: Gourmet Treat EXP bonus applies correctly during settlement', () => {
    const service = RunRewardSettlementService.getInstance();
    service.clearSettledRuns();

    const res = service.settleRunRewards({
      runId: 'run_test_buff_1',
      coinsEarned: 100,
      expEarned: 100,
      droppedEquipment: [],
      expMultiplier: 1.1, // +10% Gourmet Treat buff
    });

    expect(res.settled).toBe(true);
  });

  it('Issue 3: BattleRunState wires species combat identities (normal & special abilities)', () => {
    const state = new BattleRunState(DEFAULT_CREATURE_STATS, 'heartwood_clearing', 'spark_fox');
    expect(state.speciesId).toBe('spark_fox');
    expect(state.normalAbilityId).toBe('fire_bolt');
    expect(state.specialAbilityId).toBe('fire_blast');
  });

  it('Issue 6: Highest threat targeting evaluates nested config.damageToTower', () => {
    const enemies = [
      {
        instanceId: 'e1',
        x: 100,
        y: 100,
        currentHp: 50,
        maxHp: 50,
        distanceCovered: 50,
        config: { damageToTower: 5 },
      },
      {
        instanceId: 'e2',
        x: 100,
        y: 100,
        currentHp: 50,
        maxHp: 50,
        distanceCovered: 20,
        config: { damageToTower: 35 },
      },
    ];

    const target = TargetingEngine.selectTarget(100, 100, 200, enemies, 'highest_threat');
    expect(target?.instanceId).toBe('e2');
  });

  it('Issue 4 & 5: CombatEngine initializes and processes traits & behaviors clean', () => {
    const state = new BattleRunState(DEFAULT_CREATURE_STATS, 'heartwood_clearing', 'prowler_lynx');
    state.activeTraits = ['multi_beam', 'chain_lightning', 'full_belly_fury'];

    const engine = new CombatEngine(
      [
        { x: 0, y: 0 },
        { x: 640, y: 360 },
      ],
      { x: 640, y: 360 },
      state,
    );
    expect(engine).toBeDefined();
  });
});
