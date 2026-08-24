import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, TrendingUp, LayoutGrid, FileText, ScrollText, ArrowRightLeft, CreditCard, Package } from 'lucide-react';
import ThemeSwitch from '@/components/aurelia/ThemeSwitch';
import LifecycleSpine from '@/components/aurelia/LifecycleSpine';
import { deriveLifecycleStages } from '@/lib/booking-lifecycle';
import { BookingPOSInitialData } from './types';

export type POSTab = 'overview' | 'details' | 'contract' | 'resources' | 'handover' | 'payments';

interface POSTerminalHeaderProps {
  onReset: () => void;
  isEdit?: boolean;
  bookingId?: string;
  bookingKind?: 'SPACE' | 'EVENT';
  booking?: BookingPOSInitialData | null;
  activeTab?: POSTab;
  setActiveTab?: (tab: POSTab) => void;
  hasPaymentsTab?: boolean;
}

export default function POSTerminalHeader({ onReset, isEdit, booking, bookingKind, activeTab, setActiveTab, hasPaymentsTab }: POSTerminalHeaderProps) {
  const stages = booking
    ? deriveLifecycleStages({
        bookingStatus: booking.status,
        kind: booking.context,
        scheduledPayments: booking.scheduledPayments,
        eventServices: booking.bookingServices,
        eventStatus: booking.event?.status ?? null,
      })
    : null;

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

        {/* The full tab set only makes sense once a booking already exists — a brand-new booking
            has no Overview/Contract/Hand-over to show yet, so creation stays a single "Details" form. */}
        {isEdit && setActiveTab && (
          <div className="tabs" style={{ border: 'none', margin: 0 }}>
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
              onClick={() => setActiveTab('contract')}
              className={`tab ${activeTab === 'contract' ? 'active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <ScrollText className="w-3.5 h-3.5" />
              Contract
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
    {stages && (
      <div style={{ borderBottom: '1px solid var(--rule)', background: 'var(--veil)' }}>
        <LifecycleSpine stages={stages} />
      </div>
    )}
    </>
  );
}
