'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Building2, Package, Users, Truck, Plus, Loader2, X, Edit3, Trash2, Save, ChevronDown, ChevronRight } from 'lucide-react';
import { Prisma } from '@prisma/client';
import Topbar from '@/components/aurelia/Topbar';
import { readAttributeDefs, getSeatingCapacity } from '@/lib/inventory-attributes';
import type { InventoryTypeDTO, InventoryAttributeDefinitionDTO } from '@/types/dtos';

type ResourceVenue = Prisma.VenueGetPayload<{ select: { id: true; name: true; capacity: true; address: true; description: true } }>;
type ResourceStaff = Prisma.StaffGetPayload<{ select: { id: true; name: true; role: true; email: true; phone: true } }>;
type ResourceSupplier = Prisma.SupplierGetPayload<{ select: { id: true; name: true; category: true; email: true; phone: true } }>;

/** Hand-written to mirror `ResourceRepository.getResourcesData()`'s inventory select. The item now
 * carries its `InventoryType` (and, through it, the owning category) plus a free-form `attributes`
 * bag whose shape is governed by the type's `attributeDefs`. Seats-per-unit is derived from
 * `attributes` via `getSeatingCapacity` — there is no longer a `seatingCapacity` column. */
interface ResourceInventoryItem {
  id: string;
  name: string;
  sku: string | null;
  totalQuantity: number;
  unit: string | null;
  attributes: Prisma.JsonValue;
  inventoryTypeId: string;
  inventoryType: {
    id: string;
    name: string;
    code: string;
    attributeDefs: Prisma.JsonValue;
    category: { id: string; name: string };
  };
}

interface InventoryCategoryOption {
  id: string;
  name: string;
}

interface ResourcesClientProps {
  initialData: {
    venue: ResourceVenue | null;
    inventory: ResourceInventoryItem[];
    staff: ResourceStaff[];
    suppliers: ResourceSupplier[];
    inventoryCategories: InventoryCategoryOption[];
    inventoryTypes: InventoryTypeDTO[];
  };
}

const isUnclassified = (code: string) => code === 'UNCLASSIFIED' || code.startsWith('UNCLASSIFIED_');

/** Strip the raw per-field state down to a JSON `attributes` payload the API will accept:
 * booleans always sent, multiselect only when non-empty, everything else dropped when blank. */
function cleanAttributes(defs: InventoryAttributeDefinitionDTO[], values: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const d of defs) {
    const v = values[d.key];
    if (d.type === 'boolean') {
      out[d.key] = v === true;
      continue;
    }
    if (d.type === 'multiselect') {
      if (Array.isArray(v) && v.length > 0) out[d.key] = v;
      continue;
    }
    if (v === undefined || v === null || v === '') continue;
    out[d.key] = v;
  }
  return out;
}

function AttributeFields({
  defs,
  values,
  setValue,
}: {
  defs: InventoryAttributeDefinitionDTO[];
  values: Record<string, unknown>;
  setValue: (key: string, v: unknown) => void;
}) {
  if (defs.length === 0) {
    return <p className="mini dim">This type has no characteristics defined — add some in Settings → Inventory Types.</p>;
  }
  return (
    <>
      {defs.map((d) => {
        const v = values[d.key];
        return (
          <div className="field" key={d.key}>
            <label className="label">{d.label}{d.required ? ' *' : ''}</label>

            {d.type === 'text' && (
              <input className="input" value={typeof v === 'string' ? v : ''} onChange={(e) => setValue(d.key, e.target.value)} />
            )}

            {d.type === 'textarea' && (
              <textarea className="input" rows={2} value={typeof v === 'string' ? v : ''} onChange={(e) => setValue(d.key, e.target.value)} />
            )}

            {d.type === 'number' && (
              <input
                className="input"
                type="number"
                min={d.min}
                max={d.max}
                value={v === undefined || v === null || v === '' ? '' : String(v)}
                onChange={(e) => setValue(d.key, e.target.value === '' ? undefined : Number(e.target.value))}
              />
            )}

            {d.type === 'select' && (
              <select className="input" value={typeof v === 'string' ? v : ''} onChange={(e) => setValue(d.key, e.target.value || undefined)}>
                <option value="">—</option>
                {(d.options ?? []).map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            )}

            {d.type === 'multiselect' && (
              <div className="row" style={{ flexWrap: 'wrap', gap: 10 }}>
                {(d.options ?? []).map((o) => {
                  const arr = Array.isArray(v) ? (v as string[]) : [];
                  return (
                    <label key={o} className="mini row" style={{ gap: 6 }}>
                      <input
                        type="checkbox"
                        checked={arr.includes(o)}
                        onChange={(e) => setValue(d.key, e.target.checked ? [...arr, o] : arr.filter((x) => x !== o))}
                      />
                      {o}
                    </label>
                  );
                })}
              </div>
            )}

            {d.type === 'boolean' && (
              <label className="mini row" style={{ gap: 6 }}>
                <input type="checkbox" checked={v === true} onChange={(e) => setValue(d.key, e.target.checked)} />
                Yes
              </label>
            )}

            {d.type === 'date' && (
              <input className="input" type="date" value={typeof v === 'string' ? v : ''} onChange={(e) => setValue(d.key, e.target.value || undefined)} />
            )}
          </div>
        );
      })}
    </>
  );
}

export default function ResourcesClient({ initialData }: ResourcesClientProps) {
  const router = useRouter();
  const { venue, inventory, staff, suppliers, inventoryCategories, inventoryTypes } = initialData;

  const [activeTab, setActiveTab] = useState('venue');

  // Generic create-modal (venue / staff / suppliers). Inventory items have their own modal below.
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [role, setRole] = useState('Chef');
  const [capacity, setCapacity] = useState('500');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  // Inventory list filters (client-side over the already-loaded set).
  const [filterCategoryId, setFilterCategoryId] = useState('');
  const [filterTypeId, setFilterTypeId] = useState('');
  const [unclassifiedOnly, setUnclassifiedOnly] = useState(false);

  // Inventory item create/edit modal — one form, two modes.
  const [itemModal, setItemModal] = useState<{ mode: 'create' } | { mode: 'edit'; item: ResourceInventoryItem } | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemSku, setItemSku] = useState('');
  const [itemQuantity, setItemQuantity] = useState('0');
  const [itemUnit, setItemUnit] = useState('');
  const [itemCategoryId, setItemCategoryId] = useState('');
  const [itemTypeId, setItemTypeId] = useState('');
  const [itemAttrs, setItemAttrs] = useState<Record<string, unknown>>({});
  const [itemSubmitting, setItemSubmitting] = useState(false);

  const typesForCategory = (categoryId: string) => inventoryTypes.filter((t) => t.categoryId === categoryId);
  const selectedType = inventoryTypes.find((t) => t.id === itemTypeId) || null;
  const activeDefs: InventoryAttributeDefinitionDTO[] =
    selectedType?.attributeDefs ??
    (itemModal?.mode === 'edit' ? (readAttributeDefs(itemModal.item.inventoryType.attributeDefs) as InventoryAttributeDefinitionDTO[]) : []);

  const setAttrValue = (key: string, v: unknown) =>
    setItemAttrs((prev) => {
      const next = { ...prev };
      if (v === undefined) delete next[key];
      else next[key] = v;
      return next;
    });

  const toggleCategory = (categoryName: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryName)) next.delete(categoryName);
      else next.add(categoryName);
      return next;
    });
  };

  const openCreateItem = () => {
    const c0 = inventoryCategories[0]?.id || '';
    const t0 = typesForCategory(c0)[0]?.id || '';
    setItemModal({ mode: 'create' });
    setItemName('');
    setItemSku('');
    setItemQuantity('0');
    setItemUnit('');
    setItemCategoryId(c0);
    setItemTypeId(t0);
    setItemAttrs({});
  };

  const openEditItem = (item: ResourceInventoryItem) => {
    setItemModal({ mode: 'edit', item });
    setItemName(item.name);
    setItemSku(item.sku || '');
    setItemQuantity(String(item.totalQuantity));
    setItemUnit(item.unit || '');
    setItemCategoryId(item.inventoryType.category.id);
    setItemTypeId(item.inventoryTypeId);
    setItemAttrs(item.attributes && typeof item.attributes === 'object' && !Array.isArray(item.attributes)
      ? { ...(item.attributes as Record<string, unknown>) }
      : {});
  };

  const closeItemModal = () => setItemModal(null);

  const onItemCategoryChange = (categoryId: string) => {
    setItemCategoryId(categoryId);
    const t0 = typesForCategory(categoryId)[0]?.id || '';
    setItemTypeId(t0);
    setItemAttrs({});
  };

  const onItemTypeChange = (typeId: string) => {
    setItemTypeId(typeId);
    setItemAttrs({});
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemModal) return;
    if (!itemName.trim()) return toast.error('Item name is required.');
    if (!itemTypeId) return toast.error('Pick a type.');

    setItemSubmitting(true);
    try {
      const payload = {
        name: itemName.trim(),
        sku: itemSku.trim() || null,
        inventoryTypeId: itemTypeId,
        quantity: itemQuantity,
        unit: itemUnit.trim() || undefined,
        attributes: cleanAttributes(activeDefs, itemAttrs),
      };
      const url = itemModal.mode === 'edit' ? `/api/inventory-items/${itemModal.item.id}` : '/api/inventory-items';
      const method = itemModal.mode === 'edit' ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success(itemModal.mode === 'edit' ? 'Inventory item updated!' : `Inventory item "${itemName.trim()}" added!`);
        closeItemModal();
        router.refresh();
      } else {
        toast.error((await res.json()).error || 'Failed to save item.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Connection error.');
    } finally {
      setItemSubmitting(false);
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
        body: JSON.stringify({ resourceType, name, category, role, capacity, address }),
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

  const onAddClick = () => {
    if (activeTab === 'inventory') openCreateItem();
    else setIsModalOpen(true);
  };

  // Apply the filter bar, then group by the type's owning category — both group order and the
  // items within each group stay alphabetical (`inventory` arrives name-sorted from the repo).
  const groupedInventory = useMemo(() => {
    const filtered = inventory.filter((item) => {
      if (filterCategoryId && item.inventoryType.category.id !== filterCategoryId) return false;
      if (filterTypeId && item.inventoryTypeId !== filterTypeId) return false;
      if (unclassifiedOnly && !isUnclassified(item.inventoryType.code)) return false;
      return true;
    });
    const groups = new Map<string, ResourceInventoryItem[]>();
    for (const item of filtered) {
      const key = item.inventoryType.category.name;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [inventory, filterCategoryId, filterTypeId, unclassifiedOnly]);

  const unclassifiedCount = useMemo(
    () => inventory.filter((i) => isUnclassified(i.inventoryType.code)).length,
    [inventory],
  );

  return (
    <>
      <main className="aurelia-shell flex-1 flex flex-col h-screen overflow-hidden">
        <Topbar crumb="Resource Operations Portal" note="Manage main Venue, Inventory, Staff team, and Supplier partners.">
          <button onClick={onAddClick} className="btn primary sm">
            <Plus className="w-3.5 h-3.5" /> Add {activeTab.slice(0, 1).toUpperCase() + activeTab.slice(1)}
          </button>
        </Topbar>

        {/* RESOURCE TAB NAV */}
        <div className="tabs" style={{ padding: '0 34px' }}>
          {[
            { id: 'venue', label: 'Main Venue', icon: Building2 },
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

          {/* TAB 1: VENUE */}
          {activeTab === 'venue' && (
            <div className="card plain stack" style={{ maxWidth: 640 }}>
              <div className="between" style={{ alignItems: 'flex-start' }}>
                <div>
                  <h3 className="h-md">{venue?.name || 'Royal Events Main Venue'}</h3>
                  <p className="mini dim" style={{ marginTop: 4 }}>{venue?.address || '100 Grand Boulevard, Maputo'}</p>
                </div>
                <span className="badge b-ok">Single Venue Configured</span>
              </div>

              <div className="grid g2" style={{ padding: 16, borderRadius: 'var(--radius-sm)', border: '1px solid var(--rule)', background: 'var(--surface-2)' }}>
                <div>
                  <span className="label">Max Capacity</span>
                  <div className="val" style={{ fontSize: 24 }}>{venue?.capacity || 500} Guests</div>
                </div>
                <div>
                  <span className="label">Venue Type</span>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)', marginTop: 8 }}>Indoor Hall & Terrace</div>
                </div>
              </div>

              <p className="mini dim">{venue?.description}</p>
            </div>
          )}

          {/* TAB 2: INVENTORY — grouped by the type's category, groups + items alphabetical */}
          {activeTab === 'inventory' && (
            <div className="stack" style={{ gap: 20 }}>
              {/* FILTER BAR */}
              {inventory.length > 0 && (
                <div className="row" style={{ gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <div className="field" style={{ minWidth: 180 }}>
                    <label className="label">Category</label>
                    <select
                      value={filterCategoryId}
                      onChange={(e) => { setFilterCategoryId(e.target.value); setFilterTypeId(''); }}
                      className="input"
                    >
                      <option value="">All categories</option>
                      {inventoryCategories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="field" style={{ minWidth: 180 }}>
                    <label className="label">Type</label>
                    <select value={filterTypeId} onChange={(e) => setFilterTypeId(e.target.value)} className="input">
                      <option value="">All types</option>
                      {inventoryTypes
                        .filter((t) => !filterCategoryId || t.categoryId === filterCategoryId)
                        .map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                  </div>
                  {unclassifiedCount > 0 && (
                    <label className="mini row" style={{ gap: 6, paddingBottom: 10 }}>
                      <input type="checkbox" checked={unclassifiedOnly} onChange={(e) => setUnclassifiedOnly(e.target.checked)} />
                      Needs classifying ({unclassifiedCount})
                    </label>
                  )}
                </div>
              )}

              {groupedInventory.length === 0 ? (
                <div className="empty">
                  <Package className="w-12 h-12 mx-auto mb-3" style={{ opacity: 0.3 }} />
                  <h3 className="h-sm">{inventory.length === 0 ? 'No Inventory Items Yet' : 'No Items Match These Filters'}</h3>
                  <p className="mini dim" style={{ marginTop: 4 }}>
                    {inventory.length === 0
                      ? 'Click “Add Inventory” to register your first item.'
                      : 'Adjust the category / type filters above.'}
                  </p>
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
                          {items.map((item, i) => {
                            const seats = getSeatingCapacity(item.attributes, readAttributeDefs(item.inventoryType.attributeDefs));
                            return (
                            <div key={item.id} className={`card plain f-in d${(i % 4) + 1} stack`} style={{ padding: 24 }}>
                              <div className="between">
                                {isUnclassified(item.inventoryType.code)
                                  ? <span className="badge b-warn">Needs classifying</span>
                                  : <span className="badge b-info">{item.inventoryType.name}</span>}
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
                                <strong className="num" style={{ fontSize: 18, color: 'var(--ink)' }}>{item.totalQuantity} {item.unit || 'pcs'}</strong>
                              </div>
                              {seats > 0 && (
                                <p className="mini dim">Seats {seats} {seats === 1 ? 'guest' : 'guests'} per unit</p>
                              )}
                            </div>
                            );
                          })}
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

      {/* CREATE RESOURCE MODAL (venue / staff / suppliers) */}
      {isModalOpen && activeTab !== 'inventory' && (
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
              {activeTab === 'venue' ? (
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

      {/* INVENTORY ITEM CREATE / EDIT MODAL — Category → Type cascade → dynamic characteristics */}
      {itemModal && (
        <div className="modal-scrim">
          <div className="modal" style={{ maxWidth: 560 }}>
            <div className="card-h" style={{ borderBottom: '1px solid var(--rule)', paddingBottom: 16 }}>
              <h3 className="h-md" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {itemModal.mode === 'edit'
                  ? <><Edit3 className="w-5 h-5" style={{ color: 'var(--accent)' }} /> Edit Inventory Item</>
                  : <><Plus className="w-5 h-5" style={{ color: 'var(--accent)' }} /> Add Inventory Item</>}
              </h3>
              <button onClick={closeItemModal} className="icon-btn">
                <X className="w-4 h-4" />
              </button>
            </div>

            {inventoryTypes.length === 0 ? (
              <p className="mini dim" style={{ marginTop: 20 }}>
                No inventory types defined yet — add a category and a type in <strong>Settings</strong> first.
              </p>
            ) : (
              <form onSubmit={handleSaveItem} className="stack" style={{ marginTop: 20, maxHeight: '70vh', overflowY: 'auto' }}>
                <div className="field">
                  <label className="label">Item Name</label>
                  <input required autoFocus value={itemName} onChange={e => setItemName(e.target.value)} placeholder="e.g. Gold Chiavari Chair" className="input" />
                </div>

                <div className="grid g2">
                  <div className="field">
                    <label className="label">Category</label>
                    <select value={itemCategoryId} onChange={e => onItemCategoryChange(e.target.value)} className="input" required>
                      {inventoryCategories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label className="label">Type</label>
                    {typesForCategory(itemCategoryId).length > 0 ? (
                      <select value={itemTypeId} onChange={e => onItemTypeChange(e.target.value)} className="input" required>
                        {typesForCategory(itemCategoryId).map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="mini dim">No types in this category — add one in Settings.</p>
                    )}
                  </div>
                </div>

                <div className="grid g2">
                  <div className="field">
                    <label className="label">Quantity</label>
                    <input type="number" required value={itemQuantity} onChange={e => setItemQuantity(e.target.value)} className="input" />
                  </div>
                  <div className="field">
                    <label className="label">Unit <span className="mini dim">(optional)</span></label>
                    <input value={itemUnit} onChange={e => setItemUnit(e.target.value)} placeholder="pcs" className="input" />
                  </div>
                </div>

                <div className="field">
                  <label className="label">SKU <span className="mini dim">(optional)</span></label>
                  <input value={itemSku} onChange={e => setItemSku(e.target.value)} placeholder="CHR-GLD-001" className="input" />
                </div>

                {itemTypeId && (
                  <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 14 }} className="stack">
                    <p className="label">{selectedType?.name || 'Type'} characteristics</p>
                    <AttributeFields defs={activeDefs} values={itemAttrs} setValue={setAttrValue} />
                  </div>
                )}

                <div className="row" style={{ justifyContent: 'flex-end', gap: 12 }}>
                  <button type="button" onClick={closeItemModal} className="btn ghost">Cancel</button>
                  <button type="submit" disabled={itemSubmitting || !itemTypeId} className="btn primary">
                    {itemSubmitting
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <><Save className="w-4 h-4" /> {itemModal.mode === 'edit' ? 'Save Changes' : 'Save Item'}</>}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
