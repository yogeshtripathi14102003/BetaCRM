import { humanize } from '@/lib/format';

const TONES = {
  green: 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-500/10 dark:text-green-300 dark:ring-green-400/20',
  red: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-400/20',
  amber: 'bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20',
  blue: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-400/20',
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-400/20',
  slate: 'bg-slate-100 text-slate-700 ring-slate-500/20 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-400/20',
};

// Saare domains ke status ek jagah (lead, followup, payment, document, import ...)
const MAP = {
  new: 'blue',
  contacted: 'indigo',
  interested: 'amber',
  follow_up: 'amber',
  application: 'indigo',
  converted: 'green',
  lost: 'red',
  active: 'green',
  blocked: 'red',
  pending: 'amber',
  done: 'green',
  verified: 'green',
  rejected: 'red',
  paid: 'green',
  failed: 'red',
  completed: 'green',
  processing: 'blue',
  queued: 'slate',
  draft: 'slate',
  submitted: 'blue',
  under_review: 'amber',
  accepted: 'green',
  on_hold: 'amber',
  whatsapp: 'green',
  email: 'blue',
  sms: 'slate',
  yes: 'green',
  no: 'slate',
};

export default function StatusBadge({ value, tone }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset ${TONES[tone || MAP[value] || 'slate']}`}
    >
      {humanize(value)}
    </span>
  );
}
