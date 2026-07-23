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
   * Generates N weighted, eligible trait choices respecting prerequisites, stack limits, and duplicate protection
   */
  public generateTraitOffers(count: number = 3, activeTraits: string[] = []): TraitConfig[] {
    const allTraits = Object.values(TRAITS_DATA);

    // Count current active trait stacks
    const stackCounts: Record<string, number> = {};
    for (const id of activeTraits) {
      stackCounts[id] = (stackCounts[id] || 0) + 1;
    }

    // Filter eligible traits
    const eligible = allTraits.filter((t) => {
      // 1. Stack limit check
      if (t.maxStacks && (stackCounts[t.id] || 0) >= t.maxStacks) {
        return false;
      }
      // 2. Prerequisites check
      if (t.prerequisites && t.prerequisites.length > 0) {
        const hasAllPrereqs = t.prerequisites.every((preId) => activeTraits.includes(preId));
        if (!hasAllPrereqs) return false;
      }
      return true;
    });

    if (eligible.length === 0) return [];

    // Weighted random sampling without replacement
    const offers: TraitConfig[] = [];
    const pool = [...eligible];

    while (offers.length < count && pool.length > 0) {
      const totalWeight = pool.reduce((sum, t) => sum + (t.weight || 100), 0);
      let rand = this.rng.nextFloat() * totalWeight;

      for (let i = 0; i < pool.length; i++) {
        const t = pool[i];
        rand -= t.weight || 100;
        if (rand <= 0) {
          offers.push(t);
          pool.splice(i, 1);
          break;
        }
      }
    }

    return offers;
  }

  /**
   * Applies selected trait effect to run state pet stats & abilities
   */
  public applyTrait(trait: TraitConfig, runState: BattleRunState): void {
    const { effect } = trait;

    if (effect.type === 'stat_multiplier' && effect.targetStat) {
      const current = runState.petStats[effect.targetStat];
      runState.petStats[effect.targetStat] = current * effect.value;
    } else if (effect.type === 'flat_stat' && effect.targetStat) {
      const current = runState.petStats[effect.targetStat];
      runState.petStats[effect.targetStat] = current + effect.value;
    } else if (effect.type === 'special_ability') {
      runState.hasSpecialAbility = true;
    } else if (effect.type === 'tower_support') {
      runState.towerHp = Math.min(runState.maxTowerHp, runState.towerHp + effect.value);
    }

    // Sync HP changes
    runState.creatureMaxHp = runState.petStats.maxHp;

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
