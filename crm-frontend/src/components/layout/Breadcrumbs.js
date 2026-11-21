'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { NAV } from '@/lib/nav';
import { humanize } from '@/lib/format';

const LABELS = Object.fromEntries(NAV.flatMap((g) => g.items.map((i) => [i.href, i.label])));
const SECTION = { crm: 'CRM', admin: 'Admin' };

// /crm/leads/l12/edit -> CRM › Leads › Details › Edit
export function buildCrumbs(pathname) {
  const parts = pathname.split('/').filter(Boolean);
  return parts.map((part, i) => {
    const href = `/${parts.slice(0, i + 1).join('/')}`;
    const isId = /^[a-z]{0,3}\d+$/i.test(part) || /^[0-9a-f-]{8,}$/i.test(part);
    const label = LABELS[href] || SECTION[part] || (isId ? 'Details' : humanize(part));
    // /crm aur /admin khud koi page nahi, isliye link nahi
    return { href, label, linkable: !(i === 0 && SECTION[part]) && i < parts.length - 1 };
  });
}

export default function Breadcrumbs() {
  const crumbs = buildCrumbs(usePathname());
  if (!crumbs.length) return null;
  return (
    <nav aria-label="Breadcrumb" className="hidden min-w-0 sm:block">
      <ol className="text-muted flex items-center gap-1 text-sm">
        {crumbs.map((c, i) => (
          <li key={c.href} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="text-faint h-3.5 w-3.5" />}
            {c.linkable ? (
              <Link href={c.href} className="hover:text-fg">
                {c.label}
              </Link>
            ) : (
              <span
                className={i === crumbs.length - 1 ? 'text-fg font-medium' : ''}
                aria-current={i === crumbs.length - 1 ? 'page' : undefined}
              >
                {c.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
