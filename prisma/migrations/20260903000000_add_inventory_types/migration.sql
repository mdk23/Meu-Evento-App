-- Category → Type → Item refactor, phase 1 (additive only — no drops, no NOT NULL).
-- Adds `InventoryType` between category and item, plus nullable `inventoryTypeId` on items and on
-- service requirements (+ `matchCriteria` for the type-based "Mode B" requirement). The backfill and
-- SET NOT NULL happen in the next migration; the legacy columns are dropped in the final one.

-- CreateEnum
CREATE TYPE "InventoryTrackingMode" AS ENUM ('QUANTITY');

-- CreateTable
CREATE TABLE "inventory_types" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "attributeDefs" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_types_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "inventory_types_tenantId_categoryId_idx" ON "inventory_types"("tenantId", "categoryId");
CREATE INDEX "inventory_types_tenantId_active_idx" ON "inventory_types"("tenantId", "active");
CREATE UNIQUE INDEX "inventory_types_tenantId_code_key" ON "inventory_types"("tenantId", "code");
CREATE UNIQUE INDEX "inventory_types_categoryId_name_key" ON "inventory_types"("categoryId", "name");
ALTER TABLE "inventory_types" ADD CONSTRAINT "inventory_types_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_types" ADD CONSTRAINT "inventory_types_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "inventory_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable: inventory_items
ALTER TABLE "inventory_items"
  ADD COLUMN "inventoryTypeId" TEXT,
  ADD COLUMN "trackingMode" "InventoryTrackingMode" NOT NULL DEFAULT 'QUANTITY';
CREATE INDEX "inventory_items_tenantId_inventoryTypeId_idx" ON "inventory_items"("tenantId", "inventoryTypeId");
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_inventoryTypeId_fkey"
  FOREIGN KEY ("inventoryTypeId") REFERENCES "inventory_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable: service_inventory_requirements
ALTER TABLE "service_inventory_requirements"
  ADD COLUMN "inventoryTypeId" TEXT,
  ADD COLUMN "matchCriteria" JSONB;
CREATE INDEX "service_inventory_requirements_inventoryTypeId_idx" ON "service_inventory_requirements"("inventoryTypeId");
ALTER TABLE "service_inventory_requirements" ADD CONSTRAINT "service_inventory_requirements_inventoryTypeId_fkey"
  FOREIGN KEY ("inventoryTypeId") REFERENCES "inventory_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Index swap on inventory_categories: [tenantId] -> [tenantId, active]
DROP INDEX "inventory_categories_tenantId_idx";
CREATE INDEX "inventory_categories_tenantId_active_idx" ON "inventory_categories"("tenantId", "active");
