import { describe, it, expect, beforeEach } from 'vitest';
import { CombatEngine } from '../src/core/combat/CombatEngine';
import { PathEngine } from '../src/core/combat/PathEngine';
import { BattleRunState } from '../src/core/state/BattleRunState';
import { DEFAULT_CREATURE_STATS } from '../src/data/creatures.data';
import { ENEMIES_DATA } from '../src/data/enemies.data';
import { MAPS_DATA } from '../src/data/maps.data';
import { eventBus } from '../src/core/events/EventBus';

describe('Milestone 12 — Maps, Enemies & Boss Encounter Unit Tests', () => {
  let runStateMap1: BattleRunState;
  let runStateMap2: BattleRunState;

  beforeEach(() => {
    runStateMap1 = new BattleRunState(DEFAULT_CREATURE_STATS, 'heartwood_clearing');
    runStateMap2 = new BattleRunState(DEFAULT_CREATURE_STATS, 'moonlit_crossing');
  });

  it('supports Map 1 (single track) and Map 2 (dual merging tracks) in PathEngine', () => {
    const path1 = new PathEngine(MAPS_DATA.heartwood_clearing.waypoints);
    const path2 = new PathEngine(
      MAPS_DATA.moonlit_crossing.waypoints,
      MAPS_DATA.moonlit_crossing.secondaryWaypoints,
    );

    // Map 1 track 0
    const pos1 = path1.getPositionAlongPath(0);
    expect(pos1.x).toBe(-30);
    expect(pos1.y).toBe(360);

    // Map 2 track 0 (Top-left) vs track 1 (Bottom-left)
    const posTrack0 = path2.getPositionAlongPath(0, 0);
    const posTrack1 = path2.getPositionAlongPath(0, 1);

    expect(posTrack0.y).toBe(120);
    expect(posTrack1.y).toBe(600);
  });

  it('contains 6 distinct enemy types + 1 two-phase Boss', () => {
    const enemyKeys = Object.keys(ENEMIES_DATA);
    expect(enemyKeys).toContain('basic');
    expect(enemyKeys).toContain('fast');
    expect(enemyKeys).toContain('tank');
    expect(enemyKeys).toContain('spitter');
    expect(enemyKeys).toContain('wisp');
    expect(enemyKeys).toContain('saboteur');
    expect(enemyKeys).toContain('boss_sovereign');

    expect(ENEMIES_DATA.spitter.behaviour?.style).toBe('ranged_path');
    expect(ENEMIES_DATA.boss_sovereign.isBoss).toBe(true);
  });

  it('handles ranged_path enemy (spitter) stopping on path to shoot from range', () => {
    const engine = new CombatEngine(
      runStateMap1.mapConfig.waypoints,
      runStateMap1.mapConfig.towerPosition,
      runStateMap1,
    );

    engine.startWave({
      waveIndex: 1,
      enemies: [{ enemyTypeId: 'spitter', count: 1, spawnIntervalMs: 0 }],
    });

    engine.update(0.6); // Spawns spitter
    const spitter = Array.from(runStateMap1.activeEnemies.values())[0];
    expect(spitter.config.id).toBe('spitter');

    // Move spitter close to tower attack range (900px along path)
    spitter.distanceCovered = 900;
    const pos = engine.getPathEngine().getPositionAlongPath(900);
    spitter.x = pos.x;
    spitter.y = pos.y;

    const initialDistance = spitter.distanceCovered;
    engine.update(1.0);

    // Spitter should pause path progression to shoot from range
    expect(spitter.distanceCovered).toBe(initialDistance);
  });

  it('triggers Void Sovereign 2-Phase transition and enrage at 50% HP threshold', () => {
    const engine = new CombatEngine(
      runStateMap2.mapConfig.waypoints,
      runStateMap2.mapConfig.towerPosition,
      runStateMap2,
    );

    let phaseChangedEmitted = false;
    let telegraphEmitted = false;

    eventBus.on('BOSS_PHASE_CHANGED', () => {
      phaseChangedEmitted = true;
    });
    eventBus.on('BOSS_TELEGRAPH', () => {
      telegraphEmitted = true;
    });

    engine.startWave({
      waveIndex: 5,
      enemies: [{ enemyTypeId: 'boss_sovereign', count: 1, spawnIntervalMs: 0 }],
    });

    engine.update(0.6);
    const boss = Array.from(runStateMap2.activeEnemies.values())[0];
    expect(boss.config.isBoss).toBe(true);
    expect(boss.bossPhase).toBe(1);

    // Reduce Boss HP to <= 50% (500 maxHp -> 240 currentHp)
    boss.currentHp = 240;
    engine.update(0.1);

    expect(boss.bossPhase).toBe(2);
    expect(boss.bossEnraged).toBe(true);
    expect(phaseChangedEmitted).toBe(true);
    expect(telegraphEmitted).toBe(true);

    // Minion reinforcements spawned
    expect(runStateMap2.activeEnemies.size).toBeGreaterThan(1);
  });
});
