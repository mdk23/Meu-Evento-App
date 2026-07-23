import { BookingRepository } from '@/lib/repositories/booking.repository';
import { BookingListDTO } from '@/types/dtos';

export class BookingService {
  static async getBookings(): Promise<BookingListDTO[]> {
    return BookingRepository.getBookingList();
  }
}
