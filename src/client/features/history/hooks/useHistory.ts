import { useState, useEffect, useCallback } from "react";
import { useApi } from "@/shared/hooks/useApi.js";

interface HistoryWorkout {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  exercises: Array<{
    title: string;
    exercise_template_id: string;
    sets: Array<{
      type: string;
      weight_kg: number | null;
      reps: number | null;
    }>;
  }>;
}

export function useHistory() {
  const { apiFetch, hevyApiKey } = useApi();
  const [workouts, setWorkouts] = useState<HistoryWorkout[]>([]);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(
    async (p: number) => {
      if (!hevyApiKey) return;
      setIsLoading(true);
      setError(null);
      try {
        const data = await apiFetch<{
          workouts: HistoryWorkout[];
          page_count: number;
        }>(`/api/hevy/workouts?page=${p}&pageSize=20`);
        setWorkouts(data.workouts);
        setPageCount(data.page_count);
        setPage(p);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch history");
      } finally {
        setIsLoading(false);
      }
    },
    [apiFetch, hevyApiKey]
  );

  useEffect(() => {
    if (hevyApiKey) fetchHistory(1);
  }, [hevyApiKey, fetchHistory]);

  // Compute stats
  const stats = {
    totalWorkouts: workouts.length,
    totalVolume: workouts.reduce(
      (total, w) =>
        total +
        w.exercises.reduce(
          (sum, ex) =>
            sum +
            ex.sets.reduce(
              (s, set) => s + (set.weight_kg || 0) * (set.reps || 0),
              0
            ),
          0
        ),
      0
    ),
    totalExercises: workouts.reduce(
      (sum, w) => sum + w.exercises.length,
      0
    ),
  };

  return {
    workouts,
    stats,
    page,
    pageCount,
    isLoading,
    error,
    fetchHistory,
    hasNextPage: page < pageCount,
    hasPrevPage: page > 1,
  };
}
