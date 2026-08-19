import { describe, it, expect } from 'vitest';
import { PaymentStatus } from '@prisma/client';
import { allocatePayments, deriveScheduleStatus, ScheduledPaymentInput, TransactionInput } from './payment-allocation';

const NOW = new Date('2026-06-01T00:00:00Z');
const FUTURE = new Date('2026-07-01T00:00:00Z');
const PAST = new Date('2026-01-01T00:00:00Z');

let seq = 0;
function sched(partial: Partial<ScheduledPaymentInput> & { amount: number }): ScheduledPaymentInput {
  seq += 1;
  return {
    id: partial.id ?? `sched-${seq}`,
    amount: partial.amount,
    status: partial.status ?? PaymentStatus.PENDING,
    dueDate: partial.dueDate ?? FUTURE,
    orderNumber: partial.orderNumber ?? seq,
    createdAt: partial.createdAt ?? new Date(2026, 0, seq),
  };
}

let txSeq = 0;
function tx(amount: number, partial?: Partial<TransactionInput>): TransactionInput {
  txSeq += 1;
  return {
    id: partial?.id ?? `txn-${txSeq}`,
    amount,
    date: partial?.date ?? new Date(2026, 0, txSeq),
    createdAt: partial?.createdAt ?? new Date(2026, 0, txSeq),
  };
}

describe('allocatePayments', () => {
  it('TEST 1 — exact payment marks a schedule PAID', () => {
    const { schedules, overpaymentAmount } = allocatePayments([sched({ amount: 66250 })], [tx(66250)], NOW);
    expect(schedules[0].status).toBe(PaymentStatus.PAID);
    expect(schedules[0].allocatedAmount.toNumber()).toBe(66250);
    expect(schedules[0].remainingAmount.toNumber()).toBe(0);
    expect(overpaymentAmount.toNumber()).toBe(0);
  });

  it('TEST 2 — partial payment marks PARTIALLY_PAID with correct remaining', () => {
    const { schedules } = allocatePayments([sched({ amount: 66250 })], [tx(50000)], NOW);
    expect(schedules[0].status).toBe(PaymentStatus.PARTIALLY_PAID);
    expect(schedules[0].allocatedAmount.toNumber()).toBe(50000);
    expect(schedules[0].remainingAmount.toNumber()).toBe(16250);
  });

  it('TEST 3 — overpaying the deposit cascades the excess into the next milestone', () => {
    const deposit = sched({ id: 'deposit', amount: 66250, dueDate: new Date('2026-06-10'), orderNumber: 1 });
    const payment2 = sched({ id: 'payment2', amount: 33125, dueDate: new Date('2026-06-20'), orderNumber: 2 });
    const { schedules, overpaymentAmount } = allocatePayments([deposit, payment2], [tx(80000)], NOW);

    const depositResult = schedules.find((s) => s.id === 'deposit')!;
    const payment2Result = schedules.find((s) => s.id === 'payment2')!;

    expect(depositResult.status).toBe(PaymentStatus.PAID);
    expect(depositResult.allocatedAmount.toNumber()).toBe(66250);
    expect(payment2Result.status).toBe(PaymentStatus.PARTIALLY_PAID);
    expect(payment2Result.allocatedAmount.toNumber()).toBe(13750);
    expect(payment2Result.remainingAmount.toNumber()).toBe(19375);
    expect(overpaymentAmount.toNumber()).toBe(0);
  });

  it('TEST 4 — paying beyond the entire contract balance produces a visible overpayment', () => {
    const schedules = [
      sched({ id: 'deposit', amount: 66250, dueDate: new Date('2026-06-01'), orderNumber: 1 }),
      sched({ id: 'p2', amount: 33125, dueDate: new Date('2026-06-10'), orderNumber: 2 }),
      sched({ id: 'p3', amount: 33125, dueDate: new Date('2026-06-20'), orderNumber: 3 }),
    ];
    const { schedules: result, overpaymentAmount } = allocatePayments(schedules, [tx(150000)], NOW);

    expect(result.every((s) => s.status === PaymentStatus.PAID)).toBe(true);
    expect(overpaymentAmount.toNumber()).toBe(17500);
  });

  it('TEST 5 — multiple transactions sum exactly like one equivalent payment', () => {
    const deposit = sched({ id: 'deposit', amount: 66250, dueDate: new Date('2026-06-10'), orderNumber: 1 });
    const payment2 = sched({ id: 'payment2', amount: 33125, dueDate: new Date('2026-06-20'), orderNumber: 2 });

    const single = allocatePayments([deposit, payment2], [tx(80000)], NOW);
    const split = allocatePayments([deposit, payment2], [tx(50000), tx(20000), tx(10000)], NOW);

    expect(split.schedules.map((s) => s.allocatedAmount.toNumber())).toEqual(
      single.schedules.map((s) => s.allocatedAmount.toNumber())
    );
    expect(split.overpaymentAmount.toNumber()).toBe(single.overpaymentAmount.toNumber());
  });

  it('TEST 6 — changing the plan after a payment reallocates without touching the transaction', () => {
    const transactions = [tx(80000)];

    const originalPlan = [
      sched({ id: 'deposit', amount: 66250, dueDate: new Date('2026-06-01'), orderNumber: 1 }),
      sched({ id: 'p2', amount: 33125, dueDate: new Date('2026-06-10'), orderNumber: 2 }),
      sched({ id: 'p3', amount: 33125, dueDate: new Date('2026-06-20'), orderNumber: 3 }),
    ];
    const originalResult = allocatePayments(originalPlan, transactions, NOW);
    expect(originalResult.schedules.find((s) => s.id === 'deposit')!.status).toBe(PaymentStatus.PAID);
    expect(originalResult.schedules.find((s) => s.id === 'p2')!.allocatedAmount.toNumber()).toBe(13750);

    // Business edits the plan — same total (132,500), different split. The transaction is untouched.
    const revisedPlan = [
      sched({ id: 'deposit', amount: 50000, dueDate: new Date('2026-06-01'), orderNumber: 1 }),
      sched({ id: 'p2', amount: 40000, dueDate: new Date('2026-06-10'), orderNumber: 2 }),
      sched({ id: 'p3', amount: 42500, dueDate: new Date('2026-06-20'), orderNumber: 3 }),
    ];
    const revisedResult = allocatePayments(revisedPlan, transactions, NOW);

    expect(revisedResult.schedules.find((s) => s.id === 'deposit')!.status).toBe(PaymentStatus.PAID);
    expect(revisedResult.schedules.find((s) => s.id === 'deposit')!.allocatedAmount.toNumber()).toBe(50000);
    expect(revisedResult.schedules.find((s) => s.id === 'p2')!.status).toBe(PaymentStatus.PARTIALLY_PAID);
    expect(revisedResult.schedules.find((s) => s.id === 'p2')!.allocatedAmount.toNumber()).toBe(30000);
    expect(revisedResult.schedules.find((s) => s.id === 'p3')!.status).toBe(PaymentStatus.PENDING);
    expect(revisedResult.schedules.find((s) => s.id === 'p3')!.allocatedAmount.toNumber()).toBe(0);

    // The transaction itself was never read/written by this function — same amount in, untouched.
    expect(transactions[0].amount).toBe(80000);
  });

  it('TEST 7 — one payment split across milestones in order', () => {
    const schedules = [
      sched({ id: 'deposit', amount: 50000, dueDate: new Date('2026-06-01'), orderNumber: 1 }),
      sched({ id: 'catering', amount: 30000, dueDate: new Date('2026-06-10'), orderNumber: 2 }),
      sched({ id: 'decoration', amount: 20000, dueDate: new Date('2026-06-20'), orderNumber: 3 }),
    ];
    const { schedules: result } = allocatePayments(schedules, [tx(100000)], NOW);

    expect(result.find((s) => s.id === 'deposit')!.allocatedAmount.toNumber()).toBe(50000);
    expect(result.find((s) => s.id === 'catering')!.allocatedAmount.toNumber()).toBe(30000);
    expect(result.find((s) => s.id === 'decoration')!.allocatedAmount.toNumber()).toBe(20000);
    expect(result.every((s) => s.status === PaymentStatus.PAID)).toBe(true);
  });

  it('TEST 8 — a cancelled schedule never receives automatic allocation', () => {
    const active = sched({ id: 'active', amount: 30000, dueDate: new Date('2026-06-05'), orderNumber: 1 });
    const cancelled = sched({
      id: 'cancelled',
      amount: 20000,
      status: PaymentStatus.CANCELLED,
      dueDate: new Date('2026-06-01'),
      orderNumber: 0,
    });
    // Cancelled schedule is due EARLIER and would normally be allocated first — must still be skipped.
    const { schedules, overpaymentAmount } = allocatePayments([active, cancelled], [tx(50000)], NOW);

    const cancelledResult = schedules.find((s) => s.id === 'cancelled')!;
    const activeResult = schedules.find((s) => s.id === 'active')!;
    expect(cancelledResult.status).toBe(PaymentStatus.CANCELLED);
    expect(cancelledResult.allocatedAmount.toNumber()).toBe(0);
    expect(activeResult.allocatedAmount.toNumber()).toBe(30000);
    expect(activeResult.status).toBe(PaymentStatus.PAID);
    // The 20,000 that would have gone to the cancelled schedule shows up as overpayment instead
    // of being silently absorbed.
    expect(overpaymentAmount.toNumber()).toBe(20000);
  });

  it('TEST 9 — an unpaid schedule past its due date becomes OVERDUE', () => {
    const { schedules } = allocatePayments([sched({ amount: 10000, dueDate: PAST })], [], NOW);
    expect(schedules[0].status).toBe(PaymentStatus.OVERDUE);
  });

  it('a fully-paid schedule is never OVERDUE, even if its due date has passed', () => {
    const status = deriveScheduleStatus({
      expectedAmount: 10000,
      allocatedAmount: 10000,
      dueDate: PAST,
      currentStatus: PaymentStatus.PENDING,
      now: NOW,
    });
    expect(status).toBe(PaymentStatus.PAID);
  });

  it('a schedule with no money yet and a future due date is PENDING, not OVERDUE', () => {
    const status = deriveScheduleStatus({
      expectedAmount: 10000,
      allocatedAmount: 0,
      dueDate: FUTURE,
      currentStatus: PaymentStatus.PENDING,
      now: NOW,
    });
    expect(status).toBe(PaymentStatus.PENDING);
  });

  it('TEST 10 — a single transaction spanning two schedules produces two allocation lines', () => {
    const deposit = sched({ id: 'deposit', amount: 66250, dueDate: new Date('2026-06-10'), orderNumber: 1 });
    const payment2 = sched({ id: 'payment2', amount: 33125, dueDate: new Date('2026-06-20'), orderNumber: 2 });
    const payment = tx(80000, { id: 'txn-a' });
    const { allocationLines } = allocatePayments([deposit, payment2], [payment], NOW);

    expect(allocationLines).toHaveLength(2);
    expect(allocationLines.find((l) => l.scheduledPaymentId === 'deposit')!.amount.toNumber()).toBe(66250);
    expect(allocationLines.find((l) => l.scheduledPaymentId === 'payment2')!.amount.toNumber()).toBe(13750);
    expect(allocationLines.every((l) => l.transactionId === 'txn-a')).toBe(true);
  });

  it('TEST 11 — multiple transactions attribute their own lines, applied in date order', () => {
    const deposit = sched({ id: 'deposit', amount: 50000, dueDate: new Date('2026-06-01'), orderNumber: 1 });
    const p2 = sched({ id: 'p2', amount: 50000, dueDate: new Date('2026-06-10'), orderNumber: 2 });
    // Passed out of date order — the function must sort by `date`, not array position.
    const second = tx(30000, { id: 'txn-second', date: new Date('2026-05-02') });
    const first = tx(40000, { id: 'txn-first', date: new Date('2026-05-01') });
    const { allocationLines } = allocatePayments([deposit, p2], [second, first], NOW);

    // txn-first (40,000) fully covers the deposit; txn-second (30,000) finishes the deposit's
    // remaining 10,000 then spills 20,000 into p2.
    const firstLines = allocationLines.filter((l) => l.transactionId === 'txn-first');
    const secondLines = allocationLines.filter((l) => l.transactionId === 'txn-second');
    expect(firstLines.reduce((s, l) => s + l.amount.toNumber(), 0)).toBe(40000);
    expect(secondLines.find((l) => l.scheduledPaymentId === 'deposit')!.amount.toNumber()).toBe(10000);
    expect(secondLines.find((l) => l.scheduledPaymentId === 'p2')!.amount.toNumber()).toBe(20000);
  });
});
