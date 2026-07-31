import React from 'react';
import { ShoppingBag, Trash2, Tag, Loader2, CheckCircle2, FileText } from 'lucide-react';
import { CartItem } from './types';

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
  downPaymentPercent: number;
  setDownPaymentPercent: (val: number) => void;
  installmentCount: number;
  setInstallmentCount: (val: number) => void;
  downPaymentAmount: number;
  monthlyInstallment: number;
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
  downPaymentPercent,
  setDownPaymentPercent,
  installmentCount,
  setInstallmentCount,
  downPaymentAmount,
  monthlyInstallment,
  submitting,
  handleSubmitPOS,
  isEdit,
}: POSExtractSummarySectionProps) {
  return (
    <section className="lg:col-span-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl flex flex-col gap-5 h-full min-h-0">
      <div className="flex-1 flex flex-col gap-5 overflow-hidden">
        {/* STEP HEADER */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20 text-xs font-black flex items-center justify-center">
              3
            </span>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Register Total & POS Extract</h2>
              <p className="text-[11px] text-zinc-500">Final summary & contract creation</p>
            </div>
          </div>

          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-zinc-950 text-violet-400 border border-zinc-800 shrink-0">
            {selectedItems.length} item(s)
          </span>
        </div>

        {/* CART ITEMS LIST */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-0">
          {selectedItems.length === 0 ? (
            <div className="text-center py-10 text-zinc-600 border border-dashed border-zinc-800 rounded-xl p-4">
              <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No services selected yet.</p>
            </div>
          ) : (
            selectedItems.map((item) => (
              <div
                key={item.id}
                className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 flex justify-between items-start gap-3 shadow-sm"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-900 text-violet-400 border border-zinc-800 block w-fit mb-1 truncate">
                    {item.category === 'SPACE' ? '🏛️ VENUE' : '🎉 EVENT'} • {item.providerName}
                  </span>
                  <h4 className="text-xs font-bold text-white truncate">{item.name}</h4>
                  <p className="text-[10px] font-mono text-zinc-400 mt-0.5">
                    {item.price.toLocaleString()} MT × {item.quantity} {item.priceType === 'PER_GUEST' ? 'guests' : 'units'}
                  </p>
                </div>

                <div className="text-right shrink-0 flex items-center gap-2">
                  <span className="text-xs font-black text-violet-300">
                    {item.totalPrice.toLocaleString()} MT
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItemFromCart(item.id)}
                    className="text-zinc-500 hover:text-red-400 p-1 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* BOTTOM FIXED SUMMARY BLOCKS */}
        <div className="shrink-0 space-y-5 pb-2">
          {/* BREAKDOWN SUMMARY BOX */}
          <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-4 space-y-2.5 text-xs">
            <div className="flex justify-between items-center text-zinc-300 font-medium">
              <span className="flex items-center gap-1.5">
                <span>🏛️</span> Venue Services:
              </span>
              <span className="font-bold text-white">
                {spaceServicesTotal.toLocaleString()} MT
              </span>
          </div>

          <div className="flex justify-between items-center text-zinc-300 font-medium">
            <span className="flex items-center gap-1.5">
              <span>🎉</span> Event Services:
            </span>
            <span className="font-bold text-white">
              {eventServicesTotal.toLocaleString()} MT
            </span>
          </div>

          <div className="border-t border-zinc-800/80 pt-2 space-y-1.5 text-[11px]">
            <div className="flex justify-between items-center text-emerald-400">
              <span>• Internal Revenue:</span>
              <span className="font-bold">{internalRevenue.toLocaleString()} MT</span>
            </div>
            <div className="flex justify-between items-center text-blue-400">
              <span>• External Partner Payout:</span>
              <span className="font-bold">{externalRepass.toLocaleString()} MT</span>
            </div>
          </div>

          {/* DISCOUNT INPUT */}
          <div className="border-t border-zinc-800/80 pt-2 flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-violet-400 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" /> POS Discount:
            </span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-zinc-400">MT</span>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value || '0')))}
                className="w-24 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-violet-400 font-bold text-right focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>
        </div>

        {/* GRAND TOTAL BANNER */}
        <div className="bg-gradient-to-r from-violet-950 via-zinc-900 to-violet-950 border border-violet-500/30 rounded-2xl p-5 shadow-xl text-center space-y-1">
          <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest block">
            Total Contract Amount
          </span>
          <span className="text-3xl md:text-4xl font-black text-white tracking-tight block">
            {grandTotal.toLocaleString()} MT
          </span>

        </div>

        {/* PAYMENT CONDITIONS */}
        <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
            Payment Terms
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                Initial Down Payment (%)
              </label>
              <select
                value={downPaymentPercent}
                onChange={(e) => setDownPaymentPercent(parseInt(e.target.value, 10))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-white font-bold"
              >
                <option value={10}>10% ({(grandTotal * 0.1).toLocaleString()} MT)</option>
                <option value={20}>20% ({(grandTotal * 0.2).toLocaleString()} MT)</option>
                <option value={30}>30% ({(grandTotal * 0.3).toLocaleString()} MT)</option>
                <option value={50}>50% ({(grandTotal * 0.5).toLocaleString()} MT)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                Installment Plan
              </label>
              <select
                value={installmentCount}
                onChange={(e) => setInstallmentCount(parseInt(e.target.value, 10))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-white font-bold"
              >
                <option value={1}>Single Payment (1x)</option>
                <option value={3}>3x interest-free</option>
                <option value={6}>6x interest-free</option>
                <option value={10}>10x interest-free</option>
                <option value={12}>12x interest-free</option>
              </select>
            </div>
          </div>

          <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 space-y-1 text-[11px]">
            <div className="flex justify-between text-zinc-300 font-medium">
              <span>Initial Down Payment:</span>
              <span className="font-bold text-violet-400">{downPaymentAmount.toLocaleString()} MT</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Remaining Balance ({installmentCount > 1 ? installmentCount - 1 : 1}x of):</span>
              <span className="font-bold text-white">{monthlyInstallment.toLocaleString(undefined, { maximumFractionDigits: 0 })} MT / month</span>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* FINAL ACTION BUTTONS */}
      <div className="space-y-2.5 pt-2">
        <button
          type="button"
          disabled={submitting}
          onClick={() => handleSubmitPOS()}
          className="w-full bg-violet-600 hover:bg-violet-500 text-white py-3.5 px-4 rounded-xl text-xs font-bold transition-all shadow-lg shadow-violet-600/20 flex items-center justify-center gap-2 border border-violet-500/30 disabled:opacity-50"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 text-violet-200" />
              {isEdit ? 'Update Booking' : 'Save Booking'}
            </>
          )}
        </button>
      </div>
    </section>
  );
}
