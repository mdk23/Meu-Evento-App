export type CatalogScope = 'SPACE' | 'EVENT' | 'BOTH';
export type WorkspaceKind = 'SPACE' | 'EVENT';

/** Whether a catalog item (Service or Package) scoped `scope` should be selectable from a booking
 * in workspace `kind`. Event is the superset workspace — an Event booking legitimately needs the
 * venue too (its own example: "an event uses an event package and a space package"), so it sees
 * everything. A Space booking is commercial-only and only ever sees Space + Both-scoped items. */
export function isScopeAllowedForKind(scope: CatalogScope, kind: WorkspaceKind): boolean {
  if (kind === 'EVENT') return true;
  return scope === 'SPACE' || scope === 'BOTH';
}

/** Whether a service scoped `serviceScope` may be bundled into a package scoped `packageScope`.
 * Deliberately symmetric — unlike `isScopeAllowedForKind`, a package never gets Event's "superset"
 * treatment: an EVENT package cannot bundle a SPACE-only service any more than a SPACE package can
 * bundle an EVENT-only one. Only a BOTH-scoped service (or an exact scope match) is compatible,
 * which is what keeps a package's own catalog "pure" to its declared workspace. */
export function isServiceCompatibleWithPackageScope(serviceScope: CatalogScope, packageScope: 'SPACE' | 'EVENT'): boolean {
  return serviceScope === packageScope || serviceScope === 'BOTH';
}

export class ServiceScopeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ServiceScopeError';
  }
}

/**
 * Defense in depth — the booking-creation catalog fetch already filters to eligible services, but a
 * client bypassing that (a direct API call) must not be able to smuggle an EVENT-only service into a
 * SPACE booking, or vice versa. Must be called before any `BookingService` write, not just relied on
 * via the filtered catalog.
 */
export function assertServiceScopeAllowed(scope: CatalogScope, kind: WorkspaceKind, serviceName?: string): void {
  if (!isScopeAllowedForKind(scope, kind)) {
    throw new ServiceScopeError(
      `"${serviceName || 'This service'}" isn't available in the ${kind === 'SPACE' ? 'Venue' : 'Event'} workspace.`
    );
  }
}
