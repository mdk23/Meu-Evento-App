'use client';

import { X, Printer } from 'lucide-react';
import { SerializedBooking, SerializedTransaction } from './types';

interface PaymentReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: SerializedBooking;
  transaction: SerializedTransaction | null;
}

export default function PaymentReceiptModal({ isOpen, onClose, booking, transaction }: PaymentReceiptModalProps) {
  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:bg-white print:p-0">
      <div className="bg-white text-zinc-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl print:shadow-none print:rounded-none">
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 print:hidden">
          <h2 className="text-lg font-bold">Payment Receipt</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
            <button onClick={onClose} className="p-2 text-zinc-500 hover:text-zinc-900 rounded-lg hover:bg-zinc-100">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="text-center space-y-1">
            <h3 className="text-xl font-black">Payment Receipt</h3>
            <p className="text-xs text-zinc-500">Receipt #{transaction.id.slice(-8).toUpperCase()}</p>
          </div>

          <div className="border-t border-b border-zinc-200 py-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Client</span>
              <span className="font-bold">{booking.client?.name || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Event</span>
              <span className="font-bold">{booking.event?.name || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Date Received</span>
              <span className="font-bold">{new Date(transaction.date).toLocaleDateString()}</span>
            </div>
            {transaction.scheduledPayment && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Applied To</span>
                <span className="font-bold">{transaction.scheduledPayment.name}</span>
              </div>
            )}
          </div>

          <div className="text-center py-4">
            <span className="text-xs text-zinc-500 uppercase tracking-widest block mb-1">Amount Received</span>
            <span className="text-4xl font-black text-emerald-600">{transaction.amount.toLocaleString()} MT</span>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Method</span>
              <span className="font-bold">{transaction.method.replace('_', ' ')}</span>
            </div>
            {transaction.reference && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Reference</span>
                <span className="font-mono">{transaction.reference}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-zinc-500">Recorded By</span>
              <span className="font-bold">{transaction.recordedBy}</span>
            </div>
            {transaction.notes && (
              <div className="pt-2 border-t border-zinc-200">
                <span className="text-zinc-500 block mb-1">Notes</span>
                <span className="text-zinc-700">{transaction.notes}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
