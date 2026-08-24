import { NextResponse } from 'next/server';
import { prisma, prismaTransaction } from '@/lib/prisma';
import { BookingStatus, BookingType, BookingContext, EventStatus, ExecutionType } from '@prisma/client';
import { assertNoBookingConflict, BookingConflictError } from '@/lib/booking-conflict';
import { assertCapacityForConfirmation, CapacityExceededError } from '@/lib/capacity';
import { serializeDecimals } from '@/lib/money';
import { validatePaymentPlan, MilestoneDraft } from '@/lib/payment-plan';
import { syncScheduledPaymentAllocations } from '@/lib/payment-allocation';
import { resolveLineAmounts } from '@/lib/booking-service-pricing';
import { assertServiceScopeAllowed, ServiceScopeError } from '@/lib/service-scope';
import { seedResourceRequirementsForBookingService } from '@/lib/booking-resource-requirements';

export async function GET() {
  try {
    const bookings = await prisma.booking.findMany({
      orderBy: { eventDate: 'asc' },
      include: {
        client: true,
        event: {
          include: {
            bookingServices: { include: { service: true, supplier: true } },
          },
        },
        scheduledPayments: { where: { plan: { active: true } } },
      },
    });

    const clients = await prisma.client.findMany({ orderBy: { name: 'asc' } });
    const services = await prisma.service.findMany({ orderBy: { name: 'asc' } });
    const spaces = await prisma.space.findMany({ orderBy: { name: 'asc' } });

    return NextResponse.json(serializeDecimals({ bookings, clients, services, spaces }));
  } catch (error: unknown) {
    console.error('Failed to fetch bookings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      clientId,
      newClient,
      bookingType,
      kind,
      eventDate,
      startAt,
      endAt,
      guestCount,
      notes,
      title,
      selectedServices,
      status: requestedStatus,
      totalAmount,
      discount,
      depositDueDate,
      milestones,
      capacityOverrideReason,
    } = body;

    let tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: 'Royal Events Co.',
          email: 'contact@royalevents.co',
        },
      });
    }

    let targetClientId = clientId;

    // Create new client on the fly if needed
    if ((!targetClientId || targetClientId === 'NEW') && newClient?.name) {
      const createdClient = await prisma.client.create({
        data: {
          tenantId: tenant.id,
          name: newClient.name,
          phone: newClient.phone || '',
          email: newClient.email || '',
          notes: 'Cadastrado via Ponto de Venda (POS)',
        },
      });
      targetClientId = createdClient.id;
    }

    if (!targetClientId || !eventDate) {
      return NextResponse.json({ error: 'Cliente e Data do Evento são obrigatórios' }, { status: 400 });
    }

    const client = await prisma.client.findUnique({ where: { id: targetClientId } });
    if (!client) {
      return NextResponse.json({ error: 'Cliente selecionado não foi encontrado' }, { status: 404 });
    }

    const space = await prisma.space.findUnique({ where: { tenantId: tenant.id } });
    if (!space) {
      return NextResponse.json({ error: 'No space configured for this venue' }, { status: 400 });
    }

    const parsedDate = new Date(eventDate);
    const parsedGuestCount = parseInt(guestCount || '0', 10);
    const finalStatus =
      requestedStatus === 'CONFIRMED' ? BookingStatus.CONFIRMED
      : requestedStatus === 'WAITING_LIST' ? BookingStatus.WAITING_LIST
      : BookingStatus.RESERVED;

    // Fall back to the whole calendar day if the client didn't submit an explicit time range.
    const dayStart = new Date(parsedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(parsedDate);
    dayEnd.setHours(23, 59, 59, 999);
    const parsedStartAt = startAt ? new Date(startAt) : dayStart;
    const parsedEndAt = endAt ? new Date(endAt) : dayEnd;

    // Capacity is a soft warning below CONFIRMED — only confirming actually blocks without an override reason.
    if (finalStatus === BookingStatus.CONFIRMED) {
      assertCapacityForConfirmation(parsedGuestCount, space.capacity, capacityOverrideReason);
    }

    // Defaults to EVENT so every existing caller (which never sends `kind`) keeps today's exact
    // behavior — a linked Event is created automatically. SPACE bookings are opt-in.
    const resolvedKind: BookingContext = kind === 'SPACE' ? BookingContext.SPACE : BookingContext.EVENT;

    const discountVal = parseFloat(discount || '0');
    const totalAmountVal = parseFloat(totalAmount || '0');
    const milestoneList: MilestoneDraft[] = Array.isArray(milestones) ? milestones : [];

    // Default deposit due date to 14 days/2 weeks from now if not specified
    const parsedDepositDueDate = depositDueDate
      ? new Date(depositDueDate)
      : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    if (finalStatus !== BookingStatus.WAITING_LIST) {
      const validation = validatePaymentPlan({ milestones: milestoneList, totalAmount: totalAmountVal, eventDate: parsedDate });
      if (!validation.valid) {
        return NextResponse.json({ error: validation.errors[0] || 'Invalid payment plan.' }, { status: 400 });
      }
    }

    const depositAmount = milestoneList[0]?.amount || 0;
    const formattedNotes = [
      `Desconto POS: R$ ${discountVal}`,
      `Payment Plan: ${milestoneList.length} milestone(s), first payment ${depositAmount.toLocaleString('pt-MZ')} MT`,
      notes ? `Observações: ${notes}` : '',
    ].filter(Boolean).join('\n');

    // Create the Booking, its linked Event, attached services, and payment schedule atomically —
    // a partial failure here must not leave a Booking/Event without its services or payments.
    const { booking, event } = await prismaTransaction.$transaction(async (tx) => {
      // Only WAITING_LIST bookings are allowed to overlap an already-booked window —
      // any other status must have the space free for its whole [startAt, endAt) window.
      if (finalStatus !== BookingStatus.WAITING_LIST) {
        await assertNoBookingConflict(tx, space.id, parsedStartAt, parsedEndAt);
      }

      // 1. Create Booking
      const booking = await tx.booking.create({
        data: {
          tenantId: tenant.id,
          clientId: targetClientId,
          spaceId: space.id,
          bookingType: bookingType || BookingType.SPACE_AND_SERVICES,
          context: resolvedKind,
          eventDate: parsedDate,
          startAt: parsedStartAt,
          endAt: parsedEndAt,
          guestCount: parsedGuestCount,
          status: finalStatus,
          notes: formattedNotes,
          discount: discountVal,
          depositDueDate: parsedDepositDueDate,
          capacityOverrideReason: capacityOverrideReason || null,
        },
      });

      // 2. A SPACE booking is commercial-only — no Event exists for it, by design (that's how a
      // booking can exist with service lines and no operational/event workspace). Only EVENT
      // bookings automatically get a linked Execution Event.
      const event = resolvedKind === BookingContext.EVENT
        ? await tx.event.create({
            data: {
              bookingId: booking.id,
              name: title || `${client.name} Event`,
              date: parsedDate,
              guestCount: parsedGuestCount,
              status: EventStatus.PLANNING,
              notes: formattedNotes,
            },
          })
        : null;

      // 3. Attach selected services / items to the Event
      if (Array.isArray(selectedServices) && selectedServices.length > 0) {
        // One BookingPackage snapshot per distinct "Add Package" click represented in the cart —
        // created lazily, the first time a line tagged with that key is encountered below.
        const packageAppMap = new Map<string, string>();

        for (const item of selectedServices) {
          let catalogServiceId = item.serviceId;
          let serviceScope: 'SPACE' | 'EVENT' | 'BOTH';
          let servicePriceType: 'FIXED' | 'PER_GUEST' | 'PER_HOUR' | 'PER_UNIT';

          if (!catalogServiceId) {
            const existingService = await tx.service.findFirst({
              where: { name: item.name, tenantId: tenant.id },
            });

            if (existingService) {
              catalogServiceId = existingService.id;
              serviceScope = existingService.context;
              servicePriceType = existingService.priceType;
            } else {
              // Ad-hoc service born inside this booking rather than the Services page — "created in
              // Space, belongs to Space": it's stamped with the booking's own workspace instead of
              // the schema default BOTH, since there was no explicit scope choice to honor.
              const newService = await tx.service.create({
                data: {
                  tenantId: tenant.id,
                  name: item.name,
                  category: item.category || 'GERAL',
                  context: resolvedKind,
                  defaultProviderType: item.providerType === 'EXTERNAL' ? ExecutionType.EXTERNAL : ExecutionType.INTERNAL,
                  priceType: item.priceType || 'FIXED',
                  defaultPrice: item.price || 0,
                },
              });
              catalogServiceId = newService.id;
              serviceScope = newService.context;
              servicePriceType = newService.priceType;
            }
          } else {
            const catalogService = await tx.service.findUnique({ where: { id: catalogServiceId }, select: { context: true, priceType: true } });
            serviceScope = catalogService?.context ?? 'BOTH';
            servicePriceType = catalogService?.priceType ?? 'FIXED';
          }

          assertServiceScopeAllowed(serviceScope, resolvedKind, item.name);

          const { quantity: itemQuantity, unitPrice: itemUnitPrice, sellingPrice: itemSellingPrice } = resolveLineAmounts(item);

          let bookingPackageId: string | null = null;
          if (item.packageApplicationKey && item.sourcePackageId) {
            bookingPackageId = packageAppMap.get(item.packageApplicationKey) ?? null;
            if (!bookingPackageId) {
              const sourcePackage = await tx.package.findUnique({
                where: { id: item.sourcePackageId },
                select: { context: true, pricingMode: true, price: true },
              });
              const bookingPackage = await tx.bookingPackage.create({
                data: {
                  bookingId: booking.id,
                  packageId: item.sourcePackageId,
                  nameSnapshot: item.sourcePackageName || 'Package',
                  context: sourcePackage?.context ?? resolvedKind,
                  price: sourcePackage?.pricingMode === 'FIXED' ? sourcePackage.price : null,
                },
              });
              bookingPackageId = bookingPackage.id;
              packageAppMap.set(item.packageApplicationKey, bookingPackageId);
            }
          }

          const createdBookingService = await tx.bookingService.create({
            data: {
              bookingId: booking.id,
              eventId: event?.id ?? null,
              serviceId: catalogServiceId,
              context: resolvedKind,
              priceType: servicePriceType,
              serviceNameSnapshot: item.name || null,
              providerType: item.providerType === 'EXTERNAL' ? ExecutionType.EXTERNAL : ExecutionType.INTERNAL,
              quantity: itemQuantity,
              unitPrice: itemUnitPrice,
              sellingPrice: itemSellingPrice,
              cost: item.cost || (itemSellingPrice * 0.4),
              status: 'PLANNING',
              notes: item.details || '',
              source: bookingPackageId ? 'PACKAGE' : 'DIRECT',
              bookingPackageId,
            },
          });

          await seedResourceRequirementsForBookingService(tx, {
            tenantId: tenant.id,
            bookingId: booking.id,
            bookingServiceId: createdBookingService.id,
            serviceId: catalogServiceId,
            guestCount: parsedGuestCount,
            unitCount: itemQuantity,
          });

          if (bookingPackageId) {
            await tx.bookingPackageItem.create({
              data: {
                bookingPackageId,
                serviceId: catalogServiceId,
                bookingServiceId: createdBookingService.id,
                serviceName: item.name || 'Service',
                quantity: itemQuantity,
                unitPrice: itemUnitPrice,
                totalPrice: itemSellingPrice,
              },
            });
          }
        }
      }

      // 4. Create the initial Payment Plan (version 1) and its Scheduled Payments from the
      // submitted milestone list. The first milestone is the deposit — recording a matching
      // PaymentTransaction when the booking is confirmed with a paid deposit, matching previous
      // behavior. `paidAmount`/`status` are never set directly here — `syncScheduledPaymentAllocations`
      // below is the single source of truth for that cache, and also persists the matching
      // `PaymentAllocation` rows for this initial deposit.
      if (milestoneList.length > 0) {
        const plan = await tx.paymentPlan.create({
          data: { bookingId: booking.id, version: 1, active: true },
        });

        for (let i = 0; i < milestoneList.length; i++) {
          const m = milestoneList[i];
          const isDeposit = i === 0;
          const depositIsPaid = isDeposit && finalStatus === BookingStatus.CONFIRMED;

          const scheduledPayment = await tx.scheduledPayment.create({
            data: {
              tenantId: tenant.id,
              bookingId: booking.id,
              planId: plan.id,
              name: m.name,
              amount: m.amount,
              dueDate: new Date(m.dueDate),
            },
          });

          if (depositIsPaid) {
            await tx.paymentTransaction.create({
              data: {
                tenantId: tenant.id,
                bookingId: booking.id,
                scheduledPaymentId: scheduledPayment.id,
                amount: m.amount,
                method: 'CASH', // Defaulting for POS, can be configured later
                recordedBy: 'POS Terminal',
                notes: 'Deposit paid at booking',
              }
            });
          }
        }

        await syncScheduledPaymentAllocations(tx, booking.id);
      }

      return { booking, event };
    }, { timeout: 15000, maxWait: 10000 });

    return NextResponse.json(serializeDecimals({ success: true, booking, event }), { status: 201 });
  } catch (error: unknown) {
    if (error instanceof BookingConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof CapacityExceededError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof ServiceScopeError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Failed to create booking in POS:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}
