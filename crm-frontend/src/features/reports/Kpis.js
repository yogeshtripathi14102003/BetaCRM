import { ArrowDownRight, ArrowUpRight, CalendarClock, Percent, Trophy, Users, Wallet } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/format';

// delta = pichle period se % badlaav (null/undefined = dikhana nahi)
export function KpiCard({ label, value, delta, icon: Icon }) {
  const up = typeof delta === 'number' && delta >= 0;
  return (
    <div className="border-line bg-surface rounded-xl border p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-muted text-xs font-medium tracking-wide uppercase">{label}</p>
        {Icon && <Icon className="text-faint h-4 w-4" aria-hidden="true" />}
      </div>
      <p className="mt-1.5 text-2xl font-semibold tracking-tight">{value}</p>
      {typeof delta === 'number' && (
        <p
          className={cn(
            'mt-1 inline-flex items-center gap-0.5 text-xs font-medium',
            up ? 'text-green-600 dark:text-green-400' : 'text-danger'
          )}
        >
          {up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
          {Math.abs(delta).toFixed(1)}% <span className="text-muted font-normal">vs pichla period</span>
        </p>
      )}
    </div>
  );
}

export function KpiRow({ kpis, deltas = {} }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      <KpiCard label="Total leads" value={formatNumber(kpis.totalLeads)} delta={deltas.totalLeads} icon={Users} />
      <KpiCard label="Converted" value={formatNumber(kpis.converted)} delta={deltas.converted} icon={Trophy} />
      <KpiCard label="Conversion" value={formatPercent(kpis.conversionRate)} delta={deltas.conversionRate} icon={Percent} />
      <KpiCard label="Revenue" value={formatCurrency(kpis.revenue)} delta={deltas.revenue} icon={Wallet} />
      <KpiCard label="Pending followups" value={formatNumber(kpis.pendingFollowups)} icon={CalendarClock} />
    </div>
  );
}
