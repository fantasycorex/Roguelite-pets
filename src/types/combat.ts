export type TargetingMode = 'nearest' | 'closest_to_tower' | 'lowest_hp' | 'highest_threat';

export type StatusEffectType = 'slow' | 'burn' | 'poison' | 'stun' | 'shield';

export interface StatusEffectConfig {
  type: StatusEffectType;
  duration: number; // seconds
  value: number; // slow ratio (0.5), burn/poison dps, shield HP
  tickInterval?: number; // for burn/poison
}

export interface ActiveStatusEffect {
  id: string;
  type: StatusEffectType;
  durationRemaining: number;
  value: number;
  tickTimer?: number;
  tickInterval?: number;
  sourceId?: string;
}

export interface AbilityConfig {
  id: string;
  name: string;
  description: string;
  cooldown: number; // seconds
  range: number; // pixels
  targetType: 'single_enemy' | 'aoe_radius' | 'self' | 'tower';
  damage: number;
  radius?: number;
  statusEffects?: StatusEffectConfig[];
}

export type EnemyBehaviourStyle =
  'rush_tower' | 'fight_creature' | 'ranged_path' | 'standard' | 'boss_sovereign';

export interface EnemyBehaviourConfig {
  style: EnemyBehaviourStyle;
  attackRange: number;
  attackSpeed: number; // attacks per sec
  attackDamage: number;
  targetPriority: 'tower' | 'creature';
  statusEffectsOnHit?: StatusEffectConfig[];
}

export interface MapConfig {
  id: string;
  name: string;
  description: string;
  waypoints: { x: number; y: number }[];
  secondaryWaypoints?: { x: number; y: number }[];
  towerPosition: { x: number; y: number };
  patrolRadius: number;
}

export interface TowerConfig {
  id: string;
  name: string;
  maxHp: number;
  armor?: number;
}

export interface CreatureCombatConfig {
  id: string;
  targetingMode: TargetingMode;
  normalAbilityId: string;
  specialAbilityId: string;
  canBeDowned: boolean;
  reviveTimeSeconds: number;
}

export interface DamageEvent {
  sourceId: string;
  targetId: string;
  targetType: 'creature' | 'tower' | 'enemy';
  damage: number;
  isCrit?: boolean;
  statusEffectsApplied?: StatusEffectType[];
}
