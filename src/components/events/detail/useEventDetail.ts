import { useEffect, useState } from 'react';
import {
  EventDetailApiResponse,
  EventServiceWithRelations,
  TabId,
} from './types';

export function useEventDetail(id: string) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<EventDetailApiResponse | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('services');

  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [workOrderStatus, setWorkOrderStatus] = useState('');
  const [sellingPrice, setSellingPrice] = useState('0');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [supplierCost, setSupplierCost] = useState('0');
  const [supplierStatus, setSupplierStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('UNPAID');
  const [savingWorkOrder, setSavingWorkOrder] = useState(false);
  const [workOrderError, setWorkOrderError] = useState('');

  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [selectedInventoryId, setSelectedInventoryId] = useState('');
  const [reserveQuantity, setReserveQuantity] = useState('1');

  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [catalogServiceId, setCatalogServiceId] = useState('');
  const [customSellingPrice, setCustomSellingPrice] = useState('');
  const [customCost, setCustomCost] = useState('');
  const [addingService, setAddingService] = useState(false);

  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPlusOnes, setGuestPlusOnes] = useState(0);
  const [addingGuest, setAddingGuest] = useState(false);

  const selectedService: EventServiceWithRelations | null =
    (selectedServiceId && data?.event.bookingServices.find((es) => es.id === selectedServiceId)) || null;

  const reloadEvent = async () => {
    try {
      const res = await fetch(`/api/events/${id}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch(`/api/events/${id}`);
        const json = await res.json();
        if (active) {
          setData(json);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [id]);

  const openServiceWorkOrder = (es: EventServiceWithRelations) => {
    setSelectedServiceId(es.id);
    setWorkOrderStatus(es.status || 'PLANNING');
    setSellingPrice(String(es.sellingPrice || 0));
    setSupplierId(es.supplierId || '');
    setSupplierCost(String(es.supplierCost || es.cost || 0));
    setSupplierStatus(es.supplierStatus || 'REQUESTED');
    setPaymentStatus(es.paymentStatus || 'UNPAID');
    setSelectedStaffId('');
    setSelectedInventoryId('');
    setReserveQuantity('1');
    setWorkOrderError('');
  };

  const closeServiceWorkOrder = () => {
    setSelectedServiceId(null);
    setWorkOrderError('');
  };

  const handleSaveWorkOrder = async () => {
    if (!selectedService) return;
    setSavingWorkOrder(true);
    try {
      await fetch(`/api/events/${id}/services`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventServiceId: selectedService.id,
          status: workOrderStatus,
          sellingPrice,
          supplierId: supplierId || null,
          supplierCost,
          cost: supplierCost,
          supplierStatus,
          paymentStatus,
        }),
      });
      setSelectedServiceId(null);
      await reloadEvent();
    } catch (err) {
      console.error('Failed to save work order:', err);
    } finally {
      setSavingWorkOrder(false);
    }
  };

  const handleAddServiceToEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catalogServiceId) return;
    setAddingService(true);
    try {
      await fetch(`/api/events/${id}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: catalogServiceId,
          sellingPrice: customSellingPrice,
          cost: customCost,
        }),
      });
      setIsAddServiceOpen(false);
      setCatalogServiceId('');
      setCustomSellingPrice('');
      setCustomCost('');
      await reloadEvent();
    } catch (err) {
      console.error(err);
    } finally {
      setAddingService(false);
    }
  };

  const toggleTaskCompleted = async (taskId: string) => {
    if (!selectedService) return;
    const task = selectedService.serviceTasks.find((t) => t.id === taskId);
    if (!task) return;
    try {
      await fetch(`/api/events/${id}/services/${selectedService.id}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: task.status === 'DONE' ? 'PENDING' : 'DONE' }),
      });
      await reloadEvent();
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  // Same PATCH as toggleTaskCompleted, but for the aggregated Tasks tab — that view spans every
  // service on the event, not just whichever one's work order modal happens to be open, so it
  // addresses the target service directly instead of relying on `selectedService`.
  const toggleTaskCompletedGlobal = async (eventServiceId: string, taskId: string, currentStatus: string) => {
    try {
      await fetch(`/api/events/${id}/services/${eventServiceId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: currentStatus === 'DONE' ? 'PENDING' : 'DONE' }),
      });
      await reloadEvent();
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  const handleAddTask = async () => {
    if (!selectedService || !newTaskTitle.trim()) return;
    try {
      await fetch(`/api/events/${id}/services/${selectedService.id}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTaskTitle.trim() }),
      });
      setNewTaskTitle('');
      await reloadEvent();
    } catch (err) {
      console.error('Failed to add task:', err);
    }
  };

  const handleRemoveTask = async (taskId: string) => {
    if (!selectedService) return;
    try {
      await fetch(`/api/events/${id}/services/${selectedService.id}/tasks/${taskId}`, { method: 'DELETE' });
      await reloadEvent();
    } catch (err) {
      console.error('Failed to remove task:', err);
    }
  };

  const handleAssignStaff = async () => {
    if (!selectedService || !selectedStaffId) return;
    setWorkOrderError('');
    try {
      const res = await fetch(`/api/events/${id}/services/${selectedService.id}/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId: selectedStaffId }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setWorkOrderError(json.error || 'Failed to assign staff.');
        return;
      }
      setSelectedStaffId('');
      await reloadEvent();
    } catch (err) {
      console.error('Failed to assign staff:', err);
    }
  };

  const handleUnassignStaff = async (assignmentId: string) => {
    if (!selectedService) return;
    try {
      await fetch(`/api/events/${id}/services/${selectedService.id}/staff/${assignmentId}`, { method: 'DELETE' });
      await reloadEvent();
    } catch (err) {
      console.error('Failed to unassign staff:', err);
    }
  };

  const handleReserveInventoryItem = async (options?: { inventoryItemId?: string; quantity?: number; resourceRequirementId?: string }) => {
    if (!selectedService) return;
    const itemId = options?.inventoryItemId ?? selectedInventoryId;
    if (!itemId) return;
    const qty = options?.quantity ?? parseInt(reserveQuantity || '0', 10);
    if (!qty || qty <= 0) return;
    setWorkOrderError('');
    try {
      const res = await fetch(`/api/events/${id}/services/${selectedService.id}/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inventoryItemId: itemId,
          quantity: qty,
          resourceRequirementId: options?.resourceRequirementId,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setWorkOrderError(json.error || 'Failed to reserve inventory.');
        return;
      }
      setSelectedInventoryId('');
      setReserveQuantity('1');
      await reloadEvent();
    } catch (err) {
      console.error('Failed to reserve inventory:', err);
    }
  };

  const handleRemoveReservedInventory = async (reservationId: string) => {
    if (!selectedService) return;
    try {
      await fetch(`/api/events/${id}/services/${selectedService.id}/inventory/${reservationId}`, { method: 'DELETE' });
      await reloadEvent();
    } catch (err) {
      console.error('Failed to release inventory reservation:', err);
    }
  };

  /** Advances a reservation through Confirm/Allocate/Use/Return/Release/Cancel (Phase 15). */
  const handleReservationAction = async (reservationId: string, action: string) => {
    if (!selectedService) return;
    setWorkOrderError('');
    try {
      const res = await fetch(`/api/events/${id}/services/${selectedService.id}/inventory/${reservationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setWorkOrderError(json.error || 'Failed to update reservation.');
        return;
      }
      await reloadEvent();
    } catch (err) {
      console.error('Failed to transition inventory reservation:', err);
    }
  };

  /** Fulfills a resource requirement by reusing another service's already-active reservation
   * (Phase 17) instead of creating a new one — no InventoryReservation/Transaction is created here,
   * only the requirement's own `providedQuantity`/`reuseReservationId` bookkeeping changes. */
  const handleReuseReservation = async (resourceRequirementId: string, reuseReservationId: string, quantity: number) => {
    if (!selectedService) return;
    setWorkOrderError('');
    try {
      const res = await fetch(`/api/events/${id}/services/${selectedService.id}/inventory/reuse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resourceRequirementId, reuseReservationId, quantity }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setWorkOrderError(json.error || 'Failed to reuse reservation.');
        return;
      }
      await reloadEvent();
    } catch (err) {
      console.error('Failed to reuse inventory reservation:', err);
    }
  };

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;
    setAddingGuest(true);
    try {
      await fetch(`/api/events/${id}/guests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: guestName, email: guestEmail, plusOnes: guestPlusOnes }),
      });
      setGuestName('');
      setGuestEmail('');
      setGuestPlusOnes(0);
      await reloadEvent();
    } catch (err) {
      console.error(err);
    } finally {
      setAddingGuest(false);
    }
  };

  return {
    loading,
    data,
    activeTab,
    setActiveTab,

    selectedService,
    workOrderStatus,
    setWorkOrderStatus,
    sellingPrice,
    setSellingPrice,
    newTaskTitle,
    setNewTaskTitle,
    supplierId,
    setSupplierId,
    supplierCost,
    setSupplierCost,
    supplierStatus,
    setSupplierStatus,
    paymentStatus,
    setPaymentStatus,
    savingWorkOrder,
    workOrderError,
    openServiceWorkOrder,
    closeServiceWorkOrder,
    handleSaveWorkOrder,
    toggleTaskCompleted,
    toggleTaskCompletedGlobal,
    handleAddTask,
    handleRemoveTask,

    selectedStaffId,
    setSelectedStaffId,
    handleAssignStaff,
    handleUnassignStaff,

    selectedInventoryId,
    setSelectedInventoryId,
    reserveQuantity,
    setReserveQuantity,
    handleReserveInventoryItem,
    handleRemoveReservedInventory,
    handleReservationAction,
    handleReuseReservation,

    isAddServiceOpen,
    setIsAddServiceOpen,
    catalogServiceId,
    setCatalogServiceId,
    customSellingPrice,
    setCustomSellingPrice,
    customCost,
    setCustomCost,
    addingService,
    handleAddServiceToEvent,

    guestName,
    setGuestName,
    guestEmail,
    setGuestEmail,
    guestPlusOnes,
    setGuestPlusOnes,
    addingGuest,
    handleAddGuest,
  };
}
