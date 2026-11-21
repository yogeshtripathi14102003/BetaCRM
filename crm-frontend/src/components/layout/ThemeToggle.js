'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useIsClient } from '@/hooks/useIsClient';

const OPTIONS = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

// Compact toggle: click par light -> dark -> system. Settings page me full chooser (ThemeChooser).
export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useIsClient(); // hydration mismatch se bachav

  const current = OPTIONS.find((o) => o.value === (mounted ? theme : 'system')) || OPTIONS[2];
  const next = OPTIONS[(OPTIONS.indexOf(current) + 1) % OPTIONS.length];
  const Icon = current.icon;

  return (
    <button
      type="button"
      onClick={() => setTheme(next.value)}
      title={`Theme: ${current.label} (click: ${next.label})`}
      aria-label={`Theme: ${current.label}. Switch to ${next.label}`}
      className="text-muted hover:bg-subtle hover:text-fg rounded-lg p-2"
    >
      <Icon className="h-[18px] w-[18px]" />
    </button>
  );
}

export function ThemeChooser() {
  const { theme, setTheme } = useTheme();
  const mounted = useIsClient();
  return (
    <div role="radiogroup" aria-label="Theme" className="grid max-w-md grid-cols-3 gap-3">
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = mounted && theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(value)}
            className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-sm ${active ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-surface hover:bg-subtle'}`}
          >
            <Icon className="h-5 w-5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
