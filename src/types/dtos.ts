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

export interface VenueDashboardDTO {
  kpis: {
    /** Contracted revenue: SUM(EventService.sellingPrice) - discount for VENUE-kind bookings only. */
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
  venue: { name: string; capacity: number; address: string | null } | null;
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
  /** VENUE = commercial-only, no Event workspace; EVENT = has one. See promote/demote. */
  kind: 'VENUE' | 'EVENT';
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

/** Catalog template row — "this service normally requires X". Either `inventoryItemId` is set (Mode
 * A — a hard-linked specific variant) or `inventoryTypeId` is set (Mode B — any item of that type
 * whose attributes satisfy `matchCriteria`) — never both null. */
export interface ServiceInventoryRequirementDTO {
  id: string;
  inventoryItemId: string | null;
  inventoryItemName: string | null;
  inventoryTypeId: string | null;
  inventoryTypeName: string | null;
  matchCriteria: Record<string, unknown> | null;
  /** @deprecated superseded by `inventoryTypeId` — still populated during the Category→Type migration. */
  categoryId: string | null;
  /** @deprecated superseded by `inventoryTypeName`. */
  categoryName: string | null;
  quantity: number;
  quantityType: 'FIXED' | 'PER_GUEST' | 'PER_UNIT' | 'GUESTS_PER_UNIT';
  optional: boolean;
  notes: string | null;
}

/** One dynamic attribute definition on an `InventoryType.attributeDefs` (§15). */
export interface InventoryAttributeDefinitionDTO {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'multiselect' | 'boolean' | 'date';
  required: boolean;
  options?: string[];
  min?: number;
  max?: number;
}

export interface InventoryCategoryDTO {
  id: string;
  name: string;
  description?: string | null;
  active: boolean;
}

export interface InventoryTypeDTO {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  code: string;
  attributeDefs: InventoryAttributeDefinitionDTO[];
  active: boolean;
}

export interface InventoryItemDTO {
  id: string;
  name: string;
  sku?: string | null;
  quantity: number;
  trackingMode: 'QUANTITY';
  active: boolean;
  category: { id: string; name: string };
  type: { id: string; name: string; code: string };
  attributes: Record<string, unknown>;
}

export interface ServiceCardDTO {
  id: string;
  name: string;
  category: string;
  /** Which workspace(s) this service can be selected from — VENUE, EVENT, or BOTH. */
  context: 'VENUE' | 'EVENT' | 'BOTH';
  defaultExecutionType: 'INTERNAL' | 'EXTERNAL';
  priceType: 'FIXED' | 'PER_GUEST' | 'PER_HOUR' | 'PER_UNIT';
  defaultPrice: number;
  /** Pinned to the top of the service picker. */
  featured: boolean;
  inventoryRequirements: ServiceInventoryRequirementDTO[];
}

export interface WorkspaceSummaryDTO {
  bookingCount: number;
  upcomingCount: number;
  contractedValue: number;
}

export interface PackageSeatingSummaryDTO {
  target: number;
  provided: number;
  shortage: number;
  status: 'SUFFICIENT' | 'SHORTAGE';
  uncountedCategoryReqs: number;
}

export interface PackageCardDTO {
  id: string;
  name: string;
  description: string | null;
  context: 'VENUE' | 'EVENT';
  pricingMode: 'COMPUTED' | 'FIXED';
  /** Only meaningful when `pricingMode = FIXED`. */
  price: number | null;
  /** Intended guest count; null when unspecified. Never a hard cap on bookings that use it. */
  capacity: number | null;
  /** Seating-sufficiency preview at `capacity`; null when `capacity` is null. */
  seatingSummary: PackageSeatingSummaryDTO | null;
  /** Bumped on every definition change; snapshotted onto `BookingPackage.packageVersion`. */
  version: number;
  active: boolean;
  services: Array<{
    serviceId: string;
    name: string;
    category: string;
    context: 'VENUE' | 'EVENT' | 'BOTH';
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
