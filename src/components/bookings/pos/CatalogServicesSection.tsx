import React from 'react';
import { Plus, Search, Check } from 'lucide-react';
import { ServiceItem, CartItem } from './types';

interface CatalogServicesSectionProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  categoryFilter: 'ALL' | 'SPACE' | 'EVENT';
  setCategoryFilter: (cat: 'ALL' | 'SPACE' | 'EVENT') => void;
  originFilter: 'ALL' | 'INTERNAL' | 'EXTERNAL';
  setOriginFilter: (origin: 'ALL' | 'INTERNAL' | 'EXTERNAL') => void;
  catalogServices: ServiceItem[];
  filteredCatalog: ServiceItem[];
  selectedItems: CartItem[];
  toggleCatalogService: (service: ServiceItem) => void;
}

export default function CatalogServicesSection({
  searchTerm,
  setSearchTerm,
  categoryFilter,
  setCategoryFilter,
  originFilter,
  setOriginFilter,
  catalogServices,
  filteredCatalog,
  selectedItems,
  toggleCatalogService,
}: CatalogServicesSectionProps) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const ITEMS_PER_PAGE = 5;

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, originFilter]);

  const totalPages = Math.ceil(filteredCatalog.length / ITEMS_PER_PAGE);
  const paginatedCatalog = filteredCatalog.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

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
      </div>

      <div className="flex-1 flex flex-col gap-5 overflow-hidden">
        {/* SEARCH BAR */}
        <div className="relative shrink-0">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink-3)' }} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search services (e.g. buffet, lighting, generator, DJ...)"
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
            All ({catalogServices.length})
          </button>

          <button
            type="button"
            onClick={() => setCategoryFilter('SPACE')}
            className={`tab ${categoryFilter === 'SPACE' ? 'active' : ''}`}
          >
            Venue ({catalogServices.filter(s => s.category === 'SPACE').length})
          </button>

          <button
            type="button"
            onClick={() => setCategoryFilter('EVENT')}
            className={`tab ${categoryFilter === 'EVENT' ? 'active' : ''}`}
          >
            Event ({catalogServices.filter(s => s.category === 'EVENT').length})
          </button>
        </div>

        {/* ORIGIN SUB-FILTERS */}
        <div className="row mini dim" style={{ gap: 8, flexShrink: 0 }}>
          <span className="label" style={{ flexShrink: 0 }}>Source:</span>
          <div className="row" style={{ gap: 6, overflowX: 'auto' }}>
            <button type="button" onClick={() => setOriginFilter('ALL')} className={`pill${originFilter === 'ALL' ? ' active' : ''}`}>
              All
            </button>
            <button type="button" onClick={() => setOriginFilter('INTERNAL')} className={`pill${originFilter === 'INTERNAL' ? ' active' : ''}`}>
              Internal
            </button>
            <button type="button" onClick={() => setOriginFilter('EXTERNAL')} className={`pill${originFilter === 'EXTERNAL' ? ' active' : ''}`}>
              External Partners
            </button>
          </div>
        </div>

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
                    <span className="badge b-accent">
                      {service.category === 'SPACE' ? 'Venue Service' : 'Event Service'}
                    </span>
                    <span className={`badge ${service.providerType === 'INTERNAL' ? 'b-ok' : 'b-info'}`}>
                      {service.providerType === 'INTERNAL' ? 'Internal' : service.providerName || 'External Partner'}
                    </span>
                  </div>

                  <div className="between" style={{ alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 600 }}>{service.name}</h3>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span className="num" style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', display: 'block' }}>
                        {service.price.toLocaleString()} MT
                      </span>
                      <span className="label">
                        {service.priceType === 'PER_GUEST' ? 'Per Guest' : service.priceType === 'HOURLY' ? 'Hourly' : 'Fixed Fee'}
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
      </div>
    </section>
  );
}
