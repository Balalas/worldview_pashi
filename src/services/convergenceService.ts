// Convergence Detection Engine
// Detects geographic areas where multiple event types co-occur

import { Earthquake, ProtestEvent, OutageEvent, FireEvent } from '@/store/worldview';
import { CONFLICT_ZONES } from '@/data/conflictZones';

export interface ConvergenceZone {
  lat: number;
  lon: number;
  score: number;
  types: string[];
  eventCount: number;
  locationName?: string;
  level: 'critical' | 'high' | 'medium';
}

interface GridCell {
  lat: number;
  lon: number;
  types: Set<string>;
  events: number;
}

// Grid events into 2°×2° cells and detect co-occurrence
export function detectConvergenceZones(
  earthquakes: Earthquake[],
  protests: ProtestEvent[],
  outages: OutageEvent[],
  fires: FireEvent[],
  militaryAircraftCount: number
): ConvergenceZone[] {
  const grid = new Map<string, GridCell>();

  const addToGrid = (lat: number, lon: number, type: string) => {
    const key = `${Math.floor(lat / 2) * 2},${Math.floor(lon / 2) * 2}`;
    if (!grid.has(key)) {
      grid.set(key, {
        lat: Math.floor(lat / 2) * 2 + 1,
        lon: Math.floor(lon / 2) * 2 + 1,
        types: new Set(),
        events: 0,
      });
    }
    const cell = grid.get(key)!;
    cell.types.add(type);
    cell.events++;
  };

  // Add all events to the grid
  earthquakes.forEach(eq => addToGrid(eq.lat, eq.lon, 'earthquake'));
  protests.forEach(p => addToGrid(p.lat, p.lon, 'protest'));
  outages.forEach(o => addToGrid(o.lat, o.lon, 'cyber'));
  fires.forEach(f => addToGrid(f.lat, f.lon, 'fire'));
  CONFLICT_ZONES.forEach(cz => addToGrid(cz.lat, cz.lon, 'conflict'));

  // Find cells with ≥ 2 distinct types
  const zones: ConvergenceZone[] = [];
  grid.forEach((cell) => {
    if (cell.types.size >= 2) {
      const score = (cell.types.size * 25) + (cell.events * 2);
      const level: ConvergenceZone['level'] = score >= 80 ? 'critical' : score >= 50 ? 'high' : 'medium';

      // Try to name the location from nearby conflict zones
      const nearbyConflict = CONFLICT_ZONES.find(cz =>
        Math.abs(cz.lat - cell.lat) < 3 && Math.abs(cz.lon - cell.lon) < 3
      );

      zones.push({
        lat: cell.lat,
        lon: cell.lon,
        score,
        types: Array.from(cell.types),
        eventCount: cell.events,
        locationName: nearbyConflict?.name,
        level,
      });
    }
  });

  return zones.sort((a, b) => b.score - a.score).slice(0, 15);
}
