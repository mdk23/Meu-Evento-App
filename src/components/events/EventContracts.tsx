'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, FileText, CheckCircle2, AlertCircle, PlusCircle, CreditCard, XCircle } from 'lucide-react';

interface Contract {
  id: string;
  eventId: string;
  content: string;
  signedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Invoice {
  id: string;
  eventId: string;
  amount: number;
  status: string;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export function EventContracts({ eventId }: { eventId: string }) {
  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState<Contract | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchBillingData = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/contracts`);
      if (!res.ok) throw new Error('Failed to load contract and invoices');
      const data = await res.json();
      setContract(data.contract);
      setInvoices(data.invoices || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, [eventId]);

  const handleContractAction = async (action: 'SIGN' | 'UNSIGN') => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/events/${eventId}/contracts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update contract');
      setContract(data.contract);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setProcessing(false);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceAmount || parseFloat(invoiceAmount) <= 0) return;
    setProcessing(true);
    try {
      const res = await fetch(`/api/events/${eventId}/contracts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_INVOICE',
          amount: parseFloat(invoiceAmount),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create invoice');
      setInvoices([...invoices, data.invoice]);
      setInvoiceAmount('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateInvoiceStatus = async (invoiceId: string, status: string) => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/events/${eventId}/contracts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_INVOICE_STATUS',
          invoiceId,
          status,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update invoice');
      setInvoices(invoices.map((inv) => (inv.id === invoiceId ? data.invoice : inv)));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-violet-400">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* CONTRACT SEGMENT */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-violet-400" /> Event Contract
            </h3>
            
            <div className="bg-zinc-950/80 p-4 rounded-xl border border-zinc-850/60 font-mono text-xs text-zinc-400 max-h-60 overflow-y-auto mb-6 whitespace-pre-wrap">
              {contract?.content}
            </div>
          </div>

          <div className="border-t border-zinc-800 pt-4 flex justify-between items-center">
            <div>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Signature Status</span>
              {contract?.signedAt ? (
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold mt-1 text-sm">
                  <CheckCircle2 className="w-4 h-4" /> Signed on {new Date(contract.signedAt).toLocaleDateString()}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-amber-500 font-bold mt-1 text-sm">
                  <AlertCircle className="w-4 h-4" /> Unsigned / Pending
                </div>
              )}
            </div>

            {contract?.signedAt ? (
              <button
                disabled={processing}
                onClick={() => handleContractAction('UNSIGN')}
                className="bg-zinc-850 hover:bg-zinc-800 text-zinc-300 px-4 py-2 rounded-lg font-bold text-sm transition-colors border border-zinc-800"
              >
                {processing ? 'Processing...' : 'Void Signature'}
              </button>
            ) : (
              <button
                disabled={processing}
                onClick={() => handleContractAction('SIGN')}
                className="bg-violet-600 hover:bg-violet-500 text-white px-5 py-2 rounded-lg font-bold text-sm transition-colors shadow-lg shadow-violet-900/20"
              >
                {processing ? 'Processing...' : 'Sign digitally'}
              </button>
            )}
          </div>
        </div>

        {/* BILLING / INVOICING SEGMENT */}
        <div className="space-y-6">
          {/* ADD INVOICE */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-violet-400" /> Create Invoice
            </h3>
            <form onSubmit={handleCreateInvoice} className="flex gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-2.5 text-zinc-650 text-sm">$</span>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-4 py-2 text-white outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={processing}
                className="bg-zinc-800 hover:bg-zinc-750 text-white px-5 py-2 rounded-lg font-bold text-sm transition-colors border border-zinc-700/50"
              >
                Add Invoice
              </button>
            </form>
          </div>

          {/* INVOICES LIST */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-violet-400" /> Invoices & Billings
            </h3>

            {invoices.length === 0 ? (
              <p className="text-sm text-zinc-500">No invoices generated yet.</p>
            ) : (
              <div className="space-y-3">
                {invoices.map((inv) => (
                  <div key={inv.id} className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-extrabold">${inv.amount.toLocaleString()}</span>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : inv.status === 'CANCELLED'
                            ? 'bg-zinc-800 text-zinc-500 border-zinc-700'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {inv.status}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500 block mt-1">
                        Due: {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      {inv.status !== 'PAID' && (
                        <button
                          disabled={processing}
                          onClick={() => handleUpdateInvoiceStatus(inv.id, 'PAID')}
                          className="bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded text-xs font-bold transition-colors"
                        >
                          Mark Paid
                        </button>
                      )}
                      {inv.status === 'PENDING' && (
                        <button
                          disabled={processing}
                          onClick={() => handleUpdateInvoiceStatus(inv.id, 'CANCELLED')}
                          className="bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 px-2.5 py-1 rounded text-xs font-bold transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
