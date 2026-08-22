import { Prisma } from '@prisma/client';

export type QuantityTypeLike = 'FIXED' | 'PER_GUEST' | 'PER_UNIT';

export interface ResolveRequiredQuantityInput {
  quantityType: QuantityTypeLike;
  /** The template's base quantity — e.g. "1" for PER_GUEST, "10" for a PER_UNIT napkins-per-table rate. */
  quantity: number | Prisma.Decimal;
  /** Booking's guest count — used only when quantityType is PER_GUEST. */
  guestCount?: number;
  /** How many units of the parent line this scales against — used only when quantityType is PER_UNIT
   * (e.g. table count for "10 napkins per table"). */
  unitCount?: number;
}

/**
 * Resolves a `ServiceInventoryRequirement` template's quantity onto an actual booking (§4):
 * FIXED passes the template quantity through unchanged; PER_GUEST multiplies by guest count;
 * PER_UNIT multiplies by a caller-supplied unit count (e.g. table count). Pure — no DB access —
 * so the auto-seed write path (a later phase) can call it, and it can be unit-tested directly.
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
    default:
      return base;
  }
}
