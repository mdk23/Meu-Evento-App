import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BookingStatus, BookingType, EventStatus, ExecutionType, WorkOrderStatus, SupplierStatus, TaskStatus } from '@prisma/client';
import { fullDaySpan } from '@/lib/resource-conflict';

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

    // 2. Create Single Event Venue
    const venue = await prisma.venue.create({
      data: {
        tenantId: tenant.id,
        name: 'Royal Events Main Venue',
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

    await prisma.supplier.create({
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

    // 6. Create Inventory Categories + Items
    const [categoryFurniture, categoryAudioVisual, categoryKitchen] = await Promise.all([
      prisma.inventoryCategory.create({ data: { tenantId: tenant.id, name: 'Furniture' } }),
      prisma.inventoryCategory.create({ data: { tenantId: tenant.id, name: 'Audio Visual' } }),
      prisma.inventoryCategory.create({ data: { tenantId: tenant.id, name: 'Kitchen' } }),
    ]);
    const itemChairs = await prisma.inventoryItem.create({
      data: { tenantId: tenant.id, name: 'Banquet Chairs', totalQuantity: 500, categoryId: categoryFurniture.id },
    });
    const itemTables = await prisma.inventoryItem.create({
      data: { tenantId: tenant.id, name: 'Round Tables (8-Seater)', totalQuantity: 60, categoryId: categoryFurniture.id },
    });
    await prisma.inventoryItem.create({
      data: { tenantId: tenant.id, name: 'Stage Intelligent Lights', totalQuantity: 12, categoryId: categoryAudioVisual.id },
    });
    const itemChafingDishes = await prisma.inventoryItem.create({
      data: { tenantId: tenant.id, name: 'Stainless Chafing Dishes', totalQuantity: 24, categoryId: categoryKitchen.id },
    });

    // 7. Create Services Catalog
    const serviceVenue = await prisma.service.create({
      data: {
        tenantId: tenant.id,
        name: 'Venue Rental',
        category: 'Venue Rental',
        defaultProviderType: ExecutionType.INTERNAL,
        priceType: 'FIXED',
        defaultPrice: 60000,
      },
    });

    const serviceCatering = await prisma.service.create({
      data: {
        tenantId: tenant.id,
        name: 'Gourmet Banquet Catering',
        category: 'Food & Beverage',
        defaultProviderType: ExecutionType.INTERNAL,
        priceType: 'PER_GUEST',
        defaultPrice: 450,
      },
    });

    const serviceDecoration = await prisma.service.create({
      data: {
        tenantId: tenant.id,
        name: 'Luxury Floral & Theme Decor',
        category: 'Decoration',
        defaultProviderType: ExecutionType.INTERNAL,
        priceType: 'FIXED',
        defaultPrice: 35000,
      },
    });

    const servicePhoto = await prisma.service.create({
      data: {
        tenantId: tenant.id,
        name: '4K Cinema & Photo Package',
        category: 'Media',
        defaultProviderType: ExecutionType.EXTERNAL,
        priceType: 'FIXED',
        defaultPrice: 25000,
      },
    });

    const serviceDJ = await prisma.service.create({
      data: {
        tenantId: tenant.id,
        name: 'Live DJ & Concert Lighting',
        category: 'Entertainment',
        defaultProviderType: ExecutionType.EXTERNAL,
        priceType: 'FIXED',
        defaultPrice: 15000,
      },
    });

    // 8. Create Sample Booking 1 & Event
    const eventDate1 = new Date();
    eventDate1.setDate(eventDate1.getDate() + 4); // 4 days from now

    const booking1Span = fullDaySpan(eventDate1);
    const booking1 = await prisma.booking.create({
      data: {
        tenantId: tenant.id,
        clientId: client1.id,
        venueId: venue.id,
        bookingType: BookingType.VENUE_AND_SERVICES,
        eventDate: eventDate1,
        startAt: booking1Span.startAt,
        endAt: booking1Span.endAt,
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
    await prisma.bookingService.create({
      data: {
        bookingId: booking1.id,
        eventId: event1.id,
        serviceId: serviceVenue.id,
        context: 'EVENT',
        priceType: 'FIXED',
        providerType: ExecutionType.INTERNAL,
        sellingPrice: 60000,
        cost: 5000,
        status: WorkOrderStatus.READY,
        notes: 'Main Hall Reserved 14:00 to 02:00',
      },
    });

    const eventServiceCatering = await prisma.bookingService.create({
      data: {
        bookingId: booking1.id,
        eventId: event1.id,
        serviceId: serviceCatering.id,
        context: 'EVENT',
        priceType: 'PER_GUEST',
        providerType: ExecutionType.INTERNAL,
        sellingPrice: 112500, // 250 * 450
        cost: 45000,
        status: WorkOrderStatus.IN_PROGRESS,
        notes: 'Menu: Grilled Salmon & Beef Tenderloin, Truffle Mashed Potatoes, Open Bar Premium. Dietary: 12 Vegetarians, 4 Gluten-Free.',
      },
    });

    const cateringSpan = fullDaySpan(eventDate1);
    await prisma.bookingServiceTask.createMany({
      data: [
        { bookingServiceId: eventServiceCatering.id, title: 'Procure ingredients from market', status: TaskStatus.DONE },
        { bookingServiceId: eventServiceCatering.id, title: 'Prepare appetizer trays', status: TaskStatus.DONE },
        { bookingServiceId: eventServiceCatering.id, title: 'Cook main course meat & fish', status: TaskStatus.PENDING },
        { bookingServiceId: eventServiceCatering.id, title: 'Set up chafing dishes on main buffet', status: TaskStatus.PENDING },
      ],
    });
    await prisma.bookingServiceStaff.create({
      data: {
        bookingServiceId: eventServiceCatering.id,
        staffId: staff1.id,
        staffNameSnapshot: staff1.name,
        role: staff1.role,
        startAt: cateringSpan.startAt,
        endAt: cateringSpan.endAt,
      },
    });
    await prisma.bookingServiceResource.create({
      data: {
        tenantId: tenant.id,
        bookingId: booking1.id,
        bookingServiceId: eventServiceCatering.id,
        inventoryItemId: itemChafingDishes.id,
        itemNameSnapshot: itemChafingDishes.name,
        requiredQuantity: 24,
        reservedQuantity: 24,
        status: 'RESERVED',
        startAt: cateringSpan.startAt,
        endAt: cateringSpan.endAt,
      },
    });

    const eventServiceDecoration = await prisma.bookingService.create({
      data: {
        bookingId: booking1.id,
        eventId: event1.id,
        serviceId: serviceDecoration.id,
        context: 'EVENT',
        priceType: 'FIXED',
        providerType: ExecutionType.INTERNAL,
        sellingPrice: 35000,
        cost: 12000,
        status: WorkOrderStatus.PLANNING,
        notes: 'Theme: Royalty & Gold Elegant. Colors: White, Gold & Emerald Green.',
      },
    });

    const decorationSpan = fullDaySpan(eventDate1);
    await prisma.bookingServiceTask.createMany({
      data: [
        { bookingServiceId: eventServiceDecoration.id, title: 'Source fresh white roses', status: TaskStatus.DONE },
        { bookingServiceId: eventServiceDecoration.id, title: 'Assemble entrance floral arch', status: TaskStatus.PENDING },
        { bookingServiceId: eventServiceDecoration.id, title: 'Position gold charger plates', status: TaskStatus.PENDING },
      ],
    });
    await prisma.bookingServiceStaff.create({
      data: {
        bookingServiceId: eventServiceDecoration.id,
        staffId: staff2.id,
        staffNameSnapshot: staff2.name,
        role: staff2.role,
        startAt: decorationSpan.startAt,
        endAt: decorationSpan.endAt,
      },
    });
    await prisma.bookingServiceResource.createMany({
      data: [
        {
          tenantId: tenant.id,
          bookingId: booking1.id,
          bookingServiceId: eventServiceDecoration.id,
          inventoryItemId: itemTables.id,
          itemNameSnapshot: itemTables.name,
          requiredQuantity: 30,
          reservedQuantity: 30,
          status: 'RESERVED',
          startAt: decorationSpan.startAt,
          endAt: decorationSpan.endAt,
        },
        {
          tenantId: tenant.id,
          bookingId: booking1.id,
          bookingServiceId: eventServiceDecoration.id,
          inventoryItemId: itemChairs.id,
          itemNameSnapshot: itemChairs.name,
          requiredQuantity: 250,
          reservedQuantity: 250,
          status: 'RESERVED',
          startAt: decorationSpan.startAt,
          endAt: decorationSpan.endAt,
        },
      ],
    });

    await prisma.bookingService.create({
      data: {
        bookingId: booking1.id,
        eventId: event1.id,
        serviceId: servicePhoto.id,
        context: 'EVENT',
        priceType: 'FIXED',
        providerType: ExecutionType.EXTERNAL,
        sellingPrice: 25000,
        cost: 18000,
        status: WorkOrderStatus.READY,
        supplierId: supplierMedia.id,
        supplierCost: 18000,
        supplierStatus: SupplierStatus.CONFIRMED,
        paymentStatus: 'PAID',
      },
    });

    // Create Invoice & Expense for Booking 1
    const totalSelling1 = 60000 + 112500 + 35000 + 25000; // 232,500 MT
    const plan1 = await prisma.paymentPlan.create({
      data: { bookingId: booking1.id, version: 1, active: true },
    });
    await prisma.scheduledPayment.create({
      data: {
        tenantId: tenant.id,
        bookingId: booking1.id,
        planId: plan1.id,
        name: 'Full Payment',
        amount: totalSelling1,
        paidAmount: totalSelling1,
        status: 'PAID',
        dueDate: eventDate1,
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

    const booking2Span = fullDaySpan(eventDate2);
    const booking2 = await prisma.booking.create({
      data: {
        tenantId: tenant.id,
        clientId: client2.id,
        venueId: venue.id,
        bookingType: BookingType.VENUE_AND_SERVICES,
        eventDate: eventDate2,
        startAt: booking2Span.startAt,
        endAt: booking2Span.endAt,
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

    await prisma.bookingService.create({
      data: {
        bookingId: booking2.id,
        eventId: event2.id,
        serviceId: serviceVenue.id,
        context: 'EVENT',
        priceType: 'FIXED',
        providerType: ExecutionType.INTERNAL,
        sellingPrice: 60000,
        cost: 5000,
        status: WorkOrderStatus.READY,
      },
    });

    await prisma.bookingService.create({
      data: {
        bookingId: booking2.id,
        eventId: event2.id,
        serviceId: serviceDJ.id,
        context: 'EVENT',
        priceType: 'FIXED',
        providerType: ExecutionType.EXTERNAL,
        sellingPrice: 15000,
        cost: 10000,
        status: WorkOrderStatus.READY,
        supplierId: supplierDJ.id,
        supplierCost: 10000,
        supplierStatus: SupplierStatus.CONFIRMED,
        paymentStatus: 'UNPAID',
      },
    });

    const plan2 = await prisma.paymentPlan.create({
      data: { bookingId: booking2.id, version: 1, active: true },
    });
    await prisma.scheduledPayment.create({
      data: {
        tenantId: tenant.id,
        bookingId: booking2.id,
        planId: plan2.id,
        name: 'Initial Deposit',
        amount: 75000,
        paidAmount: 0,
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
