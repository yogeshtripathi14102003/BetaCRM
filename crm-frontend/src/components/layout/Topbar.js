'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, Menu, Palette, Search, User as UserIcon } from 'lucide-react';
import { useIsMac } from '@/hooks/useIsClient';
import { useAuth } from '@/providers/AuthProvider';
import Avatar from '@/components/ui/Avatar';
import Breadcrumbs from './Breadcrumbs';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';

export default function Topbar({ onMenu, onOpenSearch }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const mac = useIsMac();
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

  const name = user?.displayName || user?.email || '';
  const onLogout = async () => {
    await logout();
    router.replace('/login');
  };
  const itemClass = 'flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-subtle';

  return (
    <header className="border-line bg-surface/85 sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b px-4 backdrop-blur">
      <button className="text-muted hover:bg-subtle rounded-lg p-2 lg:hidden" onClick={onMenu} aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </button>
      <Breadcrumbs />

      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          onClick={onOpenSearch}
          aria-label="Open search"
          className="border-line bg-subtle text-muted hover:text-fg flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm sm:min-w-52"
        >
          <Search className="h-4 w-4" />
          <span className="hidden flex-1 text-left sm:inline">Search...</span>
          <kbd className="border-line bg-surface hidden rounded border px-1.5 text-[10px] sm:inline">{mac ? '⌘ K' : 'Ctrl K'}</kbd>
        </button>
        <NotificationBell />
        <ThemeToggle />

        <div className="relative ml-1" ref={ref}>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Account menu"
            className="hover:bg-subtle flex items-center gap-2 rounded-lg p-1"
          >
            <Avatar name={name} />
            <span className="hidden text-left md:block">
              <span className="block text-sm leading-tight font-medium">{name}</span>
              <span className="text-muted block text-xs leading-tight">{(user?.roles || []).join(', ') || '—'}</span>
            </span>
          </button>

          {open && (
            <div className="border-line bg-surface absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border py-1 shadow-lg">
              <Link href="/profile" onClick={() => setOpen(false)} className={itemClass}>
                <UserIcon className="h-4 w-4" /> Profile & Security
              </Link>
              <Link href="/settings" onClick={() => setOpen(false)} className={itemClass}>
                <Palette className="h-4 w-4" /> Settings
              </Link>
              <button onClick={onLogout} className={`${itemClass} text-danger`}>
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
