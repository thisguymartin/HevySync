interface WorkoutDetailProps {
  workout: {
    id: string;
    title: string;
    start_time: string;
    end_time: string;
    description: string | null;
    exercises: Array<{
      title: string;
      notes: string;
      sets: Array<{
        type: string;
        weight_kg: number | null;
        reps: number | null;
      }>;
    }>;
  };
  onClose: () => void;
}

export function WorkoutDetail({ workout, onClose }: WorkoutDetailProps) {
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

      {workout.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {workout.description}
        </p>
      )}

      <div className="space-y-3">
        {workout.exercises.map((exercise, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-3"
          >
            <p className="font-medium text-sm">{exercise.title}</p>
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
                          : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {set.type}
                  </span>
                  {set.weight_kg !== null && (
                    <span>{set.weight_kg} kg</span>
                  )}
                  {set.reps !== null && <span>{set.reps} reps</span>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
