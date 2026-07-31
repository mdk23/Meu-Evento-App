'use client';

import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { toast } from 'sonner';

interface RegisterPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  scheduledPayments: any[];
  onSuccess: () => void;
}

export default function RegisterPaymentModal({ isOpen, onClose, bookingId, scheduledPayments, onSuccess }: RegisterPaymentModalProps) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('CASH');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [recordedBy, setRecordedBy] = useState('System Admin');
  const [scheduledPaymentId, setScheduledPaymentId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const pendingSchedules = scheduledPayments.filter(sp => sp.status !== 'PAID');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          method,
          reference,
          notes,
          recordedBy,
          scheduledPaymentId: scheduledPaymentId || undefined,
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to register payment');
      }

      toast.success('Payment registered successfully!');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-lg font-bold text-white">Register Payment</h2>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">Amount (MT)</label>
            <input
              type="number"
              required
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">Payment Method</label>
            <select
              value={method}
              onChange={e => setMethod(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="CASH">Cash</option>
              <option value="M_PESA">M-Pesa</option>
              <option value="E_MOLA">E-Mola</option>
              <option value="BCI">BCI</option>
              <option value="BIM">BIM</option>
              <option value="CONTA_MOVEL">Conta Movel</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">Allocate to Schedule</label>
            <select
              value={scheduledPaymentId}
              onChange={e => setScheduledPaymentId(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="">-- Unallocated / General Payment --</option>
              {pendingSchedules.map(sp => (
                <option key={sp.id} value={sp.id}>
                  {sp.name} (Bal: {(sp.amount - sp.paidAmount).toLocaleString()} MT)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">Reference / Receipt No.</label>
            <input
              type="text"
              value={reference}
              onChange={e => setReference(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              placeholder="e.g. TRX-123456"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 min-h-[80px]"
              placeholder="Optional notes..."
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? 'Processing...' : (
                <>
                  <Check className="w-5 h-5" /> Confirm Payment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
