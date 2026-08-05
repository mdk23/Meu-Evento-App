import { CheckSquare } from 'lucide-react';
import { WorkOrderTask } from '../types';

interface TasksTabProps {
  allEventTasks: (WorkOrderTask & { serviceName?: string; providerType?: string })[];
}

export default function TasksTab({ allEventTasks }: TasksTabProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
      <h3 className="text-white font-bold text-base flex items-center gap-2">
        <CheckSquare className="w-5 h-5 text-emerald-400" /> Operational Checklist Across All Services
      </h3>
      {allEventTasks.length === 0 ? (
        <p className="text-xs text-zinc-500">No tasks created. Click on any service in the Services tab to add work order tasks.</p>
      ) : (
        <div className="space-y-2">
          {allEventTasks.map((t, index) => (
            <div key={index} className="bg-zinc-950 p-3 rounded-xl border border-zinc-850 flex justify-between items-center text-xs">
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={t.status === 'DONE'} readOnly className="accent-violet-600 w-4 h-4" />
                <span className={t.status === 'DONE' ? 'line-through text-zinc-500' : 'text-zinc-200 font-medium'}>
                  {t.title}
                </span>
              </div>
              <span className="text-[10px] text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-md font-bold">
                {t.serviceName}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
