/**
 * Capacity rule (Phase 8): guestCount > space.capacity is a soft warning by default — it only
 * blocks the booking from being CONFIRMED, and only until an override reason is recorded.
 */
export function isOverCapacity(guestCount: number, venueCapacity: number): boolean {
  return guestCount > venueCapacity;
}

export class CapacityExceededError extends Error {
  constructor(guestCount: number, venueCapacity: number) {
    super(
      `Guest count (${guestCount}) exceeds the venue's capacity (${venueCapacity}). Provide a capacity override reason to confirm this booking anyway.`
    );
    this.name = 'CapacityExceededError';
  }
}

/** Throws `CapacityExceededError` if confirming this booking would exceed capacity without an override reason on file. */
export function assertCapacityForConfirmation(
  guestCount: number,
  venueCapacity: number,
  capacityOverrideReason: string | null | undefined
): void {
  if (isOverCapacity(guestCount, venueCapacity) && !capacityOverrideReason?.trim()) {
    throw new CapacityExceededError(guestCount, venueCapacity);
  }
}
