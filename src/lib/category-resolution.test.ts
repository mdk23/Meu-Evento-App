import { describe, it, expect } from 'vitest';
import { canResolveResource, isItemEligibleForResource } from './category-resolution';

const categoryReq = { sourceRequirement: { categoryId: 'chairs' } };

describe('canResolveResource', () => {
  it('is true for an unresolved, non-terminal, category-seeded row', () => {
    expect(canResolveResource({ ...categoryReq, inventoryItemId: null, status: 'PLANNED' })).toBe(true);
    expect(canResolveResource({ ...categoryReq, inventoryItemId: null, status: 'RESERVED' })).toBe(true);
  });

  it('is false once a concrete item is already set', () => {
    expect(canResolveResource({ ...categoryReq, inventoryItemId: 'gold-chair', status: 'PLANNED' })).toBe(false);
  });

  it('is false for an item-based requirement (no categoryId)', () => {
    expect(canResolveResource({ sourceRequirement: { categoryId: null }, inventoryItemId: null, status: 'PLANNED' })).toBe(false);
    expect(canResolveResource({ sourceRequirement: null, inventoryItemId: null, status: 'PLANNED' })).toBe(false);
  });

  it('is false once the row is terminal', () => {
    expect(canResolveResource({ ...categoryReq, inventoryItemId: null, status: 'RELEASED' })).toBe(false);
    expect(canResolveResource({ ...categoryReq, inventoryItemId: null, status: 'RETURNED' })).toBe(false);
  });
});

describe('isItemEligibleForResource', () => {
  const resource = { ...categoryReq, inventoryItemId: null, status: 'PLANNED' };

  it('accepts an active same-tenant item in the requirement’s category', () => {
    expect(isItemEligibleForResource({ id: 'g', categoryId: 'chairs', tenantId: 't1', active: true }, resource, 't1')).toBe(true);
  });

  it('rejects an item from a different category', () => {
    expect(isItemEligibleForResource({ id: 'x', categoryId: 'tables', tenantId: 't1', active: true }, resource, 't1')).toBe(false);
  });

  it('rejects an item from a different tenant', () => {
    expect(isItemEligibleForResource({ id: 'g', categoryId: 'chairs', tenantId: 't2', active: true }, resource, 't1')).toBe(false);
  });

  it('rejects an inactive item', () => {
    expect(isItemEligibleForResource({ id: 'g', categoryId: 'chairs', tenantId: 't1', active: false }, resource, 't1')).toBe(false);
  });
});
