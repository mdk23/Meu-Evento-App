'use client';

import { useState } from 'react';
import { Sliders, Layers, Tags, Boxes, Sparkles, ShieldCheck } from 'lucide-react';
import Topbar from '@/components/aurelia/Topbar';
import ServiceCategoriesSection, { ServiceCategoryRow } from '@/components/settings/ServiceCategoriesSection';
import InventoryCategoriesSection, { InventoryCategoryRow } from '@/components/settings/InventoryCategoriesSection';
import InventoryTypesSection from '@/components/settings/InventoryTypesSection';
import type { InventoryTypeDTO } from '@/types/dtos';

type TabId = 'general' | 'service-categories' | 'inventory-categories' | 'inventory-types';

const TABS: { id: TabId; label: string; icon: typeof Sliders; hint: string }[] = [
  { id: 'general', label: 'General', icon: Sliders, hint: 'Organization & engine preferences' },
  { id: 'service-categories', label: 'Service Categories', icon: Layers, hint: 'The "Category" picker on the Services page' },
  { id: 'inventory-categories', label: 'Inventory Categories', icon: Tags, hint: 'Groups for physical stock variants' },
  { id: 'inventory-types', label: 'Inventory Types', icon: Boxes, hint: 'What kind of resource an item is + its characteristics' },
];

interface SettingsClientProps {
  serviceCategories: ServiceCategoryRow[];
  inventoryCategories: InventoryCategoryRow[];
  inventoryTypes: InventoryTypeDTO[];
}

function GeneralPanel() {
  return (
    <div className="card plain">
      <div>
        <h3 className="h-md" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sliders className="w-5 h-5" style={{ color: 'var(--accent)' }} /> Organization Branding & Preferences
        </h3>
        <p className="mini dim" style={{ marginTop: 4 }}>Global properties and access permissions.</p>
      </div>

      <div style={{ marginTop: 20 }}>
        <div className="kv">
          <div className="k">
            <span style={{ color: 'var(--ink)', fontWeight: 600, display: 'block' }}>Company Name</span>
            <span className="mini dim">Royal Events Co.</span>
          </div>
          <span className="badge b-accent">Primary Tenant</span>
        </div>

        <div className="kv">
          <div className="k">
            <span style={{ color: 'var(--ink)', fontWeight: 600, display: 'block' }}>Auto-Invoice Generation</span>
            <span className="mini dim">Automatically trigger client invoices upon booking confirmation.</span>
          </div>
          <span className="badge b-ok">
            <ShieldCheck className="w-3.5 h-3.5" /> Enabled
          </span>
        </div>

        <div className="kv">
          <div className="k">
            <span style={{ color: 'var(--ink)', fontWeight: 600, display: 'block' }}>Service Work Order Engine</span>
            <span className="mini dim">Enable operational Work Order layer for Internal and External execution types.</span>
          </div>
          <span className="badge b-accent">
            <Sparkles className="w-3.5 h-3.5" /> Active
          </span>
        </div>
      </div>
    </div>
  );
}

export default function SettingsClient({ serviceCategories, inventoryCategories, inventoryTypes }: SettingsClientProps) {
  const [active, setActive] = useState<TabId>('general');
  const activeTab = TABS.find((t) => t.id === active)!;

  return (
    <main className="aurelia-shell flex-1 flex flex-col h-screen overflow-hidden">
      <Topbar crumb="System Settings" note={activeTab.hint} />

      <div className="flex-1 overflow-y-auto page full-bleed">
        <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start', maxWidth: 1500, margin: '0 auto' }}>

          {/* VERTICAL TAB RAIL */}
          <aside
            className="card plain"
            style={{ width: 244, flexShrink: 0, position: 'sticky', top: 0, padding: 14 }}
          >
            <p className="label" style={{ padding: '2px 10px 12px' }}>Settings</p>
            <div className="stack" style={{ gap: 2 }}>
              {TABS.map((t) => {
                const isActive = active === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActive(t.id)}
                    className={`nav-item${isActive ? ' active' : ''}`}
                    style={{
                      width: '100%',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      font: 'inherit',
                      ...(isActive ? {} : { background: 'transparent' }),
                    }}
                  >
                    <t.icon className="w-4 h-4" style={{ flexShrink: 0 }} />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* CONTENT */}
          <div className="flex-1" style={{ minWidth: 0 }}>
            {active === 'general' && <GeneralPanel />}
            {active === 'service-categories' && <ServiceCategoriesSection initialCategories={serviceCategories} />}
            {active === 'inventory-categories' && <InventoryCategoriesSection initialCategories={inventoryCategories} />}
            {active === 'inventory-types' && (
              <InventoryTypesSection initialTypes={inventoryTypes} categories={inventoryCategories} />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
