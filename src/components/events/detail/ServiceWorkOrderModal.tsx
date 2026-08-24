import { useState } from 'react';
import { X, Loader2, Users, Package, AlertTriangle, ClipboardList, Recycle } from 'lucide-react';
import { Staff, Supplier, InventoryItem } from '@prisma/client';
import { EventServiceWithRelations, ResourceRequirement } from './types';

const RESERVATION_ACTIONS: Record<string, { label: string; action: string }[]> = {
  HELD: [{ label: 'Confirm', action: 'CONFIRM' }, { label: 'Release', action: 'RELEASE' }],
  CONFIRMED: [{ label: 'Allocate', action: 'ALLOCATE' }, { label: 'Use', action: 'USE' }, { label: 'Release', action: 'RELEASE' }],
  CONSUMED: [{ label: 'Return', action: 'RETURN' }],
  RETURNED: [],
  RELEASED: [],
  CANCELLED: [],
};

const STATUS_BADGE_CLASS: Record<string, string> = {
  HELD: 'b-warn',
  CONFIRMED: 'b-ok',
  CONSUMED: 'b-info',
  RETURNED: 'b-mute',
  RELEASED: 'b-mute',
  CANCELLED: 'b-bad',
};

/** One reuse candidate's inline quantity + "Reuse" control — capped at whichever is smaller, what's
 * still available on that reservation or what's still needed on this requirement. */
function ReuseCandidateRow({
  requirement,
  candidate,
  remaining,
  onReuse,
}: {
  requirement: ResourceRequirement;
  candidate: ResourceRequirement['reuseCandidates'][number];
  remaining: number;
  onReuse: (reuseReservationId: string, quantity: number, resourceRequirementId: string) => void;
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
          onClick={() => onReuse(candidate.reservationId, Math.min(parseInt(qty, 10) || 0, cap), requirement.id)}
          className="btn ghost sm"
          style={{ padding: '4px 10px', fontSize: 11 }}
        >
          <Recycle className="w-3 h-3" /> Reuse
        </button>
      </div>
    </div>
  );
}

/** One requirement row's inline "Reserve" control — its own local state since each row picks an
 * item/quantity independently and resets once submitted. Reuse candidates (Phase 17 — another
 * service's already-active reservation for the same item) are offered first; the freeform Reserve
 * control below them covers whatever's still needed beyond what can be reused. */
function RequirementReserveRow({
  requirement,
  inventoryItems,
  onReserve,
  onReuse,
}: {
  requirement: ResourceRequirement;
  inventoryItems: InventoryItem[];
  onReserve: (inventoryItemId: string, quantity: number, resourceRequirementId: string) => void;
  onReuse: (reuseReservationId: string, quantity: number, resourceRequirementId: string) => void;
}) {
  const categoryId = requirement.sourceRequirement?.categoryId;
  const eligibleItems = requirement.inventoryItemId
    ? inventoryItems.filter((i) => i.id === requirement.inventoryItemId)
    : categoryId
    ? inventoryItems.filter((i) => i.categoryId === categoryId)
    : inventoryItems;

  const [pickedItemId, setPickedItemId] = useState(requirement.inventoryItemId || eligibleItems[0]?.id || '');
  const remaining = Number(requirement.requiredQuantity) - Number(requirement.providedQuantity);
  const [qty, setQty] = useState(String(Math.max(remaining, 1)));

  if (remaining <= 0) return null;

  return (
    <div className="stack" style={{ gap: 6 }}>
      {requirement.reuseCandidates.length > 0 && (
        <div className="stack" style={{ gap: 2 }}>
          {requirement.reuseCandidates.map((c) => (
            <ReuseCandidateRow key={c.reservationId} requirement={requirement} candidate={c} remaining={remaining} onReuse={onReuse} />
          ))}
        </div>
      )}
      <div className="row" style={{ gap: 6 }}>
        {!requirement.inventoryItemId && (
          <select value={pickedItemId} onChange={(e) => setPickedItemId(e.target.value)} className="input" style={{ flex: 1, padding: '6px 8px', fontSize: 12 }}>
            <option value="">-- Pick item --</option>
            {eligibleItems.map((i) => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </select>
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
          onClick={() => pickedItemId && onReserve(pickedItemId, parseInt(qty, 10) || 0, requirement.id)}
          disabled={!pickedItemId}
          className="btn ghost sm"
        >
          Reserve New
        </button>
      </div>
    </div>
  );
}

interface ServiceWorkOrderModalProps {
  selectedService: EventServiceWithRelations;
  workOrderStatus: string;
  setWorkOrderStatus: (status: string) => void;
  sellingPrice: string;
  setSellingPrice: (price: string) => void;
  newTaskTitle: string;
  setNewTaskTitle: (title: string) => void;
  supplierId: string;
  setSupplierId: (id: string) => void;
  supplierCost: string;
  setSupplierCost: (cost: string) => void;
  supplierStatus: string;
  setSupplierStatus: (status: string) => void;
  paymentStatus: string;
  setPaymentStatus: (status: string) => void;
  suppliers: Supplier[];
  savingWorkOrder: boolean;
  workOrderError: string;
  onToggleTask: (taskId: string) => void;
  onAddTask: () => void;
  onRemoveTask: (taskId: string) => void;
  staff: Staff[];
  selectedStaffId: string;
  setSelectedStaffId: (id: string) => void;
  onAssignStaff: () => void;
  onUnassignStaff: (assignmentId: string) => void;
  inventoryItems: InventoryItem[];
  selectedInventoryId: string;
  setSelectedInventoryId: (id: string) => void;
  reserveQuantity: string;
  setReserveQuantity: (quantity: string) => void;
  onReserveInventory: (options?: { inventoryItemId?: string; quantity?: number; resourceRequirementId?: string }) => void;
  onRemoveReservedInventory: (reservationId: string) => void;
  onReservationAction: (reservationId: string, action: string) => void;
  onReuseReservation: (resourceRequirementId: string, reuseReservationId: string, quantity: number) => void;
  onSave: () => void;
  onClose: () => void;
}

export default function ServiceWorkOrderModal({
  selectedService,
  workOrderStatus,
  setWorkOrderStatus,
  sellingPrice,
  setSellingPrice,
  newTaskTitle,
  setNewTaskTitle,
  supplierId,
  setSupplierId,
  supplierCost,
  setSupplierCost,
  supplierStatus,
  setSupplierStatus,
  paymentStatus,
  setPaymentStatus,
  suppliers,
  savingWorkOrder,
  workOrderError,
  onToggleTask,
  onAddTask,
  onRemoveTask,
  staff,
  selectedStaffId,
  setSelectedStaffId,
  onAssignStaff,
  onUnassignStaff,
  inventoryItems,
  selectedInventoryId,
  setSelectedInventoryId,
  reserveQuantity,
  setReserveQuantity,
  onReserveInventory,
  onRemoveReservedInventory,
  onReservationAction,
  onReuseReservation,
  onSave,
  onClose,
}: ServiceWorkOrderModalProps) {
  const isInternal = selectedService.providerType === 'INTERNAL';
  const accentVar = isInternal ? 'var(--ok)' : 'var(--info)';
  const tasks = selectedService.serviceTasks;
  const assignedStaff = selectedService.staffAssignments;
  const reservedInventory = selectedService.inventoryReservations;
  const resourceRequirements = selectedService.resourceRequirements;
  const unassignedStaff = staff.filter((s) => !assignedStaff.some((a) => a.staffId === s.id));

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div
        className="modal wide"
        style={{ padding: 0, display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="between" style={{ padding: 20, borderBottom: '1px solid var(--rule)', flexShrink: 0 }}>
          <div>
            <span className={`badge ${isInternal ? 'b-ok' : 'b-info'}`}>
              {isInternal ? '🟢 Internal Work Order' : '🔵 External Supplier'}
            </span>
            <h3 className="h-md" style={{ marginTop: 6 }}>{selectedService.service?.name}</h3>
          </div>
          <button onClick={onClose} className="icon-btn">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="stack" style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
          {workOrderError && (
            <div className="alert bad">
              <AlertTriangle className="w-4 h-4 shrink-0" style={{ marginTop: 2 }} />
              <span>{workOrderError}</span>
            </div>
          )}

          <div className="grid g2">
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Operational Work Order Status</label>
              <select
                value={workOrderStatus}
                onChange={(e) => setWorkOrderStatus(e.target.value)}
                className="input"
              >
                <option value="PLANNING">PLANNING</option>
                <option value="READY">READY</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            {isInternal && (
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="label">Selling Price (MT)</label>
                <input
                  type="number"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  className="input"
                />
              </div>
            )}
          </div>

          <div className="stack" style={{ gap: 10 }}>
            <h4 className="mini" style={{ fontWeight: 700, color: 'var(--ink)' }}>Execution Tasks</h4>
            <div className="row">
              <input
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Add task title..."
                className="input"
                style={{ flex: 1 }}
              />
              <button type="button" onClick={onAddTask} className="btn ghost sm">
                + Add
              </button>
            </div>

            <div
              className="stack"
              style={{ gap: 8, maxHeight: 144, overflowY: 'auto', padding: 8, border: '1px solid var(--rule)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-deep)' }}
            >
              {tasks.map((t) => (
                <div key={t.id} className="between" style={{ padding: 8, borderRadius: 'var(--radius-sm)', background: 'var(--surface-solid)' }}>
                  <label className="row" style={{ gap: 10, cursor: 'pointer', flex: 1, minWidth: 0 }}>
                    <input
                      type="checkbox"
                      checked={t.status === 'DONE'}
                      onChange={() => onToggleTask(t.id)}
                      style={{ width: 16, height: 16, accentColor: 'var(--accent)', flexShrink: 0 }}
                    />
                    <span className="mini" style={t.status === 'DONE' ? { textDecoration: 'line-through', color: 'var(--ink-3)' } : { color: 'var(--ink)' }}>
                      {t.title}
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => onRemoveTask(t.id)}
                    className="icon-btn"
                    style={{ width: 28, height: 28, flexShrink: 0 }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="stack" style={{ gap: 10 }}>
            <h4 className="mini row" style={{ gap: 6, fontWeight: 700, color: 'var(--ink)' }}>
              <Users className="w-4 h-4" style={{ color: accentVar }} /> {isInternal ? 'Assigned Staff' : 'Coordinator Staff'}
            </h4>
            <div className="row">
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="input"
                style={{ flex: 1 }}
              >
                <option value="">-- Select Staff Member --</option>
                {unassignedStaff.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                ))}
              </select>
              <button
                type="button"
                onClick={onAssignStaff}
                disabled={!selectedStaffId}
                className="btn ghost sm"
              >
                + Assign
              </button>
            </div>

            {assignedStaff.length > 0 && (
              <div
                className="stack"
                style={{ gap: 8, maxHeight: 128, overflowY: 'auto', padding: 8, border: '1px solid var(--rule)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-deep)' }}
              >
                {assignedStaff.map((a) => (
                  <div key={a.id} className="between" style={{ padding: 8, borderRadius: 'var(--radius-sm)', background: 'var(--surface-solid)' }}>
                    <span className="mini" style={{ color: 'var(--ink)' }}>
                      {a.staffNameSnapshot} <span style={{ color: 'var(--ink-3)' }}>({a.role})</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => onUnassignStaff(a.id)}
                      className="icon-btn"
                      style={{ width: 28, height: 28, flexShrink: 0 }}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {isInternal && resourceRequirements.length > 0 && (
            <div className="stack" style={{ gap: 10 }}>
              <h4 className="mini row" style={{ gap: 6, fontWeight: 700, color: 'var(--ink)' }}>
                <ClipboardList className="w-4 h-4" style={{ color: accentVar }} /> Resource Requirements
              </h4>
              <p className="mini dim">What this service&apos;s catalog template needs — reserve against a row to fulfill it.</p>
              <div className="stack" style={{ gap: 8, padding: 8, border: '1px solid var(--rule)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-deep)' }}>
                {resourceRequirements.map((req) => {
                  const required = Number(req.requiredQuantity);
                  const provided = Number(req.providedQuantity);
                  const label = req.itemNameSnapshot || (req.sourceRequirement?.category?.name ? `Any ${req.sourceRequirement.category.name}` : 'Unresolved item');
                  return (
                    <div key={req.id} className="stack" style={{ gap: 6, padding: 8, borderRadius: 'var(--radius-sm)', background: 'var(--surface-solid)' }}>
                      <div className="between">
                        <span className="mini" style={{ color: 'var(--ink)' }}>{label}</span>
                        <span className="mini dim">{provided} / {required} provided</span>
                      </div>
                      <RequirementReserveRow
                        requirement={req}
                        inventoryItems={inventoryItems}
                        onReserve={(inventoryItemId, quantity, resourceRequirementId) =>
                          onReserveInventory({ inventoryItemId, quantity, resourceRequirementId })
                        }
                        onReuse={(reuseReservationId, quantity, resourceRequirementId) =>
                          onReuseReservation(resourceRequirementId, reuseReservationId, quantity)
                        }
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {isInternal && (
            <div className="stack" style={{ gap: 10 }}>
              <h4 className="mini row" style={{ gap: 6, fontWeight: 700, color: 'var(--ink)' }}>
                <Package className="w-4 h-4" style={{ color: accentVar }} /> Reserved Inventory
              </h4>
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
                  onClick={() => onReserveInventory()}
                  disabled={!selectedInventoryId}
                  className="btn ghost sm"
                >
                  + Reserve
                </button>
              </div>

              {reservedInventory.length > 0 && (
                <div
                  className="stack"
                  style={{ gap: 8, maxHeight: 220, overflowY: 'auto', padding: 8, border: '1px solid var(--rule)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-deep)' }}
                >
                  {reservedInventory.map((r) => (
                    <div key={r.id} className="stack" style={{ gap: 6, padding: 8, borderRadius: 'var(--radius-sm)', background: 'var(--surface-solid)' }}>
                      <div className="between">
                        <span className="mini" style={{ color: 'var(--ink)' }}>
                          {r.itemNameSnapshot} <span style={{ color: 'var(--ink-3)' }}>× {r.quantity}</span>
                        </span>
                        <div className="row" style={{ gap: 6 }}>
                          <span className={`badge ${STATUS_BADGE_CLASS[r.status] || 'b-mute'}`}>{r.status}</span>
                          <button
                            type="button"
                            onClick={() => onRemoveReservedInventory(r.id)}
                            className="icon-btn"
                            style={{ width: 24, height: 24, flexShrink: 0 }}
                            title="Release"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      {(RESERVATION_ACTIONS[r.status] || []).length > 0 && (
                        <div className="row" style={{ gap: 6 }}>
                          {RESERVATION_ACTIONS[r.status].map(({ label, action }) => (
                            <button
                              key={action}
                              type="button"
                              onClick={() => onReservationAction(r.id, action)}
                              className="btn ghost sm"
                              style={{ padding: '4px 10px', fontSize: 11 }}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!isInternal && (
            <div className="stack" style={{ gap: 16, paddingTop: 20, borderTop: '1px solid var(--rule)' }}>
              <h4 className="label" style={{ color: 'var(--info)' }}>Supplier</h4>
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="label">Assign External Supplier</label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="input"
                >
                  <option value="">-- Select Supplier Partner --</option>
                  {suppliers.map((sup) => (
                    <option key={sup.id} value={sup.id}>{sup.name} ({sup.category})</option>
                  ))}
                </select>
              </div>

              <div className="grid g2">
                <div className="field" style={{ marginBottom: 0 }}>
                  <label className="label">Supplier Cost (MT)</label>
                  <input
                    type="number"
                    value={supplierCost}
                    onChange={(e) => setSupplierCost(e.target.value)}
                    className="input"
                  />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label className="label">Supplier Status</label>
                  <select
                    value={supplierStatus}
                    onChange={(e) => setSupplierStatus(e.target.value)}
                    className="input"
                  >
                    <option value="REQUESTED">REQUESTED</option>
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="DELIVERED">DELIVERED</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>

              <div className="field" style={{ marginBottom: 0 }}>
                <label className="label">Supplier Payment Status</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="input"
                >
                  <option value="UNPAID">UNPAID</option>
                  <option value="PARTIAL">PARTIAL</option>
                  <option value="PAID">PAID</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="row" style={{ justifyContent: 'flex-end', padding: 20, borderTop: '1px solid var(--rule)', flexShrink: 0 }}>
          <button type="button" onClick={onClose} className="btn ghost sm">
            Cancel
          </button>
          <button type="button" onClick={onSave} disabled={savingWorkOrder} className="btn primary sm">
            {savingWorkOrder ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Work Order'}
          </button>
        </div>
      </div>
    </div>
  );
}
