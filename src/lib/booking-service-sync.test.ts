import { describe, it, expect } from 'vitest';
import { planBookingServiceSync, ExistingLine, SubmittedLine } from './booking-service-sync';

const existingLine = (over: Partial<ExistingLine>): ExistingLine => ({
  id: 'bs-1',
  serviceId: 'svc-chair',
  source: 'DIRECT',
  bookingPackageId: null,
  quantity: 100,
  unitPrice: 150,
  sellingPrice: 15000,
  cost: 6000,
  providerType: 'INTERNAL',
  resources: [{ id: 'r-1', status: 'PLANNED', quantityType: 'PER_GUEST' }],
  ...over,
});

const submittedFrom = (e: ExistingLine, over: Partial<SubmittedLine> = {}): SubmittedLine => ({
  bookingServiceId: e.id,
  serviceId: e.serviceId,
  source: e.source,
  quantity: e.quantity,
  unitPrice: e.unitPrice,
  sellingPrice: e.sellingPrice,
  cost: e.cost,
  providerType: e.providerType,
  ...over,
});

describe('planBookingServiceSync', () => {
  it('an unchanged cart produces no creates, no removes, and an empty-fields update', () => {
    const e = existingLine({});
    const plan = planBookingServiceSync([e], [submittedFrom(e)], { guestCountChanged: false });
    expect(plan.create).toEqual([]);
    expect(plan.remove).toEqual([]);
    expect(plan.update).toHaveLength(1);
    expect(plan.update[0].fields).toEqual({});
    expect(plan.update[0].recalcResourceRequiredQty).toBe(false);
  });

  it('a submitted line with no bookingServiceId is a create', () => {
    const e = existingLine({});
    const newLine: SubmittedLine = {
      serviceId: 'svc-extra-chair', source: 'DIRECT', quantity: 20, unitPrice: 150, sellingPrice: 3000, cost: 1200, providerType: 'INTERNAL',
    };
    const plan = planBookingServiceSync([e], [submittedFrom(e), newLine], { guestCountChanged: false });
    expect(plan.create).toEqual([newLine]);
    expect(plan.remove).toEqual([]);
  });

  it('a removed line whose resources are all PLANNED → DELETE', () => {
    const e = existingLine({ resources: [{ id: 'r-1', status: 'PLANNED', quantityType: 'PER_GUEST' }] });
    const plan = planBookingServiceSync([e], [], { guestCountChanged: false });
    expect(plan.remove).toEqual([{ id: 'bs-1', plan: 'DELETE', releaseResourceIds: [], blockingResourceIds: [] }]);
  });

  it('a removed line with a RESERVED (or CONFIRMED) resource → RELEASE_THEN_DELETE', () => {
    const e = existingLine({
      resources: [
        { id: 'r-1', status: 'RESERVED', quantityType: 'PER_GUEST' },
        { id: 'r-2', status: 'CONFIRMED', quantityType: 'FIXED' },
        { id: 'r-3', status: 'PLANNED', quantityType: 'FIXED' },
      ],
    });
    const plan = planBookingServiceSync([e], [], { guestCountChanged: false });
    expect(plan.remove[0]).toMatchObject({ id: 'bs-1', plan: 'RELEASE_THEN_DELETE', releaseResourceIds: ['r-1', 'r-2'] });
  });

  it('a removed line with an ISSUED / IN_USE / RETURNED resource → REFUSE', () => {
    for (const status of ['ISSUED', 'IN_USE', 'RETURNED']) {
      const e = existingLine({ resources: [{ id: 'r-1', status, quantityType: 'PER_GUEST' }] });
      const plan = planBookingServiceSync([e], [], { guestCountChanged: false });
      expect(plan.remove[0]).toMatchObject({ id: 'bs-1', plan: 'REFUSE', blockingResourceIds: ['r-1'] });
    }
  });

  it('a DIRECT line whose quantity changed flags recalcResourceRequiredQty', () => {
    const e = existingLine({ quantity: 100 });
    const plan = planBookingServiceSync([e], [submittedFrom(e, { quantity: 120, sellingPrice: 18000 })], { guestCountChanged: false });
    expect(plan.update[0].fields).toMatchObject({ quantity: 120, sellingPrice: 18000 });
    expect(plan.update[0].recalcResourceRequiredQty).toBe(true);
  });

  it('a PACKAGE line never flags recalc, even when the guest count changed', () => {
    const e = existingLine({ source: 'PACKAGE', bookingPackageId: 'bp-1' });
    const plan = planBookingServiceSync([e], [submittedFrom(e, { source: 'PACKAGE' })], { guestCountChanged: true });
    expect(plan.update[0].recalcResourceRequiredQty).toBe(false);
  });

  it('a commercially-unchanged DIRECT line still flags recalc when the guest count changed', () => {
    const e = existingLine({});
    const plan = planBookingServiceSync([e], [submittedFrom(e)], { guestCountChanged: true });
    expect(plan.update[0].fields).toEqual({});
    expect(plan.update[0].recalcResourceRequiredQty).toBe(true);
  });

  it('never fuzzy-matches: an unrecognized bookingServiceId becomes a create, and the real existing line is removed', () => {
    const e = existingLine({ id: 'bs-real' });
    const stale = submittedFrom(e, { bookingServiceId: 'bs-stale' });
    const plan = planBookingServiceSync([e], [stale], { guestCountChanged: false });
    expect(plan.create).toEqual([stale]);
    expect(plan.remove[0]).toMatchObject({ id: 'bs-real', plan: 'DELETE' });
  });
});
