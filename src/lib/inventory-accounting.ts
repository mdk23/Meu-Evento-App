import { Prisma } from '@prisma/client';
import { ACTIVE_RESOURCE_STATUSES } from './resource-conflict';

export interface ReservationLike {
  reservedQuantity: number | Prisma.Decimal;
  status: 'PLANNED' | 'RESERVED' | 'CONFIRMED' | 'ISSUED' | 'IN_USE' | 'RETURNED' | 'RELEASED';
  reusedFromResourceId: string | null;
}

export interface TransactionLike {
  quantity: number | Prisma.Decimal;
  type:
    | 'PURCHASE'
    | 'ADJUSTMENT_IN'
    | 'ADJUSTMENT_OUT'
    | 'RESERVE'
    | 'RELEASE'
    | 'ALLOCATE'
    | 'ISSUE'
    | 'USE'
    | 'RETURN'
    | 'DAMAGE'
    | 'LOSS';
}

export interface InventoryStockSummary {
  totalQuantity: Prisma.Decimal;
  reservedQuantity: Prisma.Decimal;
  availableQuantity: Prisma.Decimal;
  allocatedQuantity: Prisma.Decimal;
  issuedQuantity: Prisma.Decimal;
  usedQuantity: Prisma.Decimal;
  returnedQuantity: Prisma.Decimal;
  damagedQuantity: Prisma.Decimal;
  lostQuantity: Prisma.Decimal;
  /** damaged + lost — "how many units didn't come back intact". */
  missingQuantity: Prisma.Decimal;
}

// Single source of truth in resource-conflict.ts — imported, not re-declared, so adding a status
// that still holds stock (CONFIRMED/ISSUED) can never diverge the availability math from this
// summary. `Set` wrapper only for the `.has()` call sites below.
const ACTIVE_RESOURCE_STATUS_SET = new Set<string>(ACTIVE_RESOURCE_STATUSES);

function sumBy<T>(items: T[], predicate: (item: T) => boolean, quantityOf: (item: T) => number | Prisma.Decimal): Prisma.Decimal {
  return items
    .filter(predicate)
    .reduce((sum, item) => sum.plus(quantityOf(item)), new Prisma.Decimal(0));
}

/**
 * Derives §13's minimum exposed stock-accounting set for one InventoryItem from its reservations
 * and transaction ledger — never stored columns, always computed on read, so they can't drift out
 * of sync with the underlying commitment/movement rows. `reservedQuantity` mirrors the same
 * active-status filter `assertInventoryAvailable` uses; `allocated`/`used`/`damaged`/`lost` sum
 * the matching InventoryTransactionType rows minus their reversals (e.g. ALLOCATE minus
 * USE/RETURN), matching §32's "the transaction ledger is what physically happened."
 */
export function computeInventoryStockSummary(
  totalQuantity: number,
  reservations: ReservationLike[],
  transactions: TransactionLike[]
): InventoryStockSummary {
  const total = new Prisma.Decimal(totalQuantity);
  const reservedQuantity = sumBy(
    reservations,
    (r) => ACTIVE_RESOURCE_STATUS_SET.has(r.status) && r.reusedFromResourceId === null,
    (r) => r.reservedQuantity
  );
  const availableQuantity = Prisma.Decimal.max(total.minus(reservedQuantity), 0);

  const allocated = sumBy(transactions, (t) => t.type === 'ALLOCATE', (t) => t.quantity);
  const returnedOrUsedAfterAllocate = sumBy(transactions, (t) => t.type === 'USE' || t.type === 'RETURN', (t) => t.quantity);
  const allocatedQuantity = Prisma.Decimal.max(allocated.minus(returnedOrUsedAfterAllocate), 0);

  // Issued but not yet used or returned — mirrors how `allocatedQuantity` nets its reversals.
  const issued = sumBy(transactions, (t) => t.type === 'ISSUE', (t) => t.quantity);
  const issuedQuantity = Prisma.Decimal.max(issued.minus(returnedOrUsedAfterAllocate), 0);

  const usedQuantity = sumBy(transactions, (t) => t.type === 'USE', (t) => t.quantity);
  const returnedQuantity = sumBy(transactions, (t) => t.type === 'RETURN', (t) => t.quantity);
  const damagedQuantity = sumBy(transactions, (t) => t.type === 'DAMAGE', (t) => t.quantity);
  const lostQuantity = sumBy(transactions, (t) => t.type === 'LOSS', (t) => t.quantity);

  return {
    totalQuantity: total,
    reservedQuantity,
    availableQuantity,
    allocatedQuantity,
    issuedQuantity,
    usedQuantity,
    returnedQuantity,
    damagedQuantity,
    lostQuantity,
    missingQuantity: damagedQuantity.plus(lostQuantity),
  };
}
