import { OwnedCreature, CreatureStats } from '../../types/creature';
import { CareService } from './CareService';
import { CreatureEngine } from '../creature/CreatureEngine';
import { EquipmentEngine } from '../equipment/EquipmentEngine';
import { FoodBuffType } from '../../types/food';

export interface PreparedRunPayload {
  petStats: CreatureStats;
  speciesId: string;
  fullness: number;
  affection: number;
  activeNextRunBuff?: { type: FoodBuffType; multiplier: number };
}

export class RunPreparationService {
  public static prepareRun(
    creature: OwnedCreature,
    activeNextRunBuff?: { type: FoodBuffType; multiplier: number },
  ): PreparedRunPayload {
    const careBonus = CareService.getCareBonus(creature);
    const baseStats = CreatureEngine.getEffectiveStats(creature);
    const effectiveStats = EquipmentEngine.getEffectiveStats(creature, baseStats);

    let speedMult = careBonus.speedMultiplier;
    if (activeNextRunBuff?.type === 'speed_buff') {
      speedMult *= activeNextRunBuff.multiplier;
    }

    const modifiedStats: CreatureStats = {
      ...effectiveStats,
      attackDamage: Math.round(effectiveStats.attackDamage * careBonus.damageMultiplier),
      attackSpeed: effectiveStats.attackSpeed * speedMult,
      maxHp: Math.round(effectiveStats.maxHp * careBonus.hpMultiplier),
    };

    return {
      petStats: modifiedStats,
      speciesId: creature.speciesId,
      fullness: creature.fullness,
      affection: creature.affection,
      activeNextRunBuff,
    };
  }
}
