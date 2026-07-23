import { FoodConfig } from '../types/food';

export const FOOD_DATA: Record<string, FoodConfig> = {
  basic_kibble: {
    id: 'basic_kibble',
    name: 'Basic Kibble',
    price: 10,
    fullnessRestore: 20,
    affectionRestore: 0,
    description: 'Standard pet kibble. Restores 20 Fullness.',
    iconKey: 'food_kibble',
  },
  gourmet_treat: {
    id: 'gourmet_treat',
    name: 'Gourmet Treat',
    price: 25,
    fullnessRestore: 40,
    affectionRestore: 15,
    buffEffect: {
      type: 'exp_buff',
      multiplier: 1.1,
      description: '+10% EXP gained in next defense run',
    },
    description: 'Delicious treat! Restores 40 Fullness, +15 Affection & +10% EXP buff.',
    iconKey: 'food_treat',
  },
  energy_berry: {
    id: 'energy_berry',
    name: 'Energy Berry',
    price: 30,
    fullnessRestore: 20,
    affectionRestore: 5,
    buffEffect: {
      type: 'speed_buff',
      multiplier: 1.15,
      description: '+15% Move & Attack Speed in next defense run',
    },
    description: 'Zesty berry! Restores 20 Fullness & grants +15% Speed buff next run.',
    iconKey: 'food_berry',
  },
};
