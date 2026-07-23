import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PathEngine } from '../src/core/combat/PathEngine';
import { TargetingEngine, TargetableEnemy } from '../src/core/combat/TargetingEngine';
import { CombatEngine } from '../src/core/combat/CombatEngine';
import { BattleRunState } from '../src/core/state/BattleRunState';
import { DEFAULT_CREATURE_STATS } from '../src/data/creatures.data';
import { eventBus } from '../src/core/events/EventBus';

describe('PathEngine Tests', () => {
  it('correctly calculates total path distance and position along path', () => {
    const waypoints = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
    ];
    const path = new PathEngine(waypoints);

    expect(path.getTotalLength()).toBe(200);

    const pos0 = path.getPositionAlongPath(0);
    expect(pos0).toEqual({ x: 0, y: 0, reachedEnd: false });

    const pos50 = path.getPositionAlongPath(50);
    expect(pos50).toEqual({ x: 50, y: 0, reachedEnd: false });

    const pos150 = path.getPositionAlongPath(150);
    expect(pos150).toEqual({ x: 100, y: 50, reachedEnd: false });

    const posEnd = path.getPositionAlongPath(200);
    expect(posEnd.reachedEnd).toBe(true);
    expect(posEnd.x).toBe(100);
    expect(posEnd.y).toBe(100);
  });
});

describe('TargetingEngine Tests', () => {
  it('prioritizes target closest to tower within attack range', () => {
    const petX = 50;
    const petY = 50;
    const range = 60;

    const enemies: TargetableEnemy[] = [
      { instanceId: '1', x: 200, y: 200, currentHp: 50, maxHp: 50, distanceCovered: 150 }, // Out of range
      { instanceId: '2', x: 70, y: 50, currentHp: 50, maxHp: 50, distanceCovered: 80 }, // In range
      { instanceId: '3', x: 60, y: 50, currentHp: 50, maxHp: 50, distanceCovered: 120 }, // In range, further down path
    ];

    const target = TargetingEngine.selectTarget(petX, petY, range, enemies);
    expect(target).not.toBeNull();
    expect(target?.instanceId).toBe('3');
  });

  it('returns null if no enemies in attack range', () => {
    const target = TargetingEngine.selectTarget(0, 0, 10, [
      { instanceId: '1', x: 100, y: 100, currentHp: 50, maxHp: 50, distanceCovered: 50 },
    ]);
    expect(target).toBeNull();
  });
});

describe('CombatEngine Integration Tests', () => {
  let combatEngine: CombatEngine;
  let runState: BattleRunState;

  beforeEach(() => {
    eventBus.clear();
    const waypoints = [
      { x: 0, y: 0 },
      { x: 200, y: 0 },
    ];
    const towerCenter = { x: 200, y: 0 };
    runState = new BattleRunState(DEFAULT_CREATURE_STATS);
    combatEngine = new CombatEngine(waypoints, towerCenter, runState);
  });

  it('spawns enemies and completes wave when destroyed', () => {
    const waveCompletedListener = vi.fn();
    eventBus.on('WAVE_COMPLETED', waveCompletedListener);

    const waveConfig = {
      waveIndex: 1,
      enemies: [{ enemyTypeId: 'basic', count: 1, spawnIntervalMs: 100 }],
    };

    combatEngine.startWave(waveConfig);

    // Update 1 sec -> enemy spawns and moves
    combatEngine.update(1.0);
    expect(runState.activeEnemies.size).toBe(1);

    // Simulate pet attacks damaging & destroying enemy
    const activeEnemy = Array.from(runState.activeEnemies.values())[0];
    activeEnemy.currentHp = 0; // force kill

    // Update next frame -> enemy removed, wave completed
    combatEngine.update(0.1);
    expect(runState.activeEnemies.size).toBe(0);
    expect(waveCompletedListener).toHaveBeenCalledWith({
      waveIndex: 1,
      coinsEarned: 5,
    });
  });

  it('damages tower when enemy reaches end of path', () => {
    const towerDamagedListener = vi.fn();
    eventBus.on('TOWER_DAMAGED', towerDamagedListener);

    const waveConfig = {
      waveIndex: 1,
      enemies: [{ enemyTypeId: 'basic', count: 1, spawnIntervalMs: 0 }],
    };

    combatEngine.startWave(waveConfig);

    // Update enough time for enemy to travel full distance (200px at speed 60px/s = ~3.5s)
    combatEngine.update(4.0);

    expect(towerDamagedListener).toHaveBeenCalled();
    expect(runState.towerHp).toBeLessThan(100);
  });
});
