import { X, Trash2 } from 'lucide-react';
import { BookingDrawerDetail, EditableBookingFields } from './types';
import BookingStatusLifecycleSection from './BookingStatusLifecycleSection';
import BookingPaymentSection from './BookingPaymentSection';
import EventExecutionStatusSection from './EventExecutionStatusSection';
import BookingEditForm from './BookingEditForm';

interface BookingDrawerProps extends EditableBookingFields {
  booking: BookingDrawerDetail;
  updating: boolean;
  onClose: () => void;
  onChangeField: <K extends keyof EditableBookingFields>(field: K, value: EditableBookingFields[K]) => void;
  onSaveDetails: (bookingId: string) => void;
  onUpdateStatus: (
    bookingId: string,
    updates: {
      status?: string;
      eventStatus?: string;
      eventStatusReason?: string;
      paymentAction?: 'MARK_DEPOSIT_PAID' | 'MARK_ALL_PAID' | 'COMPLETE_FINANCIAL_CLOSURE';
    }
  ) => void;
  onUpdateInvoiceStatus: (bookingId: string, invoiceId: string, newStatus: string) => void;
  onDeletePrompt: (bookingId: string, clientName: string) => void;
}

export default function BookingDrawer({
  booking,
  updating,
  onClose,
  onChangeField,
  onSaveDetails,
  onUpdateStatus,
  onUpdateInvoiceStatus,
  onDeletePrompt,
  ...editFields
}: BookingDrawerProps) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-end z-50 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-zinc-900 border-l border-zinc-800 h-full p-6 flex flex-col justify-between shadow-2xl overflow-y-auto space-y-6">
        <div className="space-y-6">
          <div className="flex justify-between items-start border-b border-zinc-800 pb-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 rounded-full block w-fit mb-2">
                {booking.bookingType?.replace('_', ' ')}
              </span>
              <h2 className="text-white font-bold text-xl">{booking.clientName}</h2>
              <p className="text-xs text-zinc-400">{booking.clientEmail || booking.clientPhone || 'No contact provided'}</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <BookingStatusLifecycleSection booking={booking} updating={updating} onUpdateStatus={onUpdateStatus} />
          <BookingPaymentSection
            booking={booking}
            updating={updating}
            onUpdateStatus={onUpdateStatus}
            onUpdateInvoiceStatus={onUpdateInvoiceStatus}
          />
          <EventExecutionStatusSection booking={booking} updating={updating} onUpdateStatus={onUpdateStatus} />
          <BookingEditForm
            {...editFields}
            updating={updating}
            onChange={onChangeField}
            onSave={() => onSaveDetails(booking.id)}
          />
        </div>

        <div className="pt-4 border-t border-zinc-800 flex gap-3">
          <button
            onClick={() => onDeletePrompt(booking.id, booking.clientName || 'Client')}
            className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2.5 px-4 rounded-xl text-xs font-bold transition-all border border-red-500/20 flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Delete Booking
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2.5 px-4 rounded-xl text-xs font-bold transition-all"
          >
            Close Drawer
          </button>
        </div>
      </div>
    </div>
  );
}
