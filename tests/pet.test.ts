import { describe, it, expect, beforeEach } from 'vitest';
import { PetCareEngine } from '../src/core/pet/PetCareEngine';
import { DEFAULT_CREATURE_PROFILE } from '../src/data/creatures.data';
import { PermanentCreatureProfile } from '../src/types/creature';

describe('PetCareEngine Unit Tests', () => {
  let profile: PermanentCreatureProfile;

  beforeEach(() => {
    profile = { ...DEFAULT_CREATURE_PROFILE, hunger: 50, affection: 50 };
    PetCareEngine.resetPettingCooldown();
  });

  it('feedPet increases hunger and affection up to 100 cap', () => {
    const res = PetCareEngine.feedPet(profile, 30);
    expect(res.hunger).toBe(80);
    expect(res.affection).toBe(55);

    // Overfeed to check cap
    const capped = PetCareEngine.feedPet(profile, 50);
    expect(capped.hunger).toBe(100);
  });

  it('petCreature increases affection up to 100 cap', () => {
    PetCareEngine.resetPettingCooldown();
    const res = PetCareEngine.petCreature(profile, 20);
    expect(res.affection).toBe(70);

    PetCareEngine.resetPettingCooldown();
    const capped = PetCareEngine.petCreature(profile, 50);
    expect(capped.affection).toBe(100);
  });

  it('updateCareDecay reduces hunger gradually over time', () => {
    PetCareEngine.updateCareDecay(profile, 10, 0.5); // 10 seconds at 0.5/sec
    expect(profile.hunger).toBe(45);
  });

  it('calculateCareBonus calculates damage and speed buffs for high care stats', () => {
    profile.hunger = 90;
    profile.affection = 85;

    const bonus = PetCareEngine.calculateCareBonus(profile);
    expect(bonus.damageMultiplier).toBeGreaterThan(1.0);
    expect(bonus.speedMultiplier).toBeGreaterThan(1.0);
  });

  it('calculateCareBonus applies penalties for low hunger or affection', () => {
    profile.hunger = 10;
    profile.affection = 10;

    const bonus = PetCareEngine.calculateCareBonus(profile);
    expect(bonus.damageMultiplier).toBeLessThan(1.0);
    expect(bonus.speedMultiplier).toBeLessThan(1.0);
  });
});
