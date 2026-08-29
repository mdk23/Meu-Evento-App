import SettingsClient from '@/components/settings/SettingsClient';
import { InventoryCategoryRepository } from '@/lib/repositories/inventory-category.repository';
import { ServiceCategoryRepository } from '@/lib/repositories/service-category.repository';

export const dynamic = 'force-dynamic';

export default async function SettingsHubPage() {
  const [inventoryCategories, serviceCategories] = await Promise.all([
    InventoryCategoryRepository.getCategories(),
    ServiceCategoryRepository.getCategories(),
  ]);

  return <SettingsClient serviceCategories={serviceCategories} inventoryCategories={inventoryCategories} />;
}
