import { Prisma, Space, Supplier, Staff, Service, InventoryItem } from '@prisma/client';
import { DecimalToNumber } from '@/lib/money';
import { ReuseCandidate } from '@/lib/reuse-candidates';
import { EventResourceSummaryRow } from '@/lib/event-resource-summary';

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
        inventoryReservations: { include: { inventoryItem: true; transactions: true } };
        resourceRequirements: {
          include: {
            inventoryItem: true;
            sourceRequirement: { select: { categoryId: true; category: { select: { name: true } } } };
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

// `reuseCandidates` (Phase 17) is computed server-side in `GET /api/events/[id]` — a cross-service
// comparison, not a Prisma relation — so it's added here by intersection rather than in the `include`
// shape above.
export type ResourceRequirement = RawEventServiceWithRelations['resourceRequirements'][number] & {
  reuseCandidates: ReuseCandidate[];
};

export type EventServiceWithRelations = Omit<RawEventServiceWithRelations, 'resourceRequirements'> & {
  resourceRequirements: ResourceRequirement[];
};

export type EventDetailPayload = Omit<RawEventDetailPayload, 'bookingServices'> & {
  bookingServices: EventServiceWithRelations[];
};

export type WorkOrderTask = EventServiceWithRelations['serviceTasks'][number];
export type StaffAssignment = EventServiceWithRelations['staffAssignments'][number];
export type InventoryReservation = EventServiceWithRelations['inventoryReservations'][number];

export interface EventDetailApiResponse {
  event: EventDetailPayload;
  resourceSummary?: EventResourceSummaryRow[];
  space?: Space | null;
  suppliers?: Supplier[];
  staff?: Staff[];
  catalogServices?: SerializedService[];
  inventoryItems?: InventoryItem[];
}

export type TabId = 'overview' | 'services' | 'tasks' | 'guests' | 'resources' | 'suppliers' | 'payments' | 'execution';
