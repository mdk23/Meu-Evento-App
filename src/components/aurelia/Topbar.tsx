import { ReactNode } from 'react';
import ThemeSwitch from './ThemeSwitch';

interface TopbarProps {
  /** Page crumb/title — kept short, e.g. "Business Dashboard". */
  crumb: string;
  /** The house voice — one line explaining the rule that governs this screen, not the feature. */
  note?: string;
  /** Right-side actions, rendered before the theme switch. */
  children?: ReactNode;
}

export default function Topbar({ crumb, note, children }: TopbarProps) {
  return (
    <header className="topbar">
      <div
        style={{
          padding: '20px 34px',
          maxWidth: 1440,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
        }}
      >
        <div>
          <h2 className="h-sm">{crumb}</h2>
          {note && (
            <p className="serif-note" style={{ marginTop: 4 }}>
              {note}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          {children}
          <ThemeSwitch />
        </div>
      </div>
    </header>
  );
}
