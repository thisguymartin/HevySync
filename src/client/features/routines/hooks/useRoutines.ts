import { useState, useEffect, useCallback } from "react";
import { useApi } from "@/shared/hooks/useApi.js";
import type { HevyRoutine } from "@/shared/types/index.js";

export function useRoutines() {
  const { apiFetch } = useApi();
  const [routines, setRoutines] = useState<HevyRoutine[]>([]);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoutines = useCallback(
    async (p: number) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await apiFetch<{
          routines: HevyRoutine[];
          page_count: number;
        }>(`/api/hevy/routines?page=${p}&pageSize=10`);
        setRoutines(data.routines);
        setPageCount(data.page_count);
        setPage(p);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch routines");
      } finally {
        setIsLoading(false);
      }
    },
    [apiFetch]
  );

  useEffect(() => {
    queueMicrotask(() => {
      fetchRoutines(1);
    });
  }, [fetchRoutines]);

  return {
    routines,
    page,
    pageCount,
    isLoading,
    error,
    fetchRoutines,
    hasNextPage: page < pageCount,
    hasPrevPage: page > 1,
  };
}
