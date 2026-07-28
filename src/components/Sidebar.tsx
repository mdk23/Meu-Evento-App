'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  CalendarDays, 
  BookmarkCheck, 
  Sparkles, 
  Users, 
  Briefcase, 
  TrendingUp, 
  Boxes, 
  Settings,
  Building2,
  ChevronLeft,
  ChevronRight,
  Clock
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved === 'true') {
      setIsCollapsed(true);
    }
  }, []);

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem('sidebar-collapsed', String(nextState));
  };

  const navItems = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Calendar', href: '/calendar', icon: CalendarDays },
    { label: 'Bookings', href: '/bookings', icon: BookmarkCheck },
    { label: 'Waiting List', href: '/bookings?status=WAITING_LIST', icon: Clock },
    { label: 'Events', href: '/events', icon: Sparkles },
    { label: 'Clients', href: '/clients', icon: Users },
    { label: 'Services', href: '/services', icon: Briefcase },
    { label: 'Finance', href: '/finance', icon: TrendingUp },
    { label: 'Resources', href: '/resources', icon: Boxes },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <aside className={`relative border-r border-zinc-900 bg-zinc-950 flex flex-col shrink-0 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className={`p-6 border-b border-zinc-900 flex items-center justify-between ${isCollapsed ? 'justify-center p-4' : ''}`}>
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer">
            <Building2 className="w-6 h-6 text-violet-500 shrink-0" />
            {!isCollapsed && (
              <h1 className="text-white font-black text-xl tracking-tight animate-in fade-in duration-200">
                AuraVenue
              </h1>
            )}
          </div>
        </Link>
      </div>

      {!isCollapsed && (
        <div className="px-6 py-2 border-b border-zinc-900">
          <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Royal Events Co.</p>
        </div>
      )}

      <nav className={`flex-1 space-y-1 overflow-y-auto ${isCollapsed ? 'p-2' : 'p-4'}`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all relative group ${
                isCollapsed ? 'justify-center px-0' : ''
              } ${
                isActive
                  ? 'text-white bg-violet-600/15 border border-violet-500/30 text-violet-300 font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-violet-400' : 'text-zinc-500'}`} />
              {!isCollapsed && <span>{item.label}</span>}

              {/* Tooltip on collapsed state */}
              {isCollapsed && (
                <div className="absolute left-full ml-4 px-2 py-1 bg-zinc-900 border border-zinc-800 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none whitespace-nowrap">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle Button */}
      <button
        onClick={toggleCollapse}
        className="absolute bottom-4 -right-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white p-1 rounded-full shadow-lg z-50 transition-transform"
      >
        {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>
    </aside>
  );
}
