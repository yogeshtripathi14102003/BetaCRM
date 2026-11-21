'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useCan } from '@/hooks/useCan';
import { useFollowupCounts } from '@/features/followups/hooks';

// Abhi sirf followups (overdue / aaj). Backend notifications API bane to yahan list jodna.
export default function NotificationBell() {
  const can = useCan();
  const allowed = can('followup.read');
  const { today, overdue } = useFollowupCounts({ enabled: allowed });
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, []);

  if (!allowed) return null;
  const total = overdue + today;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${total ? `, ${total} pending` : ''}`}
        aria-expanded={open}
        className="text-muted hover:bg-subtle hover:text-fg relative rounded-lg p-2"
      >
        <Bell className="h-[18px] w-[18px]" />
        {total > 0 && (
          <span className="bg-danger absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white">
            {total > 99 ? '99+' : total}
          </span>
        )}
      </button>

      {open && (
        <div className="border-line bg-surface absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-xl border shadow-lg">
          <p className="border-line border-b px-4 py-2.5 text-sm font-semibold">Followups</p>
          <ul className="p-1.5 text-sm">
            <li>
              <Link
                href="/crm/followups?bucket=overdue"
                onClick={() => setOpen(false)}
                className="hover:bg-subtle flex items-center justify-between rounded-lg px-3 py-2"
              >
                <span>Overdue</span>
                <span className={overdue ? 'text-danger font-semibold' : 'text-muted'}>{overdue}</span>
              </Link>
            </li>
            <li>
              <Link
                href="/crm/followups?bucket=today"
                onClick={() => setOpen(false)}
                className="hover:bg-subtle flex items-center justify-between rounded-lg px-3 py-2"
              >
                <span>Due today</span>
                <span className="font-semibold">{today}</span>
              </Link>
            </li>
          </ul>
          {total === 0 && <p className="text-muted px-4 pb-3 text-xs">Sab clear hai 🎉</p>}
        </div>
      )}
    </div>
  );
}
