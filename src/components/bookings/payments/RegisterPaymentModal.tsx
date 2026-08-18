'use client';

import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { SerializedSchedule } from './types';

interface RegisterPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  scheduledPayments: SerializedSchedule[];
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
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to register payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-scrim">
      <div className="modal" style={{ width: 'min(460px,100%)', padding: 0 }}>
        <div className="between" style={{ padding: '18px 22px', borderBottom: '1px solid var(--rule)' }}>
          <h3 className="h-sm">Register Payment</h3>
          <button onClick={onClose} className="icon-btn">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="stack" style={{ padding: 22 }}>
          <div className="field">
            <label className="label">Amount (MT)</label>
            <input
              type="number"
              required
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="input"
              placeholder="0.00"
            />
          </div>

          <div className="field">
            <label className="label">Payment Method</label>
            <select value={method} onChange={e => setMethod(e.target.value)} className="input">
              <option value="CASH">Cash</option>
              <option value="M_PESA">M-Pesa</option>
              <option value="E_MOLA">E-Mola</option>
              <option value="BCI">BCI</option>
              <option value="BIM">BIM</option>
              <option value="CONTA_MOVEL">Conta Movel</option>
            </select>
          </div>

          <div className="field">
            <label className="label">Allocate to Schedule</label>
            <select value={scheduledPaymentId} onChange={e => setScheduledPaymentId(e.target.value)} className="input">
              <option value="">-- Unallocated / General Payment --</option>
              {pendingSchedules.map(sp => (
                <option key={sp.id} value={sp.id}>
                  {sp.name} (Bal: {(sp.amount - sp.paidAmount).toLocaleString()} MT)
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="label">Reference / Receipt No.</label>
            <input
              type="text"
              value={reference}
              onChange={e => setReference(e.target.value)}
              className="input"
              placeholder="e.g. TRX-123456"
            />
          </div>

          <div className="field">
            <label className="label">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="input"
              style={{ minHeight: 80 }}
              placeholder="Optional notes..."
            />
          </div>

          <div className="row" style={{ justifyContent: 'flex-end', gap: 12, paddingTop: 8 }}>
            <button type="button" onClick={onClose} className="btn ghost">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn primary">
              {isSubmitting ? 'Processing...' : (
                <>
                  <Check className="w-4 h-4" /> Confirm Payment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
