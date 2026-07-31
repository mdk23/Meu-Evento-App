import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Plus, TrendingUp, FileText, CreditCard } from 'lucide-react';

interface POSTerminalHeaderProps {
  onReset: () => void;
  isEdit?: boolean;
  bookingId?: string;
  activeTab?: 'details' | 'payments';
  setActiveTab?: (tab: 'details' | 'payments') => void;
  hasPaymentsTab?: boolean;
}

export default function POSTerminalHeader({ onReset, isEdit, bookingId, activeTab, setActiveTab, hasPaymentsTab }: POSTerminalHeaderProps) {
  return (
    <header className="h-16 border-b border-zinc-900 bg-zinc-950/80 px-8 flex items-center justify-between gap-4 shrink-0 backdrop-blur-md w-full">
      <div className="flex items-center gap-4">
        <Link
          href="/bookings"
          className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
          title="Back to Bookings"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-400" />
              {isEdit ? 'Edit Booking' : 'New Booking'}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse"></span>
              Online Terminal
            </span>
          </div>
          <p className="text-xs text-zinc-500">AuraVenue • Commercial Booking Terminal</p>
        </div>

        {hasPaymentsTab && setActiveTab && (
          <div className="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800 ml-4">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'details' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}
            >
              <FileText className="w-4 h-4" />
              Details
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'payments' ? 'bg-emerald-500/20 text-emerald-400 shadow-sm border border-emerald-500/20' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}
            >
              <CreditCard className="w-4 h-4" />
              Financials
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onReset}
          className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold border border-zinc-800 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4 text-violet-400" />
          New Service / Reset
        </button>

        {/* Removed "Manage Payments" link since we now have tabs */}

        <Link
          href="/bookings"
          className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-lg shadow-violet-600/20 flex items-center gap-2"
        >
          <TrendingUp className="w-4 h-4" />
          View CRM Funnel
        </Link>
      </div>
    </header>
  );
}
