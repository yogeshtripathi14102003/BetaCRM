'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Kanban, List } from 'lucide-react';
import { cn } from '@/lib/cn';

const OPTIONS = [
  { value: 'list', label: 'List', icon: List },
  { value: 'board', label: 'Board', icon: Kanban },
];

// List <-> Board: search aur source filter saath jaate hain (status board me columns hi hain)
export default function ViewToggle({ view }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const go = (next) => {
    if (next === view) return;
    const q = new URLSearchParams(sp.toString());
    q.delete('page');
    q.delete('status');
    q.delete('sort');
    if (next === 'board') q.set('view', 'board');
    else q.delete('view');
    const s = q.toString();
    router.replace(s ? `${pathname}?${s}` : pathname);
  };

  return (
    <div role="group" aria-label="View" className="border-line bg-surface inline-flex rounded-lg border p-0.5">
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          aria-pressed={view === value}
          onClick={() => go(value)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm',
            view === value ? 'bg-brand-soft text-brand font-medium' : 'text-muted hover:text-fg'
          )}
        >
          <Icon className="h-4 w-4" /> {label}
        </button>
      ))}
    </div>
  );
}
