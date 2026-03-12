import { useState } from "react";
import { useRoutines } from "./hooks/useRoutines.js";
import { RoutineCard } from "./components/RoutineCard.js";
import { RoutineDetail } from "./components/RoutineDetail.js";
import { LoadingSpinner } from "@/shared/components/LoadingSpinner.js";
import { useAppStore } from "@/shared/stores/appStore.js";

export function RoutinesPage() {
  const hevyApiKey = useAppStore((s) => s.hevyApiKey);
  const { routines, page, isLoading, error, fetchRoutines, hasNextPage, hasPrevPage } =
    useRoutines();
  const [selectedRoutine, setSelectedRoutine] = useState<(typeof routines)[0] | null>(null);

  if (!hevyApiKey) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">
          Add your Hevy API key in{" "}
          <a href="/settings" className="text-blue-600 underline">
            Settings
          </a>{" "}
          to view routines.
        </p>
      </div>
    );
  }

  if (selectedRoutine) {
    return (
      <RoutineDetail
        routine={selectedRoutine}
        onClose={() => setSelectedRoutine(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Routines</h2>
        <p className="text-gray-500 text-sm mt-1">Your reusable workout templates in Hevy</p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {isLoading ? (
        <LoadingSpinner className="py-12" />
      ) : routines.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No routines yet.</p>
          <p className="text-sm mt-1">
            Upload a workout sheet to create routines automatically.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {routines.map((r) => (
            <RoutineCard
              key={r.id}
              routine={r}
              onClick={() => setSelectedRoutine(r)}
            />
          ))}
        </div>
      )}

      {(hasPrevPage || hasNextPage) && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => fetchRoutines(page - 1)}
            disabled={!hasPrevPage || isLoading}
            className="px-4 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-800 rounded-lg disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">Page {page}</span>
          <button
            onClick={() => fetchRoutines(page + 1)}
            disabled={!hasNextPage || isLoading}
            className="px-4 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-800 rounded-lg disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
