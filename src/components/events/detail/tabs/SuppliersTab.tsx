import { Truck, DollarSign, Clock, Wallet } from 'lucide-react';
import { EventDetailPayload, EventServiceWithRelations } from '../types';

interface SuppliersTabProps {
  eventServices: EventServiceWithRelations[];
  expenses: EventDetailPayload['expenses'];
  onOpenWorkOrder: (es: EventServiceWithRelations) => void;
}

const SUPPLIER_STATUS_BADGE: Record<string, string> = {
  REQUESTED: 'b-mute',
  CONFIRMED: 'b-ok',
  DECLINED: 'b-bad',
};

export default function SuppliersTab({ eventServices, expenses, onOpenWorkOrder }: SuppliersTabProps) {
  const externalServices = eventServices.filter((es) => es.providerType === 'EXTERNAL' && es.status !== 'CANCELLED');
  const totalSupplierCost = externalServices.reduce((sum, es) => sum + es.supplierCost, 0);
  const pendingCount = externalServices.filter((es) => es.supplierStatus === 'REQUESTED').length;
  const unpaidCount = externalServices.filter((es) => es.paymentStatus === 'UNPAID').length;
  const otherExpenses = expenses.filter((exp) => !exp.bookingServiceId);

  return (
    <div className="stack" style={{ gap: 24 }}>
      <div>
        <h3 className="h-md">Suppliers & External Costs</h3>
        <p className="mini dim">Every service run by an external supplier, plus stand-alone operational expenses.</p>
      </div>

      {externalServices.length > 0 && (
        <div className="grid g4">
          <div className="card plain kpi">
            <span className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Truck className="w-3 h-3" /> External Services
            </span>
            <span className="val num">{externalServices.length}</span>
          </div>
          <div className="card plain kpi">
            <span className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Wallet className="w-3 h-3" /> Supplier Cost
            </span>
            <span className="val num">{totalSupplierCost.toLocaleString()} MT</span>
          </div>
          <div className="card plain kpi">
            <span className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock className="w-3 h-3" /> Awaiting Confirmation
            </span>
            <span className="val num" style={{ color: pendingCount > 0 ? 'var(--warn)' : undefined }}>{pendingCount}</span>
          </div>
          <div className="card plain kpi">
            <span className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <DollarSign className="w-3 h-3" /> Unpaid
            </span>
            <span className="val num" style={{ color: unpaidCount > 0 ? 'var(--bad)' : undefined }}>{unpaidCount}</span>
          </div>
        </div>
      )}

      {externalServices.length === 0 ? (
        <div className="empty">
          <Truck className="w-12 h-12 mx-auto mb-3" style={{ opacity: 0.3 }} />
          <h3 className="h-sm">No External Suppliers</h3>
          <p className="mini dim" style={{ marginTop: 4 }}>Every service on this event is run internally.</p>
        </div>
      ) : (
        <div className="card plain" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="scrollx" style={{ padding: '0 22px 6px' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Supplier</th>
                  <th className="r">Cost</th>
                  <th>Status</th>
                  <th>Payment</th>
                </tr>
              </thead>
              <tbody>
                {externalServices.map((es) => (
                  <tr key={es.id} onClick={() => onOpenWorkOrder(es)} style={{ cursor: 'pointer' }}>
                    <td style={{ fontWeight: 600 }}>{es.service?.name || es.serviceNameSnapshot || 'Service'}</td>
                    <td>{es.supplier?.name || 'Not assigned'}</td>
                    <td className="r num">{es.supplierCost.toLocaleString()} MT</td>
                    <td>
                      <span className={`badge ${SUPPLIER_STATUS_BADGE[es.supplierStatus || ''] || 'b-mute'}`}>
                        {es.supplierStatus || 'REQUESTED'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${es.paymentStatus === 'PAID' ? 'b-ok' : 'b-warn'}`}>{es.paymentStatus}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card plain stack">
        <h3 className="h-sm" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <DollarSign className="w-4 h-4" style={{ color: 'var(--accent)' }} /> Operational Expenses
        </h3>
        {otherExpenses.length === 0 ? (
          <p className="mini dim">No stand-alone expenses recorded for this event.</p>
        ) : (
          <div className="stack" style={{ gap: 8 }}>
            {otherExpenses.map((exp) => (
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
