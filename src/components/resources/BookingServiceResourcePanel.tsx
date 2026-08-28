import { useState } from 'react';
import { X, Recycle } from 'lucide-react';
import { InventoryItem } from '@prisma/client';

export const RESERVATION_ACTIONS: Record<string, { label: string; action: string }[]> = {
  PLANNED: [],
  RESERVED: [
    { label: 'Confirm', action: 'CONFIRM' },
    { label: 'Issue', action: 'ISSUE' },
    { label: 'Allocate', action: 'ALLOCATE' },
    { label: 'Use', action: 'USE' },
    { label: 'Release', action: 'RELEASE' },
  ],
  CONFIRMED: [
    { label: 'Issue', action: 'ISSUE' },
    { label: 'Use', action: 'USE' },
    { label: 'Release', action: 'RELEASE' },
  ],
  ISSUED: [
    { label: 'Use', action: 'USE' },
    { label: 'Return', action: 'RETURN' },
    { label: 'Damage', action: 'DAMAGE' },
    { label: 'Loss', action: 'LOSS' },
  ],
  IN_USE: [
    { label: 'Return', action: 'RETURN' },
    { label: 'Damage', action: 'DAMAGE' },
    { label: 'Loss', action: 'LOSS' },
  ],
  RETURNED: [
    { label: 'Damage', action: 'DAMAGE' },
    { label: 'Loss', action: 'LOSS' },
  ],
  RELEASED: [],
};

/** Actions that ask the operator for a quantity (partial) instead of moving the whole row. */
const QUANTITY_PROMPT_ACTIONS = new Set(['DAMAGE', 'LOSS']);

export const STATUS_BADGE_CLASS: Record<string, string> = {
  PLANNED: 'b-mute',
  RESERVED: 'b-ok',
  CONFIRMED: 'b-ok',
  ISSUED: 'b-info',
  IN_USE: 'b-info',
  RETURNED: 'b-mute',
  RELEASED: 'b-mute',
};

export interface ResourceReuseCandidate {
  resourceId: string;
  itemName: string;
  serviceName: string;
  availableToReuse: number;
}

/** The one shape both the Event work-order modal and the booking-scoped Resources tab fetch this
 * into — whatever the caller's own Prisma payload/DTO looks like, as long as it carries these
 * fields (structural typing, not a shared Prisma include, since the two callers query differently
 * scoped payloads). */
export interface BookingServiceResourceLike {
  id: string;
  itemNameSnapshot: string | null;
  inventoryItemId: string | null;
  requiredQuantity: number;
  reservedQuantity: number;
  status: string;
  sourceRequirement: { categoryId: string | null; category: { name: string } | null } | null;
  reuseCandidates: ResourceReuseCandidate[];
}

/** One reuse candidate's inline quantity + "Reuse" control — capped at whichever is smaller, what's
 * still available on that target resource or what's still needed on this row. */
function ReuseCandidateRow({
  resource,
  candidate,
  remaining,
  onReuse,
}: {
  resource: BookingServiceResourceLike;
  candidate: ResourceReuseCandidate;
  remaining: number;
  onReuse: (reuseFromResourceId: string, quantity: number, resourceId: string) => void;
}) {
  const cap = Math.min(candidate.availableToReuse, remaining);
  const [qty, setQty] = useState(String(cap));

  return (
    <div className="row between" style={{ gap: 6, padding: '4px 0' }}>
      <span className="mini dim">
        {candidate.availableToReuse} {candidate.itemName} already held by <strong style={{ color: 'var(--ink)' }}>{candidate.serviceName}</strong>
      </span>
      <div className="row" style={{ gap: 6 }}>
        <input
          type="number"
          min={1}
          max={cap}
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          className="input"
          style={{ width: 56, padding: '6px 8px', fontSize: 12 }}
        />
        <button
          type="button"
          onClick={() => onReuse(candidate.resourceId, Math.min(parseInt(qty, 10) || 0, cap), resource.id)}
          className="btn ghost sm"
          style={{ padding: '4px 10px', fontSize: 11 }}
        >
          <Recycle className="w-3 h-3" /> Reuse
        </button>
      </div>
    </div>
  );
}

/** One resource row's inline "Reserve" control — its own local state since each row picks an
 * item/quantity independently and resets once submitted. Reuse candidates (another service's
 * already-active resource for the same item) are offered first; the freeform Reserve control below
 * them covers whatever's still needed beyond what can be reused. */
function ResourceReserveRow({
  resource,
  inventoryItems,
  onReserve,
  onReuse,
  onResolveVariant,
}: {
  resource: BookingServiceResourceLike;
  inventoryItems: InventoryItem[];
  onReserve: (inventoryItemId: string, quantity: number, resourceId: string) => void;
  onReuse: (reuseFromResourceId: string, quantity: number, resourceId: string) => void;
  onResolveVariant: (inventoryItemId: string, resourceId: string) => void;
}) {
  const categoryId = resource.sourceRequirement?.categoryId;
  const eligibleItems = resource.inventoryItemId
    ? inventoryItems.filter((i) => i.id === resource.inventoryItemId)
    : categoryId
    ? inventoryItems.filter((i) => i.categoryId === categoryId)
    : inventoryItems;

  const [pickedItemId, setPickedItemId] = useState(resource.inventoryItemId || eligibleItems[0]?.id || '');
  const remaining = resource.requiredQuantity - resource.reservedQuantity;
  const [qty, setQty] = useState(String(Math.max(remaining, 1)));

  if (remaining <= 0) return null;

  return (
    <div className="stack" style={{ gap: 6 }}>
      {resource.reuseCandidates.length > 0 && (
        <div className="stack" style={{ gap: 2 }}>
          {resource.reuseCandidates.map((c) => (
            <ReuseCandidateRow key={c.resourceId} resource={resource} candidate={c} remaining={remaining} onReuse={onReuse} />
          ))}
        </div>
      )}
      <div className="row" style={{ gap: 6 }}>
        {!resource.inventoryItemId && (
          <select value={pickedItemId} onChange={(e) => setPickedItemId(e.target.value)} className="input" style={{ flex: 1, padding: '6px 8px', fontSize: 12 }}>
            <option value="">-- Pick item --</option>
            {eligibleItems.map((i) => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </select>
        )}
        {!resource.inventoryItemId && resource.sourceRequirement?.categoryId && (
          <button
            type="button"
            onClick={() => pickedItemId && onResolveVariant(pickedItemId, resource.id)}
            disabled={!pickedItemId}
            className="btn ghost sm"
            title="Lock in which item this requirement uses, without reserving stock yet"
          >
            Set variant
          </button>
        )}
        <input
          type="number"
          min={1}
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          className="input"
          style={{ width: 64, padding: '6px 8px', fontSize: 12 }}
        />
        <button
          type="button"
          onClick={() => pickedItemId && onReserve(pickedItemId, parseInt(qty, 10) || 0, resource.id)}
          disabled={!pickedItemId}
          className="btn ghost sm"
        >
          Reserve New
        </button>
      </div>
    </div>
  );
}

interface BookingServiceResourcePanelProps {
  resources: BookingServiceResourceLike[];
  inventoryItems: InventoryItem[];
  onReserveInventory: (options: { inventoryItemId: string; quantity: number; resourceRequirementId?: string }) => void;
  onRemoveReservedInventory: (resourceId: string) => void;
  onReservationAction: (resourceId: string, action: string, quantity?: number) => void;
  onReuseReservation: (resourceRequirementId: string, reuseFromResourceId: string, quantity: number) => void;
  onResolveVariant: (resourceId: string, inventoryItemId: string) => void;
}

/** One lifecycle action — a plain button, unless it's DAMAGE/LOSS, which reveals an inline quantity
 * input first (defaulting to the row's whole reserved amount). */
function LifecycleActionButton({
  resource,
  actionLabel,
  action,
  onAct,
}: {
  resource: BookingServiceResourceLike;
  actionLabel: string;
  action: string;
  onAct: (action: string, quantity?: number) => void;
}) {
  const [promptOpen, setPromptOpen] = useState(false);
  const [qty, setQty] = useState(String(resource.reservedQuantity));

  if (!QUANTITY_PROMPT_ACTIONS.has(action)) {
    return (
      <button type="button" onClick={() => onAct(action)} className="btn ghost sm" style={{ padding: '4px 10px', fontSize: 11 }}>
        {actionLabel}
      </button>
    );
  }

  if (!promptOpen) {
    return (
      <button type="button" onClick={() => setPromptOpen(true)} className="btn ghost sm" style={{ padding: '4px 10px', fontSize: 11 }}>
        {actionLabel}
      </button>
    );
  }

  return (
    <span className="row" style={{ gap: 4 }}>
      <input
        type="number"
        min={1}
        max={resource.reservedQuantity}
        value={qty}
        onChange={(e) => setQty(e.target.value)}
        className="input"
        style={{ width: 52, padding: '4px 6px', fontSize: 11 }}
      />
      <button
        type="button"
        onClick={() => {
          const n = Math.min(parseInt(qty, 10) || 0, resource.reservedQuantity);
          if (n > 0) onAct(action, n);
          setPromptOpen(false);
        }}
        className="btn ghost sm"
        style={{ padding: '4px 10px', fontSize: 11 }}
      >
        {actionLabel}
      </button>
    </span>
  );
}

/** The full per-line resource management block: every `BookingServiceResource` row for one
 * `BookingService`, each with its status badge, lifecycle actions (Allocate/Use/Return/Release), and
 * inline Reserve/Reuse controls, plus a freeform "add a resource not covered by a template" picker.
 * Shared between the Event work-order modal and the booking-scoped Resources tab — both hit the same
 * booking-scoped API underneath, this is just the one UI for it. */
export default function BookingServiceResourcePanel({
  resources,
  inventoryItems,
  onReserveInventory,
  onRemoveReservedInventory,
  onReservationAction,
  onReuseReservation,
  onResolveVariant,
}: BookingServiceResourcePanelProps) {
  const [selectedInventoryId, setSelectedInventoryId] = useState('');
  const [reserveQuantity, setReserveQuantity] = useState('1');

  const handleFreeformReserve = () => {
    if (!selectedInventoryId) return;
    const qty = parseInt(reserveQuantity || '0', 10);
    if (!qty || qty <= 0) return;
    onReserveInventory({ inventoryItemId: selectedInventoryId, quantity: qty });
    setSelectedInventoryId('');
    setReserveQuantity('1');
  };

  return (
    <div className="stack" style={{ gap: 10 }}>
      {resources.length > 0 && (
        <>
          <p className="mini dim">What this service needs — reserve against a row to fulfill it, then advance it through Allocate/Use/Return.</p>
          <div className="stack" style={{ gap: 8, padding: 8, border: '1px solid var(--rule)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-deep)' }}>
            {resources.map((r) => {
              const label = r.itemNameSnapshot || (r.sourceRequirement?.category?.name ? `Any ${r.sourceRequirement.category.name}` : 'Unresolved item');
              return (
                <div key={r.id} className="stack" style={{ gap: 6, padding: 8, borderRadius: 'var(--radius-sm)', background: 'var(--surface-solid)' }}>
                  <div className="between">
                    <span className="mini" style={{ color: 'var(--ink)' }}>{label}</span>
                    <div className="row" style={{ gap: 6 }}>
                      <span className="mini dim">{r.reservedQuantity} / {r.requiredQuantity} reserved</span>
                      <span className={`badge ${STATUS_BADGE_CLASS[r.status] || 'b-mute'}`}>{r.status}</span>
                      {(r.status === 'PLANNED' || r.status === 'RESERVED' || r.status === 'CONFIRMED') && (
                        <button
                          type="button"
                          onClick={() => onRemoveReservedInventory(r.id)}
                          className="icon-btn"
                          style={{ width: 24, height: 24, flexShrink: 0 }}
                          title="Release"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <ResourceReserveRow
                    resource={r}
                    inventoryItems={inventoryItems}
                    onReserve={(inventoryItemId, quantity, resourceId) =>
                      onReserveInventory({ inventoryItemId, quantity, resourceRequirementId: resourceId })
                    }
                    onReuse={(reuseFromResourceId, quantity, resourceId) =>
                      onReuseReservation(resourceId, reuseFromResourceId, quantity)
                    }
                    onResolveVariant={(inventoryItemId, resourceId) => onResolveVariant(resourceId, inventoryItemId)}
                  />
                  {(RESERVATION_ACTIONS[r.status] || []).length > 0 && (
                    <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                      {RESERVATION_ACTIONS[r.status].map(({ label: actionLabel, action }) => (
                        <LifecycleActionButton
                          key={action}
                          resource={r}
                          actionLabel={actionLabel}
                          action={action}
                          onAct={(a, quantity) => onReservationAction(r.id, a, quantity)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      <p className="mini dim">Add a resource not covered by a template above.</p>
      <div className="row">
        <select
          value={selectedInventoryId}
          onChange={(e) => setSelectedInventoryId(e.target.value)}
          className="input"
          style={{ flex: 1 }}
        >
          <option value="">-- Select Inventory Item --</option>
          {inventoryItems.map((i) => (
            <option key={i.id} value={i.id}>{i.name} ({i.totalQuantity} in stock)</option>
          ))}
        </select>
        <input
          type="number"
          min={1}
          value={reserveQuantity}
          onChange={(e) => setReserveQuantity(e.target.value)}
          className="input"
          style={{ width: 80 }}
        />
        <button
          type="button"
          onClick={handleFreeformReserve}
          disabled={!selectedInventoryId}
          className="btn ghost sm"
        >
          + Reserve
        </button>
      </div>
    </div>
  );
}
