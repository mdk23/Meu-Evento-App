-- Rename the "Space" concept to "Venue" everywhere in the physical schema.
-- Every statement is a pure rename: no data is moved, dropped, or rewritten.

-- 1. Enum value renames. `ALTER TYPE ... RENAME VALUE` keeps existing rows valid
--    (the value's OID is unchanged) and cascades to column defaults automatically.
ALTER TYPE "BookingContext" RENAME VALUE 'SPACE' TO 'VENUE';
ALTER TYPE "PackageContext" RENAME VALUE 'SPACE' TO 'VENUE';
ALTER TYPE "ServiceContext" RENAME VALUE 'SPACE' TO 'VENUE';
ALTER TYPE "BookingType" RENAME VALUE 'SPACE_ONLY' TO 'VENUE_ONLY';
ALTER TYPE "BookingType" RENAME VALUE 'SPACE_AND_SERVICES' TO 'VENUE_AND_SERVICES';

-- Re-assert the default so its stored text form matches the new label immediately.
ALTER TABLE "bookings" ALTER COLUMN "bookingType" SET DEFAULT 'VENUE_AND_SERVICES';

-- 2. Table "spaces" -> "venues" (plus its owned index/constraint objects).
ALTER TABLE "spaces" RENAME TO "venues";
ALTER INDEX "spaces_pkey" RENAME TO "venues_pkey";
ALTER INDEX "spaces_tenantId_key" RENAME TO "venues_tenantId_key";
ALTER TABLE "venues" RENAME CONSTRAINT "spaces_tenantId_fkey" TO "venues_tenantId_fkey";

-- 3. Column "bookings"."spaceId" -> "venueId" (plus its FK and index).
ALTER TABLE "bookings" RENAME COLUMN "spaceId" TO "venueId";
ALTER TABLE "bookings" RENAME CONSTRAINT "bookings_spaceId_fkey" TO "bookings_venueId_fkey";
ALTER INDEX "bookings_spaceId_idx" RENAME TO "bookings_venueId_idx";
