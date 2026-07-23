import { PermanentCreatureProfile } from '../../types/creature';

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
   * Consumes food to reduce hunger and slightly boost affection
   */
  public static feedPet(
    profile: PermanentCreatureProfile,
    amount: number = 25,
  ): {
    hunger: number;
    affection: number;
  } {
    profile.hunger = Math.min(100, Math.max(0, profile.hunger + amount));
    profile.affection = Math.min(100, Math.max(0, profile.affection + 5));
    profile.lastCareTimestamp = Date.now();
    return { hunger: profile.hunger, affection: profile.affection };
  }

  /**
   * Tapping/petting creature to boost affection with diminishing returns on rapid petting
   */
  public static petCreature(
    profile: PermanentCreatureProfile,
    amount: number = 10,
  ): {
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
    profile.affection = Math.min(100, Math.max(0, profile.affection + gainedAffection));
    profile.lastCareTimestamp = now;

    return {
      hunger: profile.hunger,
      affection: profile.affection,
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
   * Applies gradual hunger decay over elapsed time
   */
  public static updateCareDecay(
    profile: PermanentCreatureProfile,
    deltaSeconds: number,
    decayRatePerSec: number = 0.5,
  ): void {
    profile.hunger = Math.max(0, profile.hunger - deltaSeconds * decayRatePerSec);
  }

  /**
   * Calculates Care-to-Combat stat multipliers based on hunger and affection levels
   */
  public static calculateCareBonus(profile: PermanentCreatureProfile): CareBonus {
    let damageMultiplier = 1.0;
    let speedMultiplier = 1.0;
    let hpMultiplier = 1.0;

    // Full belly bonus (hunger >= 80)
    if (profile.hunger >= 80) {
      damageMultiplier += 0.15; // +15% damage
    } else if (profile.hunger < 25) {
      damageMultiplier -= 0.15; // -15% damage penalty if starving
    }

    // High affection bonus (affection >= 80)
    if (profile.affection >= 80) {
      speedMultiplier += 0.15; // +15% attack speed
      hpMultiplier += 0.1; // +10% max HP
    } else if (profile.affection < 25) {
      speedMultiplier -= 0.1; // -10% attack speed penalty
    }

    return { damageMultiplier, speedMultiplier, hpMultiplier };
  }
}
