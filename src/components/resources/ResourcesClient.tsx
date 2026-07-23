'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Boxes, Building2, Package, Users, Truck, Plus, Loader2, X } from 'lucide-react';

interface ResourcesClientProps {
  initialData: {
    space: any;
    inventory: any[];
    staff: any[];
    suppliers: any[];
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
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* HEADER */}
        <header className="h-16 border-b border-zinc-900 bg-zinc-950/50 flex items-center px-8 justify-between shrink-0">
          <div>
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <Boxes className="w-5 h-5 text-violet-400" /> Resource Operations Portal
            </h2>
            <p className="text-xs text-zinc-500">Manage main Space, Inventory, Staff team, and Supplier partners.</p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-lg"
          >
            <Plus className="w-4 h-4" /> Add {activeTab.slice(0, 1).toUpperCase() + activeTab.slice(1)}
          </button>
        </header>

        {/* RESOURCE TAB NAV */}
        <div className="bg-zinc-950 border-b border-zinc-900 px-8 flex gap-6 shrink-0">
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
                className={`py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
                  isActive
                    ? 'border-violet-500 text-white'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-violet-400' : 'text-zinc-500'}`} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* WORKSPACE */}
        <div className="flex-1 overflow-auto p-8">
          
          {/* TAB 1: SPACE */}
          {activeTab === 'space' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-xl max-w-2xl space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-white font-bold text-xl">{space?.name || 'Royal Events Main Space'}</h3>
                  <p className="text-xs text-zinc-500 mt-1">{space?.address || '100 Grand Boulevard, Maputo'}</p>
                </div>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-bold">
                  Single Space Configured
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-zinc-950 p-4 rounded-xl border border-zinc-850">
                <div>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase block">Max Capacity</span>
                  <span className="text-2xl font-black text-white">{space?.capacity || 500} Guests</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase block">Venue Type</span>
                  <span className="text-base font-bold text-violet-400">Indoor Hall & Terrace</span>
                </div>
              </div>

              <p className="text-xs text-zinc-400">{space?.description}</p>
            </div>
          )}

          {/* TAB 2: INVENTORY */}
          {activeTab === 'inventory' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {inventory.map((item: any) => (
                <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] bg-zinc-800 text-zinc-400 font-bold px-2 py-0.5 rounded-md">
                      {item.category}
                    </span>
                    <span className="text-xs text-emerald-400 font-bold">In Stock</span>
                  </div>
                  <h3 className="text-white font-bold text-lg">{item.name}</h3>
                  <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850 flex justify-between items-center text-xs">
                    <span className="text-zinc-500">Available Quantity</span>
                    <strong className="text-white text-base font-black">{item.quantity} pcs</strong>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: STAFF */}
          {activeTab === 'staff' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {staff.map((st: any) => (
                <div key={st.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
                  <div>
                    <h3 className="text-white font-bold text-lg">{st.name}</h3>
                    <p className="text-xs text-violet-400 font-bold mt-0.5">{st.role}</p>
                  </div>
                  <div className="text-xs text-zinc-500 space-y-1 pt-2 border-t border-zinc-850">
                    <p>Email: <strong className="text-zinc-300">{st.email || 'N/A'}</strong></p>
                    <p>Phone: <strong className="text-zinc-300">{st.phone || 'N/A'}</strong></p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: SUPPLIERS */}
          {activeTab === 'suppliers' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {suppliers.map((sup: any) => (
                <div key={sup.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-md font-bold">
                      {sup.category}
                    </span>
                    <span className="text-xs text-zinc-500 font-bold">Partner</span>
                  </div>
                  <h3 className="text-white font-bold text-lg">{sup.name}</h3>
                  <div className="text-xs text-zinc-500 space-y-1 pt-2 border-t border-zinc-850">
                    <p>Email: <strong className="text-zinc-300">{sup.email || 'N/A'}</strong></p>
                    <p>Phone: <strong className="text-zinc-300">{sup.phone || 'N/A'}</strong></p>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>

      {/* CREATE RESOURCE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-violet-400" /> Add {activeTab.toUpperCase()}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateResource} className="space-y-4">
              {activeTab === 'space' ? (
                <>
                  <div>
                    <label className="text-xs text-zinc-400 font-bold block mb-1">Space Name</label>
                    <input
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Royal Events Main Space"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 font-bold block mb-1">Max Guest Capacity</label>
                    <input
                      type="number"
                      value={capacity}
                      onChange={e => setCapacity(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 font-bold block mb-1">Address</label>
                    <input
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      placeholder="100 Grand Boulevard..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-violet-500"
                    />
                  </div>
                </>
              ) : activeTab === 'inventory' ? (
                <>
                  <div>
                    <label className="text-xs text-zinc-400 font-bold block mb-1">Item Name</label>
                    <input
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Banquet Chairs"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 font-bold block mb-1">Category</label>
                    <input
                      required
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      placeholder="e.g. Furniture, Kitchen, Audio Visual"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 font-bold block mb-1">Quantity</label>
                    <input
                      type="number"
                      required
                      value={quantity}
                      onChange={e => setQuantity(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-violet-500"
                    />
                  </div>
                </>
              ) : activeTab === 'staff' ? (
                <>
                  <div>
                    <label className="text-xs text-zinc-400 font-bold block mb-1">Staff Name</label>
                    <input
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Marco Rossi"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 font-bold block mb-1">Role / Position</label>
                    <input
                      required
                      value={role}
                      onChange={e => setRole(e.target.value)}
                      placeholder="e.g. Executive Chef, Decoration Lead"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-violet-500"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-xs text-zinc-400 font-bold block mb-1">Supplier Company Name</label>
                    <input
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Deluxe Cinema Studios"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 font-bold block mb-1">Category</label>
                    <input
                      required
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      placeholder="e.g. Media, DJ, Security"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-violet-500"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold flex items-center gap-2"
                >
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
