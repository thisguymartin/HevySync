import { useState } from "react";
import { useWorkouts } from "./hooks/useWorkouts.js";
import { WorkoutCard } from "./components/WorkoutCard.js";
import { WorkoutDetail } from "./components/WorkoutDetail.js";
import { LoadingSpinner } from "@/shared/components/LoadingSpinner.js";
import { useAppStore } from "@/shared/stores/appStore.js";

export function WorkoutsPage() {
  const hevyApiKey = useAppStore((s) => s.hevyApiKey);
  const { workouts, page, isLoading, error, fetchWorkouts, hasNextPage, hasPrevPage } =
    useWorkouts();
  const [selectedWorkout, setSelectedWorkout] = useState<(typeof workouts)[0] | null>(null);

  if (!hevyApiKey) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">
          Add your Hevy API key in{" "}
          <a href="/settings" className="text-blue-600 underline">
            Settings
          </a>{" "}
          to view workouts.
        </p>
      </div>
    );
  }

  if (selectedWorkout) {
    return (
      <WorkoutDetail
        workout={selectedWorkout}
        onClose={() => setSelectedWorkout(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Workouts</h2>
        <p className="text-gray-500 text-sm mt-1">Your logged workouts from Hevy</p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {isLoading ? (
        <LoadingSpinner className="py-12" />
      ) : workouts.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No workouts found. Start logging in the Hevy app!
        </div>
      ) : (
        <div className="space-y-3">
          {workouts.map((w) => (
            <WorkoutCard
              key={w.id}
              workout={w}
              onClick={() => setSelectedWorkout(w)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {(hasPrevPage || hasNextPage) && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => fetchWorkouts(page - 1)}
            disabled={!hasPrevPage || isLoading}
            className="px-4 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-800 rounded-lg disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">Page {page}</span>
          <button
            onClick={() => fetchWorkouts(page + 1)}
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
