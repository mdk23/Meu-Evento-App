'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
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
import { getActiveWorkspace, setActiveWorkspace, Workspace } from '@/lib/workspace';

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  // Starts null so server-rendered markup doesn't guess a workspace the client hasn't read from
  // localStorage yet — same reasoning as ThemeSwitch. Defaults to EVENT once hydrated, since that's
  // the workspace every booking belonged to before Space bookings existed.
  const [workspace, setWorkspace] = useState<Workspace | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved === 'true') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsCollapsed(true);
    }
    setWorkspace(getActiveWorkspace() ?? 'EVENT');
  }, []);

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem('sidebar-collapsed', String(nextState));
  };

  const switchWorkspace = (next: Workspace) => {
    setActiveWorkspace(next);
    setWorkspace(next);
    router.push(next === 'SPACE' ? '/bookings?context=SPACE' : '/events');
  };

  /** A link with a query string (e.g. `?context=SPACE`) is only "active" when every one of its
   * params matches the current URL — otherwise the generic `/bookings` link would also light up
   * while viewing the Space-filtered list, and vice versa. */
  const isItemActive = (href: string): boolean => {
    const [hrefPath, hrefQuery] = href.split('?');
    const pathMatches = pathname === hrefPath || (hrefPath !== '/' && pathname.startsWith(hrefPath));
    if (!pathMatches) return false;
    if (!hrefQuery) return searchParams.toString() === '';
    const hrefParams = new URLSearchParams(hrefQuery);
    for (const [key, value] of hrefParams.entries()) {
      if (searchParams.get(key) !== value) return false;
    }
    return true;
  };

  const spaceNavItems = [
    { label: 'Space Bookings', href: '/bookings?context=SPACE', icon: BookmarkCheck },
    { label: 'Space Services', href: '/services?scope=SPACE', icon: Briefcase },
    { label: 'Space Packages', href: '/services/packages?scope=SPACE', icon: Boxes },
  ];

  const eventNavItems = [
    { label: 'Events', href: '/events', icon: Sparkles },
    { label: 'Event Services', href: '/services?scope=EVENT', icon: Briefcase },
    { label: 'Event Packages', href: '/services/packages?scope=EVENT', icon: Boxes },
  ];

  const navGroups = [
    {
      label: workspace === 'SPACE' ? 'Space Workspace' : 'Event Workspace',
      items: workspace === 'SPACE' ? spaceNavItems : eventNavItems,
    },
    {
      label: 'Shared',
      items: [
        { label: 'Overview', href: workspace === 'SPACE' ? '/overview?context=SPACE' : '/overview?context=EVENT', icon: LayoutDashboard },
        { label: 'Calendar', href: '/calendar', icon: CalendarDays },
        { label: 'All Bookings', href: '/bookings', icon: BookmarkCheck },
        { label: 'Waiting List', href: '/bookings?status=WAITING_LIST', icon: Clock },
        { label: 'Clients', href: '/clients', icon: Users },
        { label: 'Services', href: '/services', icon: Briefcase },
        { label: 'Resources', href: '/resources', icon: Boxes },
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

      {!isCollapsed && workspace && (
        <div className="row" style={{ gap: 4, padding: '0 8px' }}>
          <button
            onClick={() => switchWorkspace('SPACE')}
            className={`pill${workspace === 'SPACE' ? ' active' : ''}`}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            Space
          </button>
          <button
            onClick={() => switchWorkspace('EVENT')}
            className={`pill${workspace === 'EVENT' ? ' active' : ''}`}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            Event
          </button>
        </div>
      )}

      <nav className="flex-1 space-y-1 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!isCollapsed && <div className="nav-sec label">{group.label}</div>}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = isItemActive(item.href);
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
