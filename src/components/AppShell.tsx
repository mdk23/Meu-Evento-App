'use client';

import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import Backdrop from '@/components/aurelia/Backdrop';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 flex text-zinc-300 font-sans">
      <Backdrop />
      <Sidebar />
      <div className="aurelia-content flex-1 flex flex-col h-screen overflow-hidden">
        {children}
      </div>
    </div>
  );
}
