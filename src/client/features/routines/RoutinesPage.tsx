import { useState } from "react";
import { useRoutines } from "./hooks/useRoutines.js";
import { RoutineCard } from "./components/RoutineCard.js";
import { RoutineDetail } from "./components/RoutineDetail.js";
import { LoadingSpinner } from "@/shared/components/LoadingSpinner.js";
import { RequireHevyKey } from "@/shared/components/RequireHevyKey.js";
import { ErrorAlert } from "@/shared/components/ErrorAlert.js";
import { Pagination } from "@/shared/components/Pagination.js";

export function RoutinesPage() {
  const { routines, page, isLoading, error, fetchRoutines, hasNextPage, hasPrevPage } =
    useRoutines();
  const [selectedRoutine, setSelectedRoutine] = useState<(typeof routines)[0] | null>(null);

  if (selectedRoutine) {
    return (
      <RoutineDetail
        routine={selectedRoutine}
        onSaved={setSelectedRoutine}
        onClose={() => setSelectedRoutine(null)}
      />
    );
  }

  return (
    <RequireHevyKey noun="routines">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Routines</h2>
          <p className="text-gray-500 text-sm mt-1">Your reusable workout templates in Hevy</p>
        </div>

        <ErrorAlert error={error} />

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

        <Pagination
          page={page}
          hasPrevPage={hasPrevPage}
          hasNextPage={hasNextPage}
          isLoading={isLoading}
          onPageChange={fetchRoutines}
        />
      </div>
    </RequireHevyKey>
  );
}
