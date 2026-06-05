import { useState } from 'react';

export default function ExportButton({ onExport, label = '📤 Exporter', className = '', formats = ['pdf', 'excel', 'csv'], color = 'slate' }) {
  const [open, setOpen] = useState(false);

  const handleExport = (format) => {
    onExport?.(format);
    setOpen(false);
  };

  const colorClasses = {
    amber: 'bg-amber-500/20 border-amber-500/30 text-amber-400',
    slate: 'bg-slate-700 border-slate-600 text-white hover:bg-slate-600',
    emerald: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400',
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className={`${colorClasses[color] || colorClasses.slate} font-bold px-4 py-2.5 rounded-xl text-sm transition-all border`}>
        {label}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl min-w-[140px]">
            {formats.map((fmt) => (
              <button key={fmt}
                onClick={() => handleExport(fmt)}
                className="w-full px-4 py-2.5 text-left text-slate-300 hover:text-white hover:bg-slate-800 text-sm font-semibold transition-colors flex items-center gap-2">
                {fmt === 'pdf' ? '📄' : fmt === 'excel' ? '📊' : '📃'} {fmt.toUpperCase()}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
