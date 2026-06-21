import { useState, useMemo } from 'react';
import { Leaf, TreePine, Gift, BarChart3, X } from 'lucide-react';
import { weeklyCo2Data } from '../data/mockData';

interface CarbonScreenProps {
  greenPoints: number;
  setGreenPoints: React.Dispatch<React.SetStateAction<number>>;
  walletBalance: number;
  setWalletBalance: React.Dispatch<React.SetStateAction<number>>;
  userName: string;
  userEmail: string;
  totalCo2Saved: number;
}

export function CarbonScreen({
  greenPoints,
  setGreenPoints,
  walletBalance,
  setWalletBalance,
  userName,
  userEmail,
  totalCo2Saved,
}: CarbonScreenProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [streakDays] = useState(5);

  const lastRouteCo2 = 1.2;
  const treesPlanted = Math.floor((totalCo2Saved / 22) * 10) / 10;

  // Progress toward next reward (every 200 points = reward)
  const progress = ((greenPoints % 200) / 200) * 100;

  // Chart calculations
  const sum = useMemo(() => weeklyCo2Data.reduce((acc, d) => acc + d.value, 0), []);
  const avg = useMemo(() => sum / weeklyCo2Data.length, [sum]);
  const weekPoints = useMemo(() => Math.round(sum * 10), [sum]);

  const todayIndex = useMemo(() => {
    const todayDay = new Date().getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    return todayDay === 0 ? 6 : todayDay - 1; // Map Sunday to 6, Monday to 0, etc.
  }, []);

  const modes = [
    { name: 'Metro', percentage: 45, trips: 9, colorClass: 'bg-blue-500' },
    { name: 'Bus', percentage: 40, trips: 8, colorClass: 'bg-coral-orange' },
    { name: 'Auto', percentage: 15, trips: 3, colorClass: 'bg-purple-500' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-24 relative overflow-x-hidden">

      {/* Header */}
      <div className="bg-deep-indigo px-4 pt-12 pb-6 relative">
        <h1 className="text-white font-bold text-xl">Carbon Dashboard</h1>
        <p className="text-gray-300 text-sm mt-1">Your environmental impact</p>

        {/* Avatar Button */}
        <button
          onClick={() => setProfileOpen(true)}
          className="absolute top-12 right-4 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white font-bold flex items-center justify-center text-sm focus:outline-none"
        >
          {userName.charAt(0)}
        </button>
      </div>

      <div className="px-4 -mt-2 space-y-4">

        {/* Eco Streak Card */}
        <div className="bg-white rounded-xl border border-gray-100 border-l-4 border-l-success-green p-4 shadow-sm space-y-2">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Current Eco Streak
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-extrabold text-success-green">{streakDays}</span>
            <span className="text-sm font-semibold text-gray-400">days</span>
            {/* simple colored dot streak indicator */}
            <span className="w-2.5 h-2.5 rounded-full bg-success-green animate-pulse ml-2" />
          </div>
          <p className="text-xs text-gray-500">
            Keep using eco routes to maintain your streak
          </p>
          {/* Progress dots: 7 circles in a row */}
          <div className="flex gap-2 pt-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full ${i < streakDays ? 'bg-success-green' : 'bg-gray-200'
                  }`}
              />
            ))}
          </div>
        </div>

        {/* Main Carbon Card */}
        <div className="bg-gradient-to-br from-success-green to-green-700 rounded-xl p-6 text-white shadow-lg space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <Leaf size={32} className="text-green-200" />
              <div>
                <p className="text-green-200 text-xs font-semibold uppercase tracking-wider">This Month</p>
                <p className="text-4xl font-extrabold mt-1">{totalCo2Saved.toFixed(1)} kg</p>
                <p className="text-green-200 text-sm mt-0.5">CO₂ Saved</p>
              </div>
            </div>
            {/* last trip badge */}
            <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
              +{lastRouteCo2}kg from last trip
            </span>
          </div>

          <div className="border-t border-green-500/40 pt-4">
            <div className="flex items-center gap-3">
              <TreePine size={24} className="text-green-200" />
              <div>
                <p className="text-green-200 text-xs uppercase tracking-wide">Equivalent to</p>
                <p className="font-bold text-lg">{treesPlanted.toFixed(1)} Trees Planted</p>
              </div>
            </div>
          </div>
        </div>

        {/* Green Wallet Card */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift size={18} className="text-success-green" />
              <h3 className="font-semibold text-dark-text">Green Wallet</h3>
            </div>
            <span className="font-bold text-coral-orange">{greenPoints} pts</span>
          </div>

          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress toward reward</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-1">
              <div
                className="h-full bg-coral-orange rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-400">
              Next reward in {200 - (greenPoints % 200)} points
            </p>
          </div>

          {/* Reward Tiers Horizontal Scroll */}
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {[
              { label: '₹10 Off', points: 100, value: 10 },
              { label: '₹25 Off', points: 200, value: 25 },
              { label: 'Free Ride', points: 500, value: 50 },
            ].map((tier, idx) => {
              const canRedeem = greenPoints >= tier.points;
              return (
                <div
                  key={idx}
                  className="flex-shrink-0 w-32 bg-white rounded-xl border border-gray-100 p-3 flex flex-col items-center justify-between space-y-2.5 shadow-sm"
                >
                  <div className="text-center">
                    <p className="font-bold text-sm text-dark-text">{tier.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{tier.points} pts required</p>
                  </div>
                  <button
                    onClick={() => {
                      if (canRedeem) {
                        setGreenPoints(prev => prev - tier.points);
                        setWalletBalance(prev => prev + tier.value);
                        alert('Reward redeemed! Added to your wallet.');
                      }
                    }}
                    disabled={!canRedeem}
                    className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all ${canRedeem
                        ? 'bg-coral-orange text-white hover:bg-coral-orange-dark shadow-sm'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                  >
                    Redeem
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weekly CO₂ Chart */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-success-green" />
            <h3 className="font-semibold text-dark-text">This Week's CO₂ Savings</h3>
          </div>

          <div className="flex items-end justify-between h-36 relative pt-4 px-1">
            {/* Average Line */}
            <div
              className="absolute left-0 right-0 border-t border-dashed border-gray-300 z-10 pointer-events-none"
              style={{ bottom: `${avg * 100}px` }}
            />
            <span
              className="absolute left-1 text-[9px] text-gray-400 font-bold bg-white/90 px-1 rounded border border-gray-100 z-20 pointer-events-none"
              style={{ bottom: `${avg * 100 - 8}px` }}
            >
              Avg: {avg.toFixed(2)} kg
            </span>

            {weeklyCo2Data.map((data, index) => {
              const isToday = index === todayIndex;
              return (
                <div key={index} className="flex flex-col items-center gap-1.5 flex-1 relative z-20">
                  {/* Value Label */}
                  <span className="text-[10px] font-bold text-gray-500">
                    {data.value}
                  </span>
                  <div
                    className={`w-6 rounded-t transition-colors ${isToday ? 'bg-coral-orange' : 'bg-success-green'
                      }`}
                    style={{ height: `${data.value * 100}px` }}
                  />
                  <span className={`text-xs font-semibold ${isToday ? 'text-coral-orange font-bold' : 'text-gray-400'}`}>
                    {data.day}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-gray-500 text-center font-medium border-t border-gray-100 pt-3">
            This week: {sum.toFixed(1)}kg saved · {weekPoints} points earned
          </p>
        </div>

        {/* Mode Breakdown */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-3">
          <h3 className="font-semibold text-dark-text text-sm">Mode Breakdown</h3>
          <div className="space-y-3.5">
            {modes.map((mode, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-dark-text">{mode.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 font-normal">{mode.trips} trips</span>
                    <span className="text-dark-text">{mode.percentage}%</span>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${mode.colorClass}`}
                    style={{ width: `${mode.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dark Overlay */}
      {profileOpen && (
        <div
          onClick={() => setProfileOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 transition-opacity duration-300"
        />
      )}

      {/* Profile Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${profileOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        {/* Top Section */}
        <div className="bg-deep-indigo px-4 py-6 text-white relative">
          <button
            onClick={() => setProfileOpen(false)}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
          <div className="flex flex-col items-center pt-2">
            <div className="w-12 h-12 rounded-full bg-white/20 text-white font-bold flex items-center justify-center text-lg mb-2">
              {userName.charAt(0)}
            </div>
            <h2 className="font-bold text-lg">{userName}</h2>
            <p className="text-gray-300 text-xs">{userEmail}</p>
            <span className="mt-2 bg-cyan-400/20 text-cyan-300 text-[10px] font-bold uppercase tracking-wider rounded-full px-2.5 py-0.5">
              YatraOne Member
            </span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="bg-white px-4 py-4 flex justify-between border-b border-gray-100 shadow-sm">
          <div className="flex-1 text-center">
            <p className="font-bold text-xl text-dark-text">12</p>
            <p className="text-[10px] text-gray-500 mt-0.5">Trips</p>
          </div>
          <div className="w-[1px] bg-gray-100 my-1" />
          <div className="flex-1 text-center">
            <p className="font-bold text-xl text-dark-text">{totalCo2Saved.toFixed(1)}kg</p>
            <p className="text-[10px] text-gray-500 mt-0.5">CO2 Saved</p>
          </div>
          <div className="w-[1px] bg-gray-100 my-1" />
          <div className="flex-1 text-center">
            <p className="font-bold text-xl text-dark-text">{greenPoints}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">Points</p>
          </div>
        </div>

        {/* Wallet Section */}
        <div className="px-4 py-4 space-y-3">
          <h3 className="font-semibold text-dark-text text-sm">YatraOne Wallet</h3>
          <p className="text-2xl font-extrabold text-success-green">₹{walletBalance}</p>

          <div className="flex gap-2">
            <button
              onClick={() => setShowAddMoney(!showAddMoney)}
              className="flex-1 border border-coral-orange text-coral-orange hover:bg-coral-orange/5 py-2 rounded-lg text-xs font-semibold transition-colors"
            >
              Add Money
            </button>
            <button
              onClick={() => alert('Pay with Wallet triggered')}
              className="flex-1 bg-coral-orange text-white hover:bg-coral-orange-dark py-2 rounded-lg text-xs font-semibold transition-colors"
            >
              Pay with Wallet
            </button>
          </div>

          {showAddMoney && (
            <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-150 mt-2">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Select Amount</p>
              <div className="flex gap-2">
                {[100, 200, 500].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => {
                      setWalletBalance((prev) => prev + amt);
                      setShowAddMoney(false);
                      alert(`₹${amt} added successfully to YatraOne Wallet!`);
                    }}
                    className="flex-1 py-1 rounded bg-white border border-gray-200 hover:border-coral-orange text-dark-text hover:text-coral-orange font-bold text-xs transition-all shadow-sm"
                  >
                    ＋ ₹{amt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Transaction History */}
          <div className="pt-3 border-t border-gray-100 space-y-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Recent Transactions</p>
            {[
              { label: 'Journey Booking', amount: -62, date: 'Today' },
              { label: 'Added Money', amount: 200, date: 'Yesterday' },
              { label: 'Journey Booking', amount: -48, date: '2 days ago' },
            ].map((tx, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs">
                <div>
                  <p className="font-semibold text-dark-text">{tx.label}</p>
                  <p className="text-[10px] text-gray-400">{tx.date}</p>
                </div>
                <span className={`font-bold ${tx.amount > 0 ? 'text-success-green' : 'text-red-500'}`}>
                  {tx.amount > 0 ? `+₹${tx.amount}` : `-₹${Math.abs(tx.amount)}`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Sign Out */}
        <div className="absolute bottom-4 left-0 right-0 text-center">
          <button
            onClick={() => alert('Signed out')}
            className="text-gray-400 hover:text-gray-600 text-xs font-bold uppercase tracking-wider py-2"
          >
            Sign Out
          </button>
        </div>
      </div>

    </div>
  );
}
