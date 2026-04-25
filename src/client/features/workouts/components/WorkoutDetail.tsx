import { useState } from "react";
import { useApi } from "@/shared/hooks/useApi.js";
import { useAppStore } from "@/shared/stores/appStore.js";
import { MuscleGroupBadge, ExerciseTypeBadge } from "@/shared/components/MuscleGroupBadge.js";
import { getUniqueMuscleGroups, getTemplateForExercise } from "@/shared/utils/muscleGroups.js";
import type { HevyWorkout, SetType } from "@/shared/types/index.js";

type Workout = HevyWorkout;

interface WorkoutDetailProps {
  workout: Workout;
  onSaved: (workout: Workout) => void;
  onClose: () => void;
}

function cloneWorkout(workout: Workout): Workout {
  return JSON.parse(JSON.stringify(workout)) as Workout;
}

function numberOrNull(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toDatetimeLocal(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function fromDatetimeLocal(value: string): string {
  return value ? new Date(value).toISOString() : new Date().toISOString();
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}:${String(s).padStart(2, "0")}` : `${m}min`;
}

export function WorkoutDetail({ workout, onSaved, onClose }: WorkoutDetailProps) {
  const { apiFetch } = useApi();
  const templates = useAppStore((s) => s.exerciseTemplates);
  const [draft, setDraft] = useState(() => cloneWorkout(workout));
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const duration = Math.round(
    (new Date(draft.end_time).getTime() - new Date(draft.start_time).getTime()) / 60000,
  );

  const totalVolume = draft.exercises.reduce(
    (sum, ex) =>
      sum + ex.sets.reduce((s, set) => s + (set.weight_kg || 0) * (set.reps || 0), 0),
    0,
  );

  const totalSets = draft.exercises.reduce((s, ex) => s + ex.sets.length, 0);
  const muscleGroups = getUniqueMuscleGroups(draft.exercises, templates);

  function updateDraft(mutator: (next: Workout) => void) {
    setDraft((current) => {
      const next = cloneWorkout(current);
      mutator(next);
      return next;
    });
  }

  async function saveWorkout() {
    setIsSaving(true);
    setError(null);
    try {
      const saved = await apiFetch<Workout>(`/api/hevy/workouts/${draft.id}`, {
        method: "PUT",
        body: JSON.stringify({
          workout: {
            title: draft.title,
            description: draft.description,
            start_time: draft.start_time,
            end_time: draft.end_time,
            is_private: Boolean(draft.is_private),
            exercises: draft.exercises.map((exercise) => ({
              exercise_template_id: exercise.exercise_template_id,
              superset_id: exercise.superset_id ?? null,
              notes: exercise.notes,
              sets: exercise.sets.map((set) => ({
                type: set.type,
                weight_kg: set.weight_kg,
                reps: set.reps,
                distance_meters: set.distance_meters,
                duration_seconds: set.duration_seconds,
                custom_metric: set.custom_metric ?? null,
                rpe: set.rpe,
              })),
            })),
          },
        }),
      });
      setDraft(cloneWorkout(saved));
      onSaved(saved);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save workout");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {isEditing ? (
            <input
              value={draft.title}
              onChange={(event) =>
                updateDraft((next) => {
                  next.title = event.target.value;
                })
              }
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-lg font-semibold dark:border-gray-700 dark:bg-gray-950"
            />
          ) : (
            <h3 className="text-lg font-semibold">{draft.title}</h3>
          )}
          {isEditing ? (
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <input
                type="datetime-local"
                value={toDatetimeLocal(draft.start_time)}
                onChange={(event) =>
                  updateDraft((next) => {
                    next.start_time = fromDatetimeLocal(event.target.value);
                  })
                }
                className="rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
              />
              <input
                type="datetime-local"
                value={toDatetimeLocal(draft.end_time)}
                onChange={(event) =>
                  updateDraft((next) => {
                    next.end_time = fromDatetimeLocal(event.target.value);
                  })
                }
                className="rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
              />
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              {new Date(draft.start_time).toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button
                onClick={() => {
                  setDraft(cloneWorkout(workout));
                  setIsEditing(false);
                }}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={saveWorkout}
                disabled={isSaving}
                className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? "Saving" : "Save"}
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Edit
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex flex-wrap gap-3 text-sm text-gray-500">
        {duration > 0 && <span>{duration} min</span>}
        <span>{totalSets} sets</span>
        {totalVolume > 0 && <span>{Math.round(totalVolume).toLocaleString()} kg</span>}
      </div>

      {muscleGroups.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {muscleGroups.map((mg) => (
            <MuscleGroupBadge key={mg} group={mg} />
          ))}
        </div>
      )}

      {isEditing ? (
        <textarea
          value={draft.description || ""}
          onChange={(event) =>
            updateDraft((next) => {
              next.description = event.target.value;
            })
          }
          placeholder="Workout description"
          className="min-h-20 w-full rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
        />
      ) : (
        draft.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400">{draft.description}</p>
        )
      )}

      <div className="space-y-3">
        {draft.exercises.map((exercise, exerciseIndex) => {
          const tmpl = getTemplateForExercise(exercise.exercise_template_id, templates);
          return (
            <div
              key={exerciseIndex}
              className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-3"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-sm">{exercise.title}</p>
                {tmpl && <ExerciseTypeBadge type={tmpl.type} />}
                {tmpl && <MuscleGroupBadge group={tmpl.primary_muscle_group} />}
              </div>
              {isEditing ? (
                <input
                  value={exercise.notes || ""}
                  onChange={(event) =>
                    updateDraft((next) => {
                      next.exercises[exerciseIndex].notes = event.target.value;
                    })
                  }
                  placeholder="Exercise notes"
                  className="mt-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
                />
              ) : (
                exercise.notes && <p className="text-xs text-gray-500 mt-0.5">{exercise.notes}</p>
              )}
              <div className="mt-2 space-y-1">
                {exercise.sets.map((set, setIndex) => (
                  <div
                    key={setIndex}
                    className={
                      isEditing
                        ? "grid gap-2 text-sm sm:grid-cols-[2rem_8rem_8rem_8rem_8rem]"
                        : "flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400"
                    }
                  >
                    <span className="py-2 text-xs text-gray-400">{setIndex + 1}</span>
                    {isEditing ? (
                      <>
                        <select
                          value={set.type}
                          onChange={(event) =>
                            updateDraft((next) => {
                              next.exercises[exerciseIndex].sets[setIndex].type =
                                event.target.value as SetType;
                            })
                          }
                          className="rounded-md border border-gray-200 px-2 py-2 dark:border-gray-700 dark:bg-gray-950"
                        >
                          <option value="normal">normal</option>
                          <option value="warmup">warmup</option>
                          <option value="failure">failure</option>
                          <option value="dropset">dropset</option>
                        </select>
                        <input
                          value={set.weight_kg ?? ""}
                          onChange={(event) =>
                            updateDraft((next) => {
                              next.exercises[exerciseIndex].sets[setIndex].weight_kg =
                                numberOrNull(event.target.value);
                            })
                          }
                          placeholder="kg"
                          className="rounded-md border border-gray-200 px-2 py-2 dark:border-gray-700 dark:bg-gray-950"
                        />
                        <input
                          value={set.reps ?? ""}
                          onChange={(event) =>
                            updateDraft((next) => {
                              next.exercises[exerciseIndex].sets[setIndex].reps =
                                numberOrNull(event.target.value);
                            })
                          }
                          placeholder="reps"
                          className="rounded-md border border-gray-200 px-2 py-2 dark:border-gray-700 dark:bg-gray-950"
                        />
                        <input
                          value={set.rpe ?? ""}
                          onChange={(event) =>
                            updateDraft((next) => {
                              next.exercises[exerciseIndex].sets[setIndex].rpe =
                                numberOrNull(event.target.value);
                            })
                          }
                          placeholder="RPE"
                          className="rounded-md border border-gray-200 px-2 py-2 dark:border-gray-700 dark:bg-gray-950"
                        />
                      </>
                    ) : (
                      <>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                          {set.type}
                        </span>
                        {set.weight_kg !== null && <span>{set.weight_kg} kg</span>}
                        {set.reps !== null && <span>{set.reps} reps</span>}
                        {set.rpe !== null && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                            RPE {set.rpe}
                          </span>
                        )}
                        {set.distance_meters !== null && <span>{set.distance_meters}m</span>}
                        {set.duration_seconds !== null && (
                          <span>{formatDuration(set.duration_seconds)}</span>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
