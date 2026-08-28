export interface Client {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
}

export interface ServiceItem {
  id: string;
  name: string;
  category: 'VENUE' | 'EVENT';
  providerType: 'INTERNAL' | 'EXTERNAL';
  providerName?: string;
  priceType: 'FIXED' | 'PER_GUEST' | 'PER_HOUR';
  price: number;
  description: string;
}

export interface VenueItem {
  id: string;
  name: string;
  capacity: number;
  price: number;
  description: string;
}

export interface CartItem {
  id: string;
  serviceId: string;
  name: string;
  category: 'VENUE' | 'EVENT';
  providerType: 'INTERNAL' | 'EXTERNAL';
  providerName: string;
  priceType: 'FIXED' | 'PER_GUEST' | 'PER_HOUR';
  price: number;
  quantity: number;
  totalPrice: number;
  /** Set when this line came from "Add Package" rather than being added directly — `sourcePackageId`
   * identifies the catalog Package, `packageApplicationKey` groups every line added by the same click
   * (so a real `BookingPackage` snapshot can be reconstructed at submit time from whatever's still in
   * the cart under that key — if the user removed one line afterward, only the remaining ones become
   * part of the frozen snapshot, which is the correct reflection of what was actually sold). */
  sourcePackageId?: string;
  sourcePackageName?: string;
  packageApplicationKey?: string;
  /** Provenance of this line — set on both freshly-added and edit-hydrated lines. */
  source?: 'DIRECT' | 'PACKAGE';
  /** The existing `BookingService.id` this cart line maps to, when the cart was hydrated for an
   * edit. Absent on lines added during the current session — those become brand-new BookingService
   * rows. This is the match key the booking-edit diff (`planBookingServiceSync`) uses. */
  bookingServiceId?: string;
  /** The existing `BookingPackage.id` this line already belongs to (edit hydration only). Lets the
   * diff keep that frozen package snapshot instead of creating a new one. */
  sourceBookingPackageId?: string;
}

import React from 'react';
import { Prisma } from '@prisma/client';
import { DecimalToNumber } from '@/lib/money';
import { PackageCardDTO } from '@/types/dtos';

export type CatalogPackage = PackageCardDTO;

// `Decimal` fields never survive the API/RSC boundary as `Decimal` — `src/lib/money.ts`'s
// `serializeDecimals` converts every one to a plain number before this data reaches the client.
export type CatalogService = DecimalToNumber<Prisma.ServiceGetPayload<{
  select: { id: true; name: true; category: true; context: true; defaultProviderType: true; defaultPrice: true; priceType: true };
}>>;

export type CatalogVenue = Prisma.VenueGetPayload<{ select: { id: true; name: true; capacity: true; description: true } }>;

export type BookingSummary = Prisma.BookingGetPayload<{
  select: { id: true; eventDate: true; startAt: true; endAt: true; venueId: true; status: true; client: { select: { name: true } } };
}>;

/** Full booking record loaded when editing an existing booking; legacy `clientName`/`title` are tolerated but never populated by current callers. `bookingServices` reads off the booking directly — it's always set, unlike `event`, which is null for a VENUE booking. `bookingPackages` is the frozen record of which packages produced which lines — read-only, purely for display (see `BookingContractTab`). */
export type BookingPOSInitialData = DecimalToNumber<Prisma.BookingGetPayload<{
  include: {
    client: true;
    event: { include: { bookingServices: { include: { service: true } } } };
    bookingServices: { include: { service: true } };
    bookingPackages: { include: { items: true } };
    scheduledPayments: true;
  };
}>> & {
  clientName?: string;
  title?: string;
};

export interface BookingPOSTerminalProps {
  initialClients?: Client[];
  initialServices?: CatalogService[];
  initialVenues?: CatalogVenue[];
  initialBookings?: BookingSummary[];
  initialBookingData?: BookingPOSInitialData | null;
  /** Active packages only — applying one adds its bundled services to the cart in one action. */
  initialPackages?: CatalogPackage[];
  paymentsTabComponent?: React.ReactNode;
  /** Pre-selects the event date (`YYYY-MM-DD`) for a brand-new booking — e.g. arriving from the
   * calendar's day view. Ignored when `initialBookingData` is set (editing an existing booking). */
  initialDate?: string;
  /** Which workspace a brand-new booking is created into (`Booking.context`) — set from the
   * `?context=` query string when the "New Booking" link is reached from a workspace-scoped page
   * (e.g. Venue Bookings). Defaults to `EVENT` to match every existing unscoped caller. Ignored when
   * editing. */
  initialKind?: 'VENUE' | 'EVENT';
}
