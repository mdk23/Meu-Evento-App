import { describe, it, expect } from 'vitest';
import { computeEventResourceSummary } from './event-resource-summary';

const labels = { 'space-service': 'Venue Rental', 'event-service': 'Decoration' };

describe('computeEventResourceSummary', () => {
  it("aggregates two services' resources for the same item into one row", () => {
    const resources = [
      { bookingServiceId: 'space-service', inventoryItemId: 'chair', itemNameSnapshot: 'Chair', categoryName: null, requiredQuantity: 300, reservedQuantity: 300, status: 'RESERVED' as const, reusedFromResourceId: null },
      { bookingServiceId: 'event-service', inventoryItemId: 'chair', itemNameSnapshot: 'Chair', categoryName: null, requiredQuantity: 100, reservedQuantity: 100, status: 'RESERVED' as const, reusedFromResourceId: null },
    ];
    const rows = computeEventResourceSummary(resources, { chair: 200 }, labels);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ required: 400, provided: 400, additional: 0, reserved: 400, sources: ['Venue Rental', 'Decoration'] });
  });

  it('marks a fully-provided row FULFILLED', () => {
    const resources = [
      { bookingServiceId: 'space-service', inventoryItemId: 'chair', itemNameSnapshot: 'Chair', categoryName: null, requiredQuantity: 300, reservedQuantity: 300, status: 'RESERVED' as const, reusedFromResourceId: null },
    ];
    const rows = computeEventResourceSummary(resources, { chair: 0 }, labels);
    expect(rows[0].status).toBe('FULFILLED');
    expect(rows[0].additional).toBe(0);
  });

  it('marks a coverable shortfall PENDING when enough tenant-wide stock remains', () => {
    const resources = [
      { bookingServiceId: 'event-service', inventoryItemId: 'chair', itemNameSnapshot: 'Chair', categoryName: null, requiredQuantity: 100, reservedQuantity: 0, status: 'PLANNED' as const, reusedFromResourceId: null },
    ];
    const rows = computeEventResourceSummary(resources, { chair: 150 }, labels);
    expect(rows[0]).toMatchObject({ additional: 100, available: 150, status: 'PENDING' });
  });

  it('marks an uncoverable shortfall SHORTAGE', () => {
    const resources = [
      { bookingServiceId: 'event-service', inventoryItemId: 'chair', itemNameSnapshot: 'Chair', categoryName: null, requiredQuantity: 100, reservedQuantity: 0, status: 'PLANNED' as const, reusedFromResourceId: null },
    ];
    const rows = computeEventResourceSummary(resources, { chair: 20 }, labels);
    expect(rows[0]).toMatchObject({ additional: 100, available: 20, status: 'SHORTAGE' });
  });

  it('marks a category-based unresolved row UNRESOLVED with a null available and "Any {category}" label', () => {
    const resources = [
      { bookingServiceId: 'event-service', inventoryItemId: null, itemNameSnapshot: null, categoryName: 'Furniture', requiredQuantity: 20, reservedQuantity: 0, status: 'PLANNED' as const, reusedFromResourceId: null },
    ];
    const rows = computeEventResourceSummary(resources, {}, labels);
    expect(rows[0]).toMatchObject({ itemLabel: 'Any Furniture', available: null, status: 'UNRESOLVED', reserved: 0 });
  });

  it('excludes released resources from the Reserved column', () => {
    const resources = [
      { bookingServiceId: 'space-service', inventoryItemId: 'chair', itemNameSnapshot: 'Chair', categoryName: null, requiredQuantity: 50, reservedQuantity: 50, status: 'RESERVED' as const, reusedFromResourceId: null },
      { bookingServiceId: 'other-service', inventoryItemId: 'chair', itemNameSnapshot: 'Chair', categoryName: null, requiredQuantity: 0, reservedQuantity: 999, status: 'RELEASED' as const, reusedFromResourceId: null },
    ];
    const rows = computeEventResourceSummary(resources, { chair: 0 }, labels);
    expect(rows[0].reserved).toBe(50);
  });

  it('excludes a reused row from the Reserved column, but still counts it in Provided', () => {
    const resources = [
      { bookingServiceId: 'space-service', inventoryItemId: 'chair', itemNameSnapshot: 'Chair', categoryName: null, requiredQuantity: 300, reservedQuantity: 300, status: 'RESERVED' as const, reusedFromResourceId: null },
      { bookingServiceId: 'event-service', inventoryItemId: 'chair', itemNameSnapshot: 'Chair', categoryName: null, requiredQuantity: 100, reservedQuantity: 100, status: 'RESERVED' as const, reusedFromResourceId: 'res-1' },
    ];
    const rows = computeEventResourceSummary(resources, { chair: 0 }, labels);
    expect(rows[0]).toMatchObject({ required: 400, provided: 400, reserved: 300 });
  });
});
