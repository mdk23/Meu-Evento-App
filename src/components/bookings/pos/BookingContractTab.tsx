import { FileText, Boxes } from 'lucide-react';
import { BookingPOSInitialData } from './types';

interface BookingContractTabProps {
  booking: BookingPOSInitialData;
}

/** Read-only contract breakdown — distinct from the editable cart on the Details tab. Reads off
 * `booking.bookingServices` directly (always set, works for both SPACE and EVENT bookings) rather
 * than `booking.event?.bookingServices`, which is empty for a SPACE booking. */
export default function BookingContractTab({ booking }: BookingContractTabProps) {
  const lines = booking.bookingServices || [];
  const subtotal = lines.reduce((sum, l) => sum + l.sellingPrice, 0);
  const discount = booking.discount || 0;
  const total = Math.max(0, subtotal - discount);
  const appliedPackages = booking.bookingPackages || [];

  return (
    <div className="page" style={{ maxWidth: 900 }}>
      {appliedPackages.length > 0 && (
        <div className="card plain" style={{ padding: 0, overflow: 'hidden', marginBottom: 24 }}>
          <div className="row" style={{ gap: 8, padding: '16px 22px', borderBottom: '1px solid var(--rule)' }}>
            <Boxes className="w-4 h-4" style={{ color: 'var(--ink-3)' }} />
            <h3 className="h-sm">Applied Packages</h3>
            <span className="mini dim">Frozen at the price they were sold — later catalog changes never affect these.</span>
          </div>
          <div className="stack" style={{ gap: 0 }}>
            {appliedPackages.map((bp) => {
              const packageTotal = bp.items.reduce((sum, i) => sum + i.totalPrice, 0);
              return (
                <div key={bp.id} className="between" style={{ padding: '12px 22px', borderBottom: '1px solid var(--rule)' }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>{bp.nameSnapshot}</span>
                    <p className="mini dim" style={{ marginTop: 2 }}>{bp.items.length} service{bp.items.length === 1 ? '' : 's'}</p>
                  </div>
                  <span className="num" style={{ fontWeight: 600 }}>{packageTotal.toLocaleString()} MT</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="card plain" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="row" style={{ gap: 8, padding: '16px 22px', borderBottom: '1px solid var(--rule)' }}>
          <FileText className="w-4 h-4" style={{ color: 'var(--ink-3)' }} />
          <h3 className="h-sm">Contract Lines</h3>
        </div>
        <div className="scrollx" style={{ padding: '0 22px 6px' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Service</th>
                <th>Category</th>
                <th>Provider</th>
                <th className="r">Qty</th>
                <th className="r">Amount</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => (
                <tr key={l.id}>
                  <td style={{ fontWeight: 600 }}>{l.serviceNameSnapshot || l.service?.name || 'Service'}</td>
                  <td className="mini dim">{l.service?.category || '—'}</td>
                  <td>
                    <span className={`badge ${l.providerType === 'INTERNAL' ? 'b-ok' : 'b-info'}`}>{l.providerType}</span>
                  </td>
                  <td className="r num">{l.quantity}</td>
                  <td className="r num">{l.sellingPrice.toLocaleString()} MT</td>
                </tr>
              ))}
              {lines.length === 0 && (
                <tr>
                  <td colSpan={5} className="mini dim" style={{ textAlign: 'center', padding: '32px 0' }}>No contract lines yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid g3" style={{ marginTop: 24 }}>
        <div className="card kpi plain">
          <span className="label">Subtotal</span>
          <div className="val" style={{ fontSize: 22 }}>{subtotal.toLocaleString()} MT</div>
        </div>
        <div className="card kpi plain">
          <span className="label">Discount</span>
          <div className="val" style={{ fontSize: 22, color: 'var(--warn)' }}>-{discount.toLocaleString()} MT</div>
        </div>
        <div className="card kpi plain" style={{ background: 'var(--accent-soft)' }}>
          <span className="label">Total Contract Value</span>
          <div className="val" style={{ fontSize: 22, color: 'var(--accent)' }}>{total.toLocaleString()} MT</div>
        </div>
      </div>
    </div>
  );
}
