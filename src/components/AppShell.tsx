'use client';

import React, { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import Backdrop from '@/components/aurelia/Backdrop';

export function AppShell({ children }: { children: React.ReactNode }) {
  // The workspace picker ("/") is a gate screen shown before you're inside either workspace —
  // it deliberately has no sidebar, since sidebar navigation only makes sense once you've picked one.
  const pathname = usePathname();
  const isPickerRoute = pathname === '/';

  return (
    <div className="min-h-screen flex font-sans" style={{ background: 'var(--bg)', color: 'var(--ink)' }}>
      <Backdrop />
      {!isPickerRoute && (
        // Sidebar reads useSearchParams() (to highlight the active nav item on query-string
        // routes like `?context=VENUE`) — that requires a Suspense boundary so statically-rendered
        // pages (e.g. the 404 page) don't fail to prerender.
        <Suspense fallback={<aside className="sidebar" />}>
          <Sidebar />
        </Suspense>
      )}
      <div className="aurelia-content flex-1 flex flex-col h-screen overflow-hidden">
        {children}
      </div>
    </div>
  );
}
