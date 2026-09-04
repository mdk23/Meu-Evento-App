import { NextResponse } from 'next/server';
import { prisma, prismaTransaction } from '@/lib/prisma';
import { BookingStatus, EventStatus, BookingType, Prisma } from '@prisma/client';
import { assertNoBookingConflict, BookingConflictError, isVenueOverlapConstraintError } from '@/lib/booking-conflict';
import { assertCapacityForConfirmation, CapacityExceededError } from '@/lib/capacity';
import { serializeDecimals } from '@/lib/money';
import { deriveEventStatus } from '@/lib/event-progress';
import { resolveLineAmounts } from '@/lib/booking-service-pricing';
import { assertServiceScopeAllowed, ServiceScopeError } from '@/lib/service-scope';
import { seedResourceRequirementsForBookingService } from '@/lib/booking-resource-requirements';
import { planBookingServiceSync, SubmittedLine, ExistingLine } from '@/lib/booking-service-sync';
import { resolveReservationTransition } from '@/lib/inventory-lifecycle';
import { resolveRequiredQuantity } from '@/lib/service-inventory-requirements';

/** Thrown when a full POS edit would remove a service line that still has issued / in-use / returned
 * inventory — the operator must return that stock first. Surfaced as a 409. */
class BookingEditRefusedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BookingEditRefusedError';
  }
}

const GUEST_DRIVEN_QUANTITY_TYPES = ['PER_GUEST', 'PER_UNIT', 'GUESTS_PER_UNIT'];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      status,
      eventDate,
      startAt,
      endAt,
      guestCount,
      notes,
      title,
      clientId,
      clientName,
      clientPhone,
      clientEmail,
      bookingType,
      discount,
      depositDueDate,
      eventStatus,
      eventStatusReason,
      paymentAction,
      isEdit,
      selectedServices,
      capacityOverrideReason,
    } = body;

    // Event status is normally derived from service progress (Phase 10) — a manual override is
    // still allowed, but only with a reason on file, since it gets logged to the audit trail below.
    if (eventStatus && Object.values(EventStatus).includes(eventStatus as EventStatus) && !String(eventStatusReason || '').trim()) {
      return NextResponse.json({ error: 'A reason is required to manually override the event status.' }, { status: 400 });
    }

    const existingBooking = await prisma.booking.findUnique({
      where: { id },
      include: { event: true, client: true, venue: true },
    });

    if (!existingBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // 1. Prepare update data for Booking
    const updateData: Prisma.BookingUpdateInput = {};
    let resolvedStatus: BookingStatus = existingBooking.status;
    if (status && Object.values(BookingStatus).includes(status as BookingStatus)) {
      updateData.status = status;
      resolvedStatus = status as BookingStatus;
    }
    if (eventDate) {
      updateData.eventDate = new Date(eventDate);
    }
    if (startAt) {
      updateData.startAt = new Date(startAt);
    }
    if (endAt) {
      updateData.endAt = new Date(endAt);
    }
    if (guestCount !== undefined) {
      updateData.guestCount = parseInt(guestCount, 10);
    }
    if (capacityOverrideReason !== undefined) {
      updateData.capacityOverrideReason = capacityOverrideReason || null;
    }
    if (notes !== undefined) {
      updateData.notes = notes;
    }
    if (clientId) {
      updateData.client = { connect: { id: clientId } };
    }
    if (bookingType && Object.values(BookingType).includes(bookingType as BookingType)) {
      updateData.bookingType = bookingType;
    }
    if (discount !== undefined) {
      updateData.discount = parseFloat(discount);
    }
    if (depositDueDate) {
      updateData.depositDueDate = new Date(depositDueDate);
    }

    // Handle Payment Actions
    if (paymentAction === 'MARK_DEPOSIT_PAID') {
      updateData.status = BookingStatus.CONFIRMED;
      resolvedStatus = BookingStatus.CONFIRMED;
    } else if (paymentAction === 'MARK_ALL_PAID') {
      updateData.status = BookingStatus.CONFIRMED;
      resolvedStatus = BookingStatus.CONFIRMED;
    } else if (paymentAction === 'COMPLETE_FINANCIAL_CLOSURE') {
      updateData.status = BookingStatus.COMPLETED;
      resolvedStatus = BookingStatus.COMPLETED;
    }

    // Capacity is a soft warning below CONFIRMED — only (re)confirming blocks without an override reason.
    if (resolvedStatus === BookingStatus.CONFIRMED) {
      const resolvedGuestCount = guestCount !== undefined ? parseInt(guestCount, 10) : existingBooking.guestCount;
      const resolvedOverrideReason = capacityOverrideReason !== undefined ? capacityOverrideReason : existingBooking.capacityOverrideReason;
      assertCapacityForConfirmation(resolvedGuestCount, existingBooking.venue.capacity, resolvedOverrideReason);
    }

    // Update booking + client + event + service lines atomically. The service sync below is a
    // diff/merge (Phase 9) — existing BookingService rows and their reservations are kept, only the
    // real delta is created/removed — but it still spans several writes, so a partial failure must
    // not leave the line list half-synced.
    const updatedBooking = await prismaTransaction.$transaction(async (tx) => {
      // Only WAITING_LIST/CANCELLED bookings are allowed to overlap an already-booked window.
      // Re-check whenever the resulting status is a blocking one, whether it's because the
      // time range is changing or because a WAITING_LIST/CANCELLED booking is being promoted
      // back to active on its existing window. Excluding this booking's own id makes the
      // check a safe no-op when nothing relevant changed.
      if (resolvedStatus !== BookingStatus.CANCELLED && resolvedStatus !== BookingStatus.WAITING_LIST) {
        const startAtToCheck = startAt ? new Date(startAt) : existingBooking.startAt;
        const endAtToCheck = endAt ? new Date(endAt) : existingBooking.endAt;
        await assertNoBookingConflict(tx, existingBooking.venueId, startAtToCheck, endAtToCheck, id);
      }

      // Update Client info if provided
      if (existingBooking.clientId && (clientName || clientPhone !== undefined || clientEmail !== undefined)) {
        await tx.client.update({
          where: { id: existingBooking.clientId },
          data: {
            ...(clientName ? { name: clientName } : {}),
            ...(clientPhone !== undefined ? { phone: clientPhone } : {}),
            ...(clientEmail !== undefined ? { email: clientEmail } : {}),
          },
        });
      }

      // Re-fetched with full includes after every sync below settles — this call only needs to
      // persist the field-level changes prepared above.
      await tx.booking.update({ where: { id }, data: updateData });

      // Payment status is never set directly here — it's owned entirely by the payment allocation
      // engine (src/lib/payment-allocation.ts), recalculated from real PaymentTransaction rows via
      // POST/DELETE /api/bookings/[id]/payments and PUT .../payments/schedule. `paymentAction` above
      // only moves the booking's own lifecycle status (RESERVED/CONFIRMED/COMPLETED) — booking
      // lifecycle and payment lifecycle are deliberately separate concepts and must not be conflated.

      // 3. Sync Event details and status
      if (existingBooking.event) {
        const eventUpdateData: Prisma.EventUpdateInput = {};

        if (title) {
          eventUpdateData.name = title;
        }
        if (eventDate) {
          eventUpdateData.date = new Date(eventDate);
        }
        if (guestCount !== undefined) {
          eventUpdateData.guestCount = parseInt(guestCount, 10);
        }

        // Manual status override (audited) — payment actions no longer force Event.status
        // directly; execution status is derived from service progress (Phase 10), recalculated
        // automatically whenever a service's status changes (see events/[id]/services route).
        const isManualStatusOverride = eventStatus && Object.values(EventStatus).includes(eventStatus as EventStatus);
        if (isManualStatusOverride) {
          eventUpdateData.status = eventStatus;
        }

        await tx.event.update({
          where: { id: existingBooking.event.id },
          data: eventUpdateData,
        });

        if (isManualStatusOverride) {
          await tx.eventStatusOverride.create({
            data: {
              eventId: existingBooking.event.id,
              previousStatus: existingBooking.event.status,
              newStatus: eventStatus as EventStatus,
              reason: String(eventStatusReason).trim(),
              overriddenBy: 'Staff',
            },
          });
        }
      }

      // Sync service lines if provided (Full POS Edit). Diff/merge against the existing lines rather
      // than delete-then-recreate — so every already-made reservation, allocation, and lifecycle
      // state on a `BookingServiceResource` survives an edit. Keyed off `bookingId`, so it applies
      // equally to VENUE and EVENT bookings (a VENUE booking's lines are commercial-only, no eventId).
      if (isEdit && selectedServices && Array.isArray(selectedServices)) {
        const tenantId = existingBooking.tenantId || (await tx.tenant.findFirst())?.id;
        const eventId =
          existingBooking.context === 'EVENT' && existingBooking.event ? existingBooking.event.id : null;
        const resolvedGuestCount =
          guestCount !== undefined ? parseInt(guestCount, 10) : existingBooking.guestCount;
        const guestCountChanged =
          guestCount !== undefined && parseInt(guestCount, 10) !== existingBooking.guestCount;

        // 1. Resolve every submitted cart line to a catalog service (creating an ad-hoc Service for a
        //    nameless line), scope-check it, and normalize its amounts. `planLine` is the subset the
        //    pure planner needs; the rest drives the create path below.
        interface PreparedLine {
          planLine: SubmittedLine;
          catalogServiceId: string;
          priceType: 'FIXED' | 'PER_GUEST' | 'PER_HOUR' | 'PER_UNIT';
          name: string;
          notes: string;
        }
        const prepared: PreparedLine[] = [];
        for (const item of selectedServices) {
          let catalogServiceId: string | undefined = item.serviceId;
          let serviceScope: 'VENUE' | 'EVENT' | 'BOTH' | undefined;
          let servicePriceType: 'FIXED' | 'PER_GUEST' | 'PER_HOUR' | 'PER_UNIT' | undefined;

          if (!catalogServiceId && tenantId) {
            const existingService = await tx.service.findFirst({ where: { name: item.name, tenantId } });
            if (existingService) {
              catalogServiceId = existingService.id;
              serviceScope = existingService.context;
              servicePriceType = existingService.priceType;
            } else {
              const newService = await tx.service.create({
                data: {
                  tenantId,
                  name: item.name,
                  category: item.category || 'GERAL',
                  context: existingBooking.context,
                  defaultProviderType: item.providerType === 'EXTERNAL' ? 'EXTERNAL' : 'INTERNAL',
                  priceType: item.priceType || 'FIXED',
                  defaultPrice: item.price || 0,
                },
              });
              catalogServiceId = newService.id;
              serviceScope = newService.context;
              servicePriceType = newService.priceType;
            }
          }
          if (!catalogServiceId) continue;

          if (serviceScope === undefined || servicePriceType === undefined) {
            const catalogService = await tx.service.findUnique({
              where: { id: catalogServiceId },
              select: { context: true, priceType: true },
            });
            serviceScope = catalogService?.context ?? 'BOTH';
            servicePriceType = catalogService?.priceType ?? 'FIXED';
          }
          assertServiceScopeAllowed(serviceScope, existingBooking.context, item.name);

          const { quantity, unitPrice, sellingPrice } = resolveLineAmounts(item);
          const isPackageSourced = !!(item.sourceBookingPackageId || (item.packageApplicationKey && item.sourcePackageId));

          prepared.push({
            catalogServiceId,
            priceType: servicePriceType ?? 'FIXED',
            name: item.name || 'Service',
            notes: item.details || '',
            planLine: {
              bookingServiceId: item.bookingServiceId || undefined,
              serviceId: catalogServiceId,
              source: isPackageSourced ? 'PACKAGE' : 'DIRECT',
              sourceBookingPackageId: item.sourceBookingPackageId || undefined,
              packageApplicationKey: item.packageApplicationKey || undefined,
              sourcePackageId: item.sourcePackageId || undefined,
              sourcePackageName: item.sourcePackageName || undefined,
              quantity,
              unitPrice,
              sellingPrice,
              cost: item.cost || sellingPrice * 0.4,
              providerType: item.providerType === 'EXTERNAL' ? 'EXTERNAL' : 'INTERNAL',
            },
          });
        }

        // 2. Load the current lines (with each resource's status) and diff.
        const existingServices = await tx.bookingService.findMany({
          where: { bookingId: existingBooking.id },
          select: {
            id: true,
            serviceId: true,
            source: true,
            bookingPackageId: true,
            quantity: true,
            unitPrice: true,
            sellingPrice: true,
            cost: true,
            providerType: true,
            resources: { select: { id: true, status: true, quantityType: true } },
          },
        });
        const existingLines: ExistingLine[] = existingServices.map((bs) => ({
          id: bs.id,
          serviceId: bs.serviceId,
          source: bs.source,
          bookingPackageId: bs.bookingPackageId,
          quantity: Number(bs.quantity),
          unitPrice: Number(bs.unitPrice),
          sellingPrice: Number(bs.sellingPrice),
          cost: Number(bs.cost),
          providerType: bs.providerType,
          resources: bs.resources.map((r) => ({ id: r.id, status: r.status, quantityType: r.quantityType })),
        }));

        const plan = planBookingServiceSync(
          existingLines,
          prepared.map((p) => p.planLine),
          { guestCountChanged }
        );

        // 3. Refuse the whole edit up front if any removed line has dispatched stock.
        const refusals = plan.remove.filter((r) => r.plan === 'REFUSE');
        if (refusals.length > 0) {
          const labelById = new Map(
            (
              await tx.bookingService.findMany({
                where: { id: { in: refusals.map((r) => r.id) } },
                select: { id: true, serviceNameSnapshot: true, service: { select: { name: true } } },
              })
            ).map((e) => [e.id, e.serviceNameSnapshot || e.service?.name || 'a service'])
          );
          const label = refusals.map((r) => `"${labelById.get(r.id) ?? 'a service'}"`).join(', ');
          throw new BookingEditRefusedError(
            `Can't remove ${label} — it has inventory issued or in use. Return that stock first, then edit.`
          );
        }

        // 4. Removals: release any still-reserved rows (audited RELEASE transition + ledger row),
        //    then delete the line (its remaining PLANNED/RELEASED resources cascade).
        for (const removal of plan.remove) {
          if (removal.plan === 'RELEASE_THEN_DELETE') {
            const rows = await tx.bookingServiceResource.findMany({
              where: { id: { in: removal.releaseResourceIds } },
              select: { id: true, status: true, inventoryItemId: true, reservedQuantity: true },
            });
            for (const row of rows) {
              const transition = resolveReservationTransition(row.status, 'RELEASE');
              if ('error' in transition) continue;
              await tx.bookingServiceResource.update({ where: { id: row.id }, data: { status: 'RELEASED' } });
              if (row.inventoryItemId) {
                await tx.inventoryTransaction.create({
                  data: {
                    tenantId: existingBooking.tenantId,
                    inventoryItemId: row.inventoryItemId,
                    eventId,
                    bookingServiceId: removal.id,
                    bookingServiceResourceId: row.id,
                    type: 'RELEASE',
                    quantity: row.reservedQuantity,
                    createdBy: 'Staff',
                  },
                });
              }
            }
          }
          await tx.bookingService.delete({ where: { id: removal.id } });
        }

        // 5. Updates: commercial fields only. When a DIRECT line's driver changed, re-resolve its
        //    still-PLANNED, template-seeded, guest/unit-driven resource requirements — reserved/
        //    confirmed/issued rows are left alone (the resource summary's "additional" surfaces the gap).
        for (const upd of plan.update) {
          const preparedForUpd = prepared.find((p) => p.planLine.bookingServiceId === upd.id);
          if (Object.keys(upd.fields).length > 0) {
            await tx.bookingService.update({ where: { id: upd.id }, data: upd.fields });
          }
          if (upd.recalcResourceRequiredQty && preparedForUpd) {
            const rows = await tx.bookingServiceResource.findMany({
              where: { bookingServiceId: upd.id, status: 'PLANNED', sourceRequirementId: { not: null } },
              include: { sourceRequirement: { select: { quantity: true, quantityType: true } } },
            });
            for (const row of rows) {
              if (!row.sourceRequirement) continue;
              if (!GUEST_DRIVEN_QUANTITY_TYPES.includes(row.sourceRequirement.quantityType)) continue;
              await tx.bookingServiceResource.update({
                where: { id: row.id },
                data: {
                  requiredQuantity: resolveRequiredQuantity({
                    quantityType: row.sourceRequirement.quantityType,
                    quantity: row.sourceRequirement.quantity,
                    guestCount: resolvedGuestCount,
                    unitCount: preparedForUpd.planLine.quantity,
                  }),
                },
              });
            }
          }
        }

        // 6. Creates: brand-new lines added during this edit. A line carrying an existing
        //    `sourceBookingPackageId` reuses that frozen BookingPackage; a line with a
        //    `packageApplicationKey` but no snapshot yet is a package applied during this edit —
        //    create one BookingPackage per distinct key.
        const packageAppMap = new Map<string, string>();
        for (const p of prepared) {
          if (!plan.create.includes(p.planLine)) continue;
          const line = p.planLine;

          let bookingPackageId: string | null = null;
          if (line.sourceBookingPackageId) {
            const stillThere = await tx.bookingPackage.findFirst({
              where: { id: line.sourceBookingPackageId, bookingId: existingBooking.id },
              select: { id: true },
            });
            bookingPackageId = stillThere?.id ?? null;
          }
          if (!bookingPackageId && line.packageApplicationKey && line.sourcePackageId) {
            bookingPackageId = packageAppMap.get(line.packageApplicationKey) ?? null;
            if (!bookingPackageId) {
              const sourcePackage = await tx.package.findUnique({
                where: { id: line.sourcePackageId },
                select: { context: true, pricingMode: true, price: true, version: true },
              });
              const bookingPackage = await tx.bookingPackage.create({
                data: {
                  tenantId: existingBooking.tenantId,
                  bookingId: existingBooking.id,
                  packageId: line.sourcePackageId,
                  nameSnapshot: line.sourcePackageName || 'Package',
                  context: sourcePackage?.context ?? existingBooking.context,
                  price: sourcePackage?.pricingMode === 'FIXED' ? sourcePackage.price : null,
                  packageVersion: sourcePackage?.version ?? 1,
                },
              });
              bookingPackageId = bookingPackage.id;
              packageAppMap.set(line.packageApplicationKey, bookingPackageId);
            }
          }

          const createdBookingService = await tx.bookingService.create({
            data: {
              tenantId: existingBooking.tenantId,
              bookingId: existingBooking.id,
              eventId,
              serviceId: p.catalogServiceId,
              context: existingBooking.context,
              priceType: p.priceType,
              serviceNameSnapshot: p.name,
              providerType: line.providerType,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              sellingPrice: line.sellingPrice,
              cost: line.cost,
              status: 'PLANNING',
              source: bookingPackageId ? 'PACKAGE' : 'DIRECT',
              bookingPackageId,
            },
          });

          if (tenantId) {
            await seedResourceRequirementsForBookingService(tx, {
              tenantId,
              bookingId: existingBooking.id,
              bookingServiceId: createdBookingService.id,
              serviceId: p.catalogServiceId,
              guestCount: resolvedGuestCount,
              unitCount: line.quantity,
              startAt: existingBooking.startAt,
              endAt: existingBooking.endAt,
              source: bookingPackageId ? 'PACKAGE' : 'DIRECT',
            });
          }

          if (bookingPackageId && tenantId) {
            await tx.bookingPackageItem.create({
              data: {
                tenantId,
                bookingPackageId,
                serviceId: p.catalogServiceId,
                bookingServiceId: createdBookingService.id,
                serviceName: p.name,
                quantity: line.quantity,
                unitPrice: line.unitPrice,
                totalPrice: line.sellingPrice,
              },
            });
          }
        }

        // Recompute the event's derived status from the resulting line set (no-op for a VENUE booking).
        if (existingBooking.event) {
          const freshServices = await tx.bookingService.findMany({
            where: { eventId: existingBooking.event.id },
            select: { sellingPrice: true, status: true },
          });
          await tx.event.update({
            where: { id: existingBooking.event.id },
            data: { status: deriveEventStatus(freshServices) },
          });
        }
      }

      // Payment schedule edits go exclusively through PUT /api/bookings/[id]/payments/schedule
      // (the dedicated milestone editor) — this route no longer touches ScheduledPayment rows
      // beyond the invoice-status/payment-action handling above.

      // `updatedBooking` above was read before the event status/service-sync logic ran, so its
      // `bookingServices` (and nested `event.bookingServices`) can be stale — re-fetch once everything
      // has settled so the response actually reflects what was just written.
      return tx.booking.findUniqueOrThrow({
        where: { id },
        include: {
          client: true,
          event: {
            include: {
              bookingServices: { include: { service: true, supplier: true } },
            },
          },
          bookingServices: { include: { service: true, supplier: true } },
          scheduledPayments: { where: { plan: { active: true } } },
        },
      });
    }, { timeout: 15000, maxWait: 10000 });

    return NextResponse.json(serializeDecimals({ success: true, booking: updatedBooking }));
  } catch (error: unknown) {
    if (error instanceof BookingConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (isVenueOverlapConstraintError(error)) {
      return NextResponse.json(
        { error: 'This venue was just booked for that time by another request. Choose a different date/time, or submit this booking to the waiting list.' },
        { status: 409 }
      );
    }
    if (error instanceof BookingEditRefusedError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof CapacityExceededError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof ServiceScopeError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Failed to update booking:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.booking.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Failed to delete booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
