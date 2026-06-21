import { useState, useEffect } from 'react';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Route } from '../data/mockData';
import { QRCodeSVG } from 'qrcode.react';

function addMinutes(timeStr: string, minutes: number): string {
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

interface BookScreenProps {
  route: Route | null;
  fromLocation: string;
  toLocation: string;
  scheduleDate?: string;
  scheduleTime?: string;
  departureTime: string;
  greenPoints: number;
  setGreenPoints: React.Dispatch<React.SetStateAction<number>>;
  walletBalance: number;
  setWalletBalance: React.Dispatch<React.SetStateAction<number>>;
}

export function BookScreen({
  route,
  fromLocation,
  toLocation,
  scheduleDate,
  scheduleTime: _scheduleTime,
  departureTime,
  greenPoints: _greenPoints,
  setGreenPoints,
  walletBalance,
  setWalletBalance,
}: BookScreenProps) {
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'wallet'>('upi');
  const [priceExpanded, setPriceExpanded] = useState(false);
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);
  const [bookedItems, setBookedItems] = useState<string[]>([]);

  // Countdown timers
  const [lockTime] = useState(Date.now() + 9 * 60 * 1000 + 45 * 1000);
  const [timeDisplay, setTimeDisplay] = useState('');

  const [pickupSeconds, setPickupSeconds] = useState(240); // 4 minutes countdown
  const [qrSeconds, setQrSeconds] = useState(600); // 10 minutes countdown for QR
  const [pointsAdded, setPointsAdded] = useState(false);

  // Payment method options states
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [savedCards, setSavedCards] = useState([
    { id: 'default', label: 'Visa ending in 4532', last4: '4532', type: 'Visa' }
  ]);
  const [selectedCardId, setSelectedCardId] = useState('default');
  const [showAddCardForm, setShowAddCardForm] = useState(false);

  // Offers & Coupons state
  const [appliedCoupon, setAppliedCoupon] = useState<'YATRA10' | 'FIRSTRIDE' | 'ECOGO' | null>(null);

  // Random booking reference generated on mount
  const [bookingRef] = useState(() => 'YT-' + Math.floor(100000 + Math.random() * 900000));

  // Expiry Countdown logic for Price Lock
  useEffect(() => {
    const formatTime = () => {
      const diff = Math.max(0, lockTime - Date.now());
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    setTimeDisplay(formatTime());
    const interval = setInterval(() => {
      setTimeDisplay(formatTime());
    }, 1000);
    return () => clearInterval(interval);
  }, [lockTime]);

  // Expiry Countdown logic for QR Code and Driver pickup
  useEffect(() => {
    const interval = setInterval(() => {
      setQrSeconds((prev) => (prev > 0 ? prev - 1 : 600));
      setPickupSeconds((prev) => (prev > 0 ? prev - 1 : 240));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate and credit Green Points after successful booking
  useEffect(() => {
    if (booked && route && !pointsAdded) {
      const pointsEarned = Math.round(route.co2Saved * 10);
      setGreenPoints((prev) => prev + pointsEarned);
      setPointsAdded(true);
    }
  }, [booked, route, pointsAdded, setGreenPoints]);

  const formatQrTime = () => {
    const mins = Math.floor(qrSeconds / 60);
    const secs = qrSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPickupTime = () => {
    const mins = Math.floor(pickupSeconds / 60);
    const secs = pickupSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')} min`;
  };

  if (!route) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 pb-36">
        <p className="text-gray-500 font-medium text-sm">No route selected. Please select a route first.</p>
      </div>
    );
  }

  const routePrice = route.price;

  // Coupon Calculations
  let discount = 0;
  if (appliedCoupon === 'YATRA10') {
    discount = Math.min(20, Math.round(routePrice * 0.10));
  } else if (appliedCoupon === 'FIRSTRIDE') {
    discount = 15;
  }
  const finalPrice = Math.max(0, routePrice - discount);

  const upiString = `upi://pay?pa=yatraone@upi&pn=YatraOne&am=${route?.price ?? 0}&cu=INR&tn=YatraOne%20Journey%20Booking`;

  // Taxi math
  const taxiSavings = Math.round(finalPrice * 0.45);
  const taxiPrice = finalPrice * 1.45;
  const savingsPercentage = taxiPrice > 0 ? Math.round(((taxiPrice - finalPrice) / taxiPrice) * 100) : 0;

  // Segment Prices Proportional calculation
  const segmentPrices = route.segments.map((seg) => {
    let pct = 0;
    if (seg.type === 'metro') pct = 0.30;
    else if (seg.type === 'bus') pct = 0.25;
    else if (seg.type === 'auto') pct = 0.20;
    else if (seg.type === 'walk') pct = 0.0;
    return Math.round(finalPrice * pct);
  });

  const sumPrices = segmentPrices.reduce((sum, p) => sum + p, 0);
  const diff = finalPrice - sumPrices;

  const firstNonWalkIdx = route.segments.findIndex((seg) => seg.type !== 'walk');
  if (firstNonWalkIdx !== -1 && segmentPrices[firstNonWalkIdx] !== undefined) {
    segmentPrices[firstNonWalkIdx] += diff;
  }

  // Formatting helpers
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clean = e.target.value.replace(/\D/g, '').substring(0, 16);
    const formatted = clean.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clean = e.target.value.replace(/\D/g, '').substring(0, 4);
    let formatted = clean;
    if (clean.length > 2) {
      formatted = `${clean.substring(0, 2)}/${clean.substring(2)}`;
    }
    setCardExpiry(formatted);
  };

  const handleAddMoney = (amount: number) => {
    setWalletBalance((prev) => prev + amount);
    alert(`₹${amount} added successfully to YatraOne Wallet!`);
  };

  const toggleCoupon = (coupon: 'YATRA10' | 'FIRSTRIDE' | 'ECOGO') => {
    if (appliedCoupon === coupon) {
      setAppliedCoupon(null);
    } else {
      setAppliedCoupon(coupon);
    }
  };

  const handleBook = () => {
    if (booking || booked) return;
    setBooking(true);

    const items = route.segments
      .filter((seg) => seg.type !== 'walk')
      .map((seg) => seg.label);

    if (items.length === 0) {
      setBooking(false);
      setBooked(true);
      return;
    }

    items.forEach((item, index) => {
      setTimeout(() => {
        setBookedItems((prev) => [...prev, item]);
        if (index === items.length - 1) {
          setTimeout(() => {
            setBooking(false);
            setBooked(true);
          }, 500);
        }
      }, (index + 1) * 500);
    });
  };

  // Helper station resolvers


  const hasAuto = route.segments.some((seg) => seg.type === 'auto');
  const distanceVal = `${(route.durationMinutes * 0.35).toFixed(1)} km`;
  const formattedDeparture = scheduleDate
    ? `${scheduleDate} ${departureTime}`
    : `Today, ${departureTime}`;

  const departureStr = departureTime || '9:15 AM';
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

  let cumulativeMinutes = 0;
  const segmentTimes = route.segments.map((seg) => {
    const segDuration = seg.duration
      ? parseInt(seg.duration) || walkDuration
      : walkDuration;
    cumulativeMinutes += segDuration;
    return addMinutes(departureStr, cumulativeMinutes);
  });

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-28">
      {/* Header */}
      <div className="bg-deep-indigo px-4 pt-12 pb-6">
        <h1 className="text-white font-bold text-xl">Book & Pay</h1>
        {fromLocation && toLocation && (
          <p className="text-indigo-200 text-xs mt-1">
            {fromLocation} → {toLocation}
          </p>
        )}
      </div>

      {/* Pulsing Price Lock Timer Banner */}
      <div className="px-4 -mt-2">
        <div className="bg-green-50 border-l-[3px] border-l-[#16A34A] rounded-r-xl p-3 flex items-center justify-between price-lock-bar shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-base">🔒</span>
            <span className="text-xs text-green-800 font-bold uppercase tracking-wider">
              Price locked for <span className="font-extrabold text-sm text-green-950 ml-0.5">{timeDisplay}</span>
            </span>
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-[#16A34A] animate-pulse" />
        </div>
      </div>

      {/* RENDER FULL BOARDING PASS TICKET IF BOOKED */}
      {booked ? (
        <div className="px-4 mt-4 space-y-4 animate-fade-in">
          {/* Boarding Pass Ticket */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden relative">
            {/* Top Section: Deep Indigo */}
            <div className="bg-deep-indigo text-white p-4 relative">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-bold text-lg leading-none">YatraOne ✦</h2>
                  <span className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider block mt-1">
                    Digital Boarding Pass
                  </span>
                </div>
                <span className="bg-green-500 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
                  Confirmed ✓
                </span>
              </div>

              <div className="flex items-center justify-between mt-5">
                <div>
                  <span className="text-[9px] text-indigo-200 font-bold uppercase tracking-wider">Booking Reference</span>
                  <p className="font-mono text-sm font-bold tracking-wider">{bookingRef}</p>
                </div>

                {/* Small visual QR code with white background */}
                <div className="bg-white p-1 rounded shadow-sm flex items-center justify-center">
                  <svg width="42" height="42" viewBox="0 0 100 100" className="text-dark-text" fill="currentColor">
                    <rect x="0" y="0" width="30" height="30" />
                    <rect x="4" y="4" width="22" height="22" fill="white" />
                    <rect x="9" y="9" width="12" height="12" />

                    <rect x="70" y="0" width="30" height="30" />
                    <rect x="74" y="4" width="22" height="22" fill="white" />
                    <rect x="79" y="9" width="12" height="12" />

                    <rect x="0" y="70" width="30" height="30" />
                    <rect x="4" y="74" width="22" height="22" fill="white" />
                    <rect x="9" y="79" width="12" height="12" />

                    <rect x="40" y="40" width="20" height="20" />
                    <rect x="45" y="10" width="10" height="10" />
                    <rect x="55" y="25" width="10" height="10" />
                    <rect x="80" y="80" width="15" height="15" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Dashed tear line divider with left/right circle cutouts */}
            <div className="relative border-dashed border-t-2 border-gray-200 my-0 bg-white py-1">
              {/* Left circle cutout */}
              <div className="absolute -left-2.5 -top-2.5 w-5 h-5 bg-gray-50 rounded-full border-r border-gray-200" />
              {/* Right circle cutout */}
              <div className="absolute -right-2.5 -top-2.5 w-5 h-5 bg-gray-50 rounded-full border-l border-gray-200" />
            </div>

            {/* Bottom Section: White */}
            <div className="p-4 bg-white space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">From Location</span>
                  <span className="text-sm font-bold text-dark-text">{fromLocation}</span>
                </div>
                <span className="text-xl px-2 text-gray-400">➔</span>
                <div className="flex-1 text-right">
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">To Destination</span>
                  <span className="text-sm font-bold text-dark-text">{toLocation}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-3.5 gap-x-2 pt-3.5 border-t border-gray-100 text-xs">
                <div>
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Date & Time</span>
                  <span className="font-semibold text-dark-text">{formattedDeparture}</span>
                </div>
                <div>
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Passenger</span>
                  <span className="font-semibold text-dark-text">1 Adult</span>
                </div>
                <div>
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Payment Method</span>
                  <span className="font-semibold text-dark-text capitalize">{paymentMethod}</span>
                </div>
                <div>
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Amount Paid</span>
                  <span className="font-extrabold text-sm text-green-600">₹{finalPrice}</span>
                  <div className="text-[10px] text-success-green font-semibold mt-1">
                    +{Math.round(route.co2Saved * 10)} Green Points earned!
                  </div>
                </div>
              </div>

              {/* Segments summary row */}
              <div className="pt-3.5 border-t border-gray-100 flex items-center gap-1.5 text-xs font-semibold text-gray-650">
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mr-1">Journey:</span>
                <div className="flex flex-wrap items-center gap-1">
                  {route.segments.map((seg, idx, arr) => {
                    return (
                      <span key={idx} className="flex items-center gap-1 bg-gray-155 px-1.5 py-0.5 rounded text-[11px]">
                        <span>
                          {seg.type === 'metro'
                            ? (seg.line && seg.line !== 'Express' ? seg.line : (seg.line ?? 'Metro'))
                            : seg.label}
                        </span>
                        {idx < arr.length - 1 && <span className="text-gray-400 font-normal">→</span>}
                      </span>
                    );
                  })}
                </div>
              </div>

              <p className="text-[10px] text-gray-400 text-center font-medium border-t border-gray-100 pt-3">
                Valid for today's journey only · Scan at metro/bus gates
              </p>
            </div>
          </div>

          {/* Outlined Ticket Actions */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => alert('📥 Downloaded PDF ticket successfully!')}
              className="flex-1 py-3 rounded-xl border border-gray-300 hover:border-gray-400 text-gray-750 font-bold text-xs uppercase flex items-center justify-center gap-1.5 transition-all bg-white shadow-sm"
            >
              📥 Download Ticket
            </button>
            <button
              type="button"
              onClick={() => alert('📤 Shared ticket successfully!')}
              className="flex-1 py-3 rounded-xl border border-gray-300 hover:border-gray-400 text-gray-750 font-bold text-xs uppercase flex items-center justify-center gap-1.5 transition-all bg-white shadow-sm"
            >
              📤 Share Ticket
            </button>
          </div>
        </div>
      ) : (
        <div className="px-4 mt-4 space-y-4">
          {/* SECTION 1: Journey Summary Header Card */}
          <div className="bg-white rounded-xl border border-gray-250 p-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Your Trip</span>
                <div className="flex items-center gap-1.5 font-bold text-dark-text mt-0.5 text-sm">
                  <span>{fromLocation}</span>
                  <span className="text-gray-400 font-normal">➔</span>
                  <span>{toLocation}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Departure</span>
                <p className="text-xs text-dark-text font-bold mt-0.5">
                  📅 {formattedDeparture}
                </p>
              </div>
            </div>

            {/* Segments Row */}
            <div className="flex items-center gap-2 mt-3.5 text-xs text-gray-650 font-medium">
              <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wide mr-1 whitespace-nowrap">Segments:</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {route.segments.map((seg, idx, arr) => {
                  return (
                    <span key={idx} className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded">
                      <span>
                        {seg.type === 'metro'
                          ? (seg.line && seg.line !== 'Express' ? seg.line : (seg.line ?? 'Metro'))
                          : seg.label}
                      </span>
                      {idx < arr.length - 1 && <span className="text-gray-400 font-normal">→</span>}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Badges Row */}
            <div className="flex gap-2 mt-3 pt-3.5 border-t border-gray-100">
              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-indigo-50 text-indigo-750">
                ⏱️ {route.duration}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-teal-55 text-teal-800">
                📍 {distanceVal}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-green-50 text-green-700">
                🌿 {route.co2Saved}kg CO₂ saved
              </span>
            </div>
          </div>

          {/* SECTION 2: Upgraded Segment Breakdown */}
          <div className="bg-white rounded-xl border border-gray-250 p-4 shadow-sm relative overflow-hidden">
            <h2 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-wider">Journey Details Breakdown</h2>

            <div className="relative pl-6 space-y-4">
              {/* Dashed connecting vertical line */}
              {route.segments.length > 1 && (
                <div className="absolute left-[9px] top-2 bottom-2 border-l-2 border-dashed border-gray-200" />
              )}

              {/* Pickup Node */}
              <div className="relative flex flex-col gap-0.5">
                <div className="absolute -left-[22px] top-1.5 w-3 h-3 rounded-full bg-green-500 border border-white" />
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">Pickup Point</span>
                <span className="text-xs font-semibold text-dark-text">{fromLocation}</span>
                <p className="text-xs text-gray-400 mt-0.5">{departureStr}</p>
              </div>

              {/* Segment Cards */}
              {route.segments.map((segment, index) => {
                const isBus = segment.type === 'bus';
                const isMetro = segment.type === 'metro';

                return (
                  <div key={index} className="relative space-y-1.5 bg-gray-50 rounded-lg p-3 border border-gray-150">
                    <div className="absolute -left-[25px] top-4 w-4 h-4 rounded-full bg-white border-2 border-ai-indigo flex items-center justify-center text-[10px]" />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-dark-text">
                          {segment.type === 'metro' ? 'Metro' : segment.label}
                        </span>
                        {segment.type === 'metro' ? (
                          <span className="text-[10px] text-gray-550 font-medium bg-gray-200 px-1.5 py-0.5 rounded">
                            {segment.line && segment.line !== 'Express' ? segment.line : (segment.line ?? 'Metro')}
                          </span>
                        ) : (
                          segment.line && <span className="text-[10px] text-gray-550 font-medium bg-gray-200 px-1.5 py-0.5 rounded">{segment.line}</span>
                        )}
                        {isBus && (
                          <span className="inline-flex items-center gap-0.5 bg-green-100 text-green-705 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            Live
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400 font-medium">
                          {segment.duration || `${walkDuration} min`}
                        </p>
                        <p className="text-sm font-bold text-dark-text">
                          {segmentTimes[index]}
                        </p>
                      </div>
                    </div>

                    {isMetro && segment.boardAt && (
                      <div className="border-t border-gray-200 pt-1.5 mt-1.5 text-[11px] text-gray-600 space-y-1 font-medium">
                        <p className="text-xs text-gray-500 mt-1">
                          Board at <span className="font-semibold text-dark-text">{segment.boardAt}</span>
                        </p>
                        <p className="text-xs text-gray-500">
                          Alight at <span className="font-semibold text-dark-text">{segment.alightAt}</span>
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Dropoff Node */}
              <div className="relative flex flex-col gap-0.5">
                <div className="absolute -left-[22px] top-1.5 w-3 h-3 rounded-full bg-red-500 border border-white" />
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">Dropoff Destination</span>
                <span className="text-xs font-semibold text-dark-text">{toLocation}</span>
                <p className="text-xs text-gray-400 mt-0.5">
                  {addMinutes(departureStr, route.durationMinutes)}
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 3: Driver Card */}
          {hasAuto && (
            <div className="bg-white rounded-xl border border-gray-250 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
                <div>
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Your Auto Driver</span>
                  <h3 className="font-extrabold text-dark-text text-sm mt-0.5">Rahul Kumar</h3>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs font-bold text-yellow-500">★ 4.8</span>
                    <span className="text-yellow-400 text-xs tracking-tighter">★★★★★</span>
                    <span className="text-[10px] text-gray-400 font-medium">(1,248 trips)</span>
                  </div>
                </div>
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center font-bold text-indigo-700 text-sm shadow-sm">
                    RK
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs mb-3 font-semibold">
                <span className="text-gray-500">Vehicle Details</span>
                <span className="text-dark-text">Bajaj RE Auto • DL 5S AB 1234</span>
              </div>

              <div className="bg-indigo-50/40 rounded-lg p-2.5 flex items-center justify-between mb-3.5 border border-indigo-100/30">
                <span className="text-xs text-indigo-850 font-bold flex items-center gap-1">
                  🛺 Auto pickup arriving in:
                </span>
                <span className="text-xs font-extrabold text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded animate-pulse">
                  {formatPickupTime()}
                </span>
              </div>

              {/* Action Buttons Row */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => alert('📞 Calling driver Rahul Kumar...')}
                  className="flex-1 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                >
                  📞 Call
                </button>
                <button
                  type="button"
                  onClick={() => alert('💬 Message screen opened.')}
                  className="flex-1 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                >
                  💬 Message
                </button>
                <button
                  type="button"
                  onClick={() => alert('🔗 Trip sharing link copied to clipboard!')}
                  className="flex-1 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                >
                  🔗 Share
                </button>
              </div>
            </div>
          )}

          {/* Sticky Total Bar */}
          <div className="sticky top-[72px] z-40 bg-[#0F172A] text-white rounded-xl p-4 flex items-center justify-between shadow-lg border border-slate-800">
            <span className="font-semibold text-gray-300 text-sm">Total Price</span>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl text-white">₹{route.price}</span>
            </div>
          </div>

          {/* Premium Savings Card */}
          <div className="savings-card rounded-xl p-4 text-white flex items-center justify-between">
            <div>
              <p className="text-green-100 text-xs font-semibold uppercase tracking-wider">✨ You're saving</p>
              <p className="text-2xl font-bold mt-1">₹{taxiSavings} vs Taxi</p>
            </div>
            <div className="bg-white text-success-green font-bold px-3.5 py-1 rounded-full text-xs shadow-sm">
              -{savingsPercentage}%
            </div>
          </div>

          {/* Why This Price */}
          <div className="bg-white rounded-xl border border-gray-250 p-4 shadow-sm">
            <button
              type="button"
              onClick={() => setPriceExpanded(!priceExpanded)}
              className="flex items-center justify-between w-full text-left"
            >
              <span className="font-bold text-dark-text text-sm">Why this price?</span>
              {priceExpanded ? (
                <ChevronUp size={18} className="text-gray-400" />
              ) : (
                <ChevronDown size={18} className="text-gray-400" />
              )}
            </button>
            {priceExpanded && (
              <p className="mt-3 text-sm text-gray-650 bg-gray-50 rounded-lg p-3 border border-gray-200 leading-relaxed">
                Fixed fare calculated from real-time demand data. No surge pricing ever. Price locked
                for 10 minutes.
              </p>
            )}
          </div>

          {/* SECTION 4: Payment Method */}
          <div>
            <p className="text-sm font-bold text-dark-text mb-3">Payment Method</p>
            <div className="flex gap-2 mb-4">
              {['upi', 'card', 'wallet'].map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method as any)}
                  className={`btn-tap flex-1 py-2.5 rounded-lg font-bold text-xs uppercase border transition-all ${paymentMethod === method
                      ? 'bg-ai-indigo text-white border-ai-indigo shadow-md shadow-ai-indigo/20'
                      : 'bg-white text-gray-600 border-gray-205'
                    }`}
                >
                  {method}
                </button>
              ))}
            </div>

            {/* UPI Tab Upgraded */}
            {paymentMethod === 'upi' && (
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-gray-250 p-4 shadow-sm flex items-center justify-between bg-indigo-50/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center border border-gray-150 font-bold text-lg">
                      <span className="text-blue-500">G</span>
                      <span className="text-red-500">p</span>
                      <span className="text-yellow-500">a</span>
                      <span className="text-green-500">y</span>
                    </div>
                    <div>
                      <p className="font-bold text-dark-text text-sm">Google Pay UPI</p>
                      <p className="text-xs text-gray-500 font-semibold">9876543210@paytm</p>
                    </div>
                  </div>
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-bold">Selected</span>
                </div>

                {/* QR Code Card */}
                <div className="bg-white border border-gray-250 rounded-xl p-4 shadow-sm text-center">
                  <div className="bg-white p-2 inline-block border border-gray-200 rounded-lg mx-auto shadow-sm">
                    <QRCodeSVG
                      value={upiString}
                      size={160}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <p className="font-bold text-sm text-dark-text mt-2">Scan with any UPI app</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">UPI ID: <span className="font-mono text-dark-text">yatraone@upi</span></p>
                  <p className="text-xs font-bold text-coral-orange mt-2 bg-coral-orange/5 rounded py-1 px-3 w-fit mx-auto border border-coral-orange/15">
                    Expires in: {formatQrTime()}
                  </p>
                </div>
              </div>
            )}

            {/* Card Tab Upgraded */}
            {paymentMethod === 'card' && (
              <div className="space-y-4">
                {savedCards.map((card) => (
                  <div
                    key={card.id}
                    onClick={() => setSelectedCardId(card.id)}
                    className={`bg-white rounded-xl border p-4 shadow-sm flex items-center justify-between cursor-pointer transition-all ${selectedCardId === card.id ? 'border-ai-indigo bg-indigo-50/10' : 'border-gray-250'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-150">
                        💳
                      </div>
                      <div>
                        <p className="font-bold text-dark-text text-sm">{card.label}</p>
                        <p className="text-xs text-gray-500 font-semibold">{card.type} Credit Card</p>
                      </div>
                    </div>
                    {selectedCardId === card.id && (
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-bold">Selected</span>
                    )}
                  </div>
                ))}

                {/* Add New Card Form Accordion */}
                {!showAddCardForm ? (
                  <button
                    type="button"
                    onClick={() => setShowAddCardForm(true)}
                    className="w-full py-3 rounded-xl border-2 border-dashed border-gray-300 hover:border-coral-orange text-gray-500 hover:text-coral-orange transition-all font-bold text-xs uppercase flex items-center justify-center gap-1.5"
                  >
                    ＋ Add New Card
                  </button>
                ) : (
                  <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-3">
                    <p className="text-xs font-bold text-dark-text uppercase tracking-wide">Enter Card Details</p>
                    <div className="space-y-2.5">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 block mb-1">Card Number</label>
                        <input
                          type="text"
                          placeholder="4532 1234 5678 9012"
                          value={cardNumber}
                          onChange={handleCardNumberChange}
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-coral-orange font-semibold text-dark-text"
                        />
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="text-[10px] font-bold text-gray-400 block mb-1">Expiry</label>
                          <input
                            type="text"
                            placeholder="MM/YY"
                            value={cardExpiry}
                            onChange={handleExpiryChange}
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-coral-orange font-semibold text-dark-text"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-[10px] font-bold text-gray-400 block mb-1">CVV</label>
                          <input
                            type="password"
                            placeholder="•••"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').substring(0, 3))}
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-coral-orange font-semibold text-dark-text"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddCardForm(false)}
                        className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-650 font-bold text-xs uppercase"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const cleanNum = cardNumber.replace(/\s/g, '');
                          if (cleanNum.length < 16 || cardExpiry.length < 5 || cardCvv.length < 3) {
                            alert('Please fill all card fields correctly.');
                            return;
                          }
                          const newCard = {
                            id: `card-${Date.now()}`,
                            label: `Card ending in ${cleanNum.substring(12)}`,
                            last4: cleanNum.substring(12),
                            type: 'Visa'
                          };
                          setSavedCards((prev) => [...prev, newCard]);
                          setSelectedCardId(newCard.id);
                          setShowAddCardForm(false);
                          setCardNumber('');
                          setCardExpiry('');
                          setCardCvv('');
                        }}
                        className="flex-1 py-2 rounded-lg bg-coral-orange text-white font-bold text-xs uppercase"
                      >
                        Save Card
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Wallet Tab Upgraded */}
            {paymentMethod === 'wallet' && (
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-gray-250 p-4 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-150">
                      👛
                    </div>
                    <div>
                      <p className="font-bold text-dark-text text-sm">YatraOne Wallet</p>
                      <p className="text-xs text-gray-500 font-semibold">Balance: ₹{walletBalance}</p>
                    </div>
                  </div>
                  <span className="text-xs bg-emerald-100 text-emerald-705 px-2.5 py-1 rounded-full font-bold">Active</span>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm">
                  <p className="text-xs font-bold text-gray-550 uppercase tracking-wide mb-2.5">＋ Quick Top Up Wallet</p>
                  <div className="flex gap-2">
                    {[100, 200, 500].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleAddMoney(amt)}
                        className="flex-1 py-2 rounded-lg bg-white border border-gray-200 hover:border-emerald-500 text-dark-text hover:text-emerald-600 font-extrabold text-xs transition-all shadow-sm"
                      >
                        ＋ ₹{amt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 5: Offers & Discounts */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2.5">Offers & Coupons</p>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none whitespace-nowrap">
              {/* Coupon 1 */}
              <button
                type="button"
                onClick={() => toggleCoupon('YATRA10')}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold tracking-wide transition-all select-none ${appliedCoupon === 'YATRA10'
                    ? 'bg-green-50 border-green-500 text-green-700 shadow-sm'
                    : appliedCoupon !== null
                      ? 'bg-white border-gray-200 text-gray-400 opacity-60'
                      : 'bg-white border-gray-250 text-gray-700 hover:border-gray-300'
                  }`}
              >
                <span>🎟️</span>
                <span className="font-bold">YATRA10</span>
                <span className="text-[10px] text-gray-400 font-normal">| 10% off (max ₹20)</span>
                {appliedCoupon === 'YATRA10' && <span className="text-green-600 ml-1">✓</span>}
              </button>

              {/* Coupon 2 */}
              <button
                type="button"
                onClick={() => toggleCoupon('FIRSTRIDE')}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold tracking-wide transition-all select-none ${appliedCoupon === 'FIRSTRIDE'
                    ? 'bg-green-50 border-green-500 text-green-700 shadow-sm'
                    : appliedCoupon !== null
                      ? 'bg-white border-gray-200 text-gray-400 opacity-60'
                      : 'bg-white border-gray-250 text-gray-700 hover:border-gray-300'
                  }`}
              >
                <span>🎟️</span>
                <span className="font-bold">FIRSTRIDE</span>
                <span className="text-[10px] text-gray-400 font-normal">| ₹15 off</span>
                {appliedCoupon === 'FIRSTRIDE' && <span className="text-green-600 ml-1">✓</span>}
              </button>

              {/* Coupon 3 */}
              <button
                type="button"
                onClick={() => {
                  toggleCoupon('ECOGO');
                  if (appliedCoupon !== 'ECOGO') {
                    alert('ECOGO coupon applied! 5 green points will be credited to your wallet upon trip completion.');
                  }
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold tracking-wide transition-all select-none ${appliedCoupon === 'ECOGO'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm'
                    : appliedCoupon !== null
                      ? 'bg-white border-gray-200 text-gray-400 opacity-60'
                      : 'bg-white border-gray-250 text-gray-700 hover:border-gray-300'
                  }`}
              >
                <span>🌿</span>
                <span className="font-bold">ECOGO</span>
                <span className="text-[10px] text-gray-400 font-normal">| +5 green pts</span>
                {appliedCoupon === 'ECOGO' && <span className="text-emerald-600 ml-1">✓</span>}
              </button>
            </div>
          </div>

          {/* Book Button with Loading / Booking animations */}
          <button
            type="button"
            onClick={handleBook}
            disabled={booking}
            className={`btn-tap w-full bg-coral-orange text-white font-bold py-4 rounded-xl shadow-lg shadow-coral-orange/20 mt-4 flex items-center justify-center transition-all ${booking ? 'opacity-80' : ''
              }`}
          >
            {booking ? (
              <div className="flex items-center justify-center gap-3">
                {route.segments
                  .filter((seg) => seg.type !== 'walk')
                  .map((seg, idx) => {
                    const item = seg.label;
                    return (
                      <span key={idx} className="flex items-center gap-1 text-xs font-bold">
                        {item}
                        {bookedItems.includes(item) && <Check size={14} className="text-green-300" />}
                      </span>
                    );
                  })}
              </div>
            ) : (
              `Book All - Pay ₹${finalPrice}`
            )}
          </button>
        </div>
      )}
    </div>
  );
}
