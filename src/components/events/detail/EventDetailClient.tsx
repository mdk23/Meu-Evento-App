'use client';

import { Loader2 } from 'lucide-react';
import { useEventDetail } from './useEventDetail';
import EventDetailHeader from './EventDetailHeader';
import EventDetailTabs from './EventDetailTabs';
import OverviewTab from './tabs/OverviewTab';
import ServicesTab from './tabs/ServicesTab';
import GuestsTab from './tabs/GuestsTab';
import TasksTab from './tabs/TasksTab';
import FinanceTab from './tabs/FinanceTab';
import DocumentsTab from './tabs/DocumentsTab';
import ServiceWorkOrderModal from './ServiceWorkOrderModal';
import AddServiceModal from './AddServiceModal';

interface EventDetailClientProps {
  eventId: string;
}

export default function EventDetailClient({ eventId }: EventDetailClientProps) {
  const detail = useEventDetail(eventId);

  if (detail.loading || !detail.data || !detail.data.event) {
    return (
      <div className="flex-1 flex items-center justify-center text-violet-400">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  const { event, space, suppliers, catalogServices, staff, inventoryItems } = detail.data;

  return (
    <>
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <EventDetailHeader event={event} />
        <EventDetailTabs activeTab={detail.activeTab} onTabChange={detail.setActiveTab} />

        <div className="flex-1 overflow-auto p-8">
          {detail.activeTab === 'overview' && <OverviewTab event={event} space={space} onNavigateTab={detail.setActiveTab} />}
          {detail.activeTab === 'services' && (
            <ServicesTab
              eventServices={event.eventServices}
              onOpenWorkOrder={detail.openServiceWorkOrder}
              onOpenAddService={() => detail.setIsAddServiceOpen(true)}
            />
          )}
          {detail.activeTab === 'guests' && (
            <GuestsTab
              guests={event.guests}
              guestName={detail.guestName}
              setGuestName={detail.setGuestName}
              guestEmail={detail.guestEmail}
              setGuestEmail={detail.setGuestEmail}
              addingGuest={detail.addingGuest}
              onAddGuest={detail.handleAddGuest}
            />
          )}
          {detail.activeTab === 'tasks' && <TasksTab allEventTasks={detail.allEventTasks} />}
          {detail.activeTab === 'finance' && (
            <FinanceTab
              scheduledPayments={event.booking.scheduledPayments}
              expenses={event.expenses}
              eventServices={event.eventServices}
              discount={event.booking.discount || 0}
            />
          )}
          {detail.activeTab === 'documents' && <DocumentsTab event={event} />}
        </div>
      </main>

      {detail.selectedService && (
        <ServiceWorkOrderModal
          selectedService={detail.selectedService}
          workOrderStatus={detail.workOrderStatus}
          setWorkOrderStatus={detail.setWorkOrderStatus}
          customFields={detail.customFields}
          setCustomFields={detail.setCustomFields}
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
