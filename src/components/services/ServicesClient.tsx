'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, Plus, Loader2, X } from 'lucide-react';
import { ServiceCardDTO } from '@/types/dtos';

interface ServicesClientProps {
  initialServices: ServiceCardDTO[];
}

export default function ServicesClient({ initialServices }: ServicesClientProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Catering');
  const [executionType, setExecutionType] = useState('INTERNAL');
  const [priceType, setPriceType] = useState('FIXED');
  const [defaultPrice, setDefaultPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !category) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          category,
          executionType,
          priceType,
          defaultPrice,
        }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setName('');
        setDefaultPrice('');
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* HEADER */}
        <header className="h-16 border-b border-zinc-900 bg-zinc-950/50 flex items-center px-8 justify-between shrink-0">
          <div>
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-violet-400" /> Services Catalog
            </h2>
            <p className="text-xs text-zinc-500">Commercial service offerings with Internal vs External execution routing.</p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-lg"
          >
            <Plus className="w-4 h-4" /> Add Catalog Service
          </button>
        </header>

        {/* WORKSPACE */}
        <div className="flex-1 overflow-auto p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {initialServices.map((s) => {
              const isInternal = s.executionType === 'INTERNAL';
              return (
                <div key={s.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                        isInternal
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {isInternal ? '🟢 INTERNAL WORK ORDER' : '🔵 EXTERNAL SUPPLIER'}
                      </span>
                      <span className="text-xs text-zinc-500 font-bold">{s.priceType}</span>
                    </div>

                    <div>
                      <h3 className="text-white font-bold text-lg">{s.name}</h3>
                      <p className="text-xs text-zinc-500">Category: {s.category}</p>
                    </div>

                    <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850 flex justify-between items-center text-xs">
                      <span className="text-zinc-400">Default Selling Price</span>
                      <strong className="text-white text-sm font-black">{s.defaultPrice.toLocaleString()} MT</strong>
                    </div>
                  </div>

                  <p className="text-[11px] text-zinc-500 italic">
                    {isInternal ? 'Delivered via internal team work order & inventory' : 'Outsourced via external partner supplier'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* CREATE SERVICE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-violet-400" /> New Catalog Service
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateService} className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 font-bold block mb-1">Service Name</label>
                <input
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Gourmet Catering or Security"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-bold block mb-1">Category</label>
                <input
                  required
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  placeholder="e.g. Catering, Decoration, DJ, Media"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 font-bold block mb-1">Execution Mode</label>
                  <select
                    value={executionType}
                    onChange={e => setExecutionType(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-violet-500"
                  >
                    <option value="INTERNAL">INTERNAL WORK ORDER</option>
                    <option value="EXTERNAL">EXTERNAL SUPPLIER</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-zinc-400 font-bold block mb-1">Pricing Structure</label>
                  <select
                    value={priceType}
                    onChange={e => setPriceType(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-violet-500"
                  >
                    <option value="FIXED">FIXED RATE</option>
                    <option value="PER_GUEST">PER GUEST</option>
                    <option value="HOURLY">HOURLY RATE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-bold block mb-1">Default Selling Price (MT)</label>
                <input
                  type="number"
                  required
                  value={defaultPrice}
                  onChange={e => setDefaultPrice(e.target.value)}
                  placeholder="e.g. 35000"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-violet-500"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold flex items-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
