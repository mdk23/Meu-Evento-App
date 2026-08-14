'use client';

import { useEffect, useState } from 'react';
import { Sparkles, Landmark } from 'lucide-react';

export type AureliaTheme = 'ethereal' | 'neoclassical';

const THEMES: { id: AureliaTheme; label: string; icon: typeof Sparkles }[] = [
  { id: 'ethereal', label: 'Ethereal', icon: Sparkles },
  { id: 'neoclassical', label: 'Neoclassical', icon: Landmark },
];

/** Sets the theme on <html> and persists it. Call from anywhere — it's not tied to this component. */
export function setAureliaTheme(theme: AureliaTheme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem('aurelia-theme', theme);
  } catch {
    // localStorage unavailable (private browsing, etc.) — theme just won't persist across reloads.
  }
}

export default function ThemeSwitch() {
  // Starts null so the server-rendered markup doesn't guess a theme the bootstrap
  // script (see layout.tsx) may override before hydration; fills in on mount.
  const [active, setActive] = useState<AureliaTheme | null>(null);

  useEffect(() => {
    // Reading `document` can't move into a lazy useState initializer: it would crash during SSR
    // and, since the client's first render always sees a real `document`, would produce a
    // hydration mismatch against the server-rendered `null`. This effect is reading state owned
    // by an external system (the DOM, set by the pre-hydration bootstrap script in layout.tsx),
    // not deriving state from props — the documented exception to this rule.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActive((document.documentElement.dataset.theme as AureliaTheme) || 'ethereal');
  }, []);

  return (
    <div className="pill-group" style={{ display: 'flex', gap: 6 }}>
      {THEMES.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => {
            setAureliaTheme(id);
            setActive(id);
          }}
          className={`pill${active === id ? ' active' : ''}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          aria-pressed={active === id}
        >
          <Icon size={13} />
          {label}
        </button>
      ))}
    </div>
  );
}
