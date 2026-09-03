import { describe, it, expect } from 'vitest';
import { canResolveResource, isItemEligibleForResource } from './category-resolution';

const tableReq = {
  sourceRequirement: { inventoryTypeId: 'type-table', matchCriteria: { shape: 'ROUND', seatingCapacity: { gte: 10 } } },
};

describe('canResolveResource', () => {
  it('is true for an unresolved, non-terminal, type-seeded row', () => {
    expect(canResolveResource({ ...tableReq, inventoryItemId: null, status: 'PLANNED' })).toBe(true);
    expect(canResolveResource({ ...tableReq, inventoryItemId: null, status: 'RESERVED' })).toBe(true);
  });

  it('is false once a concrete item is already set', () => {
    expect(canResolveResource({ ...tableReq, inventoryItemId: 'round-1.8', status: 'PLANNED' })).toBe(false);
  });

  it('is false for an item-based requirement (no inventoryTypeId)', () => {
    expect(
      canResolveResource({ sourceRequirement: { inventoryTypeId: null, matchCriteria: null }, inventoryItemId: null, status: 'PLANNED' })
    ).toBe(false);
    expect(canResolveResource({ sourceRequirement: null, inventoryItemId: null, status: 'PLANNED' })).toBe(false);
  });

  it('is false once the row is terminal', () => {
    expect(canResolveResource({ ...tableReq, inventoryItemId: null, status: 'RELEASED' })).toBe(false);
    expect(canResolveResource({ ...tableReq, inventoryItemId: null, status: 'RETURNED' })).toBe(false);
  });
});

describe('isItemEligibleForResource', () => {
  const resource = { ...tableReq, inventoryItemId: null, status: 'PLANNED' };
  const roundBig = { id: 'r', inventoryTypeId: 'type-table', attributes: { shape: 'ROUND', seatingCapacity: 12 }, tenantId: 't1', active: true };

  it('accepts an active same-tenant item of the type whose attributes satisfy the criteria', () => {
    expect(isItemEligibleForResource(roundBig, resource, 't1')).toBe(true);
  });

  it('rejects an item of a different type', () => {
    expect(isItemEligibleForResource({ ...roundBig, inventoryTypeId: 'type-chair' }, resource, 't1')).toBe(false);
  });

  it("rejects an item of the right type that fails the match criteria", () => {
    expect(isItemEligibleForResource({ ...roundBig, attributes: { shape: 'RECTANGULAR', seatingCapacity: 12 } }, resource, 't1')).toBe(false);
    expect(isItemEligibleForResource({ ...roundBig, attributes: { shape: 'ROUND', seatingCapacity: 8 } }, resource, 't1')).toBe(false);
  });

  it('rejects an item from a different tenant', () => {
    expect(isItemEligibleForResource({ ...roundBig, tenantId: 't2' }, resource, 't1')).toBe(false);
  });

  it('rejects an inactive item', () => {
    expect(isItemEligibleForResource({ ...roundBig, active: false }, resource, 't1')).toBe(false);
  });
});
