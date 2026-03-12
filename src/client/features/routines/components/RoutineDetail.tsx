import { useAppStore } from "@/shared/stores/appStore.js";
import { MuscleGroupBadge, ExerciseTypeBadge } from "@/shared/components/MuscleGroupBadge.js";
import { getUniqueMuscleGroups, getTemplateForExercise } from "@/shared/utils/muscleGroups.js";

interface RoutineDetailProps {
  routine: {
    id: string;
    title: string;
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
  };
  onClose: () => void;
}

export function RoutineDetail({ routine, onClose }: RoutineDetailProps) {
  const templates = useAppStore((s) => s.exerciseTemplates);

  const totalSets = routine.exercises.reduce(
    (sum, ex) => sum + ex.sets.filter((s) => s.type === "normal").length,
    0
  );

  const muscleGroups = getUniqueMuscleGroups(routine.exercises, templates);

  // Group exercises by superset
  const supersetGroups = new Map<number, number[]>();
  routine.exercises.forEach((ex, i) => {
    if (ex.superset_id !== null) {
      const group = supersetGroups.get(ex.superset_id) || [];
      group.push(i);
      supersetGroups.set(ex.superset_id, group);
    }
  });

  function isInSuperset(index: number): boolean {
    for (const indices of supersetGroups.values()) {
      if (indices.includes(index) && indices.length > 1) return true;
    }
    return false;
  }

  function isFirstInSuperset(index: number): boolean {
    for (const indices of supersetGroups.values()) {
      if (indices[0] === index && indices.length > 1) return true;
    }
    return false;
  }

  function isLastInSuperset(index: number): boolean {
    for (const indices of supersetGroups.values()) {
      if (indices[indices.length - 1] === index && indices.length > 1) return true;
    }
    return false;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{routine.title}</h3>
          {routine.notes && (
            <p className="text-sm text-gray-500 mt-0.5">{routine.notes}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Summary */}
      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
        <span>{routine.exercises.length} exercises</span>
        <span>{totalSets} working sets</span>
      </div>

      {muscleGroups.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {muscleGroups.map((mg) => (
            <MuscleGroupBadge key={mg} group={mg} />
          ))}
        </div>
      )}

      <div className="space-y-3">
        {routine.exercises.map((exercise, i) => {
          const tmpl = getTemplateForExercise(exercise.exercise_template_id, templates);
          const inSuperset = isInSuperset(i);
          const firstInSS = isFirstInSuperset(i);
          const lastInSS = isLastInSuperset(i);

          return (
            <div
              key={i}
              className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-3 ${
                inSuperset
                  ? `border-l-4 border-l-purple-400 dark:border-l-purple-600 ${
                      firstInSS ? "rounded-b-none" : ""
                    } ${lastInSS ? "rounded-t-none" : ""} ${
                      !firstInSS && !lastInSS ? "rounded-none" : ""
                    }`
                  : ""
              }`}
            >
              {firstInSS && (
                <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-1">
                  Superset
                </p>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-sm">{exercise.title}</p>
                {tmpl && <ExerciseTypeBadge type={tmpl.type} />}
                {tmpl && <MuscleGroupBadge group={tmpl.primary_muscle_group} />}
              </div>
              {exercise.notes && (
                <p className="text-xs text-gray-500 mt-0.5">{exercise.notes}</p>
              )}
              <div className="mt-2 space-y-1">
                {exercise.sets.map((set, j) => (
                  <div
                    key={j}
                    className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400"
                  >
                    <span className="w-6 text-xs text-gray-400">{j + 1}</span>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${
                        set.type === "warmup"
                          ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                          : set.type === "dropset"
                            ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400"
                            : set.type === "failure"
                              ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {set.type}
                    </span>
                    {set.weight_kg !== null && <span>{set.weight_kg} kg</span>}
                    {set.reps !== null && <span>{set.reps} reps</span>}
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
