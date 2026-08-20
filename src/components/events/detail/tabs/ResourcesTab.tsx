import { Package, Boxes, Layers } from 'lucide-react';
import { EventServiceWithRelations } from '../types';

interface ResourcesTabProps {
  eventServices: EventServiceWithRelations[];
  onOpenWorkOrder: (es: EventServiceWithRelations) => void;
}

/** Rollup of every `InventoryReservation` across the event's services — INTERNAL-only by
 * construction (`assertInternalProvider` blocks EXTERNAL lines from reserving stock at write
 * time), so nothing here needs to filter by providerType again. */
export default function ResourcesTab({ eventServices, onOpenWorkOrder }: ResourcesTabProps) {
  const reservations = eventServices.flatMap((es) =>
    es.inventoryReservations.map((r) => ({ ...r, service: es }))
  );

  const totalItems = reservations.reduce((sum, r) => sum + r.quantity, 0);
  const distinctItems = new Set(reservations.map((r) => r.inventoryItemId)).size;

  return (
    <div className="stack" style={{ gap: 24 }}>
      <div>
        <h3 className="h-md">Reserved Resources</h3>
        <p className="mini dim">Inventory pulled from internal stock for this event&apos;s work orders.</p>
      </div>

      {reservations.length > 0 && (
        <div className="grid g3">
          <div className="card plain kpi">
            <span className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Boxes className="w-3 h-3" /> Reservations
            </span>
            <span className="val num">{reservations.length}</span>
          </div>
          <div className="card plain kpi">
            <span className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Package className="w-3 h-3" /> Units Reserved
            </span>
            <span className="val num">{totalItems}</span>
          </div>
          <div className="card plain kpi">
            <span className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Layers className="w-3 h-3" /> Distinct Items
            </span>
            <span className="val num">{distinctItems}</span>
          </div>
        </div>
      )}

      {reservations.length === 0 ? (
        <div className="empty">
          <Package className="w-12 h-12 mx-auto mb-3" style={{ opacity: 0.3 }} />
          <h3 className="h-sm">No Resources Reserved</h3>
          <p className="mini dim" style={{ marginTop: 4, maxWidth: 360, marginLeft: 'auto', marginRight: 'auto' }}>
            Reserve inventory from an internal service&apos;s work order to see it here.
          </p>
        </div>
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
                </tr>
              </thead>
              <tbody>
                {reservations.map((r) => (
                  <tr key={r.id} onClick={() => onOpenWorkOrder(r.service)} style={{ cursor: 'pointer' }}>
                    <td style={{ fontWeight: 600 }}>{r.itemNameSnapshot || r.inventoryItem?.name || 'Item'}</td>
                    <td className="r num">{r.quantity}</td>
                    <td>{r.service.service?.name || r.service.serviceNameSnapshot || 'Service'}</td>
                    <td className="mini dim">
                      {new Date(r.startAt).toLocaleDateString()} &ndash; {new Date(r.endAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
