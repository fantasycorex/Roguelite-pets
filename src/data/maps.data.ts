import { MapConfig } from '../types/combat';

export const MAPS_DATA: Record<string, MapConfig> = {
  heartwood_clearing: {
    id: 'heartwood_clearing',
    name: 'Heartwood Clearing',
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
};
