-- Managed list of Service categories, maintained on the Settings page and shown as the "Category"
-- picker options when creating a Service. `services.category` stays a free-text label column (no FK
-- conversion) — this table only drives the picker.

CREATE TABLE "service_categories" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "service_categories_tenantId_name_key" ON "service_categories"("tenantId", "name");
CREATE INDEX "service_categories_tenantId_idx" ON "service_categories"("tenantId");

ALTER TABLE "service_categories" ADD CONSTRAINT "service_categories_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: every distinct category label already in use becomes a managed option, so the picker
-- isn't empty and matches what the catalog already contains. `gen_random_uuid()::text` is a fine id
-- here (these rows are never joined by id from historical data).
INSERT INTO "service_categories" ("id", "tenantId", "name", "active", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, s."tenantId", trim(s."category"), true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (SELECT DISTINCT "tenantId", "category" FROM "services" WHERE "category" IS NOT NULL AND trim("category") <> '') s;
