import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, TrendingUp, FileText, CreditCard } from 'lucide-react';
import ThemeSwitch from '@/components/aurelia/ThemeSwitch';

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
    <header className="topbar">
      <div className="crumb" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link href="/bookings" className="icon-btn" title="Back to Bookings">
          <ArrowLeft className="w-4 h-4" />
        </Link>

        <div>
          <div className="row" style={{ gap: 10 }}>
            <h2 className="h-sm">{isEdit ? 'Edit Booking' : 'New Booking'}</h2>
            <span className="badge b-accent">Online Terminal</span>
          </div>
          <p className="mini dim">Aurelia • Commercial Booking Terminal</p>
        </div>

        {hasPaymentsTab && setActiveTab && (
          <div className="tabs" style={{ border: 'none', margin: 0 }}>
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`tab ${activeTab === 'details' ? 'active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <FileText className="w-3.5 h-3.5" />
              Details
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('payments')}
              className={`tab ${activeTab === 'payments' ? 'active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <CreditCard className="w-3.5 h-3.5" />
              Financials
            </button>
          </div>
        )}
      </div>

      <div className="row" style={{ gap: 12, flexShrink: 0 }}>
        <button type="button" onClick={onReset} className="btn sm">
          <Plus className="w-3.5 h-3.5" />
          New Service / Reset
        </button>

        <Link href="/bookings" className="btn primary sm">
          <TrendingUp className="w-3.5 h-3.5" />
          View CRM Funnel
        </Link>

        <ThemeSwitch />
      </div>
    </header>
  );
}
