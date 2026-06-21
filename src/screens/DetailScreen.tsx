import { useEffect, useRef, useState } from 'react';
import { Navigation, Share2, AlertTriangle, Clock } from 'lucide-react';
import { Route, JourneyStep } from '../data/mockData';

// ── Advance time string by N minutes ─────────────────────────────────────────
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

// ── Logical stop label per transit mode ──────────────────────────────────────
function stopLabel(type: string, line?: string): string {
  switch (type) {
    case 'metro': return `Metro Station (${line && line !== 'Express' ? line : (line ?? 'Metro')})`;
    case 'bus': return 'Bus Stop / Transit Point';
    case 'auto': return 'Auto Pickup Point';
    default: return 'Pedestrian Waypoint';
  }
}

// ── Safety score per mode ─────────────────────────────────────────────────────
function modeSafety(type: string): number {
  switch (type) {
    case 'metro': return 92;
    case 'bus': return 81;
    case 'auto': return 79;
    default: return 87;
  }
}

// ── Build timeline steps from route.segments (single source of truth) ─────────
function buildStepsFromSegments(from: string, to: string, route: Route, departureTime: string): JourneyStep[] {
  const steps: JourneyStep[] = [];
  let currentTime = departureTime || '9:15 AM';
  let id = 1;

  steps.push({ id: id++, location: from, time: currentTime, description: `Depart from ${from}` });

  const knownMinutes = route.segments.reduce((sum, seg) => {
    return sum + (seg.duration ? parseInt(seg.duration) || 0 : 0);
  }, 0);

  const unknownCount = route.segments.filter(s =>
    !s.duration || parseInt(s.duration) === 0
  ).length;

  const remainingMinutes = route.durationMinutes - knownMinutes;
  const walkDuration = unknownCount > 0
    ? Math.max(1, Math.floor(remainingMinutes / unknownCount))
    : 3;

  const segs = route.segments;
  for (let i = 0; i < segs.length; i++) {
    const seg = segs[i];
    const isLast = i === segs.length - 1;
    const segDuration = seg.duration
      ? parseInt(seg.duration) || walkDuration
      : walkDuration;
    currentTime = advanceTime(currentTime, segDuration);

    let location = isLast ? to : stopLabel(seg.type, seg.line);
    if (!isLast && seg.type === 'metro') {
      location = seg.boardAt ?? 'Metro Station';
    }

    let desc = '';
    if (isLast) {
      desc = `Arrived at ${to}`;
    } else if (seg.type === 'metro') {
      const boardStr = seg.boardAt ? ` · Board at ${seg.boardAt}` : '';
      const alightStr = seg.alightAt ? ` · Alight at ${seg.alightAt}` : '';
      const metroLabel = seg.line && seg.line !== 'Express' ? seg.line : (seg.line ?? 'Metro');
      desc = `Metro ${metroLabel}${boardStr}${alightStr}${seg.duration ? ` · ${seg.duration}` : ` · ${walkDuration} min`}`;
    } else {
      desc = `${seg.label}${seg.line ? ` · ${seg.line}` : ''
        }${seg.crowd ? ` · Crowd: ${seg.crowd}` : ''
        }${seg.duration ? ` · ${seg.duration}` : ` · ${walkDuration} min`
        }`;
    }

    steps.push({
      id: id++,
      location,
      time: currentTime,
      description: desc,
      safety: seg.type !== 'walk' ? modeSafety(seg.type) : undefined,
      segment: isLast ? undefined : seg,
    });
  }

  return steps;
}

// ── Step left border and background tint ──────────────────────────────────────
function getStepBorderAndBg(step: JourneyStep, index: number, total: number) {
  if (index === 0) {
    return { border: 'border-l-[3px] border-l-[#16A34A]', bg: 'bg-[#16A34A]/[0.04]' };
  }
  if (index === total - 1) {
    return { border: 'border-l-[3px] border-l-[#7C3AED]', bg: 'bg-[#7C3AED]/[0.04]' };
  }
  const mode = step.segment?.type;
  switch (mode) {
    case 'walk':
      return { border: 'border-l-[3px] border-l-[#94A3B8]', bg: 'bg-[#94A3B8]/[0.04]' };
    case 'metro':
      return { border: 'border-l-[3px] border-l-[#3B82F6]', bg: 'bg-[#3B82F6]/[0.04]' };
    case 'bus':
      return { border: 'border-l-[3px] border-l-[#EA580C]', bg: 'bg-[#EA580C]/[0.04]' };
    case 'train':
      return { border: 'border-l-[3px] border-l-[#16A34A]', bg: 'bg-[#16A34A]/[0.04]' };
    default:
      return { border: 'border-l-[3px] border-l-[#94A3B8]', bg: 'bg-[#94A3B8]/[0.04]' };
  }
}

// ── Step icons ───────────────────────────────────────────────────────────────
function getStepIcon(step: JourneyStep, index: number, total: number) {
  if (index === 0) return '📍';
  if (index === total - 1) return '🏁';
  const mode = step.segment?.type;
  switch (mode) {
    case 'walk': return '🚶';
    case 'metro': return '🚇';
    case 'bus': return '🚌';
    case 'train': return '🚆';
    default: return '🚶';
  }
}

function getStepCircleBg(step: JourneyStep, index: number, total: number) {
  if (index === 0) return 'bg-[#16A34A]';
  if (index === total - 1) return 'bg-[#7C3AED]';
  const mode = step.segment?.type;
  switch (mode) {
    case 'walk': return 'bg-[#94A3B8]';
    case 'metro': return 'bg-[#3B82F6]';
    case 'bus': return 'bg-[#EA580C]';
    case 'train': return 'bg-[#16A34A]';
    default: return 'bg-gray-400';
  }
}

interface DetailScreenProps {
  route: Route | null;
  fromLocation: string;
  toLocation: string;
  onShareLocation: () => void;
  onBook: () => void;
  onSOS: () => void;
  departureTime: string;
}

export function DetailScreen({
  route,
  fromLocation,
  toLocation,
  onShareLocation,
  onBook,
  onSOS,
  departureTime,
}: DetailScreenProps) {
  const [headerShimmer, setHeaderShimmer] = useState(false);
  const prevRouteIdRef = useRef<number | null>(route?.id ?? null);

  useEffect(() => {
    if (route && route.id !== prevRouteIdRef.current) {
      prevRouteIdRef.current = route.id;
      setHeaderShimmer(true);
      const timer = setTimeout(() => setHeaderShimmer(false), 300);
      return () => clearTimeout(timer);
    }
  }, [route]);

  if (!route) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 pb-36">
        <p className="text-gray-500 font-medium text-sm">No route selected. Please find a route first.</p>
      </div>
    );
  }

  const knownMinutes = route.segments.reduce((sum, seg) => {
    return sum + (seg.duration ? parseInt(seg.duration) || 0 : 0);
  }, 0);

  const unknownCount = route.segments.filter(s =>
    !s.duration || parseInt(s.duration) === 0
  ).length;

  const remainingMinutes = route.durationMinutes - knownMinutes;
  const walkDuration = unknownCount > 0
    ? Math.max(1, Math.floor(remainingMinutes / unknownCount))
    : 3;

  const steps = buildStepsFromSegments(fromLocation, toLocation, route, departureTime);

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

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-36">
      {/* Header with 300ms shimmer animation on route changes */}
      <div className={`bg-deep-indigo px-4 pt-12 pb-6 transition-all duration-300 ${headerShimmer ? 'shimmer-card !bg-none opacity-80' : ''}`}>
        {headerShimmer ? (
          <div className="h-10" />
        ) : (
          <>
            <h1 className="text-white font-bold text-xl">Journey Details</h1>
            <p className="text-gray-300 text-sm mt-1">
              {route.duration} &middot; ₹{route.price} &middot; {route.transfers} transfer{route.transfers !== 1 ? 's' : ''}
            </p>
          </>
        )}
      </div>

      {/* Live Update Banner */}
      <div className="px-4 -mt-2">
        <div className="bg-amber-55 border border-amber-200 rounded-xl p-3 flex items-start gap-3">
          <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-amber-800">Live Update</span>
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            </div>
            <p className="text-sm text-amber-700 mt-1">
              {route.onTime
                ? 'All transit services on this route are running normally.'
                : `Delay of ${route.lateMinutes || 3} min detected - connections remain safe.`}
            </p>
          </div>
        </div>
      </div>

      {/* Route Map Card */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Navigation size={18} className="text-ai-indigo" />
            <span className="font-bold text-dark-text text-sm">Route Map</span>
          </div>

          <div className="flex items-center h-2.5 rounded-full overflow-hidden bg-gray-100">
            {route.segments.map((segment, i) => {
              const segDuration = segment.duration ? parseInt(segment.duration) || walkDuration : walkDuration;
              return (
                <div
                  key={i}
                  className={`${getSegmentColor(segment.type)} h-full`}
                  style={{ flex: segDuration }}
                />
              );
            })}
          </div>

          <div className="flex justify-between mt-2 text-[10px] text-gray-550 overflow-x-auto whitespace-nowrap gap-2">
            {route.segments.map((segment, i) => (
              <span key={i} className="flex items-center gap-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${getSegmentColor(segment.type)}`} />
                {segment.type === 'metro'
                  ? (segment.line && segment.line !== 'Express' ? segment.line : (segment.line ?? 'Metro'))
                  : segment.label} {segment.duration ? `(${segment.duration})` : `(${walkDuration} min)`}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Step-by-Step Journey */}
      <div className="px-4 mt-6">
        <h2 className="font-bold text-dark-text mb-4 text-base">Step-by-Step Journey</h2>

        <div className="relative">
          {/* Connecting gradient timeline rail */}
          <div className="absolute left-[15px] top-6 bottom-6 w-[3px] rounded bg-gradient-to-b from-[#3B82F6] via-[#EA580C] to-[#7C3AED]" />

          <div className="space-y-4">
            {steps.map((step, index) => {
              const style = getStepBorderAndBg(step, index, steps.length);
              return (
                <div
                  key={step.id}
                  className="step-card flex gap-4"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className="relative z-10">
                    <div
                      className={`w-8 h-8 rounded-full ${getStepCircleBg(step, index, steps.length)} flex items-center justify-center shadow-sm text-sm`}
                    >
                      {getStepIcon(step, index, steps.length)}
                    </div>
                  </div>
                  <div className={`flex-1 bg-white rounded-xl border border-[#E2E8F0] p-3 shadow-sm transition-all ${style.border} ${style.bg}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-dark-text text-sm">{step.location}</span>
                      {step.safety !== undefined && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${step.safety >= 80
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                            }`}
                        >
                          {step.safety}% safe
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Clock size={12} className="text-gray-400" />
                      {step.time}
                    </p>
                    <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{step.description}</p>
                    {step.segment && (
                      <span
                        className={`inline-block mt-2 text-xs font-semibold px-2 py-1 rounded-full border ${getSegmentPillColor(step.segment.type)}`}
                      >
                        {step.segment.type === 'metro'
                          ? (step.segment.line && step.segment.line !== 'Express' ? step.segment.line : (step.segment.line ?? 'Metro'))
                          : step.segment.label}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Share Live Location Button */}
      <div className="px-4 mt-6">
        <button
          onClick={onShareLocation}
          className="btn-tap w-full bg-ai-indigo hover:bg-ai-indigo/90 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-md"
        >
          <Share2 size={18} />
          Share Live Location
        </button>
      </div>

      {/* Fixed Bottom Book Button */}
      <div className="fixed bottom-16 left-0 right-0 flex justify-center pointer-events-none">
        <div className="w-full max-w-[390px] px-4 py-3 bg-white border-t border-gray-100 pointer-events-auto">
          <button
            onClick={onBook}
            className="btn-tap w-full bg-coral-orange hover:bg-coral-orange/95 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-coral-orange/25"
          >
            Book This Journey — ₹{route.price}
          </button>
        </div>
      </div>

      {/* SOS Button */}
      <div className="fixed bottom-36 right-0 left-0 flex justify-end pointer-events-none">
        <div className="w-full max-w-[390px] pr-4 pointer-events-auto">
          <button
            onClick={onSOS}
            className="w-14 h-14 rounded-full bg-[#DC2626] text-white font-bold text-sm shadow-lg animate-pulse-sos flex items-center justify-center"
          >
            SOS
          </button>
        </div>
      </div>
    </div>
  );
}
