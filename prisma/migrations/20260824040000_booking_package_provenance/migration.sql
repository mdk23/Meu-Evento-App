-- Phase 4: BookingPackage gains a context + price snapshot of the source Package at the moment it
-- was applied, and BookingPackageItem gains a back-link to the exact BookingService it exploded
-- into. Both tables are empty in every environment so far (no package has been applied to a real
-- booking yet), so these are added directly with no backfill needed.

ALTER TABLE "booking_packages" ADD COLUMN "context" "PackageContext" NOT NULL;
ALTER TABLE "booking_packages" ADD COLUMN "price" DECIMAL(12, 2);

ALTER TABLE "booking_package_items" ADD COLUMN "bookingServiceId" TEXT;
ALTER TABLE "booking_package_items"
  ADD CONSTRAINT "booking_package_items_bookingServiceId_fkey"
  FOREIGN KEY ("bookingServiceId") REFERENCES "booking_services"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "booking_package_items_bookingServiceId_idx" ON "booking_package_items"("bookingServiceId");
