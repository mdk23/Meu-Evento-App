import { CreditCard, CheckCircle2, DollarSign } from 'lucide-react';
import { BookingDrawerDetail } from './types';

interface BookingPaymentSectionProps {
  booking: BookingDrawerDetail;
  updating: boolean;
  onUpdateStatus: (
    bookingId: string,
    updates: { paymentAction?: 'MARK_DEPOSIT_PAID' | 'MARK_ALL_PAID' | 'COMPLETE_FINANCIAL_CLOSURE' }
  ) => void;
  onUpdateInvoiceStatus: (bookingId: string, invoiceId: string, newStatus: string) => void;
}

export default function BookingPaymentSection({ booking, updating, onUpdateStatus, onUpdateInvoiceStatus }: BookingPaymentSectionProps) {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-4">
      <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
        <CreditCard className="w-4 h-4 text-violet-400" /> Payment & Financial Breakdown
      </h3>

      <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800 space-y-2 text-xs">
        <div className="flex justify-between text-zinc-400">
          <span>Total Contract Value:</span>
          <strong className="text-white font-bold">{(booking.totalContractAmount || 0).toLocaleString()} MT</strong>
        </div>
        <div className="flex justify-between text-zinc-400">
          <span>Initial Deposit:</span>
          <strong className="text-zinc-200">
            {(booking.downPaymentAmount || 0).toLocaleString()} MT ({booking.downPaymentPercent || 50}%)
          </strong>
        </div>
        <div className="flex justify-between text-emerald-400">
          <span>Total Paid to Date:</span>
          <strong className="font-bold">{(booking.paidAmount || 0).toLocaleString()} MT</strong>
        </div>
        <div className="flex justify-between text-zinc-400 border-t border-zinc-800 pt-2">
          <span>Outstanding Balance:</span>
          <strong className="text-amber-400">
            {Math.max(0, (booking.totalContractAmount || 0) - (booking.paidAmount || 0)).toLocaleString()} MT
          </strong>
        </div>
        {booking.depositDueDate && (
          <div className="flex justify-between text-zinc-500 text-[10px] pt-1">
            <span>Deposit Due Date:</span>
            <span>{new Date(booking.depositDueDate).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {booking.scheduledPayments && booking.scheduledPayments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Invoices & Milestones</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {booking.scheduledPayments.map((inv) => (
              <div key={inv.id} className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-white block">{inv.description || inv.name || 'Milestone Payment'}</span>
                  <span className="text-[10px] text-zinc-500">Due: {new Date(inv.dueDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-violet-400 font-bold">{inv.amount.toLocaleString()} MT</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      inv.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {inv.status}
                  </span>
                  {inv.status !== 'PAID' && (
                    <button
                      disabled={updating}
                      onClick={() => onUpdateInvoiceStatus(booking.id, inv.id, 'PAID')}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] px-2 py-1 rounded-lg font-bold transition-all"
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

      <div className="flex flex-col gap-2 pt-1 border-t border-zinc-850/55">
        <button
          disabled={updating}
          onClick={() => onUpdateStatus(booking.id, { paymentAction: 'MARK_DEPOSIT_PAID' })}
          className="w-full bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          Record Initial Deposit (Confirm Booking)
        </button>

        <button
          disabled={updating}
          onClick={() => onUpdateStatus(booking.id, { paymentAction: 'MARK_ALL_PAID' })}
          className="w-full bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2"
        >
          <DollarSign className="w-4 h-4 text-violet-400" />
          Mark All Payments Complete ➔ Event READY
        </button>
      </div>
    </div>
  );
}
