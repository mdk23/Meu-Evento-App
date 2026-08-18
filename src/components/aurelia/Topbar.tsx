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
      <div className="crumb">
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
    </header>
  );
}
