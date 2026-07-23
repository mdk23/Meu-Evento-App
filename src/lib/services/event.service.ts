import { EventRepository } from '@/lib/repositories/event.repository';
import { EventOverviewDTO } from '@/types/dtos';

export class EventService {
  static async getEvents(): Promise<EventOverviewDTO[]> {
    return EventRepository.getEventList();
  }

  static async getEventOverview(eventId: string) {
    return EventRepository.getEventDetailOverview(eventId);
  }
}
