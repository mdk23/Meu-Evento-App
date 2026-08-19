import { BookingRepository, GetBookingListParams } from '@/lib/repositories/booking.repository';
import { BookingListPageDTO, CalendarBookingDTO } from '@/types/dtos';

export class BookingService {
  static async getBookings(params: GetBookingListParams = {}): Promise<BookingListPageDTO> {
    return BookingRepository.getBookingList(params);
  }



  static async getBookingsForCalendar(): Promise<CalendarBookingDTO[]> {
    return BookingRepository.getAllBookingsForCalendar();
  }
}
