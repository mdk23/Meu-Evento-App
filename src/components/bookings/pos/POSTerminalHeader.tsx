import React from 'react';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, LayoutGrid, FileText, ScrollText, ArrowRightLeft, CreditCard, Package } from 'lucide-react';
import ThemeSwitch from '@/components/aurelia/ThemeSwitch';

export type POSTab = 'overview' | 'details' | 'contract' | 'resources' | 'handover' | 'payments';

interface POSTerminalHeaderProps {
  isEdit?: boolean;
  bookingId?: string;
  bookingKind?: 'SPACE' | 'EVENT';
  activeTab?: POSTab;
  setActiveTab?: (tab: POSTab) => void;
  hasPaymentsTab?: boolean;
}

export default function POSTerminalHeader({ isEdit, bookingKind, activeTab, setActiveTab, hasPaymentsTab }: POSTerminalHeaderProps) {
  return (
    <>
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
        </div>

        <div className="row" style={{ gap: 12, flexShrink: 0 }}>
          <Link href="/bookings" className="btn primary sm">
            <TrendingUp className="w-3.5 h-3.5" />
            View CRM Funnel
          </Link>

          <ThemeSwitch />
        </div>
      </header>

      {/* The full tab set only makes sense once a booking already exists — a brand-new booking
          has no Overview/Contract/Hand-over to show yet, so creation stays a single "Details" form. */}
      {isEdit && setActiveTab && (
        <div className="tabs" style={{ padding: '0 34px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Overview
          </button>
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
            onClick={() => setActiveTab('resources')}
            className={`tab ${activeTab === 'resources' ? 'active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Package className="w-3.5 h-3.5" />
            Resources
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('contract')}
            className={`tab ${activeTab === 'contract' ? 'active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <ScrollText className="w-3.5 h-3.5" />
            Contract
          </button>
          {hasPaymentsTab && (
            <button
              type="button"
              onClick={() => setActiveTab('payments')}
              className={`tab ${activeTab === 'payments' ? 'active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <CreditCard className="w-3.5 h-3.5" />
              Financials
            </button>
          )}
          <button
            type="button"
            onClick={() => setActiveTab('handover')}
            className={`tab ${activeTab === 'handover' ? 'active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            {bookingKind === 'EVENT' ? 'Event' : 'Hand-over'}
          </button>
        </div>
      )}
    </>
  );
}
