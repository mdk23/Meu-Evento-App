import { Prisma, WorkOrderStatus, EventStatus } from '@prisma/client';
import { sumMoney } from './money';

type MoneyLike = Prisma.Decimal | number | null | undefined;

export interface ServiceProgressInput {
  sellingPrice: MoneyLike;
  status: string; // WorkOrderStatus
}

/**
 * Money-weighted completion ratio (0..1) across every non-cancelled ("active") service —
 * a service worth 200k moves the needle far more than one worth 30k. Returns 0 when there's
 * no active service value to divide by, rather than NaN.
 */
export function calculateEventProgress(services: ServiceProgressInput[]): number {
  const active = services.filter((s) => s.status !== WorkOrderStatus.CANCELLED);
  const totalActiveValue = sumMoney(active.map((s) => s.sellingPrice));
  if (totalActiveValue.isZero()) return 0;
  const completedValue = sumMoney(active.filter((s) => s.status === WorkOrderStatus.COMPLETED).map((s) => s.sellingPrice));
  return completedValue.dividedBy(totalActiveValue).toNumber();
}

/**
 * Derives the event's execution status from its services' own status ladder — not manually set
 * (Phase 10: "Do not manually control progress"). The event only advances once every active
 * service has cleared that rung: stays PLANNING until every service has left PLANNING, jumps to
 * IN_PROGRESS as soon as any service starts or finishes, reaches COMPLETED only once every
 * active service is COMPLETED.
 */
export function deriveEventStatus(services: ServiceProgressInput[]): EventStatus {
  const active = services.filter((s) => s.status !== WorkOrderStatus.CANCELLED);
  if (active.length === 0) return EventStatus.PLANNING;
  if (active.every((s) => s.status === WorkOrderStatus.COMPLETED)) return EventStatus.COMPLETED;
  if (active.some((s) => s.status === WorkOrderStatus.IN_PROGRESS || s.status === WorkOrderStatus.COMPLETED)) return EventStatus.IN_PROGRESS;
  if (active.every((s) => s.status === WorkOrderStatus.READY || s.status === WorkOrderStatus.COMPLETED)) return EventStatus.READY;
  return EventStatus.PLANNING;
}
