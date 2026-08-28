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

  it('GUESTS_PER_UNIT rounds the guests / seats-per-unit division up', () => {
    expect(resolveRequiredQuantity({ quantityType: 'GUESTS_PER_UNIT', quantity: 12, guestCount: 100 }).toNumber()).toBe(9);
    expect(resolveRequiredQuantity({ quantityType: 'GUESTS_PER_UNIT', quantity: 12, guestCount: 120 }).toNumber()).toBe(10);
    expect(resolveRequiredQuantity({ quantityType: 'GUESTS_PER_UNIT', quantity: 12, guestCount: 121 }).toNumber()).toBe(11);
  });

  it('GUESTS_PER_UNIT with a non-positive divisor or no guestCount resolves to zero', () => {
    expect(resolveRequiredQuantity({ quantityType: 'GUESTS_PER_UNIT', quantity: 0, guestCount: 100 }).toNumber()).toBe(0);
    expect(resolveRequiredQuantity({ quantityType: 'GUESTS_PER_UNIT', quantity: 12 }).toNumber()).toBe(0);
  });

  it('MANUAL passes the template quantity through as a starting default, ignoring guest count', () => {
    expect(resolveRequiredQuantity({ quantityType: 'MANUAL', quantity: 40 }).toNumber()).toBe(40);
    expect(resolveRequiredQuantity({ quantityType: 'MANUAL', quantity: 40, guestCount: 999 }).toNumber()).toBe(40);
  });
});
