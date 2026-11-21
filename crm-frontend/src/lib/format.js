const LOCALE = 'en-IN';

const toDate = (v) => (v instanceof Date ? v : new Date(v));
const valid = (d) => d instanceof Date && !Number.isNaN(d.getTime());

export const formatDate = (v) => {
  if (!v) return '—';
  const d = toDate(v);
  return valid(d) ? d.toLocaleDateString(LOCALE, { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
};

export const formatDateTime = (v) => {
  if (!v) return '—';
  const d = toDate(v);
  return valid(d) ? d.toLocaleString(LOCALE, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
};

export const formatCurrency = (n) =>
  typeof n === 'number' ? new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n) : '—';

export const formatNumber = (n) => (typeof n === 'number' ? new Intl.NumberFormat(LOCALE).format(n) : '—');

export const formatPercent = (n) => (typeof n === 'number' ? `${n.toFixed(1)}%` : '—');

// "in 2 hours", "3 days ago"
export const timeAgo = (v) => {
  if (!v) return '—';
  const d = toDate(v);
  if (!valid(d)) return '—';
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const diff = (d.getTime() - Date.now()) / 1000;
  const units = [
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  for (const [unit, secs] of units) {
    if (Math.abs(diff) >= secs) return rtf.format(Math.round(diff / secs), unit);
  }
  return 'just now';
};

export const humanize = (s) =>
  s
    ? String(s)
        .replace(/[_-]/g, ' ')
        .replace(/^\w/, (c) => c.toUpperCase())
    : '—';
