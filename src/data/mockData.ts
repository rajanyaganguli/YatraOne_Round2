// ─── Segment + Route types ────────────────────────────────────────────────────
export interface RouteSegment {
  type: 'walk' | 'metro' | 'bus' | 'auto' | 'train';
  label: string;
  duration?: string;
  crowd?: 'Low' | 'Moderate' | 'High';
  line?: string;
  stops?: number;
  boardAt?: string;
  alightAt?: string;
}

export interface Route {
  id: number;
  score: number;
  tags: string[];
  duration: string;
  durationMinutes: number;
  price: number;
  timeRange: string;
  segments: RouteSegment[];
  safety: number;
  co2Saved: number;
  transfers: number;
  onTime: boolean;
  lateMinutes?: number;
  priceLocked: boolean;
  lockMinutes?: number;
}

export interface JourneyStep {
  id: number;
  location: string;
  time: string;
  description: string;
  safety?: number;
  segment?: RouteSegment;
}

// ─── Single shared normalise helper — used in route lookup, map lookup, everywhere ─
export const normalize = (s: string): string =>
  s.trim().toLowerCase().replace(/\s+/g, ' ');

// ─── Normalisation helper ─────────────────────────────────────────────────────
export const getRouteKey = (from: string, to: string): string =>
  `${normalize(from)}-${normalize(to)}`;

// ─── Route database keyed by normalised "from-to" ────────────────────────────
const routeDatabase: Record<string, Route[]> = {

  // ── Connaught Place → Cyber City ──────────────────────────────────────────
  'connaught place-cyber city': [
    {
      id: 1, score: 94, tags: ['Fastest'],
      duration: '48 min', durationMinutes: 48, price: 62,
      timeRange: '9:15 AM – 10:03 AM',
      segments: [
        { type: 'walk',  label: 'Walk' },
        { type: 'metro', label: 'Metro', duration: '17 min', line: 'Yellow Line', boardAt: 'Rajiv Chowk', alightAt: 'Sikanderpur' },
        { type: 'bus',   label: 'Bus',   duration: '8 min',  crowd: 'Moderate' },
        { type: 'walk',  label: 'Walk' },
      ],
      safety: 92, co2Saved: 2.8, transfers: 2,
      onTime: true, priceLocked: true, lockMinutes: 9,
    },
    {
      id: 2, score: 91, tags: ['Cheapest'],
      duration: '52 min', durationMinutes: 52, price: 48,
      timeRange: '9:18 AM – 10:10 AM',
      segments: [
        { type: 'walk', label: 'Walk' },
        { type: 'bus',  label: 'Bus', duration: '35 min', crowd: 'Low' },
        { type: 'walk', label: 'Walk' },
      ],
      safety: 78, co2Saved: 4.1, transfers: 1,
      onTime: true, priceLocked: true, lockMinutes: 10,
    },
    {
      id: 3, score: 87, tags: ['Eco'],
      duration: '44 min', durationMinutes: 44, price: 55,
      timeRange: '9:20 AM – 10:04 AM',
      segments: [
        { type: 'walk',  label: 'Walk' },
        { type: 'metro', label: 'Metro', duration: '22 min', line: 'Yellow Line', boardAt: 'Rajiv Chowk', alightAt: 'Sikanderpur' },
        { type: 'walk',  label: 'Walk' },
      ],
      safety: 85, co2Saved: 1.2, transfers: 1,
      onTime: false, lateMinutes: 3, priceLocked: true, lockMinutes: 8,
    },
  ],

  // ── Connaught Place → Noida Sector 18 ─────────────────────────────────────
  'connaught place-noida sector 18': [
    {
      id: 1, score: 91, tags: ['Fastest'],
      duration: '38 min', durationMinutes: 38, price: 45,
      timeRange: '9:15 AM – 9:53 AM',
      segments: [
        { type: 'walk',  label: 'Walk' },
        { type: 'metro', label: 'Metro', duration: '30 min', line: 'Blue Line', boardAt: 'Rajiv Chowk', alightAt: 'Noida Sector 18' },
        { type: 'walk',  label: 'Walk' },
      ],
      safety: 90, co2Saved: 3.2, transfers: 1,
      onTime: true, priceLocked: true, lockMinutes: 9,
    },
    {
      id: 2, score: 85, tags: ['Cheapest'],
      duration: '55 min', durationMinutes: 55, price: 28,
      timeRange: '9:20 AM – 10:15 AM',
      segments: [
        { type: 'walk', label: 'Walk' },
        { type: 'bus',  label: 'Bus', duration: '42 min', crowd: 'High' },
        { type: 'walk', label: 'Walk' },
      ],
      safety: 75, co2Saved: 5.1, transfers: 1,
      onTime: false, lateMinutes: 5, priceLocked: true, lockMinutes: 8,
    },
    {
      id: 3, score: 82, tags: ['Eco'],
      duration: '42 min', durationMinutes: 42, price: 38,
      timeRange: '9:18 AM – 10:00 AM',
      segments: [
        { type: 'walk',  label: 'Walk' },
        { type: 'metro', label: 'Metro', duration: '32 min', line: 'Blue Line', boardAt: 'Rajiv Chowk', alightAt: 'Noida Sector 18' },
        { type: 'auto',  label: 'Auto',  duration: '5 min' },
      ],
      safety: 83, co2Saved: 2.9, transfers: 2,
      onTime: true, priceLocked: true, lockMinutes: 7,
    },
  ],

  // ── IIT Delhi → Cyber City ─────────────────────────────────────────────────
  'iit delhi-cyber city': [
    {
      id: 1, score: 89, tags: ['Fastest'],
      duration: '32 min', durationMinutes: 32, price: 40,
      timeRange: '9:00 AM – 9:32 AM',
      segments: [
        { type: 'walk',  label: 'Walk' },
        { type: 'metro', label: 'Metro', duration: '22 min', line: 'Yellow Line', boardAt: 'Hauz Khas', alightAt: 'Sikanderpur' },
        { type: 'auto',  label: 'Auto',  duration: '6 min' },
      ],
      safety: 88, co2Saved: 2.1, transfers: 2,
      onTime: true, priceLocked: true, lockMinutes: 9,
    },
    {
      id: 2, score: 84, tags: ['Cheapest'],
      duration: '45 min', durationMinutes: 45, price: 24,
      timeRange: '9:05 AM – 9:50 AM',
      segments: [
        { type: 'walk', label: 'Walk' },
        { type: 'bus',  label: 'Bus', duration: '38 min', crowd: 'Moderate' },
        { type: 'walk', label: 'Walk' },
      ],
      safety: 80, co2Saved: 3.8, transfers: 1,
      onTime: true, priceLocked: true, lockMinutes: 10,
    },
    {
      id: 3, score: 80, tags: ['Eco'],
      duration: '36 min', durationMinutes: 36, price: 35,
      timeRange: '9:10 AM – 9:46 AM',
      segments: [
        { type: 'walk',  label: 'Walk' },
        { type: 'metro', label: 'Metro', duration: '28 min', line: 'Yellow Line', boardAt: 'Hauz Khas', alightAt: 'Sikanderpur' },
        { type: 'walk',  label: 'Walk' },
      ],
      safety: 91, co2Saved: 1.8, transfers: 1,
      onTime: false, lateMinutes: 2, priceLocked: true, lockMinutes: 8,
    },
  ],

  // ── Dwarka → Connaught Place ───────────────────────────────────────────────
  'dwarka-connaught place': [
    {
      id: 1, score: 93, tags: ['Fastest'],
      duration: '42 min', durationMinutes: 42, price: 35,
      timeRange: '8:30 AM – 9:12 AM',
      segments: [
        { type: 'walk',  label: 'Walk' },
        { type: 'metro', label: 'Metro', duration: '35 min', line: 'Blue Line', boardAt: 'Dwarka Sector 21', alightAt: 'Rajiv Chowk' },
        { type: 'walk',  label: 'Walk' },
      ],
      safety: 93, co2Saved: 3.5, transfers: 1,
      onTime: true, priceLocked: true, lockMinutes: 9,
    },
    {
      id: 2, score: 87, tags: ['Cheapest'],
      duration: '60 min', durationMinutes: 60, price: 22,
      timeRange: '8:35 AM – 9:35 AM',
      segments: [
        { type: 'walk', label: 'Walk' },
        { type: 'bus',  label: 'Bus', duration: '52 min', crowd: 'High' },
        { type: 'walk', label: 'Walk' },
      ],
      safety: 76, co2Saved: 4.8, transfers: 1,
      onTime: false, lateMinutes: 4, priceLocked: true, lockMinutes: 7,
    },
    {
      id: 3, score: 82, tags: ['Eco'],
      duration: '48 min', durationMinutes: 48, price: 32,
      timeRange: '8:40 AM – 9:28 AM',
      segments: [
        { type: 'walk',  label: 'Walk' },
        { type: 'metro', label: 'Metro', duration: '40 min', line: 'Blue Line', boardAt: 'Dwarka Sector 21', alightAt: 'Rajiv Chowk' },
        { type: 'walk',  label: 'Walk' },
      ],
      safety: 88, co2Saved: 2.4, transfers: 1,
      onTime: true, priceLocked: true, lockMinutes: 8,
    },
  ],

  // ── Noida Sector 18 → Cyber City ──────────────────────────────────────────
  'noida sector 18-cyber city': [
    {
      id: 1, score: 88, tags: ['Fastest'],
      duration: '65 min', durationMinutes: 65, price: 72,
      timeRange: '9:00 AM – 10:05 AM',
      segments: [
        { type: 'walk',  label: 'Walk' },
        { type: 'metro', label: 'Metro', duration: '45 min', line: 'Blue Line', boardAt: 'Noida Sector 18', alightAt: 'Rajiv Chowk' },
        { type: 'metro', label: 'Metro', duration: '12 min', line: 'Yellow Line', boardAt: 'Rajiv Chowk', alightAt: 'Sikanderpur' },
        { type: 'auto',  label: 'Auto',  duration: '5 min' },
      ],
      safety: 89, co2Saved: 4.2, transfers: 3,
      onTime: true, priceLocked: true, lockMinutes: 9,
    },
    {
      id: 2, score: 82, tags: ['Cheapest'],
      duration: '90 min', durationMinutes: 90, price: 38,
      timeRange: '9:05 AM – 10:35 AM',
      segments: [
        { type: 'bus',  label: 'Bus', duration: '75 min', crowd: 'Moderate' },
        { type: 'walk', label: 'Walk' },
      ],
      safety: 74, co2Saved: 6.1, transfers: 1,
      onTime: false, lateMinutes: 8, priceLocked: true, lockMinutes: 6,
    },
    {
      id: 3, score: 79, tags: ['Eco'],
      duration: '75 min', durationMinutes: 75, price: 55,
      timeRange: '9:10 AM – 10:25 AM',
      segments: [
        { type: 'walk',  label: 'Walk' },
        { type: 'metro', label: 'Metro', duration: '60 min', line: 'Blue Line', boardAt: 'Noida Sector 18', alightAt: 'Rajiv Chowk' },
        { type: 'walk',  label: 'Walk' },
      ],
      safety: 86, co2Saved: 3.9, transfers: 2,
      onTime: true, priceLocked: true, lockMinutes: 8,
    },
  ],

  // ── Hauz Khas → Cyber City ────────────────────────────────────────────────
  'hauz khas-cyber city': [
    {
      id: 1, score: 92, tags: ['Fastest'],
      duration: '28 min', durationMinutes: 28, price: 32,
      timeRange: '9:00 AM – 9:28 AM',
      segments: [
        { type: 'metro', label: 'Metro', duration: '22 min', line: 'Yellow Line', boardAt: 'Hauz Khas', alightAt: 'Sikanderpur' },
        { type: 'auto',  label: 'Auto',  duration: '4 min' },
      ],
      safety: 91, co2Saved: 1.8, transfers: 1,
      onTime: true, priceLocked: true, lockMinutes: 9,
    },
    {
      id: 2, score: 86, tags: ['Cheapest'],
      duration: '40 min', durationMinutes: 40, price: 18,
      timeRange: '9:05 AM – 9:45 AM',
      segments: [
        { type: 'bus',  label: 'Bus', duration: '35 min', crowd: 'Low' },
        { type: 'walk', label: 'Walk' },
      ],
      safety: 82, co2Saved: 2.9, transfers: 1,
      onTime: true, priceLocked: true, lockMinutes: 8,
    },
    {
      id: 3, score: 80, tags: ['Eco'],
      duration: '30 min', durationMinutes: 30, price: 28,
      timeRange: '9:08 AM – 9:38 AM',
      segments: [
        { type: 'metro', label: 'Metro', duration: '25 min', line: 'Yellow Line', boardAt: 'Hauz Khas', alightAt: 'Sikanderpur' },
        { type: 'walk',  label: 'Walk' },
      ],
      safety: 88, co2Saved: 1.4, transfers: 1,
      onTime: false, lateMinutes: 2, priceLocked: true, lockMinutes: 7,
    },
  ],
  'iit delhi-dwarka': [
    {
      id: 1, score: 90, tags: ['Fastest'],
      duration: '52 min', durationMinutes: 52, price: 38,
      timeRange: '9:15 AM – 10:07 AM',
      segments: [
        { type: 'walk', label: 'Walk' },
        { type: 'metro', label: 'Metro', duration: '20 min',
          line: 'Yellow Line', boardAt: 'Hauz Khas', alightAt: 'Rajiv Chowk' },
        { type: 'metro', label: 'Metro', duration: '25 min',
          line: 'Blue Line', boardAt: 'Rajiv Chowk', alightAt: 'Dwarka Sector 21' },
        { type: 'walk', label: 'Walk' },
      ],
      safety: 91, co2Saved: 3.2, transfers: 2,
      onTime: true, priceLocked: true, lockMinutes: 9,
    },
    {
      id: 2, score: 84, tags: ['Cheapest'],
      duration: '75 min', durationMinutes: 75, price: 22,
      timeRange: '9:20 AM – 10:35 AM',
      segments: [
        { type: 'walk', label: 'Walk' },
        { type: 'bus', label: 'Bus', duration: '65 min', crowd: 'Moderate' },
        { type: 'walk', label: 'Walk' },
      ],
      safety: 76, co2Saved: 5.8, transfers: 1,
      onTime: false, lateMinutes: 5, priceLocked: true, lockMinutes: 7,
    },
    {
      id: 3, score: 80, tags: ['Eco'],
      duration: '55 min', durationMinutes: 55, price: 32,
      timeRange: '9:18 AM – 10:13 AM',
      segments: [
        { type: 'walk', label: 'Walk' },
        { type: 'metro', label: 'Metro', duration: '45 min',
          line: 'Blue Line', boardAt: 'Hauz Khas', alightAt: 'Dwarka Sector 21' },
        { type: 'walk', label: 'Walk' },
      ],
      safety: 87, co2Saved: 2.9, transfers: 1,
      onTime: true, priceLocked: true, lockMinutes: 8,
    },
  ],

  'dwarka-iit delhi': [
    {
      id: 1, score: 90, tags: ['Fastest'],
      duration: '52 min', durationMinutes: 52, price: 38,
      timeRange: '9:15 AM – 10:07 AM',
      segments: [
        { type: 'walk', label: 'Walk' },
        { type: 'metro', label: 'Metro', duration: '25 min',
          line: 'Blue Line', boardAt: 'Dwarka Sector 21', alightAt: 'Rajiv Chowk' },
        { type: 'metro', label: 'Metro', duration: '20 min',
          line: 'Yellow Line', boardAt: 'Rajiv Chowk', alightAt: 'Hauz Khas' },
        { type: 'walk', label: 'Walk' },
      ],
      safety: 91, co2Saved: 3.2, transfers: 2,
      onTime: true, priceLocked: true, lockMinutes: 9,
    },
    {
      id: 2, score: 84, tags: ['Cheapest'],
      duration: '75 min', durationMinutes: 75, price: 22,
      timeRange: '9:20 AM – 10:35 AM',
      segments: [
        { type: 'walk', label: 'Walk' },
        { type: 'bus', label: 'Bus', duration: '65 min', crowd: 'High' },
        { type: 'walk', label: 'Walk' },
      ],
      safety: 74, co2Saved: 5.8, transfers: 1,
      onTime: false, lateMinutes: 6, priceLocked: true, lockMinutes: 7,
    },
    {
      id: 3, score: 80, tags: ['Eco'],
      duration: '55 min', durationMinutes: 55, price: 32,
      timeRange: '9:18 AM – 10:13 AM',
      segments: [
        { type: 'walk', label: 'Walk' },
        { type: 'metro', label: 'Metro', duration: '45 min',
          line: 'Blue Line', boardAt: 'Dwarka Sector 21', alightAt: 'Hauz Khas' },
        { type: 'walk', label: 'Walk' },
      ],
      safety: 87, co2Saved: 2.9, transfers: 1,
      onTime: true, priceLocked: true, lockMinutes: 8,
    },
  ],

  'hauz khas-connaught place': [
    {
      id: 1, score: 92, tags: ['Fastest'],
      duration: '20 min', durationMinutes: 20, price: 25,
      timeRange: '9:15 AM – 9:35 AM',
      segments: [
        { type: 'walk', label: 'Walk' },
        { type: 'metro', label: 'Metro', duration: '15 min',
          line: 'Yellow Line', boardAt: 'Hauz Khas', alightAt: 'Rajiv Chowk' },
        { type: 'walk', label: 'Walk' },
      ],
      safety: 92, co2Saved: 1.4, transfers: 1,
      onTime: true, priceLocked: true, lockMinutes: 9,
    },
    {
      id: 2, score: 85, tags: ['Cheapest'],
      duration: '35 min', durationMinutes: 35, price: 15,
      timeRange: '9:18 AM – 9:53 AM',
      segments: [
        { type: 'walk', label: 'Walk' },
        { type: 'bus', label: 'Bus', duration: '28 min', crowd: 'Low' },
        { type: 'walk', label: 'Walk' },
      ],
      safety: 81, co2Saved: 2.6, transfers: 1,
      onTime: true, priceLocked: true, lockMinutes: 8,
    },
    {
      id: 3, score: 79, tags: ['Eco'],
      duration: '22 min', durationMinutes: 22, price: 22,
      timeRange: '9:20 AM – 9:42 AM',
      segments: [
        { type: 'walk', label: 'Walk' },
        { type: 'metro', label: 'Metro', duration: '17 min',
          line: 'Yellow Line', boardAt: 'Hauz Khas', alightAt: 'Rajiv Chowk' },
        { type: 'walk', label: 'Walk' },
      ],
      safety: 88, co2Saved: 1.1, transfers: 1,
      onTime: false, lateMinutes: 2, priceLocked: true, lockMinutes: 7,
    },
  ],

  'connaught place-hauz khas': [
    {
      id: 1, score: 92, tags: ['Fastest'],
      duration: '20 min', durationMinutes: 20, price: 25,
      timeRange: '9:15 AM – 9:35 AM',
      segments: [
        { type: 'walk', label: 'Walk' },
        { type: 'metro', label: 'Metro', duration: '15 min',
          line: 'Yellow Line', boardAt: 'Rajiv Chowk', alightAt: 'Hauz Khas' },
        { type: 'walk', label: 'Walk' },
      ],
      safety: 92, co2Saved: 1.4, transfers: 1,
      onTime: true, priceLocked: true, lockMinutes: 9,
    },
    {
      id: 2, score: 85, tags: ['Cheapest'],
      duration: '35 min', durationMinutes: 35, price: 15,
      timeRange: '9:18 AM – 9:53 AM',
      segments: [
        { type: 'walk', label: 'Walk' },
        { type: 'bus', label: 'Bus', duration: '28 min', crowd: 'Low' },
        { type: 'walk', label: 'Walk' },
      ],
      safety: 81, co2Saved: 2.6, transfers: 1,
      onTime: true, priceLocked: true, lockMinutes: 8,
    },
    {
      id: 3, score: 79, tags: ['Eco'],
      duration: '22 min', durationMinutes: 22, price: 22,
      timeRange: '9:20 AM – 9:42 AM',
      segments: [
        { type: 'walk', label: 'Walk' },
        { type: 'metro', label: 'Metro', duration: '17 min',
          line: 'Yellow Line', boardAt: 'Rajiv Chowk', alightAt: 'Hauz Khas' },
        { type: 'walk', label: 'Walk' },
      ],
      safety: 88, co2Saved: 1.1, transfers: 1,
      onTime: false, lateMinutes: 2, priceLocked: true, lockMinutes: 7,
    },
  ],

  'connaught place-dwarka': [
    {
      id: 1, score: 91, tags: ['Fastest'],
      duration: '42 min', durationMinutes: 42, price: 35,
      timeRange: '9:15 AM – 9:57 AM',
      segments: [
        { type: 'walk', label: 'Walk' },
        { type: 'metro', label: 'Metro', duration: '35 min',
          line: 'Blue Line', boardAt: 'Rajiv Chowk', alightAt: 'Dwarka Sector 21' },
        { type: 'walk', label: 'Walk' },
      ],
      safety: 91, co2Saved: 3.2, transfers: 1,
      onTime: true, priceLocked: true, lockMinutes: 9,
    },
    {
      id: 2, score: 84, tags: ['Cheapest'],
      duration: '60 min', durationMinutes: 60, price: 20,
      timeRange: '9:20 AM – 10:20 AM',
      segments: [
        { type: 'walk', label: 'Walk' },
        { type: 'bus', label: 'Bus', duration: '52 min', crowd: 'High' },
        { type: 'walk', label: 'Walk' },
      ],
      safety: 75, co2Saved: 4.9, transfers: 1,
      onTime: false, lateMinutes: 4, priceLocked: true, lockMinutes: 7,
    },
    {
      id: 3, score: 79, tags: ['Eco'],
      duration: '45 min', durationMinutes: 45, price: 30,
      timeRange: '9:18 AM – 10:03 AM',
      segments: [
        { type: 'walk', label: 'Walk' },
        { type: 'metro', label: 'Metro', duration: '38 min',
          line: 'Blue Line', boardAt: 'Rajiv Chowk', alightAt: 'Dwarka Sector 21' },
        { type: 'walk', label: 'Walk' },
      ],
      safety: 86, co2Saved: 2.5, transfers: 1,
      onTime: true, priceLocked: true, lockMinutes: 8,
    },
  ],

  'cyber city-hauz khas': [
    {
      id: 1, score: 91, tags: ['Fastest'],
      duration: '30 min', durationMinutes: 30, price: 32,
      timeRange: '9:15 AM – 9:45 AM',
      segments: [
        { type: 'auto', label: 'Auto', duration: '5 min' },
        { type: 'metro', label: 'Metro', duration: '22 min',
          line: 'Yellow Line', boardAt: 'Sikanderpur', alightAt: 'Hauz Khas' },
        { type: 'walk', label: 'Walk' },
      ],
      safety: 90, co2Saved: 1.9, transfers: 1,
      onTime: true, priceLocked: true, lockMinutes: 9,
    },
    {
      id: 2, score: 84, tags: ['Cheapest'],
      duration: '45 min', durationMinutes: 45, price: 18,
      timeRange: '9:18 AM – 10:03 AM',
      segments: [
        { type: 'walk', label: 'Walk' },
        { type: 'bus', label: 'Bus', duration: '38 min', crowd: 'Low' },
        { type: 'walk', label: 'Walk' },
      ],
      safety: 81, co2Saved: 3.1, transfers: 1,
      onTime: true, priceLocked: true, lockMinutes: 8,
    },
    {
      id: 3, score: 79, tags: ['Eco'],
      duration: '32 min', durationMinutes: 32, price: 28,
      timeRange: '9:20 AM – 9:52 AM',
      segments: [
        { type: 'auto', label: 'Auto', duration: '4 min' },
        { type: 'metro', label: 'Metro', duration: '25 min',
          line: 'Yellow Line', boardAt: 'Sikanderpur', alightAt: 'Hauz Khas' },
        { type: 'walk', label: 'Walk' },
      ],
      safety: 87, co2Saved: 1.5, transfers: 1,
      onTime: false, lateMinutes: 2, priceLocked: true, lockMinutes: 7,
    },
  ],
};

// ─── Default routes (fallback) ────────────────────────────────────────────────
const DEFAULT_ROUTES: Route[] = routeDatabase['connaught place-cyber city'];

/**
 * Strict route lookup.
 * Returns Route[] when found, or null when inputs are blank / pair not in database.
 * The caller (App.tsx) must handle null — show a "no routes found" UI.
 */
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

export function getRoutesForTrip(from: string, to: string, departureTime?: string): Route[] | null {
  const nFrom = normalize(from);
  const nTo   = normalize(to);

  // Blank input → no results yet
  if (!nFrom || !nTo) return null;

  // Strict exact key lookup only — no fuzzy matching
  const key = `${nFrom}-${nTo}`;
  let routes: Route[] | null = null;
  if (routeDatabase[key]) {
    routes = routeDatabase[key];
  } else {
    // Reverse lookup
    const reverseKey = `${nTo}-${nFrom}`;
    if (routeDatabase[reverseKey]) {
      routes = routeDatabase[reverseKey];
    }
  }

  if (routes) {
    const start = departureTime || '9:15 AM';
    routes.forEach((route) => {
      const end = addMinutes(start, route.durationMinutes);
      route.timeRange = `${start} – ${end}`;
    });
    return routes;
  }

  return null;
}

// ─── Static exports ────────────────────────────────────────────────────────────
// Still exported so existing DetailScreen / BookScreen keep working unchanged
export const mockRoutes: Route[]      = DEFAULT_ROUTES;
export const mockJourneySteps: JourneyStep[] = [
  { id: 1, location: 'Connaught Place',    time: '9:15 AM', description: 'Starting point' },
  { id: 2, location: 'Rajiv Chowk Metro', time: '9:18 AM', description: '3 min walk',              safety: 90, segment: { type: 'walk',  label: 'Walk' } },
  { id: 3, location: 'HRC Metro Station', time: '9:35 AM', description: 'Metro Yellow Line – 17 min, 6 stops', safety: 85, segment: { type: 'metro', label: 'Metro', line: 'Yellow Line' } },
  { id: 4, location: 'Sikanderpur Bus Stop', time: '9:52 AM', description: 'Bus 14 – 8 min',       safety: 78, segment: { type: 'bus',   label: 'Bus' } },
  { id: 5, location: 'Cyber City',         time: '10:03 AM', description: 'Destination' },
];

export const weeklyCo2Data = [
  { day: 'M', value: 0.3 }, { day: 'T', value: 0.5 }, { day: 'W', value: 0.8 },
  { day: 'T', value: 0.4 }, { day: 'F', value: 0.6 }, { day: 'S', value: 1.1 },
  { day: 'S', value: 0.5 },
];

export const preferenceOptions = [
  'Fastest', 'Cheapest', 'Eco-Friendly', 'Women Safe', 'Accessible', 'Least Transfers',
];
