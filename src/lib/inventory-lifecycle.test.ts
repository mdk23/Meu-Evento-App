import { describe, it, expect } from 'vitest';
import { resolveReservationTransition } from './inventory-lifecycle';

describe('resolveReservationTransition', () => {
  it('Reserve moves PLANNED -> RESERVED and logs a RESERVE transaction', () => {
    const result = resolveReservationTransition('PLANNED', 'RESERVE');
    expect(result).toEqual({ nextStatus: 'RESERVED', transactionType: 'RESERVE' });
  });

  it('Allocate stays RESERVED but logs an ALLOCATE transaction', () => {
    const result = resolveReservationTransition('RESERVED', 'ALLOCATE');
    expect(result).toEqual({ nextStatus: null, transactionType: 'ALLOCATE' });
  });

  it('Use moves RESERVED -> IN_USE and logs a USE transaction', () => {
    const result = resolveReservationTransition('RESERVED', 'USE');
    expect(result).toEqual({ nextStatus: 'IN_USE', transactionType: 'USE' });
  });

  it('Return moves IN_USE -> RETURNED and logs a RETURN transaction', () => {
    const result = resolveReservationTransition('IN_USE', 'RETURN');
    expect(result).toEqual({ nextStatus: 'RETURNED', transactionType: 'RETURN' });
  });

  it('Release is allowed from PLANNED or RESERVED, both logging a RELEASE transaction', () => {
    expect(resolveReservationTransition('PLANNED', 'RELEASE')).toEqual({ nextStatus: 'RELEASED', transactionType: 'RELEASE' });
    expect(resolveReservationTransition('RESERVED', 'RELEASE')).toEqual({ nextStatus: 'RELEASED', transactionType: 'RELEASE' });
  });

  it('rejects Use on a merely-PLANNED (not yet reserved) resource', () => {
    const result = resolveReservationTransition('PLANNED', 'USE');
    expect('error' in result).toBe(true);
  });

  it('rejects Allocate on an IN_USE resource', () => {
    const result = resolveReservationTransition('IN_USE', 'ALLOCATE');
    expect('error' in result).toBe(true);
  });

  it('rejects Release on an IN_USE resource — must Return, not Release, once in use', () => {
    const result = resolveReservationTransition('IN_USE', 'RELEASE');
    expect('error' in result).toBe(true);
  });

  it('rejects any action on a terminal RETURNED resource', () => {
    expect('error' in resolveReservationTransition('RETURNED', 'RELEASE')).toBe(true);
    expect('error' in resolveReservationTransition('RETURNED', 'USE')).toBe(true);
  });

  it('rejects any action on a terminal RELEASED resource', () => {
    expect('error' in resolveReservationTransition('RELEASED', 'RESERVE')).toBe(true);
  });
});
