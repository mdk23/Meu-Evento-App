import { describe, it, expect } from 'vitest';
import { bookingsOverlap, isVenueOverlapConstraintError } from './booking-conflict';

// `assertNoBookingConflict` is DB-transactional (queries via a `Prisma.TransactionClient`) and,
// consistent with the rest of this codebase, isn't unit-tested — only the pure overlap predicate
// it's built on is. `bookingsOverlap` is also reused client-side (calendar day-detail layout), so
// its exact half-open-interval semantics matter beyond just the server-side conflict check.

const h = (hours: number) => new Date(`2026-06-01T${String(hours).padStart(2, '0')}:00:00.000Z`);

describe('bookingsOverlap', () => {
  it('overlaps when one range is fully inside the other', () => {
    expect(bookingsOverlap(h(10), h(18), h(12), h(14))).toBe(true);
  });

  it('overlaps when ranges partially intersect', () => {
    expect(bookingsOverlap(h(10), h(14), h(12), h(18))).toBe(true);
  });

  it('overlaps when the ranges are identical', () => {
    expect(bookingsOverlap(h(10), h(14), h(10), h(14))).toBe(true);
  });

  it('does not overlap when B starts exactly when A ends (back-to-back, half-open)', () => {
    expect(bookingsOverlap(h(10), h(14), h(14), h(18))).toBe(false);
  });

  it('does not overlap when A starts exactly when B ends (back-to-back, reversed)', () => {
    expect(bookingsOverlap(h(14), h(18), h(10), h(14))).toBe(false);
  });

  it('does not overlap when the ranges are fully separate', () => {
    expect(bookingsOverlap(h(9), h(10), h(14), h(18))).toBe(false);
    expect(bookingsOverlap(h(14), h(18), h(9), h(10))).toBe(false);
  });

  it('is symmetric — order of the two ranges does not change the result', () => {
    expect(bookingsOverlap(h(10), h(14), h(12), h(18))).toBe(bookingsOverlap(h(12), h(18), h(10), h(14)));
    expect(bookingsOverlap(h(10), h(14), h(15), h(18))).toBe(bookingsOverlap(h(15), h(18), h(10), h(14)));
  });
});

describe('isVenueOverlapConstraintError', () => {
  it('recognizes a P2004 error whose database_error names the exclusion constraint', () => {
    const error = { code: 'P2004', meta: { database_error: 'conflicting key value violates exclusion constraint "bookings_no_venue_overlap"' } };
    expect(isVenueOverlapConstraintError(error)).toBe(true);
  });

  it('rejects a P2004 error from an unrelated constraint', () => {
    const error = { code: 'P2004', meta: { database_error: 'violates check constraint "some_other_check"' } };
    expect(isVenueOverlapConstraintError(error)).toBe(false);
  });

  it('rejects errors with a different Prisma code', () => {
    expect(isVenueOverlapConstraintError({ code: 'P2002', meta: { database_error: 'bookings_no_venue_overlap' } })).toBe(false);
  });

  it('rejects non-error / malformed values without throwing', () => {
    expect(isVenueOverlapConstraintError(null)).toBe(false);
    expect(isVenueOverlapConstraintError(undefined)).toBe(false);
    expect(isVenueOverlapConstraintError('plain string')).toBe(false);
    expect(isVenueOverlapConstraintError(new Error('boom'))).toBe(false);
    expect(isVenueOverlapConstraintError({ code: 'P2004' })).toBe(false);
  });
});
