-- All rows' `tasks`, `assignedStaff`, and `reservedInventory` JSON have already been migrated
-- into `event_service_tasks`, `event_service_staff`, and `inventory_reservations` by a backfill
-- script, and verified to match exactly (see migration 20260805191223_add_work_order_relations).
-- Every API route and UI component has been updated to read/write the new relational tables
-- instead of these columns, so it's now safe to drop them.

-- AlterTable
ALTER TABLE "event_services" DROP COLUMN "assignedStaff",
DROP COLUMN "reservedInventory",
DROP COLUMN "tasks";
