import { describe, it, expect } from 'vitest';
import { deriveLifecycleStages, LifecycleInput } from './booking-lifecycle';

const base: LifecycleInput = {
  bookingStatus: 'CONFIRMED',
  kind: 'EVENT',
  scheduledPayments: [],
  eventServices: [],
  eventStatus: null,
};

function stagesByLabel(input: LifecycleInput) {
  return Object.fromEntries(deriveLifecycleStages(input).map((s) => [s.label, s.state]));
}

describe('deriveLifecycleStages — Booking stage', () => {
  it('is "current" while WAITING_LIST', () => {
    expect(stagesByLabel({ ...base, bookingStatus: 'WAITING_LIST' }).Booking).toBe('current');
  });

  it('is "done" for any other status', () => {
    expect(stagesByLabel({ ...base, bookingStatus: 'CONFIRMED' }).Booking).toBe('done');
    expect(stagesByLabel({ ...base, bookingStatus: 'PLANNED' }).Booking).toBe('done');
  });
});

describe('deriveLifecycleStages — Money stage', () => {
  it('is "pending" with no scheduled payments', () => {
    expect(stagesByLabel({ ...base, scheduledPayments: [] }).Money).toBe('pending');
  });

  it('is "current" once something has been paid but the total is not yet covered', () => {
    const input = { ...base, scheduledPayments: [{ amount: 1000, paidAmount: 400 }] };
    expect(stagesByLabel(input).Money).toBe('current');
  });

  it('is "done" once paid covers scheduled in full', () => {
    const input = { ...base, scheduledPayments: [{ amount: 1000, paidAmount: 1000 }] };
    expect(stagesByLabel(input).Money).toBe('done');
  });

  it('is "done" once paid exceeds scheduled (overpayment)', () => {
    const input = { ...base, scheduledPayments: [{ amount: 1000, paidAmount: 1200 }] };
    expect(stagesByLabel(input).Money).toBe('done');
  });

  it('sums across multiple scheduled payments', () => {
    const input = {
      ...base,
      scheduledPayments: [
        { amount: 500, paidAmount: 500 },
        { amount: 500, paidAmount: 0 },
      ],
    };
    expect(stagesByLabel(input).Money).toBe('current');
  });
});

describe('deriveLifecycleStages — Services stage', () => {
  it('is "pending" with no services at all', () => {
    expect(stagesByLabel({ ...base, eventServices: [] }).Services).toBe('pending');
  });

  it('is "pending" when every active service is still PLANNING', () => {
    const input = { ...base, eventServices: [{ status: 'PLANNING' }, { status: 'PLANNING' }] };
    expect(stagesByLabel(input).Services).toBe('pending');
  });

  it('is "pending" when the only services present are CANCELLED', () => {
    const input = { ...base, eventServices: [{ status: 'CANCELLED' }] };
    expect(stagesByLabel(input).Services).toBe('pending');
  });

  it('is "current" once any active service has moved past PLANNING', () => {
    const input = { ...base, eventServices: [{ status: 'PLANNING' }, { status: 'IN_PROGRESS' }] };
    expect(stagesByLabel(input).Services).toBe('current');
  });

  it('is "done" only when every active service is COMPLETED', () => {
    const input = { ...base, eventServices: [{ status: 'COMPLETED' }, { status: 'COMPLETED' }] };
    expect(stagesByLabel(input).Services).toBe('done');
  });

  it('ignores CANCELLED lines when deciding "done"', () => {
    const input = { ...base, eventServices: [{ status: 'COMPLETED' }, { status: 'CANCELLED' }] };
    expect(stagesByLabel(input).Services).toBe('done');
  });

  it('is "current", not "done", when one active service still lags behind COMPLETED', () => {
    const input = { ...base, eventServices: [{ status: 'COMPLETED' }, { status: 'IN_PROGRESS' }] };
    expect(stagesByLabel(input).Services).toBe('current');
  });
});

describe('deriveLifecycleStages — Operations stage', () => {
  it('is always "done" for a VENUE booking, regardless of eventStatus', () => {
    expect(stagesByLabel({ ...base, kind: 'VENUE', eventStatus: null }).Operations).toBe('done');
    expect(stagesByLabel({ ...base, kind: 'VENUE', eventStatus: 'PLANNING' }).Operations).toBe('done');
  });

  it('is "pending" for an EVENT booking still in PLANNING (or no eventStatus yet)', () => {
    expect(stagesByLabel({ ...base, kind: 'EVENT', eventStatus: 'PLANNING' }).Operations).toBe('pending');
    expect(stagesByLabel({ ...base, kind: 'EVENT', eventStatus: null }).Operations).toBe('pending');
  });

  it('is "current" for IN_PROGRESS or READY', () => {
    expect(stagesByLabel({ ...base, kind: 'EVENT', eventStatus: 'IN_PROGRESS' }).Operations).toBe('current');
    expect(stagesByLabel({ ...base, kind: 'EVENT', eventStatus: 'READY' }).Operations).toBe('current');
  });

  it('is "done" once COMPLETED', () => {
    expect(stagesByLabel({ ...base, kind: 'EVENT', eventStatus: 'COMPLETED' }).Operations).toBe('done');
  });
});

describe('deriveLifecycleStages — final stage (Event / Hand-over)', () => {
  it('is labeled "Hand-over" and "pending" for a VENUE booking', () => {
    const stages = deriveLifecycleStages({ ...base, kind: 'VENUE' });
    const final = stages[stages.length - 1];
    expect(final.label).toBe('Hand-over');
    expect(final.state).toBe('pending');
  });

  it('is labeled "Event" and "current" for an EVENT booking not yet completed', () => {
    const stages = deriveLifecycleStages({ ...base, kind: 'EVENT', eventStatus: 'IN_PROGRESS' });
    const final = stages[stages.length - 1];
    expect(final.label).toBe('Event');
    expect(final.state).toBe('current');
  });

  it('is "done" for an EVENT booking whose eventStatus is COMPLETED', () => {
    const stages = deriveLifecycleStages({ ...base, kind: 'EVENT', eventStatus: 'COMPLETED' });
    expect(stages[stages.length - 1].state).toBe('done');
  });
});

describe('deriveLifecycleStages — shape', () => {
  it('always returns exactly 5 stages in a fixed order', () => {
    const stages = deriveLifecycleStages(base);
    expect(stages.map((s) => s.label)).toEqual(['Booking', 'Money', 'Services', 'Operations', 'Event']);
  });
});
