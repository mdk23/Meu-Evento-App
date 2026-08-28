import { VenueItem, ServiceItem } from './types';

// There's one Space per tenant (see the `Space` model) — this fallback only renders if that
// real record somehow fails to load, so it deliberately doesn't invent named sub-venues.
export const defaultVenues: VenueItem[] = [
  {
    id: 'sp-1',
    name: 'Main Venue',
    capacity: 200,
    price: 50000,
    description: 'Exclusive use of the venue for your event.',
  },
];

export const defaultCatalogServices: ServiceItem[] = [
  {
    id: 'srv-1',
    name: 'Venue Rental',
    category: 'VENUE',
    providerType: 'INTERNAL',
    providerName: 'Internal Venue',
    priceType: 'FIXED',
    price: 50000,
    description: 'Exclusive use of the venue, including climate control and acoustic treatment.',
  },
  {
    id: 'srv-4',
    name: 'LED & Architectural Scenic Lighting',
    category: 'VENUE',
    providerType: 'INTERNAL',
    providerName: 'Internal Venue',
    priceType: 'FIXED',
    price: 18000,
    description: 'Lighting design with colored LED strip lights and spotlights for pillars and facades.',
  },
  {
    id: 'srv-5',
    name: '150 kVA Silent Power Generator',
    category: 'VENUE',
    providerType: 'EXTERNAL',
    providerName: 'VOLTA GENERATORS INC.',
    priceType: 'FIXED',
    price: 24000,
    description: 'Generator set with fuel and dedicated technician during 8h event.',
  },
  {
    id: 'srv-6',
    name: 'Royal Gold Banquet Buffet (Complete)',
    category: 'EVENT',
    providerType: 'INTERNAL',
    providerName: 'Internal Venue',
    priceType: 'PER_GUEST',
    price: 1200,
    description: 'Passed appetizers, 3-course plated dinner, gourmet desserts, and coffee.',
  },
  {
    id: 'srv-7',
    name: 'Premium Cocktail & Drinks Open Bar',
    category: 'EVENT',
    providerType: 'INTERNAL',
    providerName: 'Internal Venue',
    priceType: 'PER_GUEST',
    price: 300,
    description: 'Performative bartenders, imported spirits, caipirinhas, and gin & tonic.',
  },
  {
    id: 'srv-8',
    name: 'Noble Floral Decoration & Scenography',
    category: 'EVENT',
    providerType: 'EXTERNAL',
    providerName: 'FLORA DECOR LTD',
    priceType: 'FIXED',
    price: 65000,
    description: 'Arrangements with noble seasonal flowers, scenic cake table, and lounges.',
  },
];
