import { useState, useEffect, useCallback } from "react";
import { useApi } from "@/shared/hooks/useApi.js";
import type { HevyWorkout } from "@/shared/types/index.js";

export function useWorkouts() {
  const { apiFetch } = useApi();
  const [workouts, setWorkouts] = useState<HevyWorkout[]>([]);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkouts = useCallback(
    async (p: number) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await apiFetch<{
          workouts: HevyWorkout[];
          page_count: number;
        }>(`/api/hevy/workouts?page=${p}&pageSize=10`);
        setWorkouts(data.workouts);
        setPageCount(data.page_count);
        setPage(p);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch workouts");
      } finally {
        setIsLoading(false);
      }
    },
    [apiFetch]
  );

  useEffect(() => {
    queueMicrotask(() => {
      fetchWorkouts(1);
    });
  }, [fetchWorkouts]);

  return {
    workouts,
    page,
    pageCount,
    isLoading,
    error,
    fetchWorkouts,
    hasNextPage: page < pageCount,
    hasPrevPage: page > 1,
  };
}
