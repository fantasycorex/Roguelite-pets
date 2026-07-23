import { SPECIES_DATA } from '../../data/species.data';
import { ABILITIES_DATA } from '../../data/abilities.data';
import { ENEMIES_DATA } from '../../data/enemies.data';
import { WAVES_DATA_MAP1, WAVES_DATA_MAP2 } from '../../data/waves.data';
import { TRAITS_DATA } from '../../data/traits.data';
import { EQUIPMENT_DATA } from '../../data/equipment.data';
import { MAPS_DATA } from '../../data/maps.data';

export interface ValidationReport {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class ContentValidationService {
  public static validateAllContent(): ValidationReport {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Validate Species & Abilities
    for (const [speciesId, species] of Object.entries(SPECIES_DATA)) {
      if (species.attackId && !ABILITIES_DATA[species.attackId]) {
        errors.push(`Species '${speciesId}' references invalid attackId '${species.attackId}'`);
      }
      if (species.abilityId && !ABILITIES_DATA[species.abilityId]) {
        errors.push(`Species '${speciesId}' references invalid abilityId '${species.abilityId}'`);
      }
    }

    // 2. Validate Waves & Enemies
    const allWaves = [...WAVES_DATA_MAP1, ...WAVES_DATA_MAP2];
    allWaves.forEach((wave, idx) => {
      wave.enemies.forEach((enemyGroup) => {
        if (!ENEMIES_DATA[enemyGroup.enemyTypeId]) {
          errors.push(
            `Wave #${idx + 1} references invalid enemyTypeId '${enemyGroup.enemyTypeId}'`,
          );
        }
      });
    });

    // 3. Validate Traits
    for (const [traitId, trait] of Object.entries(TRAITS_DATA)) {
      if (!trait.effect || !trait.effect.type) {
        errors.push(`Trait '${traitId}' missing effect configuration`);
      }
    }

    // 4. Validate Equipment Slots
    const validSlots = new Set(['collar', 'charm', 'toy']);
    for (const [itemId, item] of Object.entries(EQUIPMENT_DATA)) {
      if (!validSlots.has(item.slot)) {
        errors.push(`Equipment item '${itemId}' has invalid slot '${item.slot}'`);
      }
    }

    // 5. Validate Maps & Waypoints
    for (const [mapId, mapConfig] of Object.entries(MAPS_DATA)) {
      if (!mapConfig.waypoints || mapConfig.waypoints.length < 2) {
        errors.push(`Map '${mapId}' must have at least 2 primary waypoints`);
      }
      if (!mapConfig.towerPosition) {
        errors.push(`Map '${mapId}' missing towerPosition definition`);
      }
    }

    const isValid = errors.length === 0;
    return { isValid, errors, warnings };
  }
}
