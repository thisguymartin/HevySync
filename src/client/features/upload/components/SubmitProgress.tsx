import { useUploadStore } from "../stores/uploadStore.js";

interface SubmitProgressProps {
  isFinished: boolean;
  onReset: () => void;
}

function statusLabel(kind: string): string {
  switch (kind) {
    case "skipped":
      return "Skipped";
    case "creating":
      return "Creating…";
    case "success":
      return "Created";
    case "error":
      return "Failed";
    default:
      return "Pending";
  }
}

function statusClass(kind: string): string {
  switch (kind) {
    case "skipped":
      return "text-gray-500";
    case "creating":
      return "text-blue-600 dark:text-blue-300";
    case "success":
      return "text-green-600 dark:text-green-300";
    case "error":
      return "text-red-600 dark:text-red-300";
    default:
      return "text-gray-500";
  }
}

export function SubmitProgress({ isFinished, onReset }: SubmitProgressProps) {
  const directories = useUploadStore((s) => s.directories);
  const routines = useUploadStore((s) => s.routines);

  const submittedRoutines = routines.filter((r) => r.directoryId !== null);
  const total = submittedRoutines.length;
  const succeeded = submittedRoutines.filter((r) => r.status.kind === "success").length;
  const failed = submittedRoutines.filter((r) => r.status.kind === "error").length;
  const skipped = routines.filter((r) => r.status.kind === "skipped").length;
  const percent =
    total === 0 ? 0 : Math.round(((succeeded + failed) / total) * 100);

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-200">
            {isFinished ? "Done" : "Submitting routines…"}
          </span>
          <span className="text-gray-500">
            {succeeded + failed} / {total}
            {failed > 0 ? ` · ${failed} failed` : ""}
            {skipped > 0 ? ` · ${skipped} skipped` : ""}
          </span>
        </div>
        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
          <div
            className={`h-full transition-[width] duration-200 ${failed > 0 ? "bg-amber-500" : "bg-green-500"}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {directories.map((directory) => {
          const dirRoutines = routines.filter((r) => r.directoryId === directory.id);
          if (dirRoutines.length === 0) return null;
          return (
            <div
              key={directory.id}
              className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <span className="truncate">{directory.name}</span>
                {directory.hevyFolderId !== null && (
                  <span className="text-xs font-normal text-gray-500">
                    folder #{directory.hevyFolderId}
                  </span>
                )}
              </div>
              <ul className="space-y-1 text-sm">
                {dirRoutines.map((routine) => (
                  <li
                    key={routine.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="truncate">{routine.name}</span>
                    <span className={`shrink-0 text-xs ${statusClass(routine.status.kind)}`}>
                      {statusLabel(routine.status.kind)}
                      {routine.status.kind === "error" && (
                        <span
                          title={routine.status.message}
                          className="ml-2 cursor-help underline-offset-2 hover:underline"
                        >
                          why?
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}

        {routines.some((r) => r.directoryId === null) && (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
              Uncategorized
            </div>
            <ul className="space-y-1 text-sm">
              {routines
                .filter((r) => r.directoryId === null)
                .map((routine) => (
                  <li
                    key={routine.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="truncate">{routine.name}</span>
                    <span className={`shrink-0 text-xs ${statusClass(routine.status.kind)}`}>
                      {statusLabel(routine.status.kind)}
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>

      {isFinished && (
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onReset}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Upload another
          </button>
        </div>
      )}
    </div>
  );
}
