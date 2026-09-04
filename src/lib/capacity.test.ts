import { describe, it, expect } from 'vitest';
import { isOverCapacity, assertCapacityForConfirmation, CapacityExceededError } from './capacity';

describe('isOverCapacity', () => {
  it('is true once guest count exceeds venue capacity', () => {
    expect(isOverCapacity(501, 500)).toBe(true);
  });

  it('is false at exact capacity (boundary is inclusive)', () => {
    expect(isOverCapacity(500, 500)).toBe(false);
  });

  it('is false under capacity', () => {
    expect(isOverCapacity(100, 500)).toBe(false);
  });
});

describe('assertCapacityForConfirmation', () => {
  it('does not throw when under capacity, override or not', () => {
    expect(() => assertCapacityForConfirmation(100, 500, null)).not.toThrow();
    expect(() => assertCapacityForConfirmation(100, 500, 'unused reason')).not.toThrow();
  });

  it('throws CapacityExceededError when over capacity with no override reason', () => {
    expect(() => assertCapacityForConfirmation(600, 500, null)).toThrow(CapacityExceededError);
    expect(() => assertCapacityForConfirmation(600, 500, undefined)).toThrow(CapacityExceededError);
  });

  it('treats a whitespace-only override reason as no reason', () => {
    expect(() => assertCapacityForConfirmation(600, 500, '   ')).toThrow(CapacityExceededError);
  });

  it('does not throw when over capacity but a real override reason is on file', () => {
    expect(() => assertCapacityForConfirmation(600, 500, 'Client approved standing room')).not.toThrow();
  });
});
