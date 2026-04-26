import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { ImportRoutine } from "../stores/uploadStore.js";
import { RoutineCard } from "./RoutineCard.js";

interface UnassignedBinProps {
  routines: ImportRoutine[];
  isSubmitting: boolean;
}

export function UnassignedBin({ routines, isSubmitting }: UnassignedBinProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: "dir:__unassigned__",
    data: { type: "directory", directoryId: null },
  });

  const dropHighlight = isOver
    ? "ring-2 ring-blue-400 dark:ring-blue-500"
    : "";

  return (
    <div
      className={`rounded-lg border border-dashed border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900 ${dropHighlight}`}
    >
      <div className="flex items-center justify-between gap-2 px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            Uncategorized
          </span>
          <span className="text-xs text-gray-500">
            {routines.length} routine{routines.length === 1 ? "" : "s"} skipped
          </span>
        </div>
      </div>
      <div ref={setNodeRef} className="space-y-2 px-4 pb-4">
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
        {routines.length === 0 && (
          <div className="rounded-md border border-dashed border-gray-300 px-3 py-4 text-center text-xs text-gray-500 dark:border-gray-700">
            Drop routines here to skip them during submit
          </div>
        )}
      </div>
    </div>
  );
}
