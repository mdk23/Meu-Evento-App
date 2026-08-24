export interface DashboardDTO {
  kpis: {
    /** Contracted revenue: SUM(EventService.sellingPrice) - discount — the source of truth, not cash received. */
    revenue: number;
    /** Cash actually received (SUM of PaymentTransaction.amount) — a distinct figure from `revenue`. */
    totalCollected: number;
    pendingAmount: number;
    internalCost: number;
    supplierCost: number;
    totalCosts: number;
    netProfit: number;
    totalBookings: number;
    totalClients: number;
  };
  todaysEvents: Array<{
    id: string;
    name: string;
    date: string;
    guestCount: number;
    clientName: string;
    status: string;
  }>;
  upcomingEvents: Array<{
    id: string;
    name: string;
    date: string;
    guestCount: number;
    clientName: string;
    serviceSummary: Array<{ id: string; name: string; providerType: string }>;
  }>;
  serviceStatusSummary: Record<string, number>;
  supplierStatusSummary: Record<string, number>;
}

export interface SpaceDashboardDTO {
  kpis: {
    /** Contracted revenue: SUM(EventService.sellingPrice) - discount for SPACE-kind bookings only. */
    revenue: number;
    totalCollected: number;
    pendingAmount: number;
    totalBookings: number;
    upcomingCount: number;
    overdueCount: number;
  };
  todaysBookings: Array<{
    id: string;
    clientName: string;
    guestCount: number;
    status: string;
    startAt: string;
    endAt: string;
  }>;
  upcomingBookings: Array<{
    id: string;
    clientName: string;
    guestCount: number;
    eventDate: string;
    status: string;
  }>;
  space: { name: string; capacity: number; address: string | null } | null;
}

export interface BookingListPageDTO {
  items: BookingListDTO[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  statusCounts: Record<string, number>;
}

export interface BookingListDTO {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail?: string | null;
  clientPhone?: string | null;
  eventTitle?: string | null;
  eventDate: string;
  guestCount: number;
  status: string;
  bookingType: string;
  /** SPACE = commercial-only, no Event workspace; EVENT = has one. See promote/demote. */
  kind: 'SPACE' | 'EVENT';
  notes?: string | null;
  hasEvent: boolean;
  totalScheduledAmount: number;
  paidAmount: number;
  totalContractAmount: number;
  downPaymentAmount: number;
  downPaymentPercent: number;
  discount: number;
  depositStatus: 'PAID' | 'PENDING';
  depositDueDate?: string | null;
}

/** Lightweight booking shape for the calendar's month grid + day timeline — no payment/contract fields, just occupancy. */
export interface CalendarBookingDTO {
  id: string;
  clientName: string;
  eventTitle?: string | null;
  startAt: string;
  endAt: string;
  status: string;
  guestCount: number;
}

export interface EventOverviewDTO {
  id: string;
  bookingId: string;
  name: string;
  date: string;
  guestCount: number;
  status: string;
  clientName: string;
  clientEmail?: string | null;
  clientPhone?: string | null;
  serviceCount: number;
  guestCountRegistered: number;
}

export interface EventListPageDTO {
  items: EventOverviewDTO[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ClientCardDTO {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  companyName?: string | null;
  bookingCount: number;
  totalSpent: number;
  notes?: string | null;
}

export interface ClientListPageDTO {
  items: ClientCardDTO[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Catalog template row — "this service normally requires X" (Phase 14). Either `inventoryItemId` is
 * set (a hard-linked specific variant) or `categoryId` is set (any item in that category qualifies) —
 * never both null. See `ServiceInventoryRequirement` in schema.prisma for the full design reasoning. */
export interface ServiceInventoryRequirementDTO {
  id: string;
  inventoryItemId: string | null;
  inventoryItemName: string | null;
  categoryId: string | null;
  categoryName: string | null;
  quantity: number;
  quantityType: 'FIXED' | 'PER_GUEST' | 'PER_UNIT';
  optional: boolean;
  notes: string | null;
}

export interface ServiceCardDTO {
  id: string;
  name: string;
  category: string;
  /** Which workspace(s) this service can be selected from — SPACE, EVENT, or BOTH. */
  context: 'SPACE' | 'EVENT' | 'BOTH';
  defaultExecutionType: 'INTERNAL' | 'EXTERNAL';
  priceType: 'FIXED' | 'PER_GUEST' | 'PER_HOUR' | 'PER_UNIT';
  defaultPrice: number;
  inventoryRequirements: ServiceInventoryRequirementDTO[];
}

export interface WorkspaceSummaryDTO {
  bookingCount: number;
  upcomingCount: number;
  contractedValue: number;
}

export interface PackageCardDTO {
  id: string;
  name: string;
  description: string | null;
  context: 'SPACE' | 'EVENT';
  pricingMode: 'COMPUTED' | 'FIXED';
  /** Only meaningful when `pricingMode = FIXED`. */
  price: number | null;
  active: boolean;
  services: Array<{
    serviceId: string;
    name: string;
    category: string;
    context: 'SPACE' | 'EVENT' | 'BOTH';
    defaultExecutionType: 'INTERNAL' | 'EXTERNAL';
    priceType: 'FIXED' | 'PER_GUEST' | 'PER_HOUR' | 'PER_UNIT';
    defaultPrice: number;
    /** Units of this service the package bundles by default (e.g. 300 chairs). */
    quantity: number;
    /** Overrides `defaultPrice` for this package only; null means "use the catalog price." */
    priceOverride: number | null;
  }>;
}

export interface FinanceSummaryDTO {
  /** Contracted revenue: SUM(EventService.sellingPrice) - discount — the source of truth, not cash received. */
  totalRevenue: number;
  /** Cash actually received (SUM of PaymentTransaction.amount) — a distinct figure from `totalRevenue`. */
  totalCollected: number;
  pendingInvoicesAmount: number;
  internalCost: number;
  supplierCost: number;
  totalExpensesAmount: number;
  netProfit: number;
  recentPayments: Array<{
    id: string;
    amount: number;
    status: string;
    date: string;
    clientName: string;
    method: string;
  }>;
  recentExpenses: Array<{
    id: string;
    description: string;
    amount: number;
    category: string;
    status: string;
  }>;
}
