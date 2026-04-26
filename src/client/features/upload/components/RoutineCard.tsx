import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ImportRoutine } from "../stores/uploadStore.js";
import { useUploadStore } from "../stores/uploadStore.js";
import { EditableTitle } from "./EditableTitle.js";

interface RoutineCardProps {
  routine: ImportRoutine;
  isSubmitting: boolean;
}

function statusChip(routine: ImportRoutine) {
  switch (routine.status.kind) {
    case "skipped":
      return (
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
          Skipped
        </span>
      );
    case "creating":
      return (
        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
          Creating…
        </span>
      );
    case "success":
      return (
        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
          Created
        </span>
      );
    case "error":
      return (
        <span
          title={routine.status.message}
          className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300"
        >
          Failed
        </span>
      );
    default:
      return null;
  }
}

export function RoutineCard({ routine, isSubmitting }: RoutineCardProps) {
  const renameRoutine = useUploadStore((s) => s.renameRoutine);
  const sortable = useSortable({
    id: routine.id,
    data: { type: "routine", directoryId: routine.directoryId },
    disabled: isSubmitting,
  });
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    sortable;

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const exerciseCount = routine.payload.exercises.length;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-md border border-gray-200 bg-white px-3 py-2 dark:border-gray-800 dark:bg-gray-900"
    >
      <button
        type="button"
        aria-label="Drag routine"
        {...attributes}
        {...listeners}
        disabled={isSubmitting}
        className="cursor-grab touch-none text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:text-gray-200"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <circle cx="9" cy="6" r="1.5" />
          <circle cx="15" cy="6" r="1.5" />
          <circle cx="9" cy="12" r="1.5" />
          <circle cx="15" cy="12" r="1.5" />
          <circle cx="9" cy="18" r="1.5" />
          <circle cx="15" cy="18" r="1.5" />
        </svg>
      </button>

      <div className="min-w-0 flex-1">
        <EditableTitle
          value={routine.name}
          onCommit={(name) => renameRoutine(routine.id, name)}
          ariaLabel="Rename routine"
          className="block w-full truncate text-sm font-medium text-gray-900 hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-400"
          inputClassName="w-full rounded-md border border-blue-500 bg-white px-2 py-1 text-sm font-medium dark:bg-gray-900"
          placeholder="Untitled routine"
        />
        <p className="text-xs text-gray-500">
          {exerciseCount} exercise{exerciseCount === 1 ? "" : "s"}
        </p>
      </div>

      {statusChip(routine)}
    </div>
  );
}
