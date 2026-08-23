import React from 'react';
import { Sliders, Sparkles, ShieldCheck } from 'lucide-react';
import Topbar from '@/components/aurelia/Topbar';
import InventoryCategoriesSection from '@/components/settings/InventoryCategoriesSection';
import { InventoryCategoryRepository } from '@/lib/repositories/inventory-category.repository';

export const dynamic = 'force-dynamic';

export default async function SettingsHubPage() {
  const categories = await InventoryCategoryRepository.getCategories();

  return (
    <main className="aurelia-shell flex-1 flex flex-col h-screen overflow-hidden">
      <Topbar crumb="System Settings" />

      <div className="flex-1 overflow-auto page">
        <div className="card plain f-in d1" style={{ maxWidth: 640 }}>
          <div>
            <h3 className="h-md" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sliders className="w-5 h-5" style={{ color: 'var(--accent)' }} /> Organization Branding & Preferences
            </h3>
            <p className="mini dim" style={{ marginTop: 4 }}>Configure global properties and access permissions.</p>
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

        <InventoryCategoriesSection initialCategories={categories} />
      </div>
    </main>
  );
}
