import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Client, ServiceItem, CartItem, CatalogPackage, BookingPOSTerminalProps } from './types';
import { defaultVenues, defaultCatalogServices } from './constants';
import { generateMilestones, validatePaymentPlan, MilestoneDraft, PaymentPlanId } from '@/lib/payment-plan';
import { isOverCapacity } from '@/lib/capacity';
import { computeBookingPackageCapacityGap } from '@/lib/seating';

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
  initialVenues = [],
  initialBookings = [],
  initialBookingData = null,
  initialPackages = [],
  initialDate,
  initialKind = 'EVENT',
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

  // Real reservation window for the venue — combines the event date with the selected start/end
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

  // Venues List
  const venuesList = useMemo(() => {
    return initialVenues.length > 0
      ? initialVenues.map(s => ({
          id: s.id,
          name: s.name,
          capacity: s.capacity || 200,
          price: 50000,
          description: s.description || 'Exclusive venue for events.',
        }))
      : defaultVenues;
  }, [initialVenues]);

  // Selected venue
  const [selectedVenueId, setSelectedVenueId] = useState<string>('');

  // There's one real Venue per tenant — its capacity is what guestCount is checked against.
  const venueCapacity = venuesList[0]?.capacity || 0;
  const overCapacity = isOverCapacity(guestCount, venueCapacity);

  // 2. Catalog Services State
  const catalogServices = useMemo(() => {
    if (initialServices.length === 0) return defaultCatalogServices;
    return initialServices.map((s) => ({
      id: s.id,
      name: s.name,
      // A BOTH-context service is bucketed into whichever workspace this booking is for, since the
      // existing Venue/Event cost-total split only has two buckets and "shared, but counted here in
      // this booking" is the correct read of BOTH.
      category: (s.context === 'BOTH' ? initialKind : s.context) as 'VENUE' | 'EVENT',
      providerType: (s.defaultProviderType === 'EXTERNAL' ? 'EXTERNAL' : 'INTERNAL') as 'INTERNAL' | 'EXTERNAL',
      providerName: s.defaultProviderType === 'EXTERNAL' ? 'External Supplier' : 'Internal Venue',
      priceType: (s.priceType === 'PER_GUEST' ? 'PER_GUEST' : s.priceType === 'PER_HOUR' ? 'PER_HOUR' : 'FIXED') as 'FIXED' | 'PER_GUEST' | 'PER_HOUR',
      price: s.defaultPrice || 15000,
      description: 'Specialized service for your event.',
    }));
  }, [initialServices, initialKind]);

  // Venue Services derived directly from catalogServices (Category: VENUE)
  const venueServices = useMemo(() => {
    return catalogServices.filter(s => s.category === 'VENUE');
  }, [catalogServices]);

  // Search & Filter state for catalog
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'VENUE' | 'EVENT'>('ALL');
  const [originFilter, setOriginFilter] = useState<'ALL' | 'INTERNAL' | 'EXTERNAL'>('ALL');

  // 3. POS Cart State (Selected items)
  const [selectedItems, setSelectedItems] = useState<CartItem[]>(() => {
    if (initialBookingData?.bookingServices) {
      const packagesById = new Map(
        (initialBookingData.bookingPackages || []).map((bp) => [bp.id, bp])
      );
      return initialBookingData.bookingServices.map((es) => {
        const isPackageSourced = es.source === 'PACKAGE' || !!es.bookingPackageId;
        // A DIRECT PER_GUEST line tracks the live guest count (kept in sync by the effect below);
        // a PACKAGE-sourced line is frozen at its persisted quantity (§2/§24/§34); everything else
        // reads its real persisted quantity so a fixed-price multi-unit line survives edit-reload.
        const qty =
          !isPackageSourced && es.service?.priceType === 'PER_GUEST'
            ? (initialBookingData.guestCount || 1)
            : (es.quantity || 1);
        const unitPrice = es.unitPrice > 0 ? es.unitPrice : (es.sellingPrice > 0 ? (es.sellingPrice / qty) : (es.service?.defaultPrice || 0));
        const sourcePackage = es.bookingPackageId ? packagesById.get(es.bookingPackageId) : undefined;
        return {
          id: `cart-${es.serviceId}-${Date.now()}-${Math.random()}`,
          serviceId: es.serviceId,
          name: es.service?.name || es.serviceNameSnapshot || 'Service',
          category: (es.service?.category === 'Venue Rental' || es.service?.category === 'VENUE') ? 'VENUE' : 'EVENT',
          providerType: es.providerType || es.service?.defaultProviderType || 'INTERNAL',
          providerName: es.providerType === 'EXTERNAL' || es.service?.defaultProviderType === 'EXTERNAL' ? 'External Supplier' : 'Internal Venue',
          priceType: (es.service?.priceType === 'PER_GUEST' || es.service?.priceType === 'PER_HOUR' ? es.service.priceType : 'FIXED') as CartItem['priceType'],
          price: unitPrice,
          quantity: qty,
          totalPrice: es.sellingPrice || 0,
          source: (isPackageSourced ? 'PACKAGE' : 'DIRECT') as CartItem['source'],
          bookingServiceId: es.id,
          sourceBookingPackageId: es.bookingPackageId || undefined,
          sourcePackageId: sourcePackage?.packageId,
          sourcePackageName: sourcePackage?.nameSnapshot,
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

  // Sync Venue Selection with Cart Item using real catalog service
  const handleSelectVenue = (service: ServiceItem) => {
    setSelectedVenueId(service.id);
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
      .map(s => {
        const catalogService = catalogServices.find(cs => cs.id === s.serviceId);
        return catalogService ? { catalogService, packageItem: s } : null;
      })
      .filter((entry): entry is { catalogService: ServiceItem; packageItem: CatalogPackage['services'][number] } =>
        !!entry && !existingServiceIds.has(entry.catalogService.id)
      );

    if (toAdd.length === 0) {
      toast.info(`All services from "${pkg.name}" are already in the cart.`);
      return;
    }

    // Groups every line this one click adds so a real `BookingPackage` snapshot can be reconstructed
    // from the cart at submit time (see `CartItem.packageApplicationKey` doc comment).
    const packageApplicationKey = `pkg-app-${pkg.id}-${Date.now()}-${Math.random()}`;

    const newItems: CartItem[] = toAdd.map(({ catalogService: service, packageItem }) => {
      // A package can bundle a specific quantity (e.g. "300 chairs") and/or override the service's
      // normal price for this bundle — both fall back to the plain catalog values when unset.
      const qty = service.priceType === 'PER_GUEST' ? guestCount : (packageItem.quantity || 1);
      const unitPrice = packageItem.priceOverride ?? service.price;
      return {
        id: `cart-${service.id}-${Date.now()}-${Math.random()}`,
        serviceId: service.id,
        name: service.name,
        category: service.category,
        providerType: service.providerType,
        providerName: service.providerName || (service.providerType === 'INTERNAL' ? 'Internal Venue' : 'External Supplier'),
        priceType: service.priceType,
        price: unitPrice,
        quantity: qty,
        totalPrice: unitPrice * qty,
        sourcePackageId: pkg.id,
        sourcePackageName: pkg.name,
        packageApplicationKey,
      };
    });

    setSelectedItems(prev => [...prev, ...newItems]);
    toast.success(`Added ${newItems.length} service${newItems.length === 1 ? '' : 's'} from "${pkg.name}".`);
  };

  // Update item quantity on guest count changes — DIRECT (catalog-added) PER_GUEST lines only.
  // Package-sourced lines are frozen at the quantities they were applied with (§2/§24/§34); a
  // guest-count change over an applied package's capacity surfaces as `packageCapacityWarnings`
  // below, and the operator covers the gap with a separate additional service.
  React.useEffect(() => {
    setSelectedItems(prev =>
      prev.map(item => {
        if (item.sourcePackageId) return item;
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

  // Warn (never auto-fix) when the booking's guest count exceeds an applied package's designed
  // capacity — the operator adds additional services to cover the gap, the package is left frozen.
  const packageCapacityWarnings = useMemo(() => {
    const appliedPackageIdsInCart = Array.from(
      new Set(selectedItems.map(i => i.sourcePackageId).filter((v): v is string => !!v))
    );
    return appliedPackageIdsInCart
      .map(pkgId => {
        const pkg = initialPackages.find(p => p.id === pkgId);
        if (!pkg) return null;
        const gap = computeBookingPackageCapacityGap(guestCount, pkg.capacity);
        return gap ? { packageId: pkgId, packageName: pkg.name, ...gap } : null;
      })
      .filter((v): v is NonNullable<typeof v> => v !== null);
  }, [selectedItems, initialPackages, guestCount]);

  // Calculations
  const venueServicesTotal = useMemo(() => {
    return selectedItems.filter(i => i.category === 'VENUE').reduce((acc, curr) => acc + curr.totalPrice, 0);
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

  const subtotalBeforeDiscount = venueServicesTotal + eventServicesTotal;
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

  // Every other booking on the selected date, regardless of whether it overlaps the currently
  // chosen time — unlike `selectedDateBookings` (which only exists to flag a conflict once a time
  // range is picked), this shows the *whole* day's schedule up front so a free slot can be spotted
  // before guessing a start/end time. Parsed via explicit Y/M/D fields, same as `getBookingsOnDay`,
  // to avoid the UTC-midnight day-shift `new Date(dateOnlyString)` can cause.
  const bookingsOnSelectedDate = useMemo(() => {
    if (!eventDate) return [];
    const [y, m, d] = eventDate.split('-').map(Number);
    return initialBookings
      .filter((b) => {
        if (b.status === 'CANCELLED') return false;
        if (initialBookingData && b.id === initialBookingData.id) return false;
        const bd = new Date(b.eventDate);
        return bd.getFullYear() === y && bd.getMonth() === m - 1 && bd.getDate() === d;
      })
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }, [eventDate, initialBookings, initialBookingData]);

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
      toast.error(`Guest count (${guestCount}) exceeds the venue's capacity (${venueCapacity}). Provide an override reason to confirm.`);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        // Only meaningful on create — `PATCH` ignores `kind` entirely, since flipping workspaces
        // for an existing booking goes through the dedicated promote/demote endpoints instead.
        kind: initialKind,
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
          sourcePackageId: item.sourcePackageId,
          sourcePackageName: item.sourcePackageName,
          packageApplicationKey: item.packageApplicationKey,
          // Phase 9 diff keys — let PATCH match this cart line to an existing BookingService and
          // keep its reservations, rather than delete-then-recreate.
          bookingServiceId: item.bookingServiceId,
          sourceBookingPackageId: item.sourceBookingPackageId,
          source: item.source,
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
    venueCapacity,
    overCapacity,
    capacityOverrideReason,
    setCapacityOverrideReason,
    selectedVenueId,
    venuesList,
    catalogServices,
    venueServices,
    packages: initialPackages,
    packageCapacityWarnings,
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
    venueServicesTotal,
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
    bookingsOnSelectedDate,

    handleSelectVenue,
    toggleCatalogService,
    applyPackage,
    isPackageApplied,
    removeItemFromCart,
    handleSubmitPOS,
    isEdit,
  };
}
