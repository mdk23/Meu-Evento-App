'use client';

import React, { useState, useMemo } from 'react';
import { Calendar, CreditCard, Plus, Edit, DollarSign, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import RegisterPaymentModal from './RegisterPaymentModal';
import EditScheduleModal from './EditScheduleModal';
import { SerializedBooking, SerializedSchedule, SerializedTransaction } from './types';

interface BookingPaymentsClientProps {
  booking: SerializedBooking;
  initialScheduledPayments: SerializedSchedule[];
  initialTransactions: SerializedTransaction[];
}

export default function BookingPaymentsClient({ booking, initialScheduledPayments, initialTransactions }: BookingPaymentsClientProps) {
  const [scheduledPayments, setScheduledPayments] = useState(initialScheduledPayments);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isEditScheduleModalOpen, setIsEditScheduleModalOpen] = useState(false);

  // Computed values
  const totalBookingValue = useMemo(() => scheduledPayments.reduce((acc, curr) => acc + curr.amount, 0), [scheduledPayments]);
  const totalPaid = useMemo(() => scheduledPayments.reduce((acc, curr) => acc + curr.paidAmount, 0), [scheduledPayments]);
  const outstandingBalance = totalBookingValue - totalPaid;
  const progressPercent = totalBookingValue > 0 ? (totalPaid / totalBookingValue) * 100 : 0;

  const depositSchedule = scheduledPayments[0]; // Usually the first one is the deposit
  const depositRequired = depositSchedule ? depositSchedule.amount : 0;
  const depositPaid = depositSchedule ? depositSchedule.paidAmount : 0;

  const nextPayment = scheduledPayments.find(sp => sp.status === 'PENDING' || sp.status === 'PARTIALLY_PAID');
  
  const refreshData = async () => {
    try {
      const res = await fetch(`/api/bookings/${booking.id}/payments`);
      const data = await res.json();
      if (data.scheduledPayments) setScheduledPayments(data.scheduledPayments);
      if (data.paymentTransactions) setTransactions(data.paymentTransactions);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    try {
      const res = await fetch(`/api/bookings/${booking.id}/payments/${transactionId}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete payment');
      }
      toast.success('Payment deleted successfully');
      refreshData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete payment');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 pb-32">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-400" />
            Financial Dashboard
          </h1>
          <p className="text-zinc-400 text-sm mt-1">Manage payments and schedules for {booking.client?.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsEditScheduleModalOpen(true)}
            className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-semibold border border-zinc-800 hover:bg-zinc-800 transition-all flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit Schedule
          </button>
          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Register Payment
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <div className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1">Total Booking Value</div>
          <div className="text-2xl font-black text-white">{totalBookingValue.toLocaleString('pt-MZ')} MT</div>
          <div className="mt-4 h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
             <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="mt-2 text-xs text-zinc-500 text-right">{progressPercent.toFixed(0)}% Paid</div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <div className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1">Total Paid</div>
          <div className="text-2xl font-black text-emerald-400">{totalPaid.toLocaleString('pt-MZ')} MT</div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <div className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1">Outstanding Balance</div>
          <div className="text-2xl font-black text-rose-400">{outstandingBalance.toLocaleString('pt-MZ')} MT</div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <div className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1">Next Payment Due</div>
          <div className="text-xl font-bold text-white">{nextPayment ? nextPayment.name : 'All Paid'}</div>
          {nextPayment && (
            <div className="text-sm text-zinc-400 mt-1">
              {(nextPayment.amount - nextPayment.paidAmount).toLocaleString('pt-MZ')} MT due on {new Date(nextPayment.dueDate).toLocaleDateString('pt-MZ')}
            </div>
          )}
        </div>
      </div>

      {/* Payment Schedule (The Plan) */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/50 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-zinc-400" />
          <h2 className="text-lg font-bold text-white">Payment Schedule</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-950/50 text-xs uppercase text-zinc-500 font-semibold">
              <tr>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4">Due Date</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-right">Paid</th>
                <th className="px-6 py-4 text-right">Balance</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {scheduledPayments.map((sp) => (
                <tr key={sp.id} className="hover:bg-zinc-800/20 transition-colors">
                  <td className="px-6 py-4 font-medium text-white">{sp.name}</td>
                  <td className="px-6 py-4">{new Date(sp.dueDate).toLocaleDateString('pt-MZ')}</td>
                  <td className="px-6 py-4 text-right font-mono">{sp.amount.toLocaleString('pt-MZ')} MT</td>
                  <td className="px-6 py-4 text-right font-mono text-emerald-400">{sp.paidAmount.toLocaleString('pt-MZ')} MT</td>
                  <td className="px-6 py-4 text-right font-mono text-rose-400">{(sp.amount - sp.paidAmount).toLocaleString('pt-MZ')} MT</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex px-2 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                      sp.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      sp.status === 'PARTIALLY_PAID' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      sp.status === 'OVERDUE' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                      'bg-zinc-800 text-zinc-400'
                    }`}>
                      {sp.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
              {scheduledPayments.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">No scheduled payments found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment History (The Reality) */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/50 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-bold text-white">Payment History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-950/50 text-xs uppercase text-zinc-500 font-semibold">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4">Reference</th>
                <th className="px-6 py-4">Recorded By</th>
                <th className="px-6 py-4">Notes</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-zinc-800/20 transition-colors">
                  <td className="px-6 py-4">{new Date(tx.date).toLocaleDateString('pt-MZ')}</td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-emerald-400">{tx.amount.toLocaleString('pt-MZ')} MT</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-2 py-1 text-[10px] font-bold rounded-md bg-zinc-800 text-zinc-300">
                      {tx.method.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">{tx.reference || '-'}</td>
                  <td className="px-6 py-4">{tx.recordedBy}</td>
                  <td className="px-6 py-4 text-zinc-500">{tx.notes || '-'}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDeleteTransaction(tx.id)}
                      className="p-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors"
                      title="Delete Payment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-zinc-500">No payments recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <RegisterPaymentModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        bookingId={booking.id}
        scheduledPayments={scheduledPayments}
        onSuccess={refreshData}
      />

      <EditScheduleModal
        isOpen={isEditScheduleModalOpen}
        onClose={() => setIsEditScheduleModalOpen(false)}
        bookingId={booking.id}
        totalContractAmount={booking.totalContractAmount || totalBookingValue}
        initialSchedules={scheduledPayments}
        onSuccess={refreshData}
      />
    </div>
  );
}
