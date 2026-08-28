import { describe, it, expect } from 'vitest';
import { recalcLinesForGuestCount, shouldRecalcResourceOnGuestChange, RecalcLine } from './booking-guest-recalc';

const line = (over: Partial<RecalcLine>): RecalcLine => ({
  source: 'DIRECT',
  priceType: 'PER_GUEST',
  quantity: 100,
  unitPrice: 150,
  ...over,
});

describe('recalcLinesForGuestCount', () => {
  it('rescales a DIRECT PER_GUEST line to the new guest count', () => {
    const [result] = recalcLinesForGuestCount([line({ quantity: 100 })], 120);
    expect(result.quantity).toBe(120);
  });

  it('leaves a PACKAGE PER_GUEST line frozen', () => {
    const input = line({ source: 'PACKAGE', quantity: 100 });
    const [result] = recalcLinesForGuestCount([input], 120);
    expect(result).toBe(input);
    expect(result.quantity).toBe(100);
  });

  it('leaves a DIRECT non-PER_GUEST line untouched', () => {
    for (const priceType of ['FIXED', 'PER_HOUR', 'PER_UNIT'] as const) {
      const input = line({ priceType, quantity: 10 });
      const [result] = recalcLinesForGuestCount([input], 120);
      expect(result).toBe(input);
    }
  });
});

describe('shouldRecalcResourceOnGuestChange', () => {
  it('is true for DIRECT + PER_GUEST and DIRECT + GUESTS_PER_UNIT', () => {
    expect(shouldRecalcResourceOnGuestChange({ source: 'DIRECT', quantityType: 'PER_GUEST' })).toBe(true);
    expect(shouldRecalcResourceOnGuestChange({ source: 'DIRECT', quantityType: 'GUESTS_PER_UNIT' })).toBe(true);
  });

  it('is false for every PACKAGE combination', () => {
    for (const quantityType of ['FIXED', 'PER_GUEST', 'PER_UNIT', 'GUESTS_PER_UNIT', 'MANUAL'] as const) {
      expect(shouldRecalcResourceOnGuestChange({ source: 'PACKAGE', quantityType })).toBe(false);
    }
  });

  it('is false for DIRECT + FIXED / PER_UNIT / MANUAL', () => {
    expect(shouldRecalcResourceOnGuestChange({ source: 'DIRECT', quantityType: 'FIXED' })).toBe(false);
    expect(shouldRecalcResourceOnGuestChange({ source: 'DIRECT', quantityType: 'PER_UNIT' })).toBe(false);
    expect(shouldRecalcResourceOnGuestChange({ source: 'DIRECT', quantityType: 'MANUAL' })).toBe(false);
  });
});
