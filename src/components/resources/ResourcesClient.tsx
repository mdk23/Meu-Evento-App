'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Building2, Package, Users, Truck, Plus, Loader2, X, Edit3, Trash2, Save, ChevronDown, ChevronRight } from 'lucide-react';
import { Prisma } from '@prisma/client';
import Topbar from '@/components/aurelia/Topbar';

type ResourceVenue = Prisma.SpaceGetPayload<{ select: { id: true; name: true; capacity: true; address: true; description: true } }>;
type ResourceInventoryItem = Prisma.InventoryItemGetPayload<{ select: { id: true; name: true; totalQuantity: true; categoryId: true; category: { select: { name: true } } } }>;
type ResourceStaff = Prisma.StaffGetPayload<{ select: { id: true; name: true; role: true; email: true; phone: true } }>;
type ResourceSupplier = Prisma.SupplierGetPayload<{ select: { id: true; name: true; category: true; email: true; phone: true } }>;

interface InventoryCategoryOption {
  id: string;
  name: string;
}

interface ResourcesClientProps {
  initialData: {
    space: ResourceVenue | null;
    inventory: ResourceInventoryItem[];
    staff: ResourceStaff[];
    suppliers: ResourceSupplier[];
    inventoryCategories: InventoryCategoryOption[];
  };
}

export default function ResourcesClient({ initialData }: ResourcesClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('space');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState(initialData.inventoryCategories[0]?.name || '');
  const [quantity, setQuantity] = useState('50');
  const [role, setRole] = useState('Chef');
  const [capacity, setCapacity] = useState('500');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Inventory item edit/delete — separate from the generic create-modal state above, since editing
  // targets one specific existing item regardless of which tab is active.
  const [editingItem, setEditingItem] = useState<ResourceInventoryItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (categoryName: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryName)) next.delete(categoryName);
      else next.add(categoryName);
      return next;
    });
  };

  const openEditItem = (item: ResourceInventoryItem) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditCategoryId(item.categoryId);
    setEditQuantity(String(item.totalQuantity));
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setEditSubmitting(true);
    try {
      const res = await fetch(`/api/inventory-items/${editingItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, categoryId: editCategoryId, quantity: editQuantity }),
      });
      if (res.ok) {
        toast.success('Inventory item updated!');
        setEditingItem(null);
        router.refresh();
      } else {
        const errData = await res.json();
        toast.error(errData.error || 'Failed to update item.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Connection error.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteItemPrompt = (id: string, itemName: string) => {
    toast(`Deactivate "${itemName}"?`, {
      description: 'Hides it from new reservations/bookings. Existing reservations keep their own recorded name, unaffected.',
      action: { label: 'Confirm Deactivate', onClick: () => executeDeleteItem(id) },
      cancel: { label: 'Cancel', onClick: () => { } },
      duration: 6000,
    });
  };

  const executeDeleteItem = async (id: string) => {
    setDeletingItemId(id);
    try {
      const res = await fetch(`/api/inventory-items/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Inventory item deactivated!');
        router.refresh();
      } else {
        const errData = await res.json();
        toast.error(errData.error || 'Failed to deactivate item.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Connection error.');
    } finally {
      setDeletingItemId(null);
    }
  };

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const resourceType = activeTab.toUpperCase();
      const res = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceType,
          name,
          category,
          quantity,
          role,
          capacity,
          address,
        }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setName('');
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const { space, inventory, staff, suppliers, inventoryCategories } = initialData;

  // Grouped by category, both the group order and the items within each group alphabetical —
  // `inventory` already arrives name-sorted from the repository, so grouping preserves that order.
  const groupedInventory = useMemo(() => {
    const groups = new Map<string, ResourceInventoryItem[]>();
    for (const item of inventory) {
      const key = item.category.name;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [inventory]);

  return (
    <>
      <main className="aurelia-shell flex-1 flex flex-col h-screen overflow-hidden">
        <Topbar crumb="Resource Operations Portal" note="Manage main Venue, Inventory, Staff team, and Supplier partners.">
          <button onClick={() => setIsModalOpen(true)} className="btn primary sm">
            <Plus className="w-3.5 h-3.5" /> Add {activeTab.slice(0, 1).toUpperCase() + activeTab.slice(1)}
          </button>
        </Topbar>

        {/* RESOURCE TAB NAV */}
        <div className="tabs" style={{ padding: '0 34px' }}>
          {[
            { id: 'space', label: 'Main Venue', icon: Building2 },
            { id: 'inventory', label: 'Inventory Items', icon: Package },
            { id: 'staff', label: 'Internal Staff', icon: Users },
            { id: 'suppliers', label: 'External Suppliers', icon: Truck },
          ].map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`tab${isActive ? ' active' : ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* WORKSPACE */}
        {/* The Inventory tab drops `.page`'s 1440px cap — a category-grouped grid benefits from the
            full viewport width, unlike the other tabs' single-column/card layouts. */}
        <div className={`flex-1 overflow-auto page${activeTab === 'inventory' ? ' full-bleed' : ''}`}>

          {/* TAB 1: SPACE */}
          {activeTab === 'space' && (
            <div className="card plain stack" style={{ maxWidth: 640 }}>
              <div className="between" style={{ alignItems: 'flex-start' }}>
                <div>
                  <h3 className="h-md">{space?.name || 'Royal Events Main Venue'}</h3>
                  <p className="mini dim" style={{ marginTop: 4 }}>{space?.address || '100 Grand Boulevard, Maputo'}</p>
                </div>
                <span className="badge b-ok">Single Venue Configured</span>
              </div>

              <div className="grid g2" style={{ padding: 16, borderRadius: 'var(--radius-sm)', border: '1px solid var(--rule)', background: 'var(--surface-2)' }}>
                <div>
                  <span className="label">Max Capacity</span>
                  <div className="val" style={{ fontSize: 24 }}>{space?.capacity || 500} Guests</div>
                </div>
                <div>
                  <span className="label">Venue Type</span>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)', marginTop: 8 }}>Indoor Hall & Terrace</div>
                </div>
              </div>

              <p className="mini dim">{space?.description}</p>
            </div>
          )}

          {/* TAB 2: INVENTORY — grouped by category, both groups and items within alphabetical */}
          {activeTab === 'inventory' && (
            <div className="stack" style={{ gap: 28 }}>
              {groupedInventory.length === 0 ? (
                <div className="empty">
                  <Package className="w-12 h-12 mx-auto mb-3" style={{ opacity: 0.3 }} />
                  <h3 className="h-sm">No Inventory Items Yet</h3>
                  <p className="mini dim" style={{ marginTop: 4 }}>Click &ldquo;Add Inventory&rdquo; to register your first item.</p>
                </div>
              ) : (
                groupedInventory.map(([categoryName, items]) => {
                  const isCollapsed = collapsedCategories.has(categoryName);
                  return (
                    <div key={categoryName}>
                      <button
                        onClick={() => toggleCategory(categoryName)}
                        className="label"
                        style={{
                          marginBottom: 14,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-start',
                          gap: 8,
                          width: '100%',
                          textAlign: 'left',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        {categoryName}
                        <span className="badge b-mute">{items.length}</span>
                      </button>
                      {!isCollapsed && (
                        <div className="grid g4">
                          {items.map((item, i) => (
                            <div key={item.id} className={`card plain f-in d${(i % 4) + 1} stack`} style={{ padding: 24 }}>
                              <div className="between">
                                <span className="badge b-ok">In Stock</span>
                                <div className="row" style={{ gap: 5 }}>
                                  <button onClick={() => openEditItem(item)} className="icon-btn" style={{ width: 30, height: 30 }} title="Edit item">
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    disabled={deletingItemId === item.id}
                                    onClick={() => handleDeleteItemPrompt(item.id, item.name)}
                                    className="icon-btn"
                                    style={{ width: 30, height: 30, color: 'var(--bad)' }}
                                    title="Deactivate item"
                                  >
                                    {deletingItemId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                  </button>
                                </div>
                              </div>
                              <Link href={`/resources/inventory/${item.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                <h3 className="h-md" style={{ cursor: 'pointer' }}>{item.name}</h3>
                              </Link>
                              <div className="between mini" style={{ padding: 14, borderRadius: 'var(--radius-sm)', border: '1px solid var(--rule)', background: 'var(--surface-2)' }}>
                                <span className="dim">Available Quantity</span>
                                <strong className="num" style={{ fontSize: 18, color: 'var(--ink)' }}>{item.totalQuantity} pcs</strong>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 3: STAFF */}
          {activeTab === 'staff' && (
            <div className="grid g3">
              {staff.map((st, i) => (
                <div key={st.id} className={`card plain f-in d${(i % 4) + 1} stack`}>
                  <div>
                    <h3 className="h-sm">{st.name}</h3>
                    <p className="mini" style={{ color: 'var(--accent)', marginTop: 2, fontWeight: 600 }}>{st.role}</p>
                  </div>
                  <div className="mini dim stack" style={{ gap: 4, paddingTop: 10, borderTop: '1px solid var(--rule)' }}>
                    <p>Email: <strong style={{ color: 'var(--ink)' }}>{st.email || 'N/A'}</strong></p>
                    <p>Phone: <strong style={{ color: 'var(--ink)' }}>{st.phone || 'N/A'}</strong></p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: SUPPLIERS */}
          {activeTab === 'suppliers' && (
            <div className="grid g3">
              {suppliers.map((sup, i) => (
                <div key={sup.id} className={`card plain f-in d${(i % 4) + 1} stack`}>
                  <div className="between">
                    <span className="badge b-info">{sup.category}</span>
                    <span className="badge b-mute">Partner</span>
                  </div>
                  <h3 className="h-sm">{sup.name}</h3>
                  <div className="mini dim stack" style={{ gap: 4, paddingTop: 10, borderTop: '1px solid var(--rule)' }}>
                    <p>Email: <strong style={{ color: 'var(--ink)' }}>{sup.email || 'N/A'}</strong></p>
                    <p>Phone: <strong style={{ color: 'var(--ink)' }}>{sup.phone || 'N/A'}</strong></p>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>

      {/* CREATE RESOURCE MODAL */}
      {isModalOpen && (
        <div className="modal-scrim">
          <div className="modal">
            <div className="card-h" style={{ borderBottom: '1px solid var(--rule)', paddingBottom: 16 }}>
              <h3 className="h-md" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Plus className="w-5 h-5" style={{ color: 'var(--accent)' }} /> Add {activeTab.toUpperCase()}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="icon-btn">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateResource} className="stack" style={{ marginTop: 20 }}>
              {activeTab === 'space' ? (
                <>
                  <div className="field">
                    <label className="label">Venue Name</label>
                    <input required value={name} onChange={e => setName(e.target.value)} placeholder="Royal Events Main Venue" className="input" />
                  </div>
                  <div className="field">
                    <label className="label">Max Guest Capacity</label>
                    <input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} className="input" />
                  </div>
                  <div className="field">
                    <label className="label">Address</label>
                    <input value={address} onChange={e => setAddress(e.target.value)} placeholder="100 Grand Boulevard..." className="input" />
                  </div>
                </>
              ) : activeTab === 'inventory' ? (
                <>
                  <div className="field">
                    <label className="label">Item Name</label>
                    <input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Banquet Chairs" className="input" />
                  </div>
                  <div className="field">
                    <label className="label">Category</label>
                    {inventoryCategories.length > 0 ? (
                      <select required value={category} onChange={e => setCategory(e.target.value)} className="input">
                        {inventoryCategories.map((c) => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="mini dim">
                        No inventory categories defined yet — add one in <strong>Settings</strong> first.
                      </p>
                    )}
                  </div>
                  <div className="field">
                    <label className="label">Quantity</label>
                    <input type="number" required value={quantity} onChange={e => setQuantity(e.target.value)} className="input" />
                  </div>
                </>
              ) : activeTab === 'staff' ? (
                <>
                  <div className="field">
                    <label className="label">Staff Name</label>
                    <input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Marco Rossi" className="input" />
                  </div>
                  <div className="field">
                    <label className="label">Role / Position</label>
                    <input required value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Executive Chef, Decoration Lead" className="input" />
                  </div>
                </>
              ) : (
                <>
                  <div className="field">
                    <label className="label">Supplier Company Name</label>
                    <input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Deluxe Cinema Studios" className="input" />
                  </div>
                  <div className="field">
                    <label className="label">Category</label>
                    <input required value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Media, DJ, Security" className="input" />
                  </div>
                </>
              )}

              <div className="row" style={{ justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn ghost">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn primary">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT INVENTORY ITEM MODAL */}
      {editingItem && (
        <div className="modal-scrim">
          <div className="modal">
            <div className="card-h" style={{ borderBottom: '1px solid var(--rule)', paddingBottom: 16 }}>
              <h3 className="h-md" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Edit3 className="w-5 h-5" style={{ color: 'var(--accent)' }} /> Edit Inventory Item
              </h3>
              <button onClick={() => setEditingItem(null)} className="icon-btn">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateItem} className="stack" style={{ marginTop: 20 }}>
              <div className="field">
                <label className="label">Item Name</label>
                <input required value={editName} onChange={e => setEditName(e.target.value)} className="input" />
              </div>
              <div className="field">
                <label className="label">Category</label>
                <select required value={editCategoryId} onChange={e => setEditCategoryId(e.target.value)} className="input">
                  {inventoryCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="label">Quantity</label>
                <input type="number" required value={editQuantity} onChange={e => setEditQuantity(e.target.value)} className="input" />
              </div>

              <div className="row" style={{ justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" onClick={() => setEditingItem(null)} className="btn ghost">
                  Cancel
                </button>
                <button type="submit" disabled={editSubmitting} className="btn primary">
                  {editSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save Changes</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
