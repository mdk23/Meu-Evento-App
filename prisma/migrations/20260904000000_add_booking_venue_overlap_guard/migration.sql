-- Database-level guarantee that no two "active" bookings ever occupy the same venue during
-- overlapping time windows. The application already checks this before every create/edit
-- (`assertNoBookingConflict` in src/lib/booking-conflict.ts), but that's a check-then-insert done
-- inside a normal (READ COMMITTED) transaction — two concurrent requests can both pass the check
-- before either commits. This EXCLUDE constraint makes the invariant hold at the database engine
-- level regardless of concurrency: Postgres itself refuses to commit a row that overlaps another
-- on `venueId`, independent of application-level locking.
--
-- `NOT IN ('CANCELLED', 'WAITING_LIST')` mirrors `NON_BLOCKING_STATUSES` exactly — cancelled and
-- waiting-list bookings are allowed to freely overlap, same as the app-level check. The range uses
-- '[)' (half-open, inclusive start / exclusive end) to match `bookingsOverlap`'s semantics, so a
-- booking ending exactly when another starts is NOT a conflict. `tsrange` (not `tstzrange`) because
-- `startAt`/`endAt` are stored as `timestamp` without a time zone (Prisma's plain `DateTime`) —
-- `tstzrange` would need an implicit timestamp→timestamptz cast, which depends on the session's
-- `TimeZone` setting and so isn't IMMUTABLE, which Postgres requires for anything in an index.

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_no_venue_overlap"
  EXCLUDE USING gist (
    "venueId" WITH =,
    tsrange("startAt", "endAt", '[)') WITH &&
  )
  WHERE (status NOT IN ('CANCELLED', 'WAITING_LIST'));
