'use client';

import React from 'react';
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
  Building2
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Calendar', href: '/calendar', icon: CalendarDays },
    { label: 'Bookings', href: '/bookings', icon: BookmarkCheck },
    { label: 'Events', href: '/events', icon: Sparkles },
    { label: 'Clients', href: '/clients', icon: Users },
    { label: 'Services', href: '/services', icon: Briefcase },
    { label: 'Finance', href: '/finance', icon: TrendingUp },
    { label: 'Resources', href: '/resources', icon: Boxes },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-zinc-900 bg-zinc-950 flex flex-col shrink-0">
      <div className="p-6 border-b border-zinc-900">
        <Link href="/">
          <h1 className="text-white font-black text-xl flex items-center gap-2 tracking-tight cursor-pointer">
            <Building2 className="w-6 h-6 text-violet-500" />
            AuraVenue
          </h1>
        </Link>
        <p className="text-[10px] text-zinc-500 mt-1 uppercase font-bold tracking-widest">Royal Events Co.</p>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all ${
                isActive
                  ? 'text-white bg-violet-600/15 border border-violet-500/30 text-violet-300 font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-violet-400' : 'text-zinc-500'}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
