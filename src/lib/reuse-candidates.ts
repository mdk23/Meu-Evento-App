import { ResourceAllocationStatus } from '@prisma/client';
import { ACTIVE_RESOURCE_STATUSES, computeReuseAllocation } from './resource-conflict';

export interface ResourceForReuse {
  id: string;
  bookingServiceId: string;
  inventoryItemId: string | null;
  itemNameSnapshot: string | null;
  reservedQuantity: number;
  status: ResourceAllocationStatus;
  reusedFromResourceId: string | null;
}

export interface ReuseCandidate {
  resourceId: string;
  itemName: string;
  serviceName: string;
  availableToReuse: number;
}

/**
 * Finds every *other* service's already-active resource for the same item this row needs (the
 * cross-workspace "an Event service reusing the Venue package's already-reserved chairs instead of
 * double-reserving" scenario) and how much of each is still free to reuse — a resource's committed
 * stock can be claimed by any number of other rows, but their combined `reservedQuantity` claims
 * against it can never exceed its own `reservedQuantity` (`computeReuseAllocation`).
 *
 * Returns nothing for a category-based row that hasn't resolved to a specific item yet
 * (`inventoryItemId: null`) — there's nothing concrete to match against until it has. Pure — no DB
 * access — so it can run over an already-fetched event/booking payload and be unit-tested directly.
 */
export function computeReuseCandidatesForRequirement(
  resource: ResourceForReuse,
  allResources: ResourceForReuse[],
  serviceLabels: Record<string, string>
): ReuseCandidate[] {
  if (!resource.inventoryItemId) return [];

  const candidates = allResources.filter(
    (r) =>
      r.inventoryItemId === resource.inventoryItemId &&
      r.bookingServiceId !== resource.bookingServiceId &&
      ACTIVE_RESOURCE_STATUSES.includes(r.status) &&
      r.reusedFromResourceId === null
  );

  const result: ReuseCandidate[] = [];
  for (const target of candidates) {
    // Includes this same row's own prior claim on this target, if any — reuse is an increment (see
    // the `/inventory/reuse` route), so a second claim against the same target must be capped by
    // what's left *after* this row's own earlier claim too, not just everyone else's.
    const alreadyReused = allResources
      .filter((r) => r.reusedFromResourceId === target.id)
      .reduce((sum, r) => sum + r.reservedQuantity, 0);

    const { availableToReuse } = computeReuseAllocation(target.reservedQuantity, alreadyReused, 0);
    if (availableToReuse > 0) {
      result.push({
        resourceId: target.id,
        itemName: target.itemNameSnapshot || 'Item',
        serviceName: serviceLabels[target.bookingServiceId] || 'Another service',
        availableToReuse,
      });
    }
  }
  return result;
}
