interface RoutineCardProps {
  routine: {
    id: string;
    title: string;
    notes: string;
    exercises: Array<{
      title: string;
      sets: Array<{
        type: string;
        weight_kg: number | null;
        reps: number | null;
      }>;
    }>;
  };
  onClick: () => void;
}

export function RoutineCard({ routine, onClick }: RoutineCardProps) {
  const totalSets = routine.exercises.reduce(
    (sum, ex) => sum + ex.sets.filter((s) => s.type === "normal").length,
    0
  );

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
    >
      <h3 className="font-medium truncate">{routine.title}</h3>
      {routine.notes && (
        <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{routine.notes}</p>
      )}
      <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
        <span>{routine.exercises.length} exercises</span>
        <span>{totalSets} sets</span>
      </div>
      <div className="flex flex-wrap gap-1 mt-2">
        {routine.exercises.slice(0, 3).map((ex, i) => (
          <span
            key={i}
            className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 truncate max-w-[120px]"
          >
            {ex.title}
          </span>
        ))}
        {routine.exercises.length > 3 && (
          <span className="text-xs text-gray-500">
            +{routine.exercises.length - 3}
          </span>
        )}
      </div>
    </button>
  );
}
