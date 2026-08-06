-- Additive only: add the new `fieldSchema` JSONB column that replaces `templateSchema`.
-- `templateSchema` is left in place here — a separate backfill script populates `fieldSchema`
-- with real per-service field definitions (the old column's `{fields, tasks}` shape was never
-- actually read by any UI and doesn't map onto the new `[{key, type}]` shape, so there is
-- nothing meaningful to carry over from it) before a follow-up migration drops it.

-- AlterTable
ALTER TABLE "services" ADD COLUMN "fieldSchema" JSONB;
