'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Loader2, X } from 'lucide-react';
import { Prisma } from '@prisma/client';
import { FinanceSummaryDTO } from '@/types/dtos';
import { DecimalToNumber } from '@/lib/money';
import Topbar from '@/components/aurelia/Topbar';

type FinanceSupplier = Prisma.SupplierGetPayload<{ select: { id: true; name: true; category: true } }>;
type FinanceBooking = Prisma.BookingGetPayload<{ select: { id: true; eventDate: true; client: { select: { name: true } } } }>;
// `amount` is typed as `number`, not `Decimal`: `src/lib/money.ts`'s `serializeDecimals` converts every
// Decimal field to a plain number before this data crosses the server/client boundary.
type FinanceInvoice = DecimalToNumber<Prisma.ScheduledPaymentGetPayload<{
  select: { id: true; amount: true; status: true; dueDate: true; booking: { select: { client: { select: { name: true } } } } };
}>>;
type FinanceExpense = DecimalToNumber<Prisma.ExpenseGetPayload<{
  select: { id: true; description: true; amount: true; category: true; status: true; supplier: { select: { name: true } } };
}>>;

interface FinanceClientProps {
  initialSummary: FinanceSummaryDTO;
  suppliers: FinanceSupplier[];
  bookings: FinanceBooking[];
  invoices: FinanceInvoice[];
  expenses: FinanceExpense[];
}

export default function FinanceClient({
  initialSummary,
  suppliers,
  bookings,
  invoices,
  expenses,
}: FinanceClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('invoices');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recordType, setRecordType] = useState('INVOICE');
  const [bookingId, setBookingId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      router.refresh();
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
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <main className="aurelia-shell flex-1 flex flex-col h-screen overflow-hidden">
        <Topbar crumb="Financial Audit & Profit Analysis" note="Track client revenue collections vs external supplier costs.">
          <button onClick={() => setIsModalOpen(true)} className="btn primary sm">
            <Plus className="w-3.5 h-3.5" /> Add Record
          </button>
        </Topbar>

        {/* WORKSPACE */}
        <div className="flex-1 overflow-auto page stack" style={{ gap: 28 }}>

          {/* PROFIT AUDIT SUMMARY METRICS */}
          <div className="grid g4" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
            <div className="card kpi plain f-in d1">
              <span className="label">Total Revenue</span>
              <div className="val" style={{ fontSize: 24, color: 'var(--ok)' }}>{initialSummary.totalRevenue.toLocaleString()} MT</div>
              <div className="delta dim">Contracted service value</div>
            </div>

            <div className="card kpi plain f-in d1">
              <span className="label">Total Collected</span>
              <div className="val" style={{ fontSize: 24 }}>{initialSummary.totalCollected.toLocaleString()} MT</div>
              <div className="delta dim">Cash actually received</div>
            </div>

            <div className="card kpi plain f-in d2">
              <span className="label">Pending Invoices</span>
              <div className="val" style={{ fontSize: 24, color: 'var(--warn)' }}>{initialSummary.pendingInvoicesAmount.toLocaleString()} MT</div>
              <div className="delta dim">Awaiting collection</div>
            </div>

            <div className="card kpi plain f-in d2">
              <span className="label">Internal Cost</span>
              <div className="val" style={{ fontSize: 24, color: 'var(--info)' }}>{initialSummary.internalCost.toLocaleString()} MT</div>
              <div className="delta dim">In-house service costs</div>
            </div>

            <div className="card kpi plain f-in d3">
              <span className="label">Supplier Cost</span>
              <div className="val" style={{ fontSize: 24, color: 'var(--bad)' }}>{initialSummary.supplierCost.toLocaleString()} MT</div>
              <div className="delta dim">Outsourced supplier costs</div>
            </div>

            <div className="card kpi plain f-in d3">
              <span className="label">Net Business Profit</span>
              <div className="val" style={{ fontSize: 24, color: 'var(--accent)' }}>{initialSummary.netProfit.toLocaleString()} MT</div>
              <div className="delta dim">Revenue minus total costs</div>
            </div>
          </div>

          {/* TAB SELECTION */}
          <div className="tabs">
            <button onClick={() => setActiveTab('invoices')} className={`tab ${activeTab === 'invoices' ? 'active' : ''}`}>
              Client Invoices ({invoices.length})
            </button>
            <button onClick={() => setActiveTab('expenses')} className={`tab ${activeTab === 'expenses' ? 'active' : ''}`}>
              Supplier & Operational Expenses ({expenses.length})
            </button>
          </div>

          {/* INVOICES LIST */}
          {activeTab === 'invoices' && (
            <div className="card plain stack">
              <h3 className="h-sm">Client Invoices</h3>
              <div className="stack" style={{ gap: 10 }}>
                {invoices.map((inv) => (
                  <div key={inv.id} className="between" style={{ padding: 14, borderRadius: 'var(--radius-sm)', background: 'var(--surface-2)', border: '1px solid var(--rule)' }}>
                    <div>
                      <h4 style={{ fontWeight: 600, fontSize: 14 }}>{inv.booking?.client?.name || 'Client'}</h4>
                      <p className="mini dim">
                        Due: {new Date(inv.dueDate).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="row" style={{ gap: 16 }}>
                      <span className="num" style={{ fontWeight: 700, fontSize: 15 }}>{inv.amount.toLocaleString()} MT</span>
                      {inv.status === 'PAID' ? (
                        <span className="badge b-ok">Paid</span>
                      ) : (
                        <button onClick={() => handleUpdateStatus('INVOICE', inv.id, 'PAID')} className="btn primary sm">
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
            <div className="card plain stack">
              <h3 className="h-sm">Supplier Expenses & Operational Costs</h3>
              <div className="stack" style={{ gap: 10 }}>
                {expenses.map((exp) => (
                  <div key={exp.id} className="between" style={{ padding: 14, borderRadius: 'var(--radius-sm)', background: 'var(--surface-2)', border: '1px solid var(--rule)' }}>
                    <div>
                      <h4 style={{ fontWeight: 600, fontSize: 14 }}>{exp.description}</h4>
                      <p className="mini dim">
                        Supplier: {exp.supplier?.name || 'N/A'} • Category: {exp.category}
                      </p>
                    </div>

                    <div className="row" style={{ gap: 16 }}>
                      <span className="num" style={{ fontWeight: 700, fontSize: 15, color: 'var(--bad)' }}>{exp.amount.toLocaleString()} MT</span>
                      {exp.status === 'PAID' ? (
                        <span className="badge b-ok">Paid</span>
                      ) : (
                        <button onClick={() => handleUpdateStatus('EXPENSE', exp.id, 'PAID')} className="btn primary sm">
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
        <div className="modal-scrim">
          <div className="modal">
            <div className="card-h" style={{ borderBottom: '1px solid var(--rule)', paddingBottom: 16 }}>
              <h3 className="h-md" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Plus className="w-5 h-5" style={{ color: 'var(--accent)' }} /> New Financial Transaction
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="icon-btn">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRecord} className="stack" style={{ marginTop: 20 }}>
              <div className="field">
                <label className="label">Transaction Type</label>
                <select value={recordType} onChange={e => setRecordType(e.target.value)} className="input">
                  <option value="INVOICE">CLIENT INVOICE (INCOME)</option>
                  <option value="EXPENSE">SUPPLIER EXPENSE (COST)</option>
                </select>
              </div>

              {recordType === 'INVOICE' ? (
                <div className="field">
                  <label className="label">Select Booking</label>
                  <select required value={bookingId} onChange={e => setBookingId(e.target.value)} className="input">
                    <option value="">-- Choose Booking --</option>
                    {bookings.map((b) => (
                      <option key={b.id} value={b.id}>{b.client?.name} ({new Date(b.eventDate).toLocaleDateString()})</option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div className="field">
                    <label className="label">Expense Description</label>
                    <input
                      required
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="e.g. Photo Package Supplier Fee"
                      className="input"
                    />
                  </div>

                  <div className="field">
                    <label className="label">Select Supplier Partner</label>
                    <select value={supplierId} onChange={e => setSupplierId(e.target.value)} className="input">
                      <option value="">-- Optional Supplier --</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="field">
                <label className="label">Amount (MT)</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="e.g. 25000"
                  className="input"
                />
              </div>

              <div className="row" style={{ justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn ghost">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn primary">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
