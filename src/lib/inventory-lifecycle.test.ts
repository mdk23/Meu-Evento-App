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

  it('Confirm moves RESERVED -> CONFIRMED with no ledger row (pure commitment-strength change)', () => {
    expect(resolveReservationTransition('RESERVED', 'CONFIRM')).toEqual({ nextStatus: 'CONFIRMED', transactionType: null });
  });

  it('Issue moves RESERVED or CONFIRMED -> ISSUED and logs an ISSUE transaction', () => {
    expect(resolveReservationTransition('RESERVED', 'ISSUE')).toEqual({ nextStatus: 'ISSUED', transactionType: 'ISSUE' });
    expect(resolveReservationTransition('CONFIRMED', 'ISSUE')).toEqual({ nextStatus: 'ISSUED', transactionType: 'ISSUE' });
  });

  it('Use is allowed from CONFIRMED and ISSUED as well as RESERVED', () => {
    expect(resolveReservationTransition('CONFIRMED', 'USE')).toEqual({ nextStatus: 'IN_USE', transactionType: 'USE' });
    expect(resolveReservationTransition('ISSUED', 'USE')).toEqual({ nextStatus: 'IN_USE', transactionType: 'USE' });
  });

  it('Return is allowed straight from ISSUED (dispatched but not marked used)', () => {
    expect(resolveReservationTransition('ISSUED', 'RETURN')).toEqual({ nextStatus: 'RETURNED', transactionType: 'RETURN' });
  });

  it('Damage and Loss are ledger-only (status unchanged) and allowed once issued or later', () => {
    expect(resolveReservationTransition('ISSUED', 'DAMAGE')).toEqual({ nextStatus: null, transactionType: 'DAMAGE' });
    expect(resolveReservationTransition('IN_USE', 'DAMAGE')).toEqual({ nextStatus: null, transactionType: 'DAMAGE' });
    expect(resolveReservationTransition('RETURNED', 'LOSS')).toEqual({ nextStatus: null, transactionType: 'LOSS' });
  });

  it('rejects Confirm on a merely-PLANNED resource', () => {
    expect('error' in resolveReservationTransition('PLANNED', 'CONFIRM')).toBe(true);
  });

  it('rejects Issue once already IN_USE', () => {
    expect('error' in resolveReservationTransition('IN_USE', 'ISSUE')).toBe(true);
  });

  it('rejects Damage before anything is issued', () => {
    expect('error' in resolveReservationTransition('RESERVED', 'DAMAGE')).toBe(true);
  });

  it('allows Release from CONFIRMED (not yet dispatched) but not from ISSUED', () => {
    expect(resolveReservationTransition('CONFIRMED', 'RELEASE')).toEqual({ nextStatus: 'RELEASED', transactionType: 'RELEASE' });
    expect('error' in resolveReservationTransition('ISSUED', 'RELEASE')).toBe(true);
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
