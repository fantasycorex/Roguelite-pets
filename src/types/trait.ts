import { CreatureStats } from './creature';

export interface TraitEffect {
  type: 'stat_multiplier' | 'flat_stat' | 'special_ability' | 'on_hit';
  targetStat?: keyof CreatureStats;
  value: number;
}

export interface TraitConfig {
  id: string;
  name: string;
  description: string;
  iconKey: string;
  rarity: 'common' | 'rare' | 'epic';
  effect: TraitEffect;
}
