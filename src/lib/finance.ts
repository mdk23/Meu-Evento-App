import { Prisma } from '@prisma/client';
import { sumMoney, subtractMoney, subtractMoneyFloor0, toMoney } from './money';

type MoneyLike = Prisma.Decimal | number | null | undefined;

export interface EventServiceFinancials {
  sellingPrice: MoneyLike;
  cost: MoneyLike;
  supplierCost: MoneyLike;
  providerType: string; // 'INTERNAL' | 'EXTERNAL'
}

/**
 * Single source of truth for revenue (Phase 9): contracted service value minus the booking's
 * discount. Every place that previously computed "revenue" from `PaymentTransaction` (cash
 * received) or `ScheduledPayment` (billed) sums should use this instead — those are still
 * useful as separate "cash collected" figures, just not as Revenue.
 */
export function calculateRevenue(eventServices: Pick<EventServiceFinancials, 'sellingPrice'>[], discount: MoneyLike): Prisma.Decimal {
  return subtractMoneyFloor0(sumMoney(eventServices.map((es) => es.sellingPrice)), discount ?? 0);
}

/** Cost of internally-fulfilled services — tracked directly on `EventService.cost`; never generates an Expense row. */
export function calculateInternalCost(eventServices: EventServiceFinancials[]): Prisma.Decimal {
  return sumMoney(eventServices.filter((es) => es.providerType === 'INTERNAL').map((es) => es.cost));
}

/** Cost of externally-fulfilled services — kept in sync with an auto-created Expense per service (see events/[id]/services route). */
export function calculateSupplierCost(eventServices: EventServiceFinancials[]): Prisma.Decimal {
  return sumMoney(eventServices.filter((es) => es.providerType === 'EXTERNAL').map((es) => es.supplierCost));
}

/** Per-line-item profit: selling price minus whichever cost actually applies to that provider type. Can be negative. */
export function calculateServiceProfit(es: EventServiceFinancials): Prisma.Decimal {
  const cost = es.providerType === 'EXTERNAL' ? es.supplierCost : es.cost;
  return subtractMoney(es.sellingPrice, cost);
}

export interface EventFinancials {
  revenue: Prisma.Decimal;
  internalCost: Prisma.Decimal;
  supplierCost: Prisma.Decimal;
  otherExpenses: Prisma.Decimal;
  totalCosts: Prisma.Decimal;
  profit: Prisma.Decimal;
}

/**
 * Full profit breakdown for one event (or tenant-wide, if given every event's services/expenses
 * at once). `otherExpenses` must be the sum of Expense rows NOT linked to a specific EventService
 * (`eventServiceId` null) — supplier costs are already counted via `supplierCost` directly from
 * EventService, so including service-linked Expense rows here too would double-count them.
 */
export function calculateEventFinancials(
  eventServices: EventServiceFinancials[],
  discount: MoneyLike,
  otherExpenses: MoneyLike
): EventFinancials {
  const revenue = calculateRevenue(eventServices, discount);
  const internalCost = calculateInternalCost(eventServices);
  const supplierCost = calculateSupplierCost(eventServices);
  const otherExpensesMoney = toMoney(otherExpenses ?? 0);
  const totalCosts = internalCost.plus(supplierCost).plus(otherExpensesMoney);
  const profit = subtractMoney(revenue, totalCosts);
  return { revenue, internalCost, supplierCost, otherExpenses: otherExpensesMoney, totalCosts, profit };
}
