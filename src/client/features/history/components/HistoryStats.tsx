interface HistoryStatsProps {
  stats: {
    totalWorkouts: number;
    totalVolume: number;
    totalSets: number;
  };
}

export function HistoryStats({ stats }: HistoryStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-3 text-center">
        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
          {stats.totalWorkouts}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">Workouts</p>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-3 text-center">
        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
          {Math.round(stats.totalVolume).toLocaleString()}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">Volume (kg)</p>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-3 text-center">
        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
          {stats.totalSets}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">Total Sets</p>
      </div>
    </div>
  );
}
