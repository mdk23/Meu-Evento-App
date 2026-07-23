'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, HardHat, Truck, Package, CheckCircle2, Shield } from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
  category: string;
}

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
}

interface Guideline {
  name: string;
  required: number;
  unit: string;
}

interface LogisticsData {
  suppliers: Supplier[];
  inventory: InventoryItem[];
  guidelines: Guideline[];
}

export function EventLogistics({ eventId }: { eventId: string }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<LogisticsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLogistics() {
      try {
        const res = await fetch(`/api/events/${eventId}/logistics`);
        if (!res.ok) throw new Error('Failed to load logistics planning data');
        const json = await res.json();
        setData(json);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchLogistics();
  }, [eventId]);

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-violet-400">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-6 rounded-xl flex items-center gap-3">
        <AlertCircle className="w-6 h-6" />
        <div>
          <h4 className="font-bold">Error loading Logistics Planning</h4>
          <p className="text-xs">{error || 'An unexpected error occurred.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* HEADER SUMMARY */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-white font-bold text-lg mb-1 flex items-center gap-2">
            <HardHat className="w-5 h-5 text-violet-400" /> Logistics & Equipment Planning
          </h3>
          <p className="text-xs text-zinc-500">Coordinate warehouse inventories, allocate tables & chairs, and confirm supplier arrivals.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* EQUIPMENT GUIDELINES (DYNAMIC CALCULATIONS) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h4 className="text-white font-bold flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-violet-400" /> Required Equipment Guidelines
          </h4>
          <p className="text-xs text-zinc-500">Calculated automatically based on the event&apos;s expected attendance.</p>

          <div className="space-y-3">
            {data.guidelines.map((guide, idx) => {
              // Find matching item in inventory to check stock
              const stockItem = data.inventory.find(i => i.name === guide.name);
              const inStock = stockItem ? stockItem.quantity : 0;
              const hasEnough = inStock >= guide.required;

              return (
                <div key={idx} className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 flex justify-between items-center">
                  <div>
                    <span className="text-white font-bold text-sm block">{guide.name}</span>
                    <span className="text-[10px] text-zinc-550 block mt-0.5">
                      Recommended: <strong className="text-zinc-350">{guide.required} {guide.unit}</strong>
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[9px] text-zinc-500 font-bold uppercase block mb-1">Stock Availability</span>
                    {hasEnough ? (
                      <span className="text-xs text-emerald-400 font-extrabold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Sufficient ({inStock} available)
                      </span>
                    ) : (
                      <span className="text-xs text-amber-500 font-extrabold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Low Stock (Only {inStock} available)
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ACTIVE SUPPLIERS */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h4 className="text-white font-bold flex items-center gap-2 mb-2">
            <Truck className="w-4 h-4 text-violet-400" /> Coordinated Suppliers
          </h4>
          <p className="text-xs text-zinc-500">External vendor assignments active for this event slot.</p>

          <div className="space-y-3">
            {data.suppliers.map((sup) => (
              <div key={sup.id} className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 flex justify-between items-center">
                <div>
                  <span className="text-white font-bold text-sm block">{sup.name}</span>
                  <span className="text-[9px] text-violet-400 font-black uppercase tracking-wider block mt-0.5">
                    {sup.category}
                  </span>
                </div>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
                  <Shield className="w-3.5 h-3.5" /> Approved Partner
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
