import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BookingStatus, BookingType, EventStatus, ExecutionType, ServiceWorkOrderStatus } from '@prisma/client';

export async function POST() {
  try {
    const tenantCount = await prisma.tenant.count();
    if (tenantCount > 0) {
      return NextResponse.json({ message: 'Database already initialized' });
    }

    // 1. Create Tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: 'Royal Events Co.',
        email: 'contact@royalevents.com',
        phone: '+258 84 123 4567',
        logo: '/logo.png',
      },
    });

    // 2. Create Single Event Space
    const space = await prisma.space.create({
      data: {
        tenantId: tenant.id,
        name: 'Royal Events Main Space',
        capacity: 500,
        address: '100 Grand Boulevard, Maputo',
        description: 'Luxury high-ceiling event hall with private garden terrace and state-of-the-art climate control.',
      },
    });

    // 3. Create Clients
    const client1 = await prisma.client.create({
      data: {
        tenantId: tenant.id,
        name: 'John & Mary Smith',
        email: 'john.smith@gmail.com',
        phone: '+258 82 999 8888',
        companyName: 'Smith Family',
        notes: 'VIP Wedding Account',
      },
    });

    const client2 = await prisma.client.create({
      data: {
        tenantId: tenant.id,
        name: 'ACME Corporation',
        email: 'events@acme.com',
        phone: '+258 84 777 6666',
        companyName: 'ACME Corp Ltd.',
        notes: 'Annual Corporate Gala Retainer',
      },
    });

    // 4. Create Suppliers
    const supplierMedia = await prisma.supplier.create({
      data: {
        tenantId: tenant.id,
        name: 'Deluxe Cinema & Photo Studios',
        category: 'Media & Photography',
        email: 'info@deluxecinema.com',
        phone: '+258 84 555 1111',
      },
    });

    const supplierDJ = await prisma.supplier.create({
      data: {
        tenantId: tenant.id,
        name: 'Vibe DJ & Audio Pro',
        category: 'Entertainment',
        email: 'booking@vibedj.com',
        phone: '+258 82 444 2222',
      },
    });

    const supplierSecurity = await prisma.supplier.create({
      data: {
        tenantId: tenant.id,
        name: 'Guardian Tactical Security',
        category: 'Security',
        email: 'dispatch@guardian.co.mz',
        phone: '+258 84 333 0000',
      },
    });

    // 5. Create Staff
    const staff1 = await prisma.staff.create({
      data: {
        tenantId: tenant.id,
        name: 'Marco Rossi',
        role: 'Executive Chef',
        email: 'chef.marco@royalevents.com',
        phone: '+258 84 001 0022',
      },
    });

    const staff2 = await prisma.staff.create({
      data: {
        tenantId: tenant.id,
        name: 'Elena Vance',
        role: 'Decoration Lead',
        email: 'elena@royalevents.com',
        phone: '+258 84 003 0044',
      },
    });

    // 6. Create Inventory Items
    await prisma.inventoryItem.createMany({
      data: [
        { tenantId: tenant.id, name: 'Banquet Chairs', quantity: 500, category: 'Furniture' },
        { tenantId: tenant.id, name: 'Round Tables (8-Seater)', quantity: 60, category: 'Furniture' },
        { tenantId: tenant.id, name: 'Stage Intelligent Lights', quantity: 12, category: 'Audio Visual' },
        { tenantId: tenant.id, name: 'Stainless Chafing Dishes', quantity: 24, category: 'Kitchen' },
      ],
    });

    // 7. Create Services Catalog
    const serviceVenue = await prisma.service.create({
      data: {
        tenantId: tenant.id,
        name: 'Venue Space Rental',
        category: 'Space Rental',
        executionType: ExecutionType.INTERNAL,
        priceType: 'FIXED',
        defaultPrice: 60000,
      },
    });

    const serviceCatering = await prisma.service.create({
      data: {
        tenantId: tenant.id,
        name: 'Gourmet Banquet Catering',
        category: 'Food & Beverage',
        executionType: ExecutionType.INTERNAL,
        priceType: 'PER_GUEST',
        defaultPrice: 450,
        templateSchema: JSON.stringify({
          fields: ['Guest Count', 'Menu Selection', 'Dietary Requirements'],
          tasks: ['Procure Fresh Ingredients', 'Prep Meat & Vegetables', 'Cook Main Courses', 'Set Up Serving Buffet'],
        }),
      },
    });

    const serviceDecoration = await prisma.service.create({
      data: {
        tenantId: tenant.id,
        name: 'Luxury Floral & Theme Decor',
        category: 'Decoration',
        executionType: ExecutionType.INTERNAL,
        priceType: 'FIXED',
        defaultPrice: 35000,
        templateSchema: JSON.stringify({
          fields: ['Theme Name', 'Color Palette', 'Special Floral Arches'],
          tasks: ['Assemble Floral Centerpieces', 'Drape Backdrop Linens', 'Set Table Settings', 'Tear-Down & Pack'],
        }),
      },
    });

    const servicePhoto = await prisma.service.create({
      data: {
        tenantId: tenant.id,
        name: '4K Cinema & Photo Package',
        category: 'Media',
        executionType: ExecutionType.EXTERNAL,
        priceType: 'FIXED',
        defaultPrice: 25000,
      },
    });

    const serviceDJ = await prisma.service.create({
      data: {
        tenantId: tenant.id,
        name: 'Live DJ & Concert Lighting',
        category: 'Entertainment',
        executionType: ExecutionType.EXTERNAL,
        priceType: 'FIXED',
        defaultPrice: 15000,
      },
    });

    // 8. Create Sample Booking 1 & Event
    const eventDate1 = new Date();
    eventDate1.setDate(eventDate1.getDate() + 4); // 4 days from now

    const booking1 = await prisma.booking.create({
      data: {
        tenantId: tenant.id,
        clientId: client1.id,
        bookingType: BookingType.SPACE_AND_SERVICES,
        eventDate: eventDate1,
        guestCount: 250,
        status: BookingStatus.CONFIRMED,
        notes: 'Smith Grand Wedding & Dinner',
      },
    });

    const event1 = await prisma.event.create({
      data: {
        bookingId: booking1.id,
        name: 'John & Mary Wedding Celebration',
        date: eventDate1,
        guestCount: 250,
        status: EventStatus.PLANNING,
        notes: 'Formal dress code. White & Gold theme.',
      },
    });

    // Add EventServices for Event 1
    await prisma.eventService.create({
      data: {
        eventId: event1.id,
        serviceId: serviceVenue.id,
        providerType: ExecutionType.INTERNAL,
        sellingPrice: 60000,
        cost: 5000,
        status: ServiceWorkOrderStatus.READY,
        notes: 'Main Hall Reserved 14:00 to 02:00',
      },
    });

    await prisma.eventService.create({
      data: {
        eventId: event1.id,
        serviceId: serviceCatering.id,
        providerType: ExecutionType.INTERNAL,
        sellingPrice: 112500, // 250 * 450
        cost: 45000,
        status: ServiceWorkOrderStatus.PREPARING,
        customFields: JSON.stringify({
          guestCount: 250,
          menu: { main: 'Grilled Salmon & Beef Tenderloin', sides: 'Truffle Mashed Potatoes', drinks: 'Open Bar Premium' },
          dietary: '12 Vegetarians, 4 Gluten-Free',
        }),
        tasks: JSON.stringify([
          { id: '1', title: 'Procure ingredients from market', completed: true },
          { id: '2', title: 'Prepare appetizer trays', completed: true },
          { id: '3', title: 'Cook main course meat & fish', completed: false },
          { id: '4', title: 'Set up chafing dishes on main buffet', completed: false },
        ]),
        assignedStaff: JSON.stringify([staff1.name]),
        reservedInventory: JSON.stringify(['24 Stainless Chafing Dishes']),
      },
    });

    await prisma.eventService.create({
      data: {
        eventId: event1.id,
        serviceId: serviceDecoration.id,
        providerType: ExecutionType.INTERNAL,
        sellingPrice: 35000,
        cost: 12000,
        status: ServiceWorkOrderStatus.PLANNING,
        customFields: JSON.stringify({
          theme: 'Royalty & Gold Elegant',
          colors: 'White, Gold & Emerald Green',
        }),
        tasks: JSON.stringify([
          { id: '1', title: 'Source fresh white roses', completed: true },
          { id: '2', title: 'Assemble entrance floral arch', completed: false },
          { id: '3', title: 'Position gold charger plates', completed: false },
        ]),
        assignedStaff: JSON.stringify([staff2.name]),
        reservedInventory: JSON.stringify(['30 Round Tables', '250 Banquet Chairs']),
      },
    });

    await prisma.eventService.create({
      data: {
        eventId: event1.id,
        serviceId: servicePhoto.id,
        providerType: ExecutionType.EXTERNAL,
        sellingPrice: 25000,
        cost: 18000,
        status: ServiceWorkOrderStatus.CONFIRMED,
        supplierId: supplierMedia.id,
        supplierCost: 18000,
        supplierStatus: ServiceWorkOrderStatus.CONFIRMED,
        paymentStatus: 'PAID',
      },
    });

    // Create Invoice & Expense for Booking 1
    const totalSelling1 = 60000 + 112500 + 35000 + 25000; // 232,500 MT
    await prisma.invoice.create({
      data: {
        tenantId: tenant.id,
        bookingId: booking1.id,
        amount: totalSelling1,
        status: 'PAID',
        dueDate: eventDate1,
        paidAt: new Date(),
      },
    });

    await prisma.expense.create({
      data: {
        tenantId: tenant.id,
        eventId: event1.id,
        supplierId: supplierMedia.id,
        description: 'Deluxe Cinema Photo Package Supplier Fee',
        amount: 18000,
        category: 'Media Supplier',
        status: 'PAID',
      },
    });

    // 9. Create Sample Booking 2 & Event
    const eventDate2 = new Date();
    eventDate2.setDate(eventDate2.getDate() + 12); // 12 days from now

    const booking2 = await prisma.booking.create({
      data: {
        tenantId: tenant.id,
        clientId: client2.id,
        bookingType: BookingType.SPACE_AND_SERVICES,
        eventDate: eventDate2,
        guestCount: 150,
        status: BookingStatus.CONFIRMED,
        notes: 'ACME Annual Tech & Product Summit',
      },
    });

    const event2 = await prisma.event.create({
      data: {
        bookingId: booking2.id,
        name: 'ACME Tech Leadership Summit',
        date: eventDate2,
        guestCount: 150,
        status: EventStatus.READY,
      },
    });

    await prisma.eventService.create({
      data: {
        eventId: event2.id,
        serviceId: serviceVenue.id,
        providerType: ExecutionType.INTERNAL,
        sellingPrice: 60000,
        cost: 5000,
        status: ServiceWorkOrderStatus.READY,
      },
    });

    await prisma.eventService.create({
      data: {
        eventId: event2.id,
        serviceId: serviceDJ.id,
        providerType: ExecutionType.EXTERNAL,
        sellingPrice: 15000,
        cost: 10000,
        status: ServiceWorkOrderStatus.CONFIRMED,
        supplierId: supplierDJ.id,
        supplierCost: 10000,
        supplierStatus: ServiceWorkOrderStatus.CONFIRMED,
        paymentStatus: 'UNPAID',
      },
    });

    await prisma.invoice.create({
      data: {
        tenantId: tenant.id,
        bookingId: booking2.id,
        amount: 75000,
        status: 'PENDING',
        dueDate: eventDate2,
      },
    });

    return NextResponse.json({ success: true, message: 'New architecture database seed successfully applied' });
  } catch (error: unknown) {
    console.error('Seed execution error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Seed failed' }, { status: 500 });
  }
}
