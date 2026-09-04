import { Prisma, Venue, Supplier, Staff, Service } from '@prisma/client';
import { DecimalToNumber } from '@/lib/money';
import { ReuseCandidate } from '@/lib/reuse-candidates';
import { EventResourceSummaryRow } from '@/lib/event-resource-summary';
import type { ResourcePanelInventoryItem } from '@/components/resources/BookingServiceResourcePanel';

// `Decimal` fields never survive the API boundary as `Decimal` — `src/lib/money.ts`'s `serializeDecimals`
// converts every one to a plain number before `GET /api/events/[id]`'s response is sent.
export type SerializedService = DecimalToNumber<Service>;

type RawEventDetailPayload = DecimalToNumber<Prisma.EventGetPayload<{
  include: {
    booking: { include: { client: true; scheduledPayments: true; paymentTransactions: { include: { scheduledPayment: true } } } };
    bookingServices: {
      include: {
        service: true;
        supplier: true;
        serviceTasks: true;
        staffAssignments: { include: { staff: true } };
        resources: {
          include: {
            inventoryItem: true;
            transactions: true;
            sourceRequirement: { select: { inventoryTypeId: true; inventoryType: { select: { name: true } }; matchCriteria: true } };
          };
        };
      };
    };
    guests: true;
    expenses: { include: { supplier: true } };
    statusOverrides: true;
  };
}>>;

type RawEventServiceWithRelations = RawEventDetailPayload['bookingServices'][number];

// `reuseCandidates` is computed server-side in `GET /api/events/[id]` — a cross-service comparison,
// not a Prisma relation — so it's added here by intersection rather than in the `include` shape above.
export type BookingServiceResource = RawEventServiceWithRelations['resources'][number] & {
  reuseCandidates: ReuseCandidate[];
};

export type EventServiceWithRelations = Omit<RawEventServiceWithRelations, 'resources'> & {
  resources: BookingServiceResource[];
};

export type EventDetailPayload = Omit<RawEventDetailPayload, 'bookingServices'> & {
  bookingServices: EventServiceWithRelations[];
};

export type WorkOrderTask = EventServiceWithRelations['serviceTasks'][number];
export type StaffAssignment = EventServiceWithRelations['staffAssignments'][number];

export interface EventDetailApiResponse {
  event: EventDetailPayload;
  resourceSummary?: EventResourceSummaryRow[];
  venue?: Venue | null;
  suppliers?: Supplier[];
  staff?: Staff[];
  catalogServices?: SerializedService[];
  inventoryItems?: ResourcePanelInventoryItem[];
}

export type TabId = 'overview' | 'services' | 'tasks' | 'guests' | 'resources' | 'suppliers' | 'payments' | 'execution';
