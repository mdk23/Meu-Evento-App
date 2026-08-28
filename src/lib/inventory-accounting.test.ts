import { describe, it, expect } from 'vitest';
import { computeInventoryStockSummary } from './inventory-accounting';

describe('computeInventoryStockSummary', () => {
  it('reservedQuantity sums only active-status, non-reused resources', () => {
    const summary = computeInventoryStockSummary(
      500,
      [
        { reservedQuantity: 300, status: 'RESERVED', reusedFromResourceId: null },
        { reservedQuantity: 100, status: 'IN_USE', reusedFromResourceId: null },
        { reservedQuantity: 50, status: 'RELEASED', reusedFromResourceId: null },
        { reservedQuantity: 20, status: 'RESERVED', reusedFromResourceId: 'other-resource' },
      ],
      []
    );
    expect(summary.reservedQuantity.toNumber()).toBe(400);
    expect(summary.availableQuantity.toNumber()).toBe(100);
  });

  it('availableQuantity never goes negative even if overbooked', () => {
    const summary = computeInventoryStockSummary(100, [{ reservedQuantity: 150, status: 'RESERVED', reusedFromResourceId: null }], []);
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

  it('sums damaged and lost independently, and missingQuantity is their sum', () => {
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
    expect(summary.missingQuantity.toNumber()).toBe(7);
  });

  it('CONFIRMED and ISSUED resources count toward reservedQuantity (they still hold stock)', () => {
    const summary = computeInventoryStockSummary(
      500,
      [
        { reservedQuantity: 120, status: 'CONFIRMED', reusedFromResourceId: null },
        { reservedQuantity: 80, status: 'ISSUED', reusedFromResourceId: null },
      ],
      []
    );
    expect(summary.reservedQuantity.toNumber()).toBe(200);
    expect(summary.availableQuantity.toNumber()).toBe(300);
  });

  it('issuedQuantity is ISSUE minus USE/RETURN reversals; returnedQuantity sums RETURN', () => {
    const summary = computeInventoryStockSummary(
      500,
      [],
      [
        { type: 'ISSUE', quantity: 120 },
        { type: 'USE', quantity: 90 },
        { type: 'RETURN', quantity: 118 },
      ]
    );
    expect(summary.issuedQuantity.toNumber()).toBe(0); // 120 - (90 + 118), floored at 0
    expect(summary.returnedQuantity.toNumber()).toBe(118);
  });
});
