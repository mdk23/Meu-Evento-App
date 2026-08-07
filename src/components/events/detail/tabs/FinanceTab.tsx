import { TrendingUp, TrendingDown, DollarSign, Layers } from 'lucide-react';
import { EventDetailPayload } from '../types';

interface FinanceTabProps {
  scheduledPayments: EventDetailPayload['booking']['scheduledPayments'];
  expenses: EventDetailPayload['expenses'];
  eventServices: EventDetailPayload['eventServices'];
  discount: number;
}

export default function FinanceTab({ scheduledPayments, expenses, eventServices, discount }: FinanceTabProps) {
  // Revenue/cost source of truth (Phase 9): SUM(EventService.sellingPrice) - discount, with
  // internal and supplier costs read directly off each service rather than re-derived elsewhere.
  const serviceRevenue = eventServices.reduce((sum, es) => sum + es.sellingPrice, 0);
  const revenue = Math.max(0, serviceRevenue - discount);
  const internalCost = eventServices
    .filter((es) => es.providerType === 'INTERNAL')
    .reduce((sum, es) => sum + es.cost, 0);
  const supplierCost = eventServices
    .filter((es) => es.providerType === 'EXTERNAL')
    .reduce((sum, es) => sum + es.supplierCost, 0);
  // Expenses already linked to a service (eventServiceId set) are counted via supplierCost above —
  // only genuinely separate operational expenses on this event are added on top.
  const otherExpenses = expenses.filter((exp) => !exp.eventServiceId).reduce((sum, exp) => sum + exp.amount, 0);
  const totalCosts = internalCost + supplierCost + otherExpenses;
  const eventProfit = revenue - totalCosts;

  return (
    <div className="space-y-6">
      {/* PROFIT SUMMARY */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Revenue</span>
          <span className="text-xl font-black text-white block">{revenue.toLocaleString()} MT</span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Internal Cost</span>
          <span className="text-xl font-black text-emerald-400 block">{internalCost.toLocaleString()} MT</span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Supplier Cost</span>
          <span className="text-xl font-black text-blue-400 block">{supplierCost.toLocaleString()} MT</span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1 mb-1">
            {eventProfit >= 0 ? <TrendingUp className="w-3 h-3 text-violet-400" /> : <TrendingDown className="w-3 h-3 text-red-400" />}
            Event Profit
          </span>
          <span className={`text-xl font-black block ${eventProfit >= 0 ? 'text-violet-400' : 'text-red-400'}`}>
            {eventProfit.toLocaleString()} MT
          </span>
        </div>
      </div>

      {/* SERVICE PROFITABILITY */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-white font-bold text-base flex items-center gap-2">
          <Layers className="w-4 h-4 text-violet-400" /> Service Profitability
        </h3>
        {eventServices.length === 0 ? (
          <p className="text-xs text-zinc-500">No services attached to this event.</p>
        ) : (
          <div className="space-y-2">
            {eventServices.map((es) => {
              const isInternal = es.providerType === 'INTERNAL';
              const cost = isInternal ? es.cost : es.supplierCost;
              const profit = es.sellingPrice - cost;
              return (
                <div key={es.id} className="bg-zinc-950 p-3 rounded-xl border border-zinc-850 flex items-center justify-between text-xs gap-3">
                  <div className="min-w-0">
                    <span className="text-white font-bold block truncate">{es.service?.name || es.serviceNameSnapshot || 'Service'}</span>
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      isInternal ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'
                    }`}>
                      {isInternal ? 'Internal' : 'External'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 font-mono">
                    <span className="text-zinc-400">{es.sellingPrice.toLocaleString()} MT</span>
                    <span className="text-zinc-600">−</span>
                    <span className="text-zinc-400">{cost.toLocaleString()} MT</span>
                    <span className={`font-bold w-24 text-right ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {profit.toLocaleString()} MT
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
        <h3 className="text-white font-bold text-base flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-violet-400" /> Supplier & Operational Expenses
        </h3>
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
