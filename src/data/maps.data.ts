import { MapConfig } from '../types/combat';

export const MAPS_DATA: Record<string, MapConfig> = {
  heartwood_clearing: {
    id: 'heartwood_clearing',
    name: 'Heartwood Clearing',
    description: 'Introductory clearing with a single winding lane.',
    waypoints: [
      { x: -30, y: 360 },
      { x: 320, y: 180 },
      { x: 640, y: 540 },
      { x: 960, y: 360 },
      { x: 640, y: 360 },
    ],
    towerPosition: { x: 640, y: 360 },
    patrolRadius: 80,
  },
  moonlit_crossing: {
    id: 'moonlit_crossing',
    name: 'Moonlit Crossing',
    description: 'Dangerous crossroads with dual merging enemy spawn tracks.',
    waypoints: [
      // Track 0: Top-left spawn -> curve down -> center tower
      { x: -30, y: 120 },
      { x: 380, y: 120 },
      { x: 480, y: 360 },
      { x: 640, y: 360 },
    ],
    secondaryWaypoints: [
      // Track 1: Bottom-left spawn -> curve up -> center tower
      { x: -30, y: 600 },
      { x: 380, y: 600 },
      { x: 480, y: 360 },
      { x: 640, y: 360 },
    ],
    towerPosition: { x: 640, y: 360 },
    patrolRadius: 90,
  },
  volcanic_ridge: {
    id: 'volcanic_ridge',
    name: 'Volcanic Ridge',
    description: 'Hazardous magma crater with triple converging assault routes.',
    waypoints: [
      // Track 0: Top spawn -> crater center
      { x: 640, y: -30 },
      { x: 640, y: 220 },
      { x: 640, y: 360 },
    ],
    secondaryWaypoints: [
      // Track 1: Bottom-right spawn -> crater center
      { x: 1310, y: 600 },
      { x: 900, y: 480 },
      { x: 640, y: 360 },
    ],
    towerPosition: { x: 640, y: 360 },
    patrolRadius: 100,
  },
};
