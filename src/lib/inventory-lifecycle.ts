import { ResourceAllocationStatus, InventoryTransactionType } from '@prisma/client';

export type ReservationAction = 'RESERVE' | 'ALLOCATE' | 'USE' | 'RETURN' | 'RELEASE';

export interface ReservationTransition {
  /** New `BookingServiceResource.status`, or null when the action doesn't change status (Allocate —
   * "allocated" is derived from the transaction ledger, not its own status, matching the original
   * design decision carried over from the pre-unification reservation model). */
  nextStatus: ResourceAllocationStatus | null;
  /** `InventoryTransaction.type` to log, or null when the action is a pure commitment-strength change
   * with no physical movement. */
  transactionType: InventoryTransactionType | null;
}

const ALLOWED_FROM: Record<ReservationAction, ResourceAllocationStatus[]> = {
  RESERVE: ['PLANNED'],
  ALLOCATE: ['RESERVED'],
  USE: ['RESERVED'],
  RETURN: ['IN_USE'],
  RELEASE: ['PLANNED', 'RESERVED'],
};

const NEXT_STATUS: Record<ReservationAction, ResourceAllocationStatus | null> = {
  RESERVE: 'RESERVED',
  ALLOCATE: null,
  USE: 'IN_USE',
  RETURN: 'RETURNED',
  RELEASE: 'RELEASED',
};

const TRANSACTION_TYPE: Record<ReservationAction, InventoryTransactionType | null> = {
  RESERVE: 'RESERVE',
  ALLOCATE: 'ALLOCATE',
  USE: 'USE',
  RETURN: 'RETURN',
  RELEASE: 'RELEASE',
};

/**
 * Validates and resolves one lifecycle action against a resource's current status (the
 * Planned→Reserved→Allocate→In Use→Returned ladder, plus Release as an exit before use). Pure — no
 * DB access — so the full state machine can be unit-tested without a transaction.
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
