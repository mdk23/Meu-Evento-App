'use client';

import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Settings, Sliders, Sparkles, ShieldCheck } from 'lucide-react';

export default function SettingsHubPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex text-zinc-300 font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* HEADER */}
        <header className="h-16 border-b border-zinc-900 bg-zinc-950/50 flex items-center px-8">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <Settings className="w-5 h-5 text-violet-400" /> System Settings
          </h2>
        </header>

        {/* WORKSPACE */}
        <div className="flex-1 overflow-auto p-8 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6 max-w-2xl">
            <div>
              <h3 className="text-white font-bold text-lg mb-1 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-violet-400" /> Organization Branding & Preferences
              </h3>
              <p className="text-xs text-zinc-500">Configure global properties and access permissions.</p>
            </div>

            <div className="space-y-4 border-t border-zinc-850 pt-4">
              <div className="flex justify-between items-center bg-zinc-950 p-4 rounded-xl border border-zinc-850">
                <div>
                  <span className="text-white font-bold text-sm block">Company Name</span>
                  <span className="text-xs text-zinc-500 mt-0.5">Royal Events Co.</span>
                </div>
                <span className="text-xs font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-3 py-1 rounded-full">
                  Primary Tenant
                </span>
              </div>

              <div className="flex justify-between items-center bg-zinc-950 p-4 rounded-xl border border-zinc-850">
                <div>
                  <span className="text-white font-bold text-sm block">Auto-Invoice Generation</span>
                  <span className="text-xs text-zinc-500 mt-0.5">Automatically trigger client invoices upon booking confirmation.</span>
                </div>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Enabled
                </span>
              </div>

              <div className="flex justify-between items-center bg-zinc-950 p-4 rounded-xl border border-zinc-850">
                <div>
                  <span className="text-white font-bold text-sm block">Service Work Order Engine</span>
                  <span className="text-xs text-zinc-500 mt-0.5">Enable operational Work Order layer for Internal and External execution types.</span>
                </div>
                <span className="text-xs font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-3 py-1 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
