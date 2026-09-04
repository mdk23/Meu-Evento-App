'use client';

import type { ReactNode } from 'react';
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
  Send,
  Hammer,
  CircleSlash,
  Armchair,
} from 'lucide-react';
import { DecimalToNumber } from '@/lib/money';
import { readAttributeDefs, getSeatingCapacity } from '@/lib/inventory-attributes';
import Topbar from '@/components/aurelia/Topbar';

type ItemDetail = DecimalToNumber<Prisma.InventoryItemGetPayload<{
  include: {
    inventoryType: { include: { category: true } };
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
  RESERVED: 'b-ok',
  CONFIRMED: 'b-ok',
  ISSUED: 'b-info',
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
  ISSUE: 'Issued',
  USE: 'Used',
  RETURN: 'Returned',
  DAMAGE: 'Damaged',
  LOSS: 'Lost',
};

const TRANSACTION_TONE: Record<string, string> = {
  PURCHASE: 'b-ok',
  ADJUSTMENT_IN: 'b-ok',
  ADJUSTMENT_OUT: 'b-warn',
  RESERVE: 'b-accent',
  RELEASE: 'b-mute',
  ALLOCATE: 'b-accent',
  ISSUE: 'b-info',
  USE: 'b-info',
  RETURN: 'b-mute',
  DAMAGE: 'b-bad',
  LOSS: 'b-bad',
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

/** Render one stored attribute value for display — never raw JSON (§7). */
function formatAttrValue(v: unknown): string {
  if (v === undefined || v === null || v === '') return '';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (Array.isArray(v)) return v.join(', ');
  return String(v);
}

/** One derived stock figure shown as a compact tile. `tone` shifts the value colour for the
 * outcomes that matter operationally (missing stock). */
function FlowTile({
  icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  hint: string;
  tone?: 'bad' | 'warn';
}) {
  const color = value > 0 && tone === 'bad' ? 'var(--bad)' : value > 0 && tone === 'warn' ? 'var(--warn)' : 'var(--ink)';
  return (
    <div className="card plain" style={{ padding: '16px 18px' }} title={hint}>
      <span className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {icon} {label}
      </span>
      <span className="num" style={{ display: 'block', marginTop: 6, fontSize: 24, fontWeight: 600, color, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </span>
    </div>
  );
}

export default function InventoryItemDetailClient({ item, stockSummary }: InventoryItemDetailClientProps) {
  const attributeDefs = readAttributeDefs(item.inventoryType.attributeDefs);
  const attrs: Record<string, unknown> =
    item.attributes && typeof item.attributes === 'object' && !Array.isArray(item.attributes)
      ? (item.attributes as Record<string, unknown>)
      : {};
  const seatingCapacity = getSeatingCapacity(item.attributes, attributeDefs);

  // Characteristics come from the type's schema, in its declared order — the seating figure has its
  // own dedicated chip, so it's excluded here to avoid showing twice.
  const specs: Array<[string, string]> = attributeDefs
    .filter((d) => d.key !== 'seatingCapacity')
    .map((d) => [d.label, formatAttrValue(attrs[d.key])] as [string, string])
    .filter(([, v]) => v !== '');

  const total = Math.max(stockSummary.totalQuantity, 0);
  const reserved = Math.max(stockSummary.reservedQuantity, 0);
  const available = Math.max(stockSummary.availableQuantity, 0);
  const reservedPct = total > 0 ? Math.min((reserved / total) * 100, 100) : 0;
  const utilisation = total > 0 ? Math.round((reserved / total) * 100) : 0;

  return (
    <main className="aurelia-shell flex-1 flex flex-col h-screen overflow-hidden">
      <Topbar crumb={item.name} note={`${item.inventoryType.category.name} · ${item.inventoryType.name}`}>
        <Link href="/resources" className="btn ghost sm">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Resources
        </Link>
      </Topbar>

      <div className="flex-1 overflow-y-auto page full-bleed">
        <div className="stack" style={{ gap: 22, maxWidth: 1600, margin: '0 auto' }}>

          {/* HERO — identity + specs on the left, headline stock on the right */}
          <div
            className="card plain"
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.15fr) minmax(320px, 0.85fr)',
              gap: 0,
              padding: 0,
              overflow: 'hidden',
            }}
          >
            {/* Left */}
            <div className="stack" style={{ gap: 16, padding: 28 }}>
              <div className="between" style={{ alignItems: 'flex-start', gap: 16 }}>
                <div>
                  <h3 className="h-md">{item.name}</h3>
                  <p className="mini dim" style={{ marginTop: 6 }}>
                    {item.inventoryType.category.name} · {item.inventoryType.name}
                    {item.sku ? ` · SKU ${item.sku}` : ''} · per {item.unit}
                  </p>
                </div>
                <span className={`badge ${item.active ? 'b-ok' : 'b-mute'}`}>{item.active ? 'Active' : 'Archived'}</span>
              </div>

              {item.description && <p className="mini" style={{ color: 'var(--ink-2)', lineHeight: 1.7 }}>{item.description}</p>}

              {(specs.length > 0 || seatingCapacity > 0) && (
                <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                  {seatingCapacity > 0 && (
                    <span className="badge b-accent" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Armchair className="w-3 h-3" /> Seats {seatingCapacity} / {item.unit}
                    </span>
                  )}
                  {specs.map(([k, v]) => (
                    <span key={k} className="badge b-mute">{k}: {v}</span>
                  ))}
                </div>
              )}

              <div className="row mini dim" style={{ gap: 18, flexWrap: 'wrap', marginTop: 'auto', paddingTop: 6 }}>
                <span>{item.bookingResources.length} reservation{item.bookingResources.length === 1 ? '' : 's'}</span>
                <span>{item.transactions.length} movement{item.transactions.length === 1 ? '' : 's'}</span>
                <span>Utilisation {utilisation}%</span>
              </div>
            </div>

            {/* Right — headline numbers + availability bar */}
            <div
              className="stack"
              style={{ gap: 18, padding: 28, background: 'var(--surface-2)', borderLeft: '1px solid var(--rule)' }}
            >
              <div className="grid g3" style={{ gap: 14 }}>
                <div>
                  <span className="label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Package className="w-3 h-3" /> Total
                  </span>
                  <span className="num" style={{ display: 'block', marginTop: 6, fontSize: 30, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                    {total}
                  </span>
                </div>
                <div>
                  <span className="label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <CheckCircle2 className="w-3 h-3" /> Available
                  </span>
                  <span className="num" style={{ display: 'block', marginTop: 6, fontSize: 30, fontWeight: 600, color: 'var(--ok)', fontVariantNumeric: 'tabular-nums' }}>
                    {available}
                  </span>
                </div>
                <div>
                  <span className="label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Boxes className="w-3 h-3" /> Reserved
                  </span>
                  <span className="num" style={{ display: 'block', marginTop: 6, fontSize: 30, fontWeight: 600, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}>
                    {reserved}
                  </span>
                </div>
              </div>

              <div>
                <div
                  style={{
                    height: 10,
                    borderRadius: 999,
                    background: 'var(--rule)',
                    overflow: 'hidden',
                    display: 'flex',
                  }}
                >
                  <div style={{ width: `${reservedPct}%`, background: 'var(--accent)' }} />
                </div>
                <div className="between mini dim" style={{ marginTop: 6 }}>
                  <span>{reserved} reserved</span>
                  <span>{available} free</span>
                </div>
              </div>
            </div>
          </div>

          {/* STOCK FLOW — ledger-derived figures, tiled edge-to-edge */}
          <div>
            <h4 className="label" style={{ marginBottom: 10 }}>Stock flow</h4>
            <div
              style={{
                display: 'grid',
                gap: 14,
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              }}
            >
              <FlowTile icon={<Wrench className="w-3 h-3" />} label="Allocated" value={stockSummary.allocatedQuantity} hint="Allocated to a work order, not yet used or returned." />
              <FlowTile icon={<Send className="w-3 h-3" />} label="Issued" value={stockSummary.issuedQuantity} hint="Physically dispatched from the store, not yet used or returned." />
              <FlowTile icon={<CheckCircle2 className="w-3 h-3" />} label="Used" value={stockSummary.usedQuantity} hint="Marked in use at a venue." />
              <FlowTile icon={<Undo2 className="w-3 h-3" />} label="Returned" value={stockSummary.returnedQuantity} hint="Came back after use." />
              <FlowTile icon={<Hammer className="w-3 h-3" />} label="Damaged" value={stockSummary.damagedQuantity} hint="Returned damaged." tone="warn" />
              <FlowTile icon={<CircleSlash className="w-3 h-3" />} label="Lost" value={stockSummary.lostQuantity} hint="Never came back." tone="bad" />
              <FlowTile icon={<AlertTriangle className="w-3 h-3" />} label="Missing" value={stockSummary.missingQuantity} hint="Damaged + lost — units that didn't come back intact." tone="bad" />
            </div>
          </div>

          {/* RESERVATIONS + MOVEMENT HISTORY — side by side on wide screens */}
          <div className="grid g2" style={{ gap: 22, alignItems: 'start' }}>
            <section className="stack" style={{ gap: 10 }}>
              <div className="between">
                <h4 className="label">Reservations</h4>
                <span className="mini dim">{item.bookingResources.length}</span>
              </div>
              {item.bookingResources.length === 0 ? (
                <div className="card plain" style={{ padding: 22 }}>
                  <p className="mini dim">No reservations yet.</p>
                </div>
              ) : (
                <div className="card plain" style={{ padding: 0, overflow: 'hidden' }}>
                  <div className="scrollx" style={{ padding: '16px 22px 6px' }}>
                    <table className="tbl">
                      <thead>
                        <tr>
                          <th>For</th>
                          <th className="r">Req.</th>
                          <th className="r">Rsvd.</th>
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
            </section>

            <section className="stack" style={{ gap: 10 }}>
              <div className="between">
                <h4 className="label">Movement history</h4>
                <span className="mini dim">{item.transactions.length}</span>
              </div>
              {item.transactions.length === 0 ? (
                <div className="card plain" style={{ padding: 22 }}>
                  <p className="mini dim">No movements recorded yet.</p>
                </div>
              ) : (
                <div className="card plain" style={{ padding: 0, overflow: 'hidden' }}>
                  <div className="scrollx" style={{ padding: '16px 22px 6px' }}>
                    <table className="tbl">
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th className="r">Qty</th>
                          <th>For</th>
                          <th>When</th>
                        </tr>
                      </thead>
                      <tbody>
                        {item.transactions.map((t) => (
                          <tr key={t.id}>
                            <td>
                              <span className={`badge ${TRANSACTION_TONE[t.type] || 'b-mute'}`}>
                                {TRANSACTION_LABEL[t.type] || t.type}
                              </span>
                            </td>
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
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
