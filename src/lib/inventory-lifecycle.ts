import { ResourceAllocationStatus, InventoryTransactionType } from '@prisma/client';

export type ReservationAction =
  | 'RESERVE'
  | 'CONFIRM'
  | 'ISSUE'
  | 'ALLOCATE'
  | 'USE'
  | 'RETURN'
  | 'RELEASE'
  | 'DAMAGE'
  | 'LOSS';

export interface ReservationTransition {
  /** New `BookingServiceResource.status`, or null when the action doesn't change status — Allocate,
   * and Damage/Loss, whose quantities are derived from the transaction ledger rather than the row's
   * own status (same design decision carried over from the pre-unification reservation model). */
  nextStatus: ResourceAllocationStatus | null;
  /** `InventoryTransaction.type` to log, or null when the action is a pure commitment-strength change
   * with no physical movement (Confirm). */
  transactionType: InventoryTransactionType | null;
}

const ALLOWED_FROM: Record<ReservationAction, ResourceAllocationStatus[]> = {
  RESERVE: ['PLANNED'],
  CONFIRM: ['RESERVED'],
  ISSUE: ['RESERVED', 'CONFIRMED'],
  ALLOCATE: ['RESERVED', 'CONFIRMED'],
  USE: ['RESERVED', 'CONFIRMED', 'ISSUED'],
  RETURN: ['ISSUED', 'IN_USE'],
  RELEASE: ['PLANNED', 'RESERVED', 'CONFIRMED'],
  DAMAGE: ['ISSUED', 'IN_USE', 'RETURNED'],
  LOSS: ['ISSUED', 'IN_USE', 'RETURNED'],
};

const NEXT_STATUS: Record<ReservationAction, ResourceAllocationStatus | null> = {
  RESERVE: 'RESERVED',
  CONFIRM: 'CONFIRMED',
  ISSUE: 'ISSUED',
  ALLOCATE: null,
  USE: 'IN_USE',
  RETURN: 'RETURNED',
  RELEASE: 'RELEASED',
  DAMAGE: null,
  LOSS: null,
};

const TRANSACTION_TYPE: Record<ReservationAction, InventoryTransactionType | null> = {
  RESERVE: 'RESERVE',
  CONFIRM: null,
  ISSUE: 'ISSUE',
  ALLOCATE: 'ALLOCATE',
  USE: 'USE',
  RETURN: 'RETURN',
  RELEASE: 'RELEASE',
  DAMAGE: 'DAMAGE',
  LOSS: 'LOSS',
};

/**
 * Validates and resolves one lifecycle action against a resource's current status (the
 * Planned→Reserved→Confirmed→Issued→In Use→Returned ladder, plus Release as an exit before use and
 * Damage/Loss as ledger-only outcomes once issued). Pure — no DB access — so the full state machine
 * can be unit-tested without a transaction.
 */
export function resolveReservationTransition(
  currentStatus: ResourceAllocationStatus,
  action: ReservationAction
): ReservationTransition | { error: string } {
  if (!ALLOWED_FROM[action].includes(currentStatus)) {
    return { error: `Cannot ${action.toLowerCase()} a resource that is currently ${currentStatus}.` };
  }
  return { nextStatus: NEXT_STATUS[action], transactionType: TRANSACTION_TYPE[action] };
}
