-- Phase 7: constraints, indexes, and tenantId-on-every-tenant-scoped-model cleanup — applied last,
-- once the data underneath is already clean from Phases 1-6.

-- 1. Booking: composite index for "bookings in this workspace, ordered/filtered by start time"
--    queries (the booking-scoped Resources tab and calendar views both do this).
CREATE INDEX "bookings_context_startAt_idx" ON "bookings"("context", "startAt");

-- 2. ServiceInventoryRequirement: a catalog service should never carry two requirement rows for
--    the exact same specific inventory item (category-based rows, with inventoryItemId null, are
--    unaffected — Postgres treats each NULL as distinct, so they never collide on this constraint).
--    Verified against live data first: zero duplicate (serviceId, inventoryItemId) pairs exist.
--    The old standalone serviceId index is dropped as redundant — the new unique index already
--    serves lookups on its leftmost column.
DROP INDEX "service_inventory_requirements_serviceId_idx";
ALTER TABLE "service_inventory_requirements"
  ADD CONSTRAINT "service_inventory_requirements_serviceId_inventoryItemId_key" UNIQUE ("serviceId", "inventoryItemId");

-- 3. PackageItem gains tenantId directly (every tenant-scoped model should carry it rather than
--    requiring a join through Package to check ownership). Backfilled from the parent Package's own
--    tenantId — 4 live rows, all with a real parent package.
ALTER TABLE "package_items" ADD COLUMN "tenantId" TEXT;
UPDATE "package_items" pi
SET "tenantId" = p."tenantId"
FROM "packages" p
WHERE p.id = pi."packageId";
ALTER TABLE "package_items" ALTER COLUMN "tenantId" SET NOT NULL;
CREATE INDEX "package_items_tenantId_idx" ON "package_items"("tenantId");

-- 4. BookingPackageItem gains tenantId directly, same reasoning. Table is empty in every
--    environment so far (no package has been applied to a real booking yet), so no backfill needed.
ALTER TABLE "booking_package_items" ADD COLUMN "tenantId" TEXT NOT NULL;
CREATE INDEX "booking_package_items_tenantId_idx" ON "booking_package_items"("tenantId");
