import { useState, useEffect, useCallback, useMemo } from "react";
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

interface WorkoutGroup {
  key: string;
  label: string;
  workouts: HistoryWorkout[];
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekLabel(weekStart: Date): string {
  const now = new Date();
  const thisWeek = getWeekStart(now);
  const lastWeek = new Date(thisWeek);
  lastWeek.setDate(lastWeek.getDate() - 7);

  if (weekStart.getTime() === thisWeek.getTime()) return "This Week";
  if (weekStart.getTime() === lastWeek.getTime()) return "Last Week";

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${fmt(weekStart)} – ${fmt(weekEnd)}`;
}

export function useHistory() {
  const { apiFetch } = useApi();
  const [workouts, setWorkouts] = useState<HistoryWorkout[]>([]);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(
    async (p: number) => {
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
    [apiFetch]
  );

  useEffect(() => {
    queueMicrotask(() => {
      fetchHistory(1);
    });
  }, [fetchHistory]);

  const groupedWorkouts = useMemo((): WorkoutGroup[] => {
    const groups = new Map<string, WorkoutGroup>();
    for (const w of workouts) {
      const ws = getWeekStart(new Date(w.start_time));
      const key = ws.toISOString().slice(0, 10);
      if (!groups.has(key)) {
        groups.set(key, { key, label: getWeekLabel(ws), workouts: [] });
      }
      groups.get(key)!.workouts.push(w);
    }
    return Array.from(groups.values());
  }, [workouts]);

  const stats = useMemo(() => {
    const totalSets = workouts.reduce(
      (sum, w) => sum + w.exercises.reduce((s, ex) => s + ex.sets.length, 0),
      0
    );
    return {
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
      totalSets,
    };
  }, [workouts]);

  return {
    workouts,
    groupedWorkouts,
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
