import { prisma } from '@/lib/prisma';
import BookingPOSTerminal from '@/components/bookings/BookingPOSTerminal';
import { serializeDecimals } from '@/lib/money';
import { PackageCatalogService } from '@/lib/services/package.service';
import { isScopeAllowedForKind } from '@/lib/service-scope';

export const dynamic = 'force-dynamic';

interface CreateBookingPageProps {
  searchParams: Promise<{ date?: string; context?: string }>;
}

export default async function CreateBookingPage({ searchParams }: CreateBookingPageProps) {
  const { date, context } = await searchParams;
  const initialDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined;
  const initialKind = context === 'SPACE' ? 'SPACE' : 'EVENT';
  const clients = await prisma.client.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, phone: true, email: true },
  });
  const services = await prisma.service.findMany({
    where: {
      active: true,
      ...(initialKind === 'SPACE' ? { scope: { in: ['SPACE', 'BOTH'] } } : {}),
    },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, category: true, scope: true, defaultProviderType: true, defaultPrice: true, priceType: true },
  });
  const spaces = await prisma.space.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, capacity: true, description: true },
  });
  const bookings = await prisma.booking.findMany({
    select: {
      id: true,
      eventDate: true,
      startAt: true,
      endAt: true,
      spaceId: true,
      status: true,
      client: { select: { name: true } },
    },
  });
  const packages = (await PackageCatalogService.getCatalog())
    .filter((p) => p.active && isScopeAllowedForKind(p.scope, initialKind));

  return (
    <BookingPOSTerminal
      initialClients={clients}
      initialServices={serializeDecimals(services)}
      initialSpaces={spaces}
      initialBookings={bookings}
      initialPackages={packages}
      initialDate={initialDate}
      initialKind={initialKind}
    />
  );
}
