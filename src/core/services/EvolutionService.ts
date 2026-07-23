import { OwnedCreature } from '../../types/creature';
import { CreatureEngine } from '../creature/CreatureEngine';

export class EvolutionService {
  public static canEvolve(creature: OwnedCreature): boolean {
    return CreatureEngine.canEvolve(creature);
  }

  public static evolve(creature: OwnedCreature): boolean {
    return CreatureEngine.evolveCreature(creature);
  }
}
