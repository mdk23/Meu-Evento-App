-- Phase 2 of the Space/Event dual-workspace rearchitecture.
-- A SPACE booking's service lines are commercial-only: they never get an Event, so eventId must
-- be nullable. bookingId (added in Phase 1) is always set and is now the authoritative owner FK.
-- The existing eventId foreign key (ON DELETE CASCADE) is untouched — it simply becomes optional.

ALTER TABLE "event_services" ALTER COLUMN "eventId" DROP NOT NULL;
