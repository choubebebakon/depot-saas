export default function PageHeader({ title, subtitle, icon, actions, className = '' }) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 ${className}`}>
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          {icon && <span>{icon}</span>} {title}
        </h1>
        {subtitle && <p className="text-slate-400 text-sm mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-3 flex-wrap">{actions}</div>}
    </div>
  );
}
