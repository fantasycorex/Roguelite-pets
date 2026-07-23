import { EnemyConfig } from '../../types/enemy';
import { EquipmentConfig } from '../../types/equipment';
import { EQUIPMENT_DATA } from '../../data/equipment.data';
import { SeededRandom } from '../utils/SeededRandom';

export interface LootDropResult {
  coins: number;
  exp: number;
  equipment: EquipmentConfig | null;
}

export class LootEngine {
  /**
   * Generates loot rewards on enemy defeat
   */
  public static rollLoot(
    enemyConfig: EnemyConfig,
    rng: SeededRandom,
    dropChancePct: number = 20, // 20% chance for equipment drop
  ): LootDropResult {
    const coins = enemyConfig.coinReward;
    const exp = enemyConfig.expReward;

    let equipment: EquipmentConfig | null = null;
    const roll = rng.nextInt(1, 100);

    if (roll <= dropChancePct) {
      const allEquip = Object.values(EQUIPMENT_DATA);
      equipment = rng.choice(allEquip);
    }

    return { coins, exp, equipment };
  }
}
