export interface TargetableEnemy {
  instanceId: string;
  x: number;
  y: number;
  currentHp: number;
  distanceCovered: number;
}

export class TargetingEngine {
  /**
   * Returns nearest enemy within range, prioritized by highest distanceCovered along path (closest to tower)
   */
  public static selectTarget<T extends TargetableEnemy>(
    petX: number,
    petY: number,
    attackRange: number,
    enemies: T[],
  ): T | null {
    let bestTarget: T | null = null;
    let maxDistanceCovered = -1;

    for (const enemy of enemies) {
      if (enemy.currentHp <= 0) continue;

      const distToPet = Math.hypot(enemy.x - petX, enemy.y - petY);
      if (distToPet <= attackRange) {
        if (enemy.distanceCovered > maxDistanceCovered) {
          maxDistanceCovered = enemy.distanceCovered;
          bestTarget = enemy;
        }
      }
    }

    return bestTarget;
  }
}
