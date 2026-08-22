import { Prisma, Space, Supplier, Staff, Service, InventoryItem } from '@prisma/client';
import { DecimalToNumber } from '@/lib/money';

// `Decimal` fields never survive the API boundary as `Decimal` — `src/lib/money.ts`'s `serializeDecimals`
// converts every one to a plain number before `GET /api/events/[id]`'s response is sent.
export type SerializedService = DecimalToNumber<Service>;

export type EventDetailPayload = DecimalToNumber<Prisma.EventGetPayload<{
  include: {
    booking: { include: { client: true; scheduledPayments: true; paymentTransactions: { include: { scheduledPayment: true } } } };
    bookingServices: {
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
    statusOverrides: true;
  };
}>>;

export type EventServiceWithRelations = EventDetailPayload['bookingServices'][number];
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

export type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'multiselect' | 'date' | 'datetime' | 'boolean';

/** One entry of `Service.fieldSchema` — defines a single dynamic operational field for that service's work orders. */
export interface FieldSchemaField {
  key: string;
  type: FieldType;
  label?: string;
  options?: string[];
  required?: boolean;
}

/** Shape of the JSON stored in `BookingService.customFields` — values only, keyed by `FieldSchemaField.key`. */
export type WorkOrderCustomFields = Record<string, string | string[] | number | boolean | null | undefined>;

/** Runtime-validates `Service.fieldSchema` (an untyped `Prisma.Json` value) into `FieldSchemaField[]`. */
export function parseFieldSchema(raw: unknown): FieldSchemaField[] {
  if (!Array.isArray(raw)) return [];
  const validTypes: FieldType[] = ['text', 'textarea', 'number', 'select', 'multiselect', 'date', 'datetime', 'boolean'];
  return raw.filter((f): f is FieldSchemaField =>
    !!f &&
    typeof f === 'object' &&
    typeof (f as FieldSchemaField).key === 'string' &&
    validTypes.includes((f as FieldSchemaField).type)
  );
}

export type TabId = 'overview' | 'services' | 'tasks' | 'guests' | 'resources' | 'suppliers' | 'payments' | 'execution';
