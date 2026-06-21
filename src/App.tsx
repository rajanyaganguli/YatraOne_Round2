import { useState, useCallback, useEffect, useRef } from 'react';
import { Home, BarChart2, MapPin, Shield, CreditCard, Leaf, Lock } from 'lucide-react';
import { HomeScreen } from './screens/HomeScreen';
import { ResultsScreen } from './screens/ResultsScreen';
import { DetailScreen } from './screens/DetailScreen';
import { SafetyScreen } from './screens/SafetyScreen';
import { BookScreen } from './screens/BookScreen';
import { CarbonScreen } from './screens/CarbonScreen';
import { useOsrmRoutes } from './hooks/useOsrmRoutes';
import { Route } from './data/mockData';

type TabType = 'home' | 'results' | 'detail' | 'safety' | 'book' | 'carbon';

const TAB_ORDER: TabType[] = ['home', 'results', 'detail', 'safety', 'book', 'carbon'];
const TAB_GUARD: Record<TabType, 'always' | 'searched' | 'routed'> = {
  home: 'always',
  results: 'searched',
  detail: 'routed',
  safety: 'always',
  book: 'routed',
  carbon: 'always',
};

const tabs: { id: TabType; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'results', label: 'Results', icon: BarChart2 },
  { id: 'detail', label: 'Detail', icon: MapPin },
  { id: 'safety', label: 'Safety', icon: Shield },
  { id: 'book', label: 'Book', icon: CreditCard },
  { id: 'carbon', label: 'Carbon', icon: Leaf },
];

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div
      style={{ zIndex: 9999 }}
      className={`fixed top-5 left-1/2 -translate-x-1/2 transition-all duration-300 pointer-events-none ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'
        }`}
    >
      <div className="flex items-center gap-2 bg-gray-900/95 backdrop-blur text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-2xl">
        <Lock size={11} className="text-yellow-400 flex-shrink-0" />
        {message}
      </div>
    </div>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [slideDir, setSlideDir] = useState<'right' | 'left'>('right');
  const [preferences, setPreferences] = useState<string[]>(['Fastest']);
  const [safeMode, setSafeMode] = useState(true);
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [toast, setToast] = useState({ msg: '', show: false });
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [departureMode, setDepartureMode] = useState<'now' | 'schedule'>('now');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [departureTime, setDepartureTime] = useState<string>('');
  const [recentSearches, setRecentSearches] = useState([
    { from: 'Hauz Khas', to: 'Noida Sector 18' },
    { from: 'Connaught Place', to: 'Cyber City' },
    { from: 'IIT Delhi', to: 'Cyber City' },
  ]);
  const [greenPoints, setGreenPoints] = useState(124);
  const [walletBalance, setWalletBalance] = useState(150);
  const [userName] = useState('Rajanya');
  const [userEmail] = useState('rajanya@yatraone.in');
  const [totalCo2Saved] = useState(4.2);
  const bounceTabRef = useRef<TabType | null>(null);
  const [bouncingTab, setBouncingTab] = useState<TabType | null>(null);

  const { routes: currentRoutes, geometry, distanceKm, durationMin, isRealData } =
    useOsrmRoutes(fromLocation, toLocation, departureTime);

  const resolvedRoutes = currentRoutes || [];
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast.show) return;
    const t = setTimeout(() => setToast(p => ({ ...p, show: false })), 2500);
    return () => clearTimeout(t);
  }, [toast.show]);

  const showToast = useCallback((msg: string) => setToast({ msg, show: true }), []);

  const isTabLocked = useCallback((tab: TabType): boolean => {
    const g = TAB_GUARD[tab];
    if (g === 'searched') return !hasSearched;
    if (g === 'routed') return !selectedRoute;
    return false;
  }, [hasSearched, selectedRoute]);

  const navigateTo = useCallback((tab: TabType) => {
    if (isTabLocked(tab)) {
      if (TAB_GUARD[tab] === 'searched') showToast('Search a route first to continue');
      else showToast('Select a route to continue');
      return;
    }
    const fromIdx = TAB_ORDER.indexOf(activeTab);
    const toIdx = TAB_ORDER.indexOf(tab);
    setSlideDir(toIdx >= fromIdx ? 'right' : 'left');
    setActiveTab(tab);
    // bounce animation
    setBouncingTab(tab);
    bounceTabRef.current = tab;
    setTimeout(() => {
      if (bounceTabRef.current === tab) setBouncingTab(null);
    }, 220);
  }, [activeTab, isTabLocked, showToast]);

  const togglePreference = useCallback((pref: string) => {
    setPreferences(prev => prev.includes(pref) ? prev.filter(p => p !== pref) : [...prev, pref]);
  }, []);

  const handleSearch = useCallback(() => {
    if (!fromLocation.trim() || !toLocation.trim()) {
      showToast('Enter From and To locations first');
      return;
    }
    setHasSearched(true);
    setSelectedRouteId(null);
    setSelectedRoute(null);

    // Calculate actual departure time
    if (departureMode === 'now') {
      const d = new Date(Date.now() + 10 * 60 * 1000);
      let h = d.getHours();
      const m = d.getMinutes();
      const mer = h >= 12 ? 'PM' : 'AM';
      if (h > 12) h -= 12;
      if (h === 0) h = 12;
      setDepartureTime(`${h}:${m.toString().padStart(2, '0')} ${mer}`);
    } else {
      setDepartureTime(scheduleTime || '9:00 AM');
    }

    const newSearch = { from: fromLocation, to: toLocation };
    setRecentSearches(prev => {
      const filtered = prev.filter(
        s => !(s.from === newSearch.from && s.to === newSearch.to)
      );
      return [newSearch, ...filtered].slice(0, 3);
    });

    setSlideDir('right');
    setActiveTab('results');
  }, [fromLocation, toLocation, departureMode, scheduleTime, showToast, setRecentSearches]);

  const handleShareLocation = useCallback(() => {
    alert('📍 Live location shared with Priya (trusted contact)');
  }, []);

  const handleBook = useCallback(() => navigateTo('book'), [navigateTo]);
  const handleSOS = useCallback(() => alert('🆘 Emergency services notified. Location shared.'), []);

  const handleRouteSelect = useCallback((id: number) => {
    setSelectedRouteId(id);
    const rankedRoutes = resolvedRoutes;
    const found = rankedRoutes.find(r => r.id === id) ?? null;
    setSelectedRoute(found);
    setSlideDir('right');
    setActiveTab('detail');
  }, [resolvedRoutes]);

  const slideClass = slideDir === 'right' ? 'slide-in-right' : 'slide-in-left';

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center font-sans">
      <div className="w-full max-w-[390px] bg-white relative min-h-screen shadow-2xl overflow-hidden">

        <Toast message={toast.msg} visible={toast.show} />

        {/* Screen content with slide transition */}
        <div key={activeTab} className={`pb-24 ${slideClass}`}>
          {activeTab === 'home' && (
            <HomeScreen
              preferences={preferences}
              togglePreference={togglePreference}
              safeMode={safeMode}
              setSafeMode={setSafeMode}
              onSearch={handleSearch}
              fromLocation={fromLocation}
              toLocation={toLocation}
              setFromLocation={setFromLocation}
              setToLocation={setToLocation}
              routeGeometry={geometry}
              departureMode={departureMode}
              setDepartureMode={setDepartureMode}
              scheduleDate={scheduleDate}
              setScheduleDate={setScheduleDate}
              scheduleTime={scheduleTime}
              setScheduleTime={setScheduleTime}
              recentSearches={recentSearches}
              setRecentSearches={setRecentSearches}
            />
          )}
          {activeTab === 'results' && (
            <ResultsScreen
              routes={resolvedRoutes}
              routesFound={resolvedRoutes.length > 0}
              selectedRouteId={selectedRouteId}
              setSelectedRouteId={handleRouteSelect}
              preferences={preferences}
              safeMode={safeMode}
              fromLocation={fromLocation}
              toLocation={toLocation}
              routeGeometry={geometry}
              distanceKm={distanceKm}
              durationMin={durationMin}
              isRealData={isRealData}
              departureTime={departureTime}
            />
          )}
          {activeTab === 'detail' && (
            <DetailScreen
              route={selectedRoute}
              fromLocation={fromLocation}
              toLocation={toLocation}
              onShareLocation={handleShareLocation}
              onBook={handleBook}
              onSOS={handleSOS}
              departureTime={departureTime}
            />
          )}
          {activeTab === 'safety' && (
            <SafetyScreen fromLocation={fromLocation} toLocation={toLocation} />
          )}
          {activeTab === 'book' && (
            <BookScreen
              route={selectedRoute}
              fromLocation={fromLocation}
              toLocation={toLocation}
              scheduleDate={departureMode === 'schedule' ? scheduleDate : undefined}
              scheduleTime={departureMode === 'schedule' ? scheduleTime : undefined}
              departureTime={departureTime}
              greenPoints={greenPoints}
              setGreenPoints={setGreenPoints}
              walletBalance={walletBalance}
              setWalletBalance={setWalletBalance}
            />
          )}
          {activeTab === 'carbon' && (
            <CarbonScreen
              greenPoints={greenPoints}
              setGreenPoints={setGreenPoints}
              walletBalance={walletBalance}
              setWalletBalance={setWalletBalance}
              userName={userName}
              userEmail={userEmail}
              totalCo2Saved={totalCo2Saved}
            />
          )}
        </div>

        {/* ── Floating Pill Navigation ─────────────────────────────────────── */}
        <div className="fixed bottom-4 left-0 right-0 z-[1000] flex justify-center pointer-events-none">
          <div
            className="flex items-center gap-1 px-4 py-2 rounded-[100px] pointer-events-auto"
            style={{
              background: 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              border: '1px solid rgba(255,255,255,0.6)',
              margin: '0 auto',
              width: 'fit-content',
            }}
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const locked = isTabLocked(tab.id);
              const bouncing = bouncingTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => navigateTo(tab.id)}
                  className={`relative flex items-center gap-1.5 rounded-[20px] transition-all duration-200 ${bouncing ? 'tab-active-bounce' : ''} ${isActive
                      ? 'bg-coral-orange text-white'
                      : locked
                        ? 'text-gray-300 px-2.5 py-1.5'
                        : 'text-gray-400 hover:text-gray-600 px-2.5 py-1.5'
                    }`}
                  style={isActive ? { padding: '6px 12px' } : undefined}
                >
                  <Icon
                    size={18}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  {isActive && (
                    <span className="text-[11px] font-bold whitespace-nowrap">{tab.label}</span>
                  )}
                  {locked && !isActive && (
                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-gray-300 rounded-full flex items-center justify-center">
                      <Lock size={6} className="text-white" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
