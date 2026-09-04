import { describe, it, expect } from 'vitest';
import { generateMilestones, validatePaymentPlan, MilestoneDraft } from './payment-plan';

const eventDate = new Date('2026-12-31T00:00:00.000Z');
const depositDueDate = new Date('2026-01-01T00:00:00.000Z');

describe('generateMilestones', () => {
  it('returns an empty list for a non-positive total', () => {
    expect(generateMilestones({ totalAmount: 0, depositPercent: 20, planId: '3', eventDate, depositDueDate })).toEqual([]);
    expect(generateMilestones({ totalAmount: -50, depositPercent: 20, planId: '3', eventDate, depositDueDate })).toEqual([]);
  });

  it('FULL is a single milestone for the whole amount, due on the event date, ignoring depositPercent', () => {
    const result = generateMilestones({ totalAmount: 1000, depositPercent: 50, planId: 'FULL', eventDate, depositDueDate });
    expect(result).toEqual([{ name: 'Full Payment', amount: 1000, dueDate: '2026-12-31' }]);
  });

  it('a 3-payment plan produces a deposit plus 2 remaining installments summing to the total', () => {
    const result = generateMilestones({ totalAmount: 1000, depositPercent: 20, planId: '3', eventDate, depositDueDate });
    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({ name: 'Deposit', amount: 200, dueDate: '2026-01-01' });
    const sum = result.reduce((acc, m) => acc + m.amount, 0);
    expect(Math.round(sum * 100) / 100).toBe(1000);
  });

  it('every remaining installment is due strictly after the deposit and on/before the event date', () => {
    const result = generateMilestones({ totalAmount: 1000, depositPercent: 20, planId: '6', eventDate, depositDueDate });
    for (const m of result.slice(1)) {
      expect(new Date(m.dueDate).getTime()).toBeGreaterThan(depositDueDate.getTime());
      expect(new Date(m.dueDate).getTime()).toBeLessThanOrEqual(eventDate.getTime());
    }
  });

  it('the last installment absorbs the rounding remainder so amounts sum exactly (12-payment plan)', () => {
    const result = generateMilestones({ totalAmount: 1000, depositPercent: 10, planId: '12', eventDate, depositDueDate });
    expect(result).toHaveLength(12);
    const sum = Math.round(result.reduce((acc, m) => acc + m.amount, 0) * 100) / 100;
    expect(sum).toBe(1000);
    // Every amount must be positive — flooring the base share must never push the last share negative.
    for (const m of result) expect(m.amount).toBeGreaterThan(0);
  });

  it('handles a total that does not divide evenly, still summing exactly to the cent', () => {
    const result = generateMilestones({ totalAmount: 100.01, depositPercent: 33, planId: '3', eventDate, depositDueDate });
    const sum = Math.round(result.reduce((acc, m) => acc + m.amount, 0) * 100) / 100;
    expect(sum).toBe(100.01);
  });

  it('a 100% deposit still emits the remaining installments (as zero-amount rows), summing to the total', () => {
    const result = generateMilestones({ totalAmount: 500, depositPercent: 100, planId: '3', eventDate, depositDueDate });
    expect(result[0]).toMatchObject({ name: 'Deposit', amount: 500 });
    const sum = Math.round(result.reduce((acc, m) => acc + m.amount, 0) * 100) / 100;
    expect(sum).toBe(500);
  });
});

describe('validatePaymentPlan', () => {
  const baseMilestones: MilestoneDraft[] = [
    { name: 'Deposit', amount: 200, dueDate: '2026-01-01' },
    { name: 'Payment 2 of 2', amount: 800, dueDate: '2026-12-31' },
  ];

  it('accepts a well-formed plan that sums to the total and is chronological', () => {
    const result = validatePaymentPlan({ milestones: baseMilestones, totalAmount: 1000, eventDate });
    expect(result).toEqual({ valid: true, errors: [] });
  });

  it('rejects an empty milestone list', () => {
    const result = validatePaymentPlan({ milestones: [], totalAmount: 1000, eventDate });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/at least one/i);
  });

  it('rejects a milestone due after the event date', () => {
    const milestones: MilestoneDraft[] = [{ name: 'Late', amount: 1000, dueDate: '2027-01-15' }];
    const result = validatePaymentPlan({ milestones, totalAmount: 1000, eventDate });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => /after the event date/.test(e))).toBe(true);
  });

  it('accepts a milestone due exactly on the event date', () => {
    const milestones: MilestoneDraft[] = [{ name: 'On day', amount: 1000, dueDate: '2026-12-31' }];
    const result = validatePaymentPlan({ milestones, totalAmount: 1000, eventDate });
    expect(result.valid).toBe(true);
  });

  it('rejects out-of-order due dates', () => {
    const milestones: MilestoneDraft[] = [
      { name: 'First', amount: 500, dueDate: '2026-06-01' },
      { name: 'Second', amount: 500, dueDate: '2026-01-01' },
    ];
    const result = validatePaymentPlan({ milestones, totalAmount: 1000, eventDate });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => /chronological/.test(e))).toBe(true);
  });

  it('allows two milestones on the same due date (non-decreasing, not strictly increasing)', () => {
    const milestones: MilestoneDraft[] = [
      { name: 'A', amount: 500, dueDate: '2026-06-01' },
      { name: 'B', amount: 500, dueDate: '2026-06-01' },
    ];
    const result = validatePaymentPlan({ milestones, totalAmount: 1000, eventDate });
    expect(result.valid).toBe(true);
  });

  it('rejects a zero or negative amount', () => {
    const milestones: MilestoneDraft[] = [{ name: 'Bad', amount: 0, dueDate: '2026-01-01' }];
    const result = validatePaymentPlan({ milestones, totalAmount: 0, eventDate });
    expect(result.errors.some((e) => /positive amount/.test(e))).toBe(true);
  });

  it('rejects an invalid due date string', () => {
    const milestones: MilestoneDraft[] = [{ name: 'Bad date', amount: 100, dueDate: 'not-a-date' }];
    const result = validatePaymentPlan({ milestones, totalAmount: 100, eventDate });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => /invalid due date/.test(e))).toBe(true);
  });

  it('rejects milestone amounts that do not sum to the contract total', () => {
    const milestones: MilestoneDraft[] = [{ name: 'Short', amount: 900, dueDate: '2026-01-01' }];
    const result = validatePaymentPlan({ milestones, totalAmount: 1000, eventDate });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => /must sum to the contract total/.test(e))).toBe(true);
  });

  it('tolerates a rounding difference of exactly one cent (boundary is inclusive)', () => {
    const milestones: MilestoneDraft[] = [{ name: 'Close enough', amount: 999.99, dueDate: '2026-01-01' }];
    const result = validatePaymentPlan({ milestones, totalAmount: 1000, eventDate });
    expect(result.valid).toBe(true);
  });
});
