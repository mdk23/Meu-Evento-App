import { Prisma } from '@prisma/client';
import { QuantityTypeLike, resolveRequiredQuantity } from './service-inventory-requirements';

/**
 * One inventory requirement of a package's services, flattened for the seating-sufficiency preview.
 * `seatingCapacity` is the item's seats-per-unit, read via `getSeatingCapacity(attributes, defs)`;
 * it is only meaningful when the requirement targets a concrete item (`isCategoryOnly` false).
 */
export interface SeatingReq {
  quantityType: QuantityTypeLike;
  /** The template's base quantity (per-guest rate, fixed count, seats-per-unit divisor, …). */
  quantity: number | Prisma.Decimal;
  /** The parent PackageItem's own unit count — drives PER_UNIT requirements. */
  unitCount: number;
  /** Seats per unit (from `getSeatingCapacity`); 0 for a non-seating item or an unresolved type. */
  seatingCapacity: number;
  /** True when the requirement names only a category (no specific variant chosen at catalog level),
   * so its real seating contribution can't be known until the booking picks an item. */
  isCategoryOnly?: boolean;
}

export interface PackageSeatingSummary {
  /** The package's intended guest count (`Package.capacity`). */
  target: number;
  /** Sum of resolved-quantity × seatingCapacity across every seating requirement. */
  provided: number;
  /** `max(target - provided, 0)`. */
  shortage: number;
  status: 'SUFFICIENT' | 'SHORTAGE';
  /** How many category-only requirements were skipped because their seating can't be known yet —
   * surfaced as a footnote so the preview reads as an honest under-count, not a guess. */
  uncountedCategoryReqs: number;
}

/**
 * Given a package's flattened seating requirements and its intended guest count, works out how many
 * seats the package actually provides at that capacity and whether that's enough (prompt-2 §4/§23).
 * Pure — no DB access. Every requirement is resolved against `targetCapacity` as the guest count, so
 * PER_GUEST/GUESTS_PER_UNIT rules scale to the package's design size. Category-only requirements are
 * skipped and counted, never estimated.
 */
export function computePackageSeating(reqs: SeatingReq[], targetCapacity: number): PackageSeatingSummary {
  let provided = 0;
  let uncountedCategoryReqs = 0;

  for (const req of reqs) {
    if (req.isCategoryOnly) {
      uncountedCategoryReqs += 1;
      continue;
    }
    if (req.seatingCapacity <= 0) continue;
    const resolvedQty = resolveRequiredQuantity({
      quantityType: req.quantityType,
      quantity: req.quantity,
      guestCount: targetCapacity,
      unitCount: req.unitCount,
    });
    provided += resolvedQty.toNumber() * req.seatingCapacity;
  }

  const target = Math.max(targetCapacity, 0);
  const shortage = Math.max(target - provided, 0);
  return {
    target,
    provided,
    shortage,
    status: shortage > 0 ? 'SHORTAGE' : 'SUFFICIENT',
    uncountedCategoryReqs,
  };
}

export interface PackageCapacityGap {
  exceeds: boolean;
  guestCount: number;
  packageCapacity: number;
  /** `max(guestCount - packageCapacity, 0)` — extra seats the operator needs to cover with
   * additional services. */
  additionalCapacityRequired: number;
}

/**
 * The "booking exceeds package capacity" check (prompt-2 §24). Returns null when the package has no
 * declared capacity, or when the booking's guest count is within it — i.e. only returns a value when
 * there is an actual gap worth warning about. Never modifies the package; the operator decides what
 * to add.
 */
export function computeBookingPackageCapacityGap(
  guestCount: number,
  packageCapacity: number | null | undefined
): PackageCapacityGap | null {
  if (packageCapacity == null || packageCapacity <= 0) return null;
  if (guestCount <= packageCapacity) return null;
  return {
    exceeds: true,
    guestCount,
    packageCapacity,
    additionalCapacityRequired: guestCount - packageCapacity,
  };
}

export interface SeatingGapItem {
  inventoryItemId: string | null;
  itemLabel: string;
  /** Resolved count of this seating item on the booking (chairs, tables, …). */
  units: number;
  /** Seats per unit (from `getSeatingCapacity`). */
  seatingCapacity: number;
}

export interface SeatingItemGap {
  inventoryItemId: string | null;
  itemLabel: string;
  units: number;
  /** `units × seatingCapacity`. */
  seatsProvided: number;
  guestCount: number;
  /** `seatsProvided − guestCount` — negative = short, positive = excess. */
  delta: number;
  direction: 'UNDER' | 'OVER';
}

/**
 * Per-seating-item comparison of the seats a booking's chairs/tables provide against its guest count.
 * One `SeatingItemGap` per already-grouped seating item (`seatingCapacity > 0`) whose seats don't
 * exactly match the guest count — under *or* over. Non-seating items and exact matches are omitted.
 * Combined across chairs + tables would be meaningless (a guest needs both), so callers group by
 * item first and this stays per-item. Pure — no DB access.
 */
export function computeBookingSeatingGaps(items: SeatingGapItem[], guestCount: number): SeatingItemGap[] {
  const gaps: SeatingItemGap[] = [];
  for (const it of items) {
    if (it.seatingCapacity <= 0) continue;
    const seatsProvided = it.units * it.seatingCapacity;
    const delta = seatsProvided - guestCount;
    if (delta === 0) continue;
    gaps.push({
      inventoryItemId: it.inventoryItemId,
      itemLabel: it.itemLabel,
      units: it.units,
      seatsProvided,
      guestCount,
      delta,
      direction: delta < 0 ? 'UNDER' : 'OVER',
    });
  }
  return gaps;
}
