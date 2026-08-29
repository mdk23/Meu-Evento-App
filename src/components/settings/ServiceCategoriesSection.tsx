'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Layers, Plus, Loader2, X, Edit3, Trash2, Save } from 'lucide-react';

export interface ServiceCategoryRow {
  id: string;
  name: string;
  description: string | null;
}

interface ServiceCategoriesSectionProps {
  initialCategories: ServiceCategoryRow[];
}

export default function ServiceCategoriesSection({ initialCategories }: ServiceCategoriesSectionProps) {
  const router = useRouter();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceCategoryRow | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openAdd = () => {
    setName('');
    setDescription('');
    setIsAddOpen(true);
  };

  const openEdit = (category: ServiceCategoryRow) => {
    setEditing(category);
    setName(category.name);
    setDescription(category.description || '');
  };

  const closeModal = () => {
    setIsAddOpen(false);
    setEditing(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Category name is required.');
      return;
    }
    setSubmitting(true);
    try {
      const url = editing ? `/api/service-categories/${editing.id}` : '/api/service-categories';
      const method = editing ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });
      if (res.ok) {
        toast.success(editing ? 'Category updated!' : `Category "${name}" added!`);
        closeModal();
        router.refresh();
      } else {
        const errData = await res.json();
        toast.error(errData.error || 'Failed to save category.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Connection error.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePrompt = (id: string, categoryName: string) => {
    toast(`Deactivate category "${categoryName}"?`, {
      description: 'Removes it from the "create Service" picker. Services already using this label keep it, unaffected.',
      action: { label: 'Confirm Deactivate', onClick: () => executeDelete(id) },
      cancel: { label: 'Cancel', onClick: () => {} },
      duration: 6000,
    });
  };

  const executeDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/service-categories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Category deactivated!');
        router.refresh();
      } else {
        const errData = await res.json();
        toast.error(errData.error || 'Failed to deactivate category.');
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
              <Layers className="w-5 h-5" style={{ color: 'var(--accent)' }} /> Service Categories
            </h3>
            <p className="mini dim" style={{ marginTop: 4 }}>
              The options in the &ldquo;Category&rdquo; picker when you create a Service (e.g.
              &ldquo;Catering&rdquo;, &ldquo;Decoration&rdquo;, &ldquo;Entertainment&rdquo;).
            </p>
          </div>
          <button onClick={openAdd} className="btn primary sm">
            <Plus className="w-3.5 h-3.5" /> Add Category
          </button>
        </div>

        <div style={{ marginTop: 20, maxWidth: 820 }}>
          {initialCategories.length === 0 ? (
            <p className="mini dim">No service categories yet. Add one so the Services page has a category picker.</p>
          ) : (
            initialCategories.map((c) => (
              <div key={c.id} className="kv">
                <div className="k">
                  <span style={{ color: 'var(--ink)', fontWeight: 600, display: 'block' }}>{c.name}</span>
                  {c.description && <span className="mini dim">{c.description}</span>}
                </div>
                <div className="row" style={{ gap: 6 }}>
                  <button onClick={() => openEdit(c)} className="icon-btn" style={{ width: 28, height: 28 }} title="Edit category">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={deletingId === c.id}
                    onClick={() => handleDeletePrompt(c.id, c.name)}
                    className="icon-btn"
                    style={{ width: 28, height: 28, color: 'var(--bad)' }}
                    title="Deactivate category"
                  >
                    {deletingId === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {(isAddOpen || editing) && (
        <div className="modal-scrim">
          <div className="modal">
            <div className="card-h" style={{ borderBottom: '1px solid var(--rule)', paddingBottom: 16 }}>
              <h3 className="h-md" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Layers className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                {isAddOpen ? 'Add Service Category' : 'Edit Service Category'}
              </h3>
              <button onClick={closeModal} className="icon-btn">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="stack" style={{ marginTop: 20 }}>
              <div className="field">
                <label className="label">Category Name</label>
                <input
                  required
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Catering, Decoration, Entertainment, Security"
                  className="input"
                />
              </div>

              <div className="field">
                <label className="label">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional notes about what belongs in this category"
                  className="input"
                  rows={3}
                />
              </div>

              <button type="submit" disabled={submitting} className="btn primary" style={{ justifyContent: 'center' }}>
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {isAddOpen ? 'Save Category' : 'Save Changes'}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
