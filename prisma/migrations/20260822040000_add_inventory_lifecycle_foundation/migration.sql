-- Phase 13: Inventory Lifecycle Schema Foundation
-- Purely additive except two data-bearing restructures (quantity rename, category string -> FK),
-- both handled with explicit backfill. Zero data loss. Live-verified before writing: 1 tenant,
-- 4 inventory items, 2 reservations, 3 distinct categories (Audio Visual, Furniture, Kitchen).

-- 1. New enums
CREATE TYPE "QuantityType" AS ENUM ('FIXED', 'PER_GUEST', 'PER_UNIT');
CREATE TYPE "ReservationStatus" AS ENUM ('HELD', 'CONFIRMED', 'RELEASED', 'CONSUMED', 'RETURNED', 'CANCELLED');
CREATE TYPE "InventoryTransactionType" AS ENUM
  ('PURCHASE', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'RESERVE', 'RELEASE', 'ALLOCATE', 'USE', 'RETURN', 'DAMAGE', 'LOSS');

-- 2. InventoryCategory table + backfill from existing inventory_items.category strings
CREATE TABLE "inventory_categories" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "inventory_categories_tenantId_name_key" ON "inventory_categories"("tenantId", "name");
CREATE INDEX "inventory_categories_tenantId_idx" ON "inventory_categories"("tenantId");

ALTER TABLE "inventory_categories" ADD CONSTRAINT "inventory_categories_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "inventory_categories" ("id", "tenantId", "name", "createdAt", "updatedAt")
  SELECT gen_random_uuid()::text, "tenantId", "category", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  FROM "inventory_items"
  GROUP BY "tenantId", "category";

-- 3. inventory_items: category string -> categoryId FK
ALTER TABLE "inventory_items" ADD COLUMN "categoryId" TEXT;

UPDATE "inventory_items" i SET "categoryId" = c."id"
  FROM "inventory_categories" c
  WHERE c."tenantId" = i."tenantId" AND c."name" = i."category";

ALTER TABLE "inventory_items" ALTER COLUMN "categoryId" SET NOT NULL;
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "inventory_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "inventory_items_categoryId_idx" ON "inventory_items"("categoryId");
ALTER TABLE "inventory_items" DROP COLUMN "category";

-- 4. inventory_items: quantity -> totalQuantity rename + new columns
ALTER TABLE "inventory_items" RENAME COLUMN "quantity" TO "totalQuantity";
ALTER TABLE "inventory_items" ADD COLUMN "sku" TEXT;
ALTER TABLE "inventory_items" ADD COLUMN "unit" TEXT NOT NULL DEFAULT 'unit';
ALTER TABLE "inventory_items" ADD COLUMN "description" TEXT;
ALTER TABLE "inventory_items" ADD COLUMN "color" TEXT;
ALTER TABLE "inventory_items" ADD COLUMN "material" TEXT;
ALTER TABLE "inventory_items" ADD COLUMN "model" TEXT;
ALTER TABLE "inventory_items" ADD COLUMN "size" TEXT;
ALTER TABLE "inventory_items" ADD COLUMN "shape" TEXT;
ALTER TABLE "inventory_items" ADD COLUMN "attributes" JSONB;

-- 5. inventory_reservations: Int -> Decimal quantity, add status + (nullable, FK added later) requirement link
ALTER TABLE "inventory_reservations" ALTER COLUMN "quantity" TYPE DECIMAL(12,2) USING "quantity"::DECIMAL(12,2);
ALTER TABLE "inventory_reservations" ADD COLUMN "status" "ReservationStatus" NOT NULL DEFAULT 'HELD';
ALTER TABLE "inventory_reservations" ADD COLUMN "bookingServiceResourceRequirementId" TEXT;
CREATE INDEX "inventory_reservations_status_idx" ON "inventory_reservations"("status");
CREATE INDEX "inventory_reservations_bookingServiceResourceRequirementId_idx" ON "inventory_reservations"("bookingServiceResourceRequirementId");

-- 6. ServiceInventoryRequirement (catalog template)
CREATE TABLE "service_inventory_requirements" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "inventoryItemId" TEXT,
    "categoryId" TEXT,
    "quantity" DECIMAL(12,2) NOT NULL,
    "quantityType" "QuantityType" NOT NULL DEFAULT 'FIXED',
    "optional" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_inventory_requirements_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "service_inventory_requirements_target_check"
      CHECK ("inventoryItemId" IS NOT NULL OR "categoryId" IS NOT NULL)
);

CREATE INDEX "service_inventory_requirements_serviceId_idx" ON "service_inventory_requirements"("serviceId");
CREATE INDEX "service_inventory_requirements_inventoryItemId_idx" ON "service_inventory_requirements"("inventoryItemId");
CREATE INDEX "service_inventory_requirements_categoryId_idx" ON "service_inventory_requirements"("categoryId");

ALTER TABLE "service_inventory_requirements" ADD CONSTRAINT "service_inventory_requirements_serviceId_fkey"
  FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "service_inventory_requirements" ADD CONSTRAINT "service_inventory_requirements_inventoryItemId_fkey"
  FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "service_inventory_requirements" ADD CONSTRAINT "service_inventory_requirements_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "inventory_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 7. BookingServiceResourceRequirement (per-booking snapshot/override)
CREATE TABLE "booking_service_resource_requirements" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "bookingServiceId" TEXT NOT NULL,
    "inventoryItemId" TEXT,
    "itemNameSnapshot" TEXT,
    "requiredQuantity" DECIMAL(12,2) NOT NULL,
    "providedQuantity" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "quantityType" "QuantityType" NOT NULL DEFAULT 'FIXED',
    "sourceRequirementId" TEXT,
    "reuseReservationId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_service_resource_requirements_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "booking_service_resource_requirements_bookingId_idx" ON "booking_service_resource_requirements"("bookingId");
CREATE INDEX "booking_service_resource_requirements_bookingServiceId_idx" ON "booking_service_resource_requirements"("bookingServiceId");
CREATE INDEX "booking_service_resource_requirements_inventoryItemId_idx" ON "booking_service_resource_requirements"("inventoryItemId");
CREATE INDEX "booking_service_resource_requirements_sourceRequirementId_idx" ON "booking_service_resource_requirements"("sourceRequirementId");
CREATE INDEX "booking_service_resource_requirements_reuseReservationId_idx" ON "booking_service_resource_requirements"("reuseReservationId");

ALTER TABLE "booking_service_resource_requirements" ADD CONSTRAINT "booking_service_resource_requirements_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "booking_service_resource_requirements" ADD CONSTRAINT "booking_service_resource_requirements_bookingServiceId_fkey"
  FOREIGN KEY ("bookingServiceId") REFERENCES "booking_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "booking_service_resource_requirements" ADD CONSTRAINT "booking_service_resource_requirements_inventoryItemId_fkey"
  FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "booking_service_resource_requirements" ADD CONSTRAINT "booking_service_resource_requirements_sourceRequirementId_fkey"
  FOREIGN KEY ("sourceRequirementId") REFERENCES "service_inventory_requirements"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "booking_service_resource_requirements" ADD CONSTRAINT "booking_service_resource_requirements_reuseReservationId_fkey"
  FOREIGN KEY ("reuseReservationId") REFERENCES "inventory_reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 8. Close the loop: inventory_reservations -> booking_service_resource_requirements FK
ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_bookingServiceResourceRequirementId_fkey"
  FOREIGN KEY ("bookingServiceResourceRequirementId") REFERENCES "booking_service_resource_requirements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 9. InventoryTransaction (movement ledger)
CREATE TABLE "inventory_transactions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "eventId" TEXT,
    "bookingServiceId" TEXT,
    "reservationId" TEXT,
    "type" "InventoryTransactionType" NOT NULL,
    "quantity" DECIMAL(12,2) NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_transactions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "inventory_transactions_tenantId_idx" ON "inventory_transactions"("tenantId");
CREATE INDEX "inventory_transactions_inventoryItemId_idx" ON "inventory_transactions"("inventoryItemId");
CREATE INDEX "inventory_transactions_eventId_idx" ON "inventory_transactions"("eventId");
CREATE INDEX "inventory_transactions_bookingServiceId_idx" ON "inventory_transactions"("bookingServiceId");
CREATE INDEX "inventory_transactions_reservationId_idx" ON "inventory_transactions"("reservationId");

ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_inventoryItemId_fkey"
  FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_bookingServiceId_fkey"
  FOREIGN KEY ("bookingServiceId") REFERENCES "booking_services"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_reservationId_fkey"
  FOREIGN KEY ("reservationId") REFERENCES "inventory_reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
