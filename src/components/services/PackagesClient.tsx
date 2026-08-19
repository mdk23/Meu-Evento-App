'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Boxes, Plus, Loader2, X, Edit3, Trash2, Save, Briefcase } from 'lucide-react';
import { PackageCardDTO, ServiceCardDTO } from '@/types/dtos';
import Topbar from '@/components/aurelia/Topbar';

interface PackagesClientProps {
  initialPackages: PackageCardDTO[];
  initialServices: ServiceCardDTO[];
}

export default function PackagesClient({ initialPackages, initialServices }: PackagesClientProps) {
  const router = useRouter();

  const [scopeFilter, setScopeFilter] = useState<'ALL' | 'SPACE' | 'EVENT'>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PackageCardDTO | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [scope, setScope] = useState<'SPACE' | 'EVENT'>('SPACE');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openAddModal = () => {
    setName('');
    setDescription('');
    setScope('SPACE');
    setSelectedServiceIds([]);
    setIsAddModalOpen(true);
  };

  const openEditModal = (pkg: PackageCardDTO) => {
    setEditingPackage(pkg);
    setName(pkg.name);
    setDescription(pkg.description || '');
    setScope(pkg.scope);
    setSelectedServiceIds(pkg.services.map((s) => s.serviceId));
  };

  const toggleService = (serviceId: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    );
  };

  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Package name is required.');
      return;
    }
    if (selectedServiceIds.length === 0) {
      toast.error('Select at least one service for this package.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, scope, serviceIds: selectedServiceIds }),
      });
      if (res.ok) {
        toast.success(`Package "${name}" created!`);
        setIsAddModalOpen(false);
        router.refresh();
      } else {
        const errData = await res.json();
        toast.error(errData.error || 'Failed to create package.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Connection error.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPackage) return;
    if (!name.trim()) {
      toast.error('Package name is required.');
      return;
    }
    if (selectedServiceIds.length === 0) {
      toast.error('Select at least one service for this package.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/packages/${editingPackage.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, scope, serviceIds: selectedServiceIds }),
      });
      if (res.ok) {
        toast.success('Package updated successfully!');
        setEditingPackage(null);
        router.refresh();
      } else {
        const errData = await res.json();
        toast.error(errData.error || 'Failed to update package.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Connection error.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePrompt = (packageId: string, packageName: string) => {
    toast(`Archive package "${packageName}"?`, {
      description: 'This hides it from new bookings. Bookings that already used it keep their own service lines, unaffected.',
      action: {
        label: 'Confirm Archive',
        onClick: () => executeDeletePackage(packageId),
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {},
      },
      duration: 6000,
    });
  };

  const executeDeletePackage = async (packageId: string) => {
    setDeletingId(packageId);
    try {
      const res = await fetch(`/api/packages/${packageId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Package archived!');
        router.refresh();
      } else {
        const errData = await res.json();
        toast.error(errData.error || 'Failed to archive package.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Connection error.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredPackages = scopeFilter === 'ALL'
    ? initialPackages
    : initialPackages.filter((p) => p.scope === scopeFilter);

  const packageTotal = (pkg: PackageCardDTO) => pkg.services.reduce((sum, s) => sum + s.defaultPrice, 0);

  return (
    <main className="aurelia-shell flex-1 flex flex-col h-screen overflow-hidden">
      <Topbar crumb="Service Packages" note="Bundled offerings for Space and Event bookings.">
        <Link href="/services" className="btn sm">
          <Briefcase className="w-3.5 h-3.5" /> Catalog
        </Link>
        <button onClick={openAddModal} className="btn primary sm">
          <Plus className="w-3.5 h-3.5" /> Add Package
        </button>
      </Topbar>

      {/* SCOPE FILTER TABS */}
      <div className="tabs" style={{ margin: '24px 32px 0' }}>
        {(['ALL', 'SPACE', 'EVENT'] as const).map((filterOpt) => {
          const count = filterOpt === 'ALL'
            ? initialPackages.length
            : initialPackages.filter((p) => p.scope === filterOpt).length;

          return (
            <button
              key={filterOpt}
              onClick={() => setScopeFilter(filterOpt)}
              className={`tab ${scopeFilter === filterOpt ? 'active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <span>
                {filterOpt === 'ALL' && 'All Packages'}
                {filterOpt === 'SPACE' && 'Space Packages'}
                {filterOpt === 'EVENT' && 'Event Packages'}
              </span>
              <span className="badge b-mute">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto page" style={{ paddingTop: 22 }}>
        {filteredPackages.length === 0 ? (
          <div className="empty">
            <Boxes className="w-12 h-12 mx-auto mb-3" style={{ opacity: 0.3 }} />
            <h3 className="h-sm">No Packages Found</h3>
            <p className="mini dim" style={{ marginTop: 4, maxWidth: 360, marginLeft: 'auto', marginRight: 'auto' }}>
              No bundles match the selected filter. Click &ldquo;Add Package&rdquo; to create one.
            </p>
          </div>
        ) : (
          <div className="grid g3">
            {filteredPackages.map((pkg, i) => {
              const isDeleting = deletingId === pkg.id;
              return (
                <div key={pkg.id} className={`card plain f-in d${(i % 4) + 1} stack`}>
                  <div className="between">
                    <span className={`badge ${pkg.scope === 'SPACE' ? 'b-accent' : 'b-info'}`}>
                      {pkg.scope === 'SPACE' ? 'Space Package' : 'Event Package'}
                    </span>
                    <span className="num" style={{ fontWeight: 700, color: 'var(--accent)' }}>
                      {packageTotal(pkg).toLocaleString()} MT
                    </span>
                  </div>

                  <div>
                    <h3 className="h-sm">{pkg.name}</h3>
                    {pkg.description && <p className="mini dim" style={{ marginTop: 4 }}>{pkg.description}</p>}
                  </div>

                  <div className="stack" style={{ gap: 4, paddingTop: 10, borderTop: '1px solid var(--rule)' }}>
                    {pkg.services.map((s) => (
                      <div key={s.serviceId} className="between mini dim">
                        <span>{s.name}</span>
                        <span className="num">{s.defaultPrice.toLocaleString()} MT</span>
                      </div>
                    ))}
                  </div>

                  <div className="between" style={{ paddingTop: 12, borderTop: '1px solid var(--rule)' }}>
                    <button onClick={() => openEditModal(pkg)} className="btn ghost sm">
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      disabled={isDeleting}
                      onClick={() => handleDeletePrompt(pkg.id, pkg.name)}
                      className="icon-btn"
                      style={{ width: 30, height: 30, color: 'var(--bad)' }}
                      title="Archive Package"
                    >
                      {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE & EDIT PACKAGE DIALOG */}
      {(isAddModalOpen || editingPackage) && (
        <div className="modal-scrim">
          <div className="modal" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-h" style={{ borderBottom: '1px solid var(--rule)', paddingBottom: 16 }}>
              <h3 className="h-md" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Boxes className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                {isAddModalOpen ? 'Add New Package' : 'Edit Package'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingPackage(null);
                }}
                className="icon-btn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={isAddModalOpen ? handleCreatePackage : handleUpdatePackage} className="stack" style={{ marginTop: 20 }}>
              <div className="field">
                <label className="label">Package Name</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Espaço Completo"
                  className="input"
                />
              </div>

              <div className="field">
                <label className="label">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What this bundle is for"
                  className="input"
                />
              </div>

              <div className="field">
                <label className="label">Workspace</label>
                <select value={scope} onChange={(e) => setScope(e.target.value as 'SPACE' | 'EVENT')} className="input">
                  <option value="SPACE">Space (venue-rental bundle)</option>
                  <option value="EVENT">Event (full-occasion bundle)</option>
                </select>
              </div>

              <div className="field">
                <label className="label">Included Services</label>
                <div
                  className="stack"
                  style={{ gap: 6, maxHeight: 220, overflowY: 'auto', padding: 10, borderRadius: 'var(--radius-sm)', border: '1px solid var(--rule)', background: 'var(--surface-2)' }}
                >
                  {initialServices.map((s) => (
                    <label key={s.id} className="row" style={{ gap: 10, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={selectedServiceIds.includes(s.id)}
                        onChange={() => toggleService(s.id)}
                      />
                      <span className="mini" style={{ flex: 1, color: 'var(--ink)' }}>{s.name}</span>
                      <span className="mini dim">{s.category}</span>
                      <span className="mini num" style={{ width: 80, textAlign: 'right' }}>{s.defaultPrice.toLocaleString()} MT</span>
                    </label>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={submitting} className="btn primary" style={{ justifyContent: 'center' }}>
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {isAddModalOpen ? 'Create Package' : 'Save Package'}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
