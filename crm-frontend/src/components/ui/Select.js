import { cn } from '@/lib/cn';

export default function Select({ label, error, hint, className = '', id, options, placeholder, children, ...props }) {
  const selectId = id || props.name;
  return (
    <div className={className}>
      {label && (
        <label htmlFor={selectId} className="text-fg mb-1 block text-sm font-medium">
          {label}
        </label>
      )}
      <select
        id={selectId}
        aria-invalid={error ? 'true' : undefined}
        className={cn(
          'bg-surface text-fg placeholder:text-faint block w-full rounded-lg border px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 disabled:opacity-60',
          error ? 'border-danger focus:ring-danger/30' : 'border-line focus:border-brand focus:ring-brand/30'
        )}
        {...props}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options
          ? options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))
          : children}
      </select>
      {error ? <p className="text-danger mt-1 text-xs">{error}</p> : hint && <p className="text-muted mt-1 text-xs">{hint}</p>}
    </div>
  );
}
