-- Additive only: audit trail for manual Event.status overrides (Phase 10). Event.status becomes
-- primarily derived from EventService progress going forward — this table exists purely to log
-- the deliberate manual corrections that are still allowed, so nothing about existing data changes.

-- CreateTable
CREATE TABLE "event_status_overrides" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "previousStatus" "EventStatus" NOT NULL,
    "newStatus" "EventStatus" NOT NULL,
    "reason" TEXT NOT NULL,
    "overriddenBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_status_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_status_overrides_eventId_idx" ON "event_status_overrides"("eventId");

-- AddForeignKey
ALTER TABLE "event_status_overrides" ADD CONSTRAINT "event_status_overrides_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
