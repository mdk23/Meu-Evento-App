import { Prisma, Space, Supplier, Staff, Service, InventoryItem } from '@prisma/client';
import { DecimalToNumber } from '@/lib/money';

// `Decimal` fields never survive the API boundary as `Decimal` — `src/lib/money.ts`'s `serializeDecimals`
// converts every one to a plain number before `GET /api/events/[id]`'s response is sent.
export type SerializedService = DecimalToNumber<Service>;

export type EventDetailPayload = DecimalToNumber<Prisma.EventGetPayload<{
  include: {
    booking: { include: { client: true; scheduledPayments: true } };
    eventServices: {
      include: {
        service: true;
        supplier: true;
        serviceTasks: true;
        staffAssignments: { include: { staff: true } };
        inventoryReservations: { include: { inventoryItem: true } };
      };
    };
    guests: true;
    expenses: { include: { supplier: true } };
  };
}>>;

export type EventServiceWithRelations = EventDetailPayload['eventServices'][number];
export type WorkOrderTask = EventServiceWithRelations['serviceTasks'][number];
export type StaffAssignment = EventServiceWithRelations['staffAssignments'][number];
export type InventoryReservation = EventServiceWithRelations['inventoryReservations'][number];

export interface EventDetailApiResponse {
  event: EventDetailPayload;
  space?: Space | null;
  suppliers?: Supplier[];
  staff?: Staff[];
  catalogServices?: SerializedService[];
  inventoryItems?: InventoryItem[];
}

/** Shape of the JSON stored in `EventService.customFields`; kept loose since it's a free-form operational spec. */
export interface WorkOrderCustomFields {
  theme?: string;
  dietary?: string;
  menu?: { main?: string };
  colors?: string;
}

export type TabId = 'overview' | 'services' | 'guests' | 'tasks' | 'finance' | 'documents';
