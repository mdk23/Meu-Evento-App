import { describe, it, expect } from 'vitest';
import { isScopeAllowedForKind, isServiceCompatibleWithPackageScope, assertServiceScopeAllowed, ServiceScopeError } from './service-scope';

describe('isScopeAllowedForKind (booking catalog eligibility)', () => {
  it('a SPACE booking only sees SPACE and BOTH-scoped items', () => {
    expect(isScopeAllowedForKind('VENUE', 'VENUE')).toBe(true);
    expect(isScopeAllowedForKind('BOTH', 'VENUE')).toBe(true);
    expect(isScopeAllowedForKind('EVENT', 'VENUE')).toBe(false);
  });

  it('an EVENT booking is the superset — sees everything', () => {
    expect(isScopeAllowedForKind('VENUE', 'EVENT')).toBe(true);
    expect(isScopeAllowedForKind('EVENT', 'EVENT')).toBe(true);
    expect(isScopeAllowedForKind('BOTH', 'EVENT')).toBe(true);
  });
});

describe('isServiceCompatibleWithPackageScope (package-builder compatibility)', () => {
  it('is symmetric — unlike booking eligibility, EVENT packages get no superset treatment', () => {
    expect(isServiceCompatibleWithPackageScope('VENUE', 'VENUE')).toBe(true);
    expect(isServiceCompatibleWithPackageScope('EVENT', 'VENUE')).toBe(false);
    expect(isServiceCompatibleWithPackageScope('VENUE', 'EVENT')).toBe(false);
    expect(isServiceCompatibleWithPackageScope('EVENT', 'EVENT')).toBe(true);
  });

  it('a BOTH-scoped service is compatible with either package scope', () => {
    expect(isServiceCompatibleWithPackageScope('BOTH', 'VENUE')).toBe(true);
    expect(isServiceCompatibleWithPackageScope('BOTH', 'EVENT')).toBe(true);
  });
});

describe('assertServiceScopeAllowed (write-time defense in depth)', () => {
  it('throws ServiceScopeError for an incompatible combination', () => {
    expect(() => assertServiceScopeAllowed('EVENT', 'VENUE', 'Catering')).toThrow(ServiceScopeError);
  });

  it('does not throw for a compatible combination', () => {
    expect(() => assertServiceScopeAllowed('BOTH', 'VENUE')).not.toThrow();
    expect(() => assertServiceScopeAllowed('EVENT', 'EVENT')).not.toThrow();
  });
});
