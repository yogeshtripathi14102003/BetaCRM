'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Card from '@/components/ui/Card';
import { humanize } from '@/lib/format';

// Colors CSS variables se: dark mode me apne aap badalte hain
const AXIS = { fontSize: 12, fill: 'var(--c-muted)' };
const GRID = 'var(--c-line)';
const TOOLTIP = {
  contentStyle: { background: 'var(--c-surface)', border: '1px solid var(--c-line)', borderRadius: 8, color: 'var(--c-fg)', fontSize: 12 },
  cursor: { fill: 'var(--c-subtle)' },
};
const PALETTE = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'];

const shortDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

export function TrendChart({ data }) {
  return (
    <Card title="Leads trend" description="Roz kitni leads aayi aur kitni convert hui">
      <div className="h-72 w-full" role="img" aria-label="Leads trend chart">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gLeads" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
            <XAxis dataKey="date" tickFormatter={shortDate} tick={AXIS} tickLine={false} axisLine={false} minTickGap={24} />
            <YAxis allowDecimals={false} tick={AXIS} tickLine={false} axisLine={false} />
            <Tooltip {...TOOLTIP} labelFormatter={shortDate} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="leads" name="Leads" stroke="#6366f1" strokeWidth={2} fill="url(#gLeads)" />
            <Area type="monotone" dataKey="converted" name="Converted" stroke="#10b981" strokeWidth={2} fill="none" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function SourceDonut({ data }) {
  const rows = data.map((d) => ({ name: humanize(d.source), value: d.count }));
  return (
    <Card title="Lead sources" description="Leads kahan se aa rahi hain">
      <div className="h-72 w-full" role="img" aria-label="Lead sources chart">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={rows} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="80%" paddingAngle={2} stroke="var(--c-surface)">
              {rows.map((r, i) => (
                <Cell key={r.name} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip {...TOOLTIP} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function FunnelChart({ data }) {
  return (
    <Card title="Lead funnel" description="Status ke hisaab se leads">
      <div className="h-72 w-full" role="img" aria-label="Lead funnel chart">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
            <XAxis dataKey="stage" tick={AXIS} tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} tick={AXIS} tickLine={false} axisLine={false} />
            <Tooltip {...TOOLTIP} />
            <Bar dataKey="count" name="Leads" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
