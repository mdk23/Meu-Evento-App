import { useEffect, useState } from 'react';
import {
  EventDetailApiResponse,
  EventServiceWithRelations,
  TabId,
  WorkOrderCustomFields,
  WorkOrderTask,
} from './types';

export function useEventDetail(id: string) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<EventDetailApiResponse | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('services');

  const [selectedService, setSelectedService] = useState<EventServiceWithRelations | null>(null);
  const [workOrderStatus, setWorkOrderStatus] = useState('');
  const [customFields, setCustomFields] = useState<WorkOrderCustomFields>({});
  const [tasks, setTasks] = useState<WorkOrderTask[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [supplierCost, setSupplierCost] = useState('0');
  const [supplierStatus, setSupplierStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('UNPAID');
  const [savingWorkOrder, setSavingWorkOrder] = useState(false);

  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [catalogServiceId, setCatalogServiceId] = useState('');
  const [customSellingPrice, setCustomSellingPrice] = useState('');
  const [customCost, setCustomCost] = useState('');
  const [addingService, setAddingService] = useState(false);

  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [addingGuest, setAddingGuest] = useState(false);

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
    setSelectedService(es);
    setWorkOrderStatus(es.status || 'PLANNING');
    try {
      setCustomFields(es.customFields ? JSON.parse(es.customFields) : {});
    } catch {
      setCustomFields({});
    }
    try {
      setTasks(es.tasks ? JSON.parse(es.tasks) : []);
    } catch {
      setTasks([]);
    }
    setSupplierId(es.supplierId || '');
    setSupplierCost(String(es.supplierCost || es.cost || 0));
    setSupplierStatus(es.supplierStatus || 'REQUESTED');
    setPaymentStatus(es.paymentStatus || 'UNPAID');
  };

  const closeServiceWorkOrder = () => setSelectedService(null);

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
          customFields,
          tasks,
          supplierId: supplierId || null,
          supplierCost,
          cost: supplierCost,
          supplierStatus,
          paymentStatus,
        }),
      });
      setSelectedService(null);
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

  const toggleTaskCompleted = (taskId: string) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t)));
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    const newTask: WorkOrderTask = {
      id: String(Date.now()),
      title: newTaskTitle.trim(),
      completed: false,
    };
    setTasks((prev) => [...prev, newTask]);
    setNewTaskTitle('');
  };

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;
    setAddingGuest(true);
    try {
      await fetch(`/api/events/${id}/guests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: guestName, email: guestEmail }),
      });
      setGuestName('');
      setGuestEmail('');
      await reloadEvent();
    } catch (err) {
      console.error(err);
    } finally {
      setAddingGuest(false);
    }
  };

  const allEventTasks: (WorkOrderTask & { serviceName?: string; providerType?: string })[] = [];
  if (data?.event) {
    data.event.eventServices.forEach((es) => {
      try {
        const parsed: WorkOrderTask[] = es.tasks ? JSON.parse(es.tasks) : [];
        parsed.forEach((t) => {
          allEventTasks.push({
            ...t,
            serviceName: es.service?.name,
            providerType: es.providerType,
          });
        });
      } catch {
        // ignore malformed task JSON for this service
      }
    });
  }

  return {
    loading,
    data,
    activeTab,
    setActiveTab,

    selectedService,
    workOrderStatus,
    setWorkOrderStatus,
    customFields,
    setCustomFields,
    tasks,
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
    openServiceWorkOrder,
    closeServiceWorkOrder,
    handleSaveWorkOrder,
    toggleTaskCompleted,
    handleAddTask,

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
    addingGuest,
    handleAddGuest,

    allEventTasks,
  };
}
