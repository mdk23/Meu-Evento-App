-- Data-only follow-up to 20260828000000_rename_space_to_venue: bring free-text
-- catalog strings in line with the "Venue" naming. Safe to run repeatedly.
UPDATE "services" SET "category" = 'Venue Rental' WHERE "category" = 'Space Rental';
UPDATE "services" SET "name" = 'Venue Rental' WHERE "name" = 'Venue Space Rental';
UPDATE "venues" SET "name" = 'Royal Events Main Venue' WHERE "name" = 'Royal Events Main Space';
