import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { auth, db } from './firebase';
import { handleFirestoreError, OperationType } from './firestoreError';
import { BOOTSTRAPPED_ADMIN_EMAIL } from '../constants';
import { buildSeedShowtimes, SEED_MOVIES, SEED_THEATRES } from './seedData';
import type {
  Booking,
  HeldSeatInfo,
  Movie,
  MovieCategory,
  SeatReservation,
  Showtime,
  Theatre,
  UserProfile,
} from '../types';

export async function fetchMovies(): Promise<Movie[]> {
  try {
    const snap = await getDocs(collection(db, 'movies'));
    return snap.docs.map((d) => d.data() as Movie);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'movies');
  }
}

export async function fetchTheatres(): Promise<Theatre[]> {
  try {
    const snap = await getDocs(collection(db, 'theatres'));
    return snap.docs.map((d) => d.data() as Theatre);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'theatres');
  }
}

export async function fetchShowtimes(): Promise<Showtime[]> {
  try {
    const snap = await getDocs(collection(db, 'showtimes'));
    return snap.docs.map((d) => d.data() as Showtime);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'showtimes');
  }
}

export async function fetchShowtimesForMovie(movieId: string): Promise<Showtime[]> {
  try {
    const q = query(collection(db, 'showtimes'), where('movieId', '==', movieId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Showtime);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `showtimes?movieId=${movieId}`);
  }
}

export function subscribeShowtime(
  showtimeId: string,
  onData: (showtime: Showtime | null) => void
): Unsubscribe {
  const ref = doc(db, 'showtimes', showtimeId);
  return onSnapshot(
    ref,
    (snap) => {
      onData(snap.exists() ? (snap.data() as Showtime) : null);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, `showtimes/${showtimeId}`);
    }
  );
}

export async function checkIsAdmin(user: User | null): Promise<boolean> {
  if (!user || !user.emailVerified) return false;
  if (user.email === BOOTSTRAPPED_ADMIN_EMAIL) return true;
  try {
    const snap = await getDoc(doc(db, 'admins', user.uid));
    return snap.exists();
  } catch {
    return false;
  }
}

export async function ensureUserProfile(user: User, preferredCity: string): Promise<UserProfile | null> {
  if (!user.emailVerified) return null;
  const path = `users/${user.uid}`;
  try {
    const ref = doc(db, 'users', user.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }

    const profile: UserProfile = {
      uid: user.uid,
      email: user.email ?? 'guest@cinebook.ai',
      displayName: user.displayName?.trim() || user.email?.split('@')[0] || 'Cinema Guest',
      city: preferredCity || 'Mumbai',
      favoriteGenres: [],
      role: 'user',
      ...(user.photoURL ? { photoUrl: user.photoURL } : {}),
      aiPersonalizationConsent: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(ref, profile);
    return profile;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateUserProfile(
  uid: string,
  updates: {
    displayName?: string;
    city?: string;
    favoriteGenres?: MovieCategory[];
    aiPersonalizationConsent?: boolean;
  }
): Promise<void> {
  const path = `users/${uid}`;
  try {
    const ref = doc(db, 'users', uid);
    await updateDoc(ref, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function holdSeatsTransaction(params: {
  userId: string;
  showtimeId: string;
  movieId: string;
  theatreId: string;
  seats: string[];
  ticketAmount: number;
  convenienceFee: number;
  totalAmount: number;
}): Promise<SeatReservation> {
  const reservationId = `res_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const showtimeRef = doc(db, 'showtimes', params.showtimeId);
  const reservationRef = doc(db, 'seatReservations', reservationId);
  const nowMs = Date.now();
  const expiresAtMs = nowMs + 7 * 60 * 1000; // 7-minute temporary hold

  try {
    await runTransaction(db, async (tx) => {
      const stSnap = await tx.get(showtimeRef);
      if (!stSnap.exists()) {
        throw new Error('Selected showtime no longer exists.');
      }
      const st = stSnap.data() as Showtime;
      const bookedSet = new Set(st.bookedSeats ?? []);
      const existingHolds = st.heldSeats ?? {};

      // Prune expired holds while checking conflicts
      const nextHolds: Record<string, HeldSeatInfo> = {};
      for (const [seatCode, info] of Object.entries(existingHolds)) {
        if (info && info.expiresAtMs > nowMs) {
          nextHolds[seatCode] = info;
        }
      }

      for (const seat of params.seats) {
        if (bookedSet.has(seat)) {
          throw new Error(`Seat ${seat} was just booked by another guest. Please select different seats.`);
        }
        const activeHold = nextHolds[seat];
        if (activeHold && activeHold.holderUid !== params.userId) {
          throw new Error(`Seat ${seat} is temporarily reserved by another guest. Please select another seat.`);
        }
        nextHolds[seat] = {
          expiresAtMs,
          holderUid: params.userId,
          reservationId,
        };
      }

      const reservationDoc: SeatReservation = {
        id: reservationId,
        userId: params.userId,
        showtimeId: params.showtimeId,
        movieId: params.movieId,
        theatreId: params.theatreId,
        seats: params.seats,
        status: 'pending_payment',
        ticketAmount: params.ticketAmount,
        convenienceFee: params.convenienceFee,
        totalAmount: params.totalAmount,
        expiresAtMs,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      tx.update(showtimeRef, {
        heldSeats: nextHolds,
        updatedAt: serverTimestamp(),
      });
      tx.set(reservationRef, reservationDoc);
    });

    return {
      id: reservationId,
      userId: params.userId,
      showtimeId: params.showtimeId,
      movieId: params.movieId,
      theatreId: params.theatreId,
      seats: params.seats,
      status: 'pending_payment',
      ticketAmount: params.ticketAmount,
      convenienceFee: params.convenienceFee,
      totalAmount: params.totalAmount,
      expiresAtMs,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('Seat ')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.WRITE, `seatReservations/${reservationId}`);
  }
}

export async function releaseSeatHoldTransaction(params: {
  reservationId: string;
  showtimeId: string;
  seats: string[];
  nextStatus: 'cancelled' | 'expired';
}): Promise<void> {
  const showtimeRef = doc(db, 'showtimes', params.showtimeId);
  const reservationRef = doc(db, 'seatReservations', params.reservationId);
  try {
    await runTransaction(db, async (tx) => {
      const stSnap = await tx.get(showtimeRef);
      const resSnap = await tx.get(reservationRef);
      if (stSnap.exists()) {
        const st = stSnap.data() as Showtime;
        const nextHolds = { ...(st.heldSeats ?? {}) };
        for (const s of params.seats) {
          if (nextHolds[s]?.reservationId === params.reservationId) {
            delete nextHolds[s];
          }
        }
        tx.update(showtimeRef, {
          heldSeats: nextHolds,
          updatedAt: serverTimestamp(),
        });
      }
      if (resSnap.exists() && (resSnap.data() as SeatReservation).status === 'pending_payment') {
        tx.update(reservationRef, {
          status: params.nextStatus,
          updatedAt: serverTimestamp(),
        });
      }
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `seatReservations/${params.reservationId}`);
  }
}

export async function confirmBookingTransaction(params: {
  reservationId: string;
  showtimeId: string;
  userId: string;
  userEmail: string;
  userName: string;
  movie: Movie;
  theatre: Theatre;
  showtime: Showtime;
  seats: string[];
  ticketAmount: number;
  convenienceFee: number;
  totalAmount: number;
  paymentId: string;
  bookingCode: string;
  qrReference: string;
}): Promise<Booking> {
  const bookingId = `bk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const showtimeRef = doc(db, 'showtimes', params.showtimeId);
  const reservationRef = doc(db, 'seatReservations', params.reservationId);
  const bookingRef = doc(db, 'bookings', bookingId);
  const nowMs = Date.now();

  try {
    await runTransaction(db, async (tx) => {
      const stSnap = await tx.get(showtimeRef);
      const resSnap = await tx.get(reservationRef);

      if (!stSnap.exists()) {
        throw new Error('Showtime no longer exists.');
      }
      if (!resSnap.exists()) {
        throw new Error('Seat reservation record was not found.');
      }

      const reservation = resSnap.data() as SeatReservation;
      if (reservation.status !== 'pending_payment') {
        throw new Error('This reservation is no longer active.');
      }
      if (reservation.expiresAtMs < nowMs) {
        throw new Error('Your seat reservation expired before confirmation. Please re-select seats.');
      }

      const st = stSnap.data() as Showtime;
      const existingBooked = new Set(st.bookedSeats ?? []);
      for (const seat of params.seats) {
        if (existingBooked.has(seat)) {
          throw new Error(`Seat ${seat} is already booked. Double booking prevented.`);
        }
      }

      const updatedBookedSeats = Array.from(new Set([...(st.bookedSeats ?? []), ...params.seats]));
      const nextHolds: Record<string, HeldSeatInfo> = {};
      for (const [seatCode, info] of Object.entries(st.heldSeats ?? {})) {
        if (info && info.expiresAtMs > nowMs && !params.seats.includes(seatCode)) {
          nextHolds[seatCode] = info;
        }
      }

      const bookingDoc: Booking = {
        id: bookingId,
        bookingCode: params.bookingCode,
        userId: params.userId,
        userEmail: params.userEmail,
        userName: params.userName,
        movieId: params.movie.id,
        movieTitle: params.movie.title,
        posterUrl: params.movie.posterUrl,
        theatreId: params.theatre.id,
        theatreName: params.theatre.name,
        city: params.showtime.city,
        showtimeId: params.showtime.id,
        screenName: params.showtime.screenName,
        showDate: params.showtime.showDate,
        showTime: params.showtime.showTime,
        format: params.showtime.format,
        seats: params.seats,
        ticketAmount: params.ticketAmount,
        convenienceFee: params.convenienceFee,
        totalAmount: params.totalAmount,
        paymentId: params.paymentId,
        paymentStatus: 'paid',
        bookingStatus: 'confirmed',
        reservationId: params.reservationId,
        qrReference: params.qrReference,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      tx.update(showtimeRef, {
        bookedSeats: updatedBookedSeats,
        heldSeats: nextHolds,
        updatedAt: serverTimestamp(),
      });
      tx.update(reservationRef, {
        status: 'confirmed',
        updatedAt: serverTimestamp(),
      });
      tx.set(bookingRef, bookingDoc);
    });

    return {
      id: bookingId,
      bookingCode: params.bookingCode,
      userId: params.userId,
      userEmail: params.userEmail,
      userName: params.userName,
      movieId: params.movie.id,
      movieTitle: params.movie.title,
      posterUrl: params.movie.posterUrl,
      theatreId: params.theatre.id,
      theatreName: params.theatre.name,
      city: params.showtime.city,
      showtimeId: params.showtime.id,
      screenName: params.showtime.screenName,
      showDate: params.showtime.showDate,
      showTime: params.showtime.showTime,
      format: params.showtime.format,
      seats: params.seats,
      ticketAmount: params.ticketAmount,
      convenienceFee: params.convenienceFee,
      totalAmount: params.totalAmount,
      paymentId: params.paymentId,
      paymentStatus: 'paid',
      bookingStatus: 'confirmed',
      reservationId: params.reservationId,
      qrReference: params.qrReference,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('already booked') ||
        error.message.includes('expired') ||
        error.message.includes('no longer'))
    ) {
      throw error;
    }
    handleFirestoreError(error, OperationType.WRITE, `bookings/${bookingId}`);
  }
}

export async function fetchUserBookings(uid: string): Promise<Booking[]> {
  try {
    const q = query(
      collection(db, 'bookings'),
      where('userId', '==', uid),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Booking);
  } catch (error) {
    // Fallback without orderBy if composite index isn't built yet
    try {
      const qSimple = query(collection(db, 'bookings'), where('userId', '==', uid));
      const snap = await getDocs(qSimple);
      return snap.docs.map((d) => d.data() as Booking);
    } catch (innerErr) {
      handleFirestoreError(innerErr, OperationType.LIST, `bookings?userId=${uid}`);
    }
  }
}

export async function fetchAllBookingsAdmin(): Promise<Booking[]> {
  try {
    const snap = await getDocs(collection(db, 'bookings'));
    return snap.docs.map((d) => d.data() as Booking);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'bookings');
  }
}

export async function saveMovieAdmin(movie: Omit<Movie, 'createdAt' | 'updatedAt'>, isNew: boolean): Promise<void> {
  const path = `movies/${movie.id}`;
  try {
    const ref = doc(db, 'movies', movie.id);
    if (isNew) {
      await setDoc(ref, {
        ...movie,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        ...movie,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, isNew ? OperationType.CREATE : OperationType.UPDATE, path);
  }
}

export async function deleteMovieAdmin(movieId: string): Promise<void> {
  const path = `movies/${movieId}`;
  try {
    await deleteDoc(doc(db, 'movies', movieId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveTheatreAdmin(theatre: Omit<Theatre, 'createdAt' | 'updatedAt'>, isNew: boolean): Promise<void> {
  const path = `theatres/${theatre.id}`;
  try {
    const ref = doc(db, 'theatres', theatre.id);
    if (isNew) {
      await setDoc(ref, {
        ...theatre,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        ...theatre,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, isNew ? OperationType.CREATE : OperationType.UPDATE, path);
  }
}

export async function saveShowtimeAdmin(showtime: Omit<Showtime, 'createdAt' | 'updatedAt'>, isNew: boolean): Promise<void> {
  const path = `showtimes/${showtime.id}`;
  try {
    const ref = doc(db, 'showtimes', showtime.id);
    if (isNew) {
      await setDoc(ref, {
        ...showtime,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        ...showtime,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, isNew ? OperationType.CREATE : OperationType.UPDATE, path);
  }
}

export async function deleteShowtimeAdmin(showtimeId: string): Promise<void> {
  const path = `showtimes/${showtimeId}`;
  try {
    await deleteDoc(doc(db, 'showtimes', showtimeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function seedCatalogToFirestore(): Promise<{
  moviesCount: number;
  theatresCount: number;
  showtimesCount: number;
}> {
  if (!auth.currentUser) {
    throw new Error('Sign in as an administrator to seed Cloud Firestore.');
  }

  try {
    // Batch 1: Movies and Theatres first (Showtime rules check exists() on both!)
    const catalogBatch = writeBatch(db);
    for (const movie of SEED_MOVIES) {
      catalogBatch.set(doc(db, 'movies', movie.id), {
        ...movie,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    for (const theatre of SEED_THEATRES) {
      catalogBatch.set(doc(db, 'theatres', theatre.id), {
        ...theatre,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    await catalogBatch.commit();

    // Batch 2: Showtimes in chunks of 400 (Firestore batch limit is 500)
    const showtimes = buildSeedShowtimes();
    for (let i = 0; i < showtimes.length; i += 400) {
      const stBatch = writeBatch(db);
      const chunk = showtimes.slice(i, i + 400);
      for (const st of chunk) {
        stBatch.set(doc(db, 'showtimes', st.id), {
          ...st,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      await stBatch.commit();
    }

    return {
      moviesCount: SEED_MOVIES.length,
      theatresCount: SEED_THEATRES.length,
      showtimesCount: showtimes.length,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'movies+theatres+showtimes');
  }
}
