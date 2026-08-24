-- Phase 2: Package.scope -> Package.context (PackageScope -> PackageContext), plus
-- Package.pricingMode (default COMPUTED) and nullable Package.price for FIXED-priced bundles.

-- 1. Rename the PackageScope enum type to PackageContext (values are unchanged: SPACE/EVENT).
ALTER TYPE "PackageScope" RENAME TO "PackageContext";

-- 2. Rename the column and its index to match.
ALTER TABLE "packages" RENAME COLUMN "scope" TO "context";
ALTER INDEX "packages_scope_idx" RENAME TO "packages_context_idx";

-- 3. Create the PackagePricingMode enum and add the new columns. Every existing package keeps
--    computing its total live from its items (pricingMode = COMPUTED), so `price` stays null on
--    every pre-existing row — nothing changes about how their totals are derived.
CREATE TYPE "PackagePricingMode" AS ENUM ('COMPUTED', 'FIXED');

ALTER TABLE "packages" ADD COLUMN "pricingMode" "PackagePricingMode" NOT NULL DEFAULT 'COMPUTED';
ALTER TABLE "packages" ADD COLUMN "price" DECIMAL(12, 2);
