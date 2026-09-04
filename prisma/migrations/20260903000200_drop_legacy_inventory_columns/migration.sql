-- Category → Type → Item refactor, final phase: drop the pre-Type columns now that every reader
-- goes through `InventoryType` + `attributes` (seatingCapacity/color/material/... folded into
-- `attributes` by 20260903000100_backfill_inventory_types) and every service requirement targets an
-- item or a type (never a bare category).

-- 1. InventoryItem: drop the folded legacy columns + the now-redundant direct category link.
DROP INDEX IF EXISTS "inventory_items_categoryId_idx";

ALTER TABLE "inventory_items"
  DROP CONSTRAINT IF EXISTS "inventory_items_categoryId_fkey";

ALTER TABLE "inventory_items"
  DROP COLUMN "seatingCapacity",
  DROP COLUMN "categoryId",
  DROP COLUMN "color",
  DROP COLUMN "material",
  DROP COLUMN "model",
  DROP COLUMN "size",
  DROP COLUMN "shape";

-- 2. ServiceInventoryRequirement: drop the legacy category target; the fulfillment target is now
--    "an item OR a type".
DROP INDEX IF EXISTS "service_inventory_requirements_categoryId_idx";

ALTER TABLE "service_inventory_requirements"
  DROP CONSTRAINT IF EXISTS "service_inventory_requirements_categoryId_fkey";

ALTER TABLE "service_inventory_requirements"
  DROP CONSTRAINT IF EXISTS "service_inventory_requirements_target_check";

ALTER TABLE "service_inventory_requirements"
  DROP COLUMN "categoryId";

ALTER TABLE "service_inventory_requirements"
  ADD CONSTRAINT "service_inventory_requirements_target_check"
    CHECK ("inventoryItemId" IS NOT NULL OR "inventoryTypeId" IS NOT NULL);
