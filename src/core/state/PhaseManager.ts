import { GamePhase } from '../../types/phase';
import { eventBus } from '../events/EventBus';

export class PhaseManager {
  private currentPhase: GamePhase = GamePhase.HABITAT;

  public getPhase(): GamePhase {
    return this.currentPhase;
  }

  public setPhase(newPhase: GamePhase): void {
    if (this.currentPhase === newPhase) return;
    const oldPhase = this.currentPhase;
    this.currentPhase = newPhase;
    eventBus.emit('PHASE_CHANGED', { oldPhase, newPhase });
  }
}

export const phaseManager = new PhaseManager();
