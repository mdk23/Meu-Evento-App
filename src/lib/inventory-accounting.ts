import { Prisma } from '@prisma/client';

export interface ReservationLike {
  quantity: number | Prisma.Decimal;
  status: 'HELD' | 'CONFIRMED' | 'RELEASED' | 'CONSUMED' | 'RETURNED' | 'CANCELLED';
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
  usedQuantity: Prisma.Decimal;
  damagedQuantity: Prisma.Decimal;
  lostQuantity: Prisma.Decimal;
}

const ACTIVE_RESERVATION_STATUSES = new Set(['HELD', 'CONFIRMED', 'CONSUMED']);

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
  const reservedQuantity = sumBy(reservations, (r) => ACTIVE_RESERVATION_STATUSES.has(r.status), (r) => r.quantity);
  const availableQuantity = Prisma.Decimal.max(total.minus(reservedQuantity), 0);

  const allocated = sumBy(transactions, (t) => t.type === 'ALLOCATE', (t) => t.quantity);
  const returnedOrUsedAfterAllocate = sumBy(transactions, (t) => t.type === 'USE' || t.type === 'RETURN', (t) => t.quantity);
  const allocatedQuantity = Prisma.Decimal.max(allocated.minus(returnedOrUsedAfterAllocate), 0);

  const usedQuantity = sumBy(transactions, (t) => t.type === 'USE', (t) => t.quantity);
  const damagedQuantity = sumBy(transactions, (t) => t.type === 'DAMAGE', (t) => t.quantity);
  const lostQuantity = sumBy(transactions, (t) => t.type === 'LOSS', (t) => t.quantity);

  return {
    totalQuantity: total,
    reservedQuantity,
    availableQuantity,
    allocatedQuantity,
    usedQuantity,
    damagedQuantity,
    lostQuantity,
  };
}
