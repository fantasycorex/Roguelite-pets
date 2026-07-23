import { OwnedCreature, PermanentCreatureProfile } from '../../types/creature';

export interface CareBonus {
  damageMultiplier: number;
  speedMultiplier: number;
  hpMultiplier: number;
}

export type PetMood = 'Happy' | 'Neutral' | 'Tired';

export class PetCareEngine {
  private static lastPetTimestamp: number = 0;
  private static rapidPetCount: number = 0;

  /**
   * Consumes food to increase fullness and slightly boost affection
   */
  public static feedPet(
    creature: OwnedCreature | PermanentCreatureProfile,
    amount: number = 25,
  ): {
    fullness: number;
    hunger: number;
    affection: number;
  } {
    if ('fullness' in creature) {
      creature.fullness = Math.min(100, Math.max(0, creature.fullness + amount));
      creature.affection = Math.min(100, Math.max(0, creature.affection + 5));
      return {
        fullness: creature.fullness,
        hunger: creature.fullness,
        affection: creature.affection,
      };
    } else {
      creature.hunger = Math.min(100, Math.max(0, creature.hunger + amount));
      creature.affection = Math.min(100, Math.max(0, creature.affection + 5));
      creature.lastCareTimestamp = Date.now();
      return { fullness: creature.hunger, hunger: creature.hunger, affection: creature.affection };
    }
  }

  /**
   * Tapping/petting creature to boost affection with diminishing returns on rapid petting
   */
  public static petCreature(
    creature: OwnedCreature | PermanentCreatureProfile,
    amount: number = 10,
  ): {
    fullness: number;
    hunger: number;
    affection: number;
    mood: PetMood;
    gainedAffection: number;
  } {
    const now = Date.now();
    const elapsedSinceLastPet = (now - this.lastPetTimestamp) / 1000;
    this.lastPetTimestamp = now;

    if (elapsedSinceLastPet < 3.0) {
      this.rapidPetCount++;
    } else {
      this.rapidPetCount = 0;
    }

    let multiplier = 1.0;
    let mood: PetMood = 'Happy';

    if (this.rapidPetCount >= 2) {
      multiplier = 0.2;
      mood = 'Tired';
    } else if (this.rapidPetCount >= 1) {
      multiplier = 0.5;
      mood = 'Neutral';
    }

    const gainedAffection = Math.max(1, Math.round(amount * multiplier));
    creature.affection = Math.min(100, Math.max(0, creature.affection + gainedAffection));

    const currentFullness = 'fullness' in creature ? creature.fullness : creature.hunger;

    return {
      fullness: currentFullness,
      hunger: currentFullness,
      affection: creature.affection,
      mood,
      gainedAffection,
    };
  }

  /**
   * Resets petting cooldown state
   */
  public static resetPettingCooldown(): void {
    this.rapidPetCount = 0;
    this.lastPetTimestamp = 0;
  }

  /**
   * Applies gradual fullness decay over elapsed time
   */
  public static updateCareDecay(
    creature: OwnedCreature | PermanentCreatureProfile,
    deltaSeconds: number,
    decayRatePerSec: number = 0.5,
  ): void {
    if ('fullness' in creature) {
      creature.fullness = Math.max(0, creature.fullness - deltaSeconds * decayRatePerSec);
    } else {
      creature.hunger = Math.max(0, creature.hunger - deltaSeconds * decayRatePerSec);
    }
  }

  /**
   * Calculates Care-to-Combat stat multipliers based on fullness and affection levels
   */
  public static calculateCareBonus(creature: OwnedCreature | PermanentCreatureProfile): CareBonus {
    let damageMultiplier = 1.0;
    let speedMultiplier = 1.0;
    let hpMultiplier = 1.0;

    const fullness = 'fullness' in creature ? creature.fullness : creature.hunger;
    const affection = creature.affection;

    // Full belly bonus (fullness >= 80)
    if (fullness >= 80) {
      damageMultiplier += 0.15; // +15% damage
    } else if (fullness < 25) {
      damageMultiplier -= 0.15; // -15% damage penalty if starving
    }

    // High affection bonus (affection >= 80)
    if (affection >= 80) {
      speedMultiplier += 0.15; // +15% attack speed
      hpMultiplier += 0.1; // +10% max HP
    } else if (affection < 25) {
      speedMultiplier -= 0.1; // -10% attack speed penalty
    }

    return { damageMultiplier, speedMultiplier, hpMultiplier };
  }
}
