'use client';

import React, { useState } from 'react';
import { BookingPOSTerminalProps } from './pos/types';
import { useBookingPOS } from './pos/useBookingPOS';
import POSTerminalHeader from './pos/POSTerminalHeader';
import ClientCalendarSection from './pos/ClientCalendarSection';
import CatalogServicesSection from './pos/CatalogServicesSection';
import POSExtractSummarySection from './pos/POSExtractSummarySection';

export default function BookingPOSTerminal(props: BookingPOSTerminalProps) {
  const pos = useBookingPOS(props);
  const [activeTab, setActiveTab] = useState<'details' | 'payments'>('details');

  return (
    <div className="flex-1 flex flex-col h-full w-full bg-zinc-950 text-white font-sans overflow-hidden">
      {/* TOP HEADER BAR */}
      <POSTerminalHeader 
        onReset={pos.resetForm} 
        isEdit={!!props.initialBookingData} 
        bookingId={props.initialBookingData?.id}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasPaymentsTab={!!props.paymentsTabComponent}
      />

      <div className="flex-1 relative w-full h-full overflow-hidden">
        {/* MAIN 3-COLUMN WORKSPACE (DETAILS TAB) */}
        <main className={`absolute inset-0 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto w-full bg-zinc-950 ${activeTab === 'details' ? 'block' : 'hidden'}`}>
          {/* COLUMN 1: CLIENT & CALENDAR */}
          <ClientCalendarSection
            initialClients={props.initialClients || []}
            selectedClientId={pos.selectedClientId}
            setSelectedClientId={pos.setSelectedClientId}
            clientName={pos.clientName}
            setClientName={pos.setClientName}
            clientPhone={pos.clientPhone}
            setClientPhone={pos.setClientPhone}
            clientEmail={pos.clientEmail}
            setClientEmail={pos.setClientEmail}
            eventTitle={pos.eventTitle}
            setEventTitle={pos.setEventTitle}
            eventType={pos.eventType}
            setEventType={pos.setEventType}
            guestCount={pos.guestCount}
            setGuestCount={pos.setGuestCount}
            eventDate={pos.eventDate}
            setEventDate={pos.setEventDate}
            depositDueDate={pos.depositDueDate}
            setDepositDueDate={pos.setDepositDueDate}
            calendarMonth={pos.calendarMonth}
            setCalendarMonth={pos.setCalendarMonth}
            calendarYear={pos.calendarYear}
            calendarMonthIndex={pos.calendarMonthIndex}
            calendarDaysArr={pos.calendarDaysArr}
            getBookingsOnDay={pos.getBookingsOnDay}
            hasConflict={pos.hasConflict}
            selectedDateBookings={pos.selectedDateBookings}
            isWaitingList={pos.isWaitingList}
            setIsWaitingList={pos.setIsWaitingList}
          />

          {/* COLUMN 2: CATALOG SERVICES */}
          <CatalogServicesSection
            searchTerm={pos.searchTerm}
            setSearchTerm={pos.setSearchTerm}
            categoryFilter={pos.categoryFilter}
            setCategoryFilter={pos.setCategoryFilter}
            originFilter={pos.originFilter}
            setOriginFilter={pos.setOriginFilter}
            catalogServices={pos.catalogServices}
            filteredCatalog={pos.filteredCatalog}
            selectedItems={pos.selectedItems}
            toggleCatalogService={pos.toggleCatalogService}
          />

          {/* COLUMN 3: POS CASH EXTRACT & SUMMARY */}
          <POSExtractSummarySection
            selectedItems={pos.selectedItems}
            removeItemFromCart={pos.removeItemFromCart}
            spaceServicesTotal={pos.spaceServicesTotal}
            eventServicesTotal={pos.eventServicesTotal}
            internalRevenue={pos.internalRevenue}
            externalRepass={pos.externalRepass}
            discount={pos.discount}
            setDiscount={pos.setDiscount}
            grandTotal={pos.grandTotal}
            downPaymentPercent={pos.downPaymentPercent}
            setDownPaymentPercent={pos.setDownPaymentPercent}
            installmentCount={pos.installmentCount}
            setInstallmentCount={pos.setInstallmentCount}
            downPaymentAmount={pos.downPaymentAmount}
            monthlyInstallment={pos.monthlyInstallment}
            submitting={pos.submitting}
            handleSubmitPOS={pos.handleSubmitPOS}
          />
        </main>

        {/* PAYMENTS TAB */}
        {props.paymentsTabComponent && (
          <main className={`absolute inset-0 overflow-y-auto w-full h-full bg-zinc-950 ${activeTab === 'payments' ? 'block' : 'hidden'}`}>
            {props.paymentsTabComponent}
          </main>
        )}
      </div>
    </div>
  );
}
