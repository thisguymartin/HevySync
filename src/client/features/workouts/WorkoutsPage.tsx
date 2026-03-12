import { useState } from "react";
import { useWorkouts } from "./hooks/useWorkouts.js";
import { WorkoutCard } from "./components/WorkoutCard.js";
import { WorkoutDetail } from "./components/WorkoutDetail.js";
import { LoadingSpinner } from "@/shared/components/LoadingSpinner.js";
import { RequireHevyKey } from "@/shared/components/RequireHevyKey.js";
import { ErrorAlert } from "@/shared/components/ErrorAlert.js";
import { Pagination } from "@/shared/components/Pagination.js";

export function WorkoutsPage() {
  const { workouts, page, isLoading, error, fetchWorkouts, hasNextPage, hasPrevPage } =
    useWorkouts();
  const [selectedWorkout, setSelectedWorkout] = useState<(typeof workouts)[0] | null>(null);

  if (selectedWorkout) {
    return (
      <WorkoutDetail
        workout={selectedWorkout}
        onClose={() => setSelectedWorkout(null)}
      />
    );
  }

  return (
    <RequireHevyKey noun="workouts">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Workouts</h2>
          <p className="text-gray-500 text-sm mt-1">Your logged workouts from Hevy</p>
        </div>

        <ErrorAlert error={error} />

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

        <Pagination
          page={page}
          hasPrevPage={hasPrevPage}
          hasNextPage={hasNextPage}
          isLoading={isLoading}
          onPageChange={fetchWorkouts}
        />
      </div>
    </RequireHevyKey>
  );
}
