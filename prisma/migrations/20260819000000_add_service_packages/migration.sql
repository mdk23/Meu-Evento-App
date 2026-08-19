-- Phase 4 of the Space/Event dual-workspace rearchitecture.
-- New, purely additive models: bundles of catalog services (Space packages / Event packages).
-- Nothing existing is touched.

CREATE TYPE "PackageScope" AS ENUM ('SPACE', 'EVENT');

CREATE TABLE "service_packages" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "scope" "PackageScope" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_packages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "package_services" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "package_services_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "service_packages_tenantId_idx" ON "service_packages"("tenantId");
CREATE INDEX "service_packages_scope_idx" ON "service_packages"("scope");
CREATE INDEX "service_packages_active_idx" ON "service_packages"("active");

CREATE INDEX "package_services_packageId_idx" ON "package_services"("packageId");
CREATE INDEX "package_services_serviceId_idx" ON "package_services"("serviceId");
CREATE UNIQUE INDEX "package_services_packageId_serviceId_key" ON "package_services"("packageId", "serviceId");

ALTER TABLE "service_packages" ADD CONSTRAINT "service_packages_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "package_services" ADD CONSTRAINT "package_services_packageId_fkey"
  FOREIGN KEY ("packageId") REFERENCES "service_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "package_services" ADD CONSTRAINT "package_services_serviceId_fkey"
  FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
