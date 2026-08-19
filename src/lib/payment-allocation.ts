import { Prisma, PaymentStatus } from '@prisma/client';
import { toMoney, addMoney, subtractMoneyFloor0, isMoneyGreaterThan, isMoneyGreaterThanOrEqual, isMoneyPositive } from './money';

type TransactionClient = Prisma.TransactionClient;

type MoneyLike = Prisma.Decimal | number | null | undefined;

export interface ScheduledPaymentInput {
  id: string;
  amount: MoneyLike;
  status: string;
  dueDate: Date;
  orderNumber: number | null;
  createdAt: Date;
}

export interface TransactionInput {
  id: string;
  amount: MoneyLike;
  date: Date;
  createdAt: Date;
}

export interface AllocatedSchedule {
  id: string;
  allocatedAmount: Prisma.Decimal;
  remainingAmount: Prisma.Decimal;
  status: PaymentStatus;
}

/** One transaction's contribution to one schedule — the persisted shape of `PaymentAllocation`. */
export interface AllocationLine {
  transactionId: string;
  scheduledPaymentId: string;
  amount: Prisma.Decimal;
}

export interface AllocationResult {
  schedules: AllocatedSchedule[];
  /** Money received beyond what every active schedule needed — never silently absorbed. */
  overpaymentAmount: Prisma.Decimal;
  /** Transaction-to-schedule breakdown, in cascade order — what gets persisted as `PaymentAllocation` rows. */
  allocationLines: AllocationLine[];
}

/** Default allocation order: dueDate asc, then orderNumber asc (nulls sort last), then createdAt asc. */
function compareSchedules(a: ScheduledPaymentInput, b: ScheduledPaymentInput): number {
  const dueDiff = a.dueDate.getTime() - b.dueDate.getTime();
  if (dueDiff !== 0) return dueDiff;
  const aOrder = a.orderNumber ?? Number.MAX_SAFE_INTEGER;
  const bOrder = b.orderNumber ?? Number.MAX_SAFE_INTEGER;
  if (aOrder !== bOrder) return aOrder - bOrder;
  return a.createdAt.getTime() - b.createdAt.getTime();
}

/** Transactions apply in the order they actually happened: date asc, then createdAt asc as a tie-breaker. */
function compareTransactions(a: TransactionInput, b: TransactionInput): number {
  const dateDiff = a.date.getTime() - b.date.getTime();
  if (dateDiff !== 0) return dateDiff;
  return a.createdAt.getTime() - b.createdAt.getTime();
}

/**
 * Derives a scheduled payment's status from allocated vs. expected amount. `CANCELLED` always
 * passes through untouched. Precedence otherwise: PAID wins regardless of due date (a fully-paid
 * milestone is never "overdue"); OVERDUE takes priority over PARTIALLY_PAID/PENDING once the due
 * date has passed, whether nothing or something has been paid; PARTIALLY_PAID vs PENDING is then
 * just "has any money landed on this milestone yet."
 */
export function deriveScheduleStatus(params: {
  expectedAmount: MoneyLike;
  allocatedAmount: MoneyLike;
  dueDate: Date;
  currentStatus: string;
  now?: Date;
}): PaymentStatus {
  if (params.currentStatus === PaymentStatus.CANCELLED) return PaymentStatus.CANCELLED;

  const expected = toMoney(params.expectedAmount);
  const allocated = toMoney(params.allocatedAmount);

  if (isMoneyGreaterThanOrEqual(allocated, expected)) return PaymentStatus.PAID;

  const now = params.now ?? new Date();
  const remaining = subtractMoneyFloor0(expected, allocated);
  if (isMoneyPositive(remaining) && params.dueDate.getTime() < now.getTime()) return PaymentStatus.OVERDUE;

  return isMoneyPositive(allocated) ? PaymentStatus.PARTIALLY_PAID : PaymentStatus.PENDING;
}

/**
 * The payment allocation engine: cascades every `PaymentTransaction` received against a booking's
 * `ScheduledPayment` rows in deterministic order, filling each milestone before spilling into the
 * next. Pure function — no DB access — so it can be recalculated fresh from current state at any
 * time (record a payment, delete one, or edit the plan) without ever touching transaction history.
 * `CANCELLED` schedules never receive an allocation. Anything left over after every active schedule
 * is fully covered is reported as `overpaymentAmount`, not silently dropped.
 *
 * Transactions are cascaded one at a time, in the order they actually happened, rather than summed
 * into one lump — this produces the exact same per-schedule totals as summing-then-cascading would
 * (order doesn't change a waterfall's final state), but it additionally yields `allocationLines`:
 * the transaction-level breakdown persisted as `PaymentAllocation` rows.
 */
export function allocatePayments(
  scheduledPayments: ScheduledPaymentInput[],
  transactions: TransactionInput[],
  now: Date = new Date()
): AllocationResult {
  const activeSchedules = scheduledPayments
    .filter((s) => s.status !== PaymentStatus.CANCELLED)
    .slice()
    .sort(compareSchedules);

  const orderedTransactions = transactions.slice().sort(compareTransactions);

  const remainingCapacity = new Map<string, Prisma.Decimal>();
  const allocatedById = new Map<string, Prisma.Decimal>();
  for (const schedule of activeSchedules) {
    remainingCapacity.set(schedule.id, toMoney(schedule.amount));
    allocatedById.set(schedule.id, toMoney(0));
  }

  const allocationLines: AllocationLine[] = [];
  let overpaymentAmount = toMoney(0);

  for (const txn of orderedTransactions) {
    let remaining = toMoney(txn.amount);

    for (const schedule of activeSchedules) {
      if (!isMoneyPositive(remaining)) break;
      const cap = remainingCapacity.get(schedule.id)!;
      if (!isMoneyPositive(cap)) continue;

      const applied = isMoneyGreaterThan(remaining, cap) ? cap : remaining;
      allocationLines.push({ transactionId: txn.id, scheduledPaymentId: schedule.id, amount: applied });
      allocatedById.set(schedule.id, addMoney(allocatedById.get(schedule.id), applied));
      remainingCapacity.set(schedule.id, subtractMoneyFloor0(cap, applied));
      remaining = subtractMoneyFloor0(remaining, applied);
    }

    overpaymentAmount = addMoney(overpaymentAmount, remaining);
  }

  const schedules: AllocatedSchedule[] = scheduledPayments.map((s) => {
    if (s.status === PaymentStatus.CANCELLED) {
      return { id: s.id, allocatedAmount: toMoney(0), remainingAmount: toMoney(0), status: PaymentStatus.CANCELLED };
    }
    const allocatedAmount = allocatedById.get(s.id) ?? toMoney(0);
    const expected = toMoney(s.amount);
    const remainingAmount = subtractMoneyFloor0(expected, allocatedAmount);
    const status = deriveScheduleStatus({
      expectedAmount: expected,
      allocatedAmount,
      dueDate: s.dueDate,
      currentStatus: s.status,
      now,
    });
    return { id: s.id, allocatedAmount, remainingAmount, status };
  });

  return { schedules, overpaymentAmount, allocationLines };
}

/**
 * The one DB-touching entry point into this module — everything above is pure. Recalculates
 * `allocatePayments` from the booking's *active* `PaymentPlan`'s `ScheduledPayment` rows + every
 * `PaymentTransaction` on the booking, then:
 *   1. writes the result back onto each schedule's `paidAmount`/`status` as a cache (never
 *      authoritative — see the doc comments on those columns in schema.prisma), and
 *   2. rewrites `PaymentAllocation` (delete-then-recreate for this plan's schedules) so the
 *      transaction-to-schedule breakdown is queryable without recomputing it every read.
 * Call this after any write that changes either side of the equation: recording a payment,
 * deleting one, or creating a new plan version. Must run inside the same `$transaction` as that
 * write so neither cache ever observes a half-committed state.
 */
export async function syncScheduledPaymentAllocations(tx: TransactionClient, bookingId: string): Promise<void> {
  const activePlan = await tx.paymentPlan.findFirst({ where: { bookingId, active: true } });
  if (!activePlan) return;

  const [scheduledPayments, transactions] = await Promise.all([
    tx.scheduledPayment.findMany({ where: { planId: activePlan.id } }),
    tx.paymentTransaction.findMany({ where: { bookingId }, select: { id: true, amount: true, date: true, createdAt: true } }),
  ]);

  const { schedules, allocationLines } = allocatePayments(scheduledPayments, transactions);

  for (const schedule of schedules) {
    const current = scheduledPayments.find((s) => s.id === schedule.id);
    if (!current) continue;
    if (current.paidAmount.equals(schedule.allocatedAmount) && current.status === schedule.status) continue;
    await tx.scheduledPayment.update({
      where: { id: schedule.id },
      data: { paidAmount: schedule.allocatedAmount, status: schedule.status },
    });
  }

  const scheduleIds = scheduledPayments.map((s) => s.id);
  await tx.paymentAllocation.deleteMany({ where: { scheduledPaymentId: { in: scheduleIds } } });
  if (allocationLines.length > 0) {
    await tx.paymentAllocation.createMany({
      data: allocationLines.map((line) => ({
        transactionId: line.transactionId,
        scheduledPaymentId: line.scheduledPaymentId,
        amount: line.amount,
      })),
    });
  }
}
