-- Phase 12d of the Space/Event architecture alignment: a frozen snapshot layer for package
-- applications, so a later catalog price/name change on a Package can never retroactively alter what
-- a past booking was actually sold. Purely additive — two new tables plus one new nullable FK column
-- on the existing booking_services table. No backfill: past package applications (before this phase)
-- have no recoverable trace of which package produced them, so their BookingService lines simply stay
-- source = DIRECT / bookingPackageId = NULL, which is the correct honest representation.

CREATE TABLE "booking_packages" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "nameSnapshot" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_packages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "booking_package_items" (
    "id" TEXT NOT NULL,
    "bookingPackageId" TEXT NOT NULL,
    "serviceId" TEXT,
    "serviceName" TEXT NOT NULL,
    "quantity" DECIMAL(12,2) NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "totalPrice" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_package_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "booking_packages_bookingId_idx" ON "booking_packages"("bookingId");
CREATE INDEX "booking_packages_packageId_idx" ON "booking_packages"("packageId");

CREATE INDEX "booking_package_items_bookingPackageId_idx" ON "booking_package_items"("bookingPackageId");

ALTER TABLE "booking_packages" ADD CONSTRAINT "booking_packages_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "booking_packages" ADD CONSTRAINT "booking_packages_packageId_fkey"
  FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "booking_package_items" ADD CONSTRAINT "booking_package_items_bookingPackageId_fkey"
  FOREIGN KEY ("bookingPackageId") REFERENCES "booking_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "booking_package_items" ADD CONSTRAINT "booking_package_items_serviceId_fkey"
  FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "booking_services" ADD COLUMN "bookingPackageId" TEXT;
CREATE INDEX "booking_services_bookingPackageId_idx" ON "booking_services"("bookingPackageId");
ALTER TABLE "booking_services" ADD CONSTRAINT "booking_services_bookingPackageId_fkey"
  FOREIGN KEY ("bookingPackageId") REFERENCES "booking_packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
