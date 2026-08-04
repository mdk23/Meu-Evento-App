import { Loader2, Edit3, Save } from 'lucide-react';
import { EditableBookingFields } from './types';

interface BookingEditFormProps extends EditableBookingFields {
  updating: boolean;
  onChange: <K extends keyof EditableBookingFields>(field: K, value: EditableBookingFields[K]) => void;
  onSave: () => void;
}

export default function BookingEditForm({
  editClientName,
  editClientPhone,
  editClientEmail,
  editEventTitle,
  editBookingType,
  editDate,
  editGuests,
  editDiscount,
  editDownPaymentPercent,
  editDepositDueDate,
  editNotes,
  updating,
  onChange,
  onSave,
}: BookingEditFormProps) {
  return (
    <div className="space-y-4 bg-zinc-950 border border-zinc-800 p-4 rounded-xl">
      <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
        <Edit3 className="w-4 h-4 text-violet-400" /> Edit Booking Details
      </h3>

      <div className="space-y-3">
        <div>
          <label className="text-[11px] text-zinc-400 font-bold block mb-1">Client Name</label>
          <input
            type="text"
            value={editClientName}
            onChange={(e) => onChange('editClientName', e.target.value)}
            placeholder="Client Name"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500 font-medium"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] text-zinc-400 font-bold block mb-1">Phone</label>
            <input
              type="text"
              value={editClientPhone}
              onChange={(e) => onChange('editClientPhone', e.target.value)}
              placeholder="Phone"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
            />
          </div>
          <div>
            <label className="text-[11px] text-zinc-400 font-bold block mb-1">Email</label>
            <input
              type="email"
              value={editClientEmail}
              onChange={(e) => onChange('editClientEmail', e.target.value)}
              placeholder="Email"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] text-zinc-400 font-bold block mb-1">Event Title</label>
            <input
              type="text"
              value={editEventTitle}
              onChange={(e) => onChange('editEventTitle', e.target.value)}
              placeholder="e.g. Wedding Reception"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
            />
          </div>
          <div>
            <label className="text-[11px] text-zinc-400 font-bold block mb-1">Booking Type</label>
            <select
              value={editBookingType}
              onChange={(e) => onChange('editBookingType', e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
            >
              <option value="SPACE_AND_SERVICES">Space & Services</option>
              <option value="SPACE_ONLY">Space Only</option>
              <option value="SERVICES_ONLY">Services Only</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] text-zinc-400 font-bold block mb-1">Event Date</label>
            <input
              type="date"
              value={editDate}
              onChange={(e) => onChange('editDate', e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500 font-bold"
            />
          </div>

          <div>
            <label className="text-[11px] text-zinc-400 font-bold block mb-1">Guest Count (pax)</label>
            <input
              type="number"
              value={editGuests}
              onChange={(e) => onChange('editGuests', parseInt(e.target.value || '0', 10))}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500 font-bold"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[10px] text-zinc-400 font-bold block mb-1">Discount (MT)</label>
            <input
              type="number"
              value={editDiscount}
              onChange={(e) => onChange('editDiscount', parseFloat(e.target.value || '0'))}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500"
            />
          </div>
          <div>
            <label className="text-[10px] text-zinc-400 font-bold block mb-1">Deposit %</label>
            <input
              type="number"
              value={editDownPaymentPercent}
              onChange={(e) => onChange('editDownPaymentPercent', parseInt(e.target.value || '50', 10))}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500"
            />
          </div>
          <div>
            <label className="text-[10px] text-zinc-400 font-bold block mb-1">Deposit Due</label>
            <input
              type="date"
              value={editDepositDueDate}
              onChange={(e) => onChange('editDepositDueDate', e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] text-zinc-400 font-bold block mb-1">Agreement Notes</label>
          <textarea
            rows={3}
            value={editNotes}
            onChange={(e) => onChange('editNotes', e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-violet-500 font-mono"
          />
        </div>
      </div>

      <button
        disabled={updating}
        onClick={onSave}
        className="w-full bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md mt-2"
      >
        {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save Booking Changes</>}
      </button>
    </div>
  );
}
