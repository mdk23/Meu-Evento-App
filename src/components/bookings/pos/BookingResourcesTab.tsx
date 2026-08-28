'use client';

import { Loader2, Package, AlertTriangle } from 'lucide-react';
import { useBookingResources } from './useBookingResources';
import BookingServiceResourcePanel from '@/components/resources/BookingServiceResourcePanel';

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
  } = useBookingResources(bookingId);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--accent)', padding: 60 }}>
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const internalServices = (data?.booking.bookingServices || []).filter((bs) => bs.providerType === 'INTERNAL');

  return (
    <div className="page stack" style={{ gap: 24 }}>
      <div>
        <h3 className="h-md">Resources</h3>
        <p className="mini dim">
          Reserve and track inventory against this booking&apos;s services — works the same whether
          this is a Venue booking or a full Event, no promotion required.
        </p>
      </div>

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
                onReservationAction={(resourceId, action) => handleReservationAction(bs.id, resourceId, action)}
                onReuseReservation={(resourceRequirementId, reuseFromResourceId, quantity) =>
                  handleReuseReservation(bs.id, resourceRequirementId, reuseFromResourceId, quantity)
                }
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
