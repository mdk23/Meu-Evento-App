'use client';

import { use } from 'react';
import EventDetailClient from '@/components/events/detail/EventDetailClient';

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <EventDetailClient eventId={id} />;
}
