import { Prisma } from '@prisma/client';

/**
 * Decimal-safe money helpers. `Prisma.Decimal` fields never support native `+`/`-`/`>` —
 * use these instead of raw arithmetic anywhere a monetary field is read back and combined
 * with another value. Convert to a plain number only at the very end, via `toDisplayNumber`,
 * right before the value goes into a `NextResponse.json(...)` response.
 */

export function toMoney(value: number | string | Prisma.Decimal | null | undefined): Prisma.Decimal {
  if (value === null || value === undefined || value === '') return new Prisma.Decimal(0);
  return new Prisma.Decimal(value);
}

/** Converts a Decimal to a plain number for the JSON response boundary. Never use the result for further server-side math. */
export function toDisplayNumber(value: Prisma.Decimal | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return value instanceof Prisma.Decimal ? value.toNumber() : value;
}

/** Sums a list of Decimal-coercible values without floating-point drift. */
export function sumMoney(values: Array<Prisma.Decimal | number | null | undefined>): Prisma.Decimal {
  return values.reduce<Prisma.Decimal>((total, v) => total.plus(toMoney(v ?? 0)), new Prisma.Decimal(0));
}

export function addMoney(a: Prisma.Decimal | number | null | undefined, b: Prisma.Decimal | number | null | undefined): Prisma.Decimal {
  return toMoney(a).plus(toMoney(b));
}

export function subtractMoney(a: Prisma.Decimal | number | null | undefined, b: Prisma.Decimal | number | null | undefined): Prisma.Decimal {
  return toMoney(a).minus(toMoney(b));
}

export function multiplyMoney(a: Prisma.Decimal | number | null | undefined, b: Prisma.Decimal | number | null | undefined): Prisma.Decimal {
  return toMoney(a).times(toMoney(b));
}

/** Clamps to zero — the common `Math.max(0, a - b)` "outstanding balance" pattern. */
export function subtractMoneyFloor0(a: Prisma.Decimal | number | null | undefined, b: Prisma.Decimal | number | null | undefined): Prisma.Decimal {
  const result = subtractMoney(a, b);
  return result.isNegative() ? new Prisma.Decimal(0) : result;
}

export function maxMoney(a: Prisma.Decimal | number | null | undefined, b: Prisma.Decimal | number | null | undefined): Prisma.Decimal {
  const da = toMoney(a);
  const db = toMoney(b);
  return da.greaterThan(db) ? da : db;
}

export function isMoneyGreaterThan(a: Prisma.Decimal | number | null | undefined, b: Prisma.Decimal | number | null | undefined): boolean {
  return toMoney(a).greaterThan(toMoney(b));
}

export function isMoneyGreaterThanOrEqual(a: Prisma.Decimal | number | null | undefined, b: Prisma.Decimal | number | null | undefined): boolean {
  return toMoney(a).greaterThanOrEqualTo(toMoney(b));
}

export function isMoneyPositive(a: Prisma.Decimal | number | null | undefined): boolean {
  return toMoney(a).greaterThan(0);
}

/** Type-level mirror of what `serializeDecimals` does at runtime, so callers get an accurate return type instead of the input type echoed back unchanged. */
export type DecimalToNumber<T> = T extends Prisma.Decimal
  ? number
  : T extends Date
  ? T
  : T extends Array<infer U>
  ? DecimalToNumber<U>[]
  : T extends object
  ? { [K in keyof T]: DecimalToNumber<T[K]> }
  : T;

/**
 * Deep-walks a value (Prisma query result, plain object, array) and converts every
 * `Prisma.Decimal` instance to a plain `number`. Use this on routes that pass raw Prisma
 * records straight through to `NextResponse.json(...)` rather than mapping into a DTO —
 * without it, `JSON.stringify` would serialize Decimal fields as strings (via `Decimal.toJSON`),
 * silently changing the API contract for every client component that reads them.
 */
export function serializeDecimals<T>(value: T): DecimalToNumber<T> {
  if (value instanceof Prisma.Decimal) {
    return value.toNumber() as DecimalToNumber<T>;
  }
  if (Array.isArray(value)) {
    return value.map((v) => serializeDecimals(v)) as DecimalToNumber<T>;
  }
  if (value instanceof Date) {
    return value as DecimalToNumber<T>;
  }
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
      result[key] = serializeDecimals(v);
    }
    return result as DecimalToNumber<T>;
  }
  return value as DecimalToNumber<T>;
}
