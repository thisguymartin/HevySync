import type { ParsedProgram, ParsedSet } from "@/shared/types/index.js";
import type {
  ImportDirectory,
  ImportRoutine,
  RoutinePayload,
} from "../stores/uploadStore.js";

function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `id-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

function routineSetFromParsedSet(set: ParsedSet): RoutinePayload["exercises"][number]["sets"][number] {
  const routineSet: RoutinePayload["exercises"][number]["sets"][number] = {
    type: set.type,
    weight_kg: set.weight_kg,
    reps: set.reps,
    distance_meters: set.distance_meters,
    duration_seconds: set.duration_seconds,
    custom_metric: set.custom_metric,
  };

  if (
    typeof set.rep_range?.start === "number" &&
    typeof set.rep_range?.end === "number" &&
    Number.isFinite(set.rep_range.start) &&
    Number.isFinite(set.rep_range.end)
  ) {
    routineSet.rep_range = {
      start: set.rep_range.start,
      end: set.rep_range.end,
    };
  }

  return routineSet;
}

export type OrganizeBuildResult = {
  directories: ImportDirectory[];
  routines: ImportRoutine[];
  unresolvedCount: number;
};

export function buildOrganizeState(program: ParsedProgram): OrganizeBuildResult {
  const directories: ImportDirectory[] = [];
  const routines: ImportRoutine[] = [];
  let unresolvedCount = 0;

  for (const week of program.weeks) {
    const directory: ImportDirectory = {
      id: newId(),
      name: `Week ${week.weekNumber}`,
      source: "imported",
      hevyFolderId: null,
    };
    directories.push(directory);

    for (const block of week.blocks) {
      const title = block.blockName || `Block ${block.blockNumber}`;
      const notes = [program.programName, block.notes].filter(Boolean).join("\n");
      const exercises = block.exercises.map((exercise) => {
        if (!exercise.selectedTemplateId) unresolvedCount += 1;
        return {
          exercise_template_id: exercise.selectedTemplateId || "",
          superset_id: exercise.supersetGroup,
          rest_seconds: exercise.restSeconds,
          notes:
            exercise.notes ||
            (exercise.weight.includes("%") ? `Load: ${exercise.weight}` : ""),
          sets: exercise.parsedSets.map(routineSetFromParsedSet),
        };
      });

      const payload: RoutinePayload = {
        title,
        folder_id: null,
        notes,
        exercises,
      };

      routines.push({
        id: newId(),
        directoryId: directory.id,
        name: title,
        notes,
        payload,
        status: { kind: "pending" },
      });
    }
  }

  return { directories, routines, unresolvedCount };
}
