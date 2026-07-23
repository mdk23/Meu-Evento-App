'use client';

import React, { useEffect, useState, use } from 'react';
import { Sidebar } from '@/components/Sidebar';
import Link from 'next/link';
import { 
  Loader2, 
  ArrowLeft, 
  Sparkles, 
  CheckCircle2, 
  Users, 
  FileText, 
  TrendingUp, 
  CheckSquare, 
  Plus, 
  X,
  Briefcase,
  Layers,
  ChefHat
} from 'lucide-react';

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('services');

  // Selected Service Work Order Modal State
  const [selectedService, setSelectedService] = useState<any>(null);
  const [workOrderStatus, setWorkOrderStatus] = useState('');
  const [customFields, setCustomFields] = useState<any>({});
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [supplierCost, setSupplierCost] = useState('0');
  const [supplierStatus, setSupplierStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('UNPAID');
  const [savingWorkOrder, setSavingWorkOrder] = useState(false);

  // Add Service Modal State
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [catalogServiceId, setCatalogServiceId] = useState('');
  const [customSellingPrice, setCustomSellingPrice] = useState('');
  const [customCost, setCustomCost] = useState('');
  const [addingService, setAddingService] = useState(false);

  // Guest State
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [addingGuest, setAddingGuest] = useState(false);

  const reloadEvent = async () => {
    try {
      const res = await fetch(`/api/events/${id}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch(`/api/events/${id}`);
        const json = await res.json();
        if (active) {
          setData(json);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [id]);

  if (loading || !data || !data.event) {
    return (
      <div className="min-h-screen bg-zinc-950 flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center text-violet-400">
          <Loader2 className="w-10 h-10 animate-spin" />
        </div>
      </div>
    );
  }

  const { event, space, suppliers, staff, catalogServices } = data;

  const openServiceWorkOrder = (es: any) => {
    setSelectedService(es);
    setWorkOrderStatus(es.status || 'PLANNING');
    try {
      setCustomFields(es.customFields ? JSON.parse(es.customFields) : {});
    } catch {
      setCustomFields({});
    }
    try {
      setTasks(es.tasks ? JSON.parse(es.tasks) : []);
    } catch {
      setTasks([]);
    }
    setSupplierId(es.supplierId || '');
    setSupplierCost(String(es.supplierCost || es.cost || 0));
    setSupplierStatus(es.supplierStatus || 'REQUESTED');
    setPaymentStatus(es.paymentStatus || 'UNPAID');
  };

  const handleSaveWorkOrder = async () => {
    if (!selectedService) return;
    setSavingWorkOrder(true);
    try {
      await fetch(`/api/events/${id}/services`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventServiceId: selectedService.id,
          status: workOrderStatus,
          customFields,
          tasks,
          supplierId: supplierId || null,
          supplierCost,
          cost: supplierCost,
          supplierStatus,
          paymentStatus,
        }),
      });
      setSelectedService(null);
      await reloadEvent();
    } catch (err) {
      console.error('Failed to save work order:', err);
    } finally {
      setSavingWorkOrder(false);
    }
  };

  const handleAddServiceToEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catalogServiceId) return;
    setAddingService(true);
    try {
      await fetch(`/api/events/${id}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: catalogServiceId,
          sellingPrice: customSellingPrice,
          cost: customCost,
        }),
      });
      setIsAddServiceOpen(false);
      setCatalogServiceId('');
      setCustomSellingPrice('');
      setCustomCost('');
      await reloadEvent();
    } catch (err) {
      console.error(err);
    } finally {
      setAddingService(false);
    }
  };

  const toggleTaskCompleted = (taskId: string) => {
    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    const newTask = {
      id: String(Date.now()),
      title: newTaskTitle.trim(),
      completed: false,
    };
    setTasks(prev => [...prev, newTask]);
    setNewTaskTitle('');
  };

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;
    setAddingGuest(true);
    try {
      await fetch(`/api/events/${id}/guests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: guestName, email: guestEmail }),
      });
      setGuestName('');
      setGuestEmail('');
      await reloadEvent();
    } catch (err) {
      console.error(err);
    } finally {
      setAddingGuest(false);
    }
  };

  // Collect all tasks across services for the unified Tasks tab
  const allEventTasks: any[] = [];
  event.eventServices.forEach((es: any) => {
    try {
      const parsed = es.tasks ? JSON.parse(es.tasks) : [];
      parsed.forEach((t: any) => {
        allEventTasks.push({
          ...t,
          serviceName: es.service?.name,
          providerType: es.providerType,
        });
      });
    } catch {}
  });

  return (
    <>
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* HEADER */}
        <header className="h-16 border-b border-zinc-900 bg-zinc-950/50 flex items-center px-8 justify-between">
          <div className="flex items-center gap-4">
            <Link href="/events" className="p-2 bg-zinc-900 rounded-xl text-zinc-400 hover:text-white border border-zinc-800">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h2 className="text-white font-bold text-lg flex items-center gap-2">
                {event.name}
              </h2>
              <p className="text-xs text-zinc-500">
                Client: <strong className="text-zinc-300">{event.booking?.client?.name}</strong> • Date: {new Date(event.date).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
              {event.status}
            </span>
          </div>
        </header>

        {/* SUB-NAV TABS */}
        <div className="bg-zinc-950 border-b border-zinc-900 px-8 flex gap-6">
          {[
            { id: 'overview', label: 'Overview', icon: Sparkles },
            { id: 'services', label: 'Services', icon: Briefcase },
            { id: 'guests', label: 'Guests', icon: Users },
            { id: 'tasks', label: 'Tasks', icon: CheckSquare },
            { id: 'finance', label: 'Finance', icon: TrendingUp },
            { id: 'documents', label: 'Documents', icon: FileText },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
                  isActive
                    ? 'border-violet-500 text-white'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-violet-400' : 'text-zinc-500'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB WORKSPACE */}
        <div className="flex-1 overflow-auto p-8">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
                <h3 className="text-white font-bold text-base">Space Location</h3>
                <p className="text-xs text-zinc-400">{space?.name || 'Royal Events Main Space'}</p>
                <div className="text-xs text-zinc-500 space-y-1">
                  <p>Capacity: <strong className="text-zinc-200">{space?.capacity || 500} Guests</strong></p>
                  <p>Address: <strong className="text-zinc-200">{space?.address || '100 Grand Blvd'}</strong></p>
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
                <h3 className="text-white font-bold text-base">Client Contact</h3>
                <p className="text-xs text-zinc-400">{event.booking?.client?.name}</p>
                <div className="text-xs text-zinc-500 space-y-1">
                  <p>Email: <strong className="text-zinc-200">{event.booking?.client?.email || 'N/A'}</strong></p>
                  <p>Phone: <strong className="text-zinc-200">{event.booking?.client?.phone || 'N/A'}</strong></p>
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
                <h3 className="text-white font-bold text-base">Event Execution Status</h3>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full inline-block">
                  {event.status}
                </span>
                <p className="text-xs text-zinc-500">{event.notes || 'No special notes.'}</p>
              </div>
            </div>
          )}

          {/* TAB 2: SERVICES (CORE OPERATIONAL WORK ORDER LAYER) */}
          {activeTab === 'services' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-white font-bold text-base">Attached Services</h3>
                  <p className="text-xs text-zinc-500">Click any service to manage its operational work order & supplier workflow.</p>
                </div>
                <button
                  onClick={() => setIsAddServiceOpen(true)}
                  className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg"
                >
                  <Plus className="w-4 h-4" /> Add Service to Event
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {event.eventServices.map((es: any) => {
                  const isInternal = es.providerType === 'INTERNAL';
                  return (
                    <div
                      key={es.id}
                      onClick={() => openServiceWorkOrder(es)}
                      className={`bg-zinc-900 border rounded-2xl p-6 shadow-xl cursor-pointer hover:scale-[1.01] transition-all flex flex-col justify-between space-y-4 ${
                        isInternal ? 'border-emerald-500/30 hover:border-emerald-500' : 'border-blue-500/30 hover:border-blue-500'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                            isInternal
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}>
                            {isInternal ? '🟢 Internal Work Order' : '🔵 External Supplier'}
                          </span>
                          <span className="text-xs font-bold text-zinc-400">{es.status}</span>
                        </div>

                        <h4 className="text-white font-bold text-lg">{es.service?.name}</h4>
                        <p className="text-xs text-zinc-500">Category: {es.service?.category}</p>

                        {/* WORK ORDER SUMMARY PREVIEW */}
                        {isInternal ? (
                          <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850 text-xs text-zinc-400 space-y-1">
                            <p>Operational Status: <strong className="text-emerald-400">{es.status}</strong></p>
                            <p>Selling Price: <strong className="text-zinc-200">{es.sellingPrice.toLocaleString()} MT</strong></p>
                          </div>
                        ) : (
                          <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850 text-xs text-zinc-400 space-y-1">
                            <p>Supplier: <strong className="text-blue-400">{es.supplier?.name || 'Not assigned'}</strong></p>
                            <p>Supplier Cost: <strong className="text-zinc-200">{es.supplierCost.toLocaleString()} MT</strong></p>
                            <p>Supplier Status: <strong className="text-amber-400">{es.supplierStatus}</strong></p>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-zinc-850 text-right">
                        <span className="text-xs text-violet-400 font-bold hover:underline">Manage Work Order →</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: GUESTS */}
          {activeTab === 'guests' && (
            <div className="space-y-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
                <h3 className="text-white font-bold text-base flex items-center gap-2">
                  <Plus className="w-5 h-5 text-violet-400" /> Add Guest to Event
                </h3>
                <form onSubmit={handleAddGuest} className="flex gap-4">
                  <input
                    required
                    value={guestName}
                    onChange={e => setGuestName(e.target.value)}
                    placeholder="Guest Full Name"
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-violet-500"
                  />
                  <input
                    value={guestEmail}
                    onChange={e => setGuestEmail(e.target.value)}
                    placeholder="Guest Email (Optional)"
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-violet-500"
                  />
                  <button
                    type="submit"
                    disabled={addingGuest}
                    className="bg-violet-600 hover:bg-violet-500 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2"
                  >
                    {addingGuest ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Guest'}
                  </button>
                </form>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
                <h3 className="text-white font-bold text-base mb-4">Guest List ({event.guests.length})</h3>
                {event.guests.length === 0 ? (
                  <p className="text-xs text-zinc-500">No guests registered yet.</p>
                ) : (
                  <div className="space-y-2">
                    {event.guests.map((g: any) => (
                      <div key={g.id} className="bg-zinc-950 p-3 rounded-xl border border-zinc-850 flex justify-between items-center text-xs">
                        <div>
                          <span className="text-white font-bold block">{g.name}</span>
                          <span className="text-zinc-500">{g.email || 'No email'}</span>
                        </div>
                        <span className="bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-lg text-zinc-400 font-bold">
                          {g.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: TASKS */}
          {activeTab === 'tasks' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-emerald-400" /> Operational Checklist Across All Services
              </h3>
              {allEventTasks.length === 0 ? (
                <p className="text-xs text-zinc-500">No tasks created. Click on any service in the Services tab to add work order tasks.</p>
              ) : (
                <div className="space-y-2">
                  {allEventTasks.map((t: any, index: number) => (
                    <div key={index} className="bg-zinc-950 p-3 rounded-xl border border-zinc-850 flex justify-between items-center text-xs">
                      <div className="flex items-center gap-3">
                        <input type="checkbox" checked={t.completed} readOnly className="accent-violet-600 w-4 h-4" />
                        <span className={t.completed ? 'line-through text-zinc-500' : 'text-zinc-200 font-medium'}>
                          {t.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-md font-bold">
                        {t.serviceName}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: FINANCE */}
          {activeTab === 'finance' && (
            <div className="space-y-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
                <h3 className="text-white font-bold text-base">Client Invoices</h3>
                {event.booking?.invoices?.map((inv: any) => (
                  <div key={inv.id} className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 flex justify-between items-center text-xs">
                    <div>
                      <span className="text-white font-bold block">{inv.amount.toLocaleString()} MT</span>
                      <span className="text-zinc-500">Due: {new Date(inv.dueDate).toLocaleDateString()}</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full font-bold text-[10px] ${
                      inv.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {inv.status}
                    </span>
                  </div>
                ))}
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
                <h3 className="text-white font-bold text-base">Supplier Expenses</h3>
                {event.expenses?.length === 0 ? (
                  <p className="text-xs text-zinc-500">No expenses recorded for this event.</p>
                ) : (
                  event.expenses?.map((exp: any) => (
                    <div key={exp.id} className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 flex justify-between items-center text-xs">
                      <div>
                        <span className="text-white font-bold block">{exp.description}</span>
                        <span className="text-zinc-500">Supplier: {exp.supplier?.name || 'N/A'}</span>
                      </div>
                      <span className="text-white font-bold">{exp.amount.toLocaleString()} MT</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 6: DOCUMENTS */}
          {activeTab === 'documents' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-violet-400" /> Event Contract & Agreement Documents
              </h3>
              <p className="text-xs text-zinc-400">Commercial contract between Royal Events Co. and {event.booking?.client?.name}.</p>
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 text-xs text-zinc-300 font-mono space-y-2">
                <p>AGREEMENT REF: #EVT-{event.id.slice(-6).toUpperCase()}</p>
                <p>EVENT DATE: {new Date(event.date).toLocaleDateString()}</p>
                <p>GUEST COUNT: {event.guestCount} Guests</p>
                <p>STATUS: CONFIRMED & SIGNED</p>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* SERVICE WORK ORDER DRAWER / MODAL */}
      {selectedService && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-2xl shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
              <div>
                <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                  selectedService.providerType === 'INTERNAL' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'
                }`}>
                  {selectedService.providerType === 'INTERNAL' ? '🟢 Internal Work Order' : '🔵 External Supplier'}
                </span>
                <h3 className="text-white font-bold text-lg mt-1">{selectedService.service?.name}</h3>
              </div>
              <button onClick={() => setSelectedService(null)} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* IF INTERNAL SERVICE WORK ORDER */}
            {selectedService.providerType === 'INTERNAL' ? (
              <div className="space-y-6">
                <div>
                  <label className="text-xs text-zinc-400 font-bold block mb-1">Operational Work Order Status</label>
                  <select
                    value={workOrderStatus}
                    onChange={e => setWorkOrderStatus(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-emerald-500"
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="PLANNING">PLANNING</option>
                    <option value="PREPARING">PREPARING</option>
                    <option value="READY">READY</option>
                    <option value="EXECUTING">EXECUTING</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>

                {/* CUSTOM FIELDS (e.g. Menu / Theme) */}
                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 space-y-3">
                  <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <ChefHat className="w-4 h-4" /> Operational Parameters (Menu / Specifications)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-zinc-500 font-bold block mb-1">Main Selection / Theme</label>
                      <input
                        value={customFields.theme || customFields.menu?.main || ''}
                        onChange={e => setCustomFields({ ...customFields, theme: e.target.value })}
                        placeholder="e.g. Grilled Salmon or Gold Decor"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 font-bold block mb-1">Dietary / Color Palette</label>
                      <input
                        value={customFields.dietary || customFields.colors || ''}
                        onChange={e => setCustomFields({ ...customFields, dietary: e.target.value })}
                        placeholder="e.g. 10 Vegetarians or White/Gold"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* WORK ORDER TASKS CHECKLIST */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-white">Execution Tasks</h4>
                  <div className="flex gap-2">
                    <input
                      value={newTaskTitle}
                      onChange={e => setNewTaskTitle(e.target.value)}
                      placeholder="Add task title..."
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddTask}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold"
                    >
                      + Add
                    </button>
                  </div>

                  <div className="space-y-2 max-h-36 overflow-y-auto p-2 bg-zinc-950 border border-zinc-850 rounded-xl">
                    {tasks.map(t => (
                      <label key={t.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-900 cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={t.completed}
                          onChange={() => toggleTaskCompleted(t.id)}
                          className="accent-emerald-500 w-4 h-4"
                        />
                        <span className={t.completed ? 'line-through text-zinc-500' : 'text-zinc-200'}>{t.title}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* IF EXTERNAL SUPPLIER SERVICE */
              <div className="space-y-6">
                <div>
                  <label className="text-xs text-zinc-400 font-bold block mb-1">Assign External Supplier</label>
                  <select
                    value={supplierId}
                    onChange={e => setSupplierId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-blue-500"
                  >
                    <option value="">-- Select Supplier Partner --</option>
                    {suppliers.map((sup: any) => (
                      <option key={sup.id} value={sup.id}>{sup.name} ({sup.category})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-zinc-400 font-bold block mb-1">Supplier Cost (MT)</label>
                    <input
                      type="number"
                      value={supplierCost}
                      onChange={e => setSupplierCost(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-white text-xs outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 font-bold block mb-1">Supplier Status</label>
                    <select
                      value={supplierStatus}
                      onChange={e => setSupplierStatus(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-white text-xs outline-none focus:border-blue-500"
                    >
                      <option value="REQUESTED">REQUESTED</option>
                      <option value="CONFIRMED">CONFIRMED</option>
                      <option value="DELIVERED">DELIVERED</option>
                      <option value="COMPLETED">COMPLETED</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-zinc-400 font-bold block mb-1">Supplier Payment Status</label>
                  <select
                    value={paymentStatus}
                    onChange={e => setPaymentStatus(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-white text-xs outline-none focus:border-blue-500"
                  >
                    <option value="UNPAID">UNPAID</option>
                    <option value="PARTIAL">PARTIAL</option>
                    <option value="PAID">PAID</option>
                  </select>
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setSelectedService(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveWorkOrder}
                disabled={savingWorkOrder}
                className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold flex items-center gap-2"
              >
                {savingWorkOrder ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Work Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD SERVICE MODAL */}
      {isAddServiceOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
              <h3 className="text-white font-bold text-base">Attach Service to Event</h3>
              <button onClick={() => setIsAddServiceOpen(false)} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddServiceToEvent} className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 font-bold block mb-1">Catalog Service</label>
                <select
                  required
                  value={catalogServiceId}
                  onChange={e => setCatalogServiceId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-violet-500"
                >
                  <option value="">-- Choose Catalog Service --</option>
                  {catalogServices.map((cs: any) => (
                    <option key={cs.id} value={cs.id}>
                      {cs.executionType === 'INTERNAL' ? '🟢' : '🔵'} {cs.name} ({cs.defaultPrice} MT)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 font-bold block mb-1">Selling Price (MT)</label>
                  <input
                    type="number"
                    value={customSellingPrice}
                    onChange={e => setCustomSellingPrice(e.target.value)}
                    placeholder="Default"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-white text-xs outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 font-bold block mb-1">Estimated Cost (MT)</label>
                  <input
                    type="number"
                    value={customCost}
                    onChange={e => setCustomCost(e.target.value)}
                    placeholder="0"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-white text-xs outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddServiceOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingService}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold flex items-center gap-2"
                >
                  {addingService ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Attach Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
