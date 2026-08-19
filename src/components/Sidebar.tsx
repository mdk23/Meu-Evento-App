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

  const navGroups = [
    {
      label: 'Overview',
      items: [
        { label: 'Dashboard', href: '/', icon: LayoutDashboard },
        { label: 'Calendar', href: '/calendar', icon: CalendarDays },
      ],
    },
    {
      label: 'Bookings',
      items: [
        { label: 'Bookings', href: '/bookings', icon: BookmarkCheck },
        { label: 'Waiting List', href: '/bookings?status=WAITING_LIST', icon: Clock },
        { label: 'Events', href: '/events', icon: Sparkles },
      ],
    },
    {
      label: 'Relationships',
      items: [
        { label: 'Clients', href: '/clients', icon: Users },
        { label: 'Services', href: '/services', icon: Briefcase },
        { label: 'Resources', href: '/resources', icon: Boxes },
      ],
    },
    {
      label: 'Business',
      items: [
        { label: 'Finance', href: '/finance', icon: TrendingUp },
        { label: 'Settings', href: '/settings', icon: Settings },
      ],
    },
  ];

  return (
    <aside className={`sidebar relative${isCollapsed ? ' is-collapsed' : ''}`}>
      <Link href="/">
        <div className="brand cursor-pointer">
          <Building2 className="brand-mark" style={{ color: 'var(--accent)' }} />
          {!isCollapsed && (
            <div>
              <div className="brand-name">Aurelia</div>
              <div className="brand-sub">Royal Events Co.</div>
            </div>
          )}
        </div>
      </Link>

      <nav className="flex-1 space-y-1 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!isCollapsed && <div className="nav-sec label">{group.label}</div>}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-item relative group${isActive ? ' active' : ''}${isCollapsed ? ' is-collapsed' : ''}`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!isCollapsed && <span>{item.label}</span>}

                  {/* Tooltip on collapsed state */}
                  {isCollapsed && (
                    <div
                      className="absolute left-full ml-4 px-2 py-1 text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none whitespace-nowrap"
                      style={{ background: 'var(--surface-solid)', border: '1px solid var(--rule)', color: 'var(--ink)' }}
                    >
                      {item.label}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Collapse Toggle Button */}
      <button
        onClick={toggleCollapse}
        className="btn sm absolute bottom-4 -right-3 !p-1 !rounded-full shadow-lg z-50 transition-transform"
      >
        {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>
    </aside>
  );
}
