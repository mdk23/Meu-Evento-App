'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
  Briefcase, 
  Plus, 
  Loader2, 
  X, 
  Edit3, 
  Trash2, 
  Save, 
  Tag, 
  Check, 
  Filter, 
  Layers 
} from 'lucide-react';
import { ServiceCardDTO } from '@/types/dtos';

interface ServicesClientProps {
  initialServices: ServiceCardDTO[];
}

export default function ServicesClient({ initialServices }: ServicesClientProps) {
  const router = useRouter();

  // Filter state: 'ALL', 'INTERNAL', 'EXTERNAL'
  const [executionFilter, setExecutionFilter] = useState<'ALL' | 'INTERNAL' | 'EXTERNAL'>('ALL');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceCardDTO | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Catering');
  const [executionType, setExecutionType] = useState('INTERNAL');
  const [priceType, setPriceType] = useState('FIXED');
  const [defaultPrice, setDefaultPrice] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openAddModal = () => {
    setName('');
    setCategory('Catering');
    setExecutionType('INTERNAL');
    setPriceType('FIXED');
    setDefaultPrice('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (service: ServiceCardDTO) => {
    setEditingService(service);
    setName(service.name || '');
    setCategory(service.category || '');
    setExecutionType(service.executionType || 'INTERNAL');
    setPriceType(service.priceType || 'FIXED');
    setDefaultPrice(service.defaultPrice ? service.defaultPrice.toString() : '');
  };

  // Create Service Handler
  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !category.trim()) {
      toast.error('Service Name and Category are required.');
      return;
    }
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
          defaultPrice: parseFloat(defaultPrice || '0'),
        }),
      });
      if (res.ok) {
        toast.success(`Service "${name}" added to catalog!`);
        setIsAddModalOpen(false);
        router.refresh();
      } else {
        const errData = await res.json();
        toast.error(errData.error || 'Failed to create service.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Connection error.');
    } finally {
      setSubmitting(false);
    }
  };

  // Update Service Handler
  const handleUpdateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    if (!name.trim() || !category.trim()) {
      toast.error('Service Name and Category are required.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/services/${editingService.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          category,
          executionType,
          priceType,
          defaultPrice: parseFloat(defaultPrice || '0'),
        }),
      });
      if (res.ok) {
        toast.success('Service updated successfully!');
        setEditingService(null);
        router.refresh();
      } else {
        const errData = await res.json();
        toast.error(errData.error || 'Failed to update service.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Connection error.');
    } finally {
      setSubmitting(false);
    }
  };

  // Sonner Deactivate Prompt
  const handleDeletePrompt = (serviceId: string, serviceName: string) => {
    toast(`Deactivate service "${serviceName}"?`, {
      description: 'This hides it from new booking/event selection. Existing bookings and events using it keep their own recorded price and name, unaffected.',
      action: {
        label: 'Confirm Deactivate',
        onClick: () => executeDeleteService(serviceId),
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {},
      },
      duration: 6000,
    });
  };

  const executeDeleteService = async (serviceId: string) => {
    setDeletingId(serviceId);
    try {
      const res = await fetch(`/api/services/${serviceId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('Service deactivated!');
        router.refresh();
      } else {
        const errData = await res.json();
        toast.error(errData.error || 'Failed to deactivate service.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Connection error.');
    } finally {
      setDeletingId(null);
    }
  };

  // Apply filter
  const filteredServices = executionFilter === 'ALL'
    ? initialServices
    : initialServices.filter(s => s.executionType === executionFilter);

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-zinc-950 text-white font-sans">
      {/* HEADER */}
      <header className="h-16 border-b border-zinc-900 bg-zinc-950/80 px-8 flex items-center justify-between shrink-0 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Briefcase className="w-5 h-5 text-violet-400" />
          <div>
            <h2 className="text-white font-bold text-lg tracking-tight">Services Catalog</h2>
            <p className="text-xs text-zinc-500">Commercial offerings with Internal vs External routing</p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-violet-600/20"
        >
          <Plus className="w-4 h-4" /> Add Catalog Service
        </button>
      </header>

      {/* FILTER TABS */}
      <div className="px-8 pt-6 flex gap-2 shrink-0">
        {(['ALL', 'INTERNAL', 'EXTERNAL'] as const).map((filterOpt) => {
          const count = filterOpt === 'ALL' 
            ? initialServices.length 
            : initialServices.filter(s => s.executionType === filterOpt).length;

          return (
            <button
              key={filterOpt}
              onClick={() => setExecutionFilter(filterOpt)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                executionFilter === filterOpt
                  ? 'bg-violet-600/20 text-violet-300 border-violet-500/40 shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
              }`}
            >
              <span>
                {filterOpt === 'ALL' && 'All Services'}
                {filterOpt === 'INTERNAL' && 'Internal House Services'}
                {filterOpt === 'EXTERNAL' && 'External Supplier Services'}
              </span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-zinc-950 text-zinc-500 border border-zinc-800">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* WORKSPACE - TABLE VIEW */}
      <div className="flex-1 overflow-y-auto p-8 pr-4">
        {filteredServices.length === 0 ? (
          <div className="text-center py-16 text-zinc-600 border border-dashed border-zinc-800 rounded-2xl p-8">
            <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-30 text-violet-400" />
            <h3 className="text-sm font-bold text-zinc-300">No Services Found</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              No catalog services match the selected filter. Click "Add Catalog Service" to populate.
            </p>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-950/45 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                    <th className="py-4 px-6">Service Name</th>
                    <th className="py-4 px-6">Category</th>
                    <th className="py-4 px-6">Price Type</th>
                    <th className="py-4 px-6 text-right">Base Price</th>
                    <th className="py-4 px-6">Execution Mode</th>
                    <th className="py-4 px-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-xs text-zinc-200">
                  {filteredServices.map((s) => {
                    const isInternal = s.executionType === 'INTERNAL';
                    const isDeleting = deletingId === s.id;

                    return (
                      <tr key={s.id} className="hover:bg-zinc-850/40 transition-colors">
                        <td className="py-4 px-6 font-bold text-white text-sm">{s.name}</td>
                        <td className="py-4 px-6">
                          <span className="bg-zinc-950 text-zinc-400 border border-zinc-800 px-2.5 py-1 rounded-md text-[10px] uppercase font-bold">
                            {s.category}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            s.priceType === 'PER_GUEST' 
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                              : 'bg-zinc-950 text-zinc-400 border border-zinc-800'
                          }`}>
                            {s.priceType === 'PER_GUEST' ? 'Per Guest (Pax)' : 'Fixed Price'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right font-mono font-bold text-violet-400">
                          {s.defaultPrice.toLocaleString()} MT
                        </td>
                        <td className="py-4 px-6">
                          <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${
                            isInternal
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          }`}>
                            {isInternal ? '🟢 INTERNAL WORK' : '🔵 EXTERNAL SUPPLIER'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openEditModal(s)}
                              className="text-violet-400 hover:text-violet-300 p-1.5 rounded bg-violet-500/10 hover:bg-violet-500/20 transition-all"
                              title="Edit Service"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              disabled={isDeleting}
                              onClick={() => handleDeletePrompt(s.id, s.name)}
                              className="text-zinc-500 hover:text-red-400 p-1.5 rounded hover:bg-zinc-800 transition-colors"
                              title="Deactivate Service"
                            >
                              {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* CREATE & EDIT SERVICE DIALOG */}
      {(isAddModalOpen || editingService) && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-violet-400" />
                {isAddModalOpen ? 'Add New Catalog Service' : 'Edit Catalog Service'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingService(null);
                }}
                className="text-zinc-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={isAddModalOpen ? handleCreateService : handleUpdateService} className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 font-bold block mb-1">Service Name</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Buffet Banquete Real"
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-violet-500 font-bold"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-bold block mb-1">Category</label>
                <input
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Catering, Dj, Security, Bar"
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-violet-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 font-bold block mb-1">Execution Mode</label>
                  <select
                    value={executionType}
                    onChange={(e) => setExecutionType(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-violet-500 font-bold"
                  >
                    <option value="INTERNAL">House Staff (Internal)</option>
                    <option value="EXTERNAL">Supplier Partner (External)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-zinc-400 font-bold block mb-1">Price Unit</label>
                  <select
                    value={priceType}
                    onChange={(e) => setPriceType(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-violet-500 font-bold"
                  >
                    <option value="FIXED">Fixed Amount (Total)</option>
                    <option value="PER_GUEST">Per Guest (Pax)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-bold block mb-1">Base Price (MT)</label>
                <input
                  type="number"
                  required
                  value={defaultPrice}
                  onChange={(e) => setDefaultPrice(e.target.value)}
                  placeholder="e.g. 15000"
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-violet-500 font-mono font-bold"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-violet-600/20"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {isAddModalOpen ? 'Register Service' : 'Save Service Details'}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
