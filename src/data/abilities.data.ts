import { AbilityConfig } from '../types/combat';

export const ABILITIES_DATA: Record<string, AbilityConfig> = {
  basic_laser: {
    id: 'basic_laser',
    name: 'Energy Laser',
    description: 'Fires a concentrated beam of energy at a single enemy.',
    cooldown: 1.2,
    range: 180,
    targetType: 'single_enemy',
    damage: 15,
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
    statusEffects: [
      {
        type: 'slow',
        duration: 3.0,
        value: 0.5,
      },
    ],
  },
  fire_blast: {
    id: 'fire_blast',
    name: 'Flame Blast',
    description: 'Launches a fire ball that burns enemies over time.',
    cooldown: 5.0,
    range: 160,
    radius: 100,
    targetType: 'aoe_radius',
    damage: 30,
    statusEffects: [
      {
        type: 'burn',
        duration: 4.0,
        value: 5, // 5 dps
        tickInterval: 1.0,
      },
    ],
  },
};
