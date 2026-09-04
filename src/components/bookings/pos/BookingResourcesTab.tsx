'use client';

import { Loader2, Package, AlertTriangle } from 'lucide-react';
import { useBookingResources } from './useBookingResources';
import BookingServiceResourcePanel from '@/components/resources/BookingServiceResourcePanel';
import { computeBookingSeatingGaps } from '@/lib/seating';
import { getSeatingCapacity, readAttributeDefs } from '@/lib/inventory-attributes';

interface BookingResourcesTabProps {
  bookingId: string;
}

/** Booking-scoped Resources tab — reachable from any booking's detail/edit screen regardless of
 * whether it has an Event, so a Venue-only booking gets the exact same resource-reservation
 * capability an Event booking gets, with no "Promote to Event" step required anywhere in this
 * path. Lists every INTERNAL service line on the booking with its own resource panel; EXTERNAL
 * lines never hold internal inventory (`assertInternalProvider`), so they're not shown here. */
export default function BookingResourcesTab({ bookingId }: BookingResourcesTabProps) {
  const {
    loading,
    data,
    error,
    handleReserveInventoryItem,
    handleRemoveReservedInventory,
    handleReservationAction,
    handleReuseReservation,
    handleResolveVariant,
  } = useBookingResources(bookingId);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--accent)', padding: 60 }}>
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const internalServices = (data?.booking.bookingServices || []).filter((bs) => bs.providerType === 'INTERNAL');
  const resourceSummary = data?.resourceSummary || [];

  // Per seating item: seats the booking's required chairs/tables provide vs the guest count.
  const guestCount = data?.booking.guestCount ?? 0;
  const seatByItemId = new Map(
    (data?.inventoryItems || []).map((i) => [
      i.id,
      getSeatingCapacity(i.attributes, readAttributeDefs(i.inventoryType?.attributeDefs)),
    ]),
  );
  const seatingGaps = computeBookingSeatingGaps(
    resourceSummary
      .filter((row) => seatByItemId.get(row.key) && (seatByItemId.get(row.key) as number) > 0)
      .map((row) => ({
        inventoryItemId: row.key,
        itemLabel: row.itemLabel,
        units: row.required,
        seatingCapacity: seatByItemId.get(row.key) as number,
      })),
    guestCount
  );

  return (
    <div className="page stack" style={{ gap: 24 }}>
      <div>
        <h3 className="h-md">Resources</h3>
        <p className="mini dim">
          Reserve and track inventory against this booking&apos;s services — works the same whether
          this is a Venue booking or a full Event, no promotion required.
        </p>
      </div>

      {seatingGaps.length > 0 && (
        <div className="card plain stack" style={{ gap: 6, padding: 16, border: '1px solid var(--warn)' }}>
          {seatingGaps.map((g) => (
            <div key={g.inventoryItemId ?? g.itemLabel} className="row mini" style={{ gap: 8, alignItems: 'flex-start' }}>
              <AlertTriangle className="w-4 h-4" style={{ color: 'var(--warn)', flexShrink: 0, marginTop: 1 }} />
              <span>
                {g.itemLabel}: {g.seatsProvided} seat{g.seatsProvided === 1 ? '' : 's'} for {g.guestCount} guest
                {g.guestCount === 1 ? '' : 's'} &mdash; {Math.abs(g.delta)} {g.direction === 'UNDER' ? 'short' : 'over'}.
              </span>
            </div>
          ))}
        </div>
      )}

      {resourceSummary.length > 0 && (
        <div className="card plain stack" style={{ gap: 10, padding: 20 }}>
          <h4 className="mini" style={{ fontWeight: 700, color: 'var(--ink)' }}>Resource summary</h4>
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl" style={{ minWidth: 520 }}>
              <thead>
                <tr>
                  <th>Resource</th>
                  <th style={{ textAlign: 'right' }}>Required</th>
                  <th style={{ textAlign: 'right' }}>Reserved</th>
                  <th style={{ textAlign: 'right' }}>Available</th>
                  <th style={{ textAlign: 'right' }}>Shortage</th>
                  <th style={{ textAlign: 'right' }}>Returned</th>
                  <th style={{ textAlign: 'right' }}>Missing</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {resourceSummary.map((row) => {
                  const badgeClass =
                    row.status === 'FULFILLED' ? 'b-ok'
                    : row.status === 'PENDING' ? 'b-info'
                    : row.status === 'UNRESOLVED' ? 'b-mute'
                    : 'b-warn';
                  return (
                    <tr key={row.key}>
                      <td>{row.itemLabel}</td>
                      <td style={{ textAlign: 'right' }}>{row.required}</td>
                      <td style={{ textAlign: 'right' }}>{row.reserved}</td>
                      <td style={{ textAlign: 'right' }}>{row.available ?? '—'}</td>
                      <td style={{ textAlign: 'right' }}>{row.additional > 0 ? row.additional : '—'}</td>
                      <td style={{ textAlign: 'right' }}>{row.returned > 0 ? row.returned : '—'}</td>
                      <td style={{ textAlign: 'right' }}>{row.missing > 0 ? row.missing : '—'}</td>
                      <td><span className={`badge ${badgeClass}`}>{row.status}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {error && (
        <div className="alert bad">
          <AlertTriangle className="w-4 h-4 shrink-0" style={{ marginTop: 2 }} />
          <span>{error}</span>
        </div>
      )}

      {internalServices.length === 0 ? (
        <div className="empty">
          <Package className="w-12 h-12 mx-auto mb-3" style={{ opacity: 0.3 }} />
          <h3 className="h-sm">No Internal Services Yet</h3>
          <p className="mini dim" style={{ marginTop: 4, maxWidth: 360, marginLeft: 'auto', marginRight: 'auto' }}>
            Add an internal service on the Details tab to start reserving resources against it —
            external supplier lines don&apos;t hold venue inventory.
          </p>
        </div>
      ) : (
        <div className="stack" style={{ gap: 16 }}>
          {internalServices.map((bs) => (
            <div key={bs.id} className="card plain stack" style={{ gap: 12, padding: 20 }}>
              <h4 className="mini" style={{ fontWeight: 700, color: 'var(--ink)' }}>
                {bs.service?.name || bs.serviceNameSnapshot || 'Service'}
              </h4>
              <BookingServiceResourcePanel
                resources={bs.resources}
                inventoryItems={data?.inventoryItems || []}
                onReserveInventory={(options) => handleReserveInventoryItem(bs.id, options)}
                onRemoveReservedInventory={(resourceId) => handleRemoveReservedInventory(bs.id, resourceId)}
                onReservationAction={(resourceId, action, quantity) => handleReservationAction(bs.id, resourceId, action, quantity)}
                onReuseReservation={(resourceRequirementId, reuseFromResourceId, quantity) =>
                  handleReuseReservation(bs.id, resourceRequirementId, reuseFromResourceId, quantity)
                }
                onResolveVariant={(resourceId, inventoryItemId) => handleResolveVariant(bs.id, resourceId, inventoryItemId)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
