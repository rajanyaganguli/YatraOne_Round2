import { useState, useEffect, useRef } from 'react';
import { Route } from '../data/mockData';
import { getRoutesForTrip } from '../data/mockData';
import { fetchCoords } from '../utils/geocode';

// ─── OSRM public API ──────────────────────────────────────────────────────────
const OSRM = 'https://router.project-osrm.org/route/v1/driving';

// Cache keyed by "lat1,lon1-lat2,lon2"
interface OsrmCacheEntry {
  routes:      Route[];
  geometry:    [number, number][];   // [lat, lng] pairs (Leaflet order)
  distanceKm:  number;
  durationMin: number;
}
const osrmCache = new Map<string, OsrmCacheEntry | null>();

// ─── Time range helper ────────────────────────────────────────────────────────
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

function makeTimeRange(departureTime: string, durationMin: number, offsetMin = 0): string {
  const start = advanceTime(departureTime || '9:15 AM', offsetMin);
  const end = advanceTime(start, durationMin);
  return `${start} – ${end}`;
}

// ─── Generate 3 route variants from real OSRM distance + duration ─────────────
function generateRoutes(distKm: number, durationMin: number, from: string, to: string, departureTime: string): Route[] {
  const dbRoutes = getRoutesForTrip(from, to, departureTime) || [];
  const dbRoute1 = dbRoutes.find(r => r.id === 1);
  const dbRoute2 = dbRoutes.find(r => r.id === 2);
  const dbRoute3 = dbRoutes.find(r => r.id === 3);

  const dur1 = Math.max(5, durationMin);                        // Fastest = OSRM time
  const dur2 = Math.max(8, Math.round(durationMin * 1.35));     // Cheapest = buses (+35%)
  const dur3 = Math.max(6, Math.round(durationMin * 1.12));     // Eco = metro (+12%)

  const price1 = Math.max(15, Math.round(distKm * 3.5));       // Metro+Bus
  const price2 = Math.max(8,  Math.round(distKm * 1.8));       // Bus heavy
  const price3 = Math.max(12, Math.round(distKm * 3.1));       // Metro only

  const co2_1 = dbRoute1 ? dbRoute1.co2Saved : parseFloat((distKm * 0.18).toFixed(1));
  const co2_2 = dbRoute2 ? dbRoute2.co2Saved : parseFloat((distKm * 0.28).toFixed(1));
  const co2_3 = dbRoute3 ? dbRoute3.co2Saved : parseFloat((distKm * 0.38).toFixed(1));

  const timeRange1 = makeTimeRange(departureTime, dur1, 0);
  const timeRange2 = makeTimeRange(departureTime, dur2, 4);
  const timeRange3 = makeTimeRange(departureTime, dur3, 7);

  const dbMetro1 = dbRoute1?.segments.find(s => s.type === 'metro');
  const dbMetro3 = dbRoute3?.segments.find(s => s.type === 'metro');

  return [
    {
      id: 1, score: 94, tags: ['Fastest'],
      duration: `${dur1} min`, durationMinutes: dur1, price: price1,
      timeRange: timeRange1,
      segments: [
        { type: 'walk',  label: 'Walk' },
        {
          type: 'metro',
          label: 'Metro',
          duration: `${Math.round(dur1 * 0.65)} min`,
          line: dbMetro1?.line || 'Express',
          boardAt: dbMetro1?.boardAt,
          alightAt: dbMetro1?.alightAt
        },
        { type: 'bus',   label: 'Bus',   duration: `${Math.round(dur1 * 0.22)} min`, crowd: 'Moderate' },
        { type: 'walk',  label: 'Walk' },
      ],
      safety: 92, co2Saved: co2_1, transfers: 2,
      onTime: true, priceLocked: true, lockMinutes: 9,
    },
    {
      id: 2, score: 88, tags: ['Cheapest'],
      duration: `${dur2} min`, durationMinutes: dur2, price: price2,
      timeRange: timeRange2,
      segments: [
        { type: 'walk', label: 'Walk' },
        { type: 'bus',  label: 'Bus', duration: `${Math.round(dur2 * 0.88)} min`, crowd: 'Low' },
        { type: 'walk', label: 'Walk' },
      ],
      safety: 78, co2Saved: co2_2, transfers: 1,
      onTime: true, priceLocked: true, lockMinutes: 10,
    },
    {
      id: 3, score: 82, tags: ['Eco'],
      duration: `${dur3} min`, durationMinutes: dur3, price: price3,
      timeRange: timeRange3,
      segments: [
        { type: 'walk',  label: 'Walk' },
        {
          type: 'metro',
          label: 'Metro',
          duration: `${Math.round(dur3 * 0.90)} min`,
          line: dbMetro3?.line || 'Green Line',
          boardAt: dbMetro3?.boardAt,
          alightAt: dbMetro3?.alightAt
        },
        { type: 'walk',  label: 'Walk' },
      ],
      safety: 88, co2Saved: co2_3, transfers: 1,
      onTime: false, lateMinutes: 2, priceLocked: true, lockMinutes: 8,
    },
  ];
}

// ─── Hook return type ─────────────────────────────────────────────────────────
export interface OsrmState {
  routes:      Route[];
  geometry:    [number, number][] | null;  // real road path, null = straight line
  distanceKm:  number | null;
  durationMin: number | null;
  loading:     boolean;
  isRealData:  boolean;  // true = OSRM, false = mock fallback
}

const EMPTY: OsrmState = {
  routes: [], geometry: null, distanceKm: null,
  durationMin: null, loading: false, isRealData: false,
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useOsrmRoutes(from: string, to: string, departureTime: string): OsrmState {
  const [state, setState] = useState<OsrmState>(EMPTY);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!from.trim() || !to.trim()) {
      setState(EMPTY);
      return;
    }

    let cancelled = false;
    setState(prev => ({ ...prev, loading: true }));

    // Debounce: wait for user to stop typing (600ms)
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      // 1. Geocode both locations (shared cache with RouteMap)
      const [fromCoords, toCoords] = await Promise.all([
        fetchCoords(from, ctrl.signal),
        fetchCoords(to,   ctrl.signal),
      ]);

      if (cancelled) return;

      // 2a. Geocoding failed for at least one → mock fallback
      if (!fromCoords || !toCoords) {
        const mock = getRoutesForTrip(from, to, departureTime);
        if (!cancelled) setState({
          routes: mock ?? [], geometry: null,
          distanceKm: null, durationMin: null,
          loading: false, isRealData: false,
        });
        return;
      }

      // 2b. Check OSRM cache
      const cacheKey = `${fromCoords[0].toFixed(4)},${fromCoords[1].toFixed(4)}-${toCoords[0].toFixed(4)},${toCoords[1].toFixed(4)}`;
      if (osrmCache.has(cacheKey)) {
        const cached = osrmCache.get(cacheKey);
        if (!cancelled) {
          if (cached) {
            const routes = generateRoutes(cached.distanceKm, cached.durationMin, from, to, departureTime);
            setState({ ...cached, routes, loading: false, isRealData: true });
          } else {
            // Cached null = OSRM failed last time → mock fallback
            const mock = getRoutesForTrip(from, to, departureTime);
            setState({ routes: mock ?? [], geometry: null, distanceKm: null, durationMin: null, loading: false, isRealData: false });
          }
        }
        return;
      }

      // 3. Call OSRM  (coordinates: lon,lat order for OSRM)
      const [lat1, lon1] = fromCoords;
      const [lat2, lon2] = toCoords;
      const url = `${OSRM}/${lon1},${lat1};${lon2},${lat2}?overview=full&geometries=geojson`;

      try {
        const res  = await fetch(url, { signal: ctrl.signal });
        const data = await res.json() as {
          code: string;
          routes?: Array<{
            distance: number;
            duration: number;
            geometry: { coordinates: [number, number][] };
          }>;
        };

        if (cancelled) return;

        if (data.code === 'Ok' && data.routes?.length) {
          const r        = data.routes[0];
          const distKm   = r.distance / 1000;
          const durMin   = Math.max(1, Math.round(r.duration / 60));

          // Convert GeoJSON [lon, lat] → Leaflet [lat, lon]
          const geometry: [number, number][] =
            r.geometry.coordinates.map(([lon, lat]) => [lat, lon]);

          const routes = generateRoutes(distKm, durMin, from, to, departureTime);
          const entry: OsrmCacheEntry = { routes, geometry, distanceKm: distKm, durationMin: durMin };
          osrmCache.set(cacheKey, entry);

          setState({ routes, geometry, distanceKm: distKm, durationMin: durMin, loading: false, isRealData: true });
        } else {
          osrmCache.set(cacheKey, null);
          const mock = getRoutesForTrip(from, to, departureTime);
          setState({ routes: mock ?? [], geometry: null, distanceKm: null, durationMin: null, loading: false, isRealData: false });
        }
      } catch {
        if (!cancelled) {
          const mock = getRoutesForTrip(from, to, departureTime);
          setState({ routes: mock ?? [], geometry: null, distanceKm: null, durationMin: null, loading: false, isRealData: false });
        }
      }
    }, 600);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [from, to, departureTime]);

  return state;
}
