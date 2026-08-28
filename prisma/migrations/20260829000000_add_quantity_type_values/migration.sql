-- Add two new scaling rules to QuantityType (§ prompt-1 §5):
--   GUESTS_PER_UNIT = CEILING(guestCount / quantity)  — e.g. 1 table per 12 guests
--   MANUAL          = operator sets the final quantity on the booking
--
-- Enum-only migration: `ALTER TYPE ... ADD VALUE` cannot run in the same transaction that then
-- uses the value, so this file contains no table DDL and no data writes. Existing rows are
-- unaffected (their labels are unchanged).
ALTER TYPE "QuantityType" ADD VALUE IF NOT EXISTS 'GUESTS_PER_UNIT';
ALTER TYPE "QuantityType" ADD VALUE IF NOT EXISTS 'MANUAL';
