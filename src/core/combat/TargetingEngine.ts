import { TargetingMode } from '../../types/combat';

export interface TargetableEnemy {
  instanceId: string;
  x: number;
  y: number;
  currentHp: number;
  maxHp: number;
  distanceCovered: number;
  damageToTower?: number;
  config?: { damageToTower?: number };
}

export class TargetingEngine {
  /**
   * Selects target enemy based on targeting mode and attack range
   */
  public static selectTarget(
    petX: number,
    petY: number,
    attackRange: number,
    enemies: TargetableEnemy[],
    mode: TargetingMode = 'closest_to_tower',
  ): TargetableEnemy | null {
    const inRangeEnemies = enemies.filter((enemy) => {
      if (enemy.currentHp <= 0) return false;
      const dist = Math.hypot(enemy.x - petX, enemy.y - petY);
      return dist <= attackRange;
    });

    if (inRangeEnemies.length === 0) {
      return null;
    }

    switch (mode) {
      case 'nearest': {
        let bestEnemy: TargetableEnemy | null = null;
        let minDist = Infinity;
        for (const enemy of inRangeEnemies) {
          const dist = Math.hypot(enemy.x - petX, enemy.y - petY);
          if (dist < minDist) {
            minDist = dist;
            bestEnemy = enemy;
          }
        }
        return bestEnemy;
      }

      case 'lowest_hp': {
        let bestEnemy: TargetableEnemy | null = null;
        let minHp = Infinity;
        for (const enemy of inRangeEnemies) {
          if (enemy.currentHp < minHp) {
            minHp = enemy.currentHp;
            bestEnemy = enemy;
          }
        }
        return bestEnemy;
      }

      case 'highest_threat': {
        let bestEnemy: TargetableEnemy | null = null;
        let maxThreat = -1;
        for (const enemy of inRangeEnemies) {
          const threat = enemy.config?.damageToTower ?? enemy.damageToTower ?? 10;
          if (threat > maxThreat) {
            maxThreat = threat;
            bestEnemy = enemy;
          }
        }
        return bestEnemy;
      }

      case 'closest_to_tower':
      default: {
        let bestEnemy: TargetableEnemy | null = null;
        let maxDistCovered = -1;
        for (const enemy of inRangeEnemies) {
          if (enemy.distanceCovered > maxDistCovered) {
            maxDistCovered = enemy.distanceCovered;
            bestEnemy = enemy;
          }
        }
        return bestEnemy;
      }
    }
  }
}
