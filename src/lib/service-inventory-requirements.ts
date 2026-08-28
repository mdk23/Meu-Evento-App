import { Prisma } from '@prisma/client';

export type QuantityTypeLike = 'FIXED' | 'PER_GUEST' | 'PER_UNIT' | 'GUESTS_PER_UNIT' | 'MANUAL';

export interface ResolveRequiredQuantityInput {
  quantityType: QuantityTypeLike;
  /** The template's base quantity — e.g. "1" for PER_GUEST, "10" for a PER_UNIT napkins-per-table
   * rate, "12" for a GUESTS_PER_UNIT seats-per-table divisor, or a starting default for MANUAL. */
  quantity: number | Prisma.Decimal;
  /** Booking's guest count — used when quantityType is PER_GUEST or GUESTS_PER_UNIT. */
  guestCount?: number;
  /** How many units of the parent line this scales against — used only when quantityType is PER_UNIT
   * (e.g. table count for "10 napkins per table"). */
  unitCount?: number;
}

/**
 * Resolves a `ServiceInventoryRequirement` template's quantity onto an actual booking (§4):
 * FIXED passes the template quantity through unchanged; PER_GUEST multiplies by guest count;
 * PER_UNIT multiplies by a caller-supplied unit count (e.g. table count); GUESTS_PER_UNIT is
 * CEILING(guestCount / quantity) where `quantity` is seats-per-unit (e.g. 1 table per 12 guests);
 * MANUAL passes `quantity` through as an editable starting default — callers must never
 * auto-recalculate a MANUAL row (the booking operator owns that number). Pure — no DB access — so
 * the auto-seed write path can call it, and it can be unit-tested directly.
 */
export function resolveRequiredQuantity(input: ResolveRequiredQuantityInput): Prisma.Decimal {
  const base = new Prisma.Decimal(input.quantity);
  switch (input.quantityType) {
    case 'FIXED':
      return base;
    case 'PER_GUEST':
      return base.times(input.guestCount ?? 0);
    case 'PER_UNIT':
      return base.times(input.unitCount ?? 0);
    case 'GUESTS_PER_UNIT':
      // `base` is seats-per-unit — a non-positive divisor can't yield a meaningful count.
      return base.lessThanOrEqualTo(0)
        ? new Prisma.Decimal(0)
        : new Prisma.Decimal(input.guestCount ?? 0).dividedBy(base).ceil();
    case 'MANUAL':
      return base;
    default:
      return base;
  }
}
