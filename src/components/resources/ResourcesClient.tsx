'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Package, Users, Truck, Plus, Loader2, X } from 'lucide-react';
import { Prisma } from '@prisma/client';
import Topbar from '@/components/aurelia/Topbar';

type ResourceSpace = Prisma.SpaceGetPayload<{ select: { id: true; name: true; capacity: true; address: true; description: true } }>;
type ResourceInventoryItem = Prisma.InventoryItemGetPayload<{ select: { id: true; name: true; quantity: true; category: true } }>;
type ResourceStaff = Prisma.StaffGetPayload<{ select: { id: true; name: true; role: true; email: true; phone: true } }>;
type ResourceSupplier = Prisma.SupplierGetPayload<{ select: { id: true; name: true; category: true; email: true; phone: true } }>;

interface ResourcesClientProps {
  initialData: {
    space: ResourceSpace | null;
    inventory: ResourceInventoryItem[];
    staff: ResourceStaff[];
    suppliers: ResourceSupplier[];
  };
}

export default function ResourcesClient({ initialData }: ResourcesClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('space');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Furniture');
  const [quantity, setQuantity] = useState('50');
  const [role, setRole] = useState('Chef');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [capacity, setCapacity] = useState('500');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
          email,
          phone,
          capacity,
          address,
          description,
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

  const { space, inventory, staff, suppliers } = initialData;

  return (
    <>
      <main className="aurelia-shell flex-1 flex flex-col h-screen overflow-hidden">
        <Topbar crumb="Resource Operations Portal" note="Manage main Space, Inventory, Staff team, and Supplier partners.">
          <button onClick={() => setIsModalOpen(true)} className="btn primary sm">
            <Plus className="w-3.5 h-3.5" /> Add {activeTab.slice(0, 1).toUpperCase() + activeTab.slice(1)}
          </button>
        </Topbar>

        {/* RESOURCE TAB NAV */}
        <div className="tabs" style={{ padding: '0 34px' }}>
          {[
            { id: 'space', label: 'Main Space', icon: Building2 },
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
        <div className="flex-1 overflow-auto page">

          {/* TAB 1: SPACE */}
          {activeTab === 'space' && (
            <div className="card plain stack" style={{ maxWidth: 640 }}>
              <div className="between" style={{ alignItems: 'flex-start' }}>
                <div>
                  <h3 className="h-md">{space?.name || 'Royal Events Main Space'}</h3>
                  <p className="mini dim" style={{ marginTop: 4 }}>{space?.address || '100 Grand Boulevard, Maputo'}</p>
                </div>
                <span className="badge b-ok">Single Space Configured</span>
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

          {/* TAB 2: INVENTORY */}
          {activeTab === 'inventory' && (
            <div className="grid g3">
              {inventory.map((item, i) => (
                <div key={item.id} className={`card plain f-in d${(i % 4) + 1} stack`}>
                  <div className="between">
                    <span className="badge b-mute">{item.category}</span>
                    <span className="badge b-ok">In Stock</span>
                  </div>
                  <h3 className="h-sm">{item.name}</h3>
                  <div className="between mini" style={{ padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid var(--rule)', background: 'var(--surface-2)' }}>
                    <span className="dim">Available Quantity</span>
                    <strong className="num" style={{ fontSize: 15, color: 'var(--ink)' }}>{item.quantity} pcs</strong>
                  </div>
                </div>
              ))}
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
                    <label className="label">Space Name</label>
                    <input required value={name} onChange={e => setName(e.target.value)} placeholder="Royal Events Main Space" className="input" />
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
                    <input required value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Furniture, Kitchen, Audio Visual" className="input" />
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
    </>
  );
}
