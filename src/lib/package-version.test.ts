import { describe, it, expect } from 'vitest';
import { packageDefinitionChanged, PackageDefinitionSnapshot } from './package-version';

const base: PackageDefinitionSnapshot = {
  pricingMode: 'COMPUTED',
  price: null,
  capacity: 100,
  items: [
    { serviceId: 'a', quantity: 100, priceOverride: null },
    { serviceId: 'b', quantity: 9, priceOverride: 25000 },
  ],
};

const clone = (over: Partial<PackageDefinitionSnapshot>): PackageDefinitionSnapshot => ({
  ...base,
  ...over,
  items: over.items ?? base.items.map((i) => ({ ...i })),
});

describe('packageDefinitionChanged', () => {
  it('is false for an identical definition (item order does not matter)', () => {
    const reordered = clone({ items: [base.items[1], base.items[0]].map((i) => ({ ...i })) });
    expect(packageDefinitionChanged(base, reordered)).toBe(false);
  });

  it('is true when a service is added or removed', () => {
    const added = clone({ items: [...base.items.map((i) => ({ ...i })), { serviceId: 'c', quantity: 1, priceOverride: null }] });
    expect(packageDefinitionChanged(base, added)).toBe(true);
    const removed = clone({ items: [base.items[0]].map((i) => ({ ...i })) });
    expect(packageDefinitionChanged(base, removed)).toBe(true);
  });

  it('is true when a line quantity changes', () => {
    const q = clone({ items: base.items.map((i) => (i.serviceId === 'a' ? { ...i, quantity: 120 } : { ...i })) });
    expect(packageDefinitionChanged(base, q)).toBe(true);
  });

  it('is true when a price override is added, changed, or cleared', () => {
    const set = clone({ items: base.items.map((i) => (i.serviceId === 'a' ? { ...i, priceOverride: 30000 } : { ...i })) });
    expect(packageDefinitionChanged(base, set)).toBe(true);
    const cleared = clone({ items: base.items.map((i) => (i.serviceId === 'b' ? { ...i, priceOverride: null } : { ...i })) });
    expect(packageDefinitionChanged(base, cleared)).toBe(true);
  });

  it('is true when pricing mode, fixed price, or capacity changes', () => {
    expect(packageDefinitionChanged(base, clone({ pricingMode: 'FIXED', price: 90000 }))).toBe(true);
    expect(packageDefinitionChanged(base, clone({ capacity: 150 }))).toBe(true);
  });
});
