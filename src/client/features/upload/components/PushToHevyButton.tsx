interface PushToHevyButtonProps {
  pushResult: string | null;
  onReset: () => void;
}

export function PushToHevyButton({ pushResult, onReset }: PushToHevyButtonProps) {
  return (
    <div className="text-center space-y-4 py-8">
      <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
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
      <p className="text-sm text-gray-500">
        Open the Hevy app to see your new routines
      </p>
      <button
        onClick={onReset}
        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Upload Another
      </button>
    </div>
  );
}
