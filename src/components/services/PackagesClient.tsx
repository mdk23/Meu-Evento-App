'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Boxes, Plus, Loader2, X, Edit3, Trash2, Save, Briefcase } from 'lucide-react';
import { PackageCardDTO, ServiceCardDTO } from '@/types/dtos';
import ThemeSwitch from '@/components/aurelia/ThemeSwitch';
import { isServiceCompatibleWithPackageScope } from '@/lib/service-scope';

const MT = (n: number) => n.toLocaleString('pt-MZ');

interface PackagesClientProps {
  initialPackages: PackageCardDTO[];
  initialServices: ServiceCardDTO[];
  /** Deep-linked from the Venue/Event workspace nav via `?scope=` — defaults to showing everything. */
  initialScopeFilter?: 'ALL' | 'VENUE' | 'EVENT';
}

export default function PackagesClient({ initialPackages, initialServices, initialScopeFilter = 'ALL' }: PackagesClientProps) {
  const router = useRouter();

  const [scopeFilter, setScopeFilter] = useState<'ALL' | 'VENUE' | 'EVENT'>(initialScopeFilter);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PackageCardDTO | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [scope, setScope] = useState<'VENUE' | 'EVENT'>('VENUE');
  const [pricingMode, setPricingMode] = useState<'COMPUTED' | 'FIXED'>('COMPUTED');
  const [fixedPrice, setFixedPrice] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openAddModal = () => {
    setName('');
    setDescription('');
    setScope(initialScopeFilter === 'EVENT' ? 'EVENT' : 'VENUE');
    setPricingMode('COMPUTED');
    setFixedPrice('');
    setSelectedServiceIds([]);
    setQuantities({});
    setIsAddModalOpen(true);
  };

  const openEditModal = (pkg: PackageCardDTO) => {
    setEditingPackage(pkg);
    setName(pkg.name);
    setDescription(pkg.description || '');
    setScope(pkg.context);
    setPricingMode(pkg.pricingMode);
    setFixedPrice(pkg.price !== null ? String(pkg.price) : '');
    setSelectedServiceIds(pkg.services.map((s) => s.serviceId));
    setQuantities(Object.fromEntries(pkg.services.map((s) => [s.serviceId, s.quantity])));
  };

  const toggleService = (serviceId: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    );
  };

  const setQuantityFor = (serviceId: string, quantity: number) => {
    setQuantities((prev) => ({ ...prev, [serviceId]: quantity }));
  };

  // Switching Workspace can make an already-checked service incompatible (e.g. an EVENT-only
  // service checked while scope was EVENT, now switching to SPACE) — drop it from the selection
  // right here rather than just hiding it from the now-filtered checklist below, since a hidden but
  // still-selected service would otherwise fail with a confusing error on submit.
  const handleScopeChange = (nextScope: 'VENUE' | 'EVENT') => {
    setScope(nextScope);
    const compatibleServiceIds = new Set(
      initialServices.filter((s) => isServiceCompatibleWithPackageScope(s.context, nextScope)).map((s) => s.id)
    );
    setSelectedServiceIds((prev) => prev.filter((id) => compatibleServiceIds.has(id)));
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
        body: JSON.stringify({
          name,
          description,
          scope,
          pricingMode,
          price: pricingMode === 'FIXED' ? fixedPrice : undefined,
          serviceIds: selectedServiceIds,
          quantities,
        }),
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
        body: JSON.stringify({
          name,
          description,
          scope,
          pricingMode,
          price: pricingMode === 'FIXED' ? fixedPrice : undefined,
          serviceIds: selectedServiceIds,
          quantities,
        }),
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
    : initialPackages.filter((p) => p.context === scopeFilter);

  const packageTotal = (pkg: PackageCardDTO) =>
    pkg.pricingMode === 'FIXED' && pkg.price !== null
      ? pkg.price
      : pkg.services.reduce((sum, s) => sum + (s.priceOverride ?? s.defaultPrice) * s.quantity, 0);

  // Arriving via the workspace sidebar (`?scope=VENUE`/`?scope=EVENT`) already puts you inside one
  // workspace — showing a cross-workspace filter tab there would contradict the "this screen is for
  // the workspace you're in" rule. The tabs (and the ability to switch scopeFilter at all) only
  // exist on the generic, unscoped `/services/packages` entry point.
  const isScoped = initialScopeFilter !== 'ALL';
  const pageTitle = scopeFilter === 'VENUE' ? 'Venue packages' : scopeFilter === 'EVENT' ? 'Event packages' : 'All packages';

  return (
    <main className="aurelia-shell flex-1 flex flex-col h-screen overflow-y-auto">
      <div className="between" style={{ padding: '32px 40px 0', alignItems: 'flex-start', flexShrink: 0 }}>
        <div>
          <h1 className="h-lg">{pageTitle}</h1>
          <p className="serif-note" style={{ marginTop: 8, maxWidth: 560 }}>
            A package is a shortcut, not a second system. Applying one expands into ordinary services you
            can then change individually.
          </p>
        </div>
        <div className="row" style={{ gap: 10, flexShrink: 0 }}>
          <Link href="/services" className="btn sm">
            <Briefcase className="w-3.5 h-3.5" /> Catalog
          </Link>
          <ThemeSwitch />
          <button onClick={openAddModal} className="btn primary">
            <Plus className="w-4 h-4" /> New package
          </button>
        </div>
      </div>

      {/* SCOPE FILTER TABS — unscoped entry point only */}
      {!isScoped && (
        <div className="tabs" style={{ margin: '24px 40px 0' }}>
          {(['ALL', 'VENUE', 'EVENT'] as const).map((filterOpt) => {
            const count = filterOpt === 'ALL'
              ? initialPackages.length
              : initialPackages.filter((p) => p.context === filterOpt).length;

            return (
              <button
                key={filterOpt}
                onClick={() => setScopeFilter(filterOpt)}
                className={`tab ${scopeFilter === filterOpt ? 'active' : ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <span>
                  {filterOpt === 'ALL' && 'All Packages'}
                  {filterOpt === 'VENUE' && 'Venue Packages'}
                  {filterOpt === 'EVENT' && 'Event Packages'}
                </span>
                <span className="badge b-mute">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex-1 page" style={{ paddingTop: isScoped ? 28 : 22 }}>
        {filteredPackages.length === 0 ? (
          <div className="empty">
            <Boxes className="w-12 h-12 mx-auto mb-3" style={{ opacity: 0.3 }} />
            <h3 className="h-sm">No Packages Found</h3>
            <p className="mini dim" style={{ marginTop: 4, maxWidth: 360, marginLeft: 'auto', marginRight: 'auto' }}>
              No bundles match the selected filter. Click &ldquo;New package&rdquo; to create one.
            </p>
          </div>
        ) : (
          <div className="grid g2">
            {filteredPackages.map((pkg, i) => {
              const isDeleting = deletingId === pkg.id;
              const serviceCount = pkg.services.length;
              return (
                <div key={pkg.id} className={`card plain f-in d${(i % 4) + 1} stack`} style={{ padding: 28, gap: 18 }}>
                  <div className="between" style={{ alignItems: 'flex-start' }}>
                    <div>
                      {!isScoped && (
                        <span className={`badge ${pkg.context === 'VENUE' ? 'b-accent' : 'b-info'}`} style={{ marginBottom: 8 }}>
                          {pkg.context === 'VENUE' ? 'Venue' : 'Event'}
                        </span>
                      )}
                      <h3 className="h-md">{pkg.name}</h3>
                      <p className="mini dim" style={{ marginTop: 2 }}>{serviceCount} service{serviceCount === 1 ? '' : 's'}</p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span className="val num" style={{ fontSize: 19 }}>{MT(packageTotal(pkg))} MT</span>
                      <span className="mini dim"> from</span>
                    </div>
                  </div>

                  {pkg.description && <p className="mini dim" style={{ lineHeight: 1.6 }}>{pkg.description}</p>}

                  <div className="stack" style={{ gap: 0 }}>
                    {pkg.services.map((s) => (
                      <div key={s.serviceId} className="between" style={{ padding: '10px 0', borderBottom: '1px solid var(--rule)' }}>
                        <span className="mini">{s.quantity !== 1 ? `${s.quantity}x ` : ''}{s.name}</span>
                        <div className="row" style={{ gap: 10, flexShrink: 0 }}>
                          <span className={`badge ${s.defaultExecutionType === 'INTERNAL' ? 'b-accent' : 'b-info'}`}>
                            {s.defaultExecutionType}
                          </span>
                          <span className="mini num">{MT((s.priceOverride ?? s.defaultPrice) * s.quantity)} MT</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="between" style={{ paddingTop: 4 }}>
                    <span className="mini dim">Providers here are defaults.</span>
                    <div className="row" style={{ gap: 8 }}>
                      <button onClick={() => openEditModal(pkg)} className="btn sm">
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
                <select value={scope} onChange={(e) => handleScopeChange(e.target.value as 'VENUE' | 'EVENT')} className="input">
                  <option value="VENUE">Venue (rental bundle)</option>
                  <option value="EVENT">Event (full-occasion bundle)</option>
                </select>
              </div>

              <div className="field">
                <label className="label">Pricing</label>
                <select value={pricingMode} onChange={(e) => setPricingMode(e.target.value as 'COMPUTED' | 'FIXED')} className="input">
                  <option value="COMPUTED">Computed — total always derived live from included services</option>
                  <option value="FIXED">Fixed — a flat negotiated rate for the whole bundle</option>
                </select>
              </div>

              {pricingMode === 'FIXED' && (
                <div className="field">
                  <label className="label">Fixed Price (MT)</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={fixedPrice}
                    onChange={(e) => setFixedPrice(e.target.value)}
                    placeholder="e.g. 90000"
                    className="input"
                  />
                </div>
              )}

              <div className="field">
                <label className="label">Included Services</label>
                <div
                  className="stack"
                  style={{ gap: 6, maxHeight: 220, overflowY: 'auto', padding: 10, borderRadius: 'var(--radius-sm)', border: '1px solid var(--rule)', background: 'var(--surface-2)' }}
                >
                  {initialServices.filter((s) => isServiceCompatibleWithPackageScope(s.context, scope)).map((s) => {
                    const isSelected = selectedServiceIds.includes(s.id);
                    return (
                      <div key={s.id} className="row" style={{ gap: 10 }}>
                        <label className="row" style={{ gap: 10, flex: 1, cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleService(s.id)}
                          />
                          <span className="mini" style={{ flex: 1, color: 'var(--ink)' }}>{s.name}</span>
                          <span className="mini dim">{s.category}</span>
                        </label>
                        {isSelected && (
                          <input
                            type="number"
                            min={1}
                            value={quantities[s.id] ?? 1}
                            onChange={(e) => setQuantityFor(s.id, Math.max(1, parseInt(e.target.value, 10) || 1))}
                            className="input"
                            style={{ width: 56, padding: '4px 6px', textAlign: 'center' }}
                            title="Quantity"
                          />
                        )}
                        <span className="mini num" style={{ width: 80, textAlign: 'right', flexShrink: 0 }}>{MT(s.defaultPrice)} MT</span>
                      </div>
                    );
                  })}
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
