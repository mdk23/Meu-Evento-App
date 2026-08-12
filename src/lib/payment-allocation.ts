import { Prisma, PaymentStatus } from '@prisma/client';
import { toMoney, sumMoney, subtractMoneyFloor0, isMoneyGreaterThanOrEqual, isMoneyPositive } from './money';

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
  amount: MoneyLike;
}

export interface AllocatedSchedule {
  id: string;
  allocatedAmount: Prisma.Decimal;
  remainingAmount: Prisma.Decimal;
  status: PaymentStatus;
}

export interface AllocationResult {
  schedules: AllocatedSchedule[];
  /** Money received beyond what every active schedule needed — never silently absorbed. */
  overpaymentAmount: Prisma.Decimal;
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
 */
export function allocatePayments(
  scheduledPayments: ScheduledPaymentInput[],
  transactions: TransactionInput[],
  now: Date = new Date()
): AllocationResult {
  const totalReceived = sumMoney(transactions.map((t) => t.amount));

  const activeSchedules = scheduledPayments
    .filter((s) => s.status !== PaymentStatus.CANCELLED)
    .slice()
    .sort(compareSchedules);

  let remaining = totalReceived;
  const allocatedById = new Map<string, Prisma.Decimal>();

  for (const schedule of activeSchedules) {
    const expected = toMoney(schedule.amount);
    const rawApply = remaining.greaterThan(expected) ? expected : remaining;
    const applied = rawApply.isNegative() ? toMoney(0) : rawApply;
    allocatedById.set(schedule.id, applied);
    remaining = remaining.minus(applied);
  }

  const overpaymentAmount = remaining.isNegative() ? toMoney(0) : remaining;

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

  return { schedules, overpaymentAmount };
}

/**
 * The one DB-touching entry point into this module — everything above is pure. Recalculates
 * `allocatePayments` from a booking's current `ScheduledPayment` rows + every `PaymentTransaction`,
 * then writes the result back onto each schedule's `paidAmount`/`status` as a cache (never
 * authoritative — see the doc comments on those columns in schema.prisma). Call this after any
 * write that changes either side of the equation: recording a payment, deleting one, or editing
 * the plan. Must run inside the same `$transaction` as that write so the cache never observes a
 * half-committed state.
 */
export async function syncScheduledPaymentAllocations(tx: TransactionClient, bookingId: string): Promise<void> {
  const [scheduledPayments, transactions] = await Promise.all([
    tx.scheduledPayment.findMany({ where: { bookingId } }),
    tx.paymentTransaction.findMany({ where: { bookingId }, select: { amount: true } }),
  ]);

  const { schedules } = allocatePayments(scheduledPayments, transactions);

  for (const schedule of schedules) {
    const current = scheduledPayments.find((s) => s.id === schedule.id);
    if (!current) continue;
    if (current.paidAmount.equals(schedule.allocatedAmount) && current.status === schedule.status) continue;
    await tx.scheduledPayment.update({
      where: { id: schedule.id },
      data: { paidAmount: schedule.allocatedAmount, status: schedule.status },
    });
  }
}
