import { PermanentCreatureProfile } from '../../types/creature';

export interface CareBonus {
  damageMultiplier: number;
  speedMultiplier: number;
  hpMultiplier: number;
}

export class PetCareEngine {
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
   * Tapping/petting creature to boost affection
   */
  public static petCreature(
    profile: PermanentCreatureProfile,
    amount: number = 10,
  ): {
    hunger: number;
    affection: number;
  } {
    profile.affection = Math.min(100, Math.max(0, profile.affection + amount));
    profile.lastCareTimestamp = Date.now();
    return { hunger: profile.hunger, affection: profile.affection };
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
