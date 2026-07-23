import { SaveManager } from '../save/SaveManager';
import { SaveDataSchema } from '../../types/save';
import { OwnedCreature } from '../../types/creature';
import { CareService } from '../services/CareService';
import { ShopService } from '../services/ShopService';
import { InventoryService } from '../services/InventoryService';
import { EvolutionService } from '../services/EvolutionService';
import { RunPreparationService, PreparedRunPayload } from '../services/RunPreparationService';
import { EquipmentSlot } from '../../types/equipment';

export class HabitatController {
  private saveData: SaveDataSchema;
  private activeCreature: OwnedCreature;
  private selectedMapId: string = 'heartwood_clearing';

  constructor() {
    this.saveData = SaveManager.loadGame();
    this.activeCreature = SaveManager.getActiveCreature(this.saveData);
  }

  public refreshState(): void {
    this.saveData = SaveManager.loadGame();
    this.activeCreature = SaveManager.getActiveCreature(this.saveData);
  }

  public getSaveData(): SaveDataSchema {
    return this.saveData;
  }

  public getActiveCreature(): OwnedCreature {
    return this.activeCreature;
  }

  public getSelectedMapId(): string {
    return this.selectedMapId;
  }

  public setSelectedMapId(mapId: string): void {
    this.selectedMapId = mapId;
  }

  public switchActiveCreature(instanceId: string): void {
    const found = this.saveData.ownedCreatures.find((c) => c.instanceId === instanceId);
    if (found) {
      this.saveData.activeCreatureInstanceId = instanceId;
      this.activeCreature = found;
      this.persist();
    }
  }

  public updateCareDecay(deltaSeconds: number): void {
    CareService.updateDecay(this.activeCreature, deltaSeconds);
  }

  public feedPet(foodId: string): { success: boolean; message?: string } {
    const ownedCount = this.saveData.foodInventory[foodId] || 0;
    if (ownedCount <= 0) {
      return { success: false, message: 'No items left!' };
    }

    this.saveData.foodInventory[foodId]--;
    CareService.feed(this.activeCreature, 25);
    this.persist();
    return { success: true };
  }

  public petCreature(): { mood: string; gainedAffection: number } {
    const result = CareService.pet(this.activeCreature, 10);
    this.persist();
    return { mood: result.mood, gainedAffection: result.gainedAffection };
  }

  public buyFood(foodId: string): { success: boolean; message?: string } {
    const result = ShopService.buyFood(
      foodId,
      this.saveData.totalCoins,
      this.saveData.foodInventory,
    );
    if (result.success) {
      this.saveData.totalCoins = result.totalCoins;
      this.saveData.foodInventory = result.foodInventory;
      this.persist();
    }
    return { success: result.success, message: result.message };
  }

  public equipItem(itemId: string): boolean {
    const ok = InventoryService.equip(this.activeCreature, this.saveData.inventory, itemId);
    if (ok) this.persist();
    return ok;
  }

  public unequipItem(slot: EquipmentSlot): boolean {
    const ok = InventoryService.unequip(this.activeCreature, this.saveData.inventory, slot);
    if (ok) this.persist();
    return ok;
  }

  public sellItem(itemId: string): number {
    const value = InventoryService.sellItem(this.saveData.inventory, itemId);
    if (value > 0) {
      this.saveData.totalCoins += value;
      this.persist();
    }
    return value;
  }

  public canEvolve(): boolean {
    return EvolutionService.canEvolve(this.activeCreature);
  }

  public evolveCreature(): boolean {
    const ok = EvolutionService.evolve(this.activeCreature);
    if (ok) this.persist();
    return ok;
  }

  public prepareDefenseRun(): PreparedRunPayload {
    const buff = this.saveData.activeNextRunBuff;
    const payload = RunPreparationService.prepareRun(this.activeCreature, buff);

    // Consume buff
    this.saveData.activeNextRunBuff = undefined;
    this.persist();

    return payload;
  }

  private persist(): void {
    this.saveData = SaveManager.updateSaveData({
      activeCreatureInstanceId: this.activeCreature.instanceId,
      ownedCreatures: this.saveData.ownedCreatures,
      inventory: this.saveData.inventory,
      foodInventory: this.saveData.foodInventory,
      totalCoins: this.saveData.totalCoins,
      activeNextRunBuff: this.saveData.activeNextRunBuff,
      tutorialCompleted: this.saveData.tutorialCompleted,
    });
  }
}
