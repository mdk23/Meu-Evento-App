import { describe, it, expect } from 'vitest';
import { computeReuseCandidatesForRequirement } from './reuse-candidates';

const labels = { 'space-service': 'Venue Rental', 'event-service': 'Decoration' };

describe('computeReuseCandidatesForRequirement', () => {
  it('returns nothing for a category-based row that has not resolved to an item yet', () => {
    const result = computeReuseCandidatesForRequirement(
      { id: 'req-1', bookingServiceId: 'event-service', inventoryItemId: null, itemNameSnapshot: null, reservedQuantity: 0, status: 'PLANNED', reusedFromResourceId: null },
      [],
      labels
    );
    expect(result).toEqual([]);
  });

  it("finds another service's active resource for the same item, on a different bookingService", () => {
    const resources = [
      { id: 'res-1', bookingServiceId: 'space-service', inventoryItemId: 'chair', itemNameSnapshot: 'Gold Chiavari Chair', reservedQuantity: 300, status: 'RESERVED' as const, reusedFromResourceId: null },
      { id: 'req-1', bookingServiceId: 'event-service', inventoryItemId: 'chair', itemNameSnapshot: null, reservedQuantity: 0, status: 'PLANNED' as const, reusedFromResourceId: null },
    ];
    const result = computeReuseCandidatesForRequirement(resources[1], resources, labels);
    expect(result).toEqual([{ resourceId: 'res-1', itemName: 'Gold Chiavari Chair', serviceName: 'Venue Rental', availableToReuse: 300 }]);
  });

  it('excludes the same bookingService\'s own resource (reusing yourself makes no sense)', () => {
    const resources = [
      { id: 'res-1', bookingServiceId: 'event-service', inventoryItemId: 'chair', itemNameSnapshot: 'Chair', reservedQuantity: 300, status: 'RESERVED' as const, reusedFromResourceId: null },
      { id: 'req-1', bookingServiceId: 'event-service', inventoryItemId: 'chair', itemNameSnapshot: null, reservedQuantity: 0, status: 'PLANNED' as const, reusedFromResourceId: null },
    ];
    const result = computeReuseCandidatesForRequirement(resources[1], resources, labels);
    expect(result).toEqual([]);
  });

  it('excludes released resources', () => {
    const resources = [
      { id: 'res-1', bookingServiceId: 'space-service', inventoryItemId: 'chair', itemNameSnapshot: 'Chair', reservedQuantity: 300, status: 'RELEASED' as const, reusedFromResourceId: null },
      { id: 'req-1', bookingServiceId: 'event-service', inventoryItemId: 'chair', itemNameSnapshot: null, reservedQuantity: 0, status: 'PLANNED' as const, reusedFromResourceId: null },
    ];
    const result = computeReuseCandidatesForRequirement(resources[1], resources, labels);
    expect(result).toEqual([]);
  });

  it('excludes a resource that is itself already reusing another one (no chained reuse)', () => {
    const resources = [
      { id: 'res-0', bookingServiceId: 'other-service', inventoryItemId: 'chair', itemNameSnapshot: 'Chair', reservedQuantity: 300, status: 'RESERVED' as const, reusedFromResourceId: null },
      { id: 'res-1', bookingServiceId: 'space-service', inventoryItemId: 'chair', itemNameSnapshot: 'Chair', reservedQuantity: 100, status: 'RESERVED' as const, reusedFromResourceId: 'res-0' },
      { id: 'req-1', bookingServiceId: 'event-service', inventoryItemId: 'chair', itemNameSnapshot: null, reservedQuantity: 0, status: 'PLANNED' as const, reusedFromResourceId: null },
    ];
    const result = computeReuseCandidatesForRequirement(resources[2], resources, labels);
    expect(result.map((c) => c.resourceId)).toEqual(['res-0']);
  });

  it('subtracts what other resources already claimed from the same target (partial-reuse math)', () => {
    const resources = [
      { id: 'res-1', bookingServiceId: 'space-service', inventoryItemId: 'chair', itemNameSnapshot: 'Chair', reservedQuantity: 300, status: 'RESERVED' as const, reusedFromResourceId: null },
      { id: 'res-2', bookingServiceId: 'other-service', inventoryItemId: 'chair', itemNameSnapshot: 'Chair', reservedQuantity: 200, status: 'RESERVED' as const, reusedFromResourceId: 'res-1' },
      { id: 'req-1', bookingServiceId: 'event-service', inventoryItemId: 'chair', itemNameSnapshot: null, reservedQuantity: 0, status: 'PLANNED' as const, reusedFromResourceId: null },
    ];
    const result = computeReuseCandidatesForRequirement(resources[2], resources, labels);
    expect(result).toEqual([{ resourceId: 'res-1', itemName: 'Chair', serviceName: 'Venue Rental', availableToReuse: 100 }]);
  });

  it('excludes a target already fully claimed by other resources', () => {
    const resources = [
      { id: 'res-1', bookingServiceId: 'space-service', inventoryItemId: 'chair', itemNameSnapshot: 'Chair', reservedQuantity: 300, status: 'RESERVED' as const, reusedFromResourceId: null },
      { id: 'res-2', bookingServiceId: 'other-service', inventoryItemId: 'chair', itemNameSnapshot: 'Chair', reservedQuantity: 300, status: 'RESERVED' as const, reusedFromResourceId: 'res-1' },
      { id: 'req-1', bookingServiceId: 'event-service', inventoryItemId: 'chair', itemNameSnapshot: null, reservedQuantity: 0, status: 'PLANNED' as const, reusedFromResourceId: null },
    ];
    const result = computeReuseCandidatesForRequirement(resources[2], resources, labels);
    expect(result).toEqual([]);
  });

  it('counts the row\'s own prior claim on the same target — reuse is an increment, not a replace', () => {
    // req-1 already claimed 100 of res-1's 300 via an earlier reuse call. A second reuse call
    // against the same pair must be capped by what's left *after* that own prior claim (200), not
    // the target's full 300 — otherwise two calls could together exceed the target.
    const resources = [
      { id: 'res-1', bookingServiceId: 'space-service', inventoryItemId: 'chair', itemNameSnapshot: 'Chair', reservedQuantity: 300, status: 'RESERVED' as const, reusedFromResourceId: null },
      { id: 'req-1', bookingServiceId: 'event-service', inventoryItemId: 'chair', itemNameSnapshot: 'Chair', reservedQuantity: 100, status: 'RESERVED' as const, reusedFromResourceId: 'res-1' },
    ];
    const result = computeReuseCandidatesForRequirement(resources[1], resources, labels);
    expect(result).toEqual([{ resourceId: 'res-1', itemName: 'Chair', serviceName: 'Venue Rental', availableToReuse: 200 }]);
  });
});
