-- Phase 5: unify BookingServiceResourceRequirement + InventoryReservation into one
-- BookingServiceResource model — required/reserved/used quantities and lifecycle status all on the
-- same row, reachable from any booking regardless of whether it has an Event (no eventId anywhere
-- on the new table).

-- 1. New lifecycle enum. Old ReservationStatus's HELD/CONFIRMED collapse into RESERVED (no live
--    reservation rows exist to lose the distinction on — see step 6), CONSUMED becomes IN_USE, and
--    CANCELLED folds into RELEASED as the same "no longer holds stock" terminal outcome.
CREATE TYPE "ResourceAllocationStatus" AS ENUM ('PLANNED', 'RESERVED', 'IN_USE', 'RETURNED', 'RELEASED');

-- 2. The unified table.
CREATE TABLE "booking_service_resources" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "bookingServiceId" TEXT NOT NULL,
    "inventoryItemId" TEXT,
    "itemNameSnapshot" TEXT,
    "requiredQuantity" DECIMAL(12,2) NOT NULL,
    "reservedQuantity" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "usedQuantity" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "quantityType" "QuantityType" NOT NULL DEFAULT 'FIXED',
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "status" "ResourceAllocationStatus" NOT NULL DEFAULT 'PLANNED',
    "sourceRequirementId" TEXT,
    "reusedFromResourceId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_service_resources_pkey" PRIMARY KEY ("id")
);

-- 3. Backfill every existing BookingServiceResourceRequirement row (8 live rows, none of which have
--    ever actually been reserved — providedQuantity is 0 on all of them) into the unified shape.
--    reservedQuantity = old providedQuantity (both mean "how much of required is actually covered,
--    whether via a direct reservation or a reuse claim"); status RESERVED when that's > 0, else
--    PLANNED. startAt/endAt default to the parent booking's own span, since a requirement row never
--    carried its own time window before now. reusedFromResourceId is left null for every row here —
--    live data confirms every reuseReservationId is already null (inventory_reservations has zero
--    rows in every environment so far), so there is nothing valid to remap it to.
INSERT INTO "booking_service_resources" (
    "id", "tenantId", "bookingId", "bookingServiceId", "inventoryItemId", "itemNameSnapshot",
    "requiredQuantity", "reservedQuantity", "usedQuantity", "quantityType", "startAt", "endAt",
    "status", "sourceRequirementId", "reusedFromResourceId", "notes", "createdAt", "updatedAt"
)
SELECT
    r."id", r."tenantId", r."bookingId", r."bookingServiceId", r."inventoryItemId", r."itemNameSnapshot",
    r."requiredQuantity", r."providedQuantity", 0, r."quantityType", b."startAt", b."endAt",
    CASE WHEN r."providedQuantity" > 0 THEN 'RESERVED' ELSE 'PLANNED' END::"ResourceAllocationStatus",
    r."sourceRequirementId", NULL, r."notes", r."createdAt", r."updatedAt"
FROM "booking_service_resource_requirements" r
JOIN "bookings" b ON b."id" = r."bookingId";

-- 4. Repoint the transaction ledger at the unified table. Both live transaction rows already have a
--    null reservationId (they predate the requirement/reservation link entirely), so this is a pure
--    rename with no value remapping needed.
ALTER TABLE "inventory_transactions" DROP CONSTRAINT IF EXISTS "inventory_transactions_reservationId_fkey";
ALTER TABLE "inventory_transactions" RENAME COLUMN "reservationId" TO "bookingServiceResourceId";
ALTER INDEX IF EXISTS "inventory_transactions_reservationId_idx" RENAME TO "inventory_transactions_bookingServiceResourceId_idx";

-- 5. Drop the two old tables (inventory_reservations has zero rows in every environment; the
--    requirement rows were already carried forward in step 3) and the enum they depended on. The
--    two tables have FKs pointing at each other (reuseReservationId / bookingServiceResourceRequirementId)
--    so the one pointing at inventory_reservations has to go before it can be dropped.
ALTER TABLE "booking_service_resource_requirements" DROP CONSTRAINT "booking_service_resource_requirements_reuseReservationId_fkey";
DROP TABLE "inventory_reservations";
DROP TABLE "booking_service_resource_requirements";
DROP TYPE "ReservationStatus";

-- 6. Constraints and indexes on the new table.
ALTER TABLE "booking_service_resources"
    ADD CONSTRAINT "booking_service_resources_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "booking_service_resources_bookingServiceId_fkey" FOREIGN KEY ("bookingServiceId") REFERENCES "booking_services"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "booking_service_resources_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "booking_service_resources_sourceRequirementId_fkey" FOREIGN KEY ("sourceRequirementId") REFERENCES "service_inventory_requirements"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT "booking_service_resources_reusedFromResourceId_fkey" FOREIGN KEY ("reusedFromResourceId") REFERENCES "booking_service_resources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "booking_service_resources_tenantId_idx" ON "booking_service_resources"("tenantId");
CREATE INDEX "booking_service_resources_bookingId_idx" ON "booking_service_resources"("bookingId");
CREATE INDEX "booking_service_resources_bookingServiceId_idx" ON "booking_service_resources"("bookingServiceId");
CREATE INDEX "booking_service_resources_inventoryItemId_idx" ON "booking_service_resources"("inventoryItemId");
CREATE INDEX "booking_service_resources_sourceRequirementId_idx" ON "booking_service_resources"("sourceRequirementId");
CREATE INDEX "booking_service_resources_reusedFromResourceId_idx" ON "booking_service_resources"("reusedFromResourceId");
CREATE INDEX "booking_service_resources_status_idx" ON "booking_service_resources"("status");
CREATE INDEX "booking_service_resources_inventoryItemId_startAt_endAt_idx" ON "booking_service_resources"("inventoryItemId", "startAt", "endAt");

-- 7. FK from the ledger to the unified table.
ALTER TABLE "inventory_transactions"
    ADD CONSTRAINT "inventory_transactions_bookingServiceResourceId_fkey" FOREIGN KEY ("bookingServiceResourceId") REFERENCES "booking_service_resources"("id") ON DELETE SET NULL ON UPDATE CASCADE;
