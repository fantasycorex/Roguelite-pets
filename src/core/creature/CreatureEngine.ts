import { OwnedCreature, CreatureStats } from '../../types/creature';
import { SPECIES_DATA } from '../../data/species.data';

export class CreatureEngine {
  /**
   * Calculates total EXP required to reach next level from current level
   */
  public static getExpForNextLevel(level: number): number {
    return Math.floor(100 * Math.pow(level, 1.2));
  }

  /**
   * Resolves EXP gained from a run into level gains and leftover EXP
   */
  public static addExpToCreature(
    creature: OwnedCreature,
    expAmount: number,
  ): { levelsGained: number; newLevel: number; newExp: number } {
    let currentLevel = creature.level;
    let currentExp = creature.currentExp + Math.max(0, expAmount);
    let levelsGained = 0;

    let required = this.getExpForNextLevel(currentLevel);
    while (currentExp >= required) {
      currentExp -= required;
      currentLevel++;
      levelsGained++;
      required = this.getExpForNextLevel(currentLevel);
    }

    creature.level = currentLevel;
    creature.currentExp = currentExp;

    return {
      levelsGained,
      newLevel: currentLevel,
      newExp: currentExp,
    };
  }

  /**
   * Computes effective combat stats for a creature based on species base stats, growth curves, and level
   */
  public static getEffectiveStats(creature: OwnedCreature): CreatureStats {
    const species = SPECIES_DATA[creature.speciesId] || SPECIES_DATA.guardian_blob;
    const levelOffset = Math.max(0, creature.level - 1);
    const growth = species.statGrowthPerLevel;

    const stats: CreatureStats = {
      maxHp: species.baseStats.maxHp + (growth.maxHp || 0) * levelOffset,
      attackDamage: species.baseStats.attackDamage + (growth.attackDamage || 0) * levelOffset,
      attackSpeed: Number(
        (species.baseStats.attackSpeed + (growth.attackSpeed || 0) * levelOffset).toFixed(2),
      ),
      attackRange: species.baseStats.attackRange + (growth.attackRange || 0) * levelOffset,
      moveSpeed: species.baseStats.moveSpeed + (growth.moveSpeed || 0) * levelOffset,
      specialCooldown: Math.max(
        2.0,
        species.baseStats.specialCooldown - (growth.specialCooldown || 0) * levelOffset,
      ),
    };

    return stats;
  }

  /**
   * Checks if creature satisfies evolution prerequisites (Level 5+ & Stage 1)
   */
  public static canEvolve(creature: OwnedCreature): boolean {
    const species = SPECIES_DATA[creature.speciesId];
    if (!species || species.evolutionIds.length === 0) return false;
    return creature.level >= 5 && creature.evolutionStage === 1;
  }

  /**
   * Evolves creature to Stage 2 species
   */
  public static evolveCreature(creature: OwnedCreature): boolean {
    if (!this.canEvolve(creature)) return false;

    const species = SPECIES_DATA[creature.speciesId];
    const targetSpeciesId = species.evolutionIds[0];
    const targetSpecies = SPECIES_DATA[targetSpeciesId];

    if (!targetSpecies) return false;

    creature.speciesId = targetSpeciesId;
    creature.evolutionStage = 2;
    creature.nickname = targetSpecies.name;
    return true;
  }

  /**
   * Instantiates default owned creatures for a new save game
   */
  public static createDefaultOwnedCreatures(): OwnedCreature[] {
    return [
      {
        instanceId: 'c_guardian_1',
        speciesId: 'guardian_blob',
        nickname: 'Ironback Slime',
        level: 1,
        currentExp: 0,
        evolutionStage: 1,
        affection: 50,
        fullness: 80,
        personalityTraits: ['protective'],
        equippedItems: { collar: 'wooden_collar', charm: null, toy: null },
      },
      {
        instanceId: 'c_spark_1',
        speciesId: 'spark_fox',
        nickname: 'Ember Sprite',
        level: 1,
        currentExp: 0,
        evolutionStage: 1,
        affection: 50,
        fullness: 80,
        personalityTraits: ['feisty'],
        equippedItems: { collar: null, charm: null, toy: null },
      },
      {
        instanceId: 'c_prowler_1',
        speciesId: 'prowler_lynx',
        nickname: 'Shadow Stalker',
        level: 1,
        currentExp: 0,
        evolutionStage: 1,
        affection: 50,
        fullness: 80,
        personalityTraits: ['swift'],
        equippedItems: { collar: null, charm: null, toy: null },
      },
    ];
  }
}
