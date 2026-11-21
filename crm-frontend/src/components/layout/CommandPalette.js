'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { CornerDownLeft, Search, UserPlus, Plus, User } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { useCan } from '@/hooks/useCan';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/query/keys';
import { leadService } from '@/services';
import { visibleNav } from './Sidebar';
import { cn } from '@/lib/cn';

// Ctrl/Cmd + K: pages par jaao, quick actions, aur leads search (naam/phone/email)
export default function CommandPalette({ open, onClose }) {
  // open hone par naya mount: query/selection apne aap reset, alag effect nahi chahiye
  return open ? <Palette onClose={onClose} /> : null;
}

function Palette({ onClose }) {
  const router = useRouter();
  const { user } = useAuth();
  const can = useCan();
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const debounced = useDebounce(q, 250);

  const leadParams = { search: debounced.trim(), limit: 5 };
  const leads = useQuery({
    queryKey: queryKeys.leads.list(leadParams),
    queryFn: ({ signal }) => leadService.list(leadParams, { signal }),
    enabled: can('lead.read') && debounced.trim().length >= 2,
  });

  const items = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const match = (label) => !needle || label.toLowerCase().includes(needle);

    const actions = [
      can('lead.create') && { id: 'a:new-lead', group: 'Actions', label: 'New lead', icon: Plus, href: '/crm/leads/new' },
      can('user.create') && { id: 'a:new-user', group: 'Actions', label: 'New user', icon: UserPlus, href: '/admin/users/new' },
    ].filter(Boolean);
    const pages = visibleNav(user).flatMap((g) =>
      g.items.map((i) => ({ id: `p:${i.href}`, group: 'Go to', label: i.label, icon: i.icon, href: i.href, hint: g.title }))
    );
    const found = (leads.data?.items || []).map((l) => ({
      id: `l:${l.id}`,
      group: 'Leads',
      label: l.name,
      hint: `${l.phone} • ${l.status}`,
      icon: User,
      href: `/crm/leads/${l.id}`,
    }));

    return [...actions.filter((a) => match(a.label)), ...pages.filter((p) => match(p.label)), ...found];
  }, [q, user, can, leads.data]);

  const activeIndex = Math.min(active, Math.max(items.length - 1, 0)); // list chhoti ho to clamp

  const run = (item) => {
    if (!item) return;
    onClose();
    router.push(item.href);
  };
  const onKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      run(items[activeIndex]);
    }
  };

  let lastGroup = null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/50 p-4 pt-[12vh] backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="border-line bg-surface w-full max-w-xl overflow-hidden rounded-xl border shadow-2xl"
        onKeyDown={onKeyDown}
      >
        <div className="border-line flex items-center gap-2 border-b px-4">
          <Search className="text-faint h-4 w-4" />
          <input
            autoFocus
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            placeholder="Page, action ya lead (naam / phone) search karo..."
            aria-label="Search commands"
            className="placeholder:text-faint h-12 flex-1 bg-transparent text-sm outline-none"
          />
          <kbd className="border-line text-muted rounded border px-1.5 py-0.5 text-[10px]">Esc</kbd>
        </div>

        <ul role="listbox" aria-label="Results" className="max-h-80 overflow-y-auto p-2">
          {items.length === 0 && (
            <li className="text-muted px-3 py-8 text-center text-sm">{leads.isFetching ? 'Searching...' : 'Kuch nahi mila'}</li>
          )}
          {items.map((item, i) => {
            const header = item.group !== lastGroup ? item.group : null;
            lastGroup = item.group;
            const Icon = item.icon;
            return (
              <li key={item.id} role="presentation">
                {header && <p className="text-faint px-3 pt-2 pb-1 text-[11px] font-semibold tracking-wider uppercase">{header}</p>}
                <button
                  type="button"
                  role="option"
                  aria-selected={i === activeIndex}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => run(item)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm',
                    i === activeIndex ? 'bg-brand-soft text-brand' : 'hover:bg-subtle'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.hint && <span className="text-muted truncate text-xs">{item.hint}</span>}
                  {i === activeIndex && <CornerDownLeft className="h-3.5 w-3.5" />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
