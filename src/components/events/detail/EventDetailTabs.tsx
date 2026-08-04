import { Sparkles, Briefcase, Users, CheckSquare, TrendingUp, FileText } from 'lucide-react';
import { TabId } from './types';

const TABS: { id: TabId; label: string; icon: typeof Sparkles }[] = [
  { id: 'overview', label: 'Overview', icon: Sparkles },
  { id: 'services', label: 'Services', icon: Briefcase },
  { id: 'guests', label: 'Guests', icon: Users },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'finance', label: 'Finance', icon: TrendingUp },
  { id: 'documents', label: 'Documents', icon: FileText },
];

interface EventDetailTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export default function EventDetailTabs({ activeTab, onTabChange }: EventDetailTabsProps) {
  return (
    <div className="bg-zinc-950 border-b border-zinc-900 px-8 flex gap-6">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
              isActive
                ? 'border-violet-500 text-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'text-violet-400' : 'text-zinc-500'}`} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
