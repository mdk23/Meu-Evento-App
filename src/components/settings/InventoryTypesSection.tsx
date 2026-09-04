'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Boxes, Plus, Loader2, X, Edit3, Trash2, Save } from 'lucide-react';
import type { InventoryTypeDTO, InventoryAttributeDefinitionDTO } from '@/types/dtos';
import type { InventoryCategoryRow } from './InventoryCategoriesSection';

const ATTR_TYPES: InventoryAttributeDefinitionDTO['type'][] = [
  'text', 'textarea', 'number', 'select', 'multiselect', 'boolean', 'date',
];

/** Editable form row for one attribute definition. `optionsText` is the raw textarea; `min`/`max`
 * are strings while editing. */
interface DefRow {
  key: string;
  label: string;
  type: InventoryAttributeDefinitionDTO['type'];
  required: boolean;
  optionsText: string;
  min: string;
  max: string;
}

function toDefRows(defs: InventoryAttributeDefinitionDTO[]): DefRow[] {
  return defs.map((d) => ({
    key: d.key,
    label: d.label,
    type: d.type,
    required: d.required,
    optionsText: (d.options ?? []).join('\n'),
    min: d.min !== undefined ? String(d.min) : '',
    max: d.max !== undefined ? String(d.max) : '',
  }));
}

function toDefPayload(rows: DefRow[]): InventoryAttributeDefinitionDTO[] {
  return rows
    .filter((r) => r.key.trim())
    .map((r) => {
      const def: InventoryAttributeDefinitionDTO = {
        key: r.key.trim(),
        label: r.label.trim() || r.key.trim(),
        type: r.type,
        required: r.required,
      };
      if (r.type === 'select' || r.type === 'multiselect') {
        def.options = r.optionsText
          .split(/[\n,]+/)
          .map((s) => s.trim())
          .filter(Boolean);
      }
      if (r.type === 'number') {
        if (r.min.trim() !== '') def.min = Number(r.min);
        if (r.max.trim() !== '') def.max = Number(r.max);
      }
      return def;
    });
}

interface InventoryTypesSectionProps {
  initialTypes: InventoryTypeDTO[];
  categories: InventoryCategoryRow[];
}

export default function InventoryTypesSection({ initialTypes, categories }: InventoryTypesSectionProps) {
  const router = useRouter();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryTypeDTO | null>(null);
  const [categoryId, setCategoryId] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [defRows, setDefRows] = useState<DefRow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const m = new Map<string, InventoryTypeDTO[]>();
    for (const t of initialTypes) {
      if (!m.has(t.categoryName)) m.set(t.categoryName, []);
      m.get(t.categoryName)!.push(t);
    }
    return Array.from(m.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [initialTypes]);

  const openAdd = () => {
    setCategoryId(categories[0]?.id || '');
    setName('');
    setCode('');
    setDefRows([]);
    setIsAddOpen(true);
  };

  const openEdit = (t: InventoryTypeDTO) => {
    setEditing(t);
    setCategoryId(t.categoryId);
    setName(t.name);
    setCode(t.code);
    setDefRows(toDefRows(t.attributeDefs));
  };

  const closeModal = () => {
    setIsAddOpen(false);
    setEditing(null);
  };

  const addDefRow = () =>
    setDefRows((prev) => [...prev, { key: '', label: '', type: 'text', required: false, optionsText: '', min: '', max: '' }]);
  const updateDefRow = (i: number, patch: Partial<DefRow>) =>
    setDefRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const removeDefRow = (i: number) => setDefRows((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Type name is required.');
    if (!/^[A-Z][A-Z0-9_]*$/.test(code.trim())) return toast.error('Code must be UPPER_SNAKE_CASE.');
    if (!categoryId) return toast.error('Pick a category.');

    setSubmitting(true);
    try {
      const url = editing ? `/api/inventory-types/${editing.id}` : '/api/inventory-types';
      const method = editing ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId, name: name.trim(), code: code.trim(), attributeDefs: toDefPayload(defRows) }),
      });
      if (res.ok) {
        toast.success(editing ? 'Type updated!' : `Type "${name}" added!`);
        closeModal();
        router.refresh();
      } else {
        toast.error((await res.json()).error || 'Failed to save type.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Connection error.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePrompt = (id: string, typeName: string) => {
    toast(`Deactivate type "${typeName}"?`, {
      description: 'Hides it from new items and requirements. Existing items keep this type, unaffected.',
      action: { label: 'Confirm Deactivate', onClick: () => executeDelete(id) },
      cancel: { label: 'Cancel', onClick: () => {} },
      duration: 6000,
    });
  };

  const executeDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/inventory-types/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Type deactivated!');
        router.refresh();
      } else {
        toast.error((await res.json()).error || 'Failed to deactivate type.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Connection error.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <div className="card plain f-in">
        <div className="between" style={{ alignItems: 'flex-start' }}>
          <div>
            <h3 className="h-md" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Boxes className="w-5 h-5" style={{ color: 'var(--accent)' }} /> Inventory Types
            </h3>
            <p className="mini dim" style={{ marginTop: 4 }}>
              What kind of resource an item is (Chair, Table, AC Unit) — a type belongs to a category
              and defines which characteristics its items carry.
            </p>
          </div>
          <button onClick={openAdd} disabled={categories.length === 0} className="btn primary sm">
            <Plus className="w-3.5 h-3.5" /> Add Type
          </button>
        </div>

        <div style={{ marginTop: 20, maxWidth: 820 }}>
          {categories.length === 0 ? (
            <p className="mini dim">Add an inventory category first — types belong to a category.</p>
          ) : grouped.length === 0 ? (
            <p className="mini dim">No inventory types yet. Add one (e.g. category Furniture → type Chair).</p>
          ) : (
            grouped.map(([catName, types]) => (
              <div key={catName} style={{ marginBottom: 14 }}>
                <p className="label" style={{ marginBottom: 6 }}>{catName}</p>
                {types.map((t) => (
                  <div key={t.id} className="kv">
                    <div className="k">
                      <span style={{ color: 'var(--ink)', fontWeight: 600, display: 'block' }}>
                        {t.name} <span className="mini dim">· {t.code}</span>
                      </span>
                      <span className="mini dim">
                        {t.attributeDefs.length} attribute{t.attributeDefs.length === 1 ? '' : 's'}
                        {t.attributeDefs.length > 0 && `: ${t.attributeDefs.map((d) => d.label).join(', ')}`}
                      </span>
                    </div>
                    <div className="row" style={{ gap: 6 }}>
                      <button onClick={() => openEdit(t)} className="icon-btn" style={{ width: 28, height: 28 }} title="Edit type">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        disabled={deletingId === t.id}
                        onClick={() => handleDeletePrompt(t.id, t.name)}
                        className="icon-btn"
                        style={{ width: 28, height: 28, color: 'var(--bad)' }}
                        title="Deactivate type"
                      >
                        {deletingId === t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>

      {(isAddOpen || editing) && (
        <div className="modal-scrim">
          <div className="modal" style={{ maxWidth: 640 }}>
            <div className="card-h" style={{ borderBottom: '1px solid var(--rule)', paddingBottom: 16 }}>
              <h3 className="h-md" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Boxes className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                {isAddOpen ? 'Add Inventory Type' : 'Edit Inventory Type'}
              </h3>
              <button onClick={closeModal} className="icon-btn">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="stack" style={{ marginTop: 20, maxHeight: '70vh', overflowY: 'auto' }}>
              <div className="grid g2">
                <div className="field">
                  <label className="label">Category</label>
                  <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input" required>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label className="label">Code</label>
                  <input
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_'))}
                    placeholder="CHAIR"
                    className="input"
                  />
                </div>
              </div>

              <div className="field">
                <label className="label">Type Name</label>
                <input required autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Chair, Table, AC Unit" className="input" />
              </div>

              <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 14 }} className="stack">
                <div className="between">
                  <label className="label">Attribute definitions</label>
                  <button type="button" onClick={addDefRow} className="btn ghost sm">
                    <Plus className="w-3 h-3" /> Add attribute
                  </button>
                </div>
                <p className="mini dim">Each item of this type will have an input for every attribute here.</p>

                {defRows.map((r, i) => (
                  <div key={i} className="stack" style={{ gap: 8, padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid var(--rule)', background: 'var(--surface-2)' }}>
                    <div className="grid" style={{ gridTemplateColumns: '1fr 1fr auto', gap: 8 }}>
                      <input
                        value={r.key}
                        onChange={(e) => updateDefRow(i, { key: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') })}
                        placeholder="key (e.g. seatingCapacity)"
                        className="input"
                        style={{ padding: '8px 10px', fontSize: 12 }}
                      />
                      <input
                        value={r.label}
                        onChange={(e) => updateDefRow(i, { label: e.target.value })}
                        placeholder="Label"
                        className="input"
                        style={{ padding: '8px 10px', fontSize: 12 }}
                      />
                      <button type="button" onClick={() => removeDefRow(i)} className="icon-btn" style={{ width: 30, height: 30 }}>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid" style={{ gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'center' }}>
                      <select
                        value={r.type}
                        onChange={(e) => updateDefRow(i, { type: e.target.value as DefRow['type'] })}
                        className="input"
                        style={{ padding: '8px 10px', fontSize: 12 }}
                      >
                        {ATTR_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <label className="mini row" style={{ gap: 6, whiteSpace: 'nowrap' }}>
                        <input type="checkbox" checked={r.required} onChange={(e) => updateDefRow(i, { required: e.target.checked })} />
                        Required
                      </label>
                    </div>
                    {(r.type === 'select' || r.type === 'multiselect') && (
                      <textarea
                        value={r.optionsText}
                        onChange={(e) => updateDefRow(i, { optionsText: e.target.value })}
                        placeholder="Options, one per line (or comma-separated)"
                        className="input"
                        rows={2}
                        style={{ padding: '8px 10px', fontSize: 12 }}
                      />
                    )}
                    {r.type === 'number' && (
                      <div className="row" style={{ gap: 8 }}>
                        <input value={r.min} onChange={(e) => updateDefRow(i, { min: e.target.value })} placeholder="min" className="input" style={{ padding: '8px 10px', fontSize: 12 }} />
                        <input value={r.max} onChange={(e) => updateDefRow(i, { max: e.target.value })} placeholder="max" className="input" style={{ padding: '8px 10px', fontSize: 12 }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button type="submit" disabled={submitting} className="btn primary" style={{ justifyContent: 'center' }}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (<><Save className="w-4 h-4" /> {isAddOpen ? 'Save Type' : 'Save Changes'}</>)}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
