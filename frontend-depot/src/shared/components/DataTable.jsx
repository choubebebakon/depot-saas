import { useEffect, useMemo, useState } from 'react';

const ITEMS_PER_PAGE = 20;

export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  error = null,
  searchValue = '',
  onSearch,
  searchPlaceholder = 'Rechercher...',
  filters,
  onRowClick,
  emptyMessage = 'Aucune donnée',
  emptyIcon = '📋',
  pageSize = ITEMS_PER_PAGE,
  keyExtractor = (item, i) => item?.id ?? i,
  className = '',
  onRetry,
  searchId = 'gestock-table-search',
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const safePageSize = Number.isInteger(pageSize) && pageSize > 0 ? pageSize : ITEMS_PER_PAGE;
  const safeData = Array.isArray(data) ? data : [];
  const safeColumns = Array.isArray(columns) ? columns : [];

  const totalPages = Math.max(1, Math.ceil(safeData.length / safePageSize));
  const paginatedData = useMemo(
    () => safeData.slice((currentPage - 1) * safePageSize, currentPage * safePageSize),
    [safeData, currentPage, safePageSize],
  );

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [safePageSize, searchValue]);

  const goToPage = (page) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));

  if (loading) {
    return (
      <div className={`bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden ${className}`} role="status" aria-live="polite">
        <div className="p-10 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" aria-hidden="true" />
          <span className="text-slate-500 text-sm">Chargement...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-slate-800/60 border border-red-500/20 rounded-2xl p-10 text-center ${className}`} role="alert">
        <p className="text-red-400 font-semibold">Impossible de charger les données.</p>
        {onRetry && (
          <button type="button" onClick={onRetry} className="mt-4 px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold transition-colors">
            Réessayer
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden ${className}`}>
      {(onSearch || filters) && (
        <div className="p-4 border-b border-slate-700/50 flex flex-wrap gap-3 items-center">
          {onSearch && <label className="sr-only" htmlFor={searchId}>Rechercher dans le tableau</label>}
          {onSearch && (
            <input
              id={searchId}
              type="search"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearch(e.target.value)}
              className="bg-slate-900 border border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-64 transition-colors"
            />
          )}
          {filters}
        </div>
      )}

      {safeData.length === 0 ? (
        <div className="text-center py-20" role="status">
          <span className="text-5xl" aria-hidden="true">{emptyIcon}</span>
          <p className="text-slate-300 font-semibold mt-4">{emptyMessage}</p>
        </div>
      ) : safeColumns.length === 0 ? (
        <div className="text-center py-12 text-slate-500" role="alert">Aucune colonne configurée.</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/50">
                <tr className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                  {safeColumns.map((col, i) => (
                    <th key={col.key ?? col.accessor ?? i} scope="col" className={`px-5 py-4 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}>
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
                    onKeyDown={(e) => {
                      if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        onRowClick(item);
                      }
                    }}
                    tabIndex={onRowClick ? 0 : undefined}
                    className={`transition-colors ${onRowClick ? 'cursor-pointer hover:bg-slate-700/20 focus:outline-none focus:bg-slate-700/30' : 'hover:bg-slate-700/20'}`}
                  >
                    {safeColumns.map((col, ci) => (
                      <td key={col.key ?? col.accessor ?? ci} className={`px-5 py-4 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}>
                        {col.render ? col.render(item) : item?.[col.accessor]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <nav className="flex items-center justify-between gap-4 px-5 py-4 border-t border-slate-700/50 bg-slate-900/30" aria-label="Pagination">
              <span className="text-slate-400 text-xs">{safeData.length} résultat{safeData.length > 1 ? 's' : ''} — Page {currentPage}/{totalPages}</span>
              <div className="flex gap-1">
                <button type="button" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} aria-label="Page précédente" className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">‹</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
                  const page = start + i;
                  if (page > totalPages) return null;
                  return <button type="button" key={page} onClick={() => goToPage(page)} aria-current={currentPage === page ? 'page' : undefined} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${currentPage === page ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{page}</button>;
                })}
                <button type="button" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} aria-label="Page suivante" className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">›</button>
              </div>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
