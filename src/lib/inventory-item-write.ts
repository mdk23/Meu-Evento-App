import { prisma } from '@/lib/prisma';
import { readAttributeDefs, validateAttributeValues, getSeatingCapacity } from '@/lib/inventory-attributes';

/**
 * Resolves + validates the type-governed parts of an inventory-item write: loads the `InventoryType`
 * (verifying tenant ownership), validates `rawAttributes` against its `attributeDefs`, and derives
 * the item's `categoryId` (from the type) and legacy `seatingCapacity` column (from the validated
 * attributes, kept in sync until that column is dropped).
 */
export async function resolveItemWrite(
  tenantId: string,
  inventoryTypeId: string,
  rawAttributes: unknown
): Promise<
  | { ok: true; categoryId: string; attributes: Record<string, unknown>; seatingCapacity: number }
  | { ok: false; status: number; error: string }
> {
  const type = await prisma.inventoryType.findFirst({
    where: { id: inventoryTypeId, tenantId },
    select: { id: true, categoryId: true, attributeDefs: true },
  });
  if (!type) return { ok: false, status: 403, error: 'Inventory type not found for this tenant' };

  const defs = readAttributeDefs(type.attributeDefs);
  const res = validateAttributeValues(rawAttributes, defs);
  if (!res.ok) return { ok: false, status: 400, error: res.error };

  return {
    ok: true,
    categoryId: type.categoryId,
    attributes: res.values,
    seatingCapacity: getSeatingCapacity(res.values, defs),
  };
}
