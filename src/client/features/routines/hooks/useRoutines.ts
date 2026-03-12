import { useState, useEffect, useCallback } from "react";
import { useApi } from "@/shared/hooks/useApi.js";

interface Routine {
  id: string;
  title: string;
  folder_id: number | null;
  notes: string;
  exercises: Array<{
    title: string;
    exercise_template_id: string;
    notes: string;
    superset_id: number | null;
    sets: Array<{
      type: string;
      weight_kg: number | null;
      reps: number | null;
    }>;
  }>;
}

export function useRoutines() {
  const { apiFetch, hevyApiKey } = useApi();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoutines = useCallback(
    async (p: number) => {
      if (!hevyApiKey) return;
      setIsLoading(true);
      setError(null);
      try {
        const data = await apiFetch<{
          routines: Routine[];
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
    [apiFetch, hevyApiKey]
  );

  useEffect(() => {
    if (hevyApiKey) fetchRoutines(1);
  }, [hevyApiKey, fetchRoutines]);

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
