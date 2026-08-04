import { EventDetailPayload } from '../types';

interface FinanceTabProps {
  scheduledPayments: EventDetailPayload['booking']['scheduledPayments'];
  expenses: EventDetailPayload['expenses'];
}

export default function FinanceTab({ scheduledPayments, expenses }: FinanceTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-white font-bold text-base">Client Invoices</h3>
        {scheduledPayments.map((inv) => (
          <div key={inv.id} className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 flex justify-between items-center text-xs">
            <div>
              <span className="text-white font-bold block">{inv.amount.toLocaleString()} MT</span>
              <span className="text-zinc-500">Due: {new Date(inv.dueDate).toLocaleDateString()}</span>
            </div>
            <span className={`px-3 py-1 rounded-full font-bold text-[10px] ${
              inv.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}>
              {inv.status}
            </span>
          </div>
        ))}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-white font-bold text-base">Supplier Expenses</h3>
        {expenses.length === 0 ? (
          <p className="text-xs text-zinc-500">No expenses recorded for this event.</p>
        ) : (
          expenses.map((exp) => (
            <div key={exp.id} className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 flex justify-between items-center text-xs">
              <div>
                <span className="text-white font-bold block">{exp.description}</span>
                <span className="text-zinc-500">Supplier: {exp.supplier?.name || 'N/A'}</span>
              </div>
              <span className="text-white font-bold">{exp.amount.toLocaleString()} MT</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
