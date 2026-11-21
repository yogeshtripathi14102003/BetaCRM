import { cn } from '@/lib/cn';

export const RANGES = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
];

export default function RangeToggle({ value, onChange }) {
  return (
    <div role="group" aria-label="Date range" className="border-line bg-surface inline-flex rounded-lg border p-0.5">
      {RANGES.map((r) => (
        <button
          key={r.value}
          type="button"
          aria-pressed={value === r.value}
          onClick={() => onChange(r.value)}
          className={cn(
            'rounded-md px-3 py-1 text-sm',
            value === r.value ? 'bg-brand-soft text-brand font-medium' : 'text-muted hover:text-fg'
          )}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
