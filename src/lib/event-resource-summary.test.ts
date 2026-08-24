import { describe, it, expect } from 'vitest';
import { computeEventResourceSummary } from './event-resource-summary';

const labels = { 'space-service': 'Venue Rental', 'event-service': 'Decoration' };

describe('computeEventResourceSummary', () => {
  it('aggregates two services\' requirements for the same item into one row', () => {
    const requirements = [
      { bookingServiceId: 'space-service', inventoryItemId: 'chair', itemNameSnapshot: 'Chair', categoryName: null, requiredQuantity: 300, providedQuantity: 300 },
      { bookingServiceId: 'event-service', inventoryItemId: 'chair', itemNameSnapshot: 'Chair', categoryName: null, requiredQuantity: 100, providedQuantity: 100 },
    ];
    const reservations = [{ inventoryItemId: 'chair', quantity: 300, status: 'HELD' as const }];
    const rows = computeEventResourceSummary(requirements, reservations, { chair: 200 }, labels);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ required: 400, provided: 400, additional: 0, reserved: 300, sources: ['Venue Rental', 'Decoration'] });
  });

  it('marks a fully-provided row FULFILLED', () => {
    const requirements = [
      { bookingServiceId: 'space-service', inventoryItemId: 'chair', itemNameSnapshot: 'Chair', categoryName: null, requiredQuantity: 300, providedQuantity: 300 },
    ];
    const rows = computeEventResourceSummary(requirements, [], { chair: 0 }, labels);
    expect(rows[0].status).toBe('FULFILLED');
    expect(rows[0].additional).toBe(0);
  });

  it('marks a coverable shortfall PENDING when enough tenant-wide stock remains', () => {
    const requirements = [
      { bookingServiceId: 'event-service', inventoryItemId: 'chair', itemNameSnapshot: 'Chair', categoryName: null, requiredQuantity: 100, providedQuantity: 0 },
    ];
    const rows = computeEventResourceSummary(requirements, [], { chair: 150 }, labels);
    expect(rows[0]).toMatchObject({ additional: 100, available: 150, status: 'PENDING' });
  });

  it('marks an uncoverable shortfall SHORTAGE', () => {
    const requirements = [
      { bookingServiceId: 'event-service', inventoryItemId: 'chair', itemNameSnapshot: 'Chair', categoryName: null, requiredQuantity: 100, providedQuantity: 0 },
    ];
    const rows = computeEventResourceSummary(requirements, [], { chair: 20 }, labels);
    expect(rows[0]).toMatchObject({ additional: 100, available: 20, status: 'SHORTAGE' });
  });

  it('marks a category-based unresolved requirement UNRESOLVED with a null available and "Any {category}" label', () => {
    const requirements = [
      { bookingServiceId: 'event-service', inventoryItemId: null, itemNameSnapshot: null, categoryName: 'Furniture', requiredQuantity: 20, providedQuantity: 0 },
    ];
    const rows = computeEventResourceSummary(requirements, [], {}, labels);
    expect(rows[0]).toMatchObject({ itemLabel: 'Any Furniture', available: null, status: 'UNRESOLVED', reserved: 0 });
  });

  it('excludes released/cancelled reservations from the Reserved column', () => {
    const requirements = [
      { bookingServiceId: 'space-service', inventoryItemId: 'chair', itemNameSnapshot: 'Chair', categoryName: null, requiredQuantity: 50, providedQuantity: 50 },
    ];
    const reservations = [
      { inventoryItemId: 'chair', quantity: 50, status: 'HELD' as const },
      { inventoryItemId: 'chair', quantity: 999, status: 'RELEASED' as const },
    ];
    const rows = computeEventResourceSummary(requirements, reservations, { chair: 0 }, labels);
    expect(rows[0].reserved).toBe(50);
  });
});
