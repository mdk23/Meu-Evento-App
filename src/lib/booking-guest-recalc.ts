import { QuantityTypeLike } from './service-inventory-requirements';

/**
 * Guest-count semantics for a booking's service lines (prompt-2 §2/§13C/§24/§25/§34):
 *
 * - A line added straight from the catalog (`source: 'DIRECT'`) scales with the booking's guest
 *   count when its pricing/quantity rule says so.
 * - A line exploded out of an applied Package (`source: 'PACKAGE'`) is FROZEN at the quantities it
 *   was sold with — changing the booking's guest count never silently rewrites it. The operator
 *   covers any gap by adding a separate (DIRECT) service; the POS shows a capacity warning instead.
 * - `MANUAL` requirements are operator-owned and never auto-recalculated, DIRECT or not.
 *
 * Both functions are pure — no DB access.
 */

export interface RecalcLine {
  source: 'DIRECT' | 'PACKAGE';
  priceType: 'FIXED' | 'PER_GUEST' | 'PER_HOUR' | 'PER_UNIT';
  quantity: number;
  unitPrice: number;
}

/**
 * Returns a new list where only `DIRECT` + `PER_GUEST` lines have been rescaled to `guestCount`
 * (quantity and total recomputed). `PACKAGE` lines and every non-`PER_GUEST` line are returned
 * untouched (referentially identical).
 */
export function recalcLinesForGuestCount<T extends RecalcLine>(lines: T[], guestCount: number): T[] {
  return lines.map((line) => {
    if (line.source === 'PACKAGE' || line.priceType !== 'PER_GUEST') return line;
    return { ...line, quantity: guestCount };
  });
}

export interface ResourceRecalcInput {
  source: 'DIRECT' | 'PACKAGE';
  quantityType: QuantityTypeLike;
}

/**
 * True only when a `BookingServiceResource`'s `requiredQuantity` should be recomputed because the
 * booking's guest count changed: the line is `DIRECT` and the rule is guest-driven
 * (`PER_GUEST` or `GUESTS_PER_UNIT`). Never for `PACKAGE` lines (frozen), and never for
 * `FIXED` / `PER_UNIT` / `MANUAL` rules (guest count is irrelevant or operator-owned).
 */
export function shouldRecalcResourceOnGuestChange(r: ResourceRecalcInput): boolean {
  if (r.source !== 'DIRECT') return false;
  return r.quantityType === 'PER_GUEST' || r.quantityType === 'GUESTS_PER_UNIT';
}
