import 'dotenv/config';
import express, { type NextFunction, type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { GoogleGenAI, Type } from '@google/genai';
import { getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Firebase projectId from firebase-applet-config.json without requiring IAM
let firebaseProjectId = '';
try {
  const configPath = path.resolve(__dirname, 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const raw = JSON.parse(fs.readFileSync(configPath, 'utf8')) as { projectId?: string };
    if (raw.projectId && raw.projectId !== 'remixed-project-id') {
      firebaseProjectId = raw.projectId;
    }
  }
} catch (err) {
  console.warn('Could not read firebase-applet-config.json:', err);
}

const adminApp = firebaseProjectId
  ? getApps().length
    ? getApp()
    : initializeApp({ projectId: firebaseProjectId })
  : null;

const adminAuth = adminApp ? getAuth(adminApp) : null;

const ALLOWED_CATEGORIES = [
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
] as const;

const FAMILY_ASSESSMENTS = [
  'likely_family_friendly',
  'caution_advised',
  'adult_themes',
  'uncertain',
] as const;

const PREMIUM_ROWS = new Set(['H', 'I', 'J']);
const SEAT_REGEX = /^[A-J](10|[1-9])$/;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

interface AuthedRequest extends Request {
  user?: DecodedIdToken;
}

async function requireFirebaseAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!adminAuth) {
    return res.status(503).json({
      error: 'Firebase authentication is not configured yet on this server.',
    });
  }
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Authentication required. Please sign in to continue.',
    });
  }
  const idToken = authHeader.slice(7).trim();
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    req.user = decoded;
    return next();
  } catch (err) {
    console.error('Firebase token verification error:', err);
    return res.status(401).json({
      error: 'Your session token is invalid or expired. Please sign in again.',
    });
  }
}

async function optionalFirebaseAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  if (!adminAuth) return next();
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const idToken = authHeader.slice(7).trim();
    try {
      req.user = await adminAuth.verifyIdToken(idToken);
    } catch {
      // Ignore invalid optional token
    }
  }
  return next();
}

function calculateSeatAmounts(
  seats: string[],
  standardPrice: number,
  premiumPrice: number,
  convenienceFeePerTicket: number
) {
  let ticketAmount = 0;
  for (const seat of seats) {
    const row = seat.charAt(0).toUpperCase();
    ticketAmount += PREMIUM_ROWS.has(row) ? premiumPrice : standardPrice;
  }
  const convenienceFee = seats.length * convenienceFeePerTicket;
  const totalAmount = ticketAmount + convenienceFee;
  return { ticketAmount, convenienceFee, totalAmount };
}

async function createServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'cinebook-ai',
      firebaseConfigured: Boolean(firebaseProjectId),
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // Server-side Gemini AI Movie Categorization
  app.post('/api/ai/categorize', requireFirebaseAuth, async (req: AuthedRequest, res: Response) => {
    try {
      if (!req.user?.email_verified) {
        return res.status(403).json({
          error: 'Verified email account is required to run AI movie categorization.',
        });
      }

      const { title, synopsis, language, officialCertification } = req.body as {
        title?: string;
        synopsis?: string;
        language?: string;
        officialCertification?: string;
      };

      if (!title || typeof title !== 'string' || title.trim().length < 2) {
        return res.status(400).json({ error: 'Movie title is required.' });
      }
      if (!synopsis || typeof synopsis !== 'string' || synopsis.trim().length < 10) {
        return res.status(400).json({ error: 'Movie synopsis (at least 10 characters) is required.' });
      }

      const ai = getGeminiClient();
      const prompt = [
        `Analyze the following film and classify it strictly using the allowed CineBook AI categories.`,
        `Title: ${title.trim()}`,
        language ? `Language: ${language.trim()}` : '',
        officialCertification ? `Official Certification (reference only, do not equate with AI tone check): ${officialCertification.trim()}` : '',
        `Synopsis: ${synopsis.trim()}`,
        ``,
        `Allowed categories: ${ALLOWED_CATEGORIES.join(', ')}.`,
        `Requirements:`,
        `1. Choose exactly 1 primaryCategory from the allowed categories.`,
        `2. Choose 1 to 3 secondaryCategories from the allowed categories (must not repeat primaryCategory).`,
        `3. Provide 3 to 5 concise moodTags (e.g., "Suspenseful", "Heartwarming", "Cosmic", "Noir").`,
        `4. Write a concise 1-2 sentence explanation of why the narrative fits these genres.`,
        `5. Assess whether the story description appears family-friendly using one of: ${FAMILY_ASSESSMENTS.join(', ')}. Use "uncertain" if the synopsis lacks enough detail.`,
        `6. Provide a short familyFriendlyNote clearly stating this is an AI narrative impression and NOT an official film age certification.`,
      ]
        .filter(Boolean)
        .join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'You are a film programmer and taxonomy analyst for CineBook AI. Return strictly structured JSON matching the schema. Never confuse AI content tone impressions with official MPAA/CBFC/BBFC film age certifications.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              primaryCategory: {
                type: Type.STRING,
                enum: [...ALLOWED_CATEGORIES],
                description: 'Primary genre from the 12 supported categories.',
              },
              secondaryCategories: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING,
                  enum: [...ALLOWED_CATEGORIES],
                },
                description: '1 to 3 secondary genres distinct from primaryCategory.',
              },
              moodTags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '3 to 5 concise mood descriptors.',
              },
              explanation: {
                type: Type.STRING,
                description: '1-2 sentence explanation of the genre classification.',
              },
              familyFriendlyAssessment: {
                type: Type.STRING,
                enum: [...FAMILY_ASSESSMENTS],
                description: 'Tentative AI tone impression, expressing uncertainty where appropriate.',
              },
              familyFriendlyNote: {
                type: Type.STRING,
                description: 'Short disclaimer noting this is an AI assessment, not an official rating.',
              },
            },
            required: [
              'primaryCategory',
              'secondaryCategories',
              'moodTags',
              'explanation',
              'familyFriendlyAssessment',
              'familyFriendlyNote',
            ],
          },
        },
      });

      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        return res.status(502).json({ error: 'Gemini returned an empty response.' });
      }

      const parsed = JSON.parse(rawText) as {
        primaryCategory?: string;
        secondaryCategories?: string[];
        moodTags?: string[];
        explanation?: string;
        familyFriendlyAssessment?: string;
        familyFriendlyNote?: string;
      };

      const validPrimary = ALLOWED_CATEGORIES.includes(parsed.primaryCategory as (typeof ALLOWED_CATEGORIES)[number])
        ? (parsed.primaryCategory as (typeof ALLOWED_CATEGORIES)[number])
        : null;

      if (!validPrimary) {
        return res.status(502).json({ error: 'AI returned an unsupported primary category.' });
      }

      const validSecondary = Array.from(
        new Set(
          (parsed.secondaryCategories ?? []).filter(
            (cat): cat is (typeof ALLOWED_CATEGORIES)[number] =>
              ALLOWED_CATEGORIES.includes(cat as (typeof ALLOWED_CATEGORIES)[number]) && cat !== validPrimary
          )
        )
      ).slice(0, 3);

      const moodTags = (parsed.moodTags ?? [])
        .map((t) => String(t).trim())
        .filter((t) => t.length > 0 && t.length <= 32)
        .slice(0, 5);

      const familyFriendlyAssessment = FAMILY_ASSESSMENTS.includes(
        parsed.familyFriendlyAssessment as (typeof FAMILY_ASSESSMENTS)[number]
      )
        ? (parsed.familyFriendlyAssessment as (typeof FAMILY_ASSESSMENTS)[number])
        : 'uncertain';

      return res.json({
        primaryCategory: validPrimary,
        secondaryCategories: validSecondary,
        moodTags,
        explanation: String(parsed.explanation ?? '').slice(0, 580),
        familyFriendlyAssessment,
        familyFriendlyNote:
          String(parsed.familyFriendlyNote ?? '').slice(0, 280) ||
          'AI story-tone impression only; refer to official certification for age suitability.',
      });
    } catch (err) {
      console.error('Gemini categorization error:', err);
      const message = err instanceof Error ? err.message : 'Failed to categorize movie with Gemini AI.';
      return res.status(500).json({ error: message });
    }
  });

  // Server-side Gemini AI "Find My Movie" Recommendations (strictly grounded in Firestore catalog)
  app.post('/api/ai/recommend', optionalFirebaseAuth, async (req: AuthedRequest, res: Response) => {
    try {
      const {
        query,
        movies,
        city,
        favoriteGenres,
        bookedMovieTitles,
        personalizationConsent,
      } = req.body as {
        query?: string;
        movies?: Array<{
          id: string;
          title: string;
          synopsis: string;
          primaryCategory: string;
          secondaryCategories?: string[];
          moodTags?: string[];
          rating?: number;
          language?: string;
          status?: string;
          cities?: string[];
        }>;
        city?: string;
        favoriteGenres?: string[];
        bookedMovieTitles?: string[];
        personalizationConsent?: boolean;
      };

      if (!query || typeof query !== 'string' || query.trim().length < 2) {
        return res.status(400).json({ error: 'Please enter what kind of movie you are looking for.' });
      }

      if (!Array.isArray(movies) || movies.length === 0) {
        return res.status(400).json({
          error: 'No movies are currently available in the database catalog to recommend from.',
        });
      }

      const validMovieMap = new Map(movies.map((m) => [m.id, m]));
      const sanitizedCatalog = movies.slice(0, 60).map((m) => ({
        id: m.id,
        title: m.title,
        primaryCategory: m.primaryCategory,
        secondaryCategories: m.secondaryCategories ?? [],
        moodTags: m.moodTags ?? [],
        rating: m.rating ?? 0,
        language: m.language ?? 'English',
        status: m.status ?? 'now_showing',
        cities: m.cities ?? [],
        synopsis: String(m.synopsis ?? '').slice(0, 260),
      }));

      const personalizationContext =
        personalizationConsent && req.user
          ? [
              favoriteGenres?.length ? `User favorite genres (consented): ${favoriteGenres.join(', ')}` : '',
              bookedMovieTitles?.length ? `User past booked movies (consented): ${bookedMovieTitles.join(', ')}` : '',
            ]
              .filter(Boolean)
              .join('\n')
          : 'No user personalization profile requested; rely solely on the user query.';

      const ai = getGeminiClient();
      const prompt = [
        `User request: "${query.trim()}"`,
        city ? `Preferred city: ${city}` : '',
        personalizationContext,
        ``,
        `Available CineBook AI Firestore Movie Catalog (ONLY recommend movie IDs from this exact JSON list):`,
        JSON.stringify(sanitizedCatalog),
        ``,
        `Instructions:`,
        `- Recommend between 1 and 4 matching movies from the catalog above, ranked best match first.`,
        `- NEVER invent a movieId or title not present in the catalog list.`,
        `- If the request asks for high ratings, prioritize higher rated titles. If it mentions a city or mood, factor that in.`,
        `- Provide a concise assistantSummary (1-2 sentences) and a specific matchReason for each recommended movie.`,
      ]
        .filter(Boolean)
        .join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'You are Find My Movie, the cinema concierge for CineBook AI. Recommend ONLY films from the supplied Firestore catalog JSON. Never fabricate films, actors, or showtimes.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              assistantSummary: {
                type: Type.STRING,
                description: 'Helpful 1-2 sentence concierge summary tailored to the request.',
              },
              recommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    movieId: { type: Type.STRING },
                    matchReason: { type: Type.STRING },
                    relevanceScore: { type: Type.NUMBER },
                  },
                  required: ['movieId', 'matchReason', 'relevanceScore'],
                },
              },
            },
            required: ['assistantSummary', 'recommendations'],
          },
        },
      });

      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        return res.status(502).json({ error: 'Gemini returned an empty recommendation response.' });
      }

      const parsed = JSON.parse(rawText) as {
        assistantSummary?: string;
        recommendations?: Array<{
          movieId?: string;
          matchReason?: string;
          relevanceScore?: number;
        }>;
      };

      // Strictly filter against actual Firestore movie IDs
      const verifiedRecommendations = (parsed.recommendations ?? [])
        .filter((rec) => rec.movieId && validMovieMap.has(rec.movieId))
        .slice(0, 4)
        .map((rec) => ({
          movieId: rec.movieId as string,
          matchReason: String(rec.matchReason ?? 'Matches your request based on genre and tone.').slice(0, 260),
          relevanceScore: Math.max(0, Math.min(100, Number(rec.relevanceScore ?? 85))),
        }));

      return res.json({
        assistantSummary:
          String(parsed.assistantSummary ?? '').slice(0, 360) ||
          'Here are the best matches currently available in our catalog.',
        recommendations: verifiedRecommendations,
      });
    } catch (err) {
      console.error('Gemini recommendation error:', err);
      const message = err instanceof Error ? err.message : 'Unable to generate movie recommendations.';
      return res.status(500).json({ error: message });
    }
  });

  // Authoritative Server-Side Price Calculation
  app.post('/api/payments/calculate', (req: Request, res: Response) => {
    const { seats, standardPrice, premiumPrice, convenienceFeePerTicket } = req.body as {
      seats?: string[];
      standardPrice?: number;
      premiumPrice?: number;
      convenienceFeePerTicket?: number;
    };

    if (!Array.isArray(seats) || seats.length === 0 || seats.length > 10) {
      return res.status(400).json({ error: 'Select between 1 and 10 valid seats.' });
    }
    if (!seats.every((s) => typeof s === 'string' && SEAT_REGEX.test(s))) {
      return res.status(400).json({ error: 'Invalid seat code detected.' });
    }

    const std = Number(standardPrice);
    const prem = Number(premiumPrice);
    const fee = Number(convenienceFeePerTicket);
    if (!Number.isFinite(std) || std < 50 || !Number.isFinite(prem) || prem < 50 || !Number.isFinite(fee) || fee < 0) {
      return res.status(400).json({ error: 'Invalid showtime pricing parameters.' });
    }

    return res.json(calculateSeatAmounts(seats, std, prem, fee));
  });

  // Simulated Demo Payment Gateway (No real cards collected, no real money charged)
  app.post('/api/payments/demo', requireFirebaseAuth, async (req: AuthedRequest, res: Response) => {
    try {
      if (!req.user?.email_verified) {
        return res.status(403).json({
          error: 'Please verify your email address before completing a booking.',
        });
      }

      const {
        reservationId,
        showtimeId,
        seats,
        standardPrice,
        premiumPrice,
        convenienceFeePerTicket,
        simulateOutcome,
      } = req.body as {
        reservationId?: string;
        showtimeId?: string;
        seats?: string[];
        standardPrice?: number;
        premiumPrice?: number;
        convenienceFeePerTicket?: number;
        simulateOutcome?: 'success' | 'fail';
      };

      if (!reservationId || !showtimeId) {
        return res.status(400).json({ error: 'Missing reservationId or showtimeId.' });
      }
      if (!Array.isArray(seats) || seats.length === 0 || seats.length > 10) {
        return res.status(400).json({ error: 'Between 1 and 10 seats are required.' });
      }
      if (!seats.every((s) => typeof s === 'string' && SEAT_REGEX.test(s))) {
        return res.status(400).json({ error: 'Invalid seat coordinates supplied.' });
      }

      const std = Number(standardPrice);
      const prem = Number(premiumPrice);
      const fee = Number(convenienceFeePerTicket);
      if (!Number.isFinite(std) || std < 50 || !Number.isFinite(prem) || prem < 50 || !Number.isFinite(fee) || fee < 0) {
        return res.status(400).json({ error: 'Invalid ticket pricing parameters.' });
      }

      const amounts = calculateSeatAmounts(seats, std, prem, fee);

      if (simulateOutcome === 'fail') {
        return res.status(402).json({
          ok: false,
          status: 'failed',
          ...amounts,
          error: 'Simulated payment declined by demo gateway. No real money was charged; your seat hold has been released.',
        });
      }

      const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
      const paymentId = `PAY-DEMO-${Date.now().toString(36).toUpperCase()}-${suffix}`;
      const bookingCode = `CB-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      const qrReference = `CINEBOOK:${bookingCode}:${showtimeId}:${seats.join(',')}`;

      return res.json({
        ok: true,
        status: 'paid',
        paymentId,
        bookingCode,
        qrReference,
        ...amounts,
        processedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Demo payment error:', err);
      return res.status(500).json({ error: 'Demo payment gateway encountered an error.' });
    }
  });

  // Frontend serving: Vite middleware in dev, dist/ static assets in production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`CineBook AI server running on http://0.0.0.0:${port}`);
  });
}

createServer().catch((err) => {
  console.error('Failed to start CineBook AI server:', err);
  process.exit(1);
});
