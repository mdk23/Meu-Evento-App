'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  ShoppingBag,
  Plus,
  Trash2,
  Check,
  Search,
  Calendar as CalendarIcon,
  Users,
  Building2,
  Sparkles,
  ArrowLeft,
  FileText,
  CheckCircle2,
  Loader2,
  TrendingUp,
  Tag
} from 'lucide-react';

interface Client {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
}

interface ServiceItem {
  id: string;
  name: string;
  category: 'SPACE' | 'EVENT';
  providerType: 'INTERNAL' | 'EXTERNAL';
  providerName?: string;
  priceType: 'FIXED' | 'PER_GUEST' | 'HOURLY';
  price: number;
  description: string;
}

interface SpaceItem {
  id: string;
  name: string;
  capacity: number;
  price: number;
  description: string;
}

interface BookingPOSTerminalProps {
  initialClients?: Client[];
  initialServices?: any[];
  initialSpaces?: any[];
  initialBookings?: any[];
}

export default function BookingPOSTerminal({
  initialClients = [],
  initialServices = [],
  initialSpaces = [],
  initialBookings = [],
}: BookingPOSTerminalProps) {
  const router = useRouter();

  // 1. Client & Event State
  const [selectedClientId, setSelectedClientId] = useState<string>('NEW');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');

  const [eventTitle, setEventTitle] = useState('');
  const [eventType, setEventType] = useState('');
  const [guestCount, setGuestCount] = useState<number>(1);

  const [eventDate, setEventDate] = useState('');
  const [depositDueDate, setDepositDueDate] = useState('');
  
  // Interactive calendar month selection
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => new Date());
  const [isWaitingList, setIsWaitingList] = useState(false);

  const [shift, setShift] = useState<'Almoço' | 'Jantar' | 'Dia Inteiro'>('Jantar');
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('02:00');

  // Spaces List
  const defaultSpaces: SpaceItem[] = [
    {
      id: 'sp-1',
      name: 'Salão Imperial (Interno)',
      capacity: 350,
      price: 50000,
      description: 'Uso exclusivo do salão nobre com ar condicionado central, tratamento acústico...',
    },
    {
      id: 'sp-2',
      name: 'Jardim das Palmeiras (Externo)',
      capacity: 200,
      price: 35000,
      description: 'Área externa arborizada com pergolado de madeira nobre, altar e passarela.',
    },
    {
      id: 'sp-3',
      name: 'Terraço Sunset & Lounge Bar',
      capacity: 120,
      price: 25000,
      description: 'Área com vista panorâmica para o por do sol, bar de coquetéis moderno e sofás.',
    },
  ];

  const spacesList = initialSpaces.length > 0
    ? initialSpaces.map(s => ({ id: s.id, name: s.name, capacity: s.capacity || 200, price: 50000, description: s.description || 'Espaço exclusivo para eventos.' }))
    : defaultSpaces;

  // Selected space (default sp-1)
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>('');

  // 2. Catalog Services State
  const defaultCatalogServices: ServiceItem[] = [
    {
      id: 'srv-1',
      name: 'Locação Salão Imperial (Área Climatizada)',
      category: 'SPACE',
      providerType: 'INTERNAL',
      providerName: 'Interno Bellagio',
      priceType: 'FIXED',
      price: 50000,
      description: 'Uso exclusivo do salão nobre com ar condicionado central, tratamento acústico...',
    },
    {
      id: 'srv-2',
      name: 'Locação Jardim das Palmeiras (Cerimônia ao Ar Livre)',
      category: 'SPACE',
      providerType: 'INTERNAL',
      providerName: 'Interno Bellagio',
      priceType: 'FIXED',
      price: 35000,
      description: 'Área externa arborizada com pergolado de madeira nobre, altar e passarela.',
    },
    {
      id: 'srv-3',
      name: 'Locação Terraço Sunset & Lounge Bar',
      category: 'SPACE',
      providerType: 'INTERNAL',
      providerName: 'Interno Bellagio',
      priceType: 'FIXED',
      price: 25000,
      description: 'Área com vista panorâmica para o por do sol, bar de coquetéis moderno e sofás.',
    },
    {
      id: 'srv-4',
      name: 'Iluminação Cênica LED & Arquitetural',
      category: 'SPACE',
      providerType: 'INTERNAL',
      providerName: 'Interno Bellagio',
      priceType: 'FIXED',
      price: 18000,
      description: 'Projeto luminotécnico com ribaltas LED coloridas e focos em colunas e fachadas.',
    },
    {
      id: 'srv-5',
      name: 'Gerador de Energia Silencioso 150 kVA',
      category: 'SPACE',
      providerType: 'EXTERNAL',
      providerName: 'GERADORES VOLTA S/A',
      priceType: 'FIXED',
      price: 24000,
      description: 'Grupo gerador com combustível e técnico dedicado durante 8h de evento.',
    },
    {
      id: 'srv-6',
      name: 'Buffet Banquete Real Gold (Completo)',
      category: 'EVENT',
      providerType: 'INTERNAL',
      providerName: 'Interno Bellagio',
      priceType: 'PER_GUEST',
      price: 1200,
      description: 'Coquetel volante, janta empratada 3 tempos, sobremesas gourmet e café.',
    },
    {
      id: 'srv-7',
      name: 'Open Bar Premium de Coquetéis & Drinks',
      category: 'EVENT',
      providerType: 'INTERNAL',
      providerName: 'Interno Bellagio',
      priceType: 'PER_GUEST',
      price: 300,
      description: 'Bartenders performáticos, destilados importados, caipirinhas e gin tônica.',
    },
    {
      id: 'srv-8',
      name: 'Decoração Floral Nobre & Cenografia',
      category: 'EVENT',
      providerType: 'EXTERNAL',
      providerName: 'FLORA DECOR LTDA',
      priceType: 'FIXED',
      price: 65000,
      description: 'Arranjos com flores nobres da estação, mesa do bolo cênica e lounges.',
    },
  ];

  const catalogServices = useMemo(() => {
    if (initialServices.length === 0) return defaultCatalogServices;
    return initialServices.map((s, idx) => ({
      id: s.id,
      name: s.name,
      category: (s.category === 'SPACE' || idx % 2 === 0 ? 'SPACE' : 'EVENT') as 'SPACE' | 'EVENT',
      providerType: (s.executionType === 'EXTERNAL' ? 'EXTERNAL' : 'INTERNAL') as 'INTERNAL' | 'EXTERNAL',
      providerName: s.executionType === 'EXTERNAL' ? 'Fornecedor Externo' : 'Interno Bellagio',
      priceType: (s.priceType === 'PER_GUEST' ? 'PER_GUEST' : s.priceType === 'HOURLY' ? 'HOURLY' : 'FIXED') as 'FIXED' | 'PER_GUEST' | 'HOURLY',
      price: s.defaultPrice || 15000,
      description: s.description || 'Serviço especializado para seu evento.',
    }));
  }, [initialServices]);

  // Search & Filter state for catalog
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'SPACE' | 'EVENT'>('ALL');
  const [originFilter, setOriginFilter] = useState<'ALL' | 'INTERNAL' | 'EXTERNAL'>('ALL');

  // 3. POS Cart State (Selected items)
  const [selectedItems, setSelectedItems] = useState<{ id: string; serviceId: string; name: string; category: 'SPACE' | 'EVENT'; providerType: 'INTERNAL' | 'EXTERNAL'; providerName: string; priceType: 'FIXED' | 'PER_GUEST' | 'HOURLY'; price: number; quantity: number; totalPrice: number }[]>([]);

  const [discount, setDiscount] = useState<number>(0);
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(50);
  const [installmentCount, setInstallmentCount] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);

  // Sync Space Selection with Cart Item
  const handleSelectSpace = (space: SpaceItem) => {
    setSelectedSpaceId(space.id);
    const existingSpaceInCart = selectedItems.find(item => item.name.includes(space.name));
    if (!existingSpaceInCart) {
      const newSpaceCartItem = {
        id: `cart-space-${space.id}`,
        serviceId: '',
        name: `Locação ${space.name}`,
        category: 'SPACE' as const,
        providerType: 'INTERNAL' as const,
        providerName: 'Interno Bellagio',
        priceType: 'FIXED' as const,
        price: space.price,
        quantity: 1,
        totalPrice: space.price,
      };
      setSelectedItems(prev => [newSpaceCartItem, ...prev]);
      toast.success(`Espaço "${space.name}" adicionado ao contrato!`);
    }
  };

  // Toggle Catalog Service Selection
  const toggleCatalogService = (service: ServiceItem) => {
    const existingIndex = selectedItems.findIndex(i => i.serviceId === service.id || i.name === service.name);
    if (existingIndex >= 0) {
      setSelectedItems(prev => prev.filter((_, idx) => idx !== existingIndex));
      toast.info(`Item "${service.name}" removido.`);
    } else {
      const qty = service.priceType === 'PER_GUEST' ? guestCount : 1;
      const newItem = {
        id: `cart-${service.id}-${Date.now()}`,
        serviceId: service.id,
        name: service.name,
        category: service.category,
        providerType: service.providerType,
        providerName: service.providerName || (service.providerType === 'INTERNAL' ? 'Interno Bellagio' : 'Fornecedor Externo'),
        priceType: service.priceType,
        price: service.price,
        quantity: qty,
        totalPrice: service.price * qty,
      };
      setSelectedItems(prev => [...prev, newItem]);
      toast.success(`Serviço "${service.name}" adicionado!`);
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
    toast.info('Item removido.');
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

  // Submit Handler
  const handleSubmitPOS = async (targetStatus: 'CONFIRMED' | 'RESERVED') => {
    if (!clientName.trim()) {
      toast.error('Por favor, informe o nome do cliente.');
      return;
    }
    if (!eventDate) {
      toast.error('Por favor, selecione a data do evento.');
      return;
    }

    const selectedDateBookings = initialBookings.filter((b: any) => {
      if (b.status === 'CANCELLED') return false;
      const bDate = new Date(b.eventDate).toISOString().split('T')[0];
      return bDate === eventDate;
    });
    const hasConflict = selectedDateBookings.length > 0;
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
      };

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(
          finalStatus === 'WAITING_LIST'
            ? 'Reserva adicionada à Lista de Espera!'
            : targetStatus === 'CONFIRMED'
            ? 'Reserva confirmada com sinal inicial!'
            : 'Reserva criada com sucesso!'
        );
        router.push('/bookings');
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erro ao processar reserva.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Falha de conexão com o servidor.');
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
    toast.info('Atendimento reiniciado.');
  };

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
    return initialBookings.filter((b: any) => {
      if (b.status === 'CANCELLED') return false;
      const d = new Date(b.eventDate);
      return d.getFullYear() === calendarYear && d.getMonth() === calendarMonthIndex && d.getDate() === day;
    });
  };

  // Check conflicts for currently selected eventDate
  const selectedDateBookings = initialBookings.filter((b: any) => {
    if (b.status === 'CANCELLED') return false;
    const bDate = new Date(b.eventDate).toISOString().split('T')[0];
    return bDate === eventDate;
  });
  const hasConflict = selectedDateBookings.length > 0;

  return (
    <div className="flex-1 flex flex-col h-full w-full bg-zinc-950 text-white font-sans overflow-hidden">
      
      {/* TOP HEADER BAR */}
      <header className="h-16 border-b border-zinc-900 bg-zinc-950/80 px-8 flex items-center justify-between gap-4 shrink-0 backdrop-blur-md w-full">
        <div className="flex items-center gap-4">
          <Link
            href="/bookings"
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
            title="Voltar para Bookings"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-400" />
                New Booking
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse"></span>
                Terminal On-line
              </span>
            </div>
            <p className="text-xs text-zinc-500">Royal Events Co. • Commercial Booking Terminal</p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={resetForm}
            className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold border border-zinc-800 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-violet-400" />
            Novo Atendimento
          </button>

          <Link
            href="/bookings"
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-lg shadow-violet-600/20 flex items-center gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            Ver Funil CRM
          </Link>
        </div>
      </header>

      {/* MAIN 3-COLUMN WORKSPACE - FULL SCREEN FLUID WIDTH */}
      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto w-full">
        
        {/* COLUMN 1: CLIENT & CALENDAR (4 COLS) */}
        <section className="lg:col-span-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col gap-5">
          
          {/* STEP HEADER */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20 text-xs font-black flex items-center justify-center">
                1
              </span>
              <div>
                <h2 className="text-sm font-bold text-white tracking-tight">Cliente & Calendário</h2>
                <p className="text-[11px] text-zinc-500">Dados do contratante e data do evento</p>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-zinc-950 text-violet-300 border border-zinc-800">
              Etapa Inicial
            </span>
          </div>

          {/* CRM SELECTION OR NEW CLIENT */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-violet-400" />
              Carregar do CRM ou Novo Atendimento
            </label>
            <select
              value={selectedClientId}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedClientId(val);
                if (val !== 'NEW') {
                  const existing = initialClients.find(c => c.id === val);
                  if (existing) {
                    setClientName(existing.name);
                    setClientPhone(existing.phone || '');
                    setClientEmail(existing.email || '');
                  }
                }
              }}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500 transition-all font-medium"
            >
              <option value="NEW">+ Cadastrar Novo Cliente no Balcão</option>
              {initialClients.map(c => (
                <option key={c.id} value={c.id}>
                  👤 {c.name} ({c.phone || c.email || 'Sem contato'})
                </option>
              ))}
            </select>
          </div>

          {/* CLIENT FORM INPUTS */}
          <div className="space-y-3 bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-4">
            <div>
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                Nome Completo do Cliente *
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ex: Sofia Albuquerque"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Telefone / WhatsApp
                </label>
                <input
                  type="text"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="+258 84 123 4567"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  E-mail de Contato
                </label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="sofia@email.com"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                Título da Cerimônia / Festa *
              </label>
              <input
                type="text"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="Ex: Casamento Sofia & Arthur"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Tipo de Evento
                </label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                >
                  <option value="">Selecione...</option>
                  <option value="💍 Casamento">💍 Casamento</option>
                  <option value="🎂 Aniversário / 15 Anos">🎂 Aniversário / 15 Anos</option>
                  <option value="🏢 Corporativo">🏢 Corporativo</option>
                  <option value="🎓 Formatura">🎓 Formatura</option>
                  <option value="🎉 Festa Social">🎉 Festa Social</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Nº de Convidados
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={guestCount}
                    onChange={(e) => setGuestCount(Math.max(1, parseInt(e.target.value || '1', 10)))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-violet-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-500 uppercase">
                    pax
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* DATE & CALENDAR SCHEDULE */}
          <div className="space-y-4 bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-4">
            <div className="flex justify-between items-center border-b border-zinc-800/50 pb-2">
              <h3 className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-violet-400" />
                Selecione a Data do Evento
              </h3>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCalendarMonth(new Date(calendarYear, calendarMonthIndex - 1, 1))}
                  className="p-1 hover:bg-zinc-850 rounded text-zinc-400 hover:text-white"
                >
                  &larr;
                </button>
                <span className="text-[10px] font-black text-white px-1">
                  {calendarMonth.toLocaleString('pt-MZ', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  type="button"
                  onClick={() => setCalendarMonth(new Date(calendarYear, calendarMonthIndex + 1, 1))}
                  className="p-1 hover:bg-zinc-850 rounded text-zinc-400 hover:text-white"
                >
                  &rarr;
                </button>
              </div>
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-zinc-500 mb-1">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => <span key={d}>{d}</span>)}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDaysArr.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} className="h-7" />;
                }

                const dayStr = `${calendarYear}-${String(calendarMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isSelected = eventDate === dayStr;
                const bookingsOnDay = getBookingsOnDay(day);
                const hasBookings = bookingsOnDay.length > 0;

                // Determine color for dots
                const hasConfirmed = bookingsOnDay.some(b => b.status === 'CONFIRMED');
                const hasWaitingList = bookingsOnDay.some(b => b.status === 'WAITING_LIST');
                const hasReserved = bookingsOnDay.some(b => b.status === 'RESERVED');

                return (
                  <button
                    key={`day-${day}`}
                    type="button"
                    onClick={() => {
                      setEventDate(dayStr);
                      // Auto-set deposit due date to 14 days after today
                      const d = new Date();
                      d.setDate(d.getDate() + 14);
                      setDepositDueDate(d.toISOString().split('T')[0]);
                    }}
                    className={`h-7 rounded-lg text-[10px] font-bold relative flex flex-col items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
                        : hasBookings
                        ? 'bg-zinc-900 border border-zinc-800 text-zinc-200 hover:border-zinc-700'
                        : 'bg-zinc-950 text-zinc-400 hover:bg-zinc-900 hover:text-white'
                    }`}
                  >
                    <span>{day}</span>
                    {hasBookings && (
                      <div className="absolute bottom-0.5 flex gap-0.5">
                        {hasConfirmed && <span className="w-1 h-1 rounded-full bg-emerald-500" />}
                        {hasReserved && <span className="w-1 h-1 rounded-full bg-amber-500" />}
                        {hasWaitingList && <span className="w-1 h-1 rounded-full bg-purple-500" />}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected dates indicators & Conflict Alerts */}
            <div className="pt-2 border-t border-zinc-900 space-y-2 text-xs">
              <div className="flex justify-between items-center text-zinc-400">
                <span>Data do Evento:</span>
                <strong className="text-white">{eventDate ? new Date(eventDate + 'T00:00:00').toLocaleDateString('pt-MZ') : 'Nenhuma'}</strong>
              </div>
              <div className="space-y-1 pt-1.5 border-t border-zinc-900/60">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                  Prazo para Depósito do Sinal (Entrada)
                </label>
                <input
                  type="date"
                  value={depositDueDate}
                  onChange={(e) => setDepositDueDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500 font-bold"
                />
              </div>

              {/* Conflict Check Warning Banner */}
              {hasConflict && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 p-3 rounded-xl space-y-2.5 animate-in fade-in zoom-in duration-200">
                  <p className="font-bold flex items-center gap-1.5 text-[11px]">
                    ⚠️ Data já Ocupada por outro Evento!
                  </p>
                  <p className="text-[10px] text-zinc-400 leading-normal">
                    Já existe uma reserva cadastrada para este dia ({selectedDateBookings[0]?.client?.name || 'Cliente'}). Você pode cadastrar como Lista de Espera.
                  </p>
                  
                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={isWaitingList}
                      onChange={(e) => setIsWaitingList(e.target.checked)}
                      className="rounded border-zinc-800 bg-zinc-950 text-violet-500 focus:ring-violet-500"
                    />
                    <span className="text-[11px] font-bold text-white uppercase">Colocar na Lista de Espera</span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* BASE VENUE SPACES SELECTION */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-violet-400" />
                Espaços do Complexo (Locação Base)
              </h3>
              <span className="text-[10px] text-zinc-500 uppercase font-bold">Locação Base</span>
            </div>

            <div className="space-y-2.5">
              {spacesList.map((space) => {
                const isSelected = selectedSpaceId === space.id;
                return (
                  <div
                    key={space.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-violet-600/10 border-violet-500/40 text-white shadow-md'
                        : 'bg-zinc-950 border-zinc-800/80 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <h4 className="text-xs font-bold text-white">{space.name}</h4>
                        <span className="text-[11px] text-zinc-400 block mt-0.5">
                          Capacidade até {space.capacity} pessoas
                        </span>
                      </div>
                      <span className="text-xs font-black text-violet-400">
                        {space.price.toLocaleString()} MT
                      </span>
                    </div>

                    <div className="flex justify-end mt-2">
                      <button
                        type="button"
                        onClick={() => handleSelectSpace(space)}
                        className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-violet-600/30 text-violet-300 border border-violet-500/40'
                            : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-violet-400" /> Selecionado
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" /> Adicionar
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </section>

        {/* COLUMN 2: CATALOG SERVICES (4 COLS) */}
        <section className="lg:col-span-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col gap-5">
          
          {/* STEP HEADER */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20 text-xs font-black flex items-center justify-center">
                2
              </span>
              <div>
                <h2 className="text-sm font-bold text-white tracking-tight">Catálogo de Serviços</h2>
                <p className="text-[11px] text-zinc-500">Serviços do Espaço & Serviços do Evento</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => toast.info('Adicionar serviço sob medida customizado.')}
              className="px-2.5 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-violet-300 text-[11px] font-bold border border-zinc-800 transition-all flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5 text-violet-400" />
              + Sob Medida
            </button>
          </div>

          {/* SEARCH BAR */}
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar serviços (ex: buffet, iluminação, gerador, DJ...)"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 transition-all font-medium"
            />
          </div>

          {/* CATEGORY TABS */}
          <div className="flex gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            <button
              type="button"
              onClick={() => setCategoryFilter('ALL')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all text-center ${
                categoryFilter === 'ALL'
                  ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              🌟 Todos ({catalogServices.length})
            </button>

            <button
              type="button"
              onClick={() => setCategoryFilter('SPACE')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all text-center ${
                categoryFilter === 'SPACE'
                  ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              🏛️ Do Espaço ({catalogServices.filter(s => s.category === 'SPACE').length})
            </button>

            <button
              type="button"
              onClick={() => setCategoryFilter('EVENT')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all text-center ${
                categoryFilter === 'EVENT'
                  ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              🎉 Do Evento ({catalogServices.filter(s => s.category === 'EVENT').length})
            </button>
          </div>

          {/* ORIGIN SUB-FILTERS */}
          <div className="flex items-center gap-2 text-[11px] text-zinc-400">
            <span className="font-bold text-zinc-500 shrink-0">Origem:</span>
            <div className="flex gap-1.5 overflow-x-auto pb-0.5">
              <button
                type="button"
                onClick={() => setOriginFilter('ALL')}
                className={`px-2.5 py-1 rounded-full font-bold transition-all shrink-0 ${
                  originFilter === 'ALL'
                    ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                    : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                Todos
              </button>

              <button
                type="button"
                onClick={() => setOriginFilter('INTERNAL')}
                className={`px-2.5 py-1 rounded-full font-bold transition-all shrink-0 ${
                  originFilter === 'INTERNAL'
                    ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                    : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                🏛️ Próprios
              </button>

              <button
                type="button"
                onClick={() => setOriginFilter('EXTERNAL')}
                className={`px-2.5 py-1 rounded-full font-bold transition-all shrink-0 ${
                  originFilter === 'EXTERNAL'
                    ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                    : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                🤝 Fornecedores Externos
              </button>
            </div>
          </div>

          {/* SERVICES SCROLLABLE CARDS */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[620px]">
            {filteredCatalog.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs">Nenhum serviço encontrado para este filtro.</p>
              </div>
            ) : (
              filteredCatalog.map((service) => {
                const isInCart = selectedItems.some(i => i.serviceId === service.id || i.name === service.name);

                return (
                  <div
                    key={service.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isInCart
                        ? 'bg-violet-600/10 border-violet-500/40 shadow-md'
                        : 'bg-zinc-950 border-zinc-800/80 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-300 border border-violet-500/20">
                        {service.category === 'SPACE' ? '🏛️ Serviço do Espaço' : '🎉 Serviço do Evento'}
                      </span>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        service.providerType === 'INTERNAL'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>
                        {service.providerType === 'INTERNAL' ? '🏛️ Interno' : `🤝 ${service.providerName || 'Parceiro Externo'}`}
                      </span>
                    </div>

                    <div className="flex justify-between items-start gap-2 mb-1.5">
                      <h3 className="text-xs font-bold text-white leading-snug">
                        {service.name}
                      </h3>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-violet-400 block">
                          {service.price.toLocaleString()} MT
                        </span>
                        <span className="text-[9px] font-bold text-zinc-500 uppercase">
                          {service.priceType === 'PER_GUEST' ? 'P/ Pessoa' : service.priceType === 'HOURLY' ? 'Por Hora' : 'Taxa Fixa'}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-zinc-400 line-clamp-2 mb-3 leading-relaxed">
                      {service.description}
                    </p>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => toggleCatalogService(service)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                          isInCart
                            ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700'
                        }`}
                      >
                        {isInCart ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" /> Adicionado
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5 text-violet-400" /> Adicionar
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </section>

        {/* COLUMN 3: POS CASH EXTRACT & SUMMARY (4 COLS) */}
        <section className="lg:col-span-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl flex flex-col justify-between gap-5">
          
          <div className="space-y-5">
            {/* STEP HEADER */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20 text-xs font-black flex items-center justify-center">
                  3
                </span>
                <div>
                  <h2 className="text-sm font-bold text-white tracking-tight">Total do Caixa & Extrato POS</h2>
                  <p className="text-[11px] text-zinc-500">Resumo final e emissão do contrato</p>
                </div>
              </div>

              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-zinc-950 text-violet-400 border border-zinc-800">
                {selectedItems.length} item(ns)
              </span>
            </div>

            {/* CART ITEMS LIST */}
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {selectedItems.length === 0 ? (
                <div className="text-center py-10 text-zinc-600 border border-dashed border-zinc-800 rounded-xl p-4">
                  <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">Nenhum serviço selecionado ainda.</p>
                </div>
              ) : (
                selectedItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 flex justify-between items-start gap-3 shadow-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-900 text-violet-400 border border-zinc-800 block w-fit mb-1 truncate">
                        {item.category === 'SPACE' ? '🏛️ ESPAÇO' : '🎉 EVENTO'} • {item.providerName}
                      </span>
                      <h4 className="text-xs font-bold text-white truncate">{item.name}</h4>
                      <p className="text-[10px] font-mono text-zinc-400 mt-0.5">
                        {item.price.toLocaleString()} MT × {item.quantity} {item.priceType === 'PER_GUEST' ? 'conv.' : 'un.'}
                      </p>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-2">
                      <span className="text-xs font-black text-violet-300">
                        {item.totalPrice.toLocaleString()} MT
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItemFromCart(item.id)}
                        className="text-zinc-500 hover:text-red-400 p-1 transition-colors"
                        title="Remover item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* BREAKDOWN SUMMARY BOX */}
            <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-4 space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-zinc-300 font-medium">
                <span className="flex items-center gap-1.5">
                  <span>🏛️</span> Serviços do Espaço:
                </span>
                <span className="font-bold text-white">
                  {spaceServicesTotal.toLocaleString()} MT
                </span>
              </div>

              <div className="flex justify-between items-center text-zinc-300 font-medium">
                <span className="flex items-center gap-1.5">
                  <span>🎉</span> Serviços do Evento:
                </span>
                <span className="font-bold text-white">
                  {eventServicesTotal.toLocaleString()} MT
                </span>
              </div>

              <div className="border-t border-zinc-800/80 pt-2 space-y-1.5 text-[11px]">
                <div className="flex justify-between items-center text-emerald-400">
                  <span>• Faturamento Interno (Bellagio):</span>
                  <span className="font-bold">{internalRevenue.toLocaleString()} MT</span>
                </div>
                <div className="flex justify-between items-center text-blue-400">
                  <span>• Repasse Parceiros Externos:</span>
                  <span className="font-bold">{externalRepass.toLocaleString()} MT</span>
                </div>
              </div>

              {/* DISCOUNT INPUT */}
              <div className="border-t border-zinc-800/80 pt-2 flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-violet-400 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" /> Desconto no POS:
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-zinc-400">MT</span>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value || '0')))}
                    className="w-24 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-violet-400 font-bold text-right focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>
            </div>

            {/* GRAND TOTAL BANNER */}
            <div className="bg-gradient-to-r from-violet-950 via-zinc-900 to-violet-950 border border-violet-500/30 rounded-2xl p-5 shadow-xl text-center space-y-1">
              <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest block">
                Valor Total do Contrato (POS)
              </span>
              <span className="text-3xl md:text-4xl font-black text-white tracking-tight block">
                {grandTotal.toLocaleString()} MT
              </span>
              <span className="text-[10px] text-zinc-400 block">
                (Incluso caução de garantia de 5.000 MT mantida em custódia)
              </span>
            </div>

            {/* PAYMENT CONDITIONS */}
            <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Condições de Pagamento
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    Entrada no Ato (%)
                  </label>
                  <select
                    value={downPaymentPercent}
                    onChange={(e) => setDownPaymentPercent(parseInt(e.target.value, 10))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-white font-bold"
                  >
                    <option value={10}>10% ({(grandTotal * 0.1).toLocaleString()} MT)</option>
                    <option value={20}>20% ({(grandTotal * 0.2).toLocaleString()} MT)</option>
                    <option value={30}>30% ({(grandTotal * 0.3).toLocaleString()} MT)</option>
                    <option value={50}>50% ({(grandTotal * 0.5).toLocaleString()} MT)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    Parcelamento
                  </label>
                  <select
                    value={installmentCount}
                    onChange={(e) => setInstallmentCount(parseInt(e.target.value, 10))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-white font-bold"
                  >
                    <option value={1}>À Vista (1x)</option>
                    <option value={3}>3x sem juros</option>
                    <option value={6}>6x sem juros</option>
                    <option value={10}>10x sem juros</option>
                    <option value={12}>12x sem juros</option>
                  </select>
                </div>
              </div>

              <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 space-y-1 text-[11px]">
                <div className="flex justify-between text-zinc-300 font-medium">
                  <span>Entrada no Ato:</span>
                  <span className="font-bold text-violet-400">{downPaymentAmount.toLocaleString()} MT</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Saldo Restante ({installmentCount > 1 ? installmentCount - 1 : 1}x de):</span>
                  <span className="font-bold text-white">{monthlyInstallment.toLocaleString(undefined, { maximumFractionDigits: 0 })} MT / mês</span>
                </div>
              </div>
            </div>

          </div>

          {/* FINAL ACTION BUTTONS */}
          <div className="space-y-2.5 pt-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSubmitPOS('CONFIRMED')}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white py-3.5 px-4 rounded-xl text-xs font-bold transition-all shadow-lg shadow-violet-600/20 flex items-center justify-center gap-2 border border-violet-500/30 disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-violet-200" />
                  Concluir Venda & Gerar Contrato
                </>
              )}
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSubmitPOS('RESERVED')}
              className="w-full bg-zinc-950 hover:bg-zinc-800 text-zinc-300 py-3 px-4 rounded-xl text-xs font-bold transition-all border border-zinc-800 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <FileText className="w-4 h-4 text-violet-400" />
              Criar Reserva (Aguardando Sinal)
            </button>
          </div>

        </section>

      </main>

    </div>
  );
}
