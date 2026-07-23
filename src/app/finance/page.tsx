'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { TrendingUp, DollarSign, Clock, Plus, Loader2, CheckCircle2, X } from 'lucide-react';

export default function FinancePage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('invoices');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recordType, setRecordType] = useState('INVOICE');
  const [bookingId, setBookingId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchFinance = async () => {
    try {
      const res = await fetch('/api/finance');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } fontally: {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch('/api/finance');
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
  }, []);

  const handleUpdateStatus = async (itemType: 'INVOICE' | 'EXPENSE', id: string, newStatus: string) => {
    try {
      await fetch('/api/finance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: itemType === 'INVOICE' ? id : undefined,
          expenseId: itemType === 'EXPENSE' ? id : undefined,
          status: newStatus,
        }),
      });
      const freshRes = await fetch('/api/finance');
      const freshJson = await freshRes.json();
      setData(freshJson);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: recordType,
          bookingId,
          supplierId,
          amount,
          description,
        }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setAmount('');
        setDescription('');
        const freshRes = await fetch('/api/finance');
        const freshJson = await freshRes.json();
        setData(freshJson);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-zinc-950 flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center text-violet-400">
          <Loader2 className="w-10 h-10 animate-spin" />
        </div>
      </div>
    );
  }

  const { invoices, expenses, suppliers, bookings, summary } = data;

  return (
    <div className="min-h-screen bg-zinc-950 flex text-zinc-300 font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* HEADER */}
        <header className="h-16 border-b border-zinc-900 bg-zinc-950/50 flex items-center px-8 justify-between">
          <div>
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-violet-400" /> Financial Audit & Profit Analysis
            </h2>
            <p className="text-xs text-zinc-500">Track client revenue collections vs external supplier costs.</p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-lg"
          >
            <Plus className="w-4 h-4" /> Add Record
          </button>
        </header>

        {/* WORKSPACE */}
        <div className="flex-1 overflow-auto p-8 space-y-8">
          
          {/* PROFIT AUDIT SUMMARY METRICS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Cleared Revenue</span>
              <span className="text-3xl font-black text-emerald-400">{summary.totalRevenue.toLocaleString()} MT</span>
              <span className="text-[11px] text-zinc-500 mt-1 block">Paid client invoices</span>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Pending Invoices</span>
              <span className="text-3xl font-black text-amber-400">{summary.pendingRevenue.toLocaleString()} MT</span>
              <span className="text-[11px] text-zinc-500 mt-1 block">Awaiting collection</span>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Supplier Expenses</span>
              <span className="text-3xl font-black text-red-400">{summary.totalExpenses.toLocaleString()} MT</span>
              <span className="text-[11px] text-zinc-500 mt-1 block">Outsourced supplier costs</span>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Net Business Profit</span>
              <span className="text-3xl font-black text-violet-400">{summary.netProfit.toLocaleString()} MT</span>
              <span className="text-[11px] text-zinc-500 mt-1 block">Revenue minus Expenses</span>
            </div>
          </div>

          {/* TAB SELECTION */}
          <div className="flex gap-4 border-b border-zinc-900 pb-3">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'invoices' ? 'bg-violet-600 text-white' : 'bg-zinc-900 text-zinc-400'
              }`}
            >
              Client Invoices ({invoices.length})
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'expenses' ? 'bg-violet-600 text-white' : 'bg-zinc-900 text-zinc-400'
              }`}
            >
              Supplier & Operational Expenses ({expenses.length})
            </button>
          </div>

          {/* INVOICES LIST */}
          {activeTab === 'invoices' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-white font-bold text-base">Client Invoices</h3>
              <div className="space-y-3">
                {invoices.map((inv: any) => (
                  <div key={inv.id} className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 flex justify-between items-center text-xs">
                    <div>
                      <h4 className="text-white font-bold text-sm">{inv.booking?.client?.name}</h4>
                      <p className="text-zinc-500">
                        Event: {inv.booking?.event?.name || 'Booking Ref'} • Due: {new Date(inv.dueDate).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-white font-black text-base">{inv.amount.toLocaleString()} MT</span>
                      {inv.status === 'PAID' ? (
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-bold text-[10px]">
                          PAID
                        </span>
                      ) : (
                        <button
                          onClick={() => handleUpdateStatus('INVOICE', inv.id, 'PAID')}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[11px]"
                        >
                          Mark Paid
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* EXPENSES LIST */}
          {activeTab === 'expenses' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-white font-bold text-base">Supplier Expenses & Operational Costs</h3>
              <div className="space-y-3">
                {expenses.map((exp: any) => (
                  <div key={exp.id} className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 flex justify-between items-center text-xs">
                    <div>
                      <h4 className="text-white font-bold text-sm">{exp.description}</h4>
                      <p className="text-zinc-500">
                        Supplier: {exp.supplier?.name || 'N/A'} • Category: {exp.category}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-red-400 font-black text-base">{exp.amount.toLocaleString()} MT</span>
                      {exp.status === 'PAID' ? (
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-bold text-[10px]">
                          PAID
                        </span>
                      ) : (
                        <button
                          onClick={() => handleUpdateStatus('EXPENSE', exp.id, 'PAID')}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[11px]"
                        >
                          Mark Paid
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* CREATE FINANCIAL RECORD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-violet-400" /> New Financial Transaction
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRecord} className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 font-bold block mb-1">Transaction Type</label>
                <select
                  value={recordType}
                  onChange={e => setRecordType(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-violet-500"
                >
                  <option value="INVOICE">CLIENT INVOICE (INCOME)</option>
                  <option value="EXPENSE">SUPPLIER EXPENSE (COST)</option>
                </select>
              </div>

              {recordType === 'INVOICE' ? (
                <div>
                  <label className="text-xs text-zinc-400 font-bold block mb-1">Select Booking</label>
                  <select
                    required
                    value={bookingId}
                    onChange={e => setBookingId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-violet-500"
                  >
                    <option value="">-- Choose Booking --</option>
                    {bookings.map((b: any) => (
                      <option key={b.id} value={b.id}>{b.client?.name} ({new Date(b.eventDate).toLocaleDateString()})</option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-xs text-zinc-400 font-bold block mb-1">Expense Description</label>
                    <input
                      required
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="e.g. Photo Package Supplier Fee"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-violet-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-zinc-400 font-bold block mb-1">Select Supplier Partner</label>
                    <select
                      value={supplierId}
                      onChange={e => setSupplierId(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-violet-500"
                    >
                      <option value="">-- Optional Supplier --</option>
                      {suppliers.map((s: any) => (
                        <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="text-xs text-zinc-400 font-bold block mb-1">Amount (MT)</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="e.g. 25000"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-violet-500"
                />
              </div>

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
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
