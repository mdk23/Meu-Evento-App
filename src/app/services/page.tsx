import ServicesClient from '@/components/services/ServicesClient';
import { ServiceService } from '@/lib/services/service.service';
import { InventoryItemRepository } from '@/lib/repositories/inventory-item.repository';
import { InventoryCategoryRepository } from '@/lib/repositories/inventory-category.repository';

export const dynamic = 'force-dynamic';

interface ServicesPageProps {
  searchParams: Promise<{ scope?: string }>;
}

export default async function ServicesCatalogPage({ searchParams }: ServicesPageProps) {
  const params = await searchParams;
  const scope = params.scope?.toUpperCase();

  const [services, inventoryItems, inventoryCategories] = await Promise.all([
    ServiceService.getCatalog(),
    InventoryItemRepository.getItemOptions(),
    InventoryCategoryRepository.getCategories(),
  ]);

  return (
    <ServicesClient
      initialServices={services}
      initialScopeFilter={scope === 'SPACE' || scope === 'EVENT' ? scope : 'ALL'}
      inventoryItems={inventoryItems}
      inventoryCategories={inventoryCategories}
    />
  );
}
