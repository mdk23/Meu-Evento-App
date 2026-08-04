import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Client, ServiceItem, SpaceItem, CartItem, BookingPOSTerminalProps } from './types';
import { defaultSpaces, defaultCatalogServices } from './constants';

export function useBookingPOS({
  initialClients = [],
  initialServices = [],
  initialSpaces = [],
  initialBookings = [],
  initialBookingData = null,
}: BookingPOSTerminalProps) {
  const router = useRouter();

  // 1. Client & Event State
  const [selectedClientId, setSelectedClientId] = useState<string>(initialBookingData?.clientId || 'NEW');
  const [clientName, setClientName] = useState(initialBookingData?.client?.name || initialBookingData?.clientName || '');
  const [clientPhone, setClientPhone] = useState(initialBookingData?.client?.phone || '');
  const [clientEmail, setClientEmail] = useState(initialBookingData?.client?.email || '');

  const [eventTitle, setEventTitle] = useState(initialBookingData?.event?.name || initialBookingData?.title || '');
  const [eventType, setEventType] = useState(initialBookingData?.bookingType || '');
  const [guestCount, setGuestCount] = useState<number>(initialBookingData?.guestCount || 1);

  const [eventDate, setEventDate] = useState(initialBookingData?.eventDate ? new Date(initialBookingData.eventDate).toISOString().split('T')[0] : '');
  const [depositDueDate, setDepositDueDate] = useState(initialBookingData?.depositDueDate ? new Date(initialBookingData.depositDueDate).toISOString().split('T')[0] : '');

  // Interactive calendar month selection
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => initialBookingData?.eventDate ? new Date(initialBookingData.eventDate) : new Date());
  const [isWaitingList, setIsWaitingList] = useState(initialBookingData?.status === 'WAITING_LIST');

  const [shift, setShift] = useState<'Lunch' | 'Dinner' | 'Full Day'>('Dinner');
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('02:00');

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

  // 2. Catalog Services State
  const catalogServices = useMemo(() => {
    if (initialServices.length === 0) return defaultCatalogServices;
    return initialServices.map((s, idx) => ({
      id: s.id,
      name: s.name,
      category: (s.category === 'SPACE' || idx % 2 === 0 ? 'SPACE' : 'EVENT') as 'SPACE' | 'EVENT',
      providerType: (s.executionType === 'EXTERNAL' ? 'EXTERNAL' : 'INTERNAL') as 'INTERNAL' | 'EXTERNAL',
      providerName: s.executionType === 'EXTERNAL' ? 'External Supplier' : 'Internal Venue',
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
    if (initialBookingData?.event?.eventServices) {
      return initialBookingData.event.eventServices.map((es) => {
        const qty = es.service?.priceType === 'PER_GUEST' ? (initialBookingData.guestCount || 1) : 1;
        const unitPrice = es.sellingPrice > 0 ? (es.sellingPrice / qty) : (es.service?.defaultPrice || 0);
        return {
          id: `cart-${es.serviceId}-${Date.now()}-${Math.random()}`,
          serviceId: es.serviceId,
          name: es.service?.name || 'Service',
          category: (es.service?.category === 'Space Rental' || es.service?.category === 'SPACE') ? 'SPACE' : 'EVENT',
          providerType: es.providerType || es.service?.executionType || 'INTERNAL',
          providerName: es.providerType === 'EXTERNAL' || es.service?.executionType === 'EXTERNAL' ? 'External Supplier' : 'Internal Venue',
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
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(initialBookingData?.downPaymentPercent || 50);
  const [installmentCount, setInstallmentCount] = useState<number>(initialBookingData?.installmentCount || 1);
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

  const downPaymentAmount = (grandTotal * downPaymentPercent) / 100;
  const remainingBalance = grandTotal - downPaymentAmount;
  const monthlyInstallment = installmentCount > 1 ? remainingBalance / (installmentCount - 1) : remainingBalance;

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

  // Check conflicts for currently selected eventDate
  const selectedDateBookings = initialBookings.filter((b) => {
    if (b.status === 'CANCELLED') return false;
    if (initialBookingData && b.id === initialBookingData.id) return false;
    const bDate = new Date(b.eventDate).toISOString().split('T')[0];
    return bDate === eventDate;
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

    const finalStatus = (hasConflict && isWaitingList) ? 'WAITING_LIST' : targetStatus;

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
        downPaymentAmount,
        downPaymentPercent,
        depositDueDate,
        installmentCount,
        installmentAmount: monthlyInstallment,
        status: finalStatus,
        isEdit: !!initialBookingData,
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
    selectedSpaceId,
    spacesList,
    catalogServices,
    spaceServices,
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    originFilter,
    setOriginFilter,
    selectedItems,
    discount,
    setDiscount,
    downPaymentPercent,
    setDownPaymentPercent,
    installmentCount,
    setInstallmentCount,
    submitting,

    // Derived
    filteredCatalog,
    spaceServicesTotal,
    eventServicesTotal,
    internalRevenue,
    externalRepass,
    grandTotal,
    downPaymentAmount,
    monthlyInstallment,
    calendarYear,
    calendarMonthIndex,
    calendarDaysArr,
    getBookingsOnDay,
    hasConflict,
    selectedDateBookings,

    handleSelectSpace,
    toggleCatalogService,
    removeItemFromCart,
    handleSubmitPOS,
    resetForm,
    isEdit: !!initialBookingData,
  };
}
