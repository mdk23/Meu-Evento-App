import ServicesClient from '@/components/services/ServicesClient';
import { ServiceService } from '@/lib/services/service.service';
import { InventoryItemRepository } from '@/lib/repositories/inventory-item.repository';
import { InventoryTypeRepository } from '@/lib/repositories/inventory-type.repository';
import { ServiceCategoryRepository } from '@/lib/repositories/service-category.repository';

export const dynamic = 'force-dynamic';

interface ServicesPageProps {
  searchParams: Promise<{ scope?: string }>;
}

export default async function ServicesCatalogPage({ searchParams }: ServicesPageProps) {
  const params = await searchParams;
  const scope = params.scope?.toUpperCase();

  const [services, inventoryItems, inventoryTypes, serviceCategories] = await Promise.all([
    ServiceService.getCatalog(),
    InventoryItemRepository.getItemOptions(),
    InventoryTypeRepository.getTypes(),
    ServiceCategoryRepository.getCategories(),
  ]);

  return (
    <ServicesClient
      initialServices={services}
      initialScopeFilter={scope === 'VENUE' || scope === 'EVENT' ? scope : 'ALL'}
      inventoryItems={inventoryItems}
      inventoryTypes={inventoryTypes}
      serviceCategories={serviceCategories}
    />
  );
}
