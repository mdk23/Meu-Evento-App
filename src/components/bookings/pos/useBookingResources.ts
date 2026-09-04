import { useEffect, useState } from 'react';
import type { ResourceReuseCandidate, ResourcePanelInventoryItem } from '@/components/resources/BookingServiceResourcePanel';
import type { EventResourceSummaryRow } from '@/lib/event-resource-summary';

export interface BookingResourceRow {
  id: string;
  bookingServiceId: string;
  inventoryItemId: string | null;
  itemNameSnapshot: string | null;
  requiredQuantity: number;
  reservedQuantity: number;
  usedQuantity: number;
  status: string;
  startAt: string;
  endAt: string;
  sourceRequirement:
    | { inventoryTypeId: string | null; inventoryType: { name: string } | null; matchCriteria: unknown }
    | null;
  reuseCandidates: ResourceReuseCandidate[];
}

export interface BookingResourceService {
  id: string;
  providerType: string;
  serviceNameSnapshot: string | null;
  service: { name: string } | null;
  resources: BookingResourceRow[];
}

interface BookingResourcesApiResponse {
  booking: { id: string; guestCount: number; bookingServices: BookingResourceService[] };
  resourceSummary: EventResourceSummaryRow[];
  inventoryItems: ResourcePanelInventoryItem[];
}

/** Booking-scoped resource management — the same booking-scoped API the Event work-order modal
 * hits, just fetched and rendered flat across every service on the booking instead of behind a
 * modal, and reachable for any booking regardless of whether it has an Event. */
export function useBookingResources(bookingId: string) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<BookingResourcesApiResponse | null>(null);
  const [error, setError] = useState('');

  const reload = async () => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/resources`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to load booking resources:', err);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/bookings/${bookingId}/resources`);
        const json = await res.json();
        if (active) setData(json);
      } catch (err) {
        console.error('Failed to load booking resources:', err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [bookingId]);

  const handleReserveInventoryItem = async (
    bookingServiceId: string,
    options: { inventoryItemId: string; quantity: number; resourceRequirementId?: string }
  ) => {
    setError('');
    try {
      const res = await fetch(`/api/bookings/${bookingId}/services/${bookingServiceId}/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error || 'Failed to reserve inventory.');
        return;
      }
      await reload();
    } catch (err) {
      console.error('Failed to reserve inventory:', err);
    }
  };

  const handleRemoveReservedInventory = async (bookingServiceId: string, resourceId: string) => {
    try {
      await fetch(`/api/bookings/${bookingId}/services/${bookingServiceId}/inventory/${resourceId}`, { method: 'DELETE' });
      await reload();
    } catch (err) {
      console.error('Failed to release inventory reservation:', err);
    }
  };

  const handleReservationAction = async (
    bookingServiceId: string,
    resourceId: string,
    action: string,
    quantity?: number
  ) => {
    setError('');
    try {
      const res = await fetch(`/api/bookings/${bookingId}/services/${bookingServiceId}/inventory/${resourceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quantity !== undefined ? { action, quantity } : { action }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error || 'Failed to update reservation.');
        return;
      }
      await reload();
    } catch (err) {
      console.error('Failed to transition inventory reservation:', err);
    }
  };

  const handleResolveVariant = async (bookingServiceId: string, resourceId: string, inventoryItemId: string) => {
    setError('');
    try {
      const res = await fetch(
        `/api/bookings/${bookingId}/services/${bookingServiceId}/inventory/${resourceId}/resolve`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inventoryItemId }),
        }
      );
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error || 'Failed to set the item for this requirement.');
        return;
      }
      await reload();
    } catch (err) {
      console.error('Failed to resolve category resource:', err);
    }
  };

  const handleReuseReservation = async (
    bookingServiceId: string,
    resourceRequirementId: string,
    reuseFromResourceId: string,
    quantity: number
  ) => {
    setError('');
    try {
      const res = await fetch(`/api/bookings/${bookingId}/services/${bookingServiceId}/inventory/reuse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resourceRequirementId, reuseReservationId: reuseFromResourceId, quantity }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error || 'Failed to reuse reservation.');
        return;
      }
      await reload();
    } catch (err) {
      console.error('Failed to reuse inventory reservation:', err);
    }
  };

  return {
    loading,
    data,
    error,
    handleReserveInventoryItem,
    handleRemoveReservedInventory,
    handleReservationAction,
    handleReuseReservation,
    handleResolveVariant,
  };
}
