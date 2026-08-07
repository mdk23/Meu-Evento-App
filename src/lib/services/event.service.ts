import { EventRepository, GetEventListParams } from '@/lib/repositories/event.repository';
import { EventListPageDTO } from '@/types/dtos';

export class EventService {
  static async getEvents(params: GetEventListParams = {}): Promise<EventListPageDTO> {
    return EventRepository.getEventList(params);
  }

  static async getEventOverview(eventId: string) {
    return EventRepository.getEventDetailOverview(eventId);
  }
}
