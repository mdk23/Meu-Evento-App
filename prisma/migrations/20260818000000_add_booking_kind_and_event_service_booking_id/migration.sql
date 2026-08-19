-- Phase 1 of the Space/Event dual-workspace rearchitecture.
-- Both changes are additive and fully backfillable with zero data loss:
--   1. Booking.kind: every existing booking has an Event today, so DEFAULT 'EVENT' backfills
--      100% of existing rows correctly with no ambiguity.
--   2. EventService.bookingId: backfilled from event.bookingId via the existing eventId FK,
--      which resolves for every existing row (EventService.eventId has always been required).
-- EventService.eventId is left untouched (still required, still cascades) — this migration does
-- not change any read/write behavior, it only adds the structural foundation for later phases.

CREATE TYPE "BookingKind" AS ENUM ('SPACE', 'EVENT');
ALTER TABLE "bookings" ADD COLUMN "kind" "BookingKind" NOT NULL DEFAULT 'EVENT';
CREATE INDEX "bookings_kind_idx" ON "bookings"("kind");

ALTER TABLE "event_services" ADD COLUMN "bookingId" TEXT;
UPDATE "event_services" es SET "bookingId" = e."bookingId" FROM "events" e WHERE es."eventId" = e.id;
ALTER TABLE "event_services" ALTER COLUMN "bookingId" SET NOT NULL;
CREATE INDEX "event_services_bookingId_idx" ON "event_services"("bookingId");
ALTER TABLE "event_services" ADD CONSTRAINT "event_services_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
