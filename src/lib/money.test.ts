import { describe, it, expect } from 'vitest';
import { Prisma } from '@prisma/client';
import {
  toMoney,
  toDisplayNumber,
  sumMoney,
  addMoney,
  subtractMoney,
  multiplyMoney,
  subtractMoneyFloor0,
  maxMoney,
  isMoneyGreaterThan,
  isMoneyGreaterThanOrEqual,
  isMoneyPositive,
  serializeDecimals,
} from './money';

describe('toMoney', () => {
  it('coerces null/undefined/empty string to zero', () => {
    expect(toMoney(null).toString()).toBe('0');
    expect(toMoney(undefined).toString()).toBe('0');
    expect(toMoney('').toString()).toBe('0');
  });

  it('coerces numbers, strings, and Decimals', () => {
    expect(toMoney(12.5).toString()).toBe('12.5');
    expect(toMoney('12.50').toString()).toBe('12.5');
    expect(toMoney(new Prisma.Decimal('7')).toString()).toBe('7');
  });
});

describe('toDisplayNumber', () => {
  it('returns 0 for null/undefined', () => {
    expect(toDisplayNumber(null)).toBe(0);
    expect(toDisplayNumber(undefined)).toBe(0);
  });

  it('passes plain numbers through and converts Decimal', () => {
    expect(toDisplayNumber(5)).toBe(5);
    expect(toDisplayNumber(new Prisma.Decimal('9.75'))).toBe(9.75);
  });
});

describe('sumMoney', () => {
  it('sums without floating-point drift (classic 0.1 + 0.2 case)', () => {
    expect(sumMoney([0.1, 0.2]).toString()).toBe('0.3');
  });

  it('treats null/undefined entries as zero', () => {
    expect(sumMoney([10, null, undefined, 5]).toString()).toBe('15');
  });

  it('returns zero for an empty list', () => {
    expect(sumMoney([]).toString()).toBe('0');
  });
});

describe('addMoney / subtractMoney / multiplyMoney', () => {
  it('adds two values', () => {
    expect(addMoney(10, 5).toString()).toBe('15');
  });

  it('subtracts and allows a negative result', () => {
    expect(subtractMoney(5, 10).toString()).toBe('-5');
  });

  it('multiplies two values', () => {
    expect(multiplyMoney(4, 2.5).toString()).toBe('10');
  });

  it('treats missing operands as zero', () => {
    expect(addMoney(undefined, 5).toString()).toBe('5');
    expect(subtractMoney(10, null).toString()).toBe('10');
  });
});

describe('subtractMoneyFloor0', () => {
  it('returns the difference when positive', () => {
    expect(subtractMoneyFloor0(10, 4).toString()).toBe('6');
  });

  it('clamps a negative difference to zero', () => {
    expect(subtractMoneyFloor0(4, 10).toString()).toBe('0');
  });

  it('returns zero (not negative zero) at exact equality', () => {
    const result = subtractMoneyFloor0(5, 5);
    expect(result.toString()).toBe('0');
    expect(result.isNegative()).toBe(false);
  });
});

describe('maxMoney', () => {
  it('returns whichever operand is larger', () => {
    expect(maxMoney(3, 7).toString()).toBe('7');
    expect(maxMoney(7, 3).toString()).toBe('7');
  });

  it('returns the shared value when equal', () => {
    expect(maxMoney(5, 5).toString()).toBe('5');
  });
});

describe('comparison helpers', () => {
  it('isMoneyGreaterThan is strict', () => {
    expect(isMoneyGreaterThan(5, 4)).toBe(true);
    expect(isMoneyGreaterThan(5, 5)).toBe(false);
    expect(isMoneyGreaterThan(4, 5)).toBe(false);
  });

  it('isMoneyGreaterThanOrEqual includes equality', () => {
    expect(isMoneyGreaterThanOrEqual(5, 5)).toBe(true);
    expect(isMoneyGreaterThanOrEqual(4, 5)).toBe(false);
  });

  it('isMoneyPositive is strict (zero is not positive)', () => {
    expect(isMoneyPositive(0.01)).toBe(true);
    expect(isMoneyPositive(0)).toBe(false);
    expect(isMoneyPositive(-1)).toBe(false);
    expect(isMoneyPositive(null)).toBe(false);
  });
});

describe('serializeDecimals', () => {
  it('converts a top-level Decimal to a number', () => {
    expect(serializeDecimals(new Prisma.Decimal('12.5'))).toBe(12.5);
  });

  it('deep-walks nested objects and arrays, converting every Decimal', () => {
    const input = {
      total: new Prisma.Decimal('100'),
      lines: [
        { price: new Prisma.Decimal('10'), name: 'A' },
        { price: new Prisma.Decimal('20'), name: 'B' },
      ],
    };
    expect(serializeDecimals(input)).toEqual({
      total: 100,
      lines: [
        { price: 10, name: 'A' },
        { price: 20, name: 'B' },
      ],
    });
  });

  it('leaves Dates untouched (does not treat them as plain objects)', () => {
    const date = new Date('2026-01-01T00:00:00.000Z');
    const result = serializeDecimals({ createdAt: date });
    expect(result.createdAt).toBe(date);
    expect(result.createdAt instanceof Date).toBe(true);
  });

  it('passes through null, plain numbers, and strings unchanged', () => {
    expect(serializeDecimals(null)).toBe(null);
    expect(serializeDecimals(42)).toBe(42);
    expect(serializeDecimals('hello')).toBe('hello');
  });
});
