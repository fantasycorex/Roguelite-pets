import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventBus } from '../src/core/events/EventBus';
import { PhaseManager } from '../src/core/state/PhaseManager';
import { GamePhase } from '../src/types/phase';

describe('Smoke Test - Core Architecture', () => {
  let eventBus: EventBus;
  let phaseManager: PhaseManager;

  beforeEach(() => {
    eventBus = EventBus.getInstance();
    eventBus.clear();
    phaseManager = new PhaseManager();
  });

  it('EventBus correctly subscribes and emits events', () => {
    const callback = vi.fn();
    eventBus.on('TEST_EVENT', callback);

    eventBus.emit('TEST_EVENT', { data: 123 });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith({ data: 123 });
  });

  it('PhaseManager initializes to HABITAT phase', () => {
    expect(phaseManager.getPhase()).toBe(GamePhase.HABITAT);
  });

  it('PhaseManager transitions phase and triggers EventBus event', () => {
    const listener = vi.fn();
    eventBus.on('PHASE_CHANGED', listener);

    phaseManager.setPhase(GamePhase.DEFENSE);

    expect(phaseManager.getPhase()).toBe(GamePhase.DEFENSE);
    expect(listener).toHaveBeenCalledWith({
      oldPhase: GamePhase.HABITAT,
      newPhase: GamePhase.DEFENSE,
    });
  });
});
