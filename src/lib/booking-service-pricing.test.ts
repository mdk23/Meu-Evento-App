import { describe, it, expect } from 'vitest';
import { resolveLineAmounts } from './booking-service-pricing';

describe('resolveLineAmounts', () => {
  it('holds sellingPrice === unitPrice * quantity for a fixed-price multi-unit line', () => {
    const result = resolveLineAmounts({ price: 1000, quantity: 10, totalPrice: 10000 });
    expect(result).toEqual({ quantity: 10, unitPrice: 1000, sellingPrice: 10000 });
    expect(result.unitPrice * result.quantity).toBe(result.sellingPrice);
  });

  it('defaults quantity to 1 when omitted', () => {
    const result = resolveLineAmounts({ price: 500, totalPrice: 500 });
    expect(result.quantity).toBe(1);
    expect(result.unitPrice * result.quantity).toBe(result.sellingPrice);
  });

  it('derives unitPrice from the total when only totalPrice and quantity are given', () => {
    const result = resolveLineAmounts({ quantity: 4, totalPrice: 800 });
    expect(result).toEqual({ quantity: 4, unitPrice: 200, sellingPrice: 800 });
    expect(result.unitPrice * result.quantity).toBe(result.sellingPrice);
  });

  it('falls back to price as the total when totalPrice is missing', () => {
    const result = resolveLineAmounts({ price: 250, quantity: 1 });
    expect(result).toEqual({ quantity: 1, unitPrice: 250, sellingPrice: 250 });
  });

  it('resolves everything to zero for an empty line', () => {
    const result = resolveLineAmounts({});
    expect(result).toEqual({ quantity: 1, unitPrice: 0, sellingPrice: 0 });
  });

  it('carries a package price override through as the unit price and total (Phase 4)', () => {
    // POS sends `price` = PackageItem.priceOverride and `totalPrice` = override * quantity.
    const override = 25000;
    const result = resolveLineAmounts({ price: override, quantity: 3, totalPrice: override * 3 });
    expect(result.unitPrice).toBe(override);
    expect(result.sellingPrice).toBe(override * 3);
    expect(result.unitPrice * result.quantity).toBe(result.sellingPrice);
  });
});
