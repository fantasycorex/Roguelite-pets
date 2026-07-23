export type DifficultyTier = 'normal' | 'challenging' | 'guardian';
export type EncounterType = 'normal' | 'elite' | 'rest' | 'boss';

export interface EncounterConfig {
  id: string;
  stepIndex: number;
  type: EncounterType;
  name: string;
  description: string;
  enemyHpMultiplier: number;
  enemyDamageMultiplier: number;
  coinMultiplier: number;
}

export interface RunHistoryRecord {
  runId: string;
  timestamp: number;
  creatureName: string;
  speciesId: string;
  mapId: string;
  seed: number;
  difficulty: DifficultyTier;
  traits: string[];
  finalWave: number;
  totalDamageDealt: number;
  isVictory: boolean;
}

export class RunDirector {
  public static getDifficultyMultipliers(difficulty: DifficultyTier): {
    hpMult: number;
    dmgMult: number;
    coinMult: number;
  } {
    switch (difficulty) {
      case 'challenging':
        return { hpMult: 1.25, dmgMult: 1.25, coinMult: 1.2 };
      case 'guardian':
        return { hpMult: 1.5, dmgMult: 1.5, coinMult: 1.4 };
      case 'normal':
      default:
        return { hpMult: 1.0, dmgMult: 1.0, coinMult: 1.0 };
    }
  }

  public static generateEncounterPath(
    seed: number,
    difficulty: DifficultyTier = 'normal',
  ): EncounterConfig[][] {
    const branchChoice = seed % 2 === 0 ? 0 : 1;
    const diff = this.getDifficultyMultipliers(difficulty);
    const path: EncounterConfig[][] = [];

    // Step 1: Normal Encounter
    path.push([
      {
        id: `node_1_${branchChoice}`,
        stepIndex: 1,
        type: 'normal',
        name: 'Frontline Skirmish',
        description: 'Standard wave assault.',
        enemyHpMultiplier: diff.hpMult,
        enemyDamageMultiplier: diff.dmgMult,
        coinMultiplier: diff.coinMult,
      },
    ]);

    // Step 2: Choice between Normal vs Rest node
    path.push([
      {
        id: 'node_2_a',
        stepIndex: 2,
        type: 'normal',
        name: 'Reinforced Patrol',
        description: 'Moderate enemy forces.',
        enemyHpMultiplier: diff.hpMult * 1.05,
        enemyDamageMultiplier: diff.dmgMult * 1.05,
        coinMultiplier: diff.coinMult * 1.1,
      },
      {
        id: 'node_2_b',
        stepIndex: 2,
        type: 'rest',
        name: 'Sanctuary Rest',
        description: 'Restore pet care & tower structural HP.',
        enemyHpMultiplier: 1.0,
        enemyDamageMultiplier: 1.0,
        coinMultiplier: 1.0,
      },
    ]);

    // Step 3: Choice between Elite vs Normal node
    path.push([
      {
        id: 'node_3_a',
        stepIndex: 3,
        type: 'elite',
        name: 'Elite Vanguard ⚔️',
        description: 'High-threat elite enemies granting bonus equipment loot.',
        enemyHpMultiplier: diff.hpMult * 1.35,
        enemyDamageMultiplier: diff.dmgMult * 1.35,
        coinMultiplier: diff.coinMult * 1.5,
      },
      {
        id: 'node_3_b',
        stepIndex: 3,
        type: 'normal',
        name: 'Winding Siege',
        description: 'Heavy enemy numbers.',
        enemyHpMultiplier: diff.hpMult * 1.1,
        enemyDamageMultiplier: diff.dmgMult * 1.1,
        coinMultiplier: diff.coinMult * 1.15,
      },
    ]);

    // Step 4: Pre-boss Rest / Prep Node
    path.push([
      {
        id: 'node_4_a',
        stepIndex: 4,
        type: 'rest',
        name: 'Pre-Boss Fortress Rest',
        description: 'Restore pet & tower HP before the Sovereign boss.',
        enemyHpMultiplier: 1.0,
        enemyDamageMultiplier: 1.0,
        coinMultiplier: 1.0,
      },
    ]);

    // Step 5: Boss Node
    path.push([
      {
        id: 'node_5_a',
        stepIndex: 5,
        type: 'boss',
        name: 'Void Sovereign Boss 👑',
        description: 'Two-phase boss encounter with enrage & telegraph bursts.',
        enemyHpMultiplier: diff.hpMult * 1.5,
        enemyDamageMultiplier: diff.dmgMult * 1.5,
        coinMultiplier: diff.coinMult * 2.0,
      },
    ]);

    return path;
  }
}
