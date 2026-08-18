'use client';

import React, { useState, useMemo } from 'react';
import { Calendar, CreditCard, Plus, Edit, DollarSign, Trash2, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import RegisterPaymentModal from './RegisterPaymentModal';
import EditScheduleModal from './EditScheduleModal';
import PaymentReceiptModal from './PaymentReceiptModal';
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
  const [receiptTransaction, setReceiptTransaction] = useState<SerializedTransaction | null>(null);

  // Computed values
  const totalBookingValue = useMemo(() => scheduledPayments.reduce((acc, curr) => acc + curr.amount, 0), [scheduledPayments]);
  const totalPaid = useMemo(() => scheduledPayments.reduce((acc, curr) => acc + curr.paidAmount, 0), [scheduledPayments]);
  const outstandingBalance = totalBookingValue - totalPaid;
  const progressPercent = totalBookingValue > 0 ? (totalPaid / totalBookingValue) * 100 : 0;

  const nextPayment = scheduledPayments.find(sp => sp.status === 'PENDING' || sp.status === 'PARTIALLY_PAID');
  
  const refreshData = async () => {
    try {
      const res = await fetch(`/api/bookings/${booking.id}/payments`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to refresh payment data');
      }
      const data = await res.json();
      if (data.scheduledPayments) setScheduledPayments(data.scheduledPayments);
      if (data.paymentTransactions) setTransactions(data.paymentTransactions);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Failed to refresh payment data');
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

  const scheduleBadge = (status: string) => {
    if (status === 'PAID') return 'b-ok';
    if (status === 'PARTIALLY_PAID') return 'b-warn';
    if (status === 'OVERDUE') return 'b-bad';
    return 'b-mute';
  };

  return (
    <div className="page" style={{ padding: '24px 24px 128px', maxWidth: 1180 }}>
      <div className="between" style={{ marginBottom: 24 }}>
        <div>
          <h2 className="h-md" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <DollarSign className="w-5 h-5" style={{ color: 'var(--ok)' }} />
            Financial Dashboard
          </h2>
          <p className="mini dim" style={{ marginTop: 4 }}>Manage payments and schedules for {booking.client?.name}</p>
        </div>
        <div className="row" style={{ gap: 12 }}>
          <button onClick={() => setIsEditScheduleModalOpen(true)} className="btn sm">
            <Edit className="w-3.5 h-3.5" />
            Edit Schedule
          </button>
          <button onClick={() => setIsRegisterModalOpen(true)} className="btn primary sm">
            <Plus className="w-3.5 h-3.5" />
            Register Payment
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid g4" style={{ marginBottom: 24 }}>
        <div className="card kpi plain f-in d1">
          <span className="label">Total Booking Value</span>
          <div className="val">{totalBookingValue.toLocaleString('pt-MZ')} MT</div>
          <div className="bar" style={{ marginTop: 12 }}>
            <span style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="delta dim" style={{ justifyContent: 'flex-end' }}>{progressPercent.toFixed(0)}% Paid</div>
        </div>

        <div className="card kpi plain f-in d2">
          <span className="label">Total Paid</span>
          <div className="val" style={{ color: 'var(--ok)' }}>{totalPaid.toLocaleString('pt-MZ')} MT</div>
        </div>

        <div className="card kpi plain f-in d3">
          <span className="label">Outstanding Balance</span>
          <div className="val" style={{ color: 'var(--bad)' }}>{outstandingBalance.toLocaleString('pt-MZ')} MT</div>
        </div>

        <div className="card kpi plain f-in d4">
          <span className="label">Next Payment Due</span>
          <div className="val" style={{ fontSize: 21 }}>{nextPayment ? nextPayment.name : 'All Paid'}</div>
          {nextPayment && (
            <div className="delta dim">
              {(nextPayment.amount - nextPayment.paidAmount).toLocaleString('pt-MZ')} MT due on {new Date(nextPayment.dueDate).toLocaleDateString('pt-MZ')}
            </div>
          )}
        </div>
      </div>

      {/* Payment Schedule (The Plan) */}
      <div className="card plain" style={{ padding: 0, overflow: 'hidden', marginBottom: 24 }}>
        <div className="row" style={{ gap: 8, padding: '16px 22px', borderBottom: '1px solid var(--rule)' }}>
          <Calendar className="w-4 h-4" style={{ color: 'var(--ink-3)' }} />
          <h3 className="h-sm">Payment Schedule</h3>
        </div>
        <div className="scrollx" style={{ padding: '0 22px 6px' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Payment</th>
                <th>Due Date</th>
                <th className="r">Amount</th>
                <th className="r">Paid</th>
                <th className="r">Balance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {scheduledPayments.map((sp) => (
                <tr key={sp.id}>
                  <td style={{ fontWeight: 600 }}>{sp.name}</td>
                  <td>{new Date(sp.dueDate).toLocaleDateString('pt-MZ')}</td>
                  <td className="r num">{sp.amount.toLocaleString('pt-MZ')} MT</td>
                  <td className="r num" style={{ color: 'var(--ok)' }}>{sp.paidAmount.toLocaleString('pt-MZ')} MT</td>
                  <td className="r num" style={{ color: 'var(--bad)' }}>{(sp.amount - sp.paidAmount).toLocaleString('pt-MZ')} MT</td>
                  <td>
                    <span className={`badge ${scheduleBadge(sp.status)}`}>{sp.status.replace('_', ' ')}</span>
                  </td>
                </tr>
              ))}
              {scheduledPayments.length === 0 && (
                <tr>
                  <td colSpan={6} className="mini dim" style={{ textAlign: 'center', padding: '32px 0' }}>No scheduled payments found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment History (The Reality) */}
      <div className="card plain" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="row" style={{ gap: 8, padding: '16px 22px', borderBottom: '1px solid var(--rule)' }}>
          <CreditCard className="w-4 h-4" style={{ color: 'var(--ok)' }} />
          <h3 className="h-sm">Payment History</h3>
        </div>
        <div className="scrollx" style={{ padding: '0 22px 6px' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Date</th>
                <th className="r">Amount</th>
                <th>Method</th>
                <th>Reference</th>
                <th>Recorded By</th>
                <th>Notes</th>
                <th className="r">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td>{new Date(tx.date).toLocaleDateString('pt-MZ')}</td>
                  <td className="r num" style={{ fontWeight: 600, color: 'var(--ok)' }}>{tx.amount.toLocaleString('pt-MZ')} MT</td>
                  <td>
                    <span className="badge b-mute">{tx.method.replace('_', ' ')}</span>
                  </td>
                  <td className="mini dim">{tx.reference || '-'}</td>
                  <td>{tx.recordedBy}</td>
                  <td className="mini dim">{tx.notes || '-'}</td>
                  <td className="r">
                    <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
                      <button onClick={() => setReceiptTransaction(tx)} className="icon-btn" style={{ width: 30, height: 30 }} title="View Receipt">
                        <Receipt className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeleteTransaction(tx.id)} className="icon-btn" style={{ width: 30, height: 30, color: 'var(--bad)' }} title="Delete Payment">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="mini dim" style={{ textAlign: 'center', padding: '32px 0' }}>No payments recorded yet.</td>
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

      <PaymentReceiptModal
        isOpen={!!receiptTransaction}
        onClose={() => setReceiptTransaction(null)}
        booking={booking}
        transaction={receiptTransaction}
      />
    </div>
  );
}
