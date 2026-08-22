import { Gauge, ListChecks, AlertTriangle, TrendingUp, TrendingDown, Layers } from 'lucide-react';
import { EventDetailPayload, EventServiceWithRelations } from '../types';
import { eventStatusBadgeClass, providerTypeBadgeClass } from '../statusStyles';

interface ExecutionTabProps {
  eventServices: EventServiceWithRelations[];
  expenses: EventDetailPayload['expenses'];
  discount: number;
  onOpenWorkOrder: (es: EventServiceWithRelations) => void;
}

const STATUS_ORDER = ['PLANNING', 'READY', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

export default function ExecutionTab({ eventServices, expenses, discount, onOpenWorkOrder }: ExecutionTabProps) {
  const activeServices = eventServices.filter((es) => es.status !== 'CANCELLED');

  const statusCounts = STATUS_ORDER.reduce<Record<string, number>>((acc, status) => {
    acc[status] = eventServices.filter((es) => es.status === status).length;
    return acc;
  }, {});

  const totalTasks = eventServices.reduce((sum, es) => sum + es.serviceTasks.length, 0);
  const doneTasks = eventServices.reduce((sum, es) => sum + es.serviceTasks.filter((t) => t.status === 'DONE').length, 0);
  const now = new Date();
  const overdueTasks = eventServices.flatMap((es) =>
    es.serviceTasks
      .filter((t) => t.status !== 'DONE' && t.dueDate && new Date(t.dueDate) < now)
      .map((t) => ({ ...t, service: es }))
  );

  // Readiness gaps: internal services with no staff assigned, external services still awaiting
  // supplier confirmation — the two things most likely to block execution on the day.
  const understaffed = activeServices.filter((es) => es.providerType === 'INTERNAL' && es.staffAssignments.length === 0);
  const unconfirmedSuppliers = activeServices.filter((es) => es.providerType === 'EXTERNAL' && es.supplierStatus !== 'CONFIRMED');

  const serviceRevenue = eventServices.reduce((sum, es) => sum + es.sellingPrice, 0);
  const revenue = Math.max(0, serviceRevenue - discount);
  const internalCost = eventServices.filter((es) => es.providerType === 'INTERNAL').reduce((sum, es) => sum + es.cost, 0);
  const supplierCost = eventServices.filter((es) => es.providerType === 'EXTERNAL').reduce((sum, es) => sum + es.supplierCost, 0);
  const otherExpenses = expenses.filter((exp) => !exp.bookingServiceId).reduce((sum, exp) => sum + exp.amount, 0);
  const totalCosts = internalCost + supplierCost + otherExpenses;
  const eventProfit = revenue - totalCosts;

  return (
    <div className="stack" style={{ gap: 24 }}>
      <div>
        <h3 className="h-md">Execution & Profitability</h3>
        <p className="mini dim">Work-order readiness, task completion and cost/profit per service.</p>
      </div>

      {/* WORK ORDER STATUS BREAKDOWN */}
      <div className="card plain stack">
        <h3 className="h-sm" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Gauge className="w-4 h-4" style={{ color: 'var(--accent)' }} /> Work Order Status
        </h3>
        <div className="grid g4">
          {STATUS_ORDER.map((status) => (
            <div key={status} className="card plain kpi" style={{ background: 'var(--bg-deep)' }}>
              <span className="label">
                <span className={`badge ${eventStatusBadgeClass(status)}`}>{status.replace('_', ' ')}</span>
              </span>
              <span className="val num">{statusCounts[status]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* TASK COMPLETION */}
      <div className="card plain stack">
        <div className="between">
          <h3 className="h-sm" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ListChecks className="w-4 h-4" style={{ color: 'var(--accent)' }} /> Task Completion
          </h3>
          <span className="mini dim">{doneTasks} / {totalTasks} done</span>
        </div>
        <div className="bar">
          <span style={{ width: `${totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0}%` }} />
        </div>
        {overdueTasks.length > 0 && (
          <div className="stack" style={{ gap: 8, marginTop: 8 }}>
            <span className="label" style={{ color: 'var(--bad)' }}>Overdue</span>
            {overdueTasks.map((t) => (
              <div
                key={t.id}
                onClick={() => onOpenWorkOrder(t.service)}
                className="between"
                style={{ background: 'var(--bg-deep)', border: '1px solid var(--bad)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', cursor: 'pointer' }}
              >
                <span className="mini" style={{ color: 'var(--ink)', fontWeight: 600 }}>{t.title}</span>
                <span className="mini dim">{t.service.service?.name || 'Service'} &middot; due {new Date(t.dueDate!).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* READINESS GAPS */}
      {(understaffed.length > 0 || unconfirmedSuppliers.length > 0) && (
        <div className="card plain stack">
          <h3 className="h-sm" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle className="w-4 h-4" style={{ color: 'var(--warn)' }} /> Readiness Gaps
          </h3>
          <div className="stack" style={{ gap: 8 }}>
            {understaffed.map((es) => (
              <div
                key={es.id}
                onClick={() => onOpenWorkOrder(es)}
                className="between"
                style={{ background: 'var(--bg-deep)', border: '1px solid var(--rule)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', cursor: 'pointer' }}
              >
                <span className="mini" style={{ color: 'var(--ink)', fontWeight: 600 }}>{es.service?.name || 'Service'}</span>
                <span className="badge b-warn">No staff assigned</span>
              </div>
            ))}
            {unconfirmedSuppliers.map((es) => (
              <div
                key={es.id}
                onClick={() => onOpenWorkOrder(es)}
                className="between"
                style={{ background: 'var(--bg-deep)', border: '1px solid var(--rule)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', cursor: 'pointer' }}
              >
                <span className="mini" style={{ color: 'var(--ink)', fontWeight: 600 }}>{es.service?.name || 'Service'}</span>
                <span className="badge b-warn">Supplier not confirmed</span>
              </div>
            ))}
          </div>
        </div>
      )}

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
                  onClick={() => onOpenWorkOrder(es)}
                  className="between"
                  style={{ background: 'var(--bg-deep)', border: '1px solid var(--rule)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', gap: 12, cursor: 'pointer' }}
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
    </div>
  );
}
