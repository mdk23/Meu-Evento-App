'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface EditScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  totalContractAmount: number;
  initialSchedules: any[];
  onSuccess: () => void;
}

export default function EditScheduleModal({ isOpen, onClose, bookingId, totalContractAmount, initialSchedules, onSuccess }: EditScheduleModalProps) {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSchedules([...initialSchedules]);
    }
  }, [isOpen, initialSchedules]);

  if (!isOpen) return null;

  const currentTotal = schedules.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
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

  const handleUpdateSchedule = (index: number, field: string, value: any) => {
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
        body: JSON.stringify({ schedules })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update schedule');
      }

      toast.success('Payment schedule updated successfully!');
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
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white">Edit Payment Schedule</h2>
            <p className="text-xs text-zinc-400">Total Contract Value: <strong className="text-emerald-400">{totalContractAmount.toLocaleString()} MT</strong></p>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
          
          <div className="space-y-3">
            {schedules.map((sp, idx) => {
              const isPaid = sp.paidAmount > 0;
              return (
                <div key={idx} className={`p-4 border rounded-xl flex items-end gap-3 ${isPaid ? 'bg-zinc-900/50 border-emerald-500/30' : 'bg-zinc-900 border-zinc-800'}`}>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">Payment Name</label>
                    <input
                      type="text"
                      required
                      value={sp.name}
                      onChange={e => handleUpdateSchedule(idx, 'name', e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">Due Date</label>
                    <input
                      type="date"
                      required
                      value={sp.dueDate ? new Date(sp.dueDate).toISOString().split('T')[0] : ''}
                      onChange={e => handleUpdateSchedule(idx, 'dueDate', e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">Amount (MT)</label>
                    <input
                      type="number"
                      required
                      min={sp.paidAmount || 0}
                      value={sp.amount}
                      onChange={e => handleUpdateSchedule(idx, 'amount', e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 min-w-[120px]"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveSchedule(idx)}
                    disabled={isPaid}
                    className="p-3 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-xl disabled:opacity-30 transition-colors"
                    title={isPaid ? "Cannot delete paid schedule" : "Remove"}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleAddSchedule}
            className="w-full p-4 border border-dashed border-zinc-700 hover:border-emerald-500 hover:bg-emerald-500/5 text-zinc-400 hover:text-emerald-400 rounded-xl flex items-center justify-center gap-2 transition-all font-bold"
          >
            <Plus className="w-5 h-5" /> Add Milestone
          </button>

          <div className={`p-4 rounded-xl text-center text-sm font-bold border ${Math.abs(difference) < 0.01 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
            {Math.abs(difference) < 0.01 
              ? 'Schedule is balanced. Amounts equal total contract value.' 
              : `Difference: ${difference > 0 ? '+' : ''}${difference.toLocaleString()} MT`}
          </div>

        </form>
        <div className="p-4 border-t border-zinc-800 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : (
              <>
                <Check className="w-5 h-5" /> Save Schedule
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
