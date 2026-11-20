/**
 * CineBook AI - Adversarial Firestore Rules Test Suite ("Dirty Dozen")
 * Designed for verification against the Firebase Rules Unit Testing emulator.
 */

export interface DirtyDozenCase {
  id: number;
  name: string;
  collection: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  expected: 'PERMISSION_DENIED';
  payload: Record<string, unknown>;
}

export const dirtyDozenPayloads: DirtyDozenCase[] = [
  {
    id: 1,
    name: 'Role Escalation on User Profile Create',
    collection: 'users/attacker_uid',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: {
      uid: 'attacker_uid',
      email: 'attacker@example.com',
      displayName: 'Attacker',
      city: 'Mumbai',
      favoriteGenres: ['Action'],
      role: 'admin',
    },
  },
  {
    id: 2,
    name: 'Shadow Ghost Field on User Update',
    collection: 'users/user_1',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    payload: { city: 'Bengaluru', isAdmin: true },
  },
  {
    id: 3,
    name: 'Unverified Admin Email Spoof on Movie Write',
    collection: 'movies/mov_spoof',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: {
      id: 'mov_spoof',
      title: 'Spoofed Film',
      primaryCategory: 'Action',
    },
  },
  {
    id: 4,
    name: 'PII Cross-User Read on Users Collection',
    collection: 'users/victim_uid',
    operation: 'get',
    expected: 'PERMISSION_DENIED',
    payload: {},
  },
  {
    id: 5,
    name: 'Unscoped List Scraping on Bookings',
    collection: 'bookings',
    operation: 'list',
    expected: 'PERMISSION_DENIED',
    payload: {},
  },
  {
    id: 6,
    name: 'Non-Admin Movie Deletion',
    collection: 'movies/mov_1',
    operation: 'delete',
    expected: 'PERMISSION_DENIED',
    payload: {},
  },
  {
    id: 7,
    name: 'Path ID Poisoning on SeatReservation',
    collection: 'seatReservations/invalid$id!with*bad^chars',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: { id: 'invalid$id!with*bad^chars' },
  },
  {
    id: 8,
    name: 'Unpaid Booking Insertion',
    collection: 'bookings/bk_unpaid',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: {
      id: 'bk_unpaid',
      userId: 'user_1',
      paymentStatus: 'failed',
      bookingStatus: 'confirmed',
    },
  },
  {
    id: 9,
    name: 'Orphaned Booking Without Atomic Showtime Seat Update',
    collection: 'bookings/bk_orphan',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: {
      id: 'bk_orphan',
      userId: 'user_1',
      showtimeId: 'st_1',
      seats: ['A1'],
      paymentStatus: 'paid',
      bookingStatus: 'confirmed',
    },
  },
  {
    id: 10,
    name: 'Deleting Already-Booked Seats From Showtime',
    collection: 'showtimes/st_1',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    payload: { bookedSeats: [] },
  },
  {
    id: 11,
    name: 'Re-opening Confirmed Seat Reservation',
    collection: 'seatReservations/res_1',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    payload: { status: 'pending_payment' },
  },
  {
    id: 12,
    name: 'Forged Past Timestamp on Booking Create',
    collection: 'bookings/bk_forged_time',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: {
      id: 'bk_forged_time',
      createdAt: '2020-01-01T00:00:00Z',
    },
  },
];
