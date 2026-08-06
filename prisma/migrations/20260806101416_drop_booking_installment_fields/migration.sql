-- Phase 7: installments are milestones, not a percent+count pair. Every existing booking's
-- real payment obligations already live in `scheduled_payments` (created from these very
-- fields at booking-creation time — verified all rows match before writing this migration),
-- so these Booking columns are redundant display copies and safe to drop with no data loss.

-- AlterTable
ALTER TABLE "bookings" DROP COLUMN "downPaymentAmount",
DROP COLUMN "downPaymentPercent",
DROP COLUMN "installmentCount",
DROP COLUMN "installmentAmount";
