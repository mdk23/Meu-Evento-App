import { Prisma, Space, Supplier, Staff, Service } from '@prisma/client';

export type EventDetailPayload = Prisma.EventGetPayload<{
  include: {
    booking: { include: { client: true; scheduledPayments: true } };
    eventServices: { include: { service: true; supplier: true } };
    guests: true;
    expenses: { include: { supplier: true } };
  };
}>;

export type EventServiceWithRelations = EventDetailPayload['eventServices'][number];

export interface EventDetailApiResponse {
  event: EventDetailPayload;
  space?: Space | null;
  suppliers?: Supplier[];
  staff?: Staff[];
  catalogServices?: Service[];
}

export interface WorkOrderTask {
  id: string;
  title: string;
  completed: boolean;
}

/** Shape of the JSON stored in `EventService.customFields`; kept loose since it's a free-form operational spec. */
export interface WorkOrderCustomFields {
  theme?: string;
  dietary?: string;
  menu?: { main?: string };
  colors?: string;
}

export type TabId = 'overview' | 'services' | 'guests' | 'tasks' | 'finance' | 'documents';
