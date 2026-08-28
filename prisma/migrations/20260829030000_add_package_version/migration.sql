-- Package definition versioning (prompt-2 §16). `packages.version` is bumped by the PATCH route
-- whenever the bundle's definition (service list / per-line quantity or price override / pricing
-- mode / price / capacity) changes; `booking_packages.packageVersion` snapshots it at apply time.
--
-- Additive columns only, both default 1: every existing package is "version 1", and every existing
-- booking_packages row was applied from that version. No backfill needed.
ALTER TABLE "packages" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "booking_packages" ADD COLUMN "packageVersion" INTEGER NOT NULL DEFAULT 1;
