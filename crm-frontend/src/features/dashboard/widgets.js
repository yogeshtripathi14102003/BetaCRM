'use client';

import Link from 'next/link';
import { CheckCircle2, MessageSquare, Phone, Mail, RefreshCw } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Skeleton from '@/components/ui/Skeleton';
import ErrorState from '@/components/common/ErrorState';
import { useCan } from '@/hooks/useCan';
import { formatDateTime, formatPercent, timeAgo } from '@/lib/format';
import { useActivities } from '@/features/activities/hooks';
import { useCompleteFollowup, useFollowups } from '@/features/followups/hooks';

const ICONS = { note: MessageSquare, call: Phone, email: Mail, status_change: RefreshCw };

export function TodayFollowups() {
  const can = useCan();
  const q = useFollowups({ bucket: 'today', limit: 5, sort: 'dueAt' });
  const complete = useCompleteFollowup();
  const link = (
    <Link href="/crm/followups" className="text-brand text-sm font-medium hover:underline">
      View all
    </Link>
  );

  return (
    <Card title="Aaj ke followups" actions={link}>
      {q.isPending && <Skeleton className="h-24 w-full" />}
      {q.error && !q.data && <ErrorState error={q.error} onRetry={q.refetch} />}
      {q.data?.items.length === 0 && <p className="text-muted py-6 text-center text-sm">Aaj koi followup nahi 🎉</p>}
      <ul className="divide-line divide-y">
        {q.data?.items.map((f) => (
          <li key={f.id} className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <Link href={`/crm/leads/${f.lead?.id}`} className="hover:text-brand block truncate text-sm font-medium">
                {f.lead?.name}
              </Link>
              <p className="text-muted truncate text-xs">
                {formatDateTime(f.dueAt)} • {f.note}
              </p>
            </div>
            {can('followup.update') && (
              <Button
                variant="secondary"
                className="px-2.5 py-1"
                loading={complete.isPending && complete.variables === f.id}
                onClick={() => complete.mutate(f.id)}
              >
                <CheckCircle2 className="h-4 w-4" /> Done
              </Button>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function RecentActivity() {
  const q = useActivities({ limit: 6, sort: '-createdAt' });
  return (
    <Card
      title="Recent activity"
      actions={
        <Link href="/crm/activities" className="text-brand text-sm font-medium hover:underline">
          View all
        </Link>
      }
    >
      {q.isPending && <Skeleton className="h-24 w-full" />}
      {q.error && !q.data && <ErrorState error={q.error} onRetry={q.refetch} />}
      <ul className="space-y-3">
        {q.data?.items.map((a) => {
          const Icon = ICONS[a.type] || MessageSquare;
          return (
            <li key={a.id} className="flex gap-3">
              <span className="bg-brand-soft text-brand mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full">
                <Icon className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm">
                  <span className="font-medium">{a.lead?.name}</span> <span className="text-muted">— {a.note}</span>
                </p>
                <p className="text-muted text-xs">
                  {a.by?.displayName || 'System'} • {timeAgo(a.createdAt)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export function Leaderboard({ rows }) {
  const top = rows.slice(0, 5);
  return (
    <Card title="Top counsellors" description="Converted leads ke hisaab se">
      {top.length === 0 && <p className="text-muted py-6 text-center text-sm">Abhi koi data nahi</p>}
      <ol className="space-y-3">
        {top.map((c, i) => (
          <li key={c.id} className="flex items-center gap-3">
            <span className="text-faint w-4 text-sm font-semibold">{i + 1}</span>
            <Avatar name={c.name} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{c.name}</p>
              <div className="bg-subtle mt-1 h-1.5 overflow-hidden rounded-full">
                <div className="bg-brand h-full rounded-full" style={{ width: `${Math.min(c.conversionRate, 100)}%` }} />
              </div>
            </div>
            <div className="text-muted text-right text-xs">
              <p className="text-fg text-sm font-semibold">{c.converted}</p>
              {formatPercent(c.conversionRate)}
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
