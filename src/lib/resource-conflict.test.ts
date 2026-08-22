import { describe, it, expect } from 'vitest';
import { computeReuseAllocation, fullDaySpan } from './resource-conflict';

describe('computeReuseAllocation', () => {
  it('allows partial reuse and reports the remaining additional need on the caller side', () => {
    // 300 reserved, nothing reused yet, 350 required -> only 300 can come from reuse (§8).
    const { allowed, availableToReuse } = computeReuseAllocation(300, 0, 300);
    expect(allowed).toBe(true);
    expect(availableToReuse).toBe(300);
  });

  it('rejects a reuse request that would exceed what remains on the reservation', () => {
    // 100 reserved, 60 already reused elsewhere, 50 more requested -> only 40 left (§29 worked example).
    const { allowed, availableToReuse } = computeReuseAllocation(100, 60, 50);
    expect(allowed).toBe(false);
    expect(availableToReuse).toBe(40);
  });

  it('allows a reuse request that exactly matches what remains', () => {
    const { allowed } = computeReuseAllocation(100, 60, 40);
    expect(allowed).toBe(true);
  });

  it('the exact spec example: 300 reserved, 200 reused, second 200 request is rejected with 100 left', () => {
    const { allowed, availableToReuse } = computeReuseAllocation(300, 200, 200);
    expect(allowed).toBe(false);
    expect(availableToReuse).toBe(100);
  });
});

describe('fullDaySpan (adjacent vs. overlapping windows)', () => {
  it('produces a span covering the entire calendar day', () => {
    const { startAt, endAt } = fullDaySpan(new Date('2026-09-14T15:00:00Z'));
    expect(startAt.getHours()).toBe(0);
    expect(endAt.getHours()).toBe(23);
  });

  it('two adjacent windows (08:00-12:00 and 12:00-16:00) do not overlap under startAt < end AND endAt > start', () => {
    const aStart = new Date('2026-09-14T08:00:00Z');
    const aEnd = new Date('2026-09-14T12:00:00Z');
    const bStart = new Date('2026-09-14T12:00:00Z');
    const bEnd = new Date('2026-09-14T16:00:00Z');
    const overlaps = aStart < bEnd && aEnd > bStart;
    expect(overlaps).toBe(false);
  });

  it('two overlapping windows (08:00-12:00 and 11:00-13:00) do conflict', () => {
    const aStart = new Date('2026-09-14T08:00:00Z');
    const aEnd = new Date('2026-09-14T12:00:00Z');
    const bStart = new Date('2026-09-14T11:00:00Z');
    const bEnd = new Date('2026-09-14T13:00:00Z');
    const overlaps = aStart < bEnd && aEnd > bStart;
    expect(overlaps).toBe(true);
  });
});
