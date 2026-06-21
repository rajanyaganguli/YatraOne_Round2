import { useEffect, useRef, useCallback, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchCoords, geocodeCache } from '../utils/geocode';
import { Route } from '../data/mockData';

// ─── Constants ────────────────────────────────────────────────────────────────
const INDIA_CENTER: [number, number] = [22.9734, 78.6569];
const DEBOUNCE_MS = 500;

// ─── Debounced geocode hook ───────────────────────────────────────────────────
interface GeocodeResult {
  coords:   [number, number] | null;
  loading:  boolean;
  notFound: boolean;
}

function useGeocode(location: string): GeocodeResult {
  const [coords,   setCoords]   = useState<[number, number] | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const q = location.trim();
    if (!q) { setCoords(null); setLoading(false); setNotFound(false); return; }
    const cacheKey = q.toLowerCase();
    if (geocodeCache.has(cacheKey)) {
      const cached = geocodeCache.get(cacheKey)!;
      setCoords(cached); setNotFound(cached === null); setLoading(false);
      return;
    }
    setLoading(true); setNotFound(false);
    const timer = setTimeout(async () => {
      const result = await fetchCoords(q);
      setCoords(result); setNotFound(result === null); setLoading(false);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [location]);

  return { coords, loading, notFound };
}

// ─── Pulsing FROM marker (green) ─────────────────────────────────────────────
function pulsingFromIcon(label: string) {
  return L.divIcon({
    html: `
      <div style="position:relative;width:20px;height:20px;">
        <div class="marker-pulse-ring"></div>
        <div style="position:absolute;inset:-8px;border-radius:50%;border:1px solid rgba(22,163,74,0.25);animation:pulseRing 1.8s ease-out infinite;animation-delay:0.4s;"></div>
        <div style="width:20px;height:20px;border-radius:50%;background:#16A34A;border:3px solid white;box-shadow:0 2px 10px rgba(22,163,74,0.5);"></div>
        <div style="position:absolute;top:24px;left:50%;transform:translateX(-50%);background:rgba(22,163,74,0.95);color:#fff;font-size:8px;font-weight:700;white-space:nowrap;padding:2px 6px;border-radius:6px;font-family:system-ui,sans-serif;max-width:100px;overflow:hidden;text-overflow:ellipsis;box-shadow:0 2px 6px rgba(0,0,0,0.2);">${label}</div>
      </div>`,
    className: '', iconSize: [20, 20], iconAnchor: [10, 10],
  });
}

// ─── Solid TO marker (purple) ─────────────────────────────────────────────────
function solidToIcon(label: string) {
  return L.divIcon({
    html: `
      <div style="position:relative;width:20px;height:20px;">
        <div style="width:20px;height:20px;border-radius:50%;background:#7C3AED;border:3px solid white;box-shadow:0 2px 10px rgba(124,58,237,0.5);"></div>
        <div style="position:absolute;top:24px;left:50%;transform:translateX(-50%);background:rgba(124,58,237,0.95);color:#fff;font-size:8px;font-weight:700;white-space:nowrap;padding:2px 6px;border-radius:6px;font-family:system-ui,sans-serif;max-width:100px;overflow:hidden;text-overflow:ellipsis;box-shadow:0 2px 6px rgba(0,0,0,0.2);">${label}</div>
      </div>`,
    className: '', iconSize: [20, 20], iconAnchor: [10, 10],
  });
}

// ─── Status pill ──────────────────────────────────────────────────────────────
function StatusPill({ loading, notFound, name, color }: {
  loading: boolean; notFound: boolean; name: string; color: string;
}) {
  if (!name.trim()) return null;
  if (loading) return (
    <span className="flex items-center gap-1 text-[10px] text-gray-400 italic">
      <span className="animate-spin inline-block w-2.5 h-2.5 border border-gray-400 border-t-transparent rounded-full" />
      Locating…
    </span>
  );
  if (notFound) return <span className="text-[10px] text-red-400 font-medium">✗ not found</span>;
  return <span style={{ color }} className="text-[10px] font-semibold truncate max-w-[80px]">✓ {name}</span>;
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface RouteMapProps {
  from:           string;
  to:             string;
  compact?:       boolean;
  routeGeometry?: [number, number][] | null;
  route?:         Route | null;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function RouteMap({ from, to, compact = false, routeGeometry, route }: RouteMapProps) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const mapRef        = useRef<L.Map | null>(null);
  const fromMarkerRef = useRef<L.Marker | null>(null);
  const toMarkerRef   = useRef<L.Marker | null>(null);
  const glowLineRef   = useRef<L.Polyline | null>(null);
  const coreLineRef   = useRef<L.Polyline | null>(null);
  const midpointMarkersRef = useRef<L.CircleMarker[]>([]);

  const fromResult = useGeocode(from);
  const toResult   = useGeocode(to);

  // Helper to ensure linearGradient exists in map SVG defs
  const ensureGradient = (map: L.Map) => {
    const svg = map.getPanes().overlayPane.querySelector('svg');
    if (!svg) return;
    let defs = svg.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      svg.insertBefore(defs, svg.firstChild);
    }
    if (!defs.querySelector('#route-gradient')) {
      const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
      gradient.id = 'route-gradient';
      gradient.setAttribute('x1', '0%');
      gradient.setAttribute('y1', '0%');
      gradient.setAttribute('x2', '100%');
      gradient.setAttribute('y2', '100%');
      
      const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stop1.setAttribute('offset', '0%');
      stop1.setAttribute('stop-color', '#3B82F6');
      
      const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stop2.setAttribute('offset', '100%');
      stop2.setAttribute('stop-color', '#7C3AED');
      
      gradient.appendChild(stop1);
      gradient.appendChild(stop2);
      defs.appendChild(gradient);
    }
  };

  const updateMapLayers = useCallback((
    map: L.Map,
    fromCoords: [number, number] | null,
    toCoords:   [number, number] | null,
    fromLabel:  string,
    toLabel:    string,
    geometry:   [number, number][] | null | undefined,
  ) => {
    fromMarkerRef.current?.remove();
    toMarkerRef.current?.remove();
    glowLineRef.current?.remove();
    coreLineRef.current?.remove();
    midpointMarkersRef.current.forEach(m => m.remove());
    
    fromMarkerRef.current = toMarkerRef.current = glowLineRef.current = coreLineRef.current = null;
    midpointMarkersRef.current = [];

    if (!fromCoords && !toCoords) {
      map.setView(INDIA_CENTER, 5, { animate: true });
      return;
    }

    if (fromCoords) {
      fromMarkerRef.current = L.marker(fromCoords, { icon: pulsingFromIcon(fromLabel) }).addTo(map);
    }
    if (toCoords) {
      toMarkerRef.current = L.marker(toCoords, { icon: solidToIcon(toLabel) }).addTo(map);
    }

    if (fromCoords && toCoords) {
      const path: [number, number][] = geometry?.length ? geometry : [fromCoords, toCoords];
      ensureGradient(map);

      // Outer glow layer: weight 6, opacity 0.3, color #7C3AED
      glowLineRef.current = L.polyline(path, {
        color: '#7C3AED',
        weight: 6,
        opacity: 0.3,
        className: 'route-path'
      }).addTo(map);

      // Inner core layer: weight 3, opacity 0.9, color gradient (#3B82F6 to #7C3AED)
      coreLineRef.current = L.polyline(path, {
        color: 'url(#route-gradient)',
        weight: 3,
        opacity: 0.9,
        className: 'route-path'
      }).addTo(map);

      // Draw midpoint stops: radius 5, color #94A3B8, opacity 0.6, no labels at segment transitions
      if (geometry && geometry.length > 2 && route && route.segments.length > 1) {
        const totalDur = route.segments.reduce((acc, s) => acc + (parseInt(s.duration || '') || 5), 0);
        let accumulatedDur = 0;
        
        for (let i = 0; i < route.segments.length - 1; i++) {
          const seg = route.segments[i];
          accumulatedDur += parseInt(seg.duration || '') || 5;
          const ratio = accumulatedDur / totalDur;
          const idx = Math.floor(geometry.length * ratio);
          const stopCoords = geometry[idx];
          if (stopCoords) {
            const stopMarker = L.circleMarker(stopCoords, {
              radius: 5,
              color: '#94A3B8',
              fillColor: '#94A3B8',
              fillOpacity: 0.6,
              weight: 0,
            }).addTo(map);
            midpointMarkersRef.current.push(stopMarker);
          }
        }
      }

      map.fitBounds(L.latLngBounds(path), { padding: [50, 50], maxZoom: 14, animate: true });
    } else {
      map.setView((fromCoords ?? toCoords)!, 13, { animate: true });
    }
  }, [route]);

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: INDIA_CENTER, zoom: 5,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: false,
      dragging: true,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(map);
    L.control.attribution({ position: 'bottomright', prefix: '' })
      .addAttribution('<a href="https://openstreetmap.org/copyright" style="font-size:8px">© OSM / Nominatim</a>')
      .addTo(map);
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 120);
    return () => {
      map.remove();
      mapRef.current = fromMarkerRef.current = toMarkerRef.current = glowLineRef.current = coreLineRef.current = null;
      midpointMarkersRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update layers on coord/geometry change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (fromResult.loading || toResult.loading) return;
    updateMapLayers(map, fromResult.coords, toResult.coords, from, to, routeGeometry);
  }, [fromResult.coords, fromResult.loading, toResult.coords, toResult.loading, from, to, routeGeometry, updateMapLayers]);

  const height = compact ? '160px' : '200px';

  const zoomIn  = () => mapRef.current?.zoomIn();
  const zoomOut = () => mapRef.current?.zoomOut();
  
  const locateMe = () => {
    const map = mapRef.current;
    if (!map) return;
    const fromCoords = fromResult.coords;
    const toCoords = toResult.coords;
    if (fromCoords && toCoords) {
      const path = routeGeometry?.length ? routeGeometry : [fromCoords, toCoords];
      map.fitBounds(L.latLngBounds(path), { padding: [50, 50], animate: true });
    } else if (fromCoords || toCoords) {
      map.setView((fromCoords ?? toCoords)!, 13, { animate: true });
    } else {
      map.setView(INDIA_CENTER, 5, { animate: true });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-4">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50/60">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-success-green inline-block flex-shrink-0 animate-pulse" />
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
            {routeGeometry ? 'Live Road Route' : 'Route Preview'}
          </span>
          {routeGeometry && (
            <span className="ml-1 text-[9px] bg-ai-indigo text-white font-bold px-1.5 py-0.5 rounded-full">
              OSRM
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <StatusPill loading={fromResult.loading} notFound={fromResult.notFound} name={from} color="#16a34a" />
          {from.trim() && to.trim() && <span className="text-gray-300 text-[10px]">→</span>}
          <StatusPill loading={toResult.loading} notFound={toResult.notFound} name={to} color="#7C3AED" />
        </div>
      </div>

      {/* Map + overlays */}
      <div className="relative">
        {(fromResult.loading || toResult.loading) && (
          <div className="absolute inset-0 z-[999] flex items-center justify-center bg-white/60 backdrop-blur-[2px]">
            <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2 shadow-md border border-gray-100">
              <span className="animate-spin w-4 h-4 border-2 border-ai-indigo border-t-transparent rounded-full inline-block" />
              <span className="text-xs text-gray-500 font-medium">Geocoding…</span>
            </div>
          </div>
        )}

        <div ref={containerRef} style={{ height }} />

        {/* Gradient bottom overlay */}
        <div className="map-fade-overlay" />

        {/* Custom zoom controls */}
        <div className="absolute bottom-10 right-2 z-[500] flex flex-col gap-1">
          <button
            onClick={zoomIn}
            className="w-7 h-7 bg-white rounded-lg shadow-md border border-gray-200 flex items-center justify-center text-gray-700 font-bold text-sm hover:bg-gray-50 active:scale-95 transition-all"
          >+</button>
          <button
            onClick={zoomOut}
            className="w-7 h-7 bg-white rounded-lg shadow-md border border-gray-200 flex items-center justify-center text-gray-700 font-bold text-sm hover:bg-gray-50 active:scale-95 transition-all"
          >−</button>
        </div>

        {/* Locate Me */}
        <button
          onClick={locateMe}
          className="absolute bottom-10 left-2 z-[500] bg-white rounded-full shadow-md border border-gray-200 text-[11px] font-bold text-gray-700 px-3 py-1.5 flex items-center gap-1 hover:bg-gray-50 active:scale-95 transition-all"
        >
          📍 Locate Me
        </button>

        {/* Live OSRM trust badge */}
        <div className="absolute top-2 left-2 z-[500]">
          <span className="flex items-center gap-1.5 bg-white text-[10px] font-bold text-gray-700 px-2.5 py-1 rounded-full shadow-md border border-gray-100">
            <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse inline-block" />
            Live OSRM Route
          </span>
        </div>
      </div>
    </div>
  );
}
