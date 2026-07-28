import { redirect } from 'next/navigation';

export default function NewPageRedirect() {
  redirect('/bookings/create');
}
