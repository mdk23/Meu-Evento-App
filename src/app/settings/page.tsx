import SettingsClient from '@/components/settings/SettingsClient';
import { InventoryCategoryRepository } from '@/lib/repositories/inventory-category.repository';
import { InventoryTypeRepository } from '@/lib/repositories/inventory-type.repository';
import { ServiceCategoryRepository } from '@/lib/repositories/service-category.repository';

export const dynamic = 'force-dynamic';

export default async function SettingsHubPage() {
  const [inventoryCategories, inventoryTypes, serviceCategories] = await Promise.all([
    InventoryCategoryRepository.getCategories(),
    InventoryTypeRepository.getTypes(),
    ServiceCategoryRepository.getCategories(),
  ]);

  return (
    <SettingsClient
      serviceCategories={serviceCategories}
      inventoryCategories={inventoryCategories}
      inventoryTypes={inventoryTypes}
    />
  );
}
