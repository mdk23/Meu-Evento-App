export interface DashboardDTO {
  kpis: {
    revenue: number;
    pendingAmount: number;
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

export interface ServiceCardDTO {
  id: string;
  name: string;
  category: string;
  defaultExecutionType: 'INTERNAL' | 'EXTERNAL';
  priceType: string;
  defaultPrice: number;
  fieldSchema: unknown;
}

export interface FinanceSummaryDTO {
  totalRevenue: number;
  pendingInvoicesAmount: number;
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
