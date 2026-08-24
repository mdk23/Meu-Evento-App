import { Plus, Users, Package, Building2, Truck, Briefcase, ListChecks } from 'lucide-react';
import { EventServiceWithRelations } from '../types';
import { eventStatusBadgeClass, providerTypeBadgeClass } from '../statusStyles';

interface ServicesTabProps {
  eventServices: EventServiceWithRelations[];
  onOpenWorkOrder: (es: EventServiceWithRelations) => void;
  onOpenAddService: () => void;
}

export default function ServicesTab({ eventServices, onOpenWorkOrder, onOpenAddService }: ServicesTabProps) {
  const activeServices = eventServices.filter((es) => es.status !== 'CANCELLED');
  const internalCount = activeServices.filter((es) => es.providerType === 'INTERNAL').length;
  const externalCount = activeServices.filter((es) => es.providerType === 'EXTERNAL').length;
  const totalValue = activeServices.reduce((sum, es) => sum + es.sellingPrice, 0);
  const totalTasks = eventServices.reduce((sum, es) => sum + es.serviceTasks.length, 0);
  const doneTasks = eventServices.reduce((sum, es) => sum + es.serviceTasks.filter((t) => t.status === 'DONE').length, 0);

  return (
    <div className="stack" style={{ gap: 24 }}>
      <div className="between">
        <div>
          <h3 className="h-md">Attached Services</h3>
          <p className="mini dim">Click any service to manage its operational work order & supplier workflow.</p>
        </div>
        <button onClick={onOpenAddService} className="btn primary sm">
          <Plus className="w-4 h-4" /> Add Service to Event
        </button>
      </div>

      {eventServices.length > 0 && (
        <div className="grid g4">
          <div className="card plain kpi">
            <span className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Briefcase className="w-3 h-3" /> Total Services
            </span>
            <span className="val num">{activeServices.length}</span>
          </div>
          <div className="card plain kpi">
            <span className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Building2 className="w-3 h-3" /> Internal / External
            </span>
            <span className="val num">
              <span style={{ color: 'var(--ok)' }}>{internalCount}</span> / <span style={{ color: 'var(--info)' }}>{externalCount}</span>
            </span>
          </div>
          <div className="card plain kpi">
            <span className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Package className="w-3 h-3" /> Contracted Value
            </span>
            <span className="val num">{totalValue.toLocaleString()} MT</span>
          </div>
          <div className="card plain kpi">
            <span className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ListChecks className="w-3 h-3" /> Tasks Done
            </span>
            <span className="val num">{doneTasks} / {totalTasks}</span>
          </div>
        </div>
      )}

      {eventServices.length === 0 ? (
        <div className="empty">
          <Briefcase className="w-12 h-12 mx-auto mb-3" style={{ opacity: 0.3 }} />
          <h3 className="h-sm">No Services Attached</h3>
          <p className="mini dim" style={{ marginTop: 4, maxWidth: 360, marginLeft: 'auto', marginRight: 'auto' }}>
            Add a service from the catalog to start building this event&apos;s operational plan.
          </p>
          <button onClick={onOpenAddService} className="btn primary sm" style={{ marginTop: 16, display: 'inline-flex' }}>
            <Plus className="w-4 h-4" /> Add Service
          </button>
        </div>
      ) : (
        <div className="grid g3">
          {eventServices.map((es) => {
            const isInternal = es.providerType === 'INTERNAL';
            const staffCount = es.staffAssignments.length;
            const inventoryCount = es.resources.filter((r) => r.status === 'RESERVED' || r.status === 'IN_USE').length;
            const taskTotal = es.serviceTasks.length;
            const taskDone = es.serviceTasks.filter((t) => t.status === 'DONE').length;
            return (
              <div
                key={es.id}
                onClick={() => onOpenWorkOrder(es)}
                className="card plain stack"
                style={{ cursor: 'pointer', justifyContent: 'space-between' }}
              >
                <div className="stack" style={{ gap: 12 }}>
                  <div className="between">
                    <span className={`badge ${providerTypeBadgeClass(es.providerType)}`}>
                      {isInternal ? <Building2 className="w-3 h-3" /> : <Truck className="w-3 h-3" />}
                      {isInternal ? 'Internal Work Order' : 'External Supplier'}
                    </span>
                    <span className={`badge ${eventStatusBadgeClass(es.status)}`}>{es.status}</span>
                  </div>

                  <h4 className="h-sm">{es.service?.name}</h4>
                  <p className="mini dim">Category: {es.service?.category}</p>

                  {isInternal ? (
                    <div
                      className="mini dim stack"
                      style={{ background: 'var(--bg-deep)', border: '1px solid var(--rule)', borderRadius: 'var(--radius-sm)', padding: 12, gap: 4 }}
                    >
                      <p>Selling Price: <strong style={{ color: 'var(--ink)' }}>{es.sellingPrice.toLocaleString()} MT</strong></p>
                      {(staffCount > 0 || inventoryCount > 0) && (
                        <div className="row" style={{ gap: 12, paddingTop: 4 }}>
                          {staffCount > 0 && (
                            <span className="row" style={{ gap: 4, color: 'var(--ok)' }}>
                              <Users className="w-3 h-3" /> {staffCount} staff
                            </span>
                          )}
                          {inventoryCount > 0 && (
                            <span className="row" style={{ gap: 4, color: 'var(--ok)' }}>
                              <Package className="w-3 h-3" /> {inventoryCount} items
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      className="mini dim stack"
                      style={{ background: 'var(--bg-deep)', border: '1px solid var(--rule)', borderRadius: 'var(--radius-sm)', padding: 12, gap: 4 }}
                    >
                      <p>Supplier: <strong style={{ color: 'var(--info)' }}>{es.supplier?.name || 'Not assigned'}</strong></p>
                      <p>Supplier Cost: <strong style={{ color: 'var(--ink)' }}>{es.supplierCost.toLocaleString()} MT</strong></p>
                      <p>Supplier Status: <strong style={{ color: 'var(--warn)' }}>{es.supplierStatus}</strong></p>
                    </div>
                  )}

                  {taskTotal > 0 && (
                    <div className="stack" style={{ gap: 4 }}>
                      <div className="between label">
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><ListChecks className="w-3 h-3" /> Tasks</span>
                        <span>{taskDone} / {taskTotal}</span>
                      </div>
                      <div className="bar">
                        <span style={{ width: `${taskTotal > 0 ? Math.round((taskDone / taskTotal) * 100) : 0}%` }} />
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ paddingTop: 12, borderTop: '1px solid var(--rule)', textAlign: 'right' }}>
                  <span className="mini" style={{ color: 'var(--accent)', fontWeight: 700 }}>Manage Work Order &rarr;</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
