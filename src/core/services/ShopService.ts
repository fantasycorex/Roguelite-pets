import { FOOD_DATA } from '../../data/food.data';
import { FoodConfig } from '../../types/food';

export interface ShopPurchaseResult {
  success: boolean;
  message?: string;
  totalCoins: number;
  foodInventory: Record<string, number>;
}

export class ShopService {
  public static buyFood(
    foodId: string,
    totalCoins: number,
    foodInventory: Record<string, number>,
  ): ShopPurchaseResult {
    const foodConfig: FoodConfig | undefined = FOOD_DATA[foodId];
    if (!foodConfig) {
      return { success: false, message: 'Invalid food item', totalCoins, foodInventory };
    }

    if (totalCoins < foodConfig.price) {
      return { success: false, message: 'Not enough coins!', totalCoins, foodInventory };
    }

    const updatedCoins = totalCoins - foodConfig.price;
    const updatedInventory = { ...foodInventory };
    updatedInventory[foodId] = (updatedInventory[foodId] || 0) + 1;

    return {
      success: true,
      totalCoins: updatedCoins,
      foodInventory: updatedInventory,
    };
  }
}
