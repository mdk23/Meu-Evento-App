-- Additive only: create the new relational tables that replace the JSON `tasks`,
-- `assignedStaff`, and `reservedInventory` columns on `event_services`. Those columns are
-- intentionally left in place here — they still hold live data that a separate backfill
-- script must migrate into these tables before a follow-up migration drops them.

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'DONE');

-- CreateTable
CREATE TABLE "event_service_tasks" (
    "id" TEXT NOT NULL,
    "eventServiceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "assignedTo" TEXT,
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_service_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_service_staff" (
    "id" TEXT NOT NULL,
    "eventServiceId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "role" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "staffNameSnapshot" TEXT NOT NULL,

    CONSTRAINT "event_service_staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_reservations" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventServiceId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "itemNameSnapshot" TEXT NOT NULL,

    CONSTRAINT "inventory_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_service_tasks_eventServiceId_idx" ON "event_service_tasks"("eventServiceId");

-- CreateIndex
CREATE INDEX "event_service_staff_eventServiceId_idx" ON "event_service_staff"("eventServiceId");

-- CreateIndex
CREATE INDEX "event_service_staff_staffId_idx" ON "event_service_staff"("staffId");

-- CreateIndex
CREATE INDEX "event_service_staff_startAt_endAt_idx" ON "event_service_staff"("startAt", "endAt");

-- CreateIndex
CREATE INDEX "inventory_reservations_eventServiceId_idx" ON "inventory_reservations"("eventServiceId");

-- CreateIndex
CREATE INDEX "inventory_reservations_inventoryItemId_idx" ON "inventory_reservations"("inventoryItemId");

-- CreateIndex
CREATE INDEX "inventory_reservations_startAt_endAt_idx" ON "inventory_reservations"("startAt", "endAt");

-- AddForeignKey
ALTER TABLE "event_service_tasks" ADD CONSTRAINT "event_service_tasks_eventServiceId_fkey" FOREIGN KEY ("eventServiceId") REFERENCES "event_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_service_staff" ADD CONSTRAINT "event_service_staff_eventServiceId_fkey" FOREIGN KEY ("eventServiceId") REFERENCES "event_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_service_staff" ADD CONSTRAINT "event_service_staff_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_eventServiceId_fkey" FOREIGN KEY ("eventServiceId") REFERENCES "event_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
