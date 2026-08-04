import { X, ChefHat, Loader2 } from 'lucide-react';
import { Supplier } from '@prisma/client';
import { EventServiceWithRelations, WorkOrderCustomFields, WorkOrderTask } from './types';

interface ServiceWorkOrderModalProps {
  selectedService: EventServiceWithRelations;
  workOrderStatus: string;
  setWorkOrderStatus: (status: string) => void;
  customFields: WorkOrderCustomFields;
  setCustomFields: (fields: WorkOrderCustomFields) => void;
  tasks: WorkOrderTask[];
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
  onToggleTask: (taskId: string) => void;
  onAddTask: () => void;
  onSave: () => void;
  onClose: () => void;
}

export default function ServiceWorkOrderModal({
  selectedService,
  workOrderStatus,
  setWorkOrderStatus,
  customFields,
  setCustomFields,
  tasks,
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
  onToggleTask,
  onAddTask,
  onSave,
  onClose,
}: ServiceWorkOrderModalProps) {
  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-2xl shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
          <div>
            <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
              selectedService.providerType === 'INTERNAL' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'
            }`}>
              {selectedService.providerType === 'INTERNAL' ? '🟢 Internal Work Order' : '🔵 External Supplier'}
            </span>
            <h3 className="text-white font-bold text-lg mt-1">{selectedService.service?.name}</h3>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {selectedService.providerType === 'INTERNAL' ? (
          <div className="space-y-6">
            <div>
              <label className="text-xs text-zinc-400 font-bold block mb-1">Operational Work Order Status</label>
              <select
                value={workOrderStatus}
                onChange={(e) => setWorkOrderStatus(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-emerald-500"
              >
                <option value="DRAFT">DRAFT</option>
                <option value="PLANNING">PLANNING</option>
                <option value="PREPARING">PREPARING</option>
                <option value="READY">READY</option>
                <option value="EXECUTING">EXECUTING</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>
            </div>

            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 space-y-3">
              <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <ChefHat className="w-4 h-4" /> Operational Parameters (Menu / Specifications)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-zinc-500 font-bold block mb-1">Main Selection / Theme</label>
                  <input
                    value={customFields.theme || customFields.menu?.main || ''}
                    onChange={(e) => setCustomFields({ ...customFields, theme: e.target.value })}
                    placeholder="e.g. Grilled Salmon or Gold Decor"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 font-bold block mb-1">Dietary / Color Palette</label>
                  <input
                    value={customFields.dietary || customFields.colors || ''}
                    onChange={(e) => setCustomFields({ ...customFields, dietary: e.target.value })}
                    placeholder="e.g. 10 Vegetarians or White/Gold"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none"
                  />
                </div>
              </div>
            </div>

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
                  <label key={t.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-900 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={t.completed}
                      onChange={() => onToggleTask(t.id)}
                      className="accent-emerald-500 w-4 h-4"
                    />
                    <span className={t.completed ? 'line-through text-zinc-500' : 'text-zinc-200'}>{t.title}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
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
