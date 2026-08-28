-- Denormalize `tenantId` onto the three tenant-owned child models that reach their tenant only via
-- a parent FK today: events, booking_services, booking_packages. Brings them in line with every
-- other tenant-owned table (@@index([tenantId]) + onDelete: Cascade from Tenant) and lets the read
-- repositories filter by tenant directly.
--
-- Pattern per table (precedent: 20260824060000, which did the same for package_items /
-- booking_package_items): add nullable -> backfill from the parent Booking -> SET NOT NULL -> FK +
-- index. Every value derives from `bookings.tenantId`, which is always present, so the backfill is
-- total; an orphan row would make `SET NOT NULL` fail loudly rather than corrupt anything.

-- events -------------------------------------------------------------------------------------------
ALTER TABLE "events" ADD COLUMN "tenantId" TEXT;
UPDATE "events" e SET "tenantId" = b."tenantId" FROM "bookings" b WHERE b."id" = e."bookingId";
ALTER TABLE "events" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "events" ADD CONSTRAINT "events_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "events_tenantId_idx" ON "events"("tenantId");

-- booking_services -------------------------------------------------------------------------------
ALTER TABLE "booking_services" ADD COLUMN "tenantId" TEXT;
UPDATE "booking_services" bs SET "tenantId" = b."tenantId" FROM "bookings" b WHERE b."id" = bs."bookingId";
ALTER TABLE "booking_services" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "booking_services" ADD CONSTRAINT "booking_services_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "booking_services_tenantId_idx" ON "booking_services"("tenantId");

-- booking_packages ------------------------------------------------------------------------------
ALTER TABLE "booking_packages" ADD COLUMN "tenantId" TEXT;
UPDATE "booking_packages" bp SET "tenantId" = b."tenantId" FROM "bookings" b WHERE b."id" = bp."bookingId";
ALTER TABLE "booking_packages" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "booking_packages" ADD CONSTRAINT "booking_packages_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "booking_packages_tenantId_idx" ON "booking_packages"("tenantId");
