import React from 'react';
import { ShoppingBag, Trash2, Tag, Loader2, CheckCircle2, Plus, AlertTriangle, CheckCircle } from 'lucide-react';
import { CartItem } from './types';
import { DEPOSIT_PERCENT_OPTIONS, PAYMENT_PLAN_OPTIONS, MilestoneDraft, PaymentPlanId, PaymentPlanValidationResult } from '@/lib/payment-plan';

interface POSExtractSummarySectionProps {
  selectedItems: CartItem[];
  removeItemFromCart: (id: string) => void;
  spaceServicesTotal: number;
  eventServicesTotal: number;
  internalRevenue: number;
  externalRepass: number;
  discount: number;
  setDiscount: (val: number) => void;
  grandTotal: number;
  depositPercent: number;
  setDepositPercent: (val: number) => void;
  paymentPlanId: PaymentPlanId;
  handlePlanChange: (planId: PaymentPlanId) => void;
  milestones: MilestoneDraft[];
  planValidation: PaymentPlanValidationResult;
  handleAddMilestone: () => void;
  handleUpdateMilestone: (index: number, field: keyof MilestoneDraft, value: string) => void;
  handleRemoveMilestone: (index: number) => void;
  submitting: boolean;
  handleSubmitPOS: (targetStatus?: 'CONFIRMED' | 'RESERVED') => void;
  isEdit?: boolean;
}

export default function POSExtractSummarySection({
  selectedItems,
  removeItemFromCart,
  spaceServicesTotal,
  eventServicesTotal,
  internalRevenue,
  externalRepass,
  discount,
  setDiscount,
  grandTotal,
  depositPercent,
  setDepositPercent,
  paymentPlanId,
  handlePlanChange,
  milestones,
  planValidation,
  handleAddMilestone,
  handleUpdateMilestone,
  handleRemoveMilestone,
  submitting,
  handleSubmitPOS,
  isEdit,
}: POSExtractSummarySectionProps) {
  return (
    <section className="lg:col-span-4 card plain flex flex-col gap-5 h-full min-h-0">
      <div className="flex-1 flex flex-col gap-5 overflow-hidden">
        {/* STEP HEADER */}
        <div className="between" style={{ paddingBottom: 12, borderBottom: '1px solid var(--rule)', flexShrink: 0 }}>
          <div className="row" style={{ gap: 12 }}>
            <span className="avatar" style={{ width: 28, height: 28, fontSize: 12 }}>3</span>
            <div>
              <h2 className="h-sm">Register Total & POS Extract</h2>
              <p className="mini dim">Final summary & contract creation</p>
            </div>
          </div>

          <span className="badge b-accent" style={{ flexShrink: 0 }}>{selectedItems.length} item(s)</span>
        </div>

        {/* CART ITEMS LIST */}
        <div className="flex-1 overflow-y-auto stack" style={{ gap: 10, paddingRight: 4, minHeight: 0 }}>
          {selectedItems.length === 0 ? (
            <div className="empty" style={{ padding: '28px 16px' }}>
              <ShoppingBag className="w-8 h-8 mx-auto mb-2" style={{ opacity: 0.3 }} />
              <p className="mini dim">No services selected yet.</p>
            </div>
          ) : (
            selectedItems.map((item) => (
              <div
                key={item.id}
                className="between"
                style={{ alignItems: 'flex-start', gap: 12, padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid var(--rule)', background: 'var(--surface-2)' }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span className="badge b-mute" style={{ marginBottom: 4 }}>
                    {item.category === 'SPACE' ? 'Venue' : 'Event'} • {item.providerName}
                  </span>
                  <h4 style={{ fontSize: 13, fontWeight: 600 }} className="truncate">{item.name}</h4>
                  <p className="mini dim num" style={{ marginTop: 2 }}>
                    {item.price.toLocaleString()} MT × {item.quantity} {item.priceType === 'PER_GUEST' ? 'guests' : 'units'}
                  </p>
                </div>

                <div className="row" style={{ gap: 8, flexShrink: 0 }}>
                  <span className="num" style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>
                    {item.totalPrice.toLocaleString()} MT
                  </span>
                  <button type="button" onClick={() => removeItemFromCart(item.id)} className="icon-btn" style={{ width: 28, height: 28, color: 'var(--bad)' }} title="Remove item">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* BOTTOM FIXED SUMMARY BLOCKS */}
        <div className="stack" style={{ gap: 20, flexShrink: 0, paddingBottom: 8 }}>
          {/* BREAKDOWN SUMMARY BOX */}
          <div className="stack" style={{ gap: 10, padding: 14, borderRadius: 'var(--radius-sm)', border: '1px solid var(--rule)', background: 'var(--surface-2)' }}>
            <div className="between mini">
              <span>Venue Services:</span>
              <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{spaceServicesTotal.toLocaleString()} MT</span>
            </div>

            <div className="between mini">
              <span>Event Services:</span>
              <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{eventServicesTotal.toLocaleString()} MT</span>
            </div>

            <div className="stack" style={{ gap: 6, paddingTop: 8, borderTop: '1px solid var(--rule)' }}>
              <div className="between mini" style={{ color: 'var(--ok)' }}>
                <span>Internal Revenue:</span>
                <span style={{ fontWeight: 700 }}>{internalRevenue.toLocaleString()} MT</span>
              </div>
              <div className="between mini" style={{ color: 'var(--info)' }}>
                <span>External Partner Payout:</span>
                <span style={{ fontWeight: 700 }}>{externalRepass.toLocaleString()} MT</span>
              </div>
            </div>

            {/* DISCOUNT INPUT */}
            <div className="between" style={{ paddingTop: 8, borderTop: '1px solid var(--rule)' }}>
              <span className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Tag className="w-3.5 h-3.5" /> POS Discount
              </span>
              <div className="row" style={{ gap: 6 }}>
                <span className="mini dim">MT</span>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value || '0')))}
                  className="input num"
                  style={{ width: 96, padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: 'var(--accent)' }}
                />
              </div>
            </div>
          </div>

          {/* GRAND TOTAL BANNER */}
          <div className="card kpi plain" style={{ textAlign: 'center', background: 'var(--accent-soft)', border: '1px solid var(--rule-strong)' }}>
            <span className="label">Total Contract Amount</span>
            <div className="val" style={{ fontSize: 32 }}>{grandTotal.toLocaleString()} MT</div>
          </div>

          {/* PAYMENT CONDITIONS */}
          {isEdit ? (
            <div className="stack mini dim" style={{ padding: 14, borderRadius: 'var(--radius-sm)', border: '1px solid var(--rule)', background: 'var(--surface-2)' }}>
              <h3 className="label">Payment Schedule</h3>
              <p>Payment milestones are managed on the <strong style={{ color: 'var(--ink)' }}>Payments</strong> tab, not here.</p>
            </div>
          ) : (
            <div className="stack" style={{ gap: 12, padding: 14, borderRadius: 'var(--radius-sm)', border: '1px solid var(--rule)', background: 'var(--surface-2)' }}>
              <h3 className="label">Payment Terms</h3>

              <div className="grid g2">
                <div className="field" style={{ marginBottom: 0 }}>
                  <label className="label">Deposit (%)</label>
                  <select
                    value={depositPercent}
                    onChange={(e) => setDepositPercent(parseInt(e.target.value, 10))}
                    disabled={paymentPlanId === 'FULL'}
                    className="input"
                    style={{ opacity: paymentPlanId === 'FULL' ? 0.4 : 1 }}
                  >
                    {DEPOSIT_PERCENT_OPTIONS.map((pct) => (
                      <option key={pct} value={pct}>{pct}% ({(grandTotal * pct / 100).toLocaleString()} MT)</option>
                    ))}
                  </select>
                </div>

                <div className="field" style={{ marginBottom: 0 }}>
                  <label className="label">Payment Plan</label>
                  <select value={paymentPlanId} onChange={(e) => handlePlanChange(e.target.value as PaymentPlanId)} className="input">
                    {PAYMENT_PLAN_OPTIONS.map((p) => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* MILESTONE LIST */}
              <div className="stack" style={{ gap: 8 }}>
                {milestones.map((m, idx) => (
                  <div key={idx} className="row mini" style={{ gap: 8, padding: 8, borderRadius: 'var(--radius-sm)', border: '1px solid var(--rule)', background: 'var(--surface-solid)' }}>
                    {paymentPlanId === 'CUSTOM' ? (
                      <>
                        <input
                          value={m.name}
                          onChange={(e) => handleUpdateMilestone(idx, 'name', e.target.value)}
                          className="input"
                          style={{ flex: 1, minWidth: 0, padding: '6px 8px' }}
                        />
                        <input
                          type="date"
                          value={m.dueDate}
                          onChange={(e) => handleUpdateMilestone(idx, 'dueDate', e.target.value)}
                          className="input"
                          style={{ padding: '6px 8px', width: 'auto' }}
                        />
                        <input
                          type="number"
                          value={m.amount}
                          onChange={(e) => handleUpdateMilestone(idx, 'amount', e.target.value)}
                          className="input num"
                          style={{ width: 96, padding: '6px 8px', textAlign: 'right', color: 'var(--accent)', fontWeight: 700 }}
                        />
                        <button type="button" onClick={() => handleRemoveMilestone(idx)} className="icon-btn" style={{ width: 28, height: 28, color: 'var(--bad)' }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="truncate" style={{ flex: 1, minWidth: 0, fontWeight: 600 }}>{m.name}</span>
                        <span className="dim">{new Date(m.dueDate).toLocaleDateString()}</span>
                        <span className="num" style={{ fontWeight: 700, color: 'var(--accent)', width: 96, textAlign: 'right' }}>{m.amount.toLocaleString()} MT</span>
                      </>
                    )}
                  </div>
                ))}
                {paymentPlanId === 'CUSTOM' && (
                  <button type="button" onClick={handleAddMilestone} className="btn sm" style={{ width: '100%', justifyContent: 'center', borderStyle: 'dashed' }}>
                    <Plus className="w-3.5 h-3.5" /> Add Milestone
                  </button>
                )}
              </div>

              {/* VALIDATION BANNER */}
              <div className={`alert ${planValidation.valid ? 'ok' : 'warn'}`} style={{ alignItems: 'flex-start' }}>
                {planValidation.valid ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>Payment plan is balanced and valid.</span>
                  </>
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5" style={{ flexShrink: 0, marginTop: 2 }} />
                )}
                {!planValidation.valid && (
                  <ul className="stack" style={{ gap: 2 }}>
                    {planValidation.errors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FINAL ACTION BUTTONS */}
      <div style={{ paddingTop: 8 }}>
        <button
          type="button"
          disabled={submitting || (!isEdit && !planValidation.valid)}
          onClick={() => handleSubmitPOS()}
          className="btn primary"
          style={{ width: '100%', justifyContent: 'center', padding: '14px 16px' }}
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              {isEdit ? 'Update Booking' : 'Save Booking'}
            </>
          )}
        </button>
      </div>
    </section>
  );
}
