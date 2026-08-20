import { Sparkles, Briefcase, CheckSquare, Users, Package, Truck, CreditCard, Gauge } from 'lucide-react';
import { TabId } from './types';

const TABS: { id: TabId; label: string; icon: typeof Sparkles }[] = [
  { id: 'overview', label: 'Overview', icon: Sparkles },
  { id: 'services', label: 'Services', icon: Briefcase },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'guests', label: 'Guests', icon: Users },
  { id: 'resources', label: 'Resources', icon: Package },
  { id: 'suppliers', label: 'Suppliers', icon: Truck },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'execution', label: 'Execution', icon: Gauge },
];

interface EventDetailTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export default function EventDetailTabs({ activeTab, onTabChange }: EventDetailTabsProps) {
  return (
    <div className="tabs" style={{ padding: '0 34px' }}>
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`tab${isActive ? ' active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Icon className="w-4 h-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
