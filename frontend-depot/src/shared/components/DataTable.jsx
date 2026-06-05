import { useState, useMemo } from 'react';

const ITEMS_PER_PAGE = 20;

export default function DataTable({
  columns,
  data,
  loading,
  searchValue = '',
  onSearch,
  searchPlaceholder = '🔍 Rechercher...',
  filters,
  onRowClick,
  emptyMessage = 'Aucune donnée',
  emptyIcon = '📋',
  pageSize = ITEMS_PER_PAGE,
  keyExtractor = (item, i) => item?.id ?? i,
}) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(data.length / pageSize);
  const paginatedData = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const goToPage = (p) => setCurrentPage(Math.max(1, Math.min(p, totalPages)));

  if (loading) {
    return (
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="p-8 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
      {(onSearch || filters) && (
        <div className="p-4 border-b border-slate-700/50 flex flex-wrap gap-3 items-center">
          {onSearch && (
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => { onSearch(e.target.value); setCurrentPage(1); }}
              className="bg-slate-900 border border-slate-700 focus:border-amber-500 text-white rounded-xl px-4 py-2 text-sm outline-none w-64 transition-colors"
            />
          )}
          {filters}
        </div>
      )}

      {data.length === 0 ? (
        <div className="text-center py-20">
          <span className="text-6xl">{emptyIcon}</span>
          <p className="text-slate-400 font-semibold mt-4">{emptyMessage}</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/50">
                <tr className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                  {columns.map((col, i) => (
                    <th key={i} className={`px-5 py-4 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {paginatedData.map((item, idx) => (
                  <tr
                    key={keyExtractor(item, idx)}
                    onClick={() => onRowClick?.(item)}
                    className={`transition-colors ${onRowClick ? 'cursor-pointer hover:bg-slate-700/20' : 'hover:bg-slate-700/20'}`}
                  >
                    {columns.map((col, ci) => (
                      <td key={ci} className={`px-5 py-4 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}>
                        {col.render ? col.render(item) : item[col.accessor]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700/50 bg-slate-900/30">
              <span className="text-slate-400 text-xs">
                {data.length} résultat{data.length > 1 ? 's' : ''} — Page {currentPage}/{totalPages}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  ◀
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const start = Math.max(1, currentPage - 2);
                  const page = start + i;
                  if (page > totalPages) return null;
                  return (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${currentPage === page ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  ▶
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
