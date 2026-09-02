-- Pin a service to the top of the picker (booking POS + Services page). Additive, defaults false.
ALTER TABLE "services" ADD COLUMN "featured" BOOLEAN NOT NULL DEFAULT false;
