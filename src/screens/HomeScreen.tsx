import { useState, useEffect, useMemo } from 'react';
import { MapPin, ArrowUpDown, Shield, Search, Clock, ArrowRight } from 'lucide-react';
import { preferenceOptions } from '../data/mockData';
import { RouteMap } from '../components/RouteMap';

const LOCATIONS = [
  'Connaught Place',
  'Cyber City',
  'Noida Sector 18',
  'IIT Delhi',
  'Dwarka',
  'Hauz Khas',
];

interface HomeScreenProps {
  preferences: string[];
  togglePreference: (pref: string) => void;
  safeMode: boolean;
  setSafeMode: (value: boolean) => void;
  onSearch: () => void;
  // Location state lifted to App so map stays in sync with Results tab
  fromLocation: string;
  toLocation: string;
  setFromLocation: (v: string) => void;
  setToLocation: (v: string) => void;
  routeGeometry?: [number, number][] | null;
  departureMode: 'now' | 'schedule';
  setDepartureMode: (mode: 'now' | 'schedule') => void;
  scheduleDate: string;
  setScheduleDate: (date: string) => void;
  scheduleTime: string;
  setScheduleTime: (time: string) => void;
  recentSearches: { from: string; to: string }[];
  setRecentSearches: React.Dispatch<React.SetStateAction<{ from: string; to: string }[]>>;
}

export function HomeScreen({
  preferences,
  togglePreference,
  safeMode,
  setSafeMode,
  onSearch,
  fromLocation,
  toLocation,
  setFromLocation,
  setToLocation,
  routeGeometry,
  departureMode,
  setDepartureMode,
  scheduleDate,
  setScheduleDate,
  scheduleTime,
  setScheduleTime,
  recentSearches,
  setRecentSearches: _setRecentSearches,
}: HomeScreenProps) {
  const [fromSuggestions, setFromSuggestions] = useState<string[]>([]);
  const [toSuggestions, setToSuggestions] = useState<string[]>([]);

  const days = useMemo(() => {
    const arr = [];
    const today = new Date();
    for (let i = 0; i < 4; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
      arr.push(label);
    }
    return arr;
  }, []);

  const times = useMemo(() => {
    const arr = [];
    for (let hour = 6; hour <= 23; hour++) {
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      const formattedHour = String(displayHour).padStart(2, '0');
      arr.push(`${formattedHour}:00 ${ampm}`);
      arr.push(`${formattedHour}:30 ${ampm}`);
    }
    return arr;
  }, []);

  useEffect(() => {
    if (!scheduleDate && days.length > 0) {
      setScheduleDate(days[0]);
    }
  }, [scheduleDate, days]);

  useEffect(() => {
    if (!scheduleTime && times.length > 0) {
      setScheduleTime(times[0]);
    }
  }, [scheduleTime, times]);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <div className="bg-deep-indigo px-4 pt-12 pb-6">
        <h1 className="text-white font-bold text-xl">YatraOne ✦</h1>
        <p className="text-gray-300 text-sm mt-1">AI-Powered Journey Planner</p>
      </div>

      <div className="flex-1 px-4 -mt-2 pb-24">
        {/* Search Card */}
        <div className="bg-white rounded-xl shadow-lg border border-[#E2E8F0] p-4">
          {/* From input */}
          <div className="flex items-center gap-3">
            <MapPin size={20} className="text-coral-orange flex-shrink-0" />
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="From - Enter source"
                value={fromLocation}
                onChange={(e) => {
                  const val = e.target.value;
                  setFromLocation(val);
                  const filtered = LOCATIONS.filter(
                    (loc) => loc.toLowerCase().includes(val.toLowerCase()) && val.length > 0
                  );
                  setFromSuggestions(filtered);
                }}
                onFocus={(e) => {
                  if (!e.target.value) {
                    setFromSuggestions([]);
                  } else {
                    const filtered = LOCATIONS.filter(
                      (loc) => loc.toLowerCase().includes(e.target.value.toLowerCase())
                    );
                    setFromSuggestions(filtered);
                  }
                }}
                onBlur={() => setTimeout(() => { setFromSuggestions([]); }, 150)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-dark-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-coral-orange/20"
              />
              {fromSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 mt-1 overflow-hidden">
                  {fromSuggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setFromLocation(s);
                        setFromSuggestions([]);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-dark-text hover:bg-coral-orange/10 flex items-center gap-2 border-b border-gray-50 last:border-0"
                    >
                      <MapPin size={14} className="text-coral-orange flex-shrink-0" />
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Swap button */}
          <div className="flex justify-center my-2">
            <button
              onClick={() => {
                const tmp = fromLocation;
                setFromLocation(toLocation);
                setToLocation(tmp);
              }}
              className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
              title="Swap From/To"
            >
              <ArrowUpDown size={18} className="text-gray-400 rotate-90" />
            </button>
          </div>

          {/* To input */}
          <div className="flex items-center gap-3">
            <MapPin size={20} className="text-success-green flex-shrink-0" />
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="To - Enter destination"
                value={toLocation}
                onChange={(e) => {
                  const val = e.target.value;
                  setToLocation(val);
                  const filtered = LOCATIONS.filter(
                    (loc) => loc.toLowerCase().includes(val.toLowerCase()) && val.length > 0
                  );
                  setToSuggestions(filtered);
                }}
                onFocus={(e) => {
                  if (!e.target.value) {
                    setToSuggestions([]);
                  } else {
                    const filtered = LOCATIONS.filter(
                      (loc) => loc.toLowerCase().includes(e.target.value.toLowerCase())
                    );
                    setToSuggestions(filtered);
                  }
                }}
                onBlur={() => setTimeout(() => { setToSuggestions([]); }, 150)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-dark-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-coral-orange/20"
              />
              {toSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 mt-1 overflow-hidden">
                  {toSuggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setToLocation(s);
                        setToSuggestions([]);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-dark-text hover:bg-coral-orange/10 flex items-center gap-2 border-b border-gray-50 last:border-0"
                    >
                      <MapPin size={14} className="text-success-green flex-shrink-0" />
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Leave Now / Schedule Later */}
          <div className="mt-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDepartureMode('now')}
                className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all ${departureMode === 'now'
                    ? 'bg-coral-orange text-white'
                    : 'bg-gray-50 border border-gray-200 text-gray-600'
                  }`}
              >
                🕐 Leave Now
              </button>
              <button
                type="button"
                onClick={() => setDepartureMode('schedule')}
                className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all ${departureMode === 'schedule'
                    ? 'bg-coral-orange text-white'
                    : 'bg-gray-50 border border-gray-200 text-gray-600'
                  }`}
              >
                📅 Schedule Later
              </button>
            </div>

            {departureMode === 'now' && (
              <div className="text-xs text-gray-400 text-center mt-2 bg-gray-50 border border-gray-100 rounded-full px-3 py-1 mx-auto w-fit">
                Departing immediately
              </div>
            )}

            {departureMode === 'schedule' && (
              <div className="flex gap-2 mt-2">
                <select
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-dark-text focus:outline-none focus:ring-2 focus:ring-coral-orange/20"
                >
                  {days.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>

                <select
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-dark-text focus:outline-none focus:ring-2 focus:ring-coral-orange/20"
                >
                  {times.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* ── Interactive Route Map ───────────────────────────────────────── */}
        <RouteMap from={fromLocation} to={toLocation} routeGeometry={routeGeometry} />

        {/* Preferences Section */}
        <div className="mt-6">
          <p className="text-xs text-gray-500 font-medium mb-3">PREFERENCES</p>
          <div className="flex flex-wrap gap-2">
            {preferenceOptions.map((pref) => (
              <button
                key={pref}
                onClick={() => togglePreference(pref)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${preferences.includes(pref)
                    ? 'bg-coral-orange text-white'
                    : 'bg-white border border-gray-300 text-gray-600'
                  }`}
              >
                {pref}
              </button>
            ))}
          </div>
        </div>

        {/* Safe Mode Toggle */}
        <div className="mt-6 bg-gray-50 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield size={20} className="text-ai-indigo" />
              <div>
                <p className="font-semibold text-dark-text">Safe Mode</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Filters safe routes &amp; shares live location
                </p>
              </div>
            </div>
            <button
              onClick={() => setSafeMode(!safeMode)}
              className={`relative w-12 h-7 rounded-full transition-colors ${safeMode ? 'bg-success-green' : 'bg-gray-300'
                }`}
            >
              <div
                className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${safeMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
              />
            </button>
          </div>
        </div>

        {/* Search Button */}
        <button
          onClick={onSearch}
          className="btn-tap mt-6 w-full bg-coral-orange text-white font-bold py-3.5 rounded-xl shadow-lg shadow-coral-orange/25 flex items-center justify-center gap-2"
        >
          <Search size={18} />
          Search Routes
        </button>

        {/* Recent Searches Section */}
        {recentSearches.length > 0 && (
          <div className="mt-6 space-y-3">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
              Recent Searches
            </p>
            <div className="space-y-2.5">
              {recentSearches.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setFromLocation(item.from);
                    setToLocation(item.to);
                  }}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-gray-400" />
                    <span className="text-sm font-medium text-dark-text">
                      {item.from} → {item.to}
                    </span>
                  </div>
                  <ArrowRight size={14} className="text-coral-orange" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
