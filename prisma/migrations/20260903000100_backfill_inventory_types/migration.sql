-- Category → Type → Item refactor, phase 2: strict backfill (no name-based guessing).
-- Every existing category gets one "Unclassified" type; every item and every category-based service
-- requirement is assigned to it. The Unclassified type carries a permissive attributeDefs covering
-- the folded columns so `getSeatingCapacity` and characteristic display keep working until an
-- operator reclassifies the item. Unclassified items are surfaced in the UI for manual review
-- (checked via `type.name = 'Unclassified'`; the machine `code` is per-category-unique because
-- `@@unique([tenantId, code])` forbids a shared 'UNCLASSIFIED').

-- 1. One "Unclassified" type per category.
INSERT INTO "inventory_types"
  ("id", "tenantId", "categoryId", "name", "code", "attributeDefs", "active", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text, c."tenantId", c."id", 'Unclassified',
  'UNCLASSIFIED_' || upper(regexp_replace(trim(c."name"), '[^A-Za-z0-9]+', '_', 'g')) || '_' || substr(c."id", 1, 6),
  '[
    {"key":"color","label":"Color","type":"text","required":false},
    {"key":"material","label":"Material","type":"text","required":false},
    {"key":"model","label":"Model","type":"text","required":false},
    {"key":"size","label":"Size","type":"text","required":false},
    {"key":"shape","label":"Shape","type":"text","required":false},
    {"key":"seatingCapacity","label":"Seating Capacity","type":"number","required":false,"min":0}
  ]'::jsonb,
  true, now(), now()
FROM "inventory_categories" c;

-- 2. Fold the legacy per-item columns into `attributes` and point each item at its category's
--    Unclassified type. `jsonb_strip_nulls` keeps only the values that were actually set.
UPDATE "inventory_items" i SET
  "inventoryTypeId" = t."id",
  "attributes" = coalesce(i."attributes", '{}'::jsonb) || jsonb_strip_nulls(jsonb_build_object(
    'color', i."color",
    'material', i."material",
    'model', i."model",
    'size', i."size",
    'shape', i."shape",
    'seatingCapacity', CASE WHEN i."seatingCapacity" > 0 THEN i."seatingCapacity" END
  ))
FROM "inventory_types" t
WHERE t."categoryId" = i."categoryId" AND t."name" = 'Unclassified';

-- 3. Category-based service requirements -> that category's Unclassified type (matchCriteria left null).
UPDATE "service_inventory_requirements" r SET
  "inventoryTypeId" = t."id"
FROM "inventory_types" t
WHERE t."categoryId" = r."categoryId" AND t."name" = 'Unclassified' AND r."categoryId" IS NOT NULL;

-- 4. Verify (fail the migration loudly rather than leaving orphans).
DO $$
DECLARE
  null_type_items int;
  cross_tenant_items int;
  unmigrated_reqs int;
BEGIN
  SELECT count(*) INTO null_type_items FROM "inventory_items" WHERE "inventoryTypeId" IS NULL;
  SELECT count(*) INTO cross_tenant_items FROM "inventory_items" i
    JOIN "inventory_types" t ON t."id" = i."inventoryTypeId"
    WHERE t."tenantId" <> i."tenantId";
  SELECT count(*) INTO unmigrated_reqs FROM "service_inventory_requirements"
    WHERE "categoryId" IS NOT NULL AND "inventoryTypeId" IS NULL;
  IF null_type_items > 0 THEN RAISE EXCEPTION 'backfill: % inventory_items still have a null inventoryTypeId', null_type_items; END IF;
  IF cross_tenant_items > 0 THEN RAISE EXCEPTION 'backfill: % inventory_items point at a type from another tenant', cross_tenant_items; END IF;
  IF unmigrated_reqs > 0 THEN RAISE EXCEPTION 'backfill: % category-based requirements were not migrated to a type', unmigrated_reqs; END IF;
END $$;

-- 5. Now that every item has a type, make the column required.
ALTER TABLE "inventory_items" ALTER COLUMN "inventoryTypeId" SET NOT NULL;
