import { describe, it, expect } from 'vitest';
import { resolveReservationTransition } from './inventory-lifecycle';

describe('resolveReservationTransition', () => {
  it('Confirm moves HELD -> CONFIRMED with no transaction (pure commitment change)', () => {
    const result = resolveReservationTransition('HELD', 'CONFIRM');
    expect(result).toEqual({ nextStatus: 'CONFIRMED', transactionType: null });
  });

  it('Allocate stays CONFIRMED but logs an ALLOCATE transaction', () => {
    const result = resolveReservationTransition('CONFIRMED', 'ALLOCATE');
    expect(result).toEqual({ nextStatus: null, transactionType: 'ALLOCATE' });
  });

  it('Use moves CONFIRMED -> CONSUMED and logs a USE transaction', () => {
    const result = resolveReservationTransition('CONFIRMED', 'USE');
    expect(result).toEqual({ nextStatus: 'CONSUMED', transactionType: 'USE' });
  });

  it('Return moves CONSUMED -> RETURNED and logs a RETURN transaction', () => {
    const result = resolveReservationTransition('CONSUMED', 'RETURN');
    expect(result).toEqual({ nextStatus: 'RETURNED', transactionType: 'RETURN' });
  });

  it('Release is allowed from HELD or CONFIRMED, both logging a RELEASE transaction', () => {
    expect(resolveReservationTransition('HELD', 'RELEASE')).toEqual({ nextStatus: 'RELEASED', transactionType: 'RELEASE' });
    expect(resolveReservationTransition('CONFIRMED', 'RELEASE')).toEqual({ nextStatus: 'RELEASED', transactionType: 'RELEASE' });
  });

  it('Cancel is allowed from HELD or CONFIRMED, also logging a RELEASE transaction', () => {
    expect(resolveReservationTransition('HELD', 'CANCEL')).toEqual({ nextStatus: 'CANCELLED', transactionType: 'RELEASE' });
  });

  it('rejects Use on a merely-HELD (not yet confirmed) reservation', () => {
    const result = resolveReservationTransition('HELD', 'USE');
    expect('error' in result).toBe(true);
  });

  it('rejects Allocate on a CONSUMED reservation', () => {
    const result = resolveReservationTransition('CONSUMED', 'ALLOCATE');
    expect('error' in result).toBe(true);
  });

  it('rejects any action on a terminal RETURNED reservation', () => {
    expect('error' in resolveReservationTransition('RETURNED', 'RELEASE')).toBe(true);
    expect('error' in resolveReservationTransition('RETURNED', 'USE')).toBe(true);
  });

  it('rejects any action on a terminal CANCELLED reservation', () => {
    expect('error' in resolveReservationTransition('CANCELLED', 'CONFIRM')).toBe(true);
  });
});
