export type FoodBuffType = 'exp_buff' | 'speed_buff';

export interface FoodConfig {
  id: string;
  name: string;
  price: number; // cost in coins
  fullnessRestore: number; // restores fullness (0-100)
  affectionRestore: number; // restores affection (0-100)
  buffEffect?: {
    type: FoodBuffType;
    multiplier: number; // e.g. 1.15 for +15%
    description: string;
  };
  description: string;
  iconKey: string;
}
