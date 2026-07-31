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
    <section className="lg:col-span-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col gap-5 h-full min-h-0">
      {/* STEP HEADER */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 shrink-0">
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20 text-xs font-black flex items-center justify-center">
            2
          </span>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">Service Catalog</h2>
            <p className="text-[11px] text-zinc-500">Venue Services & Event Services</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-5 overflow-hidden">
        {/* SEARCH BAR */}
        <div className="relative shrink-0">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search services (e.g. buffet, lighting, generator, DJ...)"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 transition-all font-medium"
          />
        </div>

        {/* CATEGORY TABS */}
        <div className="flex gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800 shrink-0">
          <button
            type="button"
            onClick={() => setCategoryFilter('ALL')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all text-center ${categoryFilter === 'ALL'
              ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30 shadow-sm'
              : 'text-zinc-400 hover:text-white'
              }`}
          >
            🌟 All ({catalogServices.length})
          </button>

          <button
            type="button"
            onClick={() => setCategoryFilter('SPACE')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all text-center ${categoryFilter === 'SPACE'
              ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30 shadow-sm'
              : 'text-zinc-400 hover:text-white'
              }`}
          >
            🏛️ Venue ({catalogServices.filter(s => s.category === 'SPACE').length})
          </button>

          <button
            type="button"
            onClick={() => setCategoryFilter('EVENT')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all text-center ${categoryFilter === 'EVENT'
              ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30 shadow-sm'
              : 'text-zinc-400 hover:text-white'
              }`}
          >
            🎉 Event ({catalogServices.filter(s => s.category === 'EVENT').length})
          </button>
        </div>

        {/* ORIGIN SUB-FILTERS */}
        <div className="flex items-center gap-2 text-[11px] text-zinc-400 shrink-0">
          <span className="font-bold text-zinc-500 shrink-0">Source:</span>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            <button
              type="button"
              onClick={() => setOriginFilter('ALL')}
              className={`px-2.5 py-1 rounded-full font-bold transition-all shrink-0 ${originFilter === 'ALL'
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
            >
              All
            </button>

            <button
              type="button"
              onClick={() => setOriginFilter('INTERNAL')}
              className={`px-2.5 py-1 rounded-full font-bold transition-all shrink-0 ${originFilter === 'INTERNAL'
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
            >
              🏛️ Internal
            </button>

            <button
              type="button"
              onClick={() => setOriginFilter('EXTERNAL')}
              className={`px-2.5 py-1 rounded-full font-bold transition-all shrink-0 ${originFilter === 'EXTERNAL'
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
            >
              🤝 External Partners
            </button>
          </div>
        </div>

        {/* SERVICES SCROLLABLE CARDS */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {paginatedCatalog.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs">No services found for this filter.</p>
            </div>
          ) : (
            paginatedCatalog.map((service) => {
              const isInCart = selectedItems.some(i => i.serviceId === service.id || i.name === service.name);

              return (
                <div
                  key={service.id}
                  className={`p-4 rounded-xl border transition-all ${isInCart
                    ? 'bg-violet-600/10 border-violet-500/40 shadow-md'
                    : 'bg-zinc-950 border-zinc-800/80 hover:border-zinc-700'
                    }`}
                >
                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-300 border border-violet-500/20">
                      {service.category === 'SPACE' ? '🏛️ Venue Service' : '🎉 Event Service'}
                    </span>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${service.providerType === 'INTERNAL'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>
                      {service.providerType === 'INTERNAL' ? '🏛️ Internal' : `🤝 ${service.providerName || 'External Partner'}`}
                    </span>
                  </div>

                  <div className="flex justify-between items-start gap-2 mb-1.5">
                    <h3 className="text-xs font-bold text-white leading-snug">
                      {service.name}
                    </h3>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-violet-400 block">
                        {service.price.toLocaleString()} MT
                      </span>
                      <span className="text-[9px] font-bold text-zinc-500 uppercase">
                        {service.priceType === 'PER_GUEST' ? 'Per Guest' : service.priceType === 'HOURLY' ? 'Hourly' : 'Fixed Fee'}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-zinc-400 line-clamp-2 mb-3 leading-relaxed">
                    {service.description}
                  </p>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => toggleCatalogService(service)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${isInCart
                        ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700'
                        }`}
                    >
                      {isInCart ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" /> Added
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5 text-violet-400" /> Add
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
          <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80 shrink-0">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-300 hover:bg-zinc-800 disabled:opacity-50 transition-all"
            >
              Previous
            </button>
            <span className="text-[11px] font-medium text-zinc-400">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-300 hover:bg-zinc-800 disabled:opacity-50 transition-all"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
