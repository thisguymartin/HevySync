import { useAppStore } from "@/shared/stores/appStore.js";
import { MuscleGroupBadge } from "@/shared/components/MuscleGroupBadge.js";
import { getUniqueMuscleGroups } from "@/shared/utils/muscleGroups.js";

interface HistoryCardProps {
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
}

export function HistoryCard({ workout }: HistoryCardProps) {
  const templates = useAppStore((s) => s.exerciseTemplates);

  const duration = Math.round(
    (new Date(workout.end_time).getTime() -
      new Date(workout.start_time).getTime()) /
      60000
  );

  const volume = workout.exercises.reduce(
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
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium text-sm">{workout.title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {new Date(workout.start_time).toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex gap-3 text-xs text-gray-500">
          {duration > 0 && <span>{duration} min</span>}
          {volume > 0 && <span>{Math.round(volume).toLocaleString()} kg</span>}
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-2">
        {workout.exercises.length} exercises · {totalSets} sets
      </p>

      <div className="flex flex-wrap gap-1 mt-2">
        {muscleGroups.length > 0
          ? muscleGroups.map((mg) => (
              <MuscleGroupBadge key={mg} group={mg} />
            ))
          : workout.exercises.map((ex, i) => (
              <span
                key={i}
                className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
              >
                {ex.title}
              </span>
            ))}
      </div>
    </div>
  );
}
