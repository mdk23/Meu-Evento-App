'use client';

import { Loader2 } from 'lucide-react';
import { useEventDetail } from './useEventDetail';
import EventDetailHeader from './EventDetailHeader';
import EventDetailTabs from './EventDetailTabs';
import OverviewTab from './tabs/OverviewTab';
import ServicesTab from './tabs/ServicesTab';
import GuestsTab from './tabs/GuestsTab';
import TasksTab from './tabs/TasksTab';
import ResourcesTab from './tabs/ResourcesTab';
import SuppliersTab from './tabs/SuppliersTab';
import PaymentsTab from './tabs/PaymentsTab';
import ExecutionTab from './tabs/ExecutionTab';
import ServiceWorkOrderModal from './ServiceWorkOrderModal';
import AddServiceModal from './AddServiceModal';

interface EventDetailClientProps {
  eventId: string;
}

export default function EventDetailClient({ eventId }: EventDetailClientProps) {
  const detail = useEventDetail(eventId);

  if (detail.loading || !detail.data || !detail.data.event) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--accent)' }}>
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  const { event, space, suppliers, catalogServices, staff, inventoryItems, resourceSummary } = detail.data;

  return (
    <>
      <main className="aurelia-shell flex-1 flex flex-col h-screen overflow-hidden">
        <EventDetailHeader event={event} />
        <EventDetailTabs activeTab={detail.activeTab} onTabChange={detail.setActiveTab} />

        <div className={`flex-1 overflow-auto${detail.activeTab === 'payments' ? '' : ' page'}`}>
          {detail.activeTab === 'overview' && <OverviewTab event={event} space={space} onNavigateTab={detail.setActiveTab} />}
          {detail.activeTab === 'services' && (
            <ServicesTab
              eventServices={event.bookingServices}
              onOpenWorkOrder={detail.openServiceWorkOrder}
              onOpenAddService={() => detail.setIsAddServiceOpen(true)}
            />
          )}
          {detail.activeTab === 'tasks' && (
            <TasksTab
              eventServices={event.bookingServices}
              onToggleTask={detail.toggleTaskCompletedGlobal}
              onOpenWorkOrder={detail.openServiceWorkOrder}
            />
          )}
          {detail.activeTab === 'guests' && (
            <GuestsTab
              guests={event.guests}
              guestName={detail.guestName}
              setGuestName={detail.setGuestName}
              guestEmail={detail.guestEmail}
              setGuestEmail={detail.setGuestEmail}
              guestPlusOnes={detail.guestPlusOnes}
              setGuestPlusOnes={detail.setGuestPlusOnes}
              addingGuest={detail.addingGuest}
              onAddGuest={detail.handleAddGuest}
            />
          )}
          {detail.activeTab === 'resources' && (
            <ResourcesTab eventServices={event.bookingServices} resourceSummary={resourceSummary || []} onOpenWorkOrder={detail.openServiceWorkOrder} />
          )}
          {detail.activeTab === 'suppliers' && (
            <SuppliersTab
              eventServices={event.bookingServices}
              expenses={event.expenses}
              onOpenWorkOrder={detail.openServiceWorkOrder}
            />
          )}
          {detail.activeTab === 'payments' && <PaymentsTab event={event} />}
          {detail.activeTab === 'execution' && (
            <ExecutionTab
              eventServices={event.bookingServices}
              expenses={event.expenses}
              discount={event.booking.discount || 0}
              onOpenWorkOrder={detail.openServiceWorkOrder}
            />
          )}
        </div>
      </main>

      {detail.selectedService && (
        <ServiceWorkOrderModal
          selectedService={detail.selectedService}
          workOrderStatus={detail.workOrderStatus}
          setWorkOrderStatus={detail.setWorkOrderStatus}
          sellingPrice={detail.sellingPrice}
          setSellingPrice={detail.setSellingPrice}
          newTaskTitle={detail.newTaskTitle}
          setNewTaskTitle={detail.setNewTaskTitle}
          supplierId={detail.supplierId}
          setSupplierId={detail.setSupplierId}
          supplierCost={detail.supplierCost}
          setSupplierCost={detail.setSupplierCost}
          supplierStatus={detail.supplierStatus}
          setSupplierStatus={detail.setSupplierStatus}
          paymentStatus={detail.paymentStatus}
          setPaymentStatus={detail.setPaymentStatus}
          suppliers={suppliers || []}
          savingWorkOrder={detail.savingWorkOrder}
          workOrderError={detail.workOrderError}
          onToggleTask={detail.toggleTaskCompleted}
          onAddTask={detail.handleAddTask}
          onRemoveTask={detail.handleRemoveTask}
          staff={staff || []}
          selectedStaffId={detail.selectedStaffId}
          setSelectedStaffId={detail.setSelectedStaffId}
          onAssignStaff={detail.handleAssignStaff}
          onUnassignStaff={detail.handleUnassignStaff}
          inventoryItems={inventoryItems || []}
          selectedInventoryId={detail.selectedInventoryId}
          setSelectedInventoryId={detail.setSelectedInventoryId}
          reserveQuantity={detail.reserveQuantity}
          setReserveQuantity={detail.setReserveQuantity}
          onReserveInventory={detail.handleReserveInventoryItem}
          onRemoveReservedInventory={detail.handleRemoveReservedInventory}
          onReservationAction={detail.handleReservationAction}
          onReuseReservation={detail.handleReuseReservation}
          onSave={detail.handleSaveWorkOrder}
          onClose={detail.closeServiceWorkOrder}
        />
      )}

      {detail.isAddServiceOpen && (
        <AddServiceModal
          catalogServices={catalogServices || []}
          catalogServiceId={detail.catalogServiceId}
          setCatalogServiceId={detail.setCatalogServiceId}
          customSellingPrice={detail.customSellingPrice}
          setCustomSellingPrice={detail.setCustomSellingPrice}
          customCost={detail.customCost}
          setCustomCost={detail.setCustomCost}
          addingService={detail.addingService}
          onSubmit={detail.handleAddServiceToEvent}
          onClose={() => detail.setIsAddServiceOpen(false)}
        />
      )}
    </>
  );
}
