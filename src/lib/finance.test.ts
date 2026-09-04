import { describe, it, expect } from 'vitest';
import {
  calculateRevenue,
  calculateInternalCost,
  calculateSupplierCost,
  calculateServiceProfit,
  calculateEventFinancials,
  EventServiceFinancials,
} from './finance';

const service = (overrides: Partial<EventServiceFinancials>): EventServiceFinancials => ({
  sellingPrice: 0,
  cost: 0,
  supplierCost: 0,
  providerType: 'INTERNAL',
  ...overrides,
});

describe('calculateRevenue', () => {
  it('sums selling prices minus the discount', () => {
    const services = [{ sellingPrice: 100 }, { sellingPrice: 50 }];
    expect(calculateRevenue(services, 20).toNumber()).toBe(130);
  });

  it('floors at zero when the discount exceeds the total', () => {
    const services = [{ sellingPrice: 50 }];
    expect(calculateRevenue(services, 200).toNumber()).toBe(0);
  });

  it('treats a null discount as zero', () => {
    const services = [{ sellingPrice: 75 }];
    expect(calculateRevenue(services, null).toNumber()).toBe(75);
  });
});

describe('calculateInternalCost / calculateSupplierCost', () => {
  const services = [
    service({ providerType: 'INTERNAL', cost: 30, supplierCost: 0 }),
    service({ providerType: 'EXTERNAL', cost: 0, supplierCost: 45 }),
    service({ providerType: 'INTERNAL', cost: 10, supplierCost: 0 }),
  ];

  it('sums cost only across INTERNAL lines', () => {
    expect(calculateInternalCost(services).toNumber()).toBe(40);
  });

  it('sums supplierCost only across EXTERNAL lines', () => {
    expect(calculateSupplierCost(services).toNumber()).toBe(45);
  });

  it('returns zero when no line matches the provider type', () => {
    const onlyInternal = [service({ providerType: 'INTERNAL', cost: 10 })];
    expect(calculateSupplierCost(onlyInternal).toNumber()).toBe(0);
  });
});

describe('calculateServiceProfit', () => {
  it('uses cost for an INTERNAL line', () => {
    const es = service({ providerType: 'INTERNAL', sellingPrice: 100, cost: 40, supplierCost: 999 });
    expect(calculateServiceProfit(es).toNumber()).toBe(60);
  });

  it('uses supplierCost for an EXTERNAL line, ignoring cost', () => {
    const es = service({ providerType: 'EXTERNAL', sellingPrice: 100, cost: 999, supplierCost: 70 });
    expect(calculateServiceProfit(es).toNumber()).toBe(30);
  });

  it('can be negative when cost exceeds selling price', () => {
    const es = service({ providerType: 'INTERNAL', sellingPrice: 50, cost: 80 });
    expect(calculateServiceProfit(es).toNumber()).toBe(-30);
  });
});

describe('calculateEventFinancials', () => {
  it('combines revenue, internal cost, supplier cost, and other expenses into one profit figure', () => {
    const services = [
      service({ providerType: 'INTERNAL', sellingPrice: 200, cost: 50 }),
      service({ providerType: 'EXTERNAL', sellingPrice: 300, supplierCost: 120 }),
    ];
    const result = calculateEventFinancials(services, 0, 30);

    expect(result.revenue.toNumber()).toBe(500);
    expect(result.internalCost.toNumber()).toBe(50);
    expect(result.supplierCost.toNumber()).toBe(120);
    expect(result.otherExpenses.toNumber()).toBe(30);
    expect(result.totalCosts.toNumber()).toBe(200); // 50 + 120 + 30
    expect(result.profit.toNumber()).toBe(300); // 500 - 200
  });

  it('applies the discount before computing profit', () => {
    const services = [service({ providerType: 'INTERNAL', sellingPrice: 100, cost: 0 })];
    const result = calculateEventFinancials(services, 25, 0);
    expect(result.revenue.toNumber()).toBe(75);
    expect(result.profit.toNumber()).toBe(75);
  });

  it('lets profit go negative when costs exceed revenue', () => {
    const services = [service({ providerType: 'INTERNAL', sellingPrice: 50, cost: 20 })];
    const result = calculateEventFinancials(services, 0, 100);
    expect(result.profit.toNumber()).toBe(-70); // 50 - (20 + 0 + 100)
  });

  it('treats a null/undefined otherExpenses as zero', () => {
    const services = [service({ providerType: 'INTERNAL', sellingPrice: 50, cost: 20 })];
    const result = calculateEventFinancials(services, 0, null);
    expect(result.otherExpenses.toNumber()).toBe(0);
    expect(result.totalCosts.toNumber()).toBe(20);
  });
});
