/** Raw cart-line values as submitted by the POS terminal (`CartItem` shape, loosely typed here since
 * this is fed directly from request bodies). */
export interface LineAmountsInput {
  price?: number;
  quantity?: number;
  totalPrice?: number;
}

export interface LineAmounts {
  quantity: number;
  unitPrice: number;
  sellingPrice: number;
}

/** Resolves the three numbers a `BookingService` line persists — `quantity`, `unitPrice`, and the
 * authoritative total `sellingPrice` — from whatever a cart line submitted. `sellingPrice` always
 * wins as the total (it's what the POS terminal actually computed and displayed to the user); when
 * `unitPrice` isn't given directly, it's derived by dividing that total back out, so
 * `sellingPrice === unitPrice * quantity` holds for every line this produces. */
export function resolveLineAmounts(item: LineAmountsInput): LineAmounts {
  const quantity = item.quantity || 1;
  const sellingPrice = item.totalPrice || item.price || 0;
  const unitPrice = item.price ?? (sellingPrice / quantity);
  return { quantity, unitPrice, sellingPrice };
}
