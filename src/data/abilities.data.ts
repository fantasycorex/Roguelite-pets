import { AbilityConfig } from '../types/combat';

export const ABILITIES_DATA: Record<string, AbilityConfig> = {
  // 1. Guardian Kit
  impact_bash: {
    id: 'impact_bash',
    name: 'Impact Bash',
    description: 'Heavy short-range impact dealing crushing damage and taunting target.',
    cooldown: 1.1,
    range: 100,
    targetType: 'single_enemy',
    damage: 24,
    statusEffects: [{ type: 'stun', duration: 0.5, value: 1.0 }],
  },
  aegis_barrier: {
    id: 'aegis_barrier',
    name: 'Aegis Barrier',
    description: 'Emits a massive shield pulse protecting tower and pet from incoming damage.',
    cooldown: 8.0,
    range: 140,
    radius: 160,
    targetType: 'aoe_radius',
    damage: 35,
    statusEffects: [{ type: 'shield', duration: 6.0, value: 40 }],
  },

  // 2. Spark Kit
  fire_bolt: {
    id: 'fire_bolt',
    name: 'Fire Bolt',
    description: 'Long-range explosive fire projectile applying splash burn.',
    cooldown: 0.8,
    range: 240,
    targetType: 'single_enemy',
    damage: 28,
    statusEffects: [{ type: 'burn', duration: 2.5, value: 6, tickInterval: 0.8 }],
  },
  fire_blast: {
    id: 'fire_blast',
    name: 'Flame Blast Storm',
    description: 'Launches a devastating flame explosion creating a burning flame zone.',
    cooldown: 5.5,
    range: 220,
    radius: 150,
    targetType: 'aoe_radius',
    damage: 55,
    statusEffects: [{ type: 'burn', duration: 4.0, value: 10, tickInterval: 1.0 }],
  },

  // 3. Prowler Kit
  shadow_strike: {
    id: 'shadow_strike',
    name: 'Shadow Strike',
    description: 'Ultra-fast precision strike with high critical chance prioritizing fast runners.',
    cooldown: 0.55,
    range: 140,
    targetType: 'single_enemy',
    damage: 20,
  },
  shadow_dash: {
    id: 'shadow_dash',
    name: 'Shadow Dash Multi-Strike',
    description: 'Dashes rapidly across multiple targets dealing lethal critical execution force.',
    cooldown: 4.5,
    range: 180,
    radius: 130,
    targetType: 'aoe_radius',
    damage: 48,
    statusEffects: [{ type: 'slow', duration: 2.5, value: 0.6 }],
  },

  // Retained Fallbacks
  basic_laser: {
    id: 'basic_laser',
    name: 'Energy Laser',
    description: 'Fires a concentrated beam of energy at a single enemy.',
    cooldown: 1.2,
    range: 180,
    targetType: 'single_enemy',
    damage: 18,
  },
  aoe_pulse: {
    id: 'aoe_pulse',
    name: 'Vampiric Burst',
    description: 'Emits a shockwave causing area damage and slowing enemies.',
    cooldown: 8.0,
    range: 140,
    radius: 140,
    targetType: 'aoe_radius',
    damage: 40,
    statusEffects: [{ type: 'slow', duration: 3.0, value: 0.5 }],
  },
};
