/**
 * A comparable snapshot of a `Package`'s *definition* — everything that changes what a booking
 * actually gets when the package is applied. Name and description are deliberately excluded: editing
 * them is not a new version.
 */
export interface PackageDefinitionSnapshot {
  pricingMode: 'COMPUTED' | 'FIXED';
  price: number | null;
  capacity: number | null;
  items: Array<{ serviceId: string; quantity: number; priceOverride: number | null }>;
}

function normalizeItems(items: PackageDefinitionSnapshot['items']): string {
  return items
    .map((i) => `${i.serviceId}:${i.quantity}:${i.priceOverride ?? 'null'}`)
    .sort()
    .join('|');
}

/**
 * True when `after` differs from `before` in any way that should bump `Package.version`: the service
 * set, any per-line quantity or price override, the pricing mode, the fixed price, or the capacity.
 * Order-independent for the item list. Pure — no DB access.
 */
export function packageDefinitionChanged(
  before: PackageDefinitionSnapshot,
  after: PackageDefinitionSnapshot
): boolean {
  if (before.pricingMode !== after.pricingMode) return true;
  if ((before.price ?? null) !== (after.price ?? null)) return true;
  if ((before.capacity ?? null) !== (after.capacity ?? null)) return true;
  return normalizeItems(before.items) !== normalizeItems(after.items);
}
