import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { ImportDirectory, ImportRoutine } from "../stores/uploadStore.js";
import { useUploadStore } from "../stores/uploadStore.js";
import { EditableTitle } from "./EditableTitle.js";
import { RoutineCard } from "./RoutineCard.js";

interface DirectoryCardProps {
  directory: ImportDirectory;
  routines: ImportRoutine[];
  isSubmitting: boolean;
}

function sourceBadge(source: ImportDirectory["source"]) {
  switch (source) {
    case "imported":
      return (
        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
          Imported
        </span>
      );
    case "existing":
      return (
        <span className="rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-950 dark:text-purple-300">
          Existing folder
        </span>
      );
    default:
      return (
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
          New
        </span>
      );
  }
}

export function DirectoryCard({
  directory,
  routines,
  isSubmitting,
}: DirectoryCardProps) {
  const renameDirectory = useUploadStore((s) => s.renameDirectory);
  const removeDirectory = useUploadStore((s) => s.removeDirectory);
  const { setNodeRef, isOver } = useDroppable({
    id: `dir:${directory.id}`,
    data: { type: "directory", directoryId: directory.id },
  });

  const isEmpty = routines.length === 0;
  const dropHighlight = isOver
    ? "ring-2 ring-blue-400 dark:ring-blue-500"
    : "";

  return (
    <div
      className={`rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950 ${dropHighlight}`}
    >
      <div className="flex items-center justify-between gap-2 px-4 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="shrink-0 text-gray-400"
            aria-hidden
          >
            <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
          </svg>
          <EditableTitle
            value={directory.name}
            onCommit={(name) => renameDirectory(directory.id, name)}
            ariaLabel="Rename directory"
            className="truncate text-sm font-semibold text-gray-900 hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-400"
            inputClassName="rounded-md border border-blue-500 bg-white px-2 py-1 text-sm font-semibold dark:bg-gray-900"
          />
          {sourceBadge(directory.source)}
          <span className="text-xs text-gray-500">
            {routines.length} routine{routines.length === 1 ? "" : "s"}
          </span>
        </div>
        <button
          type="button"
          onClick={() => removeDirectory(directory.id)}
          disabled={isSubmitting}
          className="text-xs font-medium text-gray-500 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-400"
        >
          Remove
        </button>
      </div>

      <div
        ref={setNodeRef}
        className="space-y-2 px-4 pb-4"
      >
        <SortableContext
          items={routines.map((r) => r.id)}
          strategy={verticalListSortingStrategy}
        >
          {routines.map((routine) => (
            <RoutineCard
              key={routine.id}
              routine={routine}
              isSubmitting={isSubmitting}
            />
          ))}
        </SortableContext>
        {isEmpty && (
          <div className="rounded-md border border-dashed border-gray-300 px-3 py-6 text-center text-xs text-gray-500 dark:border-gray-700">
            Drop routines here
          </div>
        )}
      </div>
    </div>
  );
}
