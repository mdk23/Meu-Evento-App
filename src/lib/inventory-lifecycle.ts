import { ReservationStatus, InventoryTransactionType } from '@prisma/client';

export type ReservationAction = 'CONFIRM' | 'ALLOCATE' | 'USE' | 'RETURN' | 'RELEASE' | 'CANCEL';

export interface ReservationTransition {
  /** New `InventoryReservation.status`, or null when the action doesn't change status (Allocate —
   * "allocated" is derived from the transaction ledger, not its own status, per the Phase 13 design
   * decision). */
  nextStatus: ReservationStatus | null;
  /** `InventoryTransaction.type` to log, or null when the action is a pure commitment-strength change
   * with no physical movement (Confirm). */
  transactionType: InventoryTransactionType | null;
}

const ALLOWED_FROM: Record<ReservationAction, ReservationStatus[]> = {
  CONFIRM: ['HELD'],
  ALLOCATE: ['CONFIRMED'],
  USE: ['CONFIRMED'],
  RETURN: ['CONSUMED'],
  RELEASE: ['HELD', 'CONFIRMED'],
  CANCEL: ['HELD', 'CONFIRMED'],
};

const NEXT_STATUS: Record<ReservationAction, ReservationStatus | null> = {
  CONFIRM: 'CONFIRMED',
  ALLOCATE: null,
  USE: 'CONSUMED',
  RETURN: 'RETURNED',
  RELEASE: 'RELEASED',
  CANCEL: 'CANCELLED',
};

const TRANSACTION_TYPE: Record<ReservationAction, InventoryTransactionType | null> = {
  CONFIRM: null,
  ALLOCATE: 'ALLOCATE',
  USE: 'USE',
  RETURN: 'RETURN',
  // Release and Cancel both mean "this commitment no longer holds stock" from the ledger's
  // perspective — nothing physical happened, so both log the same RELEASE movement type; the
  // reservation's own `status` (RELEASED vs CANCELLED) is what preserves *why*.
  RELEASE: 'RELEASE',
  CANCEL: 'RELEASE',
};

/**
 * Validates and resolves one lifecycle action against a reservation's current status (§15/§25's
 * Reserve→Confirm→Allocate→Use→Return ladder, plus Release/Cancel as exits before consumption).
 * Pure — no DB access — so the full state machine can be unit-tested without a transaction.
 */
export function resolveReservationTransition(
  currentStatus: ReservationStatus,
  action: ReservationAction
): ReservationTransition | { error: string } {
  if (!ALLOWED_FROM[action].includes(currentStatus)) {
    return { error: `Cannot ${action.toLowerCase()} a reservation that is currently ${currentStatus}.` };
  }
  return { nextStatus: NEXT_STATUS[action], transactionType: TRANSACTION_TYPE[action] };
}
