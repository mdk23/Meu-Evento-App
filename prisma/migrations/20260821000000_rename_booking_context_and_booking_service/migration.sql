-- Phase 12a of the Space/Event architecture alignment: a pure identifier rename, zero data changes.
-- Booking.kind -> Booking.context, EventService -> BookingService (and its dependent tables),
-- Service.defaultExecutionType -> defaultProviderType. Every row/value is untouched; only names
-- change (enum type, tables, columns, indexes, foreign keys). Constraint/index names below were
-- confirmed against the live database before writing this migration.

-- 1. Booking.kind -> Booking.context
ALTER TYPE "BookingKind" RENAME TO "BookingContext";
ALTER TABLE "bookings" RENAME COLUMN "kind" TO "context";
ALTER INDEX "bookings_kind_idx" RENAME TO "bookings_context_idx";

-- 2. EventService -> BookingService (table + its indexes/constraints)
ALTER TABLE "event_services" RENAME TO "booking_services";
ALTER TABLE "booking_services" RENAME CONSTRAINT "event_services_pkey" TO "booking_services_pkey";
ALTER TABLE "booking_services" RENAME CONSTRAINT "event_services_bookingId_fkey" TO "booking_services_bookingId_fkey";
ALTER TABLE "booking_services" RENAME CONSTRAINT "event_services_eventId_fkey" TO "booking_services_eventId_fkey";
ALTER TABLE "booking_services" RENAME CONSTRAINT "event_services_serviceId_fkey" TO "booking_services_serviceId_fkey";
ALTER TABLE "booking_services" RENAME CONSTRAINT "event_services_supplierId_fkey" TO "booking_services_supplierId_fkey";
ALTER INDEX "event_services_bookingId_idx" RENAME TO "booking_services_bookingId_idx";
ALTER INDEX "event_services_eventId_idx" RENAME TO "booking_services_eventId_idx";
ALTER INDEX "event_services_serviceId_idx" RENAME TO "booking_services_serviceId_idx";
ALTER INDEX "event_services_supplierId_idx" RENAME TO "booking_services_supplierId_idx";
ALTER INDEX "event_services_status_idx" RENAME TO "booking_services_status_idx";
ALTER INDEX "event_services_providerType_idx" RENAME TO "booking_services_providerType_idx";

-- 3. EventServiceTask -> BookingServiceTask
ALTER TABLE "event_service_tasks" RENAME TO "booking_service_tasks";
ALTER TABLE "booking_service_tasks" RENAME COLUMN "eventServiceId" TO "bookingServiceId";
ALTER TABLE "booking_service_tasks" RENAME CONSTRAINT "event_service_tasks_pkey" TO "booking_service_tasks_pkey";
ALTER TABLE "booking_service_tasks" RENAME CONSTRAINT "event_service_tasks_eventServiceId_fkey" TO "booking_service_tasks_bookingServiceId_fkey";
ALTER INDEX "event_service_tasks_eventServiceId_idx" RENAME TO "booking_service_tasks_bookingServiceId_idx";

-- 4. EventServiceStaff -> BookingServiceStaff
ALTER TABLE "event_service_staff" RENAME TO "booking_service_staff";
ALTER TABLE "booking_service_staff" RENAME COLUMN "eventServiceId" TO "bookingServiceId";
ALTER TABLE "booking_service_staff" RENAME CONSTRAINT "event_service_staff_pkey" TO "booking_service_staff_pkey";
ALTER TABLE "booking_service_staff" RENAME CONSTRAINT "event_service_staff_eventServiceId_fkey" TO "booking_service_staff_bookingServiceId_fkey";
ALTER TABLE "booking_service_staff" RENAME CONSTRAINT "event_service_staff_staffId_fkey" TO "booking_service_staff_staffId_fkey";
ALTER INDEX "event_service_staff_eventServiceId_idx" RENAME TO "booking_service_staff_bookingServiceId_idx";
ALTER INDEX "event_service_staff_staffId_idx" RENAME TO "booking_service_staff_staffId_idx";
ALTER INDEX "event_service_staff_startAt_endAt_idx" RENAME TO "booking_service_staff_startAt_endAt_idx";

-- 5. InventoryReservation.eventServiceId -> bookingServiceId
ALTER TABLE "inventory_reservations" RENAME COLUMN "eventServiceId" TO "bookingServiceId";
ALTER TABLE "inventory_reservations" RENAME CONSTRAINT "inventory_reservations_eventServiceId_fkey" TO "inventory_reservations_bookingServiceId_fkey";
ALTER INDEX "inventory_reservations_eventServiceId_idx" RENAME TO "inventory_reservations_bookingServiceId_idx";

-- 6. Expense.eventServiceId -> bookingServiceId
ALTER TABLE "expenses" RENAME COLUMN "eventServiceId" TO "bookingServiceId";
ALTER TABLE "expenses" RENAME CONSTRAINT "expenses_eventServiceId_fkey" TO "expenses_bookingServiceId_fkey";
ALTER INDEX "expenses_eventServiceId_idx" RENAME TO "expenses_bookingServiceId_idx";

-- 7. Service.defaultExecutionType -> defaultProviderType
ALTER TABLE "services" RENAME COLUMN "defaultExecutionType" TO "defaultProviderType";
