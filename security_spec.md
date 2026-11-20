# CineBook AI Security Specification

## 1. Data Invariants
1. **Role Integrity**: Regular users cannot create or escalate themselves to `admin` via `/users/{userId}`. Admin rights derive exclusively from `/admins/{uid}` or verified runtime admin email (`bumanya90@gmail.com` with `email_verified == true`).
2. **PII Isolation**: User profiles (`/users/{userId}`), temporary seat holds (`/seatReservations/{reservationId}`), and bookings (`/bookings/{bookingId}`) are strictly readable and listable only by the owning user (`uid == request.auth.uid`) or an admin.
3. **Catalog Integrity**: Only verified admins may create, update, or delete `/movies/{movieId}` and `/theatres/{theatreId}`, or create/delete `/showtimes/{showtimeId}`.
4. **Atomic Double-Booking Prevention**: A `/bookings/{bookingId}` document can only be created with `paymentStatus == 'paid'` and `bookingStatus == 'confirmed'` when its referenced `showtimeId` and `reservationId` exist and `getAfter(/databases/$(database)/documents/showtimes/$(showtimeId)).data.bookedSeats.hasAll(seats)` holds in the same atomic transaction. Previously booked seats cannot be removed by regular users.
5. **Terminal State Locking**: Once a `seatReservation` transitions out of `pending_payment` (`confirmed`, `cancelled`, `expired`), non-admin users cannot mutate it. Once a `booking` is `cancelled`, non-admin users cannot reactivate it.
6. **Temporal Integrity**: All `createdAt` and `updatedAt` fields must equal `request.time`.

## 2. The "Dirty Dozen" Payloads
1. **Role Escalation on User Create**: `{ "uid": "u1", "email": "u1@example.com", "displayName": "Alice", "city": "Mumbai", "favoriteGenres": ["Action"], "role": "admin", "createdAt": "<time>", "updatedAt": "<time>" }` -> DENIED (`role` must be `'user'`).
2. **Shadow Ghost Field on User Update**: `{ "city": "Delhi", "isAdmin": true, "updatedAt": "<time>" }` -> DENIED (`hasOnly` rejects `isAdmin`).
3. **Spoofed Admin Email Without Verification**: Auth `{ uid: "attacker", token: { email: "bumanya90@gmail.com", email_verified: false } }` writing `/movies/m1` -> DENIED (`email_verified == true` required).
4. **PII Blanket Read on `/users/{otherUid}`**: Authenticated user `u1` calling `get(/users/u2)` -> DENIED.
5. **Cross-User List Scraping on `/bookings`**: Authenticated user `u1` calling `list(/bookings)` without `where('userId', '==', 'u1')` -> DENIED.
6. **Non-Admin Movie Mutation**: Authenticated user `u1` creating or deleting `/movies/m1` -> DENIED.
7. **ID Poisoning on `/movies/{oversizedId}`**: Path ID > 128 chars or containing invalid symbols -> DENIED (`isValidId`).
8. **Unpaid Booking Creation**: `{ ..., "paymentStatus": "pending", "bookingStatus": "confirmed" }` -> DENIED (`paymentStatus` must equal `'paid'`).
9. **Orphaned Booking Creation Without Atomic Seat Lock**: Creating `/bookings/b1` without updating `/showtimes/{showtimeId}.bookedSeats` in the same transaction -> DENIED (`getAfter` check fails).
10. **Removing Booked Seats on Showtime**: Regular user updating `/showtimes/st1` with `bookedSeats` missing an already-booked seat -> DENIED (`hasAll(existing().bookedSeats)` fails).
11. **Reservation State Re-Opening**: Owner updating a `confirmed` reservation back to `pending_payment` -> DENIED (terminal state lock).
12. **Client Timestamp Forgery**: Creating a booking with `createdAt` set to a past timestamp instead of `request.time` -> DENIED.
