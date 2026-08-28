import { notFound } from 'next/navigation';
import { InventoryItemRepository } from '@/lib/repositories/inventory-item.repository';
import { computeInventoryStockSummary } from '@/lib/inventory-accounting';
import { toDisplayNumber } from '@/lib/money';
import InventoryItemDetailClient from '@/components/resources/InventoryItemDetailClient';

export const dynamic = 'force-dynamic';

interface InventoryItemDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function InventoryItemDetailPage({ params }: InventoryItemDetailPageProps) {
  const { id } = await params;
  const item = await InventoryItemRepository.getItemDetail(id);
  if (!item) notFound();

  const stockSummary = computeInventoryStockSummary(item.totalQuantity, item.bookingResources, item.transactions);

  return (
    <InventoryItemDetailClient
      item={{
        ...item,
        bookingResources: item.bookingResources.map((r) => ({
          ...r,
          requiredQuantity: toDisplayNumber(r.requiredQuantity),
          reservedQuantity: toDisplayNumber(r.reservedQuantity),
          usedQuantity: toDisplayNumber(r.usedQuantity),
        })),
        transactions: item.transactions.map((t) => ({ ...t, quantity: toDisplayNumber(t.quantity) })),
      }}
      stockSummary={{
        totalQuantity: stockSummary.totalQuantity.toNumber(),
        reservedQuantity: stockSummary.reservedQuantity.toNumber(),
        availableQuantity: stockSummary.availableQuantity.toNumber(),
        allocatedQuantity: stockSummary.allocatedQuantity.toNumber(),
        issuedQuantity: stockSummary.issuedQuantity.toNumber(),
        usedQuantity: stockSummary.usedQuantity.toNumber(),
        returnedQuantity: stockSummary.returnedQuantity.toNumber(),
        damagedQuantity: stockSummary.damagedQuantity.toNumber(),
        lostQuantity: stockSummary.lostQuantity.toNumber(),
        missingQuantity: stockSummary.missingQuantity.toNumber(),
      }}
    />
  );
}
