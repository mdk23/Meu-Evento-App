-- Phase 12e of the Space/Event architecture alignment: real Space/Event/Both catalog scoping for
-- individual services (packages already have this via PackageScope). Every existing service
-- backfills to BOTH, preserving today's exact "visible everywhere" behavior — re-scoping real rows to
-- SPACE-only or EVENT-only is a deliberate follow-up the catalog owner does via the Services page.

CREATE TYPE "ServiceScope" AS ENUM ('SPACE', 'EVENT', 'BOTH');

ALTER TABLE "services" ADD COLUMN "scope" "ServiceScope" NOT NULL DEFAULT 'BOTH';
CREATE INDEX "services_scope_idx" ON "services"("scope");
