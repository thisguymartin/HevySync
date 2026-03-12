interface GeneratedPlanProps {
  routines: Array<{
    title: string;
    notes: string;
    exercises: Array<{
      title: string;
      notes: string;
      sets: Array<{
        type: string;
        weight_kg: number | null;
        reps: number | null;
      }>;
    }>;
  }>;
  onPush: () => void;
  isPushing: boolean;
  pushResult: string | null;
}

export function GeneratedPlan({
  routines,
  onPush,
  isPushing,
  pushResult,
}: GeneratedPlanProps) {
  if (pushResult) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-green-600 dark:text-green-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-lg font-medium text-green-700 dark:text-green-300">
          {pushResult}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Open Hevy to see your new routines
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">
          Generated Plan ({routines.length} routine{routines.length !== 1 ? "s" : ""})
        </h3>
        <button
          onClick={onPush}
          disabled={isPushing}
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          {isPushing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Pushing...
            </>
          ) : (
            "Push to Hevy"
          )}
        </button>
      </div>

      {routines.map((routine, ri) => (
        <div
          key={ri}
          className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden"
        >
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <h4 className="font-medium">{routine.title}</h4>
            {routine.notes && (
              <p className="text-xs text-gray-500 mt-0.5">{routine.notes}</p>
            )}
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {routine.exercises.map((ex, ei) => (
              <div key={ei} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{ex.title}</p>
                  <span className="text-xs text-gray-500">
                    {ex.sets.filter((s) => s.type === "normal").length} sets
                  </span>
                </div>
                {ex.notes && (
                  <p className="text-xs text-gray-500 mt-0.5">{ex.notes}</p>
                )}
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {ex.sets.map((set, si) => (
                    <span
                      key={si}
                      className={`text-xs px-2 py-0.5 rounded ${
                        set.type === "warmup"
                          ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {set.weight_kg}kg x {set.reps}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
