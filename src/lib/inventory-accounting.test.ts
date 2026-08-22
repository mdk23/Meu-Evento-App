import { describe, it, expect } from 'vitest';
import { computeInventoryStockSummary } from './inventory-accounting';

describe('computeInventoryStockSummary', () => {
  it('reservedQuantity sums only active-status reservations', () => {
    const summary = computeInventoryStockSummary(
      500,
      [
        { quantity: 300, status: 'HELD' },
        { quantity: 100, status: 'CONFIRMED' },
        { quantity: 50, status: 'RELEASED' },
        { quantity: 20, status: 'CANCELLED' },
      ],
      []
    );
    expect(summary.reservedQuantity.toNumber()).toBe(400);
    expect(summary.availableQuantity.toNumber()).toBe(100);
  });

  it('availableQuantity never goes negative even if overbooked', () => {
    const summary = computeInventoryStockSummary(100, [{ quantity: 150, status: 'HELD' }], []);
    expect(summary.availableQuantity.toNumber()).toBe(0);
  });

  it('allocatedQuantity is ALLOCATE minus USE/RETURN reversals', () => {
    const summary = computeInventoryStockSummary(
      500,
      [],
      [
        { type: 'ALLOCATE', quantity: 280 },
        { type: 'USE', quantity: 200 },
      ]
    );
    expect(summary.allocatedQuantity.toNumber()).toBe(80);
    expect(summary.usedQuantity.toNumber()).toBe(200);
  });

  it('sums damaged and lost independently', () => {
    const summary = computeInventoryStockSummary(
      500,
      [],
      [
        { type: 'DAMAGE', quantity: 5 },
        { type: 'LOSS', quantity: 2 },
      ]
    );
    expect(summary.damagedQuantity.toNumber()).toBe(5);
    expect(summary.lostQuantity.toNumber()).toBe(2);
  });
});
