import { prisma } from '@/lib/prisma';
import { readAttributeDefs, validateAttributeValues } from '@/lib/inventory-attributes';

/**
 * Resolves + validates the type-governed part of an inventory-item write: loads the `InventoryType`
 * (verifying tenant ownership) and validates `rawAttributes` against its `attributeDefs`, returning
 * only the validated attribute values. The item reaches its category through the type
 * (`inventoryType.category`) — there is no `categoryId` column on the item any more, and
 * seats-per-unit is derived on read via `getSeatingCapacity`.
 */
export async function resolveItemWrite(
  tenantId: string,
  inventoryTypeId: string,
  rawAttributes: unknown
): Promise<
  | { ok: true; attributes: Record<string, unknown> }
  | { ok: false; status: number; error: string }
> {
  const type = await prisma.inventoryType.findFirst({
    where: { id: inventoryTypeId, tenantId },
    select: { id: true, attributeDefs: true },
  });
  if (!type) return { ok: false, status: 403, error: 'Inventory type not found for this tenant' };

  const res = validateAttributeValues(rawAttributes, readAttributeDefs(type.attributeDefs));
  if (!res.ok) return { ok: false, status: 400, error: res.error };

  return { ok: true, attributes: res.values };
}
