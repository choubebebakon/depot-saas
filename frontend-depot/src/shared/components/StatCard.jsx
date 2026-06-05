export default function StatCard({ icon, label, value, sub, color, trend, onClick, className = '' }) {
  const trendUp = trend > 0;
  return (
    <div
      onClick={onClick}
      className={`bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 hover:border-${color || 'amber'}-500/30 transition-all group ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: (color || '#f59e0b') + '22' }}>
          {icon}
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${trendUp ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
            {trendUp ? '▲' : '▼'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{label}</p>
      <p className="text-white font-black text-2xl leading-none">{value}</p>
      {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
    </div>
  );
}
