-- Pure rename, no data change: `Service.executionType` -> `Service.defaultExecutionType`,
-- to make explicit that it's only a default suggestion — `EventService.providerType` is the
-- real per-event decision (see Phase 3/4 work). RENAME COLUMN preserves every existing value.

-- AlterTable
ALTER TABLE "services" RENAME COLUMN "executionType" TO "defaultExecutionType";
