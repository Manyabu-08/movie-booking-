import { useCallback, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { AuthModal } from './components/AuthModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { auth, testConnection } from './lib/firebase';
import { friendlyErrorMessage } from './lib/firestoreError';
import {
  checkIsAdmin,
  ensureUserProfile,
  fetchMovies,
  fetchShowtimes,
  fetchTheatres,
  fetchUserBookings,
  seedCatalogToFirestore,
  updateUserProfile,
} from './lib/firestoreService';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AiFinderPage } from './pages/AiFinderPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { HomePage } from './pages/HomePage';
import { MovieDetailsPage } from './pages/MovieDetailsPage';
import { MoviesPage } from './pages/MoviesPage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { PaymentPage } from './pages/PaymentPage';
import { ProfilePage } from './pages/ProfilePage';
import { SeatSelectionPage } from './pages/SeatSelectionPage';
import { TicketPage } from './pages/TicketPage';
import type {
  AppPage,
  Booking,
  Movie,
  MovieCategory,
  SeatReservation,
  Showtime,
  Theatre,
  UserProfile,
} from './types';

function MainApp() {
  const [page, setPage] = useState<AppPage>('home');
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const [movies, setMovies] = useState<Movie[]>([]);
  const [theatres, setTheatres] = useState<Theatre[]>([]);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const [selectedCity, setSelectedCity] = useState<string>('Mumbai');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MovieCategory | null>(null);

  // Booking Flow State
  const [activeMovie, setActiveMovie] = useState<Movie | null>(null);
  const [activeTheatre, setActiveTheatre] = useState<Theatre | null>(null);
  const [activeShowtime, setActiveShowtime] = useState<Showtime | null>(null);
  const [activeReservation, setActiveReservation] = useState<SeatReservation | null>(null);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadCatalog = useCallback(async () => {
    setLoadingCatalog(true);
    try {
      const [mList, tList, sList] = await Promise.all([
        fetchMovies(),
        fetchTheatres(),
        fetchShowtimes(),
      ]);
      setMovies(mList);
      setTheatres(tList);
      setShowtimes(sList);
      return mList;
    } catch (err) {
      setToast({ type: 'error', text: friendlyErrorMessage(err) });
      return [];
    } finally {
      setLoadingCatalog(false);
    }
  }, []);

  const loadUserContext = useCallback(
    async (firebaseUser: User | null) => {
      if (!firebaseUser) {
        setProfile(null);
        setIsAdmin(false);
        setBookings([]);
        return;
      }

      const [adminFlag, userProf] = await Promise.all([
        checkIsAdmin(firebaseUser),
        ensureUserProfile(firebaseUser, selectedCity).catch(() => null),
      ]);
      setIsAdmin(adminFlag);
      setProfile(userProf);
      if (userProf?.city) {
        setSelectedCity(userProf.city);
      }

      setLoadingBookings(true);
      try {
        const bks = await fetchUserBookings(firebaseUser.uid);
        setBookings(bks);
      } catch {
        // Ignore if bookings query needs index or permissions
      } finally {
        setLoadingBookings(false);
      }
    },
    [selectedCity]
  );

  useEffect(() => {
    testConnection();
    loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
      await loadUserContext(firebaseUser);
    });
    return () => unsub();
  }, [loadUserContext]);

  const handleSeedCatalog = useCallback(async () => {
    setSeeding(true);
    try {
      const result = await seedCatalogToFirestore();
      await loadCatalog();
      setToast({
        type: 'success',
        text: `Seeded ${result.moviesCount} movies, ${result.theatresCount} theatres, and ${result.showtimesCount} showtimes into Cloud Firestore.`,
      });
    } catch (err) {
      setToast({ type: 'error', text: friendlyErrorMessage(err) });
    } finally {
      setSeeding(false);
    }
  }, [loadCatalog]);

  // Auto-seed once when verified admin signs in and Firestore catalog is empty
  useEffect(() => {
    if (authReady && isAdmin && !loadingCatalog && movies.length === 0 && !seeding) {
      handleSeedCatalog();
    }
  }, [authReady, isAdmin, loadingCatalog, movies.length, seeding, handleSeedCatalog]);

  function navigateTo(nextPage: AppPage) {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleSelectMovie(movie: Movie) {
    setActiveMovie(movie);
    navigateTo('movie-details');
  }

  function handleSelectCategory(cat: MovieCategory) {
    setSelectedCategory(cat);
    navigateTo('categories');
  }

  function handleSelectShowtime(showtime: Showtime, theatre: Theatre) {
    setActiveShowtime(showtime);
    setActiveTheatre(theatre);
    navigateTo('seat-selection');
  }

  function handleReservationCreated(reservation: SeatReservation, latestShowtime: Showtime) {
    setActiveReservation(reservation);
    setActiveShowtime(latestShowtime);
    navigateTo('payment');
  }

  async function handleBookingConfirmed(booking: Booking) {
    setActiveBooking(booking);
    setActiveReservation(null);
    setBookings((prev) => [booking, ...prev]);
    await loadCatalog();
    setToast({
      type: 'success',
      text: `Booking ${booking.bookingCode} confirmed and saved to Cloud Firestore.`,
    });
    navigateTo('ticket');
  }

  async function handleLogout() {
    await signOut(auth);
    setToast({ type: 'success', text: 'Signed out cleanly.' });
    if (page === 'admin' || page === 'payment') {
      navigateTo('home');
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0D] text-[#F5F5F7]">
      <Navbar
        currentPage={page}
        onNavigate={navigateTo}
        user={user}
        profile={profile}
        isAdmin={isAdmin}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {toast && (
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 pt-4">
          <div
            className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-xs sm:text-sm ${
              toast.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{toast.text}</span>
            </div>
            <button
              onClick={() => setToast(null)}
              className="p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <main className="flex-1">
        {page === 'home' && (
          <HomePage
            movies={movies}
            loading={loadingCatalog}
            selectedCity={selectedCity}
            onChangeCity={setSelectedCity}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSelectMovie={handleSelectMovie}
            onSelectCategory={handleSelectCategory}
            onNavigate={navigateTo}
            profile={profile}
            isAdmin={isAdmin}
            seeding={seeding}
            onSeedCatalog={handleSeedCatalog}
            onOpenAuth={() => setAuthModalOpen(true)}
          />
        )}

        {page === 'movies' && (
          <MoviesPage
            movies={movies}
            loading={loadingCatalog}
            selectedCity={selectedCity}
            onChangeCity={setSelectedCity}
            onSelectMovie={handleSelectMovie}
          />
        )}

        {page === 'categories' && (
          <CategoriesPage
            movies={movies}
            initialCategory={selectedCategory}
            selectedCity={selectedCity}
            onChangeCity={setSelectedCity}
            onSelectMovie={handleSelectMovie}
          />
        )}

        {page === 'ai-finder' && (
          <AiFinderPage
            movies={movies}
            selectedCity={selectedCity}
            profile={profile}
            bookings={bookings}
            onSelectMovie={handleSelectMovie}
            onUpdateConsent={async (consent) => {
              if (user && user.emailVerified) {
                await updateUserProfile(user.uid, { aiPersonalizationConsent: consent });
                await loadUserContext(user);
              }
            }}
          />
        )}

        {page === 'movie-details' && activeMovie && (
          <MovieDetailsPage
            movie={activeMovie}
            theatres={theatres}
            showtimes={showtimes}
            selectedCity={selectedCity}
            onChangeCity={setSelectedCity}
            onBack={() => navigateTo('movies')}
            onSelectShowtime={handleSelectShowtime}
          />
        )}

        {page === 'seat-selection' && activeMovie && activeTheatre && activeShowtime && (
          <SeatSelectionPage
            movie={activeMovie}
            theatre={activeTheatre}
            initialShowtime={activeShowtime}
            user={user}
            onBack={() => navigateTo('movie-details')}
            onRequireAuth={() => setAuthModalOpen(true)}
            onReservationCreated={handleReservationCreated}
          />
        )}

        {page === 'payment' &&
          user &&
          activeReservation &&
          activeMovie &&
          activeTheatre &&
          activeShowtime && (
            <PaymentPage
              reservation={activeReservation}
              movie={activeMovie}
              theatre={activeTheatre}
              showtime={activeShowtime}
              user={user}
              profile={profile}
              onCancelReservation={() => {
                setActiveReservation(null);
                navigateTo('seat-selection');
              }}
              onBookingConfirmed={handleBookingConfirmed}
            />
          )}

        {page === 'ticket' && activeBooking && (
          <TicketPage
            booking={activeBooking}
            onViewBookings={() => navigateTo('my-bookings')}
            onBackHome={() => navigateTo('home')}
          />
        )}

        {page === 'my-bookings' && (
          <MyBookingsPage
            user={user}
            bookings={bookings}
            loading={loadingBookings}
            onOpenAuth={() => setAuthModalOpen(true)}
            onSelectBooking={(bk) => {
              setActiveBooking(bk);
              navigateTo('ticket');
            }}
            onBrowseMovies={() => navigateTo('movies')}
          />
        )}

        {page === 'profile' && (
          <ProfilePage
            user={user}
            profile={profile}
            onOpenAuth={() => setAuthModalOpen(true)}
            onProfileUpdated={() => loadUserContext(user)}
          />
        )}

        {page === 'admin' && (
          <AdminDashboardPage
            isAdmin={isAdmin}
            movies={movies}
            theatres={theatres}
            showtimes={showtimes}
            seeding={seeding}
            onSeedCatalog={handleSeedCatalog}
            onRefreshCatalog={async () => {
              await loadCatalog();
            }}
          />
        )}
      </main>

      <Footer onNavigate={navigateTo} selectedCity={selectedCity} />

      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => loadUserContext(auth.currentUser)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}
