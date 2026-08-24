import { ReservationStatus } from '@prisma/client';
import { ACTIVE_RESERVATION_STATUSES, computeReuseAllocation } from './resource-conflict';

export interface ReservationForReuse {
  id: string;
  inventoryItemId: string;
  bookingServiceId: string;
  quantity: number;
  status: ReservationStatus;
  itemNameSnapshot: string;
}

export interface RequirementForReuse {
  id: string;
  bookingServiceId: string;
  inventoryItemId: string | null;
  reuseReservationId: string | null;
  providedQuantity: number;
}

export interface ReuseCandidate {
  reservationId: string;
  itemName: string;
  serviceName: string;
  availableToReuse: number;
}

/**
 * Finds every *other* service's already-active reservation for the same item this requirement needs
 * (§20-21/§38: "an Event service reusing the Space package's already-reserved chairs instead of
 * double-reserving") and how much of each is still free to reuse — a reservation's stock can be
 * claimed by any number of requirements, but their combined `providedQuantity` claims against it can
 * never exceed its own `quantity` (Phase 13/15's `computeReuseAllocation`).
 *
 * Returns nothing for a category-based requirement that hasn't resolved to a specific item yet
 * (`inventoryItemId: null`) — there's nothing concrete to match against until it has. Pure — no DB
 * access — so it can run over an already-fetched event payload and be unit-tested directly.
 */
export function computeReuseCandidatesForRequirement(
  requirement: RequirementForReuse,
  allReservations: ReservationForReuse[],
  allRequirements: RequirementForReuse[],
  serviceLabels: Record<string, string>
): ReuseCandidate[] {
  if (!requirement.inventoryItemId) return [];

  const candidates = allReservations.filter(
    (r) =>
      r.inventoryItemId === requirement.inventoryItemId &&
      r.bookingServiceId !== requirement.bookingServiceId &&
      ACTIVE_RESERVATION_STATUSES.includes(r.status)
  );

  const result: ReuseCandidate[] = [];
  for (const reservation of candidates) {
    // Includes this same requirement's own prior claim on this reservation, if any — reuse is an
    // increment (see the `/inventory/reuse` route), so a second claim against the same reservation
    // must be capped by what's left *after* this requirement's own earlier claim too, not just
    // everyone else's.
    const alreadyReused = allRequirements
      .filter((req) => req.reuseReservationId === reservation.id)
      .reduce((sum, req) => sum + req.providedQuantity, 0);

    const { availableToReuse } = computeReuseAllocation(reservation.quantity, alreadyReused, 0);
    if (availableToReuse > 0) {
      result.push({
        reservationId: reservation.id,
        itemName: reservation.itemNameSnapshot,
        serviceName: serviceLabels[reservation.bookingServiceId] || 'Another service',
        availableToReuse,
      });
    }
  }
  return result;
}
