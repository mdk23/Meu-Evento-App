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
  Settings2,
} from 'lucide-react';
import { ServiceCardDTO } from '@/types/dtos';
import { FieldSchemaField, FieldType, parseFieldSchema } from '@/components/events/detail/types';
import Topbar from '@/components/aurelia/Topbar';

interface ServicesClientProps {
  initialServices: ServiceCardDTO[];
}

const FIELD_TYPES: FieldType[] = ['text', 'textarea', 'number', 'select', 'multiselect', 'date', 'datetime', 'boolean'];

/** Editable row shape for the field-schema builder — `optionsText` is a comma-separated
 * working copy of `FieldSchemaField.options`, converted to/from an array on load/save. */
interface FieldSchemaRow {
  key: string;
  type: FieldType;
  label: string;
  optionsText: string;
  required: boolean;
}

function toRows(fieldSchema: unknown): FieldSchemaRow[] {
  return parseFieldSchema(fieldSchema).map((f) => ({
    key: f.key,
    type: f.type,
    label: f.label || '',
    optionsText: (f.options || []).join(', '),
    required: f.required || false,
  }));
}

function toFieldSchema(rows: FieldSchemaRow[]): FieldSchemaField[] {
  return rows
    .filter((r) => r.key.trim())
    .map((r) => ({
      key: r.key.trim(),
      type: r.type,
      label: r.label.trim() || undefined,
      options: (r.type === 'select' || r.type === 'multiselect')
        ? r.optionsText.split(',').map((o) => o.trim()).filter(Boolean)
        : undefined,
      required: r.required || undefined,
    }));
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
  const [fieldSchemaRows, setFieldSchemaRows] = useState<FieldSchemaRow[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openAddModal = () => {
    setName('');
    setCategory('Catering');
    setExecutionType('INTERNAL');
    setPriceType('FIXED');
    setDefaultPrice('');
    setFieldSchemaRows([]);
    setIsAddModalOpen(true);
  };

  const openEditModal = (service: ServiceCardDTO) => {
    setEditingService(service);
    setName(service.name || '');
    setCategory(service.category || '');
    setExecutionType(service.defaultExecutionType || 'INTERNAL');
    setPriceType(service.priceType || 'FIXED');
    setDefaultPrice(service.defaultPrice ? service.defaultPrice.toString() : '');
    setFieldSchemaRows(toRows(service.fieldSchema));
  };

  const addFieldSchemaRow = () => {
    setFieldSchemaRows((prev) => [...prev, { key: '', type: 'text', label: '', optionsText: '', required: false }]);
  };

  const updateFieldSchemaRow = (index: number, patch: Partial<FieldSchemaRow>) => {
    setFieldSchemaRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const removeFieldSchemaRow = (index: number) => {
    setFieldSchemaRows((prev) => prev.filter((_, i) => i !== index));
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
          defaultExecutionType: executionType,
          priceType,
          defaultPrice: parseFloat(defaultPrice || '0'),
          fieldSchema: toFieldSchema(fieldSchemaRows),
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
          defaultExecutionType: executionType,
          priceType,
          defaultPrice: parseFloat(defaultPrice || '0'),
          fieldSchema: toFieldSchema(fieldSchemaRows),
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
    : initialServices.filter(s => s.defaultExecutionType === executionFilter);

  return (
    <main className="aurelia-shell flex-1 flex flex-col h-screen overflow-hidden">
      <Topbar crumb="Services Catalog" note="Commercial offerings with Internal vs External routing.">
        <button onClick={openAddModal} className="btn primary sm">
          <Plus className="w-3.5 h-3.5" /> Add Catalog Service
        </button>
      </Topbar>

      {/* FILTER TABS */}
      <div className="tabs" style={{ margin: '24px 32px 0' }}>
        {(['ALL', 'INTERNAL', 'EXTERNAL'] as const).map((filterOpt) => {
          const count = filterOpt === 'ALL'
            ? initialServices.length
            : initialServices.filter(s => s.defaultExecutionType === filterOpt).length;

          return (
            <button
              key={filterOpt}
              onClick={() => setExecutionFilter(filterOpt)}
              className={`tab ${executionFilter === filterOpt ? 'active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <span>
                {filterOpt === 'ALL' && 'All Services'}
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
                <input
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Catering, Dj, Security, Bar"
                  className="input"
                />
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
                    <Settings2 className="w-3.5 h-3.5" /> Work Order Fields
                  </label>
                  <button type="button" onClick={addFieldSchemaRow} className="btn ghost sm">
                    <Plus className="w-3 h-3" /> Add Field
                  </button>
                </div>
                <p className="mini dim">
                  Operational fields collected on this service&apos;s work orders (e.g. menu, theme). Services with no fields defined show none.
                </p>

                {fieldSchemaRows.length > 0 && (
                  <div className="stack" style={{ gap: 8 }}>
                    {fieldSchemaRows.map((row, index) => (
                      <div key={index} className="stack" style={{ gap: 8, padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid var(--rule)', background: 'var(--surface-2)' }}>
                        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr auto', gap: 8, alignItems: 'start' }}>
                          <input
                            value={row.key}
                            onChange={(e) => updateFieldSchemaRow(index, { key: e.target.value })}
                            placeholder="key (e.g. menu)"
                            className="input"
                            style={{ padding: '8px 10px', fontSize: 12 }}
                          />
                          <select
                            value={row.type}
                            onChange={(e) => updateFieldSchemaRow(index, { type: e.target.value as FieldType })}
                            className="input"
                            style={{ padding: '8px 10px', fontSize: 12 }}
                          >
                            {FIELD_TYPES.map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                          <button type="button" onClick={() => removeFieldSchemaRow(index)} className="icon-btn" style={{ width: 30, height: 30 }}>
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <input
                          value={row.label}
                          onChange={(e) => updateFieldSchemaRow(index, { label: e.target.value })}
                          placeholder="Display label (optional)"
                          className="input"
                          style={{ padding: '8px 10px', fontSize: 12 }}
                        />
                        {(row.type === 'select' || row.type === 'multiselect') && (
                          <input
                            value={row.optionsText}
                            onChange={(e) => updateFieldSchemaRow(index, { optionsText: e.target.value })}
                            placeholder="Options, comma-separated (e.g. Standard, Premium, Custom)"
                            className="input"
                            style={{ padding: '8px 10px', fontSize: 12 }}
                          />
                        )}
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
