import { Plus, Users, Package, Building2, Truck, Briefcase, ListChecks } from 'lucide-react';
import { EventServiceWithRelations } from '../types';

interface ServicesTabProps {
  eventServices: EventServiceWithRelations[];
  onOpenWorkOrder: (es: EventServiceWithRelations) => void;
  onOpenAddService: () => void;
}

const STATUS_STYLES: Record<string, string> = {
  PLANNING: 'text-zinc-300 bg-zinc-500/10 border-zinc-500/20',
  READY: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  IN_PROGRESS: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  COMPLETED: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  CANCELLED: 'text-red-400 bg-red-500/10 border-red-500/20',
};

export default function ServicesTab({ eventServices, onOpenWorkOrder, onOpenAddService }: ServicesTabProps) {
  const activeServices = eventServices.filter((es) => es.status !== 'CANCELLED');
  const internalCount = activeServices.filter((es) => es.providerType === 'INTERNAL').length;
  const externalCount = activeServices.filter((es) => es.providerType === 'EXTERNAL').length;
  const totalValue = activeServices.reduce((sum, es) => sum + es.sellingPrice, 0);
  const totalTasks = eventServices.reduce((sum, es) => sum + es.serviceTasks.length, 0);
  const doneTasks = eventServices.reduce((sum, es) => sum + es.serviceTasks.filter((t) => t.status === 'DONE').length, 0);

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

      {eventServices.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
              <Briefcase className="w-3 h-3" /> Total Services
            </span>
            <span className="text-lg font-black text-white block">{activeServices.length}</span>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
              <Building2 className="w-3 h-3" /> Internal / External
            </span>
            <span className="text-lg font-black text-white block">
              <span className="text-emerald-400">{internalCount}</span> / <span className="text-blue-400">{externalCount}</span>
            </span>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
              <Package className="w-3 h-3" /> Contracted Value
            </span>
            <span className="text-lg font-black text-white block">{totalValue.toLocaleString()} MT</span>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
              <ListChecks className="w-3 h-3" /> Tasks Done
            </span>
            <span className="text-lg font-black text-white block">{doneTasks} / {totalTasks}</span>
          </div>
        </div>
      )}

      {eventServices.length === 0 ? (
        <div className="text-center py-16 text-zinc-600 border border-dashed border-zinc-800 rounded-2xl p-8">
          <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-30 text-violet-400" />
          <h3 className="text-sm font-bold text-zinc-300">No Services Attached</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            Add a service from the catalog to start building this event&apos;s operational plan.
          </p>
          <button
            onClick={onOpenAddService}
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl transition-all shadow-md"
          >
            <Plus className="w-4 h-4" /> Add Service
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {eventServices.map((es) => {
            const isInternal = es.providerType === 'INTERNAL';
            const staffCount = es.staffAssignments.length;
            const inventoryCount = es.inventoryReservations.length;
            const taskTotal = es.serviceTasks.length;
            const taskDone = es.serviceTasks.filter((t) => t.status === 'DONE').length;
            const statusStyle = STATUS_STYLES[es.status] || STATUS_STYLES.PLANNING;
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
                    <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                      isInternal
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}>
                      {isInternal ? <Building2 className="w-3 h-3" /> : <Truck className="w-3 h-3" />}
                      {isInternal ? 'Internal Work Order' : 'External Supplier'}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusStyle}`}>{es.status}</span>
                  </div>

                  <h4 className="text-white font-bold text-lg">{es.service?.name}</h4>
                  <p className="text-xs text-zinc-500">Category: {es.service?.category}</p>

                  {isInternal ? (
                    <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850 text-xs text-zinc-400 space-y-1">
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

                  {taskTotal > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                        <span className="flex items-center gap-1"><ListChecks className="w-3 h-3" /> Tasks</span>
                        <span>{taskDone} / {taskTotal}</span>
                      </div>
                      <div className="h-1 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-850">
                        <div
                          className="h-full bg-violet-500 rounded-full transition-all"
                          style={{ width: `${taskTotal > 0 ? Math.round((taskDone / taskTotal) * 100) : 0}%` }}
                        />
                      </div>
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
      )}
    </div>
  );
}
