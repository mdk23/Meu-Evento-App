import type { CSSProperties } from 'react';

// Shared status vocabulary across the event detail tabs. EventStatus (PLANNING/READY/
// IN_PROGRESS/COMPLETED) and EventService.status (same values plus CANCELLED) both map onto the
// aurelia.css semantic tokens so badges, the execution stepper, and progress bars stay in sync
// across OverviewTab/ServicesTab/TasksTab — mirrors the pattern in src/components/calendar/statusColors.ts.
const EVENT_STATUS_TOKEN: Record<string, string> = {
  PLANNING: '--ink-3',
  READY: '--warn',
  IN_PROGRESS: '--info',
  COMPLETED: '--ok',
  CANCELLED: '--bad',
};

const EVENT_STATUS_BADGE: Record<string, string> = {
  PLANNING: 'b-mute',
  READY: 'b-warn',
  IN_PROGRESS: 'b-info',
  COMPLETED: 'b-ok',
  CANCELLED: 'b-bad',
};

export function eventStatusToken(status: string): string {
  return EVENT_STATUS_TOKEN[status] || '--ink-3';
}

export function eventStatusBadgeClass(status: string): string {
  return EVENT_STATUS_BADGE[status] || 'b-mute';
}

export function eventStatusDotStyle(status: string): CSSProperties {
  return { background: `var(${eventStatusToken(status)})` };
}

const GUEST_STATUS_BADGE: Record<string, string> = {
  PENDING: 'b-warn',
  CONFIRMED: 'b-ok',
  DECLINED: 'b-bad',
};

export function guestStatusBadgeClass(status: string): string {
  return GUEST_STATUS_BADGE[status] || 'b-mute';
}

export function providerTypeBadgeClass(providerType: string): string {
  return providerType === 'INTERNAL' ? 'b-ok' : 'b-info';
}
