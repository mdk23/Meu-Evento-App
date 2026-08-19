export interface Client {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
}

export interface ServiceItem {
  id: string;
  name: string;
  category: 'SPACE' | 'EVENT';
  providerType: 'INTERNAL' | 'EXTERNAL';
  providerName?: string;
  priceType: 'FIXED' | 'PER_GUEST' | 'HOURLY';
  price: number;
  description: string;
}

export interface SpaceItem {
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
  category: 'SPACE' | 'EVENT';
  providerType: 'INTERNAL' | 'EXTERNAL';
  providerName: string;
  priceType: 'FIXED' | 'PER_GUEST' | 'HOURLY';
  price: number;
  quantity: number;
  totalPrice: number;
}

import React from 'react';
import { Prisma } from '@prisma/client';
import { DecimalToNumber } from '@/lib/money';

// `Decimal` fields never survive the API/RSC boundary as `Decimal` — `src/lib/money.ts`'s
// `serializeDecimals` converts every one to a plain number before this data reaches the client.
export type CatalogService = DecimalToNumber<Prisma.ServiceGetPayload<{
  select: { id: true; name: true; category: true; defaultExecutionType: true; defaultPrice: true; priceType: true };
}>>;

export type CatalogSpace = Prisma.SpaceGetPayload<{ select: { id: true; name: true; capacity: true; description: true } }>;

export type BookingSummary = Prisma.BookingGetPayload<{
  select: { id: true; eventDate: true; startAt: true; endAt: true; spaceId: true; status: true; client: { select: { name: true } } };
}>;

/** Full booking record loaded when editing an existing booking; legacy `clientName`/`title` are tolerated but never populated by current callers. `eventServices` reads off the booking directly — it's always set, unlike `event`, which is null for a SPACE booking. */
export type BookingPOSInitialData = DecimalToNumber<Prisma.BookingGetPayload<{
  include: {
    client: true;
    event: { include: { eventServices: { include: { service: true } } } };
    eventServices: { include: { service: true } };
    scheduledPayments: true;
  };
}>> & {
  clientName?: string;
  title?: string;
};

export interface BookingPOSTerminalProps {
  initialClients?: Client[];
  initialServices?: CatalogService[];
  initialSpaces?: CatalogSpace[];
  initialBookings?: BookingSummary[];
  initialBookingData?: BookingPOSInitialData | null;
  paymentsTabComponent?: React.ReactNode;
  /** Pre-selects the event date (`YYYY-MM-DD`) for a brand-new booking — e.g. arriving from the
   * calendar's day view. Ignored when `initialBookingData` is set (editing an existing booking). */
  initialDate?: string;
}
