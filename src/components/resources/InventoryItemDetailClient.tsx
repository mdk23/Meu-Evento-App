'use client';

import Link from 'next/link';
import { Prisma } from '@prisma/client';
import {
  ArrowLeft,
  Package,
  Boxes,
  CheckCircle2,
  Wrench,
  AlertTriangle,
  Undo2,
} from 'lucide-react';
import { DecimalToNumber } from '@/lib/money';
import Topbar from '@/components/aurelia/Topbar';

type ItemDetail = DecimalToNumber<Prisma.InventoryItemGetPayload<{
  include: {
    category: true;
    bookingResources: {
      include: {
        bookingService: {
          select: {
            service: { select: { name: true } };
            serviceNameSnapshot: true;
            event: { select: { name: true } };
          };
        };
      };
    };
    transactions: {
      include: {
        event: { select: { name: true } };
        bookingService: { select: { service: { select: { name: true } }; serviceNameSnapshot: true } };
      };
    };
  };
}>>;

interface StockSummary {
  totalQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  allocatedQuantity: number;
  issuedQuantity: number;
  usedQuantity: number;
  returnedQuantity: number;
  damagedQuantity: number;
  lostQuantity: number;
  missingQuantity: number;
}

interface InventoryItemDetailClientProps {
  item: ItemDetail;
  stockSummary: StockSummary;
}

const STATUS_BADGE_CLASS: Record<string, string> = {
  PLANNED: 'b-mute',
  RESERVED: 'b-warn',
  IN_USE: 'b-info',
  RETURNED: 'b-mute',
  RELEASED: 'b-mute',
};

const TRANSACTION_LABEL: Record<string, string> = {
  PURCHASE: 'Purchase',
  ADJUSTMENT_IN: 'Adjustment +',
  ADJUSTMENT_OUT: 'Adjustment -',
  RESERVE: 'Reserved',
  RELEASE: 'Released',
  ALLOCATE: 'Allocated',
  USE: 'Used',
  RETURN: 'Returned',
  DAMAGE: 'Damaged',
  LOSS: 'Lost',
};

function serviceLabel(row: { event: { name: string } | null; bookingService: { service: { name: string } | null; serviceNameSnapshot: string | null } | null }): string {
  const service = row.bookingService?.service?.name || row.bookingService?.serviceNameSnapshot || 'Service';
  return row.event ? `${service} — ${row.event.name}` : service;
}

function resourceServiceLabel(row: {
  bookingService: { service: { name: string } | null; serviceNameSnapshot: string | null; event: { name: string } | null } | null;
}): string {
  const service = row.bookingService?.service?.name || row.bookingService?.serviceNameSnapshot || 'Service';
  return row.bookingService?.event ? `${service} — ${row.bookingService.event.name}` : service;
}

export default function InventoryItemDetailClient({ item, stockSummary }: InventoryItemDetailClientProps) {
  const variantDetails = [item.color, item.material, item.model, item.size, item.shape].filter(Boolean);

  return (
    <main className="aurelia-shell flex-1 flex flex-col h-screen overflow-hidden">
      <Topbar crumb={item.name} note={item.category.name}>
        <Link href="/resources" className="btn ghost sm">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Resources
        </Link>
      </Topbar>

      <div className="flex-1 overflow-y-auto page">
        <div className="stack" style={{ gap: 24 }}>
          <div className="card plain stack" style={{ maxWidth: 720 }}>
            <div className="between" style={{ alignItems: 'flex-start' }}>
              <div>
                <h3 className="h-md">{item.name}</h3>
                <p className="mini dim" style={{ marginTop: 4 }}>
                  {item.category.name}{item.sku ? ` · SKU ${item.sku}` : ''} · unit: {item.unit}
                </p>
              </div>
              <span className={`badge ${item.active ? 'b-ok' : 'b-mute'}`}>{item.active ? 'Active' : 'Archived'}</span>
            </div>
            {item.description && <p className="mini dim">{item.description}</p>}
            {(variantDetails.length > 0 || item.seatingCapacity > 0) && (
              <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                {item.color && <span className="badge b-mute">Color: {item.color}</span>}
                {item.material && <span className="badge b-mute">Material: {item.material}</span>}
                {item.model && <span className="badge b-mute">Model: {item.model}</span>}
                {item.size && <span className="badge b-mute">Size: {item.size}</span>}
                {item.shape && <span className="badge b-mute">Shape: {item.shape}</span>}
                {item.seatingCapacity > 0 && (
                  <span className="badge b-mute">Seats {item.seatingCapacity}/unit</span>
                )}
              </div>
            )}
          </div>

          <div>
            <h4 className="label" style={{ marginBottom: 12 }}>Stock</h4>
            <div className="grid g4">
              <div className="card plain kpi">
                <span className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Package className="w-3 h-3" /> Total
                </span>
                <span className="val num">{stockSummary.totalQuantity}</span>
              </div>
              <div className="card plain kpi">
                <span className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Boxes className="w-3 h-3" /> Reserved
                </span>
                <span className="val num">{stockSummary.reservedQuantity}</span>
              </div>
              <div className="card plain kpi">
                <span className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 className="w-3 h-3" /> Available
                </span>
                <span className="val num">{stockSummary.availableQuantity}</span>
              </div>
              <div className="card plain kpi">
                <span className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Wrench className="w-3 h-3" /> Allocated
                </span>
                <span className="val num">{stockSummary.allocatedQuantity}</span>
              </div>
              <div className="card plain kpi">
                <span className="label">Issued</span>
                <span className="val num">{stockSummary.issuedQuantity}</span>
              </div>
              <div className="card plain kpi">
                <span className="label">Used</span>
                <span className="val num">{stockSummary.usedQuantity}</span>
              </div>
              <div className="card plain kpi">
                <span className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Undo2 className="w-3 h-3" /> Returned
                </span>
                <span className="val num">{stockSummary.returnedQuantity}</span>
              </div>
              <div className="card plain kpi">
                <span className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertTriangle className="w-3 h-3" /> Damaged
                </span>
                <span className="val num">{stockSummary.damagedQuantity}</span>
              </div>
              <div className="card plain kpi">
                <span className="label">Lost</span>
                <span className="val num">{stockSummary.lostQuantity}</span>
              </div>
              <div className="card plain kpi">
                <span className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertTriangle className="w-3 h-3" /> Missing
                </span>
                <span className="val num">{stockSummary.missingQuantity}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="label" style={{ marginBottom: 12 }}>Reservations</h4>
            {item.bookingResources.length === 0 ? (
              <p className="mini dim">No reservations yet.</p>
            ) : (
              <div className="card plain" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="scrollx" style={{ padding: '0 22px 6px' }}>
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>For</th>
                        <th className="r">Required</th>
                        <th className="r">Reserved</th>
                        <th>Window</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {item.bookingResources.map((r) => (
                        <tr key={r.id}>
                          <td>{resourceServiceLabel(r)}</td>
                          <td className="r num">{r.requiredQuantity}</td>
                          <td className="r num">{r.reservedQuantity}</td>
                          <td className="mini dim">
                            {new Date(r.startAt).toLocaleDateString()} – {new Date(r.endAt).toLocaleDateString()}
                          </td>
                          <td><span className={`badge ${STATUS_BADGE_CLASS[r.status] || 'b-mute'}`}>{r.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div>
            <h4 className="label" style={{ marginBottom: 12 }}>Movement History</h4>
            {item.transactions.length === 0 ? (
              <p className="mini dim">No movements recorded yet.</p>
            ) : (
              <div className="card plain" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="scrollx" style={{ padding: '0 22px 6px' }}>
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th className="r">Quantity</th>
                        <th>For</th>
                        <th>When</th>
                      </tr>
                    </thead>
                    <tbody>
                      {item.transactions.map((t) => (
                        <tr key={t.id}>
                          <td>{TRANSACTION_LABEL[t.type] || t.type}</td>
                          <td className="r num">{t.quantity}</td>
                          <td>{t.bookingService ? serviceLabel(t) : (t.reference || '—')}</td>
                          <td className="mini dim">{new Date(t.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
