export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  notes?: string;
  company?: string;
  stage?: 'lead' | 'contact' | 'visit' | 'proposal' | 'contract'; // CRM sales stage
}

export interface ServicePackage {
  id: string;
  name: string;
  price: number;
  description: string;
  includes: string[];
}

export interface AddOnService {
  id: string;
  name: string;
  price: number;
  type: 'per_guest' | 'flat_rate';
  description: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  isCompleted: boolean;
}

export interface Guest {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: 'pending' | 'attending' | 'declined';
  menuPreference: 'standard' | 'vegetarian' | 'vegan' | 'gluten-free';
  plusOnes: number;
  tableId?: string; // Assigned table
  seatNumber?: number; // Assigned seat index (0-based)
  allergyNotes?: string; // Dietary/allergy observation notes
  messageText?: string; // Congratulatory message for the message wall
  messageTimestamp?: string; // Message wall timestamp
  checkedIn?: boolean; // Guest arrived at the venue (Portaria check-in)
}

export interface TableLayout {
  id: string;
  name: string; // e.g. "Table 1"
  shape: 'circle' | 'rectangle';
  maxSeats: number;
  posX: number; // percentage or relative pixel coordinate
  posY: number;
}

export interface Booking {
  id: string;
  clientId: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  type: 'wedding' | 'birthday' | 'corporate' | 'anniversary' | 'other';
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  guestCountExpected: number;
  packageId: string;
  selectedAddOns: string[]; // AddOnService IDs
  checklist: ChecklistItem[];
  guests: Guest[];
  tables: TableLayout[];
  contractAmount: number;
  paidAmount: number;
  notes?: string;
  timeline?: TimelineItem[];
  staffAssignments?: StaffAssignment[];
  blueprintElements?: BlueprintElement[];
  kanbanTasks?: KanbanTask[];
  menuPlanner?: {
    appetizerId?: string;
    entreeId?: string;
    dessertId?: string;
  };
  customDiscountPercent?: number;
  paymentInstallments?: PaymentInstallment[];
}

export interface PaymentInstallment {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid';
}

export interface BlueprintElement {
  id: string;
  type: 'dance_floor' | 'stage' | 'bar' | 'dj_booth' | 'buffet' | 'entrance';
  name: string;
  posX: number;
  posY: number;
}

export interface KanbanTask {
  id: string;
  label: string;
  status: 'todo' | 'inprogress' | 'done';
}

export interface InventoryItem {
  id: string;
  name: string;
  totalQty: number;
  category: 'furniture' | 'glassware' | 'decor' | 'av';
}

export interface MenuItem {
  id: string;
  name: string;
  category: 'appetizer' | 'entree' | 'dessert' | 'beverage';
  dietaryInfo: string[]; // e.g. ['vegan', 'gluten-free']
}

export interface TimelineItem {
  id: string;
  time: string; // HH:MM
  title: string;
  description?: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: 'coordinator' | 'bartender' | 'security' | 'cleaning' | 'av_tech';
  hourlyRate: number;
  phone?: string;
}

export interface StaffAssignment {
  staffId: string;
  hoursAssigned: number;
}

export interface Transaction {
  id: string;
  bookingId?: string; // Optional links to bookings
  description: string;
  amount: number;
  type: 'income' | 'expense';
  date: string; // YYYY-MM-DD
  category: 'deposit' | 'installment' | 'final_payment' | 'catering' | 'decor' | 'staff' | 'utilities' | 'marketing' | 'maintenance' | 'other';
}
