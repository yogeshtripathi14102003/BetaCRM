'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { NAV } from '@/lib/nav';
import { can, hasModule } from '@/lib/permissions';
import { env } from '@/config/env';
import { cn } from '@/lib/cn';

export function visibleNav(user) {
  return NAV.map((g) => ({
    ...g,
    items: g.items.filter((i) => (!i.perm || can(user, i.perm)) && (!g.module || hasModule(user, g.module))),
  })).filter((g) => g.items.length);
}

export default function Sidebar({ open, onClose, collapsed, onToggleCollapsed }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const groups = visibleNav(user);

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm lg:hidden" onClick={onClose} />}
      <aside
        aria-label="Main navigation"
        className={cn(
          'border-line bg-surface fixed inset-y-0 left-0 z-40 flex w-64 transform flex-col border-r transition-[transform,width] duration-200 lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
          collapsed && 'lg:w-[68px]'
        )}
      >
        <div
          className={cn(
            'border-line flex h-14 shrink-0 items-center border-b px-4',
            collapsed ? 'lg:justify-center lg:px-0' : 'justify-between'
          )}
        >
          <Link href="/dashboard" className="text-brand flex items-center gap-2 font-bold">
            <span className="bg-brand text-brand-fg flex h-8 w-8 items-center justify-center rounded-lg text-sm">
              {env.appName.charAt(0)}
            </span>
            <span className={cn('text-lg', collapsed && 'lg:hidden')}>{env.appName}</span>
          </Link>
          <button className="text-muted hover:bg-subtle rounded-md p-1 lg:hidden" onClick={onClose} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto p-3">
          {groups.map((g, idx) => (
            <div key={g.title || idx}>
              {g.title && (
                <p className={cn('text-faint mb-1 px-2 text-[11px] font-semibold tracking-wider uppercase', collapsed && 'lg:hidden')}>
                  {g.title}
                </p>
              )}
              {g.title && collapsed && <div className="border-line mx-2 mb-2 hidden border-t lg:block" />}
              <ul className="space-y-0.5">
                {g.items.map(({ href, label, icon: Icon }) => {
                  const active = pathname === href || pathname.startsWith(`${href}/`);
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        onClick={onClose}
                        title={collapsed ? label : undefined}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors',
                          collapsed && 'lg:justify-center',
                          active ? 'bg-brand-soft text-brand font-medium' : 'text-muted hover:bg-subtle hover:text-fg'
                        )}
                      >
                        <Icon className="h-[18px] w-[18px] shrink-0" />
                        <span className={cn(collapsed && 'lg:hidden')}>{label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <button
          type="button"
          onClick={onToggleCollapsed}
          className="border-line text-muted hover:bg-subtle hover:text-fg hidden items-center gap-2 border-t px-4 py-3 text-sm lg:flex"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <PanelLeftOpen className="mx-auto h-[18px] w-[18px]" />
          ) : (
            <>
              <PanelLeftClose className="h-[18px] w-[18px]" /> Collapse
            </>
          )}
        </button>
      </aside>
    </>
  );
}
