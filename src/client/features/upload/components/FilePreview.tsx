interface FilePreviewProps {
  fileName: string;
  rows: string[][];
  onConfirm: () => void;
  onBack: () => void;
  isLoading: boolean;
}

export function FilePreview({
  fileName,
  rows,
  onConfirm,
  onBack,
  isLoading,
}: FilePreviewProps) {
  const displayRows = rows.slice(0, 50); // Show first 50 rows

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">{fileName}</h3>
          <p className="text-sm text-gray-500">
            {rows.length} rows, {rows[0]?.length || 0} columns
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onBack}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Back
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Parsing with AI...
              </>
            ) : (
              "Parse with AI"
            )}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
        <table className="min-w-full text-sm">
          <tbody>
            {displayRows.map((row, i) => (
              <tr
                key={i}
                className={
                  i % 2 === 0
                    ? "bg-white dark:bg-gray-900"
                    : "bg-gray-50 dark:bg-gray-950"
                }
              >
                <td className="px-2 py-1 text-gray-400 text-xs sticky left-0 bg-inherit">
                  {i + 1}
                </td>
                {row.map((cell, j) => (
                  <td
                    key={j}
                    className="px-3 py-1.5 whitespace-nowrap max-w-[200px] truncate"
                    title={String(cell)}
                  >
                    {String(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length > 50 && (
        <p className="text-sm text-gray-500 text-center">
          Showing first 50 of {rows.length} rows
        </p>
      )}
    </div>
  );
}
