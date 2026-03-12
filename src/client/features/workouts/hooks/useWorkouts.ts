import { useState, useEffect, useCallback } from "react";
import { useApi } from "@/shared/hooks/useApi.js";

interface Workout {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  exercises: Array<{
    title: string;
    exercise_template_id: string;
    notes: string;
    sets: Array<{
      type: string;
      weight_kg: number | null;
      reps: number | null;
    }>;
  }>;
}

export function useWorkouts() {
  const { apiFetch, hevyApiKey } = useApi();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkouts = useCallback(
    async (p: number) => {
      if (!hevyApiKey) return;
      setIsLoading(true);
      setError(null);
      try {
        const data = await apiFetch<{
          workouts: Workout[];
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
    [apiFetch, hevyApiKey]
  );

  useEffect(() => {
    if (hevyApiKey) fetchWorkouts(1);
  }, [hevyApiKey, fetchWorkouts]);

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
