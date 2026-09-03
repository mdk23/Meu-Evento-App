import { describe, it, expect } from 'vitest';
import { validateMatchCriteria, itemMatchesCriteria } from './inventory-type-match';
import type { AttributeDef } from './inventory-attributes';

const tableDefs: AttributeDef[] = [
  { key: 'shape', label: 'Shape', type: 'select', required: true, options: ['ROUND', 'RECTANGULAR', 'SQUARE'] },
  { key: 'seatingCapacity', label: 'Seating Capacity', type: 'number', required: true, min: 1 },
  { key: 'foldable', label: 'Foldable', type: 'boolean', required: false },
];

describe('validateMatchCriteria', () => {
  it('accepts null / empty', () => {
    expect(validateMatchCriteria(null, tableDefs)).toEqual({ ok: true, criteria: {} });
    expect(validateMatchCriteria({}, tableDefs)).toEqual({ ok: true, criteria: {} });
  });

  it('accepts an exact value + a numeric range', () => {
    const res = validateMatchCriteria({ shape: 'ROUND', seatingCapacity: { gte: 10 } }, tableDefs);
    expect(res).toEqual({ ok: true, criteria: { shape: 'ROUND', seatingCapacity: { gte: 10 } } });
  });

  it('rejects an unknown criterion key', () => {
    expect(validateMatchCriteria({ colour: 'Gold' }, tableDefs).ok).toBe(false);
  });

  it('rejects gte/lte on a non-number attribute', () => {
    expect(validateMatchCriteria({ shape: { gte: 1 } }, tableDefs).ok).toBe(false);
  });

  it('rejects a select value outside the options', () => {
    expect(validateMatchCriteria({ shape: 'OVAL' }, tableDefs).ok).toBe(false);
  });

  it('rejects a wrong-typed value', () => {
    expect(validateMatchCriteria({ seatingCapacity: 'lots' }, tableDefs).ok).toBe(false);
    expect(validateMatchCriteria({ foldable: 'yes' }, tableDefs).ok).toBe(false);
  });
});

describe('itemMatchesCriteria', () => {
  const round18 = { shape: 'ROUND', seatingCapacity: 10 };
  const round24 = { shape: 'ROUND', seatingCapacity: 12 };
  const rect = { shape: 'RECTANGULAR', seatingCapacity: 10 };

  it('null / empty criteria always match', () => {
    expect(itemMatchesCriteria(round18, null)).toBe(true);
    expect(itemMatchesCriteria(round18, {})).toBe(true);
  });

  it('ROUND ∧ seatingCapacity ≥ 10 accepts both round tables, rejects the rectangular', () => {
    const c = { shape: 'ROUND', seatingCapacity: { gte: 10 } };
    expect(itemMatchesCriteria(round18, c)).toBe(true);
    expect(itemMatchesCriteria(round24, c)).toBe(true);
    expect(itemMatchesCriteria(rect, c)).toBe(false);
  });

  it('a missing attribute fails its criterion', () => {
    expect(itemMatchesCriteria({ shape: 'ROUND' }, { seatingCapacity: { gte: 1 } })).toBe(false);
    expect(itemMatchesCriteria({}, { shape: 'ROUND' })).toBe(false);
  });

  it('lte and exact-number criteria', () => {
    expect(itemMatchesCriteria(round24, { seatingCapacity: { lte: 10 } })).toBe(false);
    expect(itemMatchesCriteria(round18, { seatingCapacity: 10 })).toBe(true);
    expect(itemMatchesCriteria(round18, { seatingCapacity: 8 })).toBe(false);
  });

  it('in criterion and boolean criterion', () => {
    expect(itemMatchesCriteria(round18, { shape: { in: ['ROUND', 'SQUARE'] } })).toBe(true);
    expect(itemMatchesCriteria(rect, { shape: { in: ['ROUND', 'SQUARE'] } })).toBe(false);
    expect(itemMatchesCriteria({ ...round18, foldable: true }, { foldable: true })).toBe(true);
    expect(itemMatchesCriteria({ ...round18, foldable: false }, { foldable: true })).toBe(false);
  });

  it('multiselect attribute matches when it contains the criterion value(s)', () => {
    expect(itemMatchesCriteria({ tags: ['premium', 'outdoor'] }, { tags: 'outdoor' })).toBe(true);
    expect(itemMatchesCriteria({ tags: ['premium'] }, { tags: { in: ['outdoor', 'indoor'] } })).toBe(false);
  });
});
