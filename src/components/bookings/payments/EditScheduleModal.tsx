'use client';

import React, { useState } from 'react';
import { X, Check, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { ScheduleFormItem, SerializedSchedule } from './types';

interface EditScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  totalContractAmount: number;
  initialSchedules: SerializedSchedule[];
  onSuccess: () => void;
}

// Split so the form only exists while open — mounting fresh each time initializes `schedules`
// straight from `initialSchedules` with no effect needed to "reset" it after the fact.
export default function EditScheduleModal({ isOpen, ...rest }: EditScheduleModalProps) {
  if (!isOpen) return null;
  return <EditScheduleModalForm {...rest} />;
}

function EditScheduleModalForm({ onClose, bookingId, totalContractAmount, initialSchedules, onSuccess }: Omit<EditScheduleModalProps, 'isOpen'>) {
  const [schedules, setSchedules] = useState<ScheduleFormItem[]>(() => [...initialSchedules]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentTotal = schedules.reduce((acc, curr) => acc + (parseFloat(String(curr.amount)) || 0), 0);
  const difference = totalContractAmount - currentTotal;

  const handleAddSchedule = () => {
    setSchedules([
      ...schedules, 
      { 
        id: '', // Empty means new
        name: `Payment ${schedules.length + 1}`,
        amount: difference > 0 ? difference : 0,
        dueDate: new Date().toISOString().split('T')[0],
        paidAmount: 0,
        status: 'PENDING'
      }
    ]);
  };

  const handleRemoveSchedule = (index: number) => {
    const s = schedules[index];
    if (s.paidAmount > 0) {
      toast.error('Cannot remove a schedule that has already received payments.');
      return;
    }
    const newSchedules = [...schedules];
    newSchedules.splice(index, 1);
    setSchedules(newSchedules);
  };

  const handleUpdateSchedule = (index: number, field: keyof ScheduleFormItem, value: string) => {
    const newSchedules = [...schedules];
    newSchedules[index] = { ...newSchedules[index], [field]: value };
    setSchedules(newSchedules);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (Math.abs(difference) > 0.01) {
      toast.error(`Total scheduled amount must exactly match the total contract amount (${totalContractAmount.toLocaleString()} MT). Difference: ${difference} MT`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/payments/schedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedules, totalContractAmount })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update schedule');
      }

      toast.success('Payment schedule updated successfully!');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update schedule');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-scrim">
      <div className="modal wide" style={{ padding: 0, display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        <div className="between" style={{ padding: '18px 22px', borderBottom: '1px solid var(--rule)', flexShrink: 0 }}>
          <div>
            <h3 className="h-sm">Edit Payment Schedule</h3>
            <p className="mini dim" style={{ marginTop: 2 }}>Total Contract Value: <strong style={{ color: 'var(--ok)' }}>{totalContractAmount.toLocaleString()} MT</strong></p>
          </div>
          <button onClick={onClose} className="icon-btn">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="stack" style={{ padding: 22, overflowY: 'auto', flex: 1 }}>
          <div className="stack">
            {schedules.map((sp, idx) => {
              const isPaid = sp.paidAmount > 0;
              return (
                <div
                  key={idx}
                  className="row"
                  style={{
                    alignItems: 'flex-end',
                    gap: 12,
                    padding: 16,
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${isPaid ? 'var(--ok)' : 'var(--rule)'}`,
                    background: isPaid ? 'var(--accent-soft)' : 'var(--surface-2)',
                  }}
                >
                  <div className="field" style={{ flex: 1, marginBottom: 0 }}>
                    <label className="label">Payment Name</label>
                    <input
                      type="text"
                      required
                      value={sp.name}
                      onChange={e => handleUpdateSchedule(idx, 'name', e.target.value)}
                      className="input"
                    />
                  </div>

                  <div className="field" style={{ marginBottom: 0 }}>
                    <label className="label">Due Date</label>
                    <input
                      type="date"
                      required
                      value={sp.dueDate ? new Date(sp.dueDate).toISOString().split('T')[0] : ''}
                      onChange={e => handleUpdateSchedule(idx, 'dueDate', e.target.value)}
                      className="input"
                    />
                  </div>

                  <div className="field" style={{ marginBottom: 0 }}>
                    <label className="label">Amount (MT)</label>
                    <input
                      type="number"
                      required
                      min={sp.paidAmount || 0}
                      value={sp.amount}
                      onChange={e => handleUpdateSchedule(idx, 'amount', e.target.value)}
                      className="input"
                      style={{ minWidth: 120 }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveSchedule(idx)}
                    disabled={isPaid}
                    className="icon-btn"
                    style={{ color: 'var(--bad)', opacity: isPaid ? 0.3 : 1 }}
                    title={isPaid ? 'Cannot delete paid schedule' : 'Remove'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>

          <button type="button" onClick={handleAddSchedule} className="btn" style={{ width: '100%', justifyContent: 'center', borderStyle: 'dashed' }}>
            <Plus className="w-4 h-4" /> Add Milestone
          </button>

          <div
            className={`badge ${Math.abs(difference) < 0.01 ? 'b-ok' : 'b-warn'}`}
            style={{ width: '100%', justifyContent: 'center', padding: '10px 16px', fontSize: 12 }}
          >
            {Math.abs(difference) < 0.01
              ? 'Schedule is balanced. Amounts equal total contract value.'
              : `Difference: ${difference > 0 ? '+' : ''}${difference.toLocaleString()} MT`}
          </div>
        </form>
        <div className="row" style={{ justifyContent: 'flex-end', gap: 12, padding: 18, borderTop: '1px solid var(--rule)', flexShrink: 0 }}>
          <button type="button" onClick={onClose} className="btn ghost">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="btn primary">
            {isSubmitting ? 'Saving...' : (
              <>
                <Check className="w-4 h-4" /> Save Schedule
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
