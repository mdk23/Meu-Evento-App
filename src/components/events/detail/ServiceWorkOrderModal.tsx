import { X, ChefHat, Loader2, Users, Package, AlertTriangle } from 'lucide-react';
import { Staff, Supplier, InventoryItem } from '@prisma/client';
import { EventServiceWithRelations, WorkOrderCustomFields, parseFieldSchema } from './types';
import DynamicFieldsForm from './DynamicFieldsForm';

interface ServiceWorkOrderModalProps {
  selectedService: EventServiceWithRelations;
  workOrderStatus: string;
  setWorkOrderStatus: (status: string) => void;
  customFields: WorkOrderCustomFields;
  setCustomFields: (fields: WorkOrderCustomFields) => void;
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
  onReserveInventory: () => void;
  onRemoveReservedInventory: (reservationId: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export default function ServiceWorkOrderModal({
  selectedService,
  workOrderStatus,
  setWorkOrderStatus,
  customFields,
  setCustomFields,
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
  onSave,
  onClose,
}: ServiceWorkOrderModalProps) {
  const isInternal = selectedService.providerType === 'INTERNAL';
  const tasks = selectedService.serviceTasks;
  const assignedStaff = selectedService.staffAssignments;
  const reservedInventory = selectedService.inventoryReservations;
  const unassignedStaff = staff.filter((s) => !assignedStaff.some((a) => a.staffId === s.id));
  const fieldSchema = parseFieldSchema(selectedService.service?.fieldSchema);

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-2xl shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
          <div>
            <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
              isInternal ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'
            }`}>
              {isInternal ? '🟢 Internal Work Order' : '🔵 External Supplier'}
            </span>
            <h3 className="text-white font-bold text-lg mt-1">{selectedService.service?.name}</h3>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {workOrderError && (
          <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl p-3">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{workOrderError}</span>
          </div>
        )}

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-zinc-400 font-bold block mb-1">Operational Work Order Status</label>
              <select
                value={workOrderStatus}
                onChange={(e) => setWorkOrderStatus(e.target.value)}
                className={`w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-xs outline-none ${isInternal ? 'focus:border-emerald-500' : 'focus:border-blue-500'}`}
              >
                <option value="PLANNING">PLANNING</option>
                <option value="READY">READY</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            {isInternal && (
              <div>
                <label className="text-xs text-zinc-400 font-bold block mb-1">Selling Price (MT)</label>
                <input
                  type="number"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-emerald-500"
                />
              </div>
            )}
          </div>

          {fieldSchema.length > 0 && (
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 space-y-3">
              <h4 className={`text-xs font-bold flex items-center gap-1.5 ${isInternal ? 'text-emerald-400' : 'text-blue-400'}`}>
                <ChefHat className="w-4 h-4" /> Operational Parameters
              </h4>
              <DynamicFieldsForm fields={fieldSchema} values={customFields} onChange={setCustomFields} />
            </div>
          )}

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white">Execution Tasks</h4>
            <div className="flex gap-2">
              <input
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Add task title..."
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none"
              />
              <button
                type="button"
                onClick={onAddTask}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold"
              >
                + Add
              </button>
            </div>

            <div className="space-y-2 max-h-36 overflow-y-auto p-2 bg-zinc-950 border border-zinc-850 rounded-xl">
              {tasks.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-zinc-900 text-xs">
                  <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={t.status === 'DONE'}
                      onChange={() => onToggleTask(t.id)}
                      className="accent-emerald-500 w-4 h-4 shrink-0"
                    />
                    <span className={t.status === 'DONE' ? 'line-through text-zinc-500' : 'text-zinc-200'}>{t.title}</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => onRemoveTask(t.id)}
                    className="text-zinc-500 hover:text-red-400 shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Users className={isInternal ? 'w-4 h-4 text-emerald-400' : 'w-4 h-4 text-blue-400'} /> {isInternal ? 'Assigned Staff' : 'Coordinator Staff'}
            </h4>
            <div className="flex gap-2">
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none"
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
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold disabled:opacity-40"
              >
                + Assign
              </button>
            </div>

            {assignedStaff.length > 0 && (
              <div className="space-y-2 max-h-32 overflow-y-auto p-2 bg-zinc-950 border border-zinc-850 rounded-xl">
                {assignedStaff.map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-2 rounded-lg bg-zinc-900 text-xs">
                    <span className="text-zinc-200">{a.staffNameSnapshot} <span className="text-zinc-500">({a.role})</span></span>
                    <button
                      type="button"
                      onClick={() => onUnassignStaff(a.id)}
                      className="text-zinc-500 hover:text-red-400"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Package className={isInternal ? 'w-4 h-4 text-emerald-400' : 'w-4 h-4 text-blue-400'} /> Reserved Inventory
            </h4>
            <div className="flex gap-2">
              <select
                value={selectedInventoryId}
                onChange={(e) => setSelectedInventoryId(e.target.value)}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none"
              >
                <option value="">-- Select Inventory Item --</option>
                {inventoryItems.map((i) => (
                  <option key={i.id} value={i.id}>{i.name} ({i.quantity} in stock)</option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                value={reserveQuantity}
                onChange={(e) => setReserveQuantity(e.target.value)}
                className="w-20 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none"
              />
              <button
                type="button"
                onClick={onReserveInventory}
                disabled={!selectedInventoryId}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold disabled:opacity-40"
              >
                + Reserve
              </button>
            </div>

            {reservedInventory.length > 0 && (
              <div className="space-y-2 max-h-32 overflow-y-auto p-2 bg-zinc-950 border border-zinc-850 rounded-xl">
                {reservedInventory.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-2 rounded-lg bg-zinc-900 text-xs">
                    <span className="text-zinc-200">{r.itemNameSnapshot} <span className="text-zinc-500">× {r.quantity}</span></span>
                    <button
                      type="button"
                      onClick={() => onRemoveReservedInventory(r.id)}
                      className="text-zinc-500 hover:text-red-400"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!isInternal && (
            <div className="border-t border-zinc-800 pt-6 space-y-4">
              <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wide">Supplier</h4>
              <div>
                <label className="text-xs text-zinc-400 font-bold block mb-1">Assign External Supplier</label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-blue-500"
                >
                  <option value="">-- Select Supplier Partner --</option>
                  {suppliers.map((sup) => (
                    <option key={sup.id} value={sup.id}>{sup.name} ({sup.category})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 font-bold block mb-1">Supplier Cost (MT)</label>
                  <input
                    type="number"
                    value={supplierCost}
                    onChange={(e) => setSupplierCost(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-white text-xs outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 font-bold block mb-1">Supplier Status</label>
                  <select
                    value={supplierStatus}
                    onChange={(e) => setSupplierStatus(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-white text-xs outline-none focus:border-blue-500"
                  >
                    <option value="REQUESTED">REQUESTED</option>
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="DELIVERED">DELIVERED</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-bold block mb-1">Supplier Payment Status</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-white text-xs outline-none focus:border-blue-500"
                >
                  <option value="UNPAID">UNPAID</option>
                  <option value="PARTIAL">PARTIAL</option>
                  <option value="PAID">PAID</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={savingWorkOrder}
            className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold flex items-center gap-2"
          >
            {savingWorkOrder ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Work Order'}
          </button>
        </div>
      </div>
    </div>
  );
}
