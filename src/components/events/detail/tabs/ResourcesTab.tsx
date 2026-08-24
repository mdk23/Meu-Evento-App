import { Package, Boxes, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { EventServiceWithRelations } from '../types';
import { EventResourceSummaryRow } from '@/lib/event-resource-summary';

interface ResourcesTabProps {
  eventServices: EventServiceWithRelations[];
  resourceSummary: EventResourceSummaryRow[];
  onOpenWorkOrder: (es: EventServiceWithRelations) => void;
}

const STATUS_BADGE: Record<string, { className: string; label: string }> = {
  FULFILLED: { className: 'b-ok', label: 'Fulfilled' },
  PENDING: { className: 'b-warn', label: 'Coverable' },
  SHORTAGE: { className: 'b-bad', label: 'Shortage' },
  UNRESOLVED: { className: 'b-mute', label: 'Unresolved' },
};

/** The event-wide operational loading list — every resource requirement across every service on
 * this event (Space, Event, direct, or package-sourced — doesn't matter which), aggregated per
 * physical item into Required/Provided/Additional/Reserved/Available/Source/Status. A raw per-row
 * list of everything actually reserved stays below for drill-down into exactly which commitment
 * covers what. */
export default function ResourcesTab({ eventServices, resourceSummary, onOpenWorkOrder }: ResourcesTabProps) {
  const reservations = eventServices.flatMap((es) =>
    es.resources.filter((r) => Number(r.reservedQuantity) > 0).map((r) => ({ ...r, service: es }))
  );

  const shortageCount = resourceSummary.filter((r) => r.status === 'SHORTAGE').length;
  const fulfilledCount = resourceSummary.filter((r) => r.status === 'FULFILLED').length;

  return (
    <div className="stack" style={{ gap: 32 }}>
      <div className="stack" style={{ gap: 10 }}>
        <div>
          <h3 className="h-md">Resource Requirements</h3>
          <p className="mini dim">
            Every resource this event&apos;s services need, aggregated across every service that needs it —
            regardless of whether it came from a Space package, an Event package, or a direct add.
          </p>
        </div>

        {resourceSummary.length > 0 && (
          <div className="grid g3">
            <div className="card plain kpi">
              <span className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Boxes className="w-3 h-3" /> Distinct Resources
              </span>
              <span className="val num">{resourceSummary.length}</span>
            </div>
            <div className="card plain kpi">
              <span className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 className="w-3 h-3" /> Fulfilled
              </span>
              <span className="val num">{fulfilledCount}</span>
            </div>
            <div className="card plain kpi">
              <span className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle className="w-3 h-3" /> Shortages
              </span>
              <span className="val num" style={shortageCount > 0 ? { color: 'var(--bad)' } : undefined}>{shortageCount}</span>
            </div>
          </div>
        )}

        {resourceSummary.length === 0 ? (
          <div className="empty">
            <Package className="w-12 h-12 mx-auto mb-3" style={{ opacity: 0.3 }} />
            <h3 className="h-sm">No Resource Requirements Yet</h3>
            <p className="mini dim" style={{ marginTop: 4, maxWidth: 360, marginLeft: 'auto', marginRight: 'auto' }}>
              Add a service with inventory requirements defined in its catalog entry to see the operational loading list here.
            </p>
          </div>
        ) : (
          <div className="card plain" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="scrollx" style={{ padding: '0 22px 6px' }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th className="r">Required</th>
                    <th className="r">Provided</th>
                    <th className="r">Additional</th>
                    <th className="r">Reserved</th>
                    <th className="r">Available</th>
                    <th>Source</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {resourceSummary.map((row) => {
                    const badge = STATUS_BADGE[row.status];
                    return (
                      <tr key={row.key}>
                        <td style={{ fontWeight: 600 }}>{row.itemLabel}</td>
                        <td className="r num">{row.required}</td>
                        <td className="r num">{row.provided}</td>
                        <td className="r num" style={row.additional > 0 ? { color: 'var(--bad)' } : undefined}>{row.additional}</td>
                        <td className="r num">{row.reserved}</td>
                        <td className="r num">{row.available === null ? '—' : row.available}</td>
                        <td className="mini dim">{row.sources.join(', ')}</td>
                        <td><span className={`badge ${badge.className}`}>{badge.label}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="stack" style={{ gap: 10 }}>
        <div>
          <h3 className="h-md">Reservations</h3>
          <p className="mini dim">Every individual reservation behind the totals above — click one to open its work order.</p>
        </div>

        {reservations.length === 0 ? (
          <p className="mini dim">No reservations yet.</p>
        ) : (
          <div className="card plain" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="scrollx" style={{ padding: '0 22px 6px' }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th className="r">Quantity</th>
                    <th>For Service</th>
                    <th>Window</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((r) => (
                    <tr key={r.id} onClick={() => onOpenWorkOrder(r.service)} style={{ cursor: 'pointer' }}>
                      <td style={{ fontWeight: 600 }}>{r.itemNameSnapshot || r.inventoryItem?.name || 'Item'}</td>
                      <td className="r num">{r.reservedQuantity}</td>
                      <td>{r.service.service?.name || r.service.serviceNameSnapshot || 'Service'}</td>
                      <td className="mini dim">
                        {new Date(r.startAt).toLocaleDateString()} &ndash; {new Date(r.endAt).toLocaleDateString()}
                      </td>
                      <td><span className="badge b-mute">{r.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
