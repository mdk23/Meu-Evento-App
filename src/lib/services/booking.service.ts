import { BookingRepository, GetBookingListParams } from '@/lib/repositories/booking.repository';
import { BookingListDTO, BookingListPageDTO } from '@/types/dtos';

export class BookingService {
  static async getBookings(params: GetBookingListParams = {}): Promise<BookingListPageDTO> {
    return BookingRepository.getBookingList(params);
  }

  static async getAllBookingsFlat(): Promise<BookingListDTO[]> {
    return BookingRepository.getAllBookingsFlat();
  }
}
