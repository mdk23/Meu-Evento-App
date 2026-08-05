-- CreateEnum
CREATE TYPE "WorkOrderStatus" AS ENUM ('PLANNING', 'READY', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE "SupplierStatus" AS ENUM ('REQUESTED', 'CONFIRMED', 'DELIVERED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "ServicePaymentStatus" AS ENUM ('UNPAID', 'PARTIAL', 'PAID');

-- Add new columns alongside the old ones so we can backfill with a value mapping before
-- touching anything destructively (the old ServiceWorkOrderStatus enum's values don't map
-- 1:1 onto the two new enums, so a direct ALTER COLUMN ... TYPE cast is not safe here).
ALTER TABLE "event_services" ADD COLUMN "status_new" "WorkOrderStatus";
ALTER TABLE "event_services" ADD COLUMN "supplierStatus_new" "SupplierStatus";
ALTER TABLE "event_services" ADD COLUMN "paymentStatus_new" "ServicePaymentStatus";

-- Backfill status: DRAFT/PLANNING -> PLANNING, PREPARING/EXECUTING -> IN_PROGRESS, READY -> READY,
-- COMPLETED -> COMPLETED. (CANCELLED is new, no existing rows can map to it.)
UPDATE "event_services" SET "status_new" = (
  CASE "status"::text
    WHEN 'DRAFT' THEN 'PLANNING'
    WHEN 'PLANNING' THEN 'PLANNING'
    WHEN 'PREPARING' THEN 'IN_PROGRESS'
    WHEN 'READY' THEN 'READY'
    WHEN 'EXECUTING' THEN 'IN_PROGRESS'
    WHEN 'COMPLETED' THEN 'COMPLETED'
    ELSE 'PLANNING'
  END
)::"WorkOrderStatus";

-- Backfill supplierStatus: same value spelling carries over for EXTERNAL rows; INTERNAL rows
-- get NULL regardless of whatever stale value they had (supplier status is meaningless for them).
UPDATE "event_services" SET "supplierStatus_new" = (
  CASE
    WHEN "providerType" = 'INTERNAL' THEN NULL
    ELSE (
      CASE "supplierStatus"::text
        WHEN 'REQUESTED' THEN 'REQUESTED'
        WHEN 'CONFIRMED' THEN 'CONFIRMED'
        WHEN 'DELIVERED' THEN 'DELIVERED'
        WHEN 'COMPLETED' THEN 'COMPLETED'
        ELSE 'REQUESTED'
      END
    )::"SupplierStatus"
  END
);

-- Backfill paymentStatus: the old text column's values already match the new enum's spelling.
UPDATE "event_services" SET "paymentStatus_new" = (
  CASE "paymentStatus"
    WHEN 'UNPAID' THEN 'UNPAID'
    WHEN 'PARTIAL' THEN 'PARTIAL'
    WHEN 'PAID' THEN 'PAID'
    ELSE 'UNPAID'
  END
)::"ServicePaymentStatus";

-- Constraints on the new columns (status/paymentStatus are required with defaults; supplierStatus stays nullable)
ALTER TABLE "event_services" ALTER COLUMN "status_new" SET NOT NULL;
ALTER TABLE "event_services" ALTER COLUMN "status_new" SET DEFAULT 'PLANNING';
ALTER TABLE "event_services" ALTER COLUMN "paymentStatus_new" SET NOT NULL;
ALTER TABLE "event_services" ALTER COLUMN "paymentStatus_new" SET DEFAULT 'UNPAID';

-- Drop old columns (and their dependent index on "status") now that the new ones are fully populated
ALTER TABLE "event_services" DROP COLUMN "status";
ALTER TABLE "event_services" DROP COLUMN "supplierStatus";
ALTER TABLE "event_services" DROP COLUMN "paymentStatus";

-- Rename new columns into the final names
ALTER TABLE "event_services" RENAME COLUMN "status_new" TO "status";
ALTER TABLE "event_services" RENAME COLUMN "supplierStatus_new" TO "supplierStatus";
ALTER TABLE "event_services" RENAME COLUMN "paymentStatus_new" TO "paymentStatus";

-- Recreate the index that was dropped along with the old "status" column
CREATE INDEX "event_services_status_idx" ON "event_services"("status");

-- The old shared enum is no longer referenced by any column
DROP TYPE "ServiceWorkOrderStatus";
