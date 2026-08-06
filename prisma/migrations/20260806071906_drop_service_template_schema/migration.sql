-- `fieldSchema` has been backfilled for all catalog services and every API route/UI component
-- has been updated to read/write it instead of `templateSchema` (which was never actually read
-- by any UI to begin with), so it's now safe to drop.

-- AlterTable
ALTER TABLE "services" DROP COLUMN "templateSchema";
