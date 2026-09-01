'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Briefcase,
  Plus,
  Loader2,
  X,
  Edit3,
  Trash2,
  Save,
  Boxes,
  Package,
} from 'lucide-react';
import { ServiceCardDTO, ServiceInventoryRequirementDTO } from '@/types/dtos';
import Topbar from '@/components/aurelia/Topbar';

interface InventoryItemOption {
  id: string;
  name: string;
  categoryId: string;
}

interface InventoryCategoryOption {
  id: string;
  name: string;
  description: string | null;
}

interface ServiceCategoryOption {
  id: string;
  name: string;
  description: string | null;
}

interface ServicesClientProps {
  initialServices: ServiceCardDTO[];
  /** Deep-linked from the Venue/Event workspace nav via `?scope=` — defaults to showing everything. */
  initialScopeFilter?: 'ALL' | 'VENUE' | 'EVENT';
  inventoryItems: InventoryItemOption[];
  inventoryCategories: InventoryCategoryOption[];
  /** Managed on the Settings page — the "Category" picker options for a new Service. */
  serviceCategories: ServiceCategoryOption[];
}

type QuantityTypeOption = 'FIXED' | 'PER_GUEST' | 'PER_UNIT' | 'GUESTS_PER_UNIT' | 'MANUAL';

/** Plain-language reference for each quantity rule — shown as a legend in the Inventory Requirements
 * section and as a live hint under the row that's being edited. `quantity` below is the number typed
 * into the row's field. */
const QUANTITY_RULE_HELP: Record<QuantityTypeOption, { label: string; blurb: string; example: string }> = {
  FIXED: {
    label: 'Fixed',
    blurb: 'Always the same amount — the guest count and the line quantity are ignored.',
    example: 'quantity 4 → every booking needs 4 (e.g. 4 AC units).',
  },
  PER_GUEST: {
    label: 'Per guest',
    blurb: "Multiplied by the booking's guest count.",
    example: 'quantity 1, 120 guests → 120 (e.g. 1 chair per guest).',
  },
  PER_UNIT: {
    label: 'Per unit',
    blurb: "Multiplied by how many units of this service the booking buys.",
    example: 'quantity 10, service sold as 6 → 60 (e.g. 10 napkins per table × 6 tables).',
  },
  GUESTS_PER_UNIT: {
    label: 'Guests per unit',
    blurb: 'Guest count ÷ this number, rounded up — the number is how many guests one unit covers.',
    example: 'quantity 12, 100 guests → ⌈100 ÷ 12⌉ = 9 (e.g. 1 table per 12 guests).',
  },
  MANUAL: {
    label: 'Manual',
    blurb: 'Just a starting default — the operator sets the real number on each booking, and it never auto-recalculates.',
    example: 'quantity 20 → the booking opens at 20, editable per booking.',
  },
};

/** Editable row shape for the Inventory Requirements builder. `targetType` drives whether
 * `inventoryItemId` or `categoryId` is the active fulfillment target; the other stays populated
 * with whatever was last selected so switching back doesn't lose it. */
interface RequirementRow {
  targetType: 'ITEM' | 'CATEGORY';
  inventoryItemId: string;
  categoryId: string;
  quantity: string;
  quantityType: QuantityTypeOption;
  optional: boolean;
  notes: string;
}

function toRequirementRows(requirements: ServiceInventoryRequirementDTO[]): RequirementRow[] {
  return requirements.map((r) => ({
    targetType: r.categoryId ? 'CATEGORY' : 'ITEM',
    inventoryItemId: r.inventoryItemId || '',
    categoryId: r.categoryId || '',
    quantity: String(r.quantity),
    quantityType: r.quantityType,
    optional: r.optional,
    notes: r.notes || '',
  }));
}

function toRequirementPayload(rows: RequirementRow[]) {
  return rows
    .filter((r) => (r.targetType === 'ITEM' ? r.inventoryItemId : r.categoryId))
    .map((r) => ({
      inventoryItemId: r.targetType === 'ITEM' ? r.inventoryItemId : null,
      categoryId: r.targetType === 'CATEGORY' ? r.categoryId : null,
      quantity: parseInt(r.quantity || '1', 10) || 1,
      quantityType: r.quantityType,
      optional: r.optional,
      notes: r.notes.trim() || undefined,
    }));
}

export default function ServicesClient({ initialServices, initialScopeFilter = 'ALL', inventoryItems, inventoryCategories, serviceCategories }: ServicesClientProps) {
  const router = useRouter();
  const defaultCategory = serviceCategories[0]?.name || '';

  // Filter state: 'ALL', 'INTERNAL', 'EXTERNAL'
  const [executionFilter, setExecutionFilter] = useState<'ALL' | 'INTERNAL' | 'EXTERNAL'>('ALL');
  // Workspace scope is set only by which link brought you here (sidebar's Venue/Event Services, or the
  // unscoped catalog) — no in-page tab to switch it, since the Workspace column already shows it per row.
  const scopeFilter = initialScopeFilter;

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceCardDTO | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState(defaultCategory);
  const [context, setContext] = useState<'VENUE' | 'EVENT' | 'BOTH'>('BOTH');
  const [executionType, setExecutionType] = useState('INTERNAL');
  const [priceType, setPriceType] = useState('FIXED');
  const [defaultPrice, setDefaultPrice] = useState('');
  const [requirementRows, setRequirementRows] = useState<RequirementRow[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openAddModal = () => {
    setName('');
    setCategory(defaultCategory);
    setContext(initialScopeFilter === 'VENUE' || initialScopeFilter === 'EVENT' ? initialScopeFilter : 'BOTH');
    setExecutionType('INTERNAL');
    setPriceType('FIXED');
    setDefaultPrice('');
    setRequirementRows([]);
    setIsAddModalOpen(true);
  };

  const openEditModal = (service: ServiceCardDTO) => {
    setEditingService(service);
    setName(service.name || '');
    setCategory(service.category || '');
    setContext(service.context || 'BOTH');
    setExecutionType(service.defaultExecutionType || 'INTERNAL');
    setPriceType(service.priceType || 'FIXED');
    setDefaultPrice(service.defaultPrice ? service.defaultPrice.toString() : '');
    setRequirementRows(toRequirementRows(service.inventoryRequirements));
  };

  const addRequirementRow = () => {
    setRequirementRows((prev) => [
      ...prev,
      {
        targetType: inventoryCategories.length > 0 ? 'CATEGORY' : 'ITEM',
        inventoryItemId: inventoryItems[0]?.id || '',
        categoryId: inventoryCategories[0]?.id || '',
        quantity: '1',
        quantityType: 'FIXED',
        optional: false,
        notes: '',
      },
    ]);
  };

  const updateRequirementRow = (index: number, patch: Partial<RequirementRow>) => {
    setRequirementRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const removeRequirementRow = (index: number) => {
    setRequirementRows((prev) => prev.filter((_, i) => i !== index));
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
          context,
          defaultExecutionType: executionType,
          priceType,
          defaultPrice: parseFloat(defaultPrice || '0'),
          inventoryRequirements: toRequirementPayload(requirementRows),
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
          context,
          defaultExecutionType: executionType,
          priceType,
          defaultPrice: parseFloat(defaultPrice || '0'),
          inventoryRequirements: toRequirementPayload(requirementRows),
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

  // Apply filters — scope first (Venue/Event/Both), then execution mode
  const scopedServices = scopeFilter === 'ALL'
    ? initialServices
    : initialServices.filter((s) => s.context === scopeFilter || s.context === 'BOTH');
  const filteredServices = executionFilter === 'ALL'
    ? scopedServices
    : scopedServices.filter(s => s.defaultExecutionType === executionFilter);

  // Arriving via the workspace sidebar (`?scope=VENUE`/`?scope=EVENT`) already puts you inside one
  // workspace — showing a cross-workspace filter tab there would contradict the "this screen is for
  // the workspace you're in" rule, same reasoning as PackagesClient.
  const isScoped = initialScopeFilter !== 'ALL';
  const pageTitle = scopeFilter === 'VENUE' ? 'Venue services' : scopeFilter === 'EVENT' ? 'Event services' : 'Services catalog';

  return (
    <main className="aurelia-shell flex-1 flex flex-col h-screen overflow-hidden">
      <Topbar crumb={pageTitle} note="Commercial offerings with Internal vs External routing.">
        <Link href="/services/packages" className="btn sm">
          <Boxes className="w-3.5 h-3.5" /> Packages
        </Link>
        <button onClick={openAddModal} className="btn primary sm">
          <Plus className="w-3.5 h-3.5" /> Add Catalog Service
        </button>
      </Topbar>

      {/* EXECUTION MODE FILTER — workspace scope is set by which link brought you here (sidebar or
          the unscoped catalog), shown via the Workspace column below rather than a second tab row. */}
      <div className="tabs" style={{ margin: '24px 32px 0' }}>
        {(['ALL', 'INTERNAL', 'EXTERNAL'] as const).map((filterOpt) => {
          const count = filterOpt === 'ALL'
            ? scopedServices.length
            : scopedServices.filter(s => s.defaultExecutionType === filterOpt).length;

          return (
            <button
              key={filterOpt}
              onClick={() => setExecutionFilter(filterOpt)}
              className={`tab ${executionFilter === filterOpt ? 'active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <span>
                {filterOpt === 'ALL' && 'All'}
                {filterOpt === 'INTERNAL' && 'Internal House Services'}
                {filterOpt === 'EXTERNAL' && 'External Supplier Services'}
              </span>
              <span className="badge b-mute">{count}</span>
            </button>
          );
        })}
      </div>

      {/* WORKSPACE - TABLE VIEW */}
      <div className="flex-1 overflow-y-auto page" style={{ paddingTop: 22 }}>
        {filteredServices.length === 0 ? (
          <div className="empty">
            <Briefcase className="w-12 h-12 mx-auto mb-3" style={{ opacity: 0.3 }} />
            <h3 className="h-sm">No Services Found</h3>
            <p className="mini dim" style={{ marginTop: 4, maxWidth: 360, marginLeft: 'auto', marginRight: 'auto' }}>
              No catalog services match the selected filter. Click &ldquo;Add Catalog Service&rdquo; to populate.
            </p>
          </div>
        ) : (
          <div className="card plain" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="scrollx" style={{ padding: '20px 22px 6px' }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Service Name</th>
                    <th>Category</th>
                    {!isScoped && <th>Workspace</th>}
                    <th>Quantity Rule</th>
                    <th>Price Type</th>
                    <th className="r">Base Price</th>
                    <th>Execution Mode</th>
                    <th className="r">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredServices.map((s) => {
                    const isInternal = s.defaultExecutionType === 'INTERNAL';
                    const isDeleting = deletingId === s.id;

                    return (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                        <td>
                          <span className="badge b-mute">{s.category}</span>
                        </td>
                        {!isScoped && (
                          <td>
                            <span className={`badge ${s.context === 'VENUE' ? 'b-accent' : s.context === 'EVENT' ? 'b-info' : 'b-mute'}`}>
                              {s.context === 'BOTH' ? 'Venue & Event' : s.context === 'VENUE' ? 'Venue' : 'Event'}
                            </span>
                          </td>
                        )}
                        <td>
                          {s.inventoryRequirements.length === 0 ? (
                            <span className="mini dim">—</span>
                          ) : (
                            <div className="row" style={{ gap: 4, flexWrap: 'wrap' }}>
                              {Array.from(new Set(s.inventoryRequirements.map((r) => r.quantityType))).map((qt) => (
                                <span key={qt} className="badge b-mute">{QUANTITY_RULE_HELP[qt].label}</span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${s.priceType === 'PER_GUEST' ? 'b-warn' : 'b-mute'}`}>
                            {s.priceType === 'PER_GUEST' ? 'Per Guest (Pax)' : 'Fixed Price'}
                          </span>
                        </td>
                        <td className="r num" style={{ fontWeight: 600, color: 'var(--accent)' }}>
                          {s.defaultPrice.toLocaleString()} MT
                        </td>
                        <td>
                          <span className={`badge ${isInternal ? 'b-ok' : 'b-info'}`}>
                            {isInternal ? 'Internal Work' : 'External Supplier'}
                          </span>
                        </td>
                        <td className="r">
                          <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
                            <button onClick={() => openEditModal(s)} className="icon-btn" style={{ width: 30, height: 30 }} title="Edit Service">
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              disabled={isDeleting}
                              onClick={() => handleDeletePrompt(s.id, s.name)}
                              className="icon-btn"
                              style={{ width: 30, height: 30, color: 'var(--bad)' }}
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
        <div className="modal-scrim">
          <div className="modal" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-h" style={{ borderBottom: '1px solid var(--rule)', paddingBottom: 16 }}>
              <h3 className="h-md" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Briefcase className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                {isAddModalOpen ? 'Add New Catalog Service' : 'Edit Catalog Service'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingService(null);
                }}
                className="icon-btn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={isAddModalOpen ? handleCreateService : handleUpdateService} className="stack" style={{ marginTop: 20 }}>
              <div className="field">
                <label className="label">Service Name</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Buffet Banquete Real"
                  className="input"
                />
              </div>

              <div className="field">
                <label className="label">Category</label>
                {serviceCategories.length > 0 ? (
                  <>
                    <select
                      required
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="input"
                    >
                      {!category && <option value="">-- Select category --</option>}
                      {category && !serviceCategories.some((c) => c.name === category) && (
                        <option value={category}>{category} (current)</option>
                      )}
                      {serviceCategories.map((c) => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                    <p className="mini dim" style={{ marginTop: 4 }}>
                      Manage these options on the <Link href="/settings">Settings</Link> page.
                    </p>
                  </>
                ) : (
                  <>
                    <input
                      required
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="e.g. Catering, Dj, Security, Bar"
                      className="input"
                    />
                    <p className="mini dim" style={{ marginTop: 4 }}>
                      Tip: define a reusable list on the <Link href="/settings">Settings</Link> page.
                    </p>
                  </>
                )}
              </div>

              <div className="field">
                <label className="label">Workspace</label>
                <select value={context} onChange={(e) => setContext(e.target.value as 'VENUE' | 'EVENT' | 'BOTH')} className="input">
                  <option value="VENUE">Venue only (rental bookings)</option>
                  <option value="EVENT">Event only (full-occasion bookings)</option>
                  <option value="BOTH">Both — usable from either workspace</option>
                </select>
              </div>

              <div className="grid g2">
                <div className="field">
                  <label className="label">Execution Mode</label>
                  <select value={executionType} onChange={(e) => setExecutionType(e.target.value)} className="input">
                    <option value="INTERNAL">House Staff (Internal)</option>
                    <option value="EXTERNAL">Supplier Partner (External)</option>
                  </select>
                </div>

                <div className="field">
                  <label className="label">Price Unit</label>
                  <select value={priceType} onChange={(e) => setPriceType(e.target.value)} className="input">
                    <option value="FIXED">Fixed Amount (Total)</option>
                    <option value="PER_GUEST">Per Guest (Pax)</option>
                  </select>
                </div>
              </div>

              <p className="mini dim" style={{ marginTop: -8 }}>
                {priceType === 'PER_GUEST' ? (
                  <><strong>Per Guest (Pax)</strong> — the base price is charged for each guest: base price × guest count (e.g. 450 MT × 120 guests = 54,000 MT). The line quantity tracks the guest count automatically.</>
                ) : (
                  <><strong>Fixed Amount (Total)</strong> — one flat price for the whole line, no matter how many guests (e.g. venue rental 60,000 MT). Multiply it yourself by setting the line quantity on the booking.</>
                )}
              </p>

              <div className="field">
                <label className="label">Base Price (MT)</label>
                <input
                  type="number"
                  required
                  value={defaultPrice}
                  onChange={(e) => setDefaultPrice(e.target.value)}
                  placeholder="e.g. 15000"
                  className="input"
                />
              </div>


              <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 16 }} className="stack">
                <div className="between">
                  <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Package className="w-3.5 h-3.5" /> Inventory Requirements
                  </label>
                  <button type="button" onClick={addRequirementRow} className="btn ghost sm">
                    <Plus className="w-3 h-3" /> Add Requirement
                  </button>
                </div>
                <p className="mini dim">
                  What this service normally needs from stock — a template only, never reserves anything.
                  Point at one specific item, or a whole category to let the variant be chosen per booking.
                </p>

                <details open style={{ border: '1px solid var(--rule)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', background: 'var(--surface-2)' }}>
                  <summary className="mini" style={{ cursor: 'pointer', color: 'var(--ink-2)', fontWeight: 600 }}>
                    Quantity rules explained
                  </summary>
                  <div className="stack" style={{ gap: 8, marginTop: 8 }}>
                    {(Object.keys(QUANTITY_RULE_HELP) as QuantityTypeOption[]).map((key) => (
                      <div key={key} className="mini" style={{ lineHeight: 1.6 }}>
                        <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{QUANTITY_RULE_HELP[key].label}</span>
                        <span className="dim"> — {QUANTITY_RULE_HELP[key].blurb} </span>
                        <span className="dim" style={{ fontStyle: 'italic' }}>{QUANTITY_RULE_HELP[key].example}</span>
                      </div>
                    ))}
                  </div>
                </details>

                {requirementRows.length > 0 && (
                  <div className="stack" style={{ gap: 8 }}>
                    {requirementRows.map((row, index) => (
                      <div key={index} className="stack" style={{ gap: 8, padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid var(--rule)', background: 'var(--surface-2)' }}>
                        <div className="grid" style={{ gridTemplateColumns: '110px 1fr auto', gap: 8, alignItems: 'start' }}>
                          <select
                            value={row.targetType}
                            onChange={(e) => updateRequirementRow(index, { targetType: e.target.value as 'ITEM' | 'CATEGORY' })}
                            className="input"
                            style={{ padding: '8px 10px', fontSize: 12 }}
                          >
                            <option value="ITEM">Specific item</option>
                            <option value="CATEGORY">Any in category</option>
                          </select>
                          {row.targetType === 'ITEM' ? (
                            <select
                              value={row.inventoryItemId}
                              onChange={(e) => updateRequirementRow(index, { inventoryItemId: e.target.value })}
                              className="input"
                              style={{ padding: '8px 10px', fontSize: 12 }}
                            >
                              <option value="">-- Select item --</option>
                              {inventoryItems.map((i) => (
                                <option key={i.id} value={i.id}>{i.name}</option>
                              ))}
                            </select>
                          ) : (
                            <select
                              value={row.categoryId}
                              onChange={(e) => updateRequirementRow(index, { categoryId: e.target.value })}
                              className="input"
                              style={{ padding: '8px 10px', fontSize: 12 }}
                            >
                              <option value="">-- Select category --</option>
                              {inventoryCategories.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                          )}
                          <button type="button" onClick={() => removeRequirementRow(index)} className="icon-btn" style={{ width: 30, height: 30 }}>
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr auto', gap: 8, alignItems: 'center' }}>
                          <select
                            value={row.quantityType}
                            onChange={(e) => updateRequirementRow(index, { quantityType: e.target.value as QuantityTypeOption })}
                            className="input"
                            style={{ padding: '8px 10px', fontSize: 12 }}
                          >
                            <option value="FIXED">Fixed</option>
                            <option value="PER_GUEST">Per guest</option>
                            <option value="PER_UNIT">Per unit</option>
                            <option value="GUESTS_PER_UNIT">Guests per unit (e.g. seats per table)</option>
                            <option value="MANUAL">Manual — set on the booking</option>
                          </select>
                          <input
                            type="number"
                            min={0}
                            step="1"
                            value={row.quantity}
                            onChange={(e) => updateRequirementRow(index, { quantity: e.target.value.replace(/[^0-9]/g, '') })}
                            placeholder={
                              row.quantityType === 'GUESTS_PER_UNIT' ? 'Guests per unit'
                              : row.quantityType === 'MANUAL' ? 'Default quantity'
                              : 'Quantity'
                            }
                            className="input"
                            style={{ padding: '8px 10px', fontSize: 12 }}
                          />
                          <label className="mini row" style={{ gap: 6, alignItems: 'center', whiteSpace: 'nowrap' }}>
                            <input
                              type="checkbox"
                              checked={row.optional}
                              onChange={(e) => updateRequirementRow(index, { optional: e.target.checked })}
                            />
                            Optional
                          </label>
                        </div>
                        <p className="mini dim" style={{ margin: 0, lineHeight: 1.6 }}>
                          <span style={{ color: 'var(--ink-2)', fontWeight: 600 }}>{QUANTITY_RULE_HELP[row.quantityType].label}:</span>{' '}
                          {QUANTITY_RULE_HELP[row.quantityType].blurb}{' '}
                          <span style={{ fontStyle: 'italic' }}>{QUANTITY_RULE_HELP[row.quantityType].example}</span>
                        </p>
                        <input
                          value={row.notes}
                          onChange={(e) => updateRequirementRow(index, { notes: e.target.value })}
                          placeholder="Notes (optional)"
                          className="input"
                          style={{ padding: '8px 10px', fontSize: 12 }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button type="submit" disabled={submitting} className="btn primary" style={{ justifyContent: 'center' }}>
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
    </main>
  );
}
