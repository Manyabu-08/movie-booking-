import { auth } from './firebase';
import type { AiCategorizationResult, AiRecommendationResponse, Movie } from '../types';

async function getOptionalAuthHeader(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

async function getRequiredAuthHeader(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be signed in to perform this action.');
  }
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

export async function categorizeMovieWithAI(input: {
  title: string;
  synopsis: string;
  language?: string;
  officialCertification?: string;
}): Promise<AiCategorizationResult> {
  const headers = await getRequiredAuthHeader();
  const res = await fetch('/api/ai/categorize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(input),
  });

  const data = (await res.json()) as AiCategorizationResult & { error?: string };
  if (!res.ok) {
    throw new Error(data.error || 'AI categorization failed.');
  }
  return data;
}

export async function recommendMoviesWithAI(input: {
  query: string;
  movies: Movie[];
  city?: string;
  favoriteGenres?: string[];
  bookedMovieTitles?: string[];
  personalizationConsent?: boolean;
}): Promise<AiRecommendationResponse> {
  const headers = await getOptionalAuthHeader();
  const res = await fetch('/api/ai/recommend', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(input),
  });

  const data = (await res.json()) as AiRecommendationResponse & { error?: string };
  if (!res.ok) {
    throw new Error(data.error || 'AI recommendation failed.');
  }
  return data;
}

export async function calculatePricingOnServer(input: {
  seats: string[];
  standardPrice: number;
  premiumPrice: number;
  convenienceFeePerTicket: number;
}): Promise<{ ticketAmount: number; convenienceFee: number; totalAmount: number }> {
  const res = await fetch('/api/payments/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = (await res.json()) as {
    ticketAmount: number;
    convenienceFee: number;
    totalAmount: number;
    error?: string;
  };
  if (!res.ok) {
    throw new Error(data.error || 'Unable to calculate ticket total.');
  }
  return data;
}

export async function processDemoPaymentOnServer(input: {
  reservationId: string;
  showtimeId: string;
  seats: string[];
  standardPrice: number;
  premiumPrice: number;
  convenienceFeePerTicket: number;
  simulateOutcome: 'success' | 'fail';
}): Promise<{
  ok: boolean;
  status: 'paid' | 'failed';
  paymentId: string;
  bookingCode: string;
  qrReference: string;
  ticketAmount: number;
  convenienceFee: number;
  totalAmount: number;
}> {
  const headers = await getRequiredAuthHeader();
  const res = await fetch('/api/payments/demo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(input),
  });
  const data = (await res.json()) as {
    ok: boolean;
    status: 'paid' | 'failed';
    paymentId: string;
    bookingCode: string;
    qrReference: string;
    ticketAmount: number;
    convenienceFee: number;
    totalAmount: number;
    error?: string;
  };
  if (!res.ok || !data.ok) {
    throw new Error(data.error || 'Simulated demo payment failed.');
  }
  return data;
}
