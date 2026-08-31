export default function PageHeader({ title, subtitle, description, icon, actions, stats, className = '' }) {
  const secondaryText = subtitle ?? description;
  return (
    <header className={`flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 ${className}`}>
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          {icon && (
            <span className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" aria-hidden="true">
              {icon}
            </span>
          )}
          <div className="min-w-0">
            <h1 className="text-2xl font-black text-white flex items-center gap-2 truncate">{title}</h1>
            {secondaryText && <p className="text-slate-400 text-sm mt-1">{secondaryText}</p>}
          </div>
        </div>
        {stats && <div className="flex flex-wrap items-center gap-3 mt-4">{stats}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3 shrink-0">{actions}</div>}
    </header>
  );
}
