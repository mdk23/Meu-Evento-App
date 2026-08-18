import type { CSSProperties } from 'react';

// Maps booking statuses onto the aurelia.css semantic color tokens (--ok, --warn, --bad, --info)
// so calendar chips/blocks stay in sync with the badge system used across the rest of the app.
const STATUS_TOKEN: Record<string, string> = {
  CONFIRMED: '--ok',
  COMPLETED: '--info',
  RESERVED: '--warn',
  PENDING_CONFIRMATION: '--warn',
  DRAFT: '--warn',
  CANCELLED: '--bad',
  WAITING_LIST: '--ink-3',
};

export function statusToken(status: string): string {
  return STATUS_TOKEN[status] || '--warn';
}

export function statusChipStyle(status: string): CSSProperties {
  const token = statusToken(status);
  return {
    background: `color-mix(in srgb, var(${token}) 14%, transparent)`,
    borderColor: `color-mix(in srgb, var(${token}) 32%, transparent)`,
    color: `var(${token})`,
  };
}
