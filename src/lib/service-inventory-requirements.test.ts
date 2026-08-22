import { describe, it, expect } from 'vitest';
import { resolveRequiredQuantity } from './service-inventory-requirements';

describe('resolveRequiredQuantity', () => {
  it('FIXED passes the template quantity through unchanged', () => {
    expect(resolveRequiredQuantity({ quantityType: 'FIXED', quantity: 300 }).toNumber()).toBe(300);
  });

  it('PER_GUEST multiplies the per-guest rate by guest count', () => {
    expect(resolveRequiredQuantity({ quantityType: 'PER_GUEST', quantity: 1, guestCount: 300 }).toNumber()).toBe(300);
  });

  it('PER_UNIT multiplies the per-unit rate by unit count', () => {
    expect(resolveRequiredQuantity({ quantityType: 'PER_UNIT', quantity: 10, unitCount: 10 }).toNumber()).toBe(100);
  });

  it('PER_GUEST with no guestCount resolves to zero, not NaN', () => {
    expect(resolveRequiredQuantity({ quantityType: 'PER_GUEST', quantity: 1 }).toNumber()).toBe(0);
  });
});
