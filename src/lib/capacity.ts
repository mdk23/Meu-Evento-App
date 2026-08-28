/**
 * Capacity rule (Phase 8): guestCount > space.capacity is a soft warning by default — it only
 * blocks the booking from being CONFIRMED, and only until an override reason is recorded.
 */
export function isOverCapacity(guestCount: number, spaceCapacity: number): boolean {
  return guestCount > spaceCapacity;
}

export class CapacityExceededError extends Error {
  constructor(guestCount: number, spaceCapacity: number) {
    super(
      `Guest count (${guestCount}) exceeds the venue's capacity (${spaceCapacity}). Provide a capacity override reason to confirm this booking anyway.`
    );
    this.name = 'CapacityExceededError';
  }
}

/** Throws `CapacityExceededError` if confirming this booking would exceed capacity without an override reason on file. */
export function assertCapacityForConfirmation(
  guestCount: number,
  spaceCapacity: number,
  capacityOverrideReason: string | null | undefined
): void {
  if (isOverCapacity(guestCount, spaceCapacity) && !capacityOverrideReason?.trim()) {
    throw new CapacityExceededError(guestCount, spaceCapacity);
  }
}
