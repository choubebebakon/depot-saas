const STATUS_COLORS = {
  receu: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', dot: 'bg-blue-500' },
  diagnostic: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', dot: 'bg-amber-500' },
  en_cours: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', dot: 'bg-purple-500' },
  pret: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', dot: 'bg-emerald-500' },
  livre: { bg: 'bg-slate-500/10', border: 'border-slate-500/30', dot: 'bg-slate-500' },
};

export default function KanbanBoard({ columns, onItemClick, renderCard, className = '' }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 ${className}`}>
      {columns.map((col) => {
        const colors = STATUS_COLORS[col.id] || { bg: 'bg-slate-800/60', border: 'border-slate-700/50', dot: 'bg-slate-500' };
        return (
          <div key={col.id} className={`rounded-2xl p-4 ${colors.bg} border ${colors.border}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
                <h3 className="text-white font-bold text-sm">{col.label}</h3>
              </div>
              <span className="text-slate-400 text-xs font-bold bg-slate-800 px-2 py-0.5 rounded-full">{col.items.length}</span>
            </div>
            <div className="space-y-3 min-h-[120px]">
              {col.items.length === 0 ? (
                <p className="text-slate-600 text-xs text-center py-6">Aucun élément</p>
              ) : col.items.map((item) => (
                <div key={item.id} onClick={() => onItemClick?.(item, col)}
                  className="bg-slate-800/80 border border-slate-700/50 rounded-xl p-3 cursor-pointer hover:border-amber-500/30 transition-all">
                  {renderCard ? renderCard(item) : <p className="text-white text-sm font-semibold">{item.label || item.nom || item.id}</p>}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
