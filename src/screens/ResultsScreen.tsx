import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Clock, Shield, ChevronDown, ChevronUp,
  Sparkles, Eye, EyeOff
} from 'lucide-react';
import { Route } from '../data/mockData';
import { RouteMap } from '../components/RouteMap';

// ─── Per-route "Why Recommended" content ─────────────────────────────────────
const whyRecommendedText: Record<number, string> = {
  1: "Fastest route combining metro speed with minimal walking. Safety 92% — well above safe threshold. Fare locked for 10 minutes.",
  2: "Most affordable at ₹48. Single bus journey with just 1 transfer. Good for budget commuters.",
  3: "Lowest carbon footprint. Metro-only journey saves 1.2kg CO₂ and earns maximum green points in your wallet.",
};

// ─── Priority 3: Dynamic AI insight ──────────────────────────────────────────
function generateInsight(
  preferences: string[],
  safeMode: boolean,
  allRoutes: Route[],
  displayRoutes: Route[],
): string {
  const top = displayRoutes[0];
  if (!top) return `Turn off Safe Mode to see available routes.`;

  const hour = new Date().getHours();
  const isPeakHour = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20);

  if (safeMode && preferences.includes('Women Safe')) {
    return `Safe Mode and Women Safe active — showing routes with 80%+ safety. Route ${top.id} leads at ${top.safety}%.`;
  }
  if (preferences.includes('Fastest')) {
    const fastest = [...allRoutes].sort((a, b) => a.durationMinutes - b.durationMinutes)[0];
    const second = [...allRoutes].sort((a, b) => a.durationMinutes - b.durationMinutes)[1];
    const saved = second ? second.durationMinutes - fastest.durationMinutes : 0;
    return `Route ${fastest.id} is ${saved} min faster than the next option via metro.`;
  }
  if (preferences.includes('Cheapest')) {
    const cheapest = [...allRoutes].sort((a, b) => a.price - b.price)[0];
    const second = [...allRoutes].sort((a, b) => a.price - b.price)[1];
    const saved = second ? second.price - cheapest.price : 0;
    return `Route ${cheapest.id} saves Rs.${saved} compared to the next cheapest option.`;
  }
  if (preferences.includes('Eco-Friendly')) {
    const eco = [...allRoutes].sort((a, b) => b.co2Saved - a.co2Saved)[0];
    return `Route ${eco.id} saves ${eco.co2Saved}kg CO2 — maximum green wallet points earned.`;
  }
  if (preferences.includes('Women Safe')) {
    const safest = [...allRoutes].sort((a, b) => b.safety - a.safety)[0];
    return `Route ${safest.id} has the highest safety score at ${safest.safety}% with verified driver.`;
  }
  if (preferences.includes('Least Transfers')) {
    const fewest = [...allRoutes].sort((a, b) => a.transfers - b.transfers)[0];
    return `Route ${fewest.id} has only ${fewest.transfers} transfer(s) — simplest journey available.`;
  }
  if (preferences.includes('Accessible')) {
    return `Route ${top.id} metro stops have elevator and wheelchair access.`;
  }
  if (safeMode) {
    return `Safe Mode ON — Route ${top.id} leads at ${top.safety}% safety. Lower routes hidden.`;
  }
  if (isPeakHour) {
    return `Peak hour — Route ${top.id} saves 8 min avoiding congested surface roads.`;
  }
  return `Fare locked 9 min — book now to avoid surge pricing.`;
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface ResultsScreenProps {
  routes: Route[];
  routesFound: boolean;
  selectedRouteId: number | null;
  setSelectedRouteId: (id: number) => void;
  preferences: string[];
  safeMode: boolean;
  fromLocation: string;
  toLocation: string;
  routeGeometry?: [number, number][] | null;
  distanceKm?: number | null;
  durationMin?: number | null;
  isRealData?: boolean;
  departureTime: string;
}

export function ResultsScreen({
  routes,
  routesFound,
  selectedRouteId,
  setSelectedRouteId,
  preferences,
  safeMode,
  fromLocation,
  toLocation,
  routeGeometry,
  distanceKm,
  durationMin,
  isRealData,
  departureTime: _departureTime,
}: ResultsScreenProps) {
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [lockTime] = useState(Date.now() + 9 * 60 * 1000 + 45 * 1000);
  const [aiLoading, setAiLoading] = useState(false);
  const [shimmerLoading, setShimmerLoading] = useState(true);

  // Initial skeleton loader delay (800ms)
  useEffect(() => {
    setShimmerLoading(true);
    const t = setTimeout(() => setShimmerLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  // ─── Priority 1: Full preference-based sorting ──────────────────────────────
  const displayRoutes = useMemo(() => {
    let result = [...routes];

    if (safeMode) {
      result = result.filter((r) => r.safety >= 80);
    }

    if (preferences.includes('Fastest')) {
      result.sort((a, b) => a.durationMinutes - b.durationMinutes);
    } else if (preferences.includes('Cheapest')) {
      result.sort((a, b) => a.price - b.price);
    } else if (preferences.includes('Eco-Friendly')) {
      result.sort((a, b) => b.co2Saved - a.co2Saved);
    } else if (preferences.includes('Women Safe')) {
      result.sort((a, b) => b.safety - a.safety);
    } else if (preferences.includes('Accessible')) {
      result.sort((a, b) => {
        const aHasMetro = a.segments.some((s) => s.type === 'metro') ? 1 : 0;
        const bHasMetro = b.segments.some((s) => s.type === 'metro') ? 1 : 0;
        return bHasMetro - aHasMetro || b.safety - a.safety;
      });
    } else if (preferences.includes('Least Transfers')) {
      result.sort((a, b) => a.transfers - b.transfers);
    } else {
      result.sort((a, b) => b.score - a.score);
    }

    return result;
  }, [routes, safeMode, preferences]);

  const activeRoute = useMemo(() => {
    return displayRoutes.find(r => r.id === selectedRouteId) ?? displayRoutes[0] ?? null;
  }, [displayRoutes, selectedRouteId]);

  const hiddenCount = useMemo(() => {
    if (!safeMode) return 0;
    return routes.filter((r) => r.safety < 80).length;
  }, [routes, safeMode]);

  // AI Insight loading and updates
  const [aiInsight, setAiInsight] = useState(() =>
    generateInsight(preferences, safeMode, routes, routes)
  );
  const [displayedInsight, setDisplayedInsight] = useState('');

  useEffect(() => {
    setAiLoading(true);
    const t = setTimeout(() => {
      const newInsight = generateInsight(preferences, safeMode, routes, displayRoutes);
      setAiInsight(newInsight);
      setAiLoading(false);
    }, 600);
    return () => clearTimeout(t);
  }, [preferences, safeMode, routes, displayRoutes]);

  useEffect(() => {
    if (!aiLoading) {
      setDisplayedInsight(aiInsight);
    }
  }, [aiInsight, aiLoading]);

  // Fare lock countdown
  const formatTime = useCallback(() => {
    const diff = Math.max(0, lockTime - Date.now());
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, [lockTime]);

  const [timeDisplay, setTimeDisplay] = useState(formatTime());
  useEffect(() => {
    const interval = setInterval(() => setTimeDisplay(formatTime()), 1000);
    return () => clearInterval(interval);
  }, [formatTime]);

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>, routeId: number) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ripple = document.createElement('span');
    ripple.style.position = 'absolute';
    ripple.style.width = '100px';
    ripple.style.height = '100px';
    ripple.style.background = '#4338CA';
    ripple.style.opacity = '0.15';
    ripple.style.borderRadius = '50%';
    ripple.style.pointerEvents = 'none';
    ripple.style.left = `${x - 50}px`;
    ripple.style.top = `${y - 50}px`;
    ripple.style.transform = 'scale(0)';
    ripple.style.transition = 'transform 400ms ease-out, opacity 400ms ease-out';
    ripple.style.zIndex = '5';

    card.appendChild(ripple);

    requestAnimationFrame(() => {
      ripple.style.transform = 'scale(3.5)';
      ripple.style.opacity = '0';
    });

    setTimeout(() => {
      ripple.remove();
    }, 400);

    setSelectedRouteId(routeId);
  };

  const getSegmentColor = (type: string) => {
    switch (type) {
      case 'metro': return 'bg-blue-500';
      case 'bus': return 'bg-coral-orange';
      case 'auto': return 'bg-purple-500';
      default: return 'bg-gray-400';
    }
  };

  const getSegmentPillColor = (type: string) => {
    switch (type) {
      case 'metro': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'bus': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'auto': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const activeSortLabel = useMemo(() => {
    const order = ['Fastest', 'Cheapest', 'Eco-Friendly', 'Women Safe', 'Accessible', 'Least Transfers'];
    const active = order.find((p) => preferences.includes(p));
    return active ?? 'Best Match';
  }, [preferences]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-24">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-deep-indigo px-4 pt-12 pb-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-white font-bold text-xl">Route Results</h1>
              <span className="text-[11px] text-gray-300 font-medium bg-white/10 px-2 py-0.5 rounded-full mt-1">
                Updated just now
              </span>
            </div>
            <p className="text-gray-300 text-sm mt-0.5 truncate max-w-[200px]">
              {fromLocation} → {toLocation}
            </p>
            {isRealData && distanceKm && durationMin && (
              <p className="text-cyan-300 text-xs mt-1 font-semibold flex items-center gap-1">
                <span>{distanceKm.toFixed(1)} km</span>
                <span>·</span>
                <span>{durationMin} min</span>
                <span className="bg-cyan-400 text-ai-indigo text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-1 uppercase">
                  OSRM
                </span>
              </p>
            )}
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/15 text-white border border-white/25">
            ↕ {activeSortLabel}
          </span>
        </div>

        {safeMode && (
          <div className="mt-3 flex items-center justify-between bg-green-500/20 border border-green-400/30 rounded-lg px-3 py-2">
            <div className="flex items-center gap-2">
              <Shield size={13} className="text-green-400" />
              <span className="text-green-300 text-xs font-medium">
                Safe Mode ON — 80%+ safety only
              </span>
            </div>
            {hiddenCount > 0 && (
              <div className="flex items-center gap-1">
                <EyeOff size={11} className="text-yellow-400" />
                <span className="text-yellow-400 text-xs font-medium">
                  {hiddenCount} route{hiddenCount !== 1 ? 's' : ''} hidden
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Glassmorphism AI Insight card ──────────────────────────────────── */}
      <div className="px-4 -mt-2 mb-1">
        <div className="glass-card p-4 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={17} className="text-cyan-300 animate-pulse" />
            <span className="font-bold text-sm">AI Insight</span>
            <span className="bg-white/20 text-white text-[9px] font-bold px-2 py-0.5 rounded-full ml-auto">
              Live
            </span>
          </div>
          {aiLoading ? (
            <div className="flex flex-col items-center justify-center py-2">
              <div className="thinking-dots">
                <span>·</span><span>·</span><span>·</span>
              </div>
              <span className="text-xs text-white/60 mt-1">AI is analyzing traffic...</span>
            </div>
          ) : (
            <>
              <p className="text-sm text-indigo-100 leading-relaxed min-h-[40px]">{displayedInsight}</p>
              <p className="text-[11px] text-white/50 mt-2">Updated just now · Live traffic data</p>
            </>
          )}
        </div>
      </div>

      {/* ── Compact Route Map ───────────────────────────────────────────────── */}
      <div className="px-4">
        <RouteMap from={fromLocation} to={toLocation} compact routeGeometry={routeGeometry} route={activeRoute} />
      </div>

      {safeMode && hiddenCount > 0 && displayRoutes.length > 0 && (
        <div className="mx-4 mt-3 mb-1 flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
          <Eye size={14} className="text-yellow-600 flex-shrink-0" />
          <p className="text-xs text-yellow-700 font-medium">
            {hiddenCount} route{hiddenCount !== 1 ? 's' : ''} hidden due to safety preferences
            &nbsp;·&nbsp; showing {displayRoutes.length} of {routes.length}
          </p>
        </div>
      )}

      {/* ── Empty states ────────────────────────────────────────────────────── */}
      {!routesFound && (
        <div className="bg-white rounded-xl p-8 text-center border border-[#E2E8F0] mt-4 mx-4 shadow-sm">
          <div className="text-4xl mb-3">🗺️</div>
          <p className="font-semibold text-gray-700">No routes found</p>
          <p className="text-sm text-gray-400 mt-1 leading-relaxed">
            We couldn't resolve the route between&nbsp;
            <span className="font-medium text-deep-indigo">{fromLocation}</span>
            &nbsp;and&nbsp;
            <span className="font-medium text-deep-indigo">{toLocation}</span>.
          </p>
        </div>
      )}

      {routesFound && displayRoutes.length === 0 && (
        <div className="bg-white rounded-xl p-8 text-center border border-[#E2E8F0] mt-4 mx-4 shadow-sm">
          <Shield size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="font-semibold text-gray-600">No safe routes found</p>
          <p className="text-sm text-gray-400 mt-1">Turn off Safe Mode to see all {routes.length} routes</p>
        </div>
      )}

      {/* ── Route Cards ─────────────────────────────────────────────────────── */}
      <div className="px-4 mt-3 space-y-3">
        {shimmerLoading ? (
          [1, 2, 3].map((idx) => (
            <div key={idx} className="shimmer-card h-[130px] w-full" />
          ))
        ) : (
          displayRoutes.map((route, rank) => {
            const isRecommended = route.score === Math.max(...displayRoutes.map(r => r.score));
            return (
              <div
                key={route.id}
                onClick={(e) => handleCardClick(e, route.id)}
                className={`route-card bg-white rounded-xl shadow-sm border-2 p-4 cursor-pointer relative overflow-hidden ${selectedRouteId === route.id ? 'route-card-selected' : 'border-[#E2E8F0]'
                  }`}
              >
                {/* Rank & Tags Header */}
                <div className="flex items-center gap-2 mb-3 relative z-10">
                  <div className="w-10 h-10 rounded-full bg-coral-orange flex items-center justify-center flex-shrink-0 relative">
                    <span className="text-white font-bold text-lg">{route.score}</span>
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-deep-indigo text-white text-[9px] font-bold flex items-center justify-center">
                      {rank + 1}
                    </span>
                  </div>

                  {isRecommended && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-[#3B82F6] to-[#7C3AED] text-white flex items-center gap-0.5 shadow-sm">
                      ⭐ Recommended
                    </span>
                  )}

                  <div className="flex flex-wrap gap-1.5 flex-1 pl-1">
                    {route.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${tag === 'Fastest' ? 'bg-green-100 text-green-700'
                            : tag === 'Cheapest' ? 'bg-blue-100 text-blue-700'
                              : tag === 'Eco' ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-green-100 text-green-700'
                          }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {route.onTime ? (
                    <span className="text-xs font-medium text-green-600 bg-green-55 px-2 py-0.5 rounded-full whitespace-nowrap">
                      On Time
                    </span>
                  ) : (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 whitespace-nowrap">
                      {route.lateMinutes} min late
                    </span>
                  )}
                </div>

                {/* Time and Price */}
                <div className="flex justify-between items-center mb-2 relative z-10">
                  <div className="flex items-center gap-1.5">
                    <Clock size={16} className="text-gray-400" />
                    <span className="font-bold text-lg text-dark-text">{route.duration}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-500">Total</span>
                    <span className="font-bold text-lg text-dark-text ml-1">₹{route.price}</span>
                  </div>
                </div>

                <p className="text-sm text-gray-500 mb-3 relative z-10">{route.timeRange}</p>

                {/* Segment Bar */}
                <div className="flex h-2 rounded-full overflow-hidden mb-3 relative z-10">
                  {route.segments.map((segment, i) => (
                    <div
                      key={i}
                      className={`${getSegmentColor(segment.type)} ${i < route.segments.length - 1 ? 'mr-0.5' : ''}`}
                      style={{ flex: segment.duration ? 1 : 0.3 }}
                    />
                  ))}
                </div>

                {/* Segment Pills */}
                <div className="flex flex-wrap gap-1.5 mb-3 relative z-10">
                  {route.segments.map((segment, i) => (
                    <span
                      key={i}
                      className={`text-xs font-medium px-2 py-0.5 rounded-full border flex items-center gap-1 ${getSegmentPillColor(segment.type)}`}
                    >
                      {segment.label}
                      {segment.crowd && <span className="text-orange-600">· {segment.crowd}</span>}
                    </span>
                  ))}
                </div>

                {/* Modern Emojis Stats Row */}
                <div className="flex items-center gap-4 text-xs font-semibold text-gray-500 mt-3 pl-1 relative z-10">
                  <span className={`flex items-center gap-1 ${route.safety >= 80 ? '' : 'text-red-500'}`}>
                    🛡️ {route.safety}%
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">🌿 {route.co2Saved}kg</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">🔁 {route.transfers}</span>
                </div>

                {/* Price Lock Pulse Banner */}
                {route.priceLocked && selectedRouteId === route.id && (
                  <div className="mt-3 bg-green-50 rounded-lg p-2.5 flex items-center justify-between price-lock-bar relative z-10">
                    <span className="text-sm text-green-800 font-medium">
                      🔒 Price locked for <span className="font-extrabold text-green-950">{timeDisplay}</span>
                    </span>
                    <div className="w-2.5 h-2.5 rounded-full bg-green-550 animate-pulse" />
                  </div>
                )}

                {/* Why Recommended */}
                <div className="mt-3 relative z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedCard(expandedCard === route.id ? null : route.id);
                    }}
                    className="flex items-center gap-1 text-sm text-ai-indigo font-semibold"
                  >
                    Why Recommended?
                    {expandedCard === route.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {expandedCard === route.id && (
                    <p className="mt-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3 border border-[#E2E8F0]">
                      {whyRecommendedText[route.id] ??
                        "This route optimizes for your selected preferences, combining fast connectivity with minimal transfers for a safe and efficient journey."}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
