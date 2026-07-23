import { OwnedCreature, PermanentCreatureProfile } from '../../types/creature';
import { PetCareEngine, CareBonus, PetMood } from '../pet/PetCareEngine';

export class CareService {
  public static feed(
    creature: OwnedCreature | PermanentCreatureProfile,
    amount: number,
  ): { fullness: number; affection: number } {
    return PetCareEngine.feedPet(creature, amount);
  }

  public static pet(
    creature: OwnedCreature | PermanentCreatureProfile,
    amount: number,
  ): { fullness: number; affection: number; mood: PetMood; gainedAffection: number } {
    return PetCareEngine.petCreature(creature, amount);
  }

  public static updateDecay(
    creature: OwnedCreature | PermanentCreatureProfile,
    deltaSeconds: number,
  ): void {
    PetCareEngine.updateCareDecay(creature, deltaSeconds, 0.3);
  }

  public static getCareBonus(creature: OwnedCreature | PermanentCreatureProfile): CareBonus {
    return PetCareEngine.calculateCareBonus(creature);
  }
}
