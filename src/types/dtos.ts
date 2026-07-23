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
}

export interface BookingListDTO {
  id: string;
  clientId: string;
  clientName: string;
  eventDate: string;
  guestCount: number;
  status: string;
  bookingType: string;
  notes?: string | null;
  hasEvent: boolean;
  totalInvoiceAmount: number;
  paidInvoiceAmount: number;
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
}

export interface ServiceCardDTO {
  id: string;
  name: string;
  category: string;
  executionType: 'INTERNAL' | 'EXTERNAL';
  priceType: string;
  defaultPrice: number;
}

export interface FinanceSummaryDTO {
  totalRevenue: number;
  pendingInvoicesAmount: number;
  totalExpensesAmount: number;
  netProfit: number;
  recentInvoices: Array<{
    id: string;
    amount: number;
    status: string;
    dueDate: string;
    clientName: string;
  }>;
  recentExpenses: Array<{
    id: string;
    description: string;
    amount: number;
    category: string;
    status: string;
  }>;
}
