import { Route, JourneyStep, RouteSegment } from '../data/mockData';
import { geocodeCache } from './geocode';

// ─── Haversine distance (km) ─────────────────────────────────────────────────
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Estimate total route distance ───────────────────────────────────────────
function estimateDistanceKm(
  from: string,
  to: string,
  geometry: [number, number][] | null,
): number {
  // Prefer summing OSRM geometry segments for accuracy
  if (geometry && geometry.length >= 2) {
    let total = 0;
    for (let i = 0; i < geometry.length - 1; i++) {
      total += haversineKm(geometry[i][0], geometry[i][1], geometry[i + 1][0], geometry[i + 1][1]);
    }
    return total;
  }

  // Fallback: straight-line distance from geocache
  const fromCoords = geocodeCache.get(from.trim().toLowerCase());
  const toCoords = geocodeCache.get(to.trim().toLowerCase());
  if (fromCoords && toCoords) {
    return haversineKm(fromCoords[0], fromCoords[1], toCoords[0], toCoords[1]);
  }

  return 20; // default mid-range estimate
}

// ─── Time formatting ──────────────────────────────────────────────────────────
function advanceTime(timeStr: string, minutes: number): string {
  const match = timeStr.match(/^(\d+):(\d{2})\s*(AM|PM)$/i);
  if (!match) return timeStr;
  let h = parseInt(match[1]);
  const m = parseInt(match[2]);
  const mer = match[3].toUpperCase();
  if (mer === 'PM' && h < 12) h += 12;
  if (mer === 'AM' && h === 12) h = 0;
  const d = new Date();
  d.setHours(h, m + minutes, 0, 0);
  let oh = d.getHours();
  const om = d.getMinutes();
  const outMer = oh >= 12 ? 'PM' : 'AM';
  if (oh > 12) oh -= 12;
  if (oh === 0) oh = 12;
  return `${oh}:${om.toString().padStart(2, '0')} ${outMer}`;
}

// ─── Multi-modal leg definition ───────────────────────────────────────────────
interface Leg {
  mode: 'walk' | 'bus' | 'metro' | 'auto' | 'train';
  label: string;
  stopLabel: string;
  durationWeight: number; // relative weight for duration distribution
  safety: number;
  description: string;
}

// ─── Multi-modal Segment Engine ───────────────────────────────────────────────
function buildLegs(to: string, distKm: number): Leg[] {
  if (distKm < 3) {
    // Short walk-only trip
    return [
      {
        mode: 'walk', label: 'Walk',
        stopLabel: 'Destination Vicinity',
        durationWeight: 1,
        safety: 88,
        description: `Short walk of ${distKm.toFixed(1)} km to destination`,
      },
    ];
  }

  if (distKm < 15) {
    // Urban: Walk + Bus
    return [
      {
        mode: 'walk', label: 'Walk',
        stopLabel: 'Local Bus Stop',
        durationWeight: 0.15,
        safety: 85,
        description: 'Walk to nearest transit stop',
      },
      {
        mode: 'bus', label: 'Bus',
        stopLabel: 'City Transit Point',
        durationWeight: 0.7,
        safety: 82,
        description: `City bus service — ${distKm.toFixed(1)} km route`,
      },
      {
        mode: 'walk', label: 'Walk',
        stopLabel: to,
        durationWeight: 0.15,
        safety: 87,
        description: `Short walk to ${to}`,
      },
    ];
  }

  if (distKm < 50) {
    // Metro corridor: Walk + Metro + Walk
    return [
      {
        mode: 'walk', label: 'Walk',
        stopLabel: 'Metro Entry Station',
        durationWeight: 0.1,
        safety: 86,
        description: 'Walk to metro station entrance',
      },
      {
        mode: 'metro', label: 'Metro',
        stopLabel: 'Metro Junction',
        durationWeight: 0.6,
        safety: 92,
        description: `Rapid metro service — ${distKm.toFixed(1)} km corridor`,
      },
      {
        mode: 'bus', label: 'Bus',
        stopLabel: 'Regional Bus Terminal',
        durationWeight: 0.2,
        safety: 80,
        description: 'Feeder bus to destination area',
      },
      {
        mode: 'walk', label: 'Walk',
        stopLabel: to,
        durationWeight: 0.1,
        safety: 85,
        description: `Final walk to ${to}`,
      },
    ];
  }

  if (distKm < 200) {
    // Inter-city: Bus + Rail simulation + Local
    return [
      {
        mode: 'walk', label: 'Walk',
        stopLabel: 'Bus Terminal',
        durationWeight: 0.05,
        safety: 85,
        description: 'Walk to city bus terminus',
      },
      {
        mode: 'bus', label: 'Bus',
        stopLabel: 'Regional Highway Hub',
        durationWeight: 0.25,
        safety: 80,
        description: 'Express bus to regional railway station',
      },
      {
        mode: 'train', label: 'Train',
        stopLabel: 'Railway Junction',
        durationWeight: 0.55,
        safety: 90,
        description: `Inter-city rail service — ${distKm.toFixed(0)} km route`,
      },
      {
        mode: 'bus', label: 'Bus',
        stopLabel: 'City Entry Point',
        durationWeight: 0.1,
        safety: 78,
        description: 'Local bus from railway station',
      },
      {
        mode: 'walk', label: 'Walk',
        stopLabel: to,
        durationWeight: 0.05,
        safety: 84,
        description: `Walk to ${to}`,
      },
    ];
  }

  // Long distance > 200km: Multi-modal (Bus + Train + Metro)
  return [
    {
      mode: 'walk', label: 'Walk',
      stopLabel: 'Departure Terminal',
      durationWeight: 0.03,
      safety: 86,
      description: 'Walk to departure terminal',
    },
    {
      mode: 'bus', label: 'Bus',
      stopLabel: 'City Interchange',
      durationWeight: 0.12,
      safety: 81,
      description: 'City bus to main railway station',
    },
    {
      mode: 'train', label: 'Train',
      stopLabel: 'Major Railway Station',
      durationWeight: 0.55,
      safety: 91,
      description: `Long-distance rail — ${(distKm * 0.7).toFixed(0)} km express route`,
    },
    {
      mode: 'train', label: 'Train',
      stopLabel: 'Destination Railway Station',
      durationWeight: 0.2,
      safety: 89,
      description: 'Connecting rail service to destination city',
    },
    {
      mode: 'metro', label: 'Metro',
      stopLabel: 'Metro Hub',
      durationWeight: 0.07,
      safety: 93,
      description: 'City metro to final destination',
    },
    {
      mode: 'walk', label: 'Walk',
      stopLabel: to,
      durationWeight: 0.03,
      safety: 87,
      description: `Final walk to ${to}`,
    },
  ];
}

// ─── Main exported generator ──────────────────────────────────────────────────
export function generateJourneySteps(
  from: string,
  to: string,
  geometry: [number, number][] | null,
  route: Route,
): JourneyStep[] {
  const distKm = estimateDistanceKm(from, to, geometry);
  const totalDurationMin = route.durationMinutes;
  const legs = buildLegs(to, distKm);

  const steps: JourneyStep[] = [];
  let currentTime = '09:15 AM';
  let stepId = 1;

  // Step 0: Starting Point
  steps.push({
    id: stepId++,
    location: from,
    time: currentTime,
    description: `Depart from ${from}`,
  });

  // Intermediate legs → steps
  for (const leg of legs) {
    const legDur = Math.max(1, Math.round(leg.durationWeight * totalDurationMin));
    currentTime = advanceTime(currentTime, legDur);

    const segment: RouteSegment = {
      type: leg.mode === 'train' ? 'bus' : leg.mode, // map train→bus type for RouteSegment compatibility
      label: leg.label,
      duration: `${legDur} min`,
    };

    steps.push({
      id: stepId++,
      location: leg.stopLabel,
      time: currentTime,
      description: leg.description,
      safety: leg.safety,
      segment,
    });
  }

  // Ensure the last step has the destination as the final stop name
  const last = steps[steps.length - 1];
  if (last && last.location !== to) {
    last.location = to;
    last.description = `Arrived at ${to}`;
  }

  return steps;
}
