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

export interface BookingPOSTerminalProps {
  initialClients?: Client[];
  initialServices?: any[];
  initialSpaces?: any[];
  initialBookings?: any[];
}
