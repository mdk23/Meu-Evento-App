-- Phase 5 of the Space/Event dual-workspace rearchitecture.
-- Introduces a versioned PaymentPlan wrapping ScheduledPayment (so editing a schedule creates a
-- new version instead of destroying the old one) and a persisted PaymentAllocation breakdown
-- (still fully recomputed by src/lib/payment-allocation.ts on every write, just now written to a
-- real table instead of only existing in memory).
--
-- Backfill: every booking that already has ScheduledPayment rows gets exactly one PaymentPlan
-- (version 1, active), and every existing ScheduledPayment row is attached to it. No data is
-- destroyed or reinterpreted — this purely adds a required grouping layer around what already
-- exists. PaymentAllocation starts empty; it gets populated for existing bookings by re-running
-- the (already deterministic, already-tested) allocation engine once as a verification step, not
-- by this migration.

CREATE TABLE "payment_plans" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_plans_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payment_plans_bookingId_version_key" ON "payment_plans"("bookingId", "version");
CREATE INDEX "payment_plans_bookingId_idx" ON "payment_plans"("bookingId");
CREATE INDEX "payment_plans_active_idx" ON "payment_plans"("active");

ALTER TABLE "payment_plans" ADD CONSTRAINT "payment_plans_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- One active v1 plan for every booking that currently has a schedule. The id is derived
-- deterministically from bookingId (not gen_random_uuid(), to avoid an extension dependency) —
-- safe because each booking gets exactly one v1 row here.
INSERT INTO "payment_plans" ("id", "bookingId", "version", "active", "createdAt")
SELECT DISTINCT 'planv1_' || sp."bookingId", sp."bookingId", 1, true, CURRENT_TIMESTAMP
FROM "scheduled_payments" sp;

ALTER TABLE "scheduled_payments" ADD COLUMN "planId" TEXT;
UPDATE "scheduled_payments" SET "planId" = 'planv1_' || "bookingId";
ALTER TABLE "scheduled_payments" ALTER COLUMN "planId" SET NOT NULL;

CREATE INDEX "scheduled_payments_planId_idx" ON "scheduled_payments"("planId");
ALTER TABLE "scheduled_payments" ADD CONSTRAINT "scheduled_payments_planId_fkey"
  FOREIGN KEY ("planId") REFERENCES "payment_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "payment_allocations" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "scheduledPaymentId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_allocations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "payment_allocations_transactionId_idx" ON "payment_allocations"("transactionId");
CREATE INDEX "payment_allocations_scheduledPaymentId_idx" ON "payment_allocations"("scheduledPaymentId");

ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_transactionId_fkey"
  FOREIGN KEY ("transactionId") REFERENCES "payment_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_scheduledPaymentId_fkey"
  FOREIGN KEY ("scheduledPaymentId") REFERENCES "scheduled_payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
