-- Every existing booking has been backfilled with spaceId/startAt/endAt (verified: 0 rows with
-- nulls remaining), so these can now become required, matching the spec's "Booking requires:
-- spaceId, startAt, endAt".

-- AlterTable
ALTER TABLE "bookings" ALTER COLUMN "spaceId" SET NOT NULL;
ALTER TABLE "bookings" ALTER COLUMN "startAt" SET NOT NULL;
ALTER TABLE "bookings" ALTER COLUMN "endAt" SET NOT NULL;
