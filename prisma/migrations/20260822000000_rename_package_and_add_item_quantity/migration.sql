-- Phase 12b of the Space/Event architecture alignment: rename ServicePackage -> Package and
-- PackageService -> PackageItem (pure identifier rename, zero data changes — constraint/index names
-- confirmed against the live database before writing this migration), plus add real quantity/
-- priceOverride fields to PackageItem so a package definition can say "300 chairs", not just "chairs".

-- 1. ServicePackage -> Package
ALTER TABLE "service_packages" RENAME TO "packages";
ALTER TABLE "packages" RENAME CONSTRAINT "service_packages_pkey" TO "packages_pkey";
ALTER TABLE "packages" RENAME CONSTRAINT "service_packages_tenantId_fkey" TO "packages_tenantId_fkey";
ALTER INDEX "service_packages_tenantId_idx" RENAME TO "packages_tenantId_idx";
ALTER INDEX "service_packages_scope_idx" RENAME TO "packages_scope_idx";
ALTER INDEX "service_packages_active_idx" RENAME TO "packages_active_idx";

-- 2. PackageService -> PackageItem
ALTER TABLE "package_services" RENAME TO "package_items";
ALTER TABLE "package_items" RENAME CONSTRAINT "package_services_pkey" TO "package_items_pkey";
ALTER TABLE "package_items" RENAME CONSTRAINT "package_services_packageId_fkey" TO "package_items_packageId_fkey";
ALTER TABLE "package_items" RENAME CONSTRAINT "package_services_serviceId_fkey" TO "package_items_serviceId_fkey";
ALTER INDEX "package_services_packageId_idx" RENAME TO "package_items_packageId_idx";
ALTER INDEX "package_services_serviceId_idx" RENAME TO "package_items_serviceId_idx";
ALTER INDEX "package_services_packageId_serviceId_key" RENAME TO "package_items_packageId_serviceId_key";

-- 3. New fields — default quantity 1 preserves every existing row's implicit "one of this service"
-- meaning; priceOverride nullable, defaulting to "use the service's normal catalog price."
ALTER TABLE "package_items" ADD COLUMN "quantity" DECIMAL(12,2) NOT NULL DEFAULT 1;
ALTER TABLE "package_items" ADD COLUMN "priceOverride" DECIMAL(12,2);
