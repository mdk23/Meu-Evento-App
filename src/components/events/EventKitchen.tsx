'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, ChefHat, AlertCircle, RefreshCw } from 'lucide-react';

interface KitchenData {
  menuSummary: Record<string, number>;
  rsvpSummary: {
    PENDING: number;
    ATTENDING: number;
    DECLINED: number;
  };
  totalExpectedCovers: number;
}

export function EventKitchen({ eventId }: { eventId: string }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<KitchenData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prepStatus, setPrepStatus] = useState('NOT_STARTED');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      if (active) {
        setLoading(true);
        setError(null);
      }
      try {
        const res = await fetch(`/api/events/${eventId}/kitchen`);
        if (!res.ok) throw new Error('Failed to load kitchen dashboard');
        const json = await res.json();
        if (active) {
          setData(json);
        }
      } catch (err: unknown) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Unknown error occurred');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [eventId, refreshTrigger]);

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-violet-400">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-6 rounded-xl flex items-center gap-3">
        <AlertCircle className="w-6 h-6" />
        <div>
          <h4 className="font-bold">Error loading Kitchen Data</h4>
          <p className="text-xs">{error || 'An unexpected error occurred.'}</p>
        </div>
      </div>
    );
  }

  const { menuSummary = {}, rsvpSummary = { PENDING: 0, ATTENDING: 0, DECLINED: 0 }, totalExpectedCovers = 0 } = data;

  const statuses = [
    { key: 'NOT_STARTED', label: 'Menu Planning', color: 'bg-zinc-800 text-zinc-400 border-zinc-750' },
    { key: 'PREPING', label: 'Ingredient Prep', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    { key: 'COOKING', label: 'Cooking', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    { key: 'READY', label: 'Service Ready', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  ];

  return (
    <div className="space-y-6">
      {/* STATUS AND REFRESH */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-white font-bold text-lg mb-1 flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-amber-400" /> Kitchen & Catering Status
          </h3>
          <p className="text-xs text-zinc-500">Track and manage catering workflow, rsvps, and dietary requirements.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex rounded-lg bg-zinc-950 p-1 border border-zinc-850">
            {statuses.map((s) => (
              <button
                key={s.key}
                onClick={() => setPrepStatus(s.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  prepStatus === s.key
                    ? 'bg-zinc-850 text-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            className="p-2 rounded-lg bg-zinc-950 border border-zinc-850 hover:bg-zinc-900 text-zinc-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* METRIC GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* TOTAL COVERS */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Total Expected Covers</span>
          <span className="text-4xl font-black text-white">{totalExpectedCovers}</span>
          <p className="text-xs text-zinc-500 mt-2">Includes confirmed guests and their plus ones.</p>
        </div>

        {/* RSVPs */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl col-span-2">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-2">RSVP Attendance status</span>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-850/50">
              <span className="block text-xs text-zinc-500 font-bold">Attending</span>
              <span className="text-2xl font-black text-emerald-400">{rsvpSummary.ATTENDING || 0}</span>
            </div>
            <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-850/50">
              <span className="block text-xs text-zinc-500 font-bold">Pending</span>
              <span className="text-2xl font-black text-amber-400">{rsvpSummary.PENDING || 0}</span>
            </div>
            <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-850/50">
              <span className="block text-xs text-zinc-500 font-bold">Declined</span>
              <span className="text-2xl font-black text-zinc-600">{rsvpSummary.DECLINED || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* DIETARY BREAKDOWN */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-white font-bold mb-4">Dietary & Menu Breakdown</h3>
        {Object.keys(menuSummary).length === 0 ? (
          <p className="text-sm text-zinc-500">No menu selections yet. Ensure guests are registered and confirmed attending.</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(menuSummary).map(([pref, count]) => {
              const percentage = totalExpectedCovers > 0 ? (count / totalExpectedCovers) * 100 : 0;
              return (
                <div key={pref} className="bg-zinc-950 p-4 rounded-xl border border-zinc-850">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-bold text-white capitalize">{pref.toLowerCase().replace('_', ' ')}</span>
                    <span className="text-xs text-zinc-400 font-medium">{count} covers ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
