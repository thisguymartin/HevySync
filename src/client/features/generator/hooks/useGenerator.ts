import { useState, useCallback } from "react";
import { useApi } from "@/shared/hooks/useApi.js";
import type { GenerateRequest } from "@/shared/types/index.js";

interface GeneratedRoutine {
  title: string;
  notes: string;
  exercises: Array<{
    exercise_template_id: string;
    title: string;
    notes: string;
    superset_id: number | null;
    sets: Array<{
      index: number;
      type: string;
      weight_kg: number | null;
      reps: number | null;
    }>;
  }>;
}

export function useGenerator() {
  const { apiFetch } = useApi();
  const [routines, setRoutines] = useState<GeneratedRoutine[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pushResult, setPushResult] = useState<string | null>(null);

  const generate = useCallback(
    async (params: GenerateRequest) => {
      setIsGenerating(true);
      setError(null);
      setRoutines([]);
      setPushResult(null);

      try {
        const data = await apiFetch<{ routines: GeneratedRoutine[] }>(
          "/api/generate",
          {
            method: "POST",
            body: JSON.stringify(params),
          }
        );
        setRoutines(data.routines || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Generation failed"
        );
      } finally {
        setIsGenerating(false);
      }
    },
    [apiFetch]
  );

  const pushToHevy = useCallback(async () => {
    if (routines.length === 0) return;
    setIsPushing(true);
    setError(null);

    try {
      let created = 0;
      for (const routine of routines) {
        await apiFetch("/api/hevy/routines", {
          method: "POST",
          body: JSON.stringify({
            routine: {
              title: routine.title,
              notes: routine.notes,
              exercises: routine.exercises.map((ex) => ({
                exercise_template_id: ex.exercise_template_id,
                superset_id: ex.superset_id,
                notes: ex.notes,
                sets: ex.sets,
              })),
            },
          }),
        });
        created++;
        if (created < routines.length) {
          await new Promise((r) => setTimeout(r, 500));
        }
      }
      setPushResult(`Created ${created} routine(s) in Hevy!`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to push to Hevy"
      );
    } finally {
      setIsPushing(false);
    }
  }, [routines, apiFetch]);

  return {
    routines,
    isGenerating,
    isPushing,
    error,
    pushResult,
    generate,
    pushToHevy,
  };
}
