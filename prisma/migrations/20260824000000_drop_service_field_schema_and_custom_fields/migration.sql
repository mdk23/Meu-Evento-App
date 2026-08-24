-- Removes the "Work Order Fields" feature end to end, per explicit user request: the dynamic
-- per-service field schema (Service.fieldSchema) and the values it collected on a booking's line
-- (BookingService.customFields). Confirmed via the live API before writing this migration: 6 of 13
-- real services had non-null fieldSchema data (theme/menu/dietary/etc. field definitions) and two
-- real BookingService rows had populated customFields JSON (from the seed data) — both are
-- intentionally discarded here as part of removing the feature, not preserved elsewhere.

ALTER TABLE "services" DROP COLUMN "fieldSchema";
ALTER TABLE "booking_services" DROP COLUMN "customFields";
