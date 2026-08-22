import { describe, it, expect } from 'vitest';
import { isScopeAllowedForKind, isServiceCompatibleWithPackageScope, assertServiceScopeAllowed, ServiceScopeError } from './service-scope';

describe('isScopeAllowedForKind (booking catalog eligibility)', () => {
  it('a SPACE booking only sees SPACE and BOTH-scoped items', () => {
    expect(isScopeAllowedForKind('SPACE', 'SPACE')).toBe(true);
    expect(isScopeAllowedForKind('BOTH', 'SPACE')).toBe(true);
    expect(isScopeAllowedForKind('EVENT', 'SPACE')).toBe(false);
  });

  it('an EVENT booking is the superset — sees everything', () => {
    expect(isScopeAllowedForKind('SPACE', 'EVENT')).toBe(true);
    expect(isScopeAllowedForKind('EVENT', 'EVENT')).toBe(true);
    expect(isScopeAllowedForKind('BOTH', 'EVENT')).toBe(true);
  });
});

describe('isServiceCompatibleWithPackageScope (package-builder compatibility)', () => {
  it('is symmetric — unlike booking eligibility, EVENT packages get no superset treatment', () => {
    expect(isServiceCompatibleWithPackageScope('SPACE', 'SPACE')).toBe(true);
    expect(isServiceCompatibleWithPackageScope('EVENT', 'SPACE')).toBe(false);
    expect(isServiceCompatibleWithPackageScope('SPACE', 'EVENT')).toBe(false);
    expect(isServiceCompatibleWithPackageScope('EVENT', 'EVENT')).toBe(true);
  });

  it('a BOTH-scoped service is compatible with either package scope', () => {
    expect(isServiceCompatibleWithPackageScope('BOTH', 'SPACE')).toBe(true);
    expect(isServiceCompatibleWithPackageScope('BOTH', 'EVENT')).toBe(true);
  });
});

describe('assertServiceScopeAllowed (write-time defense in depth)', () => {
  it('throws ServiceScopeError for an incompatible combination', () => {
    expect(() => assertServiceScopeAllowed('EVENT', 'SPACE', 'Catering')).toThrow(ServiceScopeError);
  });

  it('does not throw for a compatible combination', () => {
    expect(() => assertServiceScopeAllowed('BOTH', 'SPACE')).not.toThrow();
    expect(() => assertServiceScopeAllowed('EVENT', 'EVENT')).not.toThrow();
  });
});
