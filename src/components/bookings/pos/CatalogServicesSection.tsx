import React from 'react';
import { Plus, Search, Check, Boxes, ListChecks, AlertTriangle, Star } from 'lucide-react';
import { ServiceItem, CartItem, CatalogPackage } from './types';
import { SeatingItemGap } from '@/lib/seating';

export interface PackageCapacityWarning {
  packageId: string;
  packageName: string;
  guestCount: number;
  packageCapacity: number;
  additionalCapacityRequired: number;
}

interface CatalogServicesSectionProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  categoryFilter: 'ALL' | 'VENUE' | 'EVENT';
  setCategoryFilter: (cat: 'ALL' | 'VENUE' | 'EVENT') => void;
  catalogServices: ServiceItem[];
  filteredCatalog: ServiceItem[];
  selectedItems: CartItem[];
  toggleCatalogService: (service: ServiceItem) => void;
  packages: CatalogPackage[];
  onApplyPackage: (pkg: CatalogPackage) => void;
  isPackageApplied: (pkg: CatalogPackage) => boolean;
  packageCapacityWarnings: PackageCapacityWarning[];
  seatingGuestWarnings: SeatingItemGap[];
}

export default function CatalogServicesSection({
  searchTerm,
  setSearchTerm,
  categoryFilter,
  setCategoryFilter,
  catalogServices,
  filteredCatalog,
  selectedItems,
  toggleCatalogService,
  packages,
  onApplyPackage,
  isPackageApplied,
  packageCapacityWarnings,
  seatingGuestWarnings,
}: CatalogServicesSectionProps) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [viewMode, setViewMode] = React.useState<'services' | 'packages'>('services');
  const ITEMS_PER_PAGE = 5;

  // Reset to page 1 when the filters change — adjusted during render (React's recommended
  // alternative to an effect for this exact case) rather than after the fact, so there's no
  // one-frame flash of the old page's results under the new filter.
  const [prevFilters, setPrevFilters] = React.useState({ searchTerm, categoryFilter });
  if (prevFilters.searchTerm !== searchTerm || prevFilters.categoryFilter !== categoryFilter) {
    setPrevFilters({ searchTerm, categoryFilter });
    setCurrentPage(1);
  }

  const totalPages = Math.ceil(filteredCatalog.length / ITEMS_PER_PAGE);
  const paginatedCatalog = filteredCatalog.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const filteredPackages = packages.filter((pkg) => {
    const matchesSearch = pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pkg.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || pkg.context === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <section className="lg:col-span-4 card plain flex flex-col gap-5 h-full min-h-0">
      {/* STEP HEADER */}
      <div className="between" style={{ paddingBottom: 12, borderBottom: '1px solid var(--rule)', flexShrink: 0 }}>
        <div className="row" style={{ gap: 12 }}>
          <span className="avatar" style={{ width: 28, height: 28, fontSize: 12 }}>2</span>
          <div>
            <h2 className="h-sm">Service Catalog</h2>
            <p className="mini dim">Venue Services & Event Services</p>
          </div>
        </div>

        <div className="row" style={{ gap: 4, flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => setViewMode('services')}
            className={`pill${viewMode === 'services' ? ' active' : ''}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <ListChecks className="w-3 h-3" /> Services
          </button>
          <button
            type="button"
            onClick={() => setViewMode('packages')}
            className={`pill${viewMode === 'packages' ? ' active' : ''}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Boxes className="w-3 h-3" /> Packages
          </button>
        </div>
      </div>

      {packageCapacityWarnings.length > 0 && (
        <div
          className="stack"
          style={{ gap: 6, padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid var(--warn)', background: 'var(--warn-bg, var(--surface-2))', flexShrink: 0 }}
        >
          {packageCapacityWarnings.map((w) => (
            <div key={w.packageId} className="row mini" style={{ gap: 8, alignItems: 'flex-start' }}>
              <AlertTriangle className="w-4 h-4" style={{ color: 'var(--warn)', flexShrink: 0, marginTop: 1 }} />
              <span>
                Booking exceeds &ldquo;{w.packageName}&rdquo; capacity. Guests {w.guestCount}, package {w.packageCapacity}
                {' '}&mdash; add services for {w.additionalCapacityRequired} more. The package is not changed.
              </span>
            </div>
          ))}
        </div>
      )}

      {seatingGuestWarnings.length > 0 && (
        <div
          className="stack"
          style={{ gap: 6, padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid var(--warn)', background: 'var(--warn-bg, var(--surface-2))', flexShrink: 0 }}
        >
          {seatingGuestWarnings.map((g) => (
            <div key={g.inventoryItemId ?? g.itemLabel} className="row mini" style={{ gap: 8, alignItems: 'flex-start' }}>
              <AlertTriangle className="w-4 h-4" style={{ color: 'var(--warn)', flexShrink: 0, marginTop: 1 }} />
              <span>
                {g.itemLabel}: {g.seatsProvided} seat{g.seatsProvided === 1 ? '' : 's'} for {g.guestCount} guest
                {g.guestCount === 1 ? '' : 's'} &mdash; {Math.abs(g.delta)} {g.direction === 'UNDER' ? 'short' : 'over'}.
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex-1 flex flex-col gap-5 overflow-hidden">
        {/* SEARCH BAR */}
        <div className="relative shrink-0">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink-3)' }} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={viewMode === 'services' ? 'Search services (e.g. buffet, lighting, generator, DJ...)' : 'Search packages...'}
            className="input"
            style={{ paddingLeft: 34 }}
          />
        </div>

        {/* CATEGORY TABS */}
        <div className="tabs" style={{ border: 'none', margin: 0, gap: 6 }}>
          <button
            type="button"
            onClick={() => setCategoryFilter('ALL')}
            className={`tab ${categoryFilter === 'ALL' ? 'active' : ''}`}
          >
            All ({viewMode === 'services' ? catalogServices.length : packages.length})
          </button>

          <button
            type="button"
            onClick={() => setCategoryFilter('VENUE')}
            className={`tab ${categoryFilter === 'VENUE' ? 'active' : ''}`}
          >
            Venue ({viewMode === 'services'
              ? catalogServices.filter(s => s.category === 'VENUE').length
              : packages.filter(p => p.context === 'VENUE').length})
          </button>

          <button
            type="button"
            onClick={() => setCategoryFilter('EVENT')}
            className={`tab ${categoryFilter === 'EVENT' ? 'active' : ''}`}
          >
            Event ({viewMode === 'services'
              ? catalogServices.filter(s => s.category === 'EVENT').length
              : packages.filter(p => p.context === 'EVENT').length})
          </button>
        </div>

        {viewMode === 'services' ? (
          <>
            {/* SERVICES SCROLLABLE CARDS */}
            <div className="flex-1 overflow-y-auto stack" style={{ gap: 10, paddingRight: 4 }}>
              {paginatedCatalog.length === 0 ? (
                <div className="empty" style={{ padding: '32px 16px' }}>
                  <Search className="w-8 h-8 mx-auto mb-2" style={{ opacity: 0.4 }} />
                  <p className="mini dim">No services found for this filter.</p>
                </div>
              ) : (
                paginatedCatalog.map((service) => {
                  const isInCart = selectedItems.some(i => i.serviceId === service.id || i.name === service.name);

                  return (
                    <div
                      key={service.id}
                      style={{
                        padding: 14,
                        borderRadius: 'var(--radius-sm)',
                        border: `1px solid ${isInCart ? 'var(--accent)' : 'var(--rule)'}`,
                        background: isInCart ? 'var(--accent-soft)' : 'var(--surface-2)',
                        transition: 'all var(--t-fast)',
                      }}
                    >
                      <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                        {service.featured && (
                          <span className="badge b-warn" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Star className="w-3 h-3" /> Featured
                          </span>
                        )}
                        <span className="badge b-accent">
                          {service.category === 'VENUE' ? 'Venue Service' : 'Event Service'}
                        </span>
                      </div>

                      <div className="between" style={{ alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                        <h3 style={{ fontSize: 13, fontWeight: 600 }}>{service.name}</h3>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <span className="num" style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', display: 'block' }}>
                            {service.price.toLocaleString()} MT
                          </span>
                          <span className="label">
                            {service.priceType === 'PER_GUEST' ? 'Per Guest' : service.priceType === 'PER_HOUR' ? 'Hourly' : 'Fixed Fee'}
                          </span>
                        </div>
                      </div>

                      <p className="mini dim" style={{ marginBottom: 10 }}>
                        {service.description}
                      </p>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => toggleCatalogService(service)}
                          className={`btn sm ${isInCart ? '' : 'primary'}`}
                        >
                          {isInCart ? (
                            <>
                              <Check className="w-3.5 h-3.5" /> Added
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" /> Add
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* PAGINATION CONTROLS */}
            {totalPages >= 1 && (
              <div className="between" style={{ paddingTop: 12, borderTop: '1px solid var(--rule)', flexShrink: 0 }}>
                <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="btn sm">
                  Previous
                </button>
                <span className="mini dim">
                  Page {currentPage} of {totalPages}
                </span>
                <button type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="btn sm">
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          /* PACKAGES SCROLLABLE CARDS */
          <div className="flex-1 overflow-y-auto stack" style={{ gap: 10, paddingRight: 4 }}>
            {filteredPackages.length === 0 ? (
              <div className="empty" style={{ padding: '32px 16px' }}>
                <Boxes className="w-8 h-8 mx-auto mb-2" style={{ opacity: 0.4 }} />
                <p className="mini dim">No packages found for this filter.</p>
              </div>
            ) : (
              filteredPackages.map((pkg) => {
                const total = pkg.services.reduce((sum, s) => sum + s.defaultPrice, 0);
                const allAdded = isPackageApplied(pkg);

                return (
                  <div
                    key={pkg.id}
                    style={{
                      padding: 14,
                      borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${allAdded ? 'var(--accent)' : 'var(--rule)'}`,
                      background: allAdded ? 'var(--accent-soft)' : 'var(--surface-2)',
                      transition: 'all var(--t-fast)',
                    }}
                  >
                    <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                      <span className={`badge ${pkg.context === 'VENUE' ? 'b-accent' : 'b-info'}`}>
                        {pkg.context === 'VENUE' ? 'Venue Package' : 'Event Package'}
                      </span>
                      <span className="badge b-mute">{pkg.services.length} service{pkg.services.length === 1 ? '' : 's'}</span>
                    </div>

                    <div className="between" style={{ alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                      <h3 style={{ fontSize: 13, fontWeight: 600 }}>{pkg.name}</h3>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <span className="num" style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', display: 'block' }}>
                          {total.toLocaleString('pt-MZ')} MT
                        </span>
                        <span className="label">from</span>
                      </div>
                    </div>

                    {pkg.description && (
                      <p className="mini dim" style={{ marginBottom: 10 }}>
                        {pkg.description}
                      </p>
                    )}

                    <div className="stack" style={{ gap: 4, marginBottom: 10, paddingTop: 8, borderTop: '1px solid var(--rule)' }}>
                      {pkg.services.map((s) => (
                        <div key={s.serviceId} className="between mini dim">
                          <span>{s.name}</span>
                          <span className="num">{s.defaultPrice.toLocaleString('pt-MZ')} MT</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => onApplyPackage(pkg)}
                        className={`btn sm ${allAdded ? '' : 'primary'}`}
                      >
                        {allAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> Added
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" /> Add Package
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </section>
  );
}
