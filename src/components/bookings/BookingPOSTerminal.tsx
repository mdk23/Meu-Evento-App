'use client';

import React, { useState } from 'react';
import { BookingPOSTerminalProps } from './pos/types';
import { useBookingPOS } from './pos/useBookingPOS';
import POSTerminalHeader, { POSTab } from './pos/POSTerminalHeader';
import ClientCalendarSection from './pos/ClientCalendarSection';
import CatalogServicesSection from './pos/CatalogServicesSection';
import POSExtractSummarySection from './pos/POSExtractSummarySection';
import BookingOverviewTab from './pos/BookingOverviewTab';
import BookingContractTab from './pos/BookingContractTab';
import BookingHandoverTab from './pos/BookingHandoverTab';
import ClientFormModal from '@/components/clients/ClientFormModal';

export default function BookingPOSTerminal(props: BookingPOSTerminalProps) {
  const pos = useBookingPOS(props);
  const isEdit = !!props.initialBookingData;
  const [activeTab, setActiveTab] = useState<POSTab>(isEdit ? 'overview' : 'details');

  return (
    <div className="aurelia-shell flex-1 flex flex-col h-full w-full font-sans overflow-hidden">
      {/* TOP HEADER BAR */}
      <POSTerminalHeader
        onReset={pos.resetForm}
        isEdit={isEdit}
        bookingId={props.initialBookingData?.id}
        bookingKind={props.initialBookingData?.kind}
        booking={props.initialBookingData}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasPaymentsTab={!!props.paymentsTabComponent}
      />

      <div className="flex-1 relative w-full h-full overflow-hidden">
        {/* MAIN 3-COLUMN WORKSPACE (DETAILS TAB) */}
        <main
          className="absolute inset-0 p-6 grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto lg:overflow-hidden w-full"
          style={{ display: activeTab === 'details' ? 'grid' : 'none' }}
        >
          {/* COLUMN 1: CLIENT & CALENDAR */}
          <ClientCalendarSection
            clients={pos.clientsList}
            selectedClientId={pos.selectedClientId}
            setSelectedClientId={pos.setSelectedClientId}
            clientName={pos.clientName}
            setClientName={pos.setClientName}
            clientPhone={pos.clientPhone}
            setClientPhone={pos.setClientPhone}
            clientEmail={pos.clientEmail}
            setClientEmail={pos.setClientEmail}
            onOpenNewClientModal={pos.openNewClientModal}
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
            startTime={pos.startTime}
            setStartTime={pos.setStartTime}
            endTime={pos.endTime}
            setEndTime={pos.setEndTime}
            spaceCapacity={pos.spaceCapacity}
            overCapacity={pos.overCapacity}
            capacityOverrideReason={pos.capacityOverrideReason}
            setCapacityOverrideReason={pos.setCapacityOverrideReason}
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
            packages={pos.packages}
            onApplyPackage={pos.applyPackage}
            isPackageApplied={pos.isPackageApplied}
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
            depositPercent={pos.depositPercent}
            setDepositPercent={pos.setDepositPercent}
            paymentPlanId={pos.paymentPlanId}
            handlePlanChange={pos.handlePlanChange}
            milestones={pos.milestones}
            planValidation={pos.planValidation}
            handleAddMilestone={pos.handleAddMilestone}
            handleUpdateMilestone={pos.handleUpdateMilestone}
            handleRemoveMilestone={pos.handleRemoveMilestone}
            submitting={pos.submitting}
            handleSubmitPOS={pos.handleSubmitPOS}
            isEdit={pos.isEdit}
          />
        </main>

        {/* PAYMENTS TAB */}
        {props.paymentsTabComponent && (
          <main className={`absolute inset-0 overflow-y-auto w-full h-full ${activeTab === 'payments' ? 'block' : 'hidden'}`}>
            {props.paymentsTabComponent}
          </main>
        )}

        {/* OVERVIEW / CONTRACT / HAND-OVER-OR-EVENT TABS — read-only, only meaningful once a
            booking already exists (a brand-new booking has nothing yet to summarize). */}
        {props.initialBookingData && (
          <>
            <main className={`absolute inset-0 overflow-y-auto w-full h-full ${activeTab === 'overview' ? 'block' : 'hidden'}`}>
              <BookingOverviewTab booking={props.initialBookingData} spaces={props.initialSpaces || []} />
            </main>
            <main className={`absolute inset-0 overflow-y-auto w-full h-full ${activeTab === 'contract' ? 'block' : 'hidden'}`}>
              <BookingContractTab booking={props.initialBookingData} />
            </main>
            <main className={`absolute inset-0 overflow-y-auto w-full h-full ${activeTab === 'handover' ? 'block' : 'hidden'}`}>
              <BookingHandoverTab booking={props.initialBookingData} />
            </main>
          </>
        )}
      </div>

      <ClientFormModal
        isOpen={pos.isNewClientModalOpen}
        onClose={pos.closeNewClientModal}
        title="Register New Client"
        submitLabel="Save & Select"
        submitting={pos.creatingClient}
        onSubmit={pos.handleCreateClient}
      />
    </div>
  );
}
