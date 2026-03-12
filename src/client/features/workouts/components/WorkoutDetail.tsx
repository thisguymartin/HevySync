import { useAppStore } from "@/shared/stores/appStore.js";
import { MuscleGroupBadge, ExerciseTypeBadge } from "@/shared/components/MuscleGroupBadge.js";
import { getUniqueMuscleGroups, getTemplateForExercise } from "@/shared/utils/muscleGroups.js";

interface WorkoutDetailProps {
  workout: {
    id: string;
    title: string;
    start_time: string;
    end_time: string;
    description: string | null;
    exercises: Array<{
      title: string;
      exercise_template_id: string;
      notes: string;
      sets: Array<{
        type: string;
        weight_kg: number | null;
        reps: number | null;
        rpe: number | null;
        distance_meters: number | null;
        duration_seconds: number | null;
      }>;
    }>;
  };
  onClose: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}:${String(s).padStart(2, "0")}` : `${m}min`;
}

export function WorkoutDetail({ workout, onClose }: WorkoutDetailProps) {
  const templates = useAppStore((s) => s.exerciseTemplates);

  const duration = Math.round(
    (new Date(workout.end_time).getTime() -
      new Date(workout.start_time).getTime()) /
      60000
  );

  const totalVolume = workout.exercises.reduce(
    (sum, ex) =>
      sum +
      ex.sets.reduce(
        (s, set) => s + (set.weight_kg || 0) * (set.reps || 0),
        0
      ),
    0
  );

  const totalSets = workout.exercises.reduce((s, ex) => s + ex.sets.length, 0);
  const muscleGroups = getUniqueMuscleGroups(workout.exercises, templates);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{workout.title}</h3>
          <p className="text-sm text-gray-500">
            {new Date(workout.start_time).toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
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

      {workout.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {workout.description}
        </p>
      )}

      <div className="space-y-3">
        {workout.exercises.map((exercise, i) => {
          const tmpl = getTemplateForExercise(exercise.exercise_template_id, templates);
          return (
            <div
              key={i}
              className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-3"
            >
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
                    {set.weight_kg !== null && (
                      <span>{set.weight_kg} kg</span>
                    )}
                    {set.reps !== null && <span>{set.reps} reps</span>}
                    {set.rpe !== null && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                        RPE {set.rpe}
                      </span>
                    )}
                    {set.distance_meters !== null && (
                      <span>{set.distance_meters}m</span>
                    )}
                    {set.duration_seconds !== null && (
                      <span>{formatDuration(set.duration_seconds)}</span>
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
