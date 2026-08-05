import { Plus, Users, Package } from 'lucide-react';
import { EventServiceWithRelations } from '../types';

interface ServicesTabProps {
  eventServices: EventServiceWithRelations[];
  onOpenWorkOrder: (es: EventServiceWithRelations) => void;
  onOpenAddService: () => void;
}

export default function ServicesTab({ eventServices, onOpenWorkOrder, onOpenAddService }: ServicesTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-white font-bold text-base">Attached Services</h3>
          <p className="text-xs text-zinc-500">Click any service to manage its operational work order & supplier workflow.</p>
        </div>
        <button
          onClick={onOpenAddService}
          className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg"
        >
          <Plus className="w-4 h-4" /> Add Service to Event
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {eventServices.map((es) => {
          const isInternal = es.providerType === 'INTERNAL';
          const staffCount = es.staffAssignments.length;
          const inventoryCount = es.inventoryReservations.length;
          return (
            <div
              key={es.id}
              onClick={() => onOpenWorkOrder(es)}
              className={`bg-zinc-900 border rounded-2xl p-6 shadow-xl cursor-pointer hover:scale-[1.01] transition-all flex flex-col justify-between space-y-4 ${
                isInternal ? 'border-emerald-500/30 hover:border-emerald-500' : 'border-blue-500/30 hover:border-blue-500'
              }`}
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                    isInternal
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}>
                    {isInternal ? '🟢 Internal Work Order' : '🔵 External Supplier'}
                  </span>
                  <span className="text-xs font-bold text-zinc-400">{es.status}</span>
                </div>

                <h4 className="text-white font-bold text-lg">{es.service?.name}</h4>
                <p className="text-xs text-zinc-500">Category: {es.service?.category}</p>

                {isInternal ? (
                  <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850 text-xs text-zinc-400 space-y-1">
                    <p>Operational Status: <strong className="text-emerald-400">{es.status}</strong></p>
                    <p>Selling Price: <strong className="text-zinc-200">{es.sellingPrice.toLocaleString()} MT</strong></p>
                    {(staffCount > 0 || inventoryCount > 0) && (
                      <div className="flex gap-3 pt-1">
                        {staffCount > 0 && (
                          <span className="flex items-center gap-1 text-emerald-400">
                            <Users className="w-3 h-3" /> {staffCount} staff
                          </span>
                        )}
                        {inventoryCount > 0 && (
                          <span className="flex items-center gap-1 text-emerald-400">
                            <Package className="w-3 h-3" /> {inventoryCount} items
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850 text-xs text-zinc-400 space-y-1">
                    <p>Supplier: <strong className="text-blue-400">{es.supplier?.name || 'Not assigned'}</strong></p>
                    <p>Supplier Cost: <strong className="text-zinc-200">{es.supplierCost.toLocaleString()} MT</strong></p>
                    <p>Supplier Status: <strong className="text-amber-400">{es.supplierStatus}</strong></p>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-zinc-850 text-right">
                <span className="text-xs text-violet-400 font-bold hover:underline">Manage Work Order →</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
