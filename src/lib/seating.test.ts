import { describe, it, expect } from 'vitest';
import { computePackageSeating, computeBookingPackageCapacityGap, SeatingReq } from './seating';

describe('computePackageSeating', () => {
  it('adds up resolved-quantity x seatingCapacity across seating requirements', () => {
    const reqs: SeatingReq[] = [
      // 1 chair per guest, seats 1 each
      { quantityType: 'PER_GUEST', quantity: 1, unitCount: 0, seatingCapacity: 1 },
      // 1 round table per 12 guests, seats 12 each -> ceil(100/12) = 9 tables -> 108 seats
      { quantityType: 'GUESTS_PER_UNIT', quantity: 12, unitCount: 0, seatingCapacity: 12 },
    ];
    const summary = computePackageSeating(reqs, 100);
    expect(summary.provided).toBe(100 + 108);
    expect(summary.shortage).toBe(0);
    expect(summary.status).toBe('SUFFICIENT');
    expect(summary.uncountedCategoryReqs).toBe(0);
  });

  it('reports a shortage when provided seats fall below the target', () => {
    const reqs: SeatingReq[] = [
      { quantityType: 'FIXED', quantity: 80, unitCount: 0, seatingCapacity: 1 },
    ];
    const summary = computePackageSeating(reqs, 100);
    expect(summary.provided).toBe(80);
    expect(summary.shortage).toBe(20);
    expect(summary.status).toBe('SHORTAGE');
  });

  it('skips and counts category-only requirements instead of estimating them', () => {
    const reqs: SeatingReq[] = [
      { quantityType: 'PER_GUEST', quantity: 1, unitCount: 0, seatingCapacity: 0, isCategoryOnly: true },
    ];
    const summary = computePackageSeating(reqs, 100);
    expect(summary.provided).toBe(0);
    expect(summary.uncountedCategoryReqs).toBe(1);
    expect(summary.status).toBe('SHORTAGE');
  });

  it('ignores non-seating items (seatingCapacity 0) without counting them as uncounted categories', () => {
    const reqs: SeatingReq[] = [
      { quantityType: 'FIXED', quantity: 4, unitCount: 0, seatingCapacity: 0 }, // 4 AC units
      { quantityType: 'PER_GUEST', quantity: 1, unitCount: 0, seatingCapacity: 1 },
    ];
    const summary = computePackageSeating(reqs, 50);
    expect(summary.provided).toBe(50);
    expect(summary.uncountedCategoryReqs).toBe(0);
  });
});

describe('computeBookingPackageCapacityGap', () => {
  it('returns the gap when the guest count exceeds the package capacity', () => {
    expect(computeBookingPackageCapacityGap(120, 100)).toEqual({
      exceeds: true,
      guestCount: 120,
      packageCapacity: 100,
      additionalCapacityRequired: 20,
    });
  });

  it('returns null when the guest count is within the package capacity', () => {
    expect(computeBookingPackageCapacityGap(80, 100)).toBeNull();
    expect(computeBookingPackageCapacityGap(100, 100)).toBeNull();
  });

  it('returns null when the package has no declared capacity', () => {
    expect(computeBookingPackageCapacityGap(120, null)).toBeNull();
    expect(computeBookingPackageCapacityGap(120, 0)).toBeNull();
  });
});
