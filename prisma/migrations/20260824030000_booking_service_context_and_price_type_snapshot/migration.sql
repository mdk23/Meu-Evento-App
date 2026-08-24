-- Phase 3: BookingService gains a full commercial snapshot — `context` (resolved per-line
-- workspace, independent of the parent Booking's own context) and `priceType` (a snapshot of the
-- catalog Service's price type at the moment the line was sold).

-- 1. Add both columns nullable first so existing rows can be backfilled before the NOT NULL is
--    enforced.
ALTER TABLE "booking_services" ADD COLUMN "context" "ServiceContext";
ALTER TABLE "booking_services" ADD COLUMN "priceType" "PriceType";

-- 2. Backfill `context` from the parent booking's own context (BookingContext's SPACE/EVENT members
--    line up 1:1 with ServiceContext's) — every pre-existing line was added from whichever workspace
--    its booking was in, since per-line context tracking didn't exist yet.
UPDATE "booking_services" bs
SET "context" = b."context"::text::"ServiceContext"
FROM "bookings" b
WHERE b.id = bs."bookingId";

-- 3. Backfill `priceType` from the current catalog Service's priceType — the closest available
--    approximation of what it was at sale time, since no snapshot existed before this column did.
UPDATE "booking_services" bs
SET "priceType" = s."priceType"
FROM "services" s
WHERE s.id = bs."serviceId";

-- 4. Now that every row has a value, enforce NOT NULL. No DB-level default on either column — both
--    are point-in-time snapshots that every future write must set explicitly, not values that make
--    sense to default silently.
ALTER TABLE "booking_services" ALTER COLUMN "context" SET NOT NULL;
ALTER TABLE "booking_services" ALTER COLUMN "priceType" SET NOT NULL;
