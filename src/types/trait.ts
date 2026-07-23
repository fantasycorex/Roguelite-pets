import { CreatureStats } from './creature';

export type TraitTriggerType =
  | 'passive'
  | 'on_hit'
  | 'on_kill'
  | 'on_critical'
  | 'on_special'
  | 'on_tower_damaged'
  | 'periodic'
  | 'status_application'
  | 'ability_modifier'
  | 'conditional_stat'
  | 'tower_support';

export type BuildFamily = 'ferocity' | 'swiftness' | 'elemental' | 'guardian' | 'companion';

export interface TraitEffect {
  type: 'flat_stat' | 'stat_multiplier' | 'special_ability' | TraitTriggerType;
  targetStat?: keyof CreatureStats;
  value: number;
  statusType?: string; // burn, slow, poison, shield, stun
  chance?: number; // 0.0 to 1.0 (e.g. 0.25 crit chance)
  radius?: number;
  cooldown?: number;
}

export interface TraitConfig {
  id: string;
  name: string;
  description: string;
  family: BuildFamily;
  rarity: 'common' | 'rare' | 'epic';
  effect: TraitEffect;
  tags: string[];
  maxStacks?: number;
  prerequisites?: string[]; // required trait IDs
  weight?: number; // selection weight (common 100, rare 40, epic 10)
}
