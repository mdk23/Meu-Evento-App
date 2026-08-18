import { TrendingUp, TrendingDown, DollarSign, Layers } from 'lucide-react';
import { EventDetailPayload } from '../types';
import { providerTypeBadgeClass } from '../statusStyles';

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
    <div className="stack" style={{ gap: 24 }}>
      {/* PROFIT SUMMARY */}
      <div className="grid g4">
        <div className="card plain kpi">
          <span className="label">Revenue</span>
          <span className="val num">{revenue.toLocaleString()} MT</span>
        </div>
        <div className="card plain kpi">
          <span className="label">Internal Cost</span>
          <span className="val num" style={{ color: 'var(--ok)' }}>{internalCost.toLocaleString()} MT</span>
        </div>
        <div className="card plain kpi">
          <span className="label">Supplier Cost</span>
          <span className="val num" style={{ color: 'var(--info)' }}>{supplierCost.toLocaleString()} MT</span>
        </div>
        <div className="card plain kpi">
          <span className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {eventProfit >= 0 ? (
              <TrendingUp className="w-3 h-3" style={{ color: 'var(--accent)' }} />
            ) : (
              <TrendingDown className="w-3 h-3" style={{ color: 'var(--bad)' }} />
            )}
            Event Profit
          </span>
          <span className="val num" style={{ color: eventProfit >= 0 ? 'var(--accent)' : 'var(--bad)' }}>
            {eventProfit.toLocaleString()} MT
          </span>
        </div>
      </div>

      {/* SERVICE PROFITABILITY */}
      <div className="card plain stack">
        <h3 className="h-md" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Layers className="w-4 h-4" style={{ color: 'var(--accent)' }} /> Service Profitability
        </h3>
        {eventServices.length === 0 ? (
          <p className="mini dim">No services attached to this event.</p>
        ) : (
          <div className="stack" style={{ gap: 8 }}>
            {eventServices.map((es) => {
              const isInternal = es.providerType === 'INTERNAL';
              const cost = isInternal ? es.cost : es.supplierCost;
              const profit = es.sellingPrice - cost;
              return (
                <div
                  key={es.id}
                  className="between"
                  style={{ background: 'var(--bg-deep)', border: '1px solid var(--rule)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', gap: 12 }}
                >
                  <div style={{ minWidth: 0 }}>
                    <span className="mini" style={{ color: 'var(--ink)', fontWeight: 700, display: 'block' }}>
                      {es.service?.name || es.serviceNameSnapshot || 'Service'}
                    </span>
                    <span className={`badge ${providerTypeBadgeClass(es.providerType)}`} style={{ marginTop: 4 }}>
                      {isInternal ? 'Internal' : 'External'}
                    </span>
                  </div>
                  <div className="row num mini dim" style={{ gap: 16, flexShrink: 0 }}>
                    <span>{es.sellingPrice.toLocaleString()} MT</span>
                    <span>&minus;</span>
                    <span>{cost.toLocaleString()} MT</span>
                    <span style={{ fontWeight: 700, width: 96, textAlign: 'right', color: profit >= 0 ? 'var(--ok)' : 'var(--bad)' }}>
                      {profit.toLocaleString()} MT
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="card plain stack">
        <h3 className="h-md">Client Invoices</h3>
        {scheduledPayments.map((inv) => (
          <div
            key={inv.id}
            className="between"
            style={{ background: 'var(--bg-deep)', border: '1px solid var(--rule)', borderRadius: 'var(--radius-sm)', padding: 14 }}
          >
            <div>
              <span className="mini" style={{ color: 'var(--ink)', fontWeight: 700, display: 'block' }}>{inv.amount.toLocaleString()} MT</span>
              <span className="mini dim">Due: {new Date(inv.dueDate).toLocaleDateString()}</span>
            </div>
            <span className={`badge ${inv.status === 'PAID' ? 'b-ok' : 'b-warn'}`}>{inv.status}</span>
          </div>
        ))}
      </div>

      <div className="card plain stack">
        <h3 className="h-md" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <DollarSign className="w-4 h-4" style={{ color: 'var(--accent)' }} /> Supplier & Operational Expenses
        </h3>
        {expenses.length === 0 ? (
          <p className="mini dim">No expenses recorded for this event.</p>
        ) : (
          expenses.map((exp) => (
            <div
              key={exp.id}
              className="between"
              style={{ background: 'var(--bg-deep)', border: '1px solid var(--rule)', borderRadius: 'var(--radius-sm)', padding: 14 }}
            >
              <div>
                <span className="mini" style={{ color: 'var(--ink)', fontWeight: 700, display: 'block' }}>{exp.description}</span>
                <span className="mini dim">Supplier: {exp.supplier?.name || 'N/A'}</span>
              </div>
              <span className="mini" style={{ color: 'var(--ink)', fontWeight: 700 }}>{exp.amount.toLocaleString()} MT</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
