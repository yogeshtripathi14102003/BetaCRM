'use client';

import { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import Card from '@/components/ui/Card';
import Skeleton from '@/components/ui/Skeleton';
import ErrorState from '@/components/common/ErrorState';
import PageHeader from '@/components/common/PageHeader';
import { useAuth } from '@/providers/AuthProvider';
import { can, hasModule } from '@/lib/permissions';
import { KpiRow } from '@/features/reports/Kpis';
import { useDashboardReport } from '@/features/reports/hooks';
import RangeToggle from '@/features/dashboard/RangeToggle';
import { Leaderboard, RecentActivity, TodayFollowups } from '@/features/dashboard/widgets';

// Charts (recharts) alag chunk me, page ke baad load hote hain
const chartLoading = () => <Skeleton className="h-96 w-full" />;
const TrendChart = dynamic(() => import('@/features/reports/components').then((m) => m.TrendChart), { ssr: false, loading: chartLoading });
const SourceDonut = dynamic(() => import('@/features/reports/components').then((m) => m.SourceDonut), {
  ssr: false,
  loading: chartLoading,
});
const FunnelChart = dynamic(() => import('@/features/reports/components').then((m) => m.FunnelChart), {
  ssr: false,
  loading: chartLoading,
});

export default function DashboardPage() {
  const { user } = useAuth();
  const [range, setRange] = useState('30d');
  const showReport = can(user, 'report.read') && hasModule(user, 'crm');
  const showFollowups = can(user, 'followup.read');
  const showActivity = can(user, 'activity.read');
  const report = useDashboardReport({ range }, { enabled: showReport });

  const checks = [
    { ok: user.isEmailVerified || !user.email, text: 'Email verified', todo: 'Email is not verified, please verify your email' },
    { ok: user.twoFactorEnabled, text: '2FA on ', todo: 'please  enable 2FA  (for account security)' },
  ];
  const pending = checks.filter((c) => !c.ok);

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <PageHeader
        title={`Welcome, ${(user.displayName || user.email).split(' ')[0]} 👋`}
        description="Get a quick overview of your account and recent activity."
        actions={showReport && <RangeToggle value={range} onChange={setRange} />}
      />

      {pending.length > 0 && (
        <Card className="border-amber-300/50 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="flex-1">{pending.map((c) => c.todo).join(' • ')}</span>
            <Link href="/profile" className="text-brand font-medium hover:underline">
              Fix Now →
            </Link>
          </div>
        </Card>
      )}

      {showReport && (
        <>
          {report.isPending && <Skeleton className="h-24 w-full" />}
          {report.error && !report.data && <ErrorState error={report.error} onRetry={report.refetch} />}
          {report.data && (
            <>
              <KpiRow kpis={report.data.kpis} deltas={report.data.deltas} />
              <div className="grid gap-5 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <TrendChart data={report.data.trend} />
                </div>
                <SourceDonut data={report.data.sources} />
              </div>
              <div className="grid gap-5 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <FunnelChart data={report.data.funnel} />
                </div>
                <Leaderboard rows={report.data.counsellors} />
              </div>
            </>
          )}
        </>
      )}

      {(showFollowups || showActivity) && (
        <div className="grid gap-5 lg:grid-cols-2">
          {showFollowups && <TodayFollowups />}
          {showActivity && <RecentActivity />}
        </div>
      )}

      {pending.length === 0 && (
        <p className="text-muted flex items-center gap-1.5 text-xs">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> your account is secure.
        </p>
      )}
    </div>
  );
}
