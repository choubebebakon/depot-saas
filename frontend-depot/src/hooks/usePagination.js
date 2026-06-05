import { useState, useMemo, useEffect } from 'react';

/**
 * Hook centralisé de pagination — supporte deux modes :
 *  - Mode "frontend" : data est un tableau, pagination calculée localement
 *  - Mode "backend"  : data est un objet réponse API {data, total, ...}
 *
 * @param {Array|Object} data   - Tableau OU réponse API
 * @param {number} itemsPerPage - Éléments par page (défaut : 10)
 * @returns {{ currentPage, setCurrentPage, totalPages, totalItems,
 *             pageSize, paginatedData, goToPage, hasNext, hasPrev,
 *             nextPage, prevPage, reset }}
 */
export function usePagination(data, itemsPerPage = 10) {
  const [page, setPage] = useState(1);

  // ── Extraire totalItems depuis n'importe quel format de réponse API ──
  const totalItems = useMemo(() => {
    if (!data) return 0;
    if (Array.isArray(data)) return data.length;
    return (
      data?.total ??
      data?.totalItems ??
      data?.count ??
      data?.meta?.total ??
      data?.meta?.count ??
      data?.pagination?.total ??
      data?.pagination?.count ??
      (Array.isArray(data?.data) ? data.data.length : 0) ??
      (Array.isArray(data?.items) ? data.items.length : 0) ??
      (Array.isArray(data?.results) ? data.results.length : 0)
    );
  }, [data]);

  // ── Extraire le tableau plat (mode frontend) ─────────────────────────
  const flatData = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.results)) return data.results;
    return [];
  }, [data]);

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  // ── Remettre à la page 1 quand les données changent ──────────────────
  useEffect(() => {
    setPage(1);
  }, [totalItems]);

  // ── Clamp : garantit que currentPage reste dans les bornes ───────────
  const currentPage = Math.min(Math.max(1, page), totalPages);

  // ── Données de la page courante (mode frontend) ───────────────────────
  const paginatedData = useMemo(() => {
    if (!flatData.length) return [];
    const start = (currentPage - 1) * itemsPerPage;
    return flatData.slice(start, start + itemsPerPage);
  }, [flatData, currentPage, itemsPerPage]);

  // ── Setters sécurisés ─────────────────────────────────────────────────
  function setCurrentPage(p) {
    setPage(Math.max(1, Math.min(Number(p), totalPages)));
  }

  function goToPage(p) {
    setPage(Math.max(1, Math.min(Number(p), totalPages)));
  }

  function nextPage() {
    setPage(prev => Math.min(prev + 1, totalPages));
  }

  function prevPage() {
    setPage(prev => Math.max(prev - 1, 1));
  }

  function reset() {
    setPage(1);
  }

  return {
    currentPage,
    setCurrentPage,
    goToPage,
    nextPage,
    prevPage,
    reset,
    totalPages,
    totalItems,
    pageSize: itemsPerPage,
    paginatedData,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
    // Infos utiles pour l'affichage
    from: totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1,
    to: Math.min(currentPage * itemsPerPage, totalItems),
  };
}