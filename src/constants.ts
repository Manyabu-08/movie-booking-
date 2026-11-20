import type { MovieCategory } from './types';

export const MOVIE_CATEGORIES: MovieCategory[] = [
  'Horror',
  'Family',
  'Comedy',
  'Action',
  'Romance',
  'Thriller',
  'Science Fiction',
  'Animation',
  'Adventure',
  'Drama',
  'Mystery',
  'Fantasy',
];

export const CITIES = [
  'Mumbai',
  'Bengaluru',
  'Delhi NCR',
  'Hyderabad',
  'New York',
  'London',
] as const;

export const LANGUAGES = [
  'English',
  'Hindi',
  'Japanese',
  'Korean',
  'Spanish',
] as const;

export const SEAT_ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'] as const;
export const SEATS_PER_ROW = 10;
// Rows H, I, J (back 3 rows closest to ideal viewing angle) are Premium Recliner seats
export const PREMIUM_ROWS = new Set(['H', 'I', 'J']);

export const BOOTSTRAPPED_ADMIN_EMAIL = 'bumanya90@gmail.com';

export const CATEGORY_STYLES: Record<
  MovieCategory,
  { tagline: string; gradient: string; accent: string }
> = {
  Horror: {
    tagline: 'Chilling folklore, haunted estates, and nocturnal dread',
    gradient: 'from-rose-950/80 via-[#171217] to-[#121216]',
    accent: 'text-rose-400',
  },
  Family: {
    tagline: 'Warmhearted adventures crafted for every generation',
    gradient: 'from-amber-950/60 via-[#171514] to-[#121216]',
    accent: 'text-amber-300',
  },
  Comedy: {
    tagline: 'Sharp wit, ensemble capers, and radiant crowd-pleasers',
    gradient: 'from-orange-950/65 via-[#181414] to-[#121216]',
    accent: 'text-orange-300',
  },
  Action: {
    tagline: 'High-velocity set pieces and precision choreography',
    gradient: 'from-red-950/80 via-[#181214] to-[#121216]',
    accent: 'text-red-400',
  },
  Romance: {
    tagline: 'Intimate encounters, coastal sunsets, and unspoken longing',
    gradient: 'from-pink-950/70 via-[#181216] to-[#121216]',
    accent: 'text-pink-300',
  },
  Thriller: {
    tagline: 'Relentless tension, razor-sharp twists, and paranoia',
    gradient: 'from-slate-900/90 via-[#14151B] to-[#121216]',
    accent: 'text-rose-300',
  },
  'Science Fiction': {
    tagline: 'Orbital horizons, speculative futures, and grand scale',
    gradient: 'from-indigo-950/70 via-[#13141C] to-[#121216]',
    accent: 'text-indigo-300',
  },
  Animation: {
    tagline: 'Handcrafted worlds brought to life frame by frame',
    gradient: 'from-teal-950/65 via-[#12171A] to-[#121216]',
    accent: 'text-teal-300',
  },
  Adventure: {
    tagline: 'Uncharted expeditions across mythic landscapes',
    gradient: 'from-emerald-950/60 via-[#121715] to-[#121216]',
    accent: 'text-emerald-300',
  },
  Drama: {
    tagline: 'Character-driven portraits and unforgettable performances',
    gradient: 'from-stone-900/80 via-[#161515] to-[#121216]',
    accent: 'text-stone-300',
  },
  Mystery: {
    tagline: 'Cryptic clues, fractured alibis, and investigative noir',
    gradient: 'from-cyan-950/65 via-[#12161A] to-[#121216]',
    accent: 'text-cyan-300',
  },
  Fantasy: {
    tagline: 'Ancient realms, arcane lore, and sweeping mythos',
    gradient: 'from-violet-950/70 via-[#16131C] to-[#121216]',
    accent: 'text-violet-300',
  },
};

export function isPremiumSeat(seatCode: string): boolean {
  const row = seatCode.charAt(0).toUpperCase();
  return PREMIUM_ROWS.has(row);
}

export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}
