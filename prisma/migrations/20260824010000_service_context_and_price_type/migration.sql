-- Phase 1: Service.scope -> Service.context (ServiceScope -> ServiceContext), and
-- Service.priceType from free-text to a real PriceType enum.

-- 1. Rename the ServiceScope enum type to ServiceContext (values are unchanged: SPACE/EVENT/BOTH).
ALTER TYPE "ServiceScope" RENAME TO "ServiceContext";

-- 2. Rename the column and its index to match.
ALTER TABLE "services" RENAME COLUMN "scope" TO "context";
ALTER INDEX "services_scope_idx" RENAME TO "services_context_idx";

-- 3. Create the PriceType enum. Live data only ever contains FIXED/PER_GUEST today, but PER_HOUR
--    and PER_UNIT are added up front per the target schema.
CREATE TYPE "PriceType" AS ENUM ('FIXED', 'PER_GUEST', 'PER_HOUR', 'PER_UNIT');

-- 4. Convert services.priceType from text to PriceType, defaulting any value that doesn't match a
--    known enum member to FIXED rather than failing the migration.
ALTER TABLE "services" ALTER COLUMN "priceType" DROP DEFAULT;
ALTER TABLE "services"
  ALTER COLUMN "priceType" TYPE "PriceType" USING (
    CASE
      WHEN "priceType" IN ('FIXED', 'PER_GUEST', 'PER_HOUR', 'PER_UNIT') THEN "priceType"::"PriceType"
      ELSE 'FIXED'::"PriceType"
    END
  );
ALTER TABLE "services" ALTER COLUMN "priceType" SET DEFAULT 'FIXED';
