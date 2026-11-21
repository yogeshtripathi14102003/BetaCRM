export default function PageHeader({ title, description, actions, leading }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      {/* React 19: <title> apne aap <head> me chala jaata hai */}
      <title>{title}</title>
      <div className="flex items-center gap-3">
        {leading}
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="text-muted mt-0.5 text-sm">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
