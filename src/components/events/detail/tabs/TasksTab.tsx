import { CheckSquare, Building2, Truck, AlertCircle, ListChecks } from 'lucide-react';
import { EventServiceWithRelations } from '../types';

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
      <div className="text-center py-16 text-zinc-600 border border-dashed border-zinc-800 rounded-2xl p-8">
        <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-30 text-emerald-400" />
        <h3 className="text-sm font-bold text-zinc-300">No Tasks Created</h3>
        <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
          Click on any service in the Services tab to add work order tasks.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
            <ListChecks className="w-3 h-3" /> Total Tasks
          </span>
          <span className="text-lg font-black text-white block">{totalTasks}</span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1.5 block">Completed</span>
          <span className="text-lg font-black text-emerald-400 block">{doneTasks} / {totalTasks}</span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1.5 block">Overall Progress</span>
          <span className="text-lg font-black text-violet-400 block">{overallPercent}%</span>
        </div>
      </div>

      <div className="space-y-4">
        {servicesWithTasks.map((es) => {
          const isInternal = es.providerType === 'INTERNAL';
          const taskTotal = es.serviceTasks.length;
          const taskDone = es.serviceTasks.filter((t) => t.status === 'DONE').length;
          const now = new Date();

          return (
            <div key={es.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 ${
                    isInternal
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}>
                    {isInternal ? <Building2 className="w-3 h-3" /> : <Truck className="w-3 h-3" />}
                  </span>
                  <h4 className="text-white font-bold text-sm truncate">{es.service?.name || es.serviceNameSnapshot}</h4>
                </div>
                <button
                  onClick={() => onOpenWorkOrder(es)}
                  className="text-[11px] font-bold text-violet-400 hover:text-violet-300 shrink-0"
                >
                  Manage →
                </button>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                  <span>Task Progress</span>
                  <span>{taskDone} / {taskTotal}</span>
                </div>
                <div className="h-1 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-850">
                  <div
                    className="h-full bg-violet-500 rounded-full transition-all"
                    style={{ width: `${taskTotal > 0 ? Math.round((taskDone / taskTotal) * 100) : 0}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                {es.serviceTasks.map((t) => {
                  const isDone = t.status === 'DONE';
                  const isOverdue = !isDone && t.dueDate && new Date(t.dueDate) < now;
                  return (
                    <div key={t.id} className="bg-zinc-950 p-3 rounded-xl border border-zinc-850 flex justify-between items-center text-xs gap-3">
                      <label className="flex items-center gap-3 min-w-0 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isDone}
                          onChange={() => onToggleTask(es.id, t.id, t.status)}
                          className="accent-violet-600 w-4 h-4 shrink-0"
                        />
                        <span className={`truncate ${isDone ? 'line-through text-zinc-500' : 'text-zinc-200 font-medium'}`}>
                          {t.title}
                        </span>
                      </label>
                      <div className="flex items-center gap-2 shrink-0">
                        {t.assignedTo && (
                          <span className="text-[10px] text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-md">
                            {t.assignedTo}
                          </span>
                        )}
                        {t.dueDate && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                            isOverdue
                              ? 'text-red-400 bg-red-500/10 border border-red-500/20'
                              : 'text-zinc-500 bg-zinc-900 border border-zinc-800'
                          }`}>
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
