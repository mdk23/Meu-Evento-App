import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Client, ServiceItem, SpaceItem, CartItem, CatalogPackage, BookingPOSTerminalProps } from './types';
import { defaultSpaces, defaultCatalogServices } from './constants';
import { generateMilestones, validatePaymentPlan, MilestoneDraft, PaymentPlanId } from '@/lib/payment-plan';
import { isOverCapacity } from '@/lib/capacity';

/** Combines a `yyyy-mm-dd` date string with an `HH:mm` time string into a local `Date`. */
function combineDateAndTime(dateStr: string, timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const d = new Date(`${dateStr}T00:00:00`);
  d.setHours(hours || 0, minutes || 0, 0, 0);
  return d;
}

export function useBookingPOS({
  initialClients = [],
  initialServices = [],
  initialSpaces = [],
  initialBookings = [],
  initialBookingData = null,
  initialPackages = [],
  initialDate,
}: BookingPOSTerminalProps) {
  const router = useRouter();

  // 1. Client & Event State
  const [selectedClientId, setSelectedClientId] = useState<string>(initialBookingData?.clientId || 'NEW');
  const [clientName, setClientName] = useState(initialBookingData?.client?.name || initialBookingData?.clientName || '');
  const [clientPhone, setClientPhone] = useState(initialBookingData?.client?.phone || '');
  const [clientEmail, setClientEmail] = useState(initialBookingData?.client?.email || '');

  // Local copy of the client directory — a client created via the "New Client" modal needs to be
  // selectable immediately, without a full page reload re-fetching `initialClients` from the server.
  const [clientsList, setClientsList] = useState<Client[]>(initialClients);

  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [creatingClient, setCreatingClient] = useState(false);

  const openNewClientModal = () => setIsNewClientModalOpen(true);
  const closeNewClientModal = () => setIsNewClientModalOpen(false);

  // Same form as the Client Directory's Add/Edit modal (`ClientFormModal`) — the values shape
  // matches its `ClientFormValues`, just created here instead of imported to avoid a cross-feature
  // type-only dependency for one interface.
  const handleCreateClient = async (values: { name: string; email: string; phone: string; companyName: string; notes: string }) => {
    if (!values.name.trim()) {
      toast.error('Client name is required.');
      return;
    }
    setCreatingClient(true);
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to create client.');
        return;
      }
      const created: Client = data.client;
      setClientsList(prev => [...prev, created]);
      setSelectedClientId(created.id);
      setClientName(created.name);
      setClientPhone(created.phone || '');
      setClientEmail(created.email || '');
      setIsNewClientModalOpen(false);
      toast.success(`Client "${created.name}" created and selected.`);
    } catch (err) {
      console.error(err);
      toast.error('Connection error.');
    } finally {
      setCreatingClient(false);
    }
  };

  const [eventTitle, setEventTitle] = useState(initialBookingData?.event?.name || initialBookingData?.title || '');
  const [eventType, setEventType] = useState(initialBookingData?.bookingType || '');
  const [guestCount, setGuestCount] = useState<number>(initialBookingData?.guestCount || 1);

  const [eventDate, setEventDate] = useState(
    initialBookingData?.eventDate
      ? new Date(initialBookingData.eventDate).toISOString().split('T')[0]
      : initialDate || ''
  );
  const [depositDueDate, setDepositDueDate] = useState(initialBookingData?.depositDueDate ? new Date(initialBookingData.depositDueDate).toISOString().split('T')[0] : '');

  // Interactive calendar month selection
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    if (initialBookingData?.eventDate) return new Date(initialBookingData.eventDate);
    // `initialDate` is a plain `YYYY-MM-DD` string representing a local calendar day (e.g. from
    // the calendar's day view) — parsed via explicit local components rather than
    // `new Date(dateOnlyString)`, which the spec treats as UTC midnight and can land on the wrong
    // day in negative-UTC-offset timezones.
    if (initialDate) {
      const [y, m, d] = initialDate.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date();
  });
  const [isWaitingList, setIsWaitingList] = useState(initialBookingData?.status === 'WAITING_LIST');

  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('02:00');
  const [capacityOverrideReason, setCapacityOverrideReason] = useState('');

  // Real reservation window for the space — combines the event date with the selected start/end
  // time, wrapping to the next calendar day when the end time is earlier than the start time
  // (e.g. an 18:00–02:00 range spans midnight).
  const { startAt, endAt } = useMemo(() => {
    if (!eventDate) return { startAt: null as Date | null, endAt: null as Date | null };
    const start = combineDateAndTime(eventDate, startTime);
    let end = combineDateAndTime(eventDate, endTime);
    if (end.getTime() <= start.getTime()) {
      end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
    }
    return { startAt: start, endAt: end };
  }, [eventDate, startTime, endTime]);

  // Spaces List
  const spacesList = useMemo(() => {
    return initialSpaces.length > 0
      ? initialSpaces.map(s => ({
          id: s.id,
          name: s.name,
          capacity: s.capacity || 200,
          price: 50000,
          description: s.description || 'Exclusive space for events.',
        }))
      : defaultSpaces;
  }, [initialSpaces]);

  // Selected space
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>('');

  // There's one real Space per tenant — its capacity is what guestCount is checked against.
  const spaceCapacity = spacesList[0]?.capacity || 0;
  const overCapacity = isOverCapacity(guestCount, spaceCapacity);

  // 2. Catalog Services State
  const catalogServices = useMemo(() => {
    if (initialServices.length === 0) return defaultCatalogServices;
    return initialServices.map((s, idx) => ({
      id: s.id,
      name: s.name,
      category: (s.category === 'SPACE' || idx % 2 === 0 ? 'SPACE' : 'EVENT') as 'SPACE' | 'EVENT',
      providerType: (s.defaultExecutionType === 'EXTERNAL' ? 'EXTERNAL' : 'INTERNAL') as 'INTERNAL' | 'EXTERNAL',
      providerName: s.defaultExecutionType === 'EXTERNAL' ? 'External Supplier' : 'Internal Venue',
      priceType: (s.priceType === 'PER_GUEST' ? 'PER_GUEST' : s.priceType === 'HOURLY' ? 'HOURLY' : 'FIXED') as 'FIXED' | 'PER_GUEST' | 'HOURLY',
      price: s.defaultPrice || 15000,
      description: 'Specialized service for your event.',
    }));
  }, [initialServices]);

  // Space Services derived directly from catalogServices (Category: SPACE)
  const spaceServices = useMemo(() => {
    return catalogServices.filter(s => s.category === 'SPACE');
  }, [catalogServices]);

  // Search & Filter state for catalog
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'SPACE' | 'EVENT'>('ALL');
  const [originFilter, setOriginFilter] = useState<'ALL' | 'INTERNAL' | 'EXTERNAL'>('ALL');

  // 3. POS Cart State (Selected items)
  const [selectedItems, setSelectedItems] = useState<CartItem[]>(() => {
    if (initialBookingData?.eventServices) {
      return initialBookingData.eventServices.map((es) => {
        const qty = es.service?.priceType === 'PER_GUEST' ? (initialBookingData.guestCount || 1) : 1;
        const unitPrice = es.sellingPrice > 0 ? (es.sellingPrice / qty) : (es.service?.defaultPrice || 0);
        return {
          id: `cart-${es.serviceId}-${Date.now()}-${Math.random()}`,
          serviceId: es.serviceId,
          name: es.service?.name || 'Service',
          category: (es.service?.category === 'Space Rental' || es.service?.category === 'SPACE') ? 'SPACE' : 'EVENT',
          providerType: es.providerType || es.service?.defaultExecutionType || 'INTERNAL',
          providerName: es.providerType === 'EXTERNAL' || es.service?.defaultExecutionType === 'EXTERNAL' ? 'External Supplier' : 'Internal Venue',
          priceType: (es.service?.priceType === 'PER_GUEST' || es.service?.priceType === 'HOURLY' ? es.service.priceType : 'FIXED') as CartItem['priceType'],
          price: unitPrice,
          quantity: qty,
          totalPrice: es.sellingPrice || 0,
        };
      });
    }
    return [];
  });

  const [discount, setDiscount] = useState<number>(initialBookingData?.discount || 0);
  const [depositPercent, setDepositPercent] = useState<number>(50);
  const [paymentPlanId, setPaymentPlanId] = useState<PaymentPlanId>('3');
  const [customMilestones, setCustomMilestones] = useState<MilestoneDraft[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Sync Space Selection with Cart Item using real catalog service
  const handleSelectSpace = (service: ServiceItem) => {
    setSelectedSpaceId(service.id);
    toggleCatalogService(service);
  };

  // Toggle Catalog Service Selection
  const toggleCatalogService = (service: ServiceItem) => {
    const existingIndex = selectedItems.findIndex(i => i.serviceId === service.id || i.name === service.name);
    if (existingIndex >= 0) {
      setSelectedItems(prev => prev.filter((_, idx) => idx !== existingIndex));
      toast.info(`Item "${service.name}" removed.`);
    } else {
      const qty = service.priceType === 'PER_GUEST' ? guestCount : 1;
      const newItem: CartItem = {
        id: `cart-${service.id}-${Date.now()}`,
        serviceId: service.id,
        name: service.name,
        category: service.category,
        providerType: service.providerType,
        providerName: service.providerName || (service.providerType === 'INTERNAL' ? 'Internal Venue' : 'External Supplier'),
        priceType: service.priceType,
        price: service.price,
        quantity: qty,
        totalPrice: service.price * qty,
      };
      setSelectedItems(prev => [...prev, newItem]);
      toast.success(`Service "${service.name}" added!`);
    }
  };

  // Packages the user has explicitly clicked "Add Package" on — separate from cart content, because
  // two packages can share a service (e.g. a "basic" package whose one service is also part of a
  // "deluxe" one). Deriving "Added" purely from "are all this package's services in the cart" made
  // the smaller package light up as Added the moment the bigger one was applied, even though it was
  // never clicked — this tracks the actual click instead. `isPackageApplied` below still re-verifies
  // against live cart content, so removing a shared line un-marks every package it belonged to.
  const [appliedPackageIds, setAppliedPackageIds] = useState<Set<string>>(new Set());

  const isPackageApplied = (pkg: CatalogPackage) =>
    appliedPackageIds.has(pkg.id) && pkg.services.every(s => selectedItems.some(i => i.serviceId === s.serviceId));

  // Apply a package: expands into its ordinary catalog services in one action, resolved against
  // `catalogServices` (not the raw package data) so a package-added line is indistinguishable from
  // one added individually — same category/price/provider resolution, editable the same way
  // afterward. Idempotent — a service already in the cart is left untouched, never duplicated.
  const applyPackage = (pkg: CatalogPackage) => {
    setAppliedPackageIds(prev => new Set(prev).add(pkg.id));

    const existingServiceIds = new Set(selectedItems.map(i => i.serviceId));
    const toAdd = pkg.services
      .map(s => catalogServices.find(cs => cs.id === s.serviceId))
      .filter((cs): cs is ServiceItem => !!cs && !existingServiceIds.has(cs.id));

    if (toAdd.length === 0) {
      toast.info(`All services from "${pkg.name}" are already in the cart.`);
      return;
    }

    const newItems: CartItem[] = toAdd.map((service) => {
      const qty = service.priceType === 'PER_GUEST' ? guestCount : 1;
      return {
        id: `cart-${service.id}-${Date.now()}-${Math.random()}`,
        serviceId: service.id,
        name: service.name,
        category: service.category,
        providerType: service.providerType,
        providerName: service.providerName || (service.providerType === 'INTERNAL' ? 'Internal Venue' : 'External Supplier'),
        priceType: service.priceType,
        price: service.price,
        quantity: qty,
        totalPrice: service.price * qty,
      };
    });

    setSelectedItems(prev => [...prev, ...newItems]);
    toast.success(`Added ${newItems.length} service${newItems.length === 1 ? '' : 's'} from "${pkg.name}".`);
  };

  // Update item quantity on guest count changes
  React.useEffect(() => {
    setSelectedItems(prev =>
      prev.map(item => {
        if (item.priceType === 'PER_GUEST') {
          return {
            ...item,
            quantity: guestCount,
            totalPrice: item.price * guestCount,
          };
        }
        return item;
      })
    );
  }, [guestCount]);

  const removeItemFromCart = (id: string) => {
    setSelectedItems(prev => prev.filter(i => i.id !== id));
    toast.info('Item removed.');
  };

  // Calculations
  const spaceServicesTotal = useMemo(() => {
    return selectedItems.filter(i => i.category === 'SPACE').reduce((acc, curr) => acc + curr.totalPrice, 0);
  }, [selectedItems]);

  const eventServicesTotal = useMemo(() => {
    return selectedItems.filter(i => i.category === 'EVENT').reduce((acc, curr) => acc + curr.totalPrice, 0);
  }, [selectedItems]);

  const internalRevenue = useMemo(() => {
    return selectedItems.filter(i => i.providerType === 'INTERNAL').reduce((acc, curr) => acc + curr.totalPrice, 0);
  }, [selectedItems]);

  const externalRepass = useMemo(() => {
    return selectedItems.filter(i => i.providerType === 'EXTERNAL').reduce((acc, curr) => acc + curr.totalPrice, 0);
  }, [selectedItems]);

  const subtotalBeforeDiscount = spaceServicesTotal + eventServicesTotal;
  const grandTotal = Math.max(0, subtotalBeforeDiscount - discount);

  // Payment plan: a preset plan (Full / 3 / 6 / 10 / 12) derives its milestone list live from
  // the total, deposit %, deposit due date, and event date; Custom hands full control to the user.
  // `now`/the default deposit-due fallback are captured once via lazy useState init rather than
  // called inline during render, since `Date.now()`/`new Date()` are impure.
  const [now] = useState(() => new Date());
  const [defaultDepositDueDate] = useState(() => new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000));
  const isEdit = !!initialBookingData;
  const milestones = useMemo(() => {
    if (paymentPlanId === 'CUSTOM') return customMilestones;
    const resolvedDepositDueDate = depositDueDate ? new Date(depositDueDate) : defaultDepositDueDate;
    const resolvedEventDate = eventDate ? new Date(eventDate) : resolvedDepositDueDate;
    return generateMilestones({
      totalAmount: grandTotal,
      depositPercent,
      planId: paymentPlanId,
      eventDate: resolvedEventDate,
      depositDueDate: resolvedDepositDueDate,
    });
  }, [paymentPlanId, customMilestones, grandTotal, depositPercent, eventDate, depositDueDate, defaultDepositDueDate]);

  const planValidation = useMemo(() => {
    const resolvedEventDate = eventDate ? new Date(eventDate) : now;
    return validatePaymentPlan({ milestones, totalAmount: grandTotal, eventDate: resolvedEventDate });
  }, [milestones, grandTotal, eventDate, now]);

  const depositAmount = milestones[0]?.amount || 0;

  const handlePlanChange = (newPlanId: PaymentPlanId) => {
    if (newPlanId === 'CUSTOM' && customMilestones.length === 0) {
      setCustomMilestones(milestones);
    }
    setPaymentPlanId(newPlanId);
  };

  const handleAddMilestone = () => {
    const allocated = customMilestones.reduce((acc, m) => acc + (m.amount || 0), 0);
    const remainder = Math.max(0, Math.round((grandTotal - allocated) * 100) / 100);
    setCustomMilestones((prev) => [
      ...prev,
      { name: `Payment ${prev.length + 1}`, amount: remainder, dueDate: eventDate || new Date().toISOString().split('T')[0] },
    ]);
  };

  const handleUpdateMilestone = (index: number, field: keyof MilestoneDraft, value: string) => {
    setCustomMilestones((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: field === 'amount' ? parseFloat(value || '0') : value } : m))
    );
  };

  const handleRemoveMilestone = (index: number) => {
    setCustomMilestones((prev) => prev.filter((_, i) => i !== index));
  };

  // Filter catalog
  const filteredCatalog = useMemo(() => {
    return catalogServices.filter(srv => {
      const matchesSearch = srv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            srv.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'ALL' || srv.category === categoryFilter;
      const matchesOrigin = originFilter === 'ALL' || srv.providerType === originFilter;
      return matchesSearch && matchesCategory && matchesOrigin;
    });
  }, [catalogServices, searchTerm, categoryFilter, originFilter]);

  // Calendar math helpers
  const calendarYear = calendarMonth.getFullYear();
  const calendarMonthIndex = calendarMonth.getMonth();

  const firstDayIndex = new Date(calendarYear, calendarMonthIndex, 1).getDay();
  const daysInCurrentMonth = new Date(calendarYear, calendarMonthIndex + 1, 0).getDate();

  const calendarDaysArr: (number | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDaysArr.push(null);
  }
  for (let i = 1; i <= daysInCurrentMonth; i++) {
    calendarDaysArr.push(i);
  }

  // Get active bookings on a specific day of the currently displayed calendar month
  const getBookingsOnDay = (day: number) => {
    return initialBookings.filter((b) => {
      if (b.status === 'CANCELLED') return false;
      const d = new Date(b.eventDate);
      return d.getFullYear() === calendarYear && d.getMonth() === calendarMonthIndex && d.getDate() === day;
    });
  };

  // Check conflicts for the currently selected time range — same overlap rule the server uses:
  // existing.startAt < endAt AND existing.endAt > startAt. WAITING_LIST bookings never block.
  const selectedDateBookings = initialBookings.filter((b) => {
    if (b.status === 'CANCELLED' || b.status === 'WAITING_LIST') return false;
    if (initialBookingData && b.id === initialBookingData.id) return false;
    if (!startAt || !endAt) return false;
    const bStart = new Date(b.startAt).getTime();
    const bEnd = new Date(b.endAt).getTime();
    return bStart < endAt.getTime() && bEnd > startAt.getTime();
  });
  const hasConflict = selectedDateBookings.length > 0;

  // Submit Handler
  const handleSubmitPOS = async (targetStatus?: 'CONFIRMED' | 'RESERVED') => {
    if (!clientName.trim()) {
      toast.error('Please enter the client name.');
      return;
    }
    if (!eventDate) {
      toast.error('Please select the event date.');
      return;
    }
    if (!isEdit && !planValidation.valid) {
      toast.error(planValidation.errors[0] || 'Payment plan is invalid.');
      return;
    }

    const finalStatus = (hasConflict && isWaitingList) ? 'WAITING_LIST' : targetStatus;

    if (finalStatus === 'CONFIRMED' && overCapacity && !capacityOverrideReason.trim()) {
      toast.error(`Guest count (${guestCount}) exceeds the space's capacity (${spaceCapacity}). Provide an override reason to confirm.`);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        clientId: selectedClientId,
        newClient: {
          name: clientName,
          phone: clientPhone,
          email: clientEmail,
        },
        title: eventTitle,
        eventType,
        guestCount,
        eventDate,
        startAt: startAt?.toISOString(),
        endAt: endAt?.toISOString(),
        capacityOverrideReason: overCapacity ? capacityOverrideReason : undefined,
        selectedServices: selectedItems.map(item => ({
          serviceId: item.serviceId,
          name: item.name,
          category: item.category,
          providerType: item.providerType,
          priceType: item.priceType,
          price: item.price,
          quantity: item.quantity,
          totalPrice: item.totalPrice,
        })),
        totalAmount: grandTotal,
        discount,
        depositDueDate,
        milestones: isEdit ? undefined : milestones,
        status: finalStatus,
        isEdit,
      };

      const url = initialBookingData ? `/api/bookings/${initialBookingData.id}` : '/api/bookings';
      const method = initialBookingData ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(
          finalStatus === 'WAITING_LIST'
            ? 'Booking added to Waiting List!'
            : targetStatus === 'CONFIRMED'
            ? 'Booking confirmed with initial deposit!'
            : 'Booking created successfully!'
        );
        router.push('/bookings');
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Error processing booking.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Server connection failure.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setClientName('');
    setClientPhone('');
    setClientEmail('');
    setEventTitle('');
    setSelectedItems([]);
    setDiscount(0);
    toast.info('Form reset.');
  };

  return {
    // State
    selectedClientId,
    setSelectedClientId,
    clientName,
    setClientName,
    clientPhone,
    setClientPhone,
    clientEmail,
    setClientEmail,
    clientsList,
    isNewClientModalOpen,
    openNewClientModal,
    closeNewClientModal,
    creatingClient,
    handleCreateClient,
    eventTitle,
    setEventTitle,
    eventType,
    setEventType,
    guestCount,
    setGuestCount,
    eventDate,
    setEventDate,
    depositDueDate,
    setDepositDueDate,
    calendarMonth,
    setCalendarMonth,
    isWaitingList,
    setIsWaitingList,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    startAt,
    endAt,
    spaceCapacity,
    overCapacity,
    capacityOverrideReason,
    setCapacityOverrideReason,
    selectedSpaceId,
    spacesList,
    catalogServices,
    spaceServices,
    packages: initialPackages,
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    originFilter,
    setOriginFilter,
    selectedItems,
    discount,
    setDiscount,
    depositPercent,
    setDepositPercent,
    paymentPlanId,
    handlePlanChange,
    submitting,

    // Payment plan
    milestones,
    planValidation,
    depositAmount,
    handleAddMilestone,
    handleUpdateMilestone,
    handleRemoveMilestone,

    // Derived
    filteredCatalog,
    spaceServicesTotal,
    eventServicesTotal,
    internalRevenue,
    externalRepass,
    grandTotal,
    calendarYear,
    calendarMonthIndex,
    calendarDaysArr,
    getBookingsOnDay,
    hasConflict,
    selectedDateBookings,

    handleSelectSpace,
    toggleCatalogService,
    applyPackage,
    isPackageApplied,
    removeItemFromCart,
    handleSubmitPOS,
    resetForm,
    isEdit,
  };
}
