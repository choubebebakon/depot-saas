import { useState, useMemo } from 'react';

export function usePagination(data = [], perPage = 20) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(data.length / perPage));
  const currentPage = Math.min(page, totalPages);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return data.slice(start, start + perPage);
  }, [data, currentPage, perPage]);

  function nextPage() {
    if (currentPage < totalPages) setPage(p => p + 1);
  }

  function prevPage() {
    if (currentPage > 1) setPage(p => p - 1);
  }

  function goToPage(p) {
    setPage(Math.max(1, Math.min(p, totalPages)));
  }

  return {
    page: currentPage,
    totalPages,
    data: paginatedData,
    nextPage,
    prevPage,
    goToPage,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  };
}
