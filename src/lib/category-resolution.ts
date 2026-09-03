/**
 * A `BookingServiceResource` seeded from a **type-based** `ServiceInventoryRequirement` (Mode B)
 * starts with `inventoryItemId: null` — "this booking needs 10 round tables that seat ≥ 10,
 * variant to be chosen." Resolving it = picking the specific `InventoryItem` (of the required type,
 * whose `attributes` satisfy `matchCriteria`) this booking will actually use, before or at reserve
 * time. These pure guards back the resolve endpoint and the "Set variant" UI control.
 */

import { itemMatchesCriteria, MatchCriteria } from './inventory-type-match';

export interface ResolvableResource {
  inventoryItemId: string | null;
  sourceRequirement: { inventoryTypeId: string | null; matchCriteria: MatchCriteria | null } | null;
  status: string;
}

export interface CandidateItem {
  id: string;
  inventoryTypeId: string;
  attributes: unknown;
  tenantId: string;
  active: boolean;
}

/** Terminal statuses can't be re-pointed at a different item. */
const TERMINAL_STATUSES = new Set(['RETURNED', 'RELEASED']);

/**
 * True only for a row that is genuinely an unresolved type placeholder: no concrete item yet, seeded
 * from a type-based requirement, and not in a terminal state.
 */
export function canResolveResource(r: ResolvableResource): boolean {
  return (
    r.inventoryItemId === null &&
    !!r.sourceRequirement?.inventoryTypeId &&
    !TERMINAL_STATUSES.has(r.status)
  );
}

/**
 * True when `item` is a legal choice for `resource`: same tenant, active, of the required type, and
 * its `attributes` satisfy the requirement's `matchCriteria`.
 */
export function isItemEligibleForResource(
  item: CandidateItem,
  resource: ResolvableResource,
  tenantId: string
): boolean {
  const req = resource.sourceRequirement;
  return (
    item.active &&
    item.tenantId === tenantId &&
    !!req?.inventoryTypeId &&
    item.inventoryTypeId === req.inventoryTypeId &&
    itemMatchesCriteria(item.attributes, req.matchCriteria)
  );
}
