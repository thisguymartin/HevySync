import { useAppStore } from "@/shared/stores/appStore.js";
import { MuscleGroupBadge } from "@/shared/components/MuscleGroupBadge.js";
import { getUniqueMuscleGroups } from "@/shared/utils/muscleGroups.js";

interface WorkoutCardProps {
  workout: {
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
  };
  onClick: () => void;
}

export function WorkoutCard({ workout, onClick }: WorkoutCardProps) {
  const templates = useAppStore((s) => s.exerciseTemplates);

  const duration = Math.round(
    (new Date(workout.end_time).getTime() -
      new Date(workout.start_time).getTime()) /
      60000
  );

  const totalVolume = workout.exercises.reduce((sum, ex) => {
    return (
      sum +
      ex.sets.reduce(
        (s, set) => s + (set.weight_kg || 0) * (set.reps || 0),
        0
      )
    );
  }, 0);

  const totalSets = workout.exercises.reduce((s, ex) => s + ex.sets.length, 0);
  const muscleGroups = getUniqueMuscleGroups(workout.exercises, templates);

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium truncate">{workout.title}</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date(workout.start_time).toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
            {duration > 0 && ` \u00B7 ${duration}min`}
          </p>
        </div>
        <div className="text-right shrink-0 ml-3">
          <p className="text-sm font-medium">
            {workout.exercises.length} exercise{workout.exercises.length !== 1 ? "s" : ""}
            {" · "}{totalSets} sets
          </p>
          {totalVolume > 0 && (
            <p className="text-xs text-gray-500">
              {Math.round(totalVolume).toLocaleString()} kg vol
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mt-2">
        {muscleGroups.length > 0
          ? muscleGroups.map((mg) => (
              <MuscleGroupBadge key={mg} group={mg} />
            ))
          : workout.exercises.slice(0, 4).map((ex, i) => (
              <span
                key={i}
                className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 truncate max-w-[150px]"
              >
                {ex.title}
              </span>
            ))}
        {muscleGroups.length === 0 && workout.exercises.length > 4 && (
          <span className="text-xs text-gray-500">
            +{workout.exercises.length - 4} more
          </span>
        )}
      </div>
    </button>
  );
}
