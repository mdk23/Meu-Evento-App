/**
 * Milestone-based payment plans (Phase 7). Installments are not calendar months — they're
 * named milestones with their own due dates, validated against the event date and the
 * contract total. `PaymentSchedule`/`PaymentTransaction` already exist as `ScheduledPayment`/
 * `PaymentTransaction`; this module only covers generating and validating the milestone list.
 */

export type PaymentPlanId = 'FULL' | '3' | '6' | '10' | '12' | 'CUSTOM';

export const DEPOSIT_PERCENT_OPTIONS = [10, 20, 30, 50] as const;

export const PAYMENT_PLAN_OPTIONS: { id: PaymentPlanId; label: string; milestoneCount: number | null }[] = [
  { id: 'FULL', label: 'Full Payment (1x)', milestoneCount: 1 },
  { id: '3', label: '3 Payments', milestoneCount: 3 },
  { id: '6', label: '6 Payments', milestoneCount: 6 },
  { id: '10', label: '10 Payments', milestoneCount: 10 },
  { id: '12', label: '12 Payments', milestoneCount: 12 },
  { id: 'CUSTOM', label: 'Custom', milestoneCount: null },
];

export interface MilestoneDraft {
  name: string;
  amount: number;
  dueDate: string; // yyyy-mm-dd
}

function toDateOnly(d: Date): string {
  return d.toISOString().split('T')[0];
}

/**
 * Spreads `count` milestone due dates evenly between `startDate` (exclusive) and `eventDate`
 * (inclusive), so later milestones never land after the event. `count` must be >= 1.
 */
function spreadDueDates(startDate: Date, eventDate: Date, count: number): Date[] {
  const start = startDate.getTime();
  const end = eventDate.getTime();
  if (count === 1) return [eventDate];
  const span = Math.max(0, end - start);
  const dates: Date[] = [];
  for (let i = 1; i <= count; i++) {
    const t = start + (span * i) / count;
    dates.push(new Date(t));
  }
  return dates;
}

/**
 * Generates a milestone list for a preset plan. The first milestone is always the deposit
 * (`depositPercent`% of `totalAmount`, due `depositDueDate`); any remaining milestones split
 * the rest evenly, spaced between the deposit and the event date. `FULL` ignores the deposit
 * percent entirely — it's a single milestone for the whole amount, due on the event date.
 */
export function generateMilestones({
  totalAmount,
  depositPercent,
  planId,
  eventDate,
  depositDueDate,
}: {
  totalAmount: number;
  depositPercent: number;
  planId: Exclude<PaymentPlanId, 'CUSTOM'>;
  eventDate: Date;
  depositDueDate: Date;
}): MilestoneDraft[] {
  if (totalAmount <= 0) return [];

  if (planId === 'FULL') {
    return [{ name: 'Full Payment', amount: totalAmount, dueDate: toDateOnly(eventDate) }];
  }

  const plan = PAYMENT_PLAN_OPTIONS.find((p) => p.id === planId);
  const count = plan?.milestoneCount || 1;

  const depositAmount = Math.round((totalAmount * depositPercent) / 100 * 100) / 100;
  const milestones: MilestoneDraft[] = [
    { name: 'Deposit', amount: depositAmount, dueDate: toDateOnly(depositDueDate) },
  ];

  const remainingCount = count - 1;
  if (remainingCount <= 0) return milestones;

  const remainingTotal = Math.round((totalAmount - depositAmount) * 100) / 100;
  const dueDates = spreadDueDates(depositDueDate, eventDate, remainingCount);

  const baseShare = Math.floor((remainingTotal / remainingCount) * 100) / 100;
  let allocated = 0;
  for (let i = 0; i < remainingCount; i++) {
    const isLast = i === remainingCount - 1;
    // Last installment absorbs any rounding remainder so the sum matches exactly.
    const amount = isLast ? Math.round((remainingTotal - allocated) * 100) / 100 : baseShare;
    allocated += amount;
    milestones.push({
      name: `Payment ${i + 2} of ${count}`,
      amount,
      dueDate: toDateOnly(dueDates[i]),
    });
  }

  return milestones;
}

export interface PaymentPlanValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates a milestone list against the spec's rules: every due date must be on or before
 * the event, due dates must be chronological (non-decreasing), and the amounts must sum to
 * the contract total (within a cent of rounding tolerance).
 */
export function validatePaymentPlan({
  milestones,
  totalAmount,
  eventDate,
}: {
  milestones: MilestoneDraft[];
  totalAmount: number;
  eventDate: Date;
}): PaymentPlanValidationResult {
  const errors: string[] = [];

  if (milestones.length === 0) {
    errors.push('At least one payment milestone is required.');
    return { valid: false, errors };
  }

  const eventDay = new Date(eventDate);
  eventDay.setHours(23, 59, 59, 999);

  let previousDate: Date | null = null;
  milestones.forEach((m, index) => {
    const due = new Date(m.dueDate);
    if (Number.isNaN(due.getTime())) {
      errors.push(`"${m.name}" has an invalid due date.`);
      return;
    }
    if (due.getTime() > eventDay.getTime()) {
      errors.push(`"${m.name}" is due after the event date.`);
    }
    if (previousDate && due.getTime() < previousDate.getTime()) {
      errors.push(`"${m.name}" is due before the previous milestone — payment dates must follow chronological order.`);
    }
    previousDate = due;
    if (!m.amount || m.amount <= 0) {
      errors.push(`"${m.name}" must have a positive amount.`);
    }
    void index;
  });

  const sum = Math.round(milestones.reduce((acc, m) => acc + (m.amount || 0), 0) * 100) / 100;
  const roundedTotal = Math.round(totalAmount * 100) / 100;
  if (Math.abs(sum - roundedTotal) > 0.01) {
    errors.push(`Milestone amounts (${sum.toLocaleString()} MT) must sum to the contract total (${roundedTotal.toLocaleString()} MT).`);
  }

  return { valid: errors.length === 0, errors };
}
