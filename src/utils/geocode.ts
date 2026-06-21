/**
 * Shared Nominatim geocoding utility.
 * Single cache instance shared across RouteMap, useOsrmRoutes, and any other consumer.
 * null = location was queried and definitively not found (negative cache).
 */

const NOMINATIM = 'https://nominatim.openstreetmap.org/search';

// Module-level cache: survives re-renders, cleared only on page reload
export const geocodeCache = new Map<string, [number, number] | null>();

export async function fetchCoords(
  query: string,
  signal?: AbortSignal,
): Promise<[number, number] | null> {
  const cacheKey = query.trim().toLowerCase();
  if (!cacheKey) return null;
  if (geocodeCache.has(cacheKey)) return geocodeCache.get(cacheKey)!;

  try {
    const url = new URL(NOMINATIM);
    url.searchParams.set('format', 'json');
    url.searchParams.set('q', query);
    url.searchParams.set('countrycodes', 'in');
    url.searchParams.set('limit', '1');
    url.searchParams.set('accept-language', 'en');

    const res  = await fetch(url.toString(), { signal });
    const data = await res.json() as Array<{ lat: string; lon: string }>;

    if (data.length > 0) {
      const coords: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      geocodeCache.set(cacheKey, coords);
      return coords;
    }

    geocodeCache.set(cacheKey, null); // negative cache — don't retry same bad query
    return null;
  } catch {
    return null; // network/abort — do NOT cache so we retry later
  }
}
