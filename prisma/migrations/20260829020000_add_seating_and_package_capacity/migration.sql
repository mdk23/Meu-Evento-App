-- Seating capacity on inventory + intended-guest-count on packages, for the package
-- seating-sufficiency preview and the booking-exceeds-package-capacity warning (prompt-2 §3-5, §23-24).
--
-- Additive columns only. No backfill: `0` / NULL are the correct "unknown" values — item names are
-- free text, so auto-guessing "chairs seat 1" would be unsafe. The catalog owner sets real values
-- from the Inventory and Packages screens. (A one-off `SELECT id, name FROM inventory_items WHERE
-- "seatingCapacity" = 0 ORDER BY name;` can be run by hand afterward to find items still needing one.)
ALTER TABLE "inventory_items" ADD COLUMN "seatingCapacity" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "packages" ADD COLUMN "capacity" INTEGER;
