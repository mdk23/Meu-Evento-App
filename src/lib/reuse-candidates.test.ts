import { describe, it, expect } from 'vitest';
import { computeReuseCandidatesForRequirement } from './reuse-candidates';

const labels = { 'space-service': 'Venue Rental', 'event-service': 'Decoration' };

describe('computeReuseCandidatesForRequirement', () => {
  it('returns nothing for a category-based requirement that has not resolved to an item yet', () => {
    const result = computeReuseCandidatesForRequirement(
      { id: 'req-1', bookingServiceId: 'event-service', inventoryItemId: null, reuseReservationId: null, providedQuantity: 0 },
      [],
      [],
      labels
    );
    expect(result).toEqual([]);
  });

  it('finds another service\'s active reservation for the same item, on a different bookingService', () => {
    const reservations = [
      { id: 'res-1', inventoryItemId: 'chair', bookingServiceId: 'space-service', quantity: 300, status: 'HELD' as const, itemNameSnapshot: 'Gold Chiavari Chair' },
    ];
    const result = computeReuseCandidatesForRequirement(
      { id: 'req-1', bookingServiceId: 'event-service', inventoryItemId: 'chair', reuseReservationId: null, providedQuantity: 0 },
      reservations,
      [],
      labels
    );
    expect(result).toEqual([{ reservationId: 'res-1', itemName: 'Gold Chiavari Chair', serviceName: 'Venue Rental', availableToReuse: 300 }]);
  });

  it('excludes the same bookingService\'s own reservation (reusing yourself makes no sense)', () => {
    const reservations = [
      { id: 'res-1', inventoryItemId: 'chair', bookingServiceId: 'event-service', quantity: 300, status: 'HELD' as const, itemNameSnapshot: 'Chair' },
    ];
    const result = computeReuseCandidatesForRequirement(
      { id: 'req-1', bookingServiceId: 'event-service', inventoryItemId: 'chair', reuseReservationId: null, providedQuantity: 0 },
      reservations,
      [],
      labels
    );
    expect(result).toEqual([]);
  });

  it('excludes released/cancelled reservations', () => {
    const reservations = [
      { id: 'res-1', inventoryItemId: 'chair', bookingServiceId: 'space-service', quantity: 300, status: 'RELEASED' as const, itemNameSnapshot: 'Chair' },
    ];
    const result = computeReuseCandidatesForRequirement(
      { id: 'req-1', bookingServiceId: 'event-service', inventoryItemId: 'chair', reuseReservationId: null, providedQuantity: 0 },
      reservations,
      [],
      labels
    );
    expect(result).toEqual([]);
  });

  it('subtracts what other requirements already claimed from the same reservation (§29 partial-reuse math)', () => {
    const reservations = [
      { id: 'res-1', inventoryItemId: 'chair', bookingServiceId: 'space-service', quantity: 300, status: 'HELD' as const, itemNameSnapshot: 'Chair' },
    ];
    const requirements = [
      { id: 'req-2', bookingServiceId: 'other-service', inventoryItemId: 'chair', reuseReservationId: 'res-1', providedQuantity: 200 },
    ];
    const result = computeReuseCandidatesForRequirement(
      { id: 'req-1', bookingServiceId: 'event-service', inventoryItemId: 'chair', reuseReservationId: null, providedQuantity: 0 },
      reservations,
      requirements,
      labels
    );
    expect(result).toEqual([{ reservationId: 'res-1', itemName: 'Chair', serviceName: 'Venue Rental', availableToReuse: 100 }]);
  });

  it('excludes a reservation already fully claimed by other requirements', () => {
    const reservations = [
      { id: 'res-1', inventoryItemId: 'chair', bookingServiceId: 'space-service', quantity: 300, status: 'HELD' as const, itemNameSnapshot: 'Chair' },
    ];
    const requirements = [
      { id: 'req-2', bookingServiceId: 'other-service', inventoryItemId: 'chair', reuseReservationId: 'res-1', providedQuantity: 300 },
    ];
    const result = computeReuseCandidatesForRequirement(
      { id: 'req-1', bookingServiceId: 'event-service', inventoryItemId: 'chair', reuseReservationId: null, providedQuantity: 0 },
      reservations,
      requirements,
      labels
    );
    expect(result).toEqual([]);
  });

  it('counts the requirement\'s own prior claim on the same reservation — reuse is an increment, not a replace', () => {
    // req-1 already claimed 100 of res-1's 300 via an earlier reuse call. A second reuse call
    // against the same pair must be capped by what's left *after* that own prior claim (200), not
    // the reservation's full 300 — otherwise two calls could together exceed the reservation.
    const reservations = [
      { id: 'res-1', inventoryItemId: 'chair', bookingServiceId: 'space-service', quantity: 300, status: 'HELD' as const, itemNameSnapshot: 'Chair' },
    ];
    const requirements = [
      { id: 'req-1', bookingServiceId: 'event-service', inventoryItemId: 'chair', reuseReservationId: 'res-1', providedQuantity: 100 },
    ];
    const result = computeReuseCandidatesForRequirement(
      requirements[0],
      reservations,
      requirements,
      labels
    );
    expect(result).toEqual([{ reservationId: 'res-1', itemName: 'Chair', serviceName: 'Venue Rental', availableToReuse: 200 }]);
  });
});
