-- Phase 12c of the Space/Event architecture alignment: persist quantity/unitPrice/source on
-- BookingService, alongside the existing sellingPrice total. Fixes a real bug — a fixed-price
-- multi-unit line (e.g. "10 Extra Tables") previously only ever saved its total sellingPrice, so
-- editing the booking couldn't recover the original quantity.

CREATE TYPE "ServiceSource" AS ENUM ('DIRECT', 'PACKAGE');

ALTER TABLE "booking_services" ADD COLUMN "quantity" DECIMAL(12,2) NOT NULL DEFAULT 1;
ALTER TABLE "booking_services" ADD COLUMN "unitPrice" DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "booking_services" ADD COLUMN "source" "ServiceSource" NOT NULL DEFAULT 'DIRECT';

-- Every existing row was implicitly quantity 1 (never persisted before now), so its per-unit price
-- is exactly its existing total.
UPDATE "booking_services" SET "unitPrice" = "sellingPrice";
