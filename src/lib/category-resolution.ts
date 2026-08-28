/**
 * A `BookingServiceResource` seeded from a category-based `ServiceInventoryRequirement` starts with
 * `inventoryItemId: null` — "this booking needs 100 chairs, variant to be chosen." Resolving it =
 * picking the specific in-category `InventoryItem` this booking will actually use, before (or at)
 * reserve time. These pure guards back the resolve endpoint and the "Set variant" UI control.
 */

export interface ResolvableResource {
  inventoryItemId: string | null;
  sourceRequirement: { categoryId: string | null } | null;
  status: string;
}

export interface CandidateItem {
  id: string;
  categoryId: string;
  tenantId: string;
  active: boolean;
}

/** Terminal statuses can't be re-pointed at a different item. */
const TERMINAL_STATUSES = new Set(['RETURNED', 'RELEASED']);

/**
 * True only for a row that is genuinely an unresolved category placeholder: it has no concrete item
 * yet, it was seeded from a category-based requirement, and it hasn't reached a terminal state.
 */
export function canResolveResource(r: ResolvableResource): boolean {
  return (
    r.inventoryItemId === null &&
    !!r.sourceRequirement?.categoryId &&
    !TERMINAL_STATUSES.has(r.status)
  );
}

/**
 * True when `item` is a legal choice for `resource`: same tenant, active, and in the exact category
 * the requirement named.
 */
export function isItemEligibleForResource(
  item: CandidateItem,
  resource: ResolvableResource,
  tenantId: string
): boolean {
  return (
    item.active &&
    item.tenantId === tenantId &&
    !!resource.sourceRequirement?.categoryId &&
    item.categoryId === resource.sourceRequirement.categoryId
  );
}
