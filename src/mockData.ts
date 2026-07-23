import { Client, ServicePackage, AddOnService, Booking, Transaction, StaffMember, MenuItem, InventoryItem } from './types';

export const mockPackages: ServicePackage[] = [
  {
    id: 'pkg-platinum',
    name: 'Platinum Gala Wedding',
    price: 12000,
    description: 'Our all-inclusive ultimate luxury experience. Ideal for large weddings and high-end galas.',
    includes: [
      'Full venue access (12 hours)',
      'Luxury bridal suite & groom lounge',
      'Premium ambient lighting',
      'Professional sound system with on-site technician',
      'Post-event deep cleaning',
      'Event coordinator coordinating vendor arrivals',
      'Table linens, luxury dinnerware, and crystal glassware'
    ]
  },
  {
    id: 'pkg-gold',
    name: 'Golden Celebration',
    price: 7500,
    description: 'Perfect balance of services and value. Excellent for medium-sized receptions and corporate events.',
    includes: [
      'Venue access (8 hours)',
      'Bridal suite access',
      'Standard ambient lighting',
      'High-quality sound system',
      'Post-event standard cleaning',
      'Standard linens and tableware'
    ]
  },
  {
    id: 'pkg-silver',
    name: 'Silver Rental',
    price: 4500,
    description: 'Venue rental with essential support services. Great for DIY planners and micro-weddings.',
    includes: [
      'Venue access (6 hours)',
      'Basic sound system',
      'Post-event cleaning assistance',
      'Standard rectangular tables and chairs'
    ]
  }
];

export const mockAddOns: AddOnService[] = [
  {
    id: 'addon-catering',
    name: 'Gourmet Buffet Catering',
    price: 55,
    type: 'per_guest',
    description: 'A 3-course gourmet buffet (appetizer, main dish, dessert) with soft drinks and water.'
  },
  {
    id: 'addon-openbar',
    name: 'Premium Open Bar',
    price: 35,
    type: 'per_guest',
    description: 'Unlimited top-shelf liquors, beers, wines, and signature cocktails for up to 5 hours.'
  },
  {
    id: 'addon-dj',
    name: 'DJ & Visual FX Show',
    price: 1500,
    type: 'flat_rate',
    description: 'Award-winning party DJ, personalized playlist, custom dance floor wash, laser show, and fog machine.'
  },
  {
    id: 'addon-security',
    name: 'Professional Security Guards',
    price: 500,
    type: 'flat_rate',
    description: 'Two certified, uniformed security officers present for the duration of the event.'
  },
  {
    id: 'addon-decor',
    name: 'Luxury Floral & Arch Decor',
    price: 2200,
    type: 'flat_rate',
    description: 'Customized floral arrangements for all guest tables, entrance, and a magnificent ceremonial arch.'
  }
];

export const mockClients: Client[] = [
  {
    id: 'c-1',
    name: 'Sarah Jenkins & John Smith',
    email: 'sarah.jenkins@example.com',
    phone: '+1 (555) 234-5678',
    notes: 'Bride & Groom. Sarah is very particular about lighting and lavender accent colors.',
    stage: 'contract'
  },
  {
    id: 'c-2',
    name: 'Robert Miller',
    email: 'robert.m@techcorp.com',
    phone: '+1 (555) 987-6543',
    company: 'TechCorp Solutions Inc.',
    notes: 'HR Director organizing the annual corporate gala.',
    stage: 'proposal'
  },
  {
    id: 'c-3',
    name: 'Elena Rostova',
    email: 'elena.rostova@example.com',
    phone: '+1 (555) 345-6789',
    notes: 'Planning her daughter Anastasia\'s Sweet 16 celebration.',
    stage: 'visit'
  }
];

export const mockBookings: Booking[] = [
  {
    id: 'b-1',
    clientId: 'c-1',
    title: 'Sarah & John\'s Royal Wedding',
    date: '2026-10-10',
    startTime: '16:00',
    endTime: '23:30',
    type: 'wedding',
    status: 'confirmed',
    guestCountExpected: 120,
    packageId: 'pkg-platinum',
    selectedAddOns: ['addon-catering', 'addon-openbar', 'addon-dj', 'addon-decor'],
    checklist: [
      { id: 'chk-1', label: 'Finalize buffet menu selections', isCompleted: true },
      { id: 'chk-2', label: 'Confirm florist arrival timeline', isCompleted: false },
      { id: 'chk-3', label: 'Complete seating chart layout', isCompleted: true },
      { id: 'chk-4', label: 'Approve DJ playlist & entrance songs', isCompleted: false },
      { id: 'chk-5', label: 'Send venue access details to caterer', isCompleted: true },
      { id: 'chk-6', label: 'Collect final balance payment', isCompleted: false }
    ],
    guests: [
      { id: 'g-1', name: 'Albert Jenkins', email: 'albert.j@example.com', status: 'attending', menuPreference: 'standard', plusOnes: 1, tableId: 't-1', seatNumber: 0 },
      { id: 'g-2', name: 'Martha Jenkins', email: 'martha.j@example.com', status: 'attending', menuPreference: 'standard', plusOnes: 0, tableId: 't-1', seatNumber: 1 },
      { id: 'g-3', name: 'Arthur Smith', email: 'arthur.s@example.com', status: 'attending', menuPreference: 'standard', plusOnes: 0, tableId: 't-1', seatNumber: 2 },
      { id: 'g-4', name: 'Evelyn Smith', email: 'evelyn.s@example.com', status: 'attending', menuPreference: 'standard', plusOnes: 0, tableId: 't-1', seatNumber: 3 },
      { id: 'g-5', name: 'David Jenkins Jr.', email: 'dave.j@example.com', status: 'attending', menuPreference: 'vegetarian', plusOnes: 1, tableId: 't-2', seatNumber: 0 },
      { id: 'g-6', name: 'Lily Carter', email: 'lily.c@example.com', status: 'attending', menuPreference: 'vegan', plusOnes: 0, tableId: 't-2', seatNumber: 1 },
      { id: 'g-7', name: 'Marcus Aurelius', email: 'marcus.a@example.com', status: 'pending', menuPreference: 'standard', plusOnes: 0 },
      { id: 'g-8', name: 'Juliet Capulet', email: 'juliet.c@example.com', status: 'attending', menuPreference: 'gluten-free', plusOnes: 0, tableId: 't-2', seatNumber: 2 },
      { id: 'g-9', name: 'Romeo Montague', email: 'romeo.m@example.com', status: 'declined', menuPreference: 'standard', plusOnes: 0 }
    ],
    tables: [
      { id: 't-1', name: 'VIP Table 1', shape: 'circle', maxSeats: 6, posX: 30, posY: 30 },
      { id: 't-2', name: 'Friends Table 2', shape: 'circle', maxSeats: 8, posX: 50, posY: 60 },
      { id: 't-3', name: 'Groom Family Table 3', shape: 'rectangle', maxSeats: 10, posX: 70, posY: 30 }
    ],
    contractAmount: 26500, // 12000 (pkg) + 6600 (catering 120*55) + 4200 (bar 120*35) + 1500 (dj) + 2200 (decor) = 26500
    paidAmount: 15000,
    notes: 'Color theme is royal purple and cream white. Need custom microphone setup for speeches at 18:30.',
    timeline: [
      { id: 'tm-1', time: '16:00', title: 'Guest Arrival', description: 'Champagne welcome at the garden lounge' },
      { id: 'tm-2', time: '16:30', title: 'Ceremony Begins', description: 'Violin quartet, bride walks down the aisle' },
      { id: 'tm-3', time: '17:30', title: 'Cocktail Hour', description: 'Open bar is active, pass-around gourmet appetizers' },
      { id: 'tm-4', time: '19:00', title: 'Grand Dinner Buffet', description: 'Grand entry by DJ, buffet lines open' }
    ],
    staffAssignments: [
      { staffId: 's-1', hoursAssigned: 8 },
      { staffId: 's-2', hoursAssigned: 6 },
      { staffId: 's-4', hoursAssigned: 8 }
    ],
    blueprintElements: [
      { id: 'bp-1', type: 'dance_floor', name: 'Grand Dance Floor', posX: 50, posY: 45 },
      { id: 'bp-2', type: 'stage', name: 'AV Stage', posX: 50, posY: 12 },
      { id: 'bp-3', type: 'bar', name: 'Lakeside Cocktail Bar', posX: 15, posY: 80 },
      { id: 'bp-4', type: 'dj_booth', name: 'DJ Soundcheck Booth', posX: 80, posY: 12 },
      { id: 'bp-5', type: 'entrance', name: 'Grand Arch Entrance', posX: 50, posY: 90 }
    ],
    kanbanTasks: [
      { id: 'k-1', label: 'Confirm florist arrival timeline', status: 'todo' },
      { id: 'k-2', label: 'Send menu choices to catering', status: 'inprogress' },
      { id: 'k-3', label: 'Soundcheck with DJ', status: 'todo' },
      { id: 'k-4', label: 'Verify vendor insurance details', status: 'done' }
    ],
    menuPlanner: {
      appetizerId: 'menu-app-1',
      entreeId: 'menu-ent-1',
      dessertId: 'menu-des-1'
    },
    customDiscountPercent: 5,
    paymentInstallments: [
      { id: 'pi-1', name: 'Booking Deposit (Paid)', amount: 2500, dueDate: '2026-03-01', status: 'paid' },
      { id: 'pi-2', name: 'Mid-term Milestone Payment', amount: 3500, dueDate: '2026-06-01', status: 'paid' },
      { id: 'pi-3', name: 'Final Remaining Balance', amount: 3375, dueDate: '2026-09-01', status: 'pending' }
    ]
  },
  {
    id: 'b-2',
    clientId: 'c-2',
    title: 'TechCorp Winter Gala',
    date: '2026-12-18',
    startTime: '18:00',
    endTime: '23:00',
    type: 'corporate',
    status: 'confirmed',
    guestCountExpected: 150,
    packageId: 'pkg-gold',
    selectedAddOns: ['addon-catering', 'addon-dj', 'addon-security'],
    checklist: [
      { id: 'chk-10', label: 'Verify podium & wireless mics', isCompleted: false },
      { id: 'chk-11', label: 'Approve logo slide projection', isCompleted: true },
      { id: 'chk-12', label: 'Confirm security guard schedule', isCompleted: true }
    ],
    guests: [
      { id: 'g-20', name: 'Robert Miller', email: 'robert.m@techcorp.com', status: 'attending', menuPreference: 'standard', plusOnes: 0 },
      { id: 'g-21', name: 'Jane Doe', email: 'jane.d@techcorp.com', status: 'attending', menuPreference: 'vegetarian', plusOnes: 0 },
      { id: 'g-22', name: 'CEO Alice Vance', email: 'alice.v@techcorp.com', status: 'attending', menuPreference: 'standard', plusOnes: 1 }
    ],
    tables: [
      { id: 't-10', name: 'Executive Table', shape: 'rectangle', maxSeats: 8, posX: 50, posY: 20 }
    ],
    contractAmount: 17750, // 7500 (pkg) + 8250 (catering 150*55) + 1500 (dj) + 500 (security) = 17750
    paidAmount: 17750, // Fully paid
    notes: 'Corporate event. Will bring their own banners.',
    timeline: [
      { id: 'tm-10', time: '18:00', title: 'Reception & Networking', description: 'Background jazz, photo booths active' },
      { id: 'tm-11', time: '19:00', title: 'CEO Keynote Speeches', description: 'Keynote address by CEO Alice Vance' }
    ],
    staffAssignments: [
      { staffId: 's-1', hoursAssigned: 6 },
      { staffId: 's-4', hoursAssigned: 6 }
    ],
    blueprintElements: [
      { id: 'bp-10', type: 'stage', name: 'Executive Presentation Stage', posX: 50, posY: 10 },
      { id: 'bp-11', type: 'buffet', name: 'Hot Buffet Station', posX: 85, posY: 50 }
    ],
    kanbanTasks: [
      { id: 'k-10', label: 'Microphone AV testing', status: 'done' },
      { id: 'k-11', label: 'Verify slides projection', status: 'inprogress' }
    ],
    menuPlanner: {
      appetizerId: 'menu-app-2',
      entreeId: 'menu-ent-3',
      dessertId: 'menu-des-2'
    },
    customDiscountPercent: 0,
    paymentInstallments: [
      { id: 'pi-10', name: 'Initial Setup Deposit', amount: 5000, dueDate: '2026-06-01', status: 'paid' },
      { id: 'pi-11', name: 'Final Balance due', amount: 12750, dueDate: '2026-11-01', status: 'pending' }
    ]
  },
  {
    id: 'b-3',
    clientId: 'c-3',
    title: 'Anastasia\'s Sweet 16',
    date: '2026-07-28',
    startTime: '17:00',
    endTime: '22:00',
    type: 'anniversary',
    status: 'pending',
    guestCountExpected: 80,
    packageId: 'pkg-silver',
    selectedAddOns: ['addon-catering', 'addon-dj'],
    checklist: [
      { id: 'chk-20', label: 'Draft contract signature', isCompleted: false },
      { id: 'chk-21', label: 'Catering deposit payment', isCompleted: false }
    ],
    guests: [],
    tables: [],
    contractAmount: 10400, // 4500 (pkg) + 4400 (catering 80*55) + 1500 (dj) = 10400
    paidAmount: 2000,
    notes: 'Teenager birthday. Mocktails only.',
    timeline: [
      { id: 'tm-20', time: '17:00', title: 'Arrival & Photobooth', description: 'Teen guests arrive, red carpet photos' }
    ],
    staffAssignments: [
      { staffId: 's-1', hoursAssigned: 5 }
    ],
    blueprintElements: [],
    kanbanTasks: [
      { id: 'k-20', label: 'Draft contract signature files', status: 'todo' }
    ],
    menuPlanner: {
      appetizerId: 'menu-app-1',
      entreeId: 'menu-ent-2',
      dessertId: 'menu-des-1'
    },
    customDiscountPercent: 10,
    paymentInstallments: [
      { id: 'pi-20', name: 'Booking Security Hold', amount: 2000, dueDate: '2026-07-01', status: 'pending' }
    ]
  }
];

export const mockTransactions: Transaction[] = [
  {
    id: 't-1',
    bookingId: 'b-1',
    description: 'Initial Deposit - Wedding Sarah & John',
    amount: 5000,
    type: 'income',
    date: '2026-05-15',
    category: 'deposit'
  },
  {
    id: 't-2',
    bookingId: 'b-1',
    description: 'Second Installment - Wedding Sarah & John',
    amount: 10000,
    type: 'income',
    date: '2026-07-01',
    category: 'installment'
  },
  {
    id: 't-3',
    bookingId: 'b-2',
    description: 'Full Pre-Payment - TechCorp Winter Gala',
    amount: 17750,
    type: 'income',
    date: '2026-06-20',
    category: 'final_payment'
  },
  {
    id: 't-4',
    bookingId: 'b-3',
    description: 'Reservation Fee - Anastasia\'s Sweet 16',
    amount: 2000,
    type: 'income',
    date: '2026-07-10',
    category: 'deposit'
  },
  {
    id: 't-5',
    description: 'Pest Control Services (Annual)',
    amount: 350,
    type: 'expense',
    date: '2026-07-02',
    category: 'maintenance'
  },
  {
    id: 't-6',
    description: 'Monthly Electric Bill',
    amount: 620,
    type: 'expense',
    date: '2026-07-05',
    category: 'utilities'
  },
  {
    id: 't-7',
    description: 'Google Local Ads Campaign',
    amount: 450,
    type: 'expense',
    date: '2026-07-10',
    category: 'marketing'
  },
  {
    id: 't-8',
    description: 'Lawn Mowing & Landscaping',
    amount: 180,
    type: 'expense',
    date: '2026-07-12',
    category: 'maintenance'
  }
];

export const mockStaffMembers: StaffMember[] = [
  { id: 's-1', name: 'Alice Walker', role: 'coordinator', hourlyRate: 35, phone: '+1 (555) 901-2345' },
  { id: 's-2', name: 'David Jones', role: 'bartender', hourlyRate: 20, phone: '+1 (555) 123-4567' },
  { id: 's-3', name: 'Maria Rodriguez', role: 'bartender', hourlyRate: 20, phone: '+1 (555) 234-5678' },
  { id: 's-4', name: 'John Carter', role: 'security', hourlyRate: 25, phone: '+1 (555) 345-6789' },
  { id: 's-5', name: 'Sylvia Brooks', role: 'cleaning', hourlyRate: 15, phone: '+1 (555) 456-7890' },
  { id: 's-6', name: 'Kevin Lee', role: 'av_tech', hourlyRate: 30, phone: '+1 (555) 567-8901' }
];

export const mockMenuItems: MenuItem[] = [
  { id: 'menu-app-1', name: 'Garlic Butter Jumbo Shrimp', category: 'appetizer', dietaryInfo: ['gluten-free'] },
  { id: 'menu-app-2', name: 'Stuffed Truffle Mushroom Caps', category: 'appetizer', dietaryInfo: ['vegetarian', 'vegan'] },
  { id: 'menu-ent-1', name: 'Grilled Aged Filet Mignon', category: 'entree', dietaryInfo: ['gluten-free'] },
  { id: 'menu-ent-2', name: 'Roasted Salmon En Croute', category: 'entree', dietaryInfo: [] },
  { id: 'menu-ent-3', name: 'Wild Mushroom Cream Risotto', category: 'entree', dietaryInfo: ['vegetarian', 'gluten-free'] },
  { id: 'menu-des-1', name: 'Warm Chocolate Lava Cake', category: 'dessert', dietaryInfo: ['vegetarian'] },
  { id: 'menu-des-2', name: 'Coconut Mango Sorbet Medley', category: 'dessert', dietaryInfo: ['vegetarian', 'vegan', 'gluten-free'] }
];

export const mockInventoryItems: InventoryItem[] = [
  { id: 'inv-1', name: 'Premium Chiavari Chairs', totalQty: 180, category: 'furniture' },
  { id: 'inv-2', name: 'Circular Banquet Tables (60")', totalQty: 22, category: 'furniture' },
  { id: 'inv-3', name: 'Crystal Wine Glasses', totalQty: 220, category: 'glassware' },
  { id: 'inv-4', name: 'AV Wireless Handheld Mics', totalQty: 4, category: 'av' },
  { id: 'inv-5', name: 'Ceremonial Birchwood Arch', totalQty: 1, category: 'decor' }
];


