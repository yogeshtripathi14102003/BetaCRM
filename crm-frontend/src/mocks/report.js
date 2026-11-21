import { db, DAY } from './db';
import { LEAD_STATUSES } from '@/features/leads/constants';

const RANGES = { '7d': 7, '30d': 30, '90d': 90 };
const pct = (cur, prev) => (prev ? ((cur - prev) / prev) * 100 : null);
const day = (t) => new Date(t).toISOString().slice(0, 10);

// /crm/reports/dashboard?range=7d|30d|90d (ya from/to). Real backend ko bhi yahi shape deni hai (docs/API_CONTRACT.md)
export function buildDashboard(params = {}) {
  const days = RANGES[params.range] || 30;
  const now = Date.now();
  const since = now - days * DAY;
  const prevSince = since - days * DAY;
  const at = (l) => new Date(l.createdAt).getTime();

  const cur = db.leads.filter((l) => at(l) >= since);
  const prev = db.leads.filter((l) => at(l) >= prevSince && at(l) < since);
  const paid = (from, to) =>
    db.payments
      .filter((p) => p.status === 'paid' && new Date(p.createdAt).getTime() >= from && new Date(p.createdAt).getTime() < to)
      .reduce((s, p) => s + p.amount, 0);

  const converted = cur.filter((l) => l.status === 'converted').length;
  const prevConverted = prev.filter((l) => l.status === 'converted').length;
  const rate = cur.length ? (converted / cur.length) * 100 : 0;
  const prevRate = prev.length ? (prevConverted / prev.length) * 100 : 0;
  const revenue = paid(since, now + DAY);
  const prevRevenue = paid(prevSince, since);

  const trend = Array.from({ length: days }, (_, i) => {
    const d = day(since + (i + 1) * DAY);
    const rows = cur.filter((l) => day(at(l)) === d);
    return { date: d, leads: rows.length, converted: rows.filter((l) => l.status === 'converted').length };
  });

  const bySource = {};
  cur.forEach((l) => {
    bySource[l.source] = (bySource[l.source] || 0) + 1;
  });

  const byUser = {};
  cur.forEach((l) => {
    if (!l.assignedTo) return;
    const row = (byUser[l.assignedTo.id] ||= { id: l.assignedTo.id, name: l.assignedTo.displayName, leads: 0, converted: 0 });
    row.leads += 1;
    if (l.status === 'converted') row.converted += 1;
  });

  return {
    kpis: {
      totalLeads: cur.length,
      converted,
      conversionRate: rate,
      revenue,
      pendingFollowups: db.followups.filter((f) => f.status === 'pending').length,
    },
    // pichle period se % badlaav (null = pichle period me data nahi tha)
    deltas: {
      totalLeads: pct(cur.length, prev.length),
      converted: pct(converted, prevConverted),
      conversionRate: pct(rate, prevRate),
      revenue: pct(revenue, prevRevenue),
    },
    trend,
    sources: Object.entries(bySource)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count),
    funnel: LEAD_STATUSES.map((s) => ({ stage: s.label, count: cur.filter((l) => l.status === s.value).length })),
    counsellors: Object.values(byUser)
      .map((c) => ({ ...c, conversionRate: c.leads ? (c.converted / c.leads) * 100 : 0 }))
      .sort((a, b) => b.converted - a.converted),
  };
}
