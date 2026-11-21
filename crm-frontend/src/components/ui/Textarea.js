import { cn } from '@/lib/cn';

export default function Textarea({ label, error, hint, className = '', id, rows = 3, ...props }) {
  const taId = id || props.name;
  return (
    <div className={className}>
      {label && (
        <label htmlFor={taId} className="text-fg mb-1 block text-sm font-medium">
          {label}
        </label>
      )}
      <textarea
        id={taId}
        rows={rows}
        aria-invalid={error ? 'true' : undefined}
        className={cn(
          'bg-surface text-fg placeholder:text-faint block w-full rounded-lg border px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 disabled:opacity-60',
          error ? 'border-danger focus:ring-danger/30' : 'border-line focus:border-brand focus:ring-brand/30'
        )}
        {...props}
      />
      {error ? <p className="text-danger mt-1 text-xs">{error}</p> : hint && <p className="text-muted mt-1 text-xs">{hint}</p>}
    </div>
  );
}
