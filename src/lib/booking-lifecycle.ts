export type LifecycleStageState = 'done' | 'current' | 'pending';

export interface LifecycleStage {
  label: string;
  state: LifecycleStageState;
}

export interface LifecycleInput {
  bookingStatus: string;
  kind: 'VENUE' | 'EVENT';
  scheduledPayments: { amount: number; paidAmount: number }[];
  eventServices: { status: string }[];
  /** Null when no Event record exists yet (a SPACE booking that's never been promoted). */
  eventStatus?: string | null;
}

/** Derives the 5-stage booking lifecycle spine (Booking → Money → Services → Operations →
 * Event/Hand-over) shown in both the booking POS header and the event detail header. Each stage
 * is scored independently off real data rather than forced into a single-file progression, since
 * e.g. services can be fully delivered before the balance is collected. */
export function deriveLifecycleStages(input: LifecycleInput): LifecycleStage[] {
  const { bookingStatus, kind, scheduledPayments, eventServices, eventStatus } = input;

  const bookingState: LifecycleStageState = bookingStatus === 'WAITING_LIST' ? 'current' : 'done';

  const totalScheduled = scheduledPayments.reduce((sum, sp) => sum + sp.amount, 0);
  const totalPaid = scheduledPayments.reduce((sum, sp) => sum + sp.paidAmount, 0);
  const moneyState: LifecycleStageState =
    totalScheduled > 0 && totalPaid >= totalScheduled ? 'done' : totalPaid > 0 ? 'current' : 'pending';

  const activeServices = eventServices.filter((es) => es.status !== 'CANCELLED');
  const servicesState: LifecycleStageState =
    activeServices.length === 0
      ? 'pending'
      : activeServices.every((es) => es.status === 'COMPLETED')
      ? 'done'
      : activeServices.some((es) => es.status !== 'PLANNING')
      ? 'current'
      : 'pending';

  // SPACE bookings have no operational workspace by design — nothing to block on, so this stage
  // never holds up a commercial-only booking's spine.
  const operationsState: LifecycleStageState =
    kind === 'VENUE'
      ? 'done'
      : eventStatus === 'COMPLETED'
      ? 'done'
      : eventStatus === 'IN_PROGRESS' || eventStatus === 'READY'
      ? 'current'
      : 'pending';

  const finalLabel = kind === 'EVENT' ? 'Event' : 'Hand-over';
  const finalState: LifecycleStageState = kind === 'EVENT' ? (eventStatus === 'COMPLETED' ? 'done' : 'current') : 'pending';

  return [
    { label: 'Booking', state: bookingState },
    { label: 'Money', state: moneyState },
    { label: 'Services', state: servicesState },
    { label: 'Operations', state: operationsState },
    { label: finalLabel, state: finalState },
  ];
}
