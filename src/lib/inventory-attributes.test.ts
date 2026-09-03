import { describe, it, expect } from 'vitest';
import {
  validateAttributeDefs,
  validateAttributeValues,
  getSeatingCapacity,
  readAttributeDefs,
  AttributeDef,
} from './inventory-attributes';

const chairDefs: AttributeDef[] = [
  { key: 'color', label: 'Color', type: 'select', required: true, options: ['Gold', 'White'] },
  { key: 'seatingCapacity', label: 'Seating Capacity', type: 'number', required: true, min: 0 },
  { key: 'stackable', label: 'Stackable', type: 'boolean', required: false },
];

describe('validateAttributeDefs', () => {
  it('accepts a well-formed definition array', () => {
    const res = validateAttributeDefs(chairDefs);
    expect(res.ok).toBe(true);
  });

  it('rejects a non-array', () => {
    expect(validateAttributeDefs({}).ok).toBe(false);
  });

  it('rejects duplicate keys', () => {
    const res = validateAttributeDefs([
      { key: 'color', label: 'A', type: 'text', required: false },
      { key: 'color', label: 'B', type: 'text', required: false },
    ]);
    expect(res).toMatchObject({ ok: false });
    if (!res.ok) expect(res.error).toMatch(/duplicate/i);
  });

  it('rejects a non-machine-safe key', () => {
    expect(validateAttributeDefs([{ key: 'Seat Capacity', label: 'X', type: 'text', required: false }]).ok).toBe(false);
    expect(validateAttributeDefs([{ key: '1color', label: 'X', type: 'text', required: false }]).ok).toBe(false);
  });

  it('rejects an unknown field type', () => {
    expect(validateAttributeDefs([{ key: 'x', label: 'X', type: 'colour', required: false }]).ok).toBe(false);
  });

  it('rejects select / multiselect without options', () => {
    expect(validateAttributeDefs([{ key: 'x', label: 'X', type: 'select', required: false }]).ok).toBe(false);
    expect(validateAttributeDefs([{ key: 'x', label: 'X', type: 'multiselect', required: false, options: [] }]).ok).toBe(false);
  });

  it('rejects duplicate options', () => {
    expect(
      validateAttributeDefs([{ key: 'x', label: 'X', type: 'select', required: false, options: ['A', 'A'] }]).ok
    ).toBe(false);
  });

  it('rejects min > max', () => {
    expect(
      validateAttributeDefs([{ key: 'x', label: 'X', type: 'number', required: false, min: 10, max: 5 }]).ok
    ).toBe(false);
  });

  it('readAttributeDefs returns [] on malformed input', () => {
    expect(readAttributeDefs('nope')).toEqual([]);
    expect(readAttributeDefs([{ key: 'x' }])).toEqual([]);
  });
});

describe('validateAttributeValues', () => {
  it('accepts valid values and returns only defined keys', () => {
    const res = validateAttributeValues({ color: 'Gold', seatingCapacity: 1, stackable: true, extraneous: 1 } as unknown, chairDefs);
    expect(res.ok).toBe(false); // unknown key rejected
  });

  it('round-trips a clean payload', () => {
    const res = validateAttributeValues({ color: 'Gold', seatingCapacity: 1 }, chairDefs);
    expect(res).toMatchObject({ ok: true, values: { color: 'Gold', seatingCapacity: 1 } });
  });

  it('rejects a missing required attribute', () => {
    expect(validateAttributeValues({ seatingCapacity: 1 }, chairDefs).ok).toBe(false); // color missing
  });

  it('rejects a select value not in options', () => {
    expect(validateAttributeValues({ color: 'Purple', seatingCapacity: 1 }, chairDefs).ok).toBe(false);
  });

  it('rejects a number below min', () => {
    const defs: AttributeDef[] = [{ key: 'cap', label: 'Cap', type: 'number', required: true, min: 1 }];
    expect(validateAttributeValues({ cap: 0 }, defs).ok).toBe(false);
    expect(validateAttributeValues({ cap: 5 }, defs).ok).toBe(true);
  });

  it('coerces numeric strings and validates', () => {
    const res = validateAttributeValues({ color: 'White', seatingCapacity: '2' }, chairDefs);
    expect(res).toMatchObject({ ok: true, values: { seatingCapacity: 2 } });
  });

  it('rejects a non-boolean for a boolean attribute', () => {
    expect(validateAttributeValues({ color: 'Gold', seatingCapacity: 1, stackable: 'yes' }, chairDefs).ok).toBe(false);
  });

  it('validates multiselect membership and rejects dupes', () => {
    const defs: AttributeDef[] = [{ key: 'tags', label: 'Tags', type: 'multiselect', required: false, options: ['a', 'b', 'c'] }];
    expect(validateAttributeValues({ tags: ['a', 'c'] }, defs).ok).toBe(true);
    expect(validateAttributeValues({ tags: ['a', 'z'] }, defs).ok).toBe(false);
    expect(validateAttributeValues({ tags: ['a', 'a'] }, defs).ok).toBe(false);
  });
});

describe('getSeatingCapacity', () => {
  it('returns the value when the type defines a numeric seatingCapacity', () => {
    expect(getSeatingCapacity({ seatingCapacity: 12 }, chairDefs)).toBe(12);
  });

  it('returns 0 when the type does not define seatingCapacity', () => {
    const napkinDefs: AttributeDef[] = [{ key: 'color', label: 'Color', type: 'text', required: false }];
    expect(getSeatingCapacity({ seatingCapacity: 12 }, napkinDefs)).toBe(0);
  });

  it('returns 0 for a non-positive or missing value', () => {
    expect(getSeatingCapacity({ seatingCapacity: 0 }, chairDefs)).toBe(0);
    expect(getSeatingCapacity({}, chairDefs)).toBe(0);
    expect(getSeatingCapacity(null, chairDefs)).toBe(0);
  });
});
