-- Additive only: add spaceId/startAt/endAt as nullable first (a real backfill script populates
-- every existing booking's space + time range from its current eventDate before a follow-up
-- migration makes them required). capacityOverrideReason is optional by nature and stays nullable.

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN "spaceId" TEXT;
ALTER TABLE "bookings" ADD COLUMN "startAt" TIMESTAMP(3);
ALTER TABLE "bookings" ADD COLUMN "endAt" TIMESTAMP(3);
ALTER TABLE "bookings" ADD COLUMN "capacityOverrideReason" TEXT;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "spaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "bookings_spaceId_idx" ON "bookings"("spaceId");
CREATE INDEX "bookings_startAt_endAt_idx" ON "bookings"("startAt", "endAt");
