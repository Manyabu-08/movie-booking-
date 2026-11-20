export type MovieCategory =
  | 'Horror'
  | 'Family'
  | 'Comedy'
  | 'Action'
  | 'Romance'
  | 'Thriller'
  | 'Science Fiction'
  | 'Animation'
  | 'Adventure'
  | 'Drama'
  | 'Mystery'
  | 'Fantasy';

export type FamilyFriendlyAssessment =
  | 'likely_family_friendly'
  | 'caution_advised'
  | 'adult_themes'
  | 'uncertain';

export interface Movie {
  id: string;
  title: string;
  synopsis: string;
  posterUrl: string;
  bannerUrl?: string;
  trailerUrl?: string;
  language: string;
  durationMinutes: number;
  rating: number;
  officialCertification: string;
  releaseDate: string;
  status: 'now_showing' | 'coming_soon';
  trending: boolean;
  featured: boolean;
  cities: string[];
  cast: string[];
  primaryCategory: MovieCategory;
  secondaryCategories: MovieCategory[];
  moodTags: string[];
  aiExplanation: string;
  aiFamilyFriendlyAssessment: FamilyFriendlyAssessment;
  aiFamilyFriendlyNote: string;
  aiReviewedByAdmin: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Theatre {
  id: string;
  name: string;
  city: string;
  address: string;
  screens: number;
  amenities: string[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface HeldSeatInfo {
  expiresAtMs: number;
  holderUid: string;
  reservationId: string;
}

export interface Showtime {
  id: string;
  movieId: string;
  theatreId: string;
  city: string;
  screenName: string;
  showDate: string;
  showTime: string;
  format: string;
  standardPrice: number;
  premiumPrice: number;
  convenienceFeePerTicket: number;
  bookedSeats: string[];
  heldSeats: Record<string, HeldSeatInfo>;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  city: string;
  favoriteGenres: MovieCategory[];
  role: 'user';
  photoUrl?: string;
  aiPersonalizationConsent?: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface SeatReservation {
  id: string;
  userId: string;
  showtimeId: string;
  movieId: string;
  theatreId: string;
  seats: string[];
  status: 'pending_payment' | 'confirmed' | 'cancelled' | 'expired';
  ticketAmount: number;
  convenienceFee: number;
  totalAmount: number;
  expiresAtMs: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Booking {
  id: string;
  bookingCode: string;
  userId: string;
  userEmail: string;
  userName: string;
  movieId: string;
  movieTitle: string;
  posterUrl: string;
  theatreId: string;
  theatreName: string;
  city: string;
  showtimeId: string;
  screenName: string;
  showDate: string;
  showTime: string;
  format: string;
  seats: string[];
  ticketAmount: number;
  convenienceFee: number;
  totalAmount: number;
  paymentId: string;
  paymentStatus: 'paid' | 'failed';
  bookingStatus: 'confirmed' | 'cancelled';
  reservationId: string;
  qrReference: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface AiCategorizationResult {
  primaryCategory: MovieCategory;
  secondaryCategories: MovieCategory[];
  moodTags: string[];
  explanation: string;
  familyFriendlyAssessment: FamilyFriendlyAssessment;
  familyFriendlyNote: string;
}

export interface AiRecommendationItem {
  movieId: string;
  matchReason: string;
  relevanceScore: number;
}

export interface AiRecommendationResponse {
  assistantSummary: string;
  recommendations: AiRecommendationItem[];
}

export type AppPage =
  | 'home'
  | 'movies'
  | 'categories'
  | 'ai-finder'
  | 'movie-details'
  | 'seat-selection'
  | 'payment'
  | 'ticket'
  | 'my-bookings'
  | 'profile'
  | 'admin';
