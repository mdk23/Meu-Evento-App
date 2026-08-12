-- Additive, nullable column — no data loss, no downtime.
ALTER TABLE "scheduled_payments" ADD COLUMN "orderNumber" INTEGER;

-- Backfill: assign each existing booking's schedules an order matching their current
-- allocation order (dueDate, then createdAt as tie-breaker) — the same default order
-- the payment allocation engine uses going forward.
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY "bookingId" ORDER BY "dueDate" ASC, "createdAt" ASC) AS rn
  FROM "scheduled_payments"
)
UPDATE "scheduled_payments" sp
SET "orderNumber" = ranked.rn
FROM ranked
WHERE sp.id = ranked.id;
