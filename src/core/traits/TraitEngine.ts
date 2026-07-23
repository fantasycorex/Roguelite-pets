import { TraitConfig } from '../../types/trait';
import { CreatureStats } from '../../types/creature';
import { TRAITS_DATA } from '../../data/traits.data';
import { SeededRandom } from '../utils/SeededRandom';
import { BattleRunState } from '../state/BattleRunState';

export class TraitEngine {
  private rng: SeededRandom;

  constructor(seed: number) {
    this.rng = new SeededRandom(seed);
  }

  /**
   * Generates 3 unique random trait choices from pool
   */
  public generateTraitOffers(count: number = 3): TraitConfig[] {
    const allTraits = Object.values(TRAITS_DATA);
    return this.rng.sample(allTraits, count);
  }

  /**
   * Applies selected trait effect to run state pet stats
   */
  public applyTrait(trait: TraitConfig, runState: BattleRunState): void {
    const { effect } = trait;

    if (effect.type === 'stat_multiplier' && effect.targetStat) {
      const current = runState.petStats[effect.targetStat];
      runState.petStats[effect.targetStat] = current * effect.value;
    } else if (effect.type === 'flat_stat' && effect.targetStat) {
      const current = runState.petStats[effect.targetStat];
      runState.petStats[effect.targetStat] = current + effect.value;
    }

    // Add trait ID to active traits list in run state
    if (!runState.activeTraits) {
      runState.activeTraits = [];
    }
    runState.activeTraits.push(trait.id);
  }

  /**
   * Calculates total modified stats from base stats and trait list
   */
  public calculateModifiedStats(baseStats: CreatureStats, traitIds: string[]): CreatureStats {
    const stats: CreatureStats = { ...baseStats };

    for (const id of traitIds) {
      const trait = TRAITS_DATA[id];
      if (!trait) continue;
      const { effect } = trait;

      if (effect.type === 'stat_multiplier' && effect.targetStat) {
        stats[effect.targetStat] *= effect.value;
      } else if (effect.type === 'flat_stat' && effect.targetStat) {
        stats[effect.targetStat] += effect.value;
      }
    }

    return stats;
  }
}
