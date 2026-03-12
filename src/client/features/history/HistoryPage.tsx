import { useHistory } from "./hooks/useHistory.js";
import { HistoryCard } from "./components/HistoryCard.js";
import { HistoryStats } from "./components/HistoryStats.js";
import { LoadingSpinner } from "@/shared/components/LoadingSpinner.js";
import { RequireHevyKey } from "@/shared/components/RequireHevyKey.js";
import { ErrorAlert } from "@/shared/components/ErrorAlert.js";
import { Pagination } from "@/shared/components/Pagination.js";

export function HistoryPage() {
  const { groupedWorkouts, stats, page, isLoading, error, fetchHistory, hasNextPage, hasPrevPage } =
    useHistory();

  return (
    <RequireHevyKey noun="history">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">History</h2>
          <p className="text-gray-500 text-sm mt-1">Your completed workout history</p>
        </div>

        <ErrorAlert error={error} />

        {isLoading ? (
          <LoadingSpinner className="py-12" />
        ) : (
          <>
            <HistoryStats stats={stats} />

            {groupedWorkouts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No workout history yet.
              </div>
            ) : (
              <div className="space-y-6">
                {groupedWorkouts.map((group) => (
                  <div key={group.key}>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                      {group.label}
                    </h3>
                    <div className="space-y-3">
                      {group.workouts.map((w) => (
                        <HistoryCard key={w.id} workout={w} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <Pagination
          page={page}
          hasPrevPage={hasPrevPage}
          hasNextPage={hasNextPage}
          isLoading={isLoading}
          onPageChange={fetchHistory}
        />
      </div>
    </RequireHevyKey>
  );
}
