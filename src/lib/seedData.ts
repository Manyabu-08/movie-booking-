import type { Movie, Showtime, Theatre } from '../types';

export const SEED_MOVIES: Omit<Movie, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'mov_obsidian_horizon',
    title: 'Obsidian Horizon',
    synopsis:
      'When an orbital relay detects a harmonic signal inside a rogue ringed giant, mission commander Elena Vance leads a three-person descent team into uncharted atmospheric storms where every transmission fractures reality.',
    posterUrl: '/src/assets/images/poster_solar_eclipse_1795160107300.jpg',
    bannerUrl: '/src/assets/images/hero_obsidian_horizon_1795160106504.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    language: 'English',
    durationMinutes: 148,
    rating: 8.9,
    officialCertification: 'UA 13+',
    releaseDate: '2026-11-06',
    status: 'now_showing',
    trending: true,
    featured: true,
    cities: ['Mumbai', 'Bengaluru', 'Delhi NCR', 'Hyderabad', 'New York', 'London'],
    cast: ['Elena Rostova', 'Marcus Vance', 'Kenji Takahashi', 'Soraia Mendes'],
    primaryCategory: 'Science Fiction',
    secondaryCategories: ['Adventure', 'Thriller'],
    moodTags: ['Cosmic', 'High-Stakes', 'Atmospheric', 'Visually Grand'],
    aiExplanation:
      'Anchored in deep-space exploration and survival tension beneath an alien atmosphere, pairing grand sci-fi wonder with thriller pacing.',
    aiFamilyFriendlyAssessment: 'caution_advised',
    aiFamilyFriendlyNote:
      'AI tone impression: intense peril and psychological tension; not an official film age certification.',
    aiReviewedByAdmin: true,
  },
  {
    id: 'mov_velvet_nocturne',
    title: 'Velvet Nocturne',
    synopsis:
      'During a relentless Tokyo monsoon, retired archivist Ren Kurosawa uncovers an encrypted vinyl pressing linked to three vanished symphony conductors, pulling him into an underworld of forged memories and midnight confessions.',
    posterUrl: '/src/assets/images/poster_glass_alibi_1795160106418.jpg',
    bannerUrl: '/src/assets/images/hero_velvet_nocturne_1795160106976.jpg',
    trailerUrl: '',
    language: 'Japanese',
    durationMinutes: 132,
    rating: 8.7,
    officialCertification: 'UA 16+',
    releaseDate: '2026-11-12',
    status: 'now_showing',
    trending: true,
    featured: true,
    cities: ['Mumbai', 'Bengaluru', 'New York', 'London'],
    cast: ['Hidetoshi Sato', 'Aoi Nakamura', 'Clara Bellini'],
    primaryCategory: 'Thriller',
    secondaryCategories: ['Mystery', 'Drama'],
    moodTags: ['Neo-Noir', 'Rain-Slicked', 'Suspenseful', 'Cerebral'],
    aiExplanation:
      'A classic investigative noir mystery structured around escalating paranoia, hidden motives, and moody nocturnal tension.',
    aiFamilyFriendlyAssessment: 'adult_themes',
    aiFamilyFriendlyNote:
      'AI tone impression: mature noir themes and crime mystery; not an official film age certification.',
    aiReviewedByAdmin: true,
  },
  {
    id: 'mov_hollow_manor',
    title: 'The Hollow Conservatory',
    synopsis:
      'Hired to catalog botanical specimens inside a fog-bound Victorian glasshouse, botanist Clara Mercer discovers that every nocturnal bloom replays the final whispers of the estate’s missing heirs.',
    posterUrl: '/src/assets/images/poster_hollow_manor_1795160106285.jpg',
    bannerUrl: '/src/assets/images/poster_hollow_manor_1795160106285.jpg',
    trailerUrl: '',
    language: 'English',
    durationMinutes: 116,
    rating: 8.2,
    officialCertification: 'A',
    releaseDate: '2026-10-30',
    status: 'now_showing',
    trending: true,
    featured: false,
    cities: ['Mumbai', 'Delhi NCR', 'New York', 'London'],
    cast: ['Florence Vance', 'Julian Thorne', 'Miriam Cole'],
    primaryCategory: 'Horror',
    secondaryCategories: ['Mystery', 'Thriller'],
    moodTags: ['Gothic', 'Eerie', 'Slow-Burn Dread', 'Haunted'],
    aiExplanation:
      'Rooted in gothic supernatural dread and claustrophobic estate folklore, blending classic horror atmosphere with a central mystery.',
    aiFamilyFriendlyAssessment: 'adult_themes',
    aiFamilyFriendlyNote:
      'AI tone impression: frightening supernatural imagery and suspense; not an official film age certification.',
    aiReviewedByAdmin: true,
  },
  {
    id: 'mov_lantern_valley',
    title: 'Lantern Valley',
    synopsis:
      'When the annual river lanterns lose their glow, twelve-year-old illustrator Mina teams up with a mischievous ember fox spirit to cross the Whispering Woods and restore light to her mountain village.',
    posterUrl: '/src/assets/images/poster_lantern_valley_1795160106597.jpg',
    bannerUrl: '/src/assets/images/poster_lantern_valley_1795160106597.jpg',
    trailerUrl: '',
    language: 'English',
    durationMinutes: 104,
    rating: 9.1,
    officialCertification: 'U',
    releaseDate: '2026-11-14',
    status: 'now_showing',
    trending: true,
    featured: false,
    cities: ['Mumbai', 'Bengaluru', 'Delhi NCR', 'Hyderabad', 'New York', 'London'],
    cast: ['Maya Lin', 'Devon Brooks', 'Tessa Sterling'],
    primaryCategory: 'Animation',
    secondaryCategories: ['Family', 'Fantasy', 'Adventure'],
    moodTags: ['Heartwarming', 'Whimsical', 'Magical', 'Uplifting'],
    aiExplanation:
      'Handcrafted animated storytelling centered on friendship, wonder, and gentle peril suitable across generations.',
    aiFamilyFriendlyAssessment: 'likely_family_friendly',
    aiFamilyFriendlyNote:
      'AI tone impression: warm, whimsical adventure suited to family audiences; refer to official certification for formal guidance.',
    aiReviewedByAdmin: true,
  },
  {
    id: 'mov_iron_syndicate',
    title: 'Iron Syndicate',
    synopsis:
      'An armored courier driver framed for a bullion heist across three coastal bridges has ninety minutes before dawn to outrun rogue tactical units and deliver the black-box ledger.',
    posterUrl: '/src/assets/images/poster_iron_syndicate_1795160106323.jpg',
    bannerUrl: '/src/assets/images/poster_iron_syndicate_1795160106323.jpg',
    trailerUrl: '',
    language: 'Hindi',
    durationMinutes: 138,
    rating: 8.5,
    officialCertification: 'UA 16+',
    releaseDate: '2026-11-08',
    status: 'now_showing',
    trending: true,
    featured: false,
    cities: ['Mumbai', 'Bengaluru', 'Delhi NCR', 'Hyderabad'],
    cast: ['Kabir Verma', 'Zoya Khan', 'Rohan Deshmukh'],
    primaryCategory: 'Action',
    secondaryCategories: ['Thriller', 'Adventure'],
    moodTags: ['Adrenaline', 'Relentless', 'Kinetic', 'Gritty'],
    aiExplanation:
      'Driven by high-velocity vehicular chases, tactical confrontations, and ticking-clock action set pieces.',
    aiFamilyFriendlyAssessment: 'caution_advised',
    aiFamilyFriendlyNote:
      'AI tone impression: intense action sequences and stylized combat; not an official film age certification.',
    aiReviewedByAdmin: true,
  },
  {
    id: 'mov_monsoon_letters',
    title: 'Monsoon Letters',
    synopsis:
      'Two architects renovating a cliffside coastal café discover decades-old postcards tucked behind cedar wainscoting, sparking an unexpected romance over shared rainstorms and late-night blueprints.',
    posterUrl: '/src/assets/images/poster_monsoon_letters_1795160105948.jpg',
    bannerUrl: '/src/assets/images/poster_monsoon_letters_1795160105948.jpg',
    trailerUrl: '',
    language: 'Hindi',
    durationMinutes: 124,
    rating: 8.4,
    officialCertification: 'UA 13+',
    releaseDate: '2026-11-01',
    status: 'now_showing',
    trending: false,
    featured: false,
    cities: ['Mumbai', 'Bengaluru', 'Delhi NCR', 'London'],
    cast: ['Aarav Mehta', 'Tara Kapoor', 'Nikhil Rao'],
    primaryCategory: 'Romance',
    secondaryCategories: ['Drama'],
    moodTags: ['Tender', 'Nostalgic', 'Poetic', 'Sunlit'],
    aiExplanation:
      'Intimate character chemistry and emotional longing woven through coastal architecture and epistolary nostalgia.',
    aiFamilyFriendlyAssessment: 'likely_family_friendly',
    aiFamilyFriendlyNote:
      'AI tone impression: gentle romantic drama without graphic content; not an official film age certification.',
    aiReviewedByAdmin: true,
  },
  {
    id: 'mov_grand_hotel_chaos',
    title: 'Grand Hotel Chaos',
    synopsis:
      'On the eve of a royal summit, an overzealous head bellhop swaps three identical monogrammed trunks, triggering a whirlwind of mistaken identities, runaway pastries, and chandelier rescues.',
    posterUrl: '/src/assets/images/poster_grand_hotel_chaos_1795160107037.jpg',
    bannerUrl: '/src/assets/images/poster_grand_hotel_chaos_1795160107037.jpg',
    trailerUrl: '',
    language: 'English',
    durationMinutes: 108,
    rating: 8.1,
    officialCertification: 'U',
    releaseDate: '2026-11-15',
    status: 'now_showing',
    trending: false,
    featured: false,
    cities: ['Mumbai', 'Bengaluru', 'New York', 'London'],
    cast: ['Arthur Pendelton', 'Nadia Laurent', 'Victor Sterling'],
    primaryCategory: 'Comedy',
    secondaryCategories: ['Family', 'Mystery'],
    moodTags: ['Witty', 'Playful', 'Symmetrical', 'Crowd-Pleaser'],
    aiExplanation:
      'A fast-paced ensemble farce fueled by escalating misunderstandings, physical comedy, and whimsical hotel intrigue.',
    aiFamilyFriendlyAssessment: 'likely_family_friendly',
    aiFamilyFriendlyNote:
      'AI tone impression: lighthearted comedic caper suitable for general audiences; not an official certification.',
    aiReviewedByAdmin: true,
  },
  {
    id: 'mov_crown_of_ash',
    title: 'Crown of Ash',
    synopsis:
      'After an ancient ember seal shatters beneath the Obsidian Peaks, a disgraced blacksmith and a rogue cartographer must forge a truce between warring mountain clans before winter consumes the realm.',
    posterUrl: '/src/assets/images/poster_crown_of_ash_1795160107005.jpg',
    bannerUrl: '/src/assets/images/poster_crown_of_ash_1795160107005.jpg',
    trailerUrl: '',
    language: 'English',
    durationMinutes: 156,
    rating: 8.8,
    officialCertification: 'UA 13+',
    releaseDate: '2026-12-18',
    status: 'coming_soon',
    trending: false,
    featured: false,
    cities: ['Mumbai', 'Bengaluru', 'Delhi NCR', 'Hyderabad', 'New York', 'London'],
    cast: ['Liam Thorne', 'Freya Lindqvist', 'Idris Cole'],
    primaryCategory: 'Fantasy',
    secondaryCategories: ['Adventure', 'Action'],
    moodTags: ['Mythic', 'Epic Scale', 'Dark Fantasy', 'Heroic'],
    aiExplanation:
      'Sweeping world-building, ancient volcanic lore, and clan diplomacy define this dark fantasy quest.',
    aiFamilyFriendlyAssessment: 'caution_advised',
    aiFamilyFriendlyNote:
      'AI tone impression: epic fantasy battle peril and dark themes; not an official film age certification.',
    aiReviewedByAdmin: true,
  },
];

export const SEED_THEATRES: Omit<Theatre, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'th_lumiere_mumbai',
    name: 'Lumiere IMAX Palladium',
    city: 'Mumbai',
    address: 'Lower Parel High Street, Mumbai 400013',
    screens: 8,
    amenities: ['IMAX Laser', 'Dolby Atmos', 'Recliner Lounge', 'Gourmet Concessions'],
  },
  {
    id: 'th_marina_mumbai',
    name: 'Marina Boulevard Cinemas',
    city: 'Mumbai',
    address: 'Bandra West Promenade, Mumbai 400050',
    screens: 6,
    amenities: ['4K Laser', 'Dolby Atmos', 'Valet Parking'],
  },
  {
    id: 'th_aurora_blr',
    name: 'Aurora Luxe Indiranagar',
    city: 'Bengaluru',
    address: '100 Feet Road, Indiranagar, Bengaluru 560038',
    screens: 7,
    amenities: ['IMAX Laser', 'Dolby Vision', 'Artisan Cafe'],
  },
  {
    id: 'th_imperial_delhi',
    name: 'Imperial Pavilion Select',
    city: 'Delhi NCR',
    address: 'Saket District Centre, New Delhi 110017',
    screens: 9,
    amenities: ['Dolby Atmos', 'Recliner Lounge', '4DX'],
  },
  {
    id: 'th_deccan_hyd',
    name: 'Deccan Horizon Multiplex',
    city: 'Hyderabad',
    address: 'Jubilee Hills Road No. 36, Hyderabad 500033',
    screens: 6,
    amenities: ['4K Laser', 'Dolby Atmos', 'Acoustic Lounge'],
  },
  {
    id: 'th_lincoln_ny',
    name: 'Astor Grand 70mm',
    city: 'New York',
    address: '214 West 42nd Street, New York, NY 10036',
    screens: 10,
    amenities: ['70mm IMAX', 'Dolby Atmos', 'Reserved Recliners'],
  },
  {
    id: 'th_soho_london',
    name: 'Curzon Meridian Soho',
    city: 'London',
    address: '99 Shaftesbury Avenue, London W1D 5DY',
    screens: 5,
    amenities: ['4K Laser', 'Dolby Atmos', 'Members Bar'],
  },
];

export function buildSeedShowtimes(): Omit<Showtime, 'createdAt' | 'updatedAt'>[] {
  const dates = ['2026-11-19', '2026-11-20', '2026-11-21'];
  const slots = [
    { time: '10:45 AM', format: 'Standard 2D', std: 280, prem: 440, fee: 35, screen: 'Audi 01' },
    { time: '02:15 PM', format: 'Dolby Atmos', std: 340, prem: 520, fee: 40, screen: 'Audi 02' },
    { time: '06:30 PM', format: 'IMAX Laser', std: 460, prem: 720, fee: 45, screen: 'IMAX Hall' },
    { time: '09:45 PM', format: 'Dolby Atmos', std: 380, prem: 580, fee: 40, screen: 'Audi 03' },
  ];

  const occupiedPresets = [
    ['D4', 'D5', 'E5', 'E6', 'H4', 'H5'],
    ['C3', 'C4', 'F6', 'F7', 'I5', 'I6'],
    ['B5', 'B6', 'E4', 'E5', 'E6', 'J4', 'J5'],
    ['A4', 'D6', 'D7', 'G5', 'H6', 'H7'],
  ];

  const showtimes: Omit<Showtime, 'createdAt' | 'updatedAt'>[] = [];
  const nowShowingMovies = SEED_MOVIES.filter((m) => m.status === 'now_showing');

  for (const movie of nowShowingMovies) {
    const matchingTheatres = SEED_THEATRES.filter((t) => movie.cities.includes(t.city));
    for (const theatre of matchingTheatres) {
      for (let dIdx = 0; dIdx < dates.length; dIdx++) {
        const showDate = dates[dIdx];
        // Two showtimes per date per theatre for crisp scheduling
        const daySlots = dIdx % 2 === 0 ? [slots[1], slots[2], slots[3]] : [slots[0], slots[2]];
        for (let sIdx = 0; sIdx < daySlots.length; sIdx++) {
          const slot = daySlots[sIdx];
          const id = `st_${movie.id.replace('mov_', '')}_${theatre.id.replace('th_', '')}_${showDate.replace(/-/g, '')}_${sIdx}`;
          showtimes.push({
            id,
            movieId: movie.id,
            theatreId: theatre.id,
            city: theatre.city,
            screenName: slot.screen,
            showDate,
            showTime: slot.time,
            format: slot.format,
            standardPrice: slot.std,
            premiumPrice: slot.prem,
            convenienceFeePerTicket: slot.fee,
            bookedSeats: occupiedPresets[(dIdx + sIdx) % occupiedPresets.length],
            heldSeats: {},
          });
        }
      }
    }
  }

  return showtimes;
}
