-- Additive only: links an Expense to the specific EventService work order it came from.
-- Nullable — most expenses are manually-entered general operational costs with no such link;
-- only auto-created supplier-cost expenses populate this going forward. onDelete SetNull
-- preserves the expense as a historical financial record even if the work order line item
-- is later removed.

-- AlterTable
ALTER TABLE "expenses" ADD COLUMN "eventServiceId" TEXT;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_eventServiceId_fkey" FOREIGN KEY ("eventServiceId") REFERENCES "event_services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "expenses_eventServiceId_idx" ON "expenses"("eventServiceId");
