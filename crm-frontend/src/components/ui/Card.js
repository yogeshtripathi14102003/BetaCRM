import { cn } from '@/lib/cn';

export default function Card({ title, description, actions, children, className = '', padded = true }) {
  const header = title || description || actions;
  return (
    <section className={cn('border-line bg-surface rounded-xl border shadow-sm', padded && 'p-5', className)}>
      {header && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-fg text-base font-semibold">{title}</h2>}
            {description && <p className="text-muted mt-0.5 text-sm">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}
