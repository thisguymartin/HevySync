import { useMemo, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useUploadStore } from "../stores/uploadStore.js";
import { useHevyFolders } from "../hooks/useHevyFolders.js";
import { DirectoryCard } from "./DirectoryCard.js";
import { UnassignedBin } from "./UnassignedBin.js";

interface OrganizePageProps {
  onBack: () => void;
  onSubmit: () => void;
}

export function OrganizePage({ onBack, onSubmit }: OrganizePageProps) {
  const directories = useUploadStore((s) => s.directories);
  const routines = useUploadStore((s) => s.routines);
  const addDirectory = useUploadStore((s) => s.addDirectory);
  const moveRoutine = useUploadStore((s) => s.moveRoutine);
  const attachToExistingFolder = useUploadStore((s) => s.attachToExistingFolder);
  const error = useUploadStore((s) => s.error);
  const { folders: existingFolders } = useHevyFolders();
  const [newDirectoryName, setNewDirectoryName] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const routinesByDirectory = useMemo(() => {
    const map = new Map<string | null, typeof routines>();
    for (const dir of directories) map.set(dir.id, []);
    map.set(null, []);
    for (const routine of routines) {
      const key = routine.directoryId;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(routine);
    }
    return map;
  }, [directories, routines]);

  const unattachedExistingFolders = existingFolders.filter(
    (folder) => !directories.some((dir) => dir.hevyFolderId === folder.id),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const overData = over.data.current as
      | { type: "routine" | "directory"; directoryId: string | null }
      | undefined;
    if (!overData) return;

    if (overData.type === "routine") {
      moveRoutine(String(active.id), {
        type: "before",
        routineId: String(over.id),
      });
    } else {
      moveRoutine(String(active.id), {
        type: "intoDirectory",
        directoryId: overData.directoryId,
      });
    }
  }

  function handleAddDirectory() {
    const name = newDirectoryName.trim();
    if (!name) return;
    addDirectory(name);
    setNewDirectoryName("");
  }

  const totalRoutines = routines.length;
  const unassignedRoutines = routinesByDirectory.get(null) || [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Organize routines</h3>
          <p className="text-sm text-gray-500">
            {totalRoutines} routine{totalRoutines === 1 ? "" : "s"} ready ·{" "}
            {directories.length} folder{directories.length === 1 ? "" : "s"}.
            Drag to rearrange, click names to rename.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onBack}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Back
          </button>
          <button
            onClick={onSubmit}
            disabled={totalRoutines === 0}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Submit to Hevy
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={newDirectoryName}
          placeholder="New directory name"
          onChange={(e) => setNewDirectoryName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddDirectory();
            }
          }}
          className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
        />
        <button
          onClick={handleAddDirectory}
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Add directory
        </button>
        {unattachedExistingFolders.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Add existing:</span>
            <select
              defaultValue=""
              onChange={(e) => {
                const id = Number(e.target.value);
                const folder = unattachedExistingFolders.find((f) => f.id === id);
                if (folder) attachToExistingFolder(folder);
                e.target.value = "";
              }}
              className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
            >
              <option value="" disabled>
                Pick a Hevy folder…
              </option>
              {unattachedExistingFolders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-3">
          {directories.map((directory) => (
            <DirectoryCard
              key={directory.id}
              directory={directory}
              routines={routinesByDirectory.get(directory.id) || []}
              isSubmitting={false}
            />
          ))}
          <UnassignedBin routines={unassignedRoutines} isSubmitting={false} />
        </div>
      </DndContext>
    </div>
  );
}
