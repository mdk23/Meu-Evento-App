import { CheckSquare, Building2, Truck, AlertCircle, ListChecks, Check } from 'lucide-react';
import { EventServiceWithRelations } from '../types';
import { providerTypeBadgeClass } from '../statusStyles';

interface TasksTabProps {
  eventServices: EventServiceWithRelations[];
  onToggleTask: (eventServiceId: string, taskId: string, currentStatus: string) => void;
  onOpenWorkOrder: (es: EventServiceWithRelations) => void;
}

export default function TasksTab({ eventServices, onToggleTask, onOpenWorkOrder }: TasksTabProps) {
  const servicesWithTasks = eventServices.filter((es) => es.serviceTasks.length > 0);
  const totalTasks = servicesWithTasks.reduce((sum, es) => sum + es.serviceTasks.length, 0);
  const doneTasks = servicesWithTasks.reduce((sum, es) => sum + es.serviceTasks.filter((t) => t.status === 'DONE').length, 0);
  const overallPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  if (servicesWithTasks.length === 0) {
    return (
      <div className="empty">
        <CheckSquare className="w-12 h-12 mx-auto mb-3" style={{ opacity: 0.3 }} />
        <h3 className="h-sm">No Tasks Created</h3>
        <p className="mini dim" style={{ marginTop: 4, maxWidth: 360, marginLeft: 'auto', marginRight: 'auto' }}>
          Click on any service in the Services tab to add work order tasks.
        </p>
      </div>
    );
  }

  return (
    <div className="stack" style={{ gap: 24 }}>
      <div className="grid g3">
        <div className="card plain kpi">
          <span className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ListChecks className="w-3 h-3" /> Total Tasks
          </span>
          <span className="val num">{totalTasks}</span>
        </div>
        <div className="card plain kpi">
          <span className="label">Completed</span>
          <span className="val num" style={{ color: 'var(--ok)' }}>{doneTasks} / {totalTasks}</span>
        </div>
        <div className="card plain kpi">
          <span className="label">Overall Progress</span>
          <span className="val num" style={{ color: 'var(--accent)' }}>{overallPercent}%</span>
        </div>
      </div>

      <div className="stack">
        {servicesWithTasks.map((es) => {
          const isInternal = es.providerType === 'INTERNAL';
          const taskTotal = es.serviceTasks.length;
          const taskDone = es.serviceTasks.filter((t) => t.status === 'DONE').length;
          const now = new Date();

          return (
            <div key={es.id} className="card plain stack">
              <div className="between">
                <div className="row" style={{ minWidth: 0 }}>
                  <span className={`badge ${providerTypeBadgeClass(es.providerType)}`}>
                    {isInternal ? <Building2 className="w-3 h-3" /> : <Truck className="w-3 h-3" />}
                  </span>
                  <h4 className="h-sm" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {es.service?.name || es.serviceNameSnapshot}
                  </h4>
                </div>
                <button onClick={() => onOpenWorkOrder(es)} className="mini" style={{ color: 'var(--accent)', fontWeight: 700, flexShrink: 0 }}>
                  Manage &rarr;
                </button>
              </div>

              <div className="stack" style={{ gap: 4 }}>
                <div className="between label">
                  <span>Task Progress</span>
                  <span>{taskDone} / {taskTotal}</span>
                </div>
                <div className="bar">
                  <span style={{ width: `${taskTotal > 0 ? Math.round((taskDone / taskTotal) * 100) : 0}%` }} />
                </div>
              </div>

              <div className="stack" style={{ gap: 8 }}>
                {es.serviceTasks.map((t) => {
                  const isDone = t.status === 'DONE';
                  const isOverdue = !isDone && t.dueDate && new Date(t.dueDate) < now;
                  return (
                    <div
                      key={t.id}
                      className="between"
                      style={{ background: 'var(--bg-deep)', border: '1px solid var(--rule)', borderRadius: 'var(--radius-sm)', padding: 12, gap: 12 }}
                    >
                      <label className="row" style={{ minWidth: 0, cursor: 'pointer' }}>
                        <span
                          className={`chk${isDone ? ' on' : ''}`}
                          onClick={() => onToggleTask(es.id, t.id, t.status)}
                        >
                          {isDone && <Check className="w-3 h-3" style={{ color: 'var(--surface-solid)' }} />}
                        </span>
                        <span
                          className="mini"
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            textDecoration: isDone ? 'line-through' : 'none',
                            color: isDone ? 'var(--ink-3)' : 'var(--ink)',
                            fontWeight: isDone ? 400 : 600,
                          }}
                        >
                          {t.title}
                        </span>
                      </label>
                      <div className="row" style={{ flexShrink: 0, gap: 8 }}>
                        {t.assignedTo && <span className="badge b-mute">{t.assignedTo}</span>}
                        {t.dueDate && (
                          <span className={`badge ${isOverdue ? 'b-bad' : 'b-mute'}`}>
                            {isOverdue && <AlertCircle className="w-3 h-3" />}
                            {new Date(t.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
