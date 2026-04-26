import { create } from "zustand";
import type { ParsedProgram } from "@/shared/types/index.js";

export type UploadStep = "upload" | "preview" | "parsed" | "organize" | "pushing";

export type RoutinePayload = {
  title: string;
  folder_id?: number | null;
  notes?: string | null;
  exercises: Array<{
    exercise_template_id: string;
    superset_id?: number | null;
    rest_seconds?: number | null;
    notes?: string | null;
    sets: Array<{
      type: string;
      weight_kg?: number | null;
      reps?: number | null;
      rep_range?: { start: number | null; end: number | null } | null;
      distance_meters?: number | null;
      duration_seconds?: number | null;
      custom_metric?: number | null;
    }>;
  }>;
};

export type ImportDirectory = {
  id: string;
  name: string;
  source: "imported" | "manual" | "existing";
  hevyFolderId: number | null;
};

export type SubmitStatus =
  | { kind: "pending" }
  | { kind: "skipped" }
  | { kind: "creating" }
  | { kind: "success"; hevyId: string }
  | { kind: "error"; message: string };

export type ImportRoutine = {
  id: string;
  directoryId: string | null;
  name: string;
  notes: string;
  payload: RoutinePayload;
  status: SubmitStatus;
};

export type ExistingFolder = { id: number; title: string };

export type RoutineMoveTarget =
  | { type: "before"; routineId: string }
  | { type: "intoDirectory"; directoryId: string | null };

type UploadStateValues = {
  step: UploadStep;
  file: File | null;
  rawRows: string[][];
  parsedProgram: ParsedProgram | null;
  warnings: string[];
  isLoading: boolean;
  parseStatus: string | null;
  error: string | null;
  pushResult: string | null;
  activeWeekIndex: number;
  directories: ImportDirectory[];
  routines: ImportRoutine[];
  existingFolders: ExistingFolder[];
  existingFoldersLoaded: boolean;
};

type UploadStore = UploadStateValues & {
  selectFile: (file: File) => void;
  setStep: (step: UploadStep) => void;
  setRawRows: (rawRows: string[][]) => void;
  setParsedProgram: (program: ParsedProgram | null) => void;
  updateParsedProgram: (mutator: (program: ParsedProgram) => void) => void;
  setWarnings: (warnings: string[]) => void;
  setIsLoading: (isLoading: boolean) => void;
  setParseStatus: (parseStatus: string | null) => void;
  setError: (error: string | null) => void;
  setPushResult: (pushResult: string | null) => void;
  setActiveWeekIndex: (activeWeekIndex: number) => void;
  initOrganize: (directories: ImportDirectory[], routines: ImportRoutine[]) => void;
  addDirectory: (name: string) => void;
  renameDirectory: (id: string, name: string) => void;
  removeDirectory: (id: string) => void;
  reorderDirectory: (id: string, newIndex: number) => void;
  renameRoutine: (id: string, name: string) => void;
  moveRoutine: (routineId: string, target: RoutineMoveTarget) => void;
  setExistingFolders: (folders: ExistingFolder[]) => void;
  attachToExistingFolder: (existingFolder: ExistingFolder) => void;
  setRoutineStatus: (id: string, status: SubmitStatus) => void;
  setDirectoryHevyId: (id: string, hevyFolderId: number) => void;
  resetSubmitStatuses: () => void;
  reset: () => void;
};

function getInitialState(): UploadStateValues {
  return {
    step: "upload",
    file: null,
    rawRows: [],
    parsedProgram: null,
    warnings: [],
    isLoading: false,
    parseStatus: null,
    error: null,
    pushResult: null,
    activeWeekIndex: 0,
    directories: [],
    routines: [],
    existingFolders: [],
    existingFoldersLoaded: false,
  };
}

function cloneProgram(program: ParsedProgram): ParsedProgram {
  return JSON.parse(JSON.stringify(program)) as ParsedProgram;
}

function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `id-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

export const useUploadStore = create<UploadStore>((set) => ({
  ...getInitialState(),

  selectFile: (file) =>
    set({
      ...getInitialState(),
      file,
      step: "preview",
    }),
  setStep: (step) => set({ step }),
  setRawRows: (rawRows) => set({ rawRows }),
  setParsedProgram: (program) => set({ parsedProgram: program, activeWeekIndex: 0 }),
  updateParsedProgram: (mutator) =>
    set((state) => {
      if (!state.parsedProgram) return {};
      const next = cloneProgram(state.parsedProgram);
      mutator(next);
      return { parsedProgram: next };
    }),
  setWarnings: (warnings) => set({ warnings }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setParseStatus: (parseStatus) => set({ parseStatus }),
  setError: (error) => set({ error }),
  setPushResult: (pushResult) => set({ pushResult }),
  setActiveWeekIndex: (activeWeekIndex) => set({ activeWeekIndex }),

  initOrganize: (directories, routines) =>
    set({
      directories,
      routines,
      pushResult: null,
      error: null,
    }),

  addDirectory: (name) =>
    set((state) => ({
      directories: [
        ...state.directories,
        {
          id: newId(),
          name: name.trim() || "Untitled directory",
          source: "manual",
          hevyFolderId: null,
        },
      ],
    })),

  renameDirectory: (id, name) =>
    set((state) => ({
      directories: state.directories.map((dir) =>
        dir.id === id ? { ...dir, name } : dir,
      ),
    })),

  removeDirectory: (id) =>
    set((state) => ({
      directories: state.directories.filter((dir) => dir.id !== id),
      routines: state.routines.map((routine) =>
        routine.directoryId === id ? { ...routine, directoryId: null } : routine,
      ),
    })),

  reorderDirectory: (id, newIndex) =>
    set((state) => {
      const currentIndex = state.directories.findIndex((dir) => dir.id === id);
      if (currentIndex === -1) return {};
      const next = state.directories.slice();
      const [moved] = next.splice(currentIndex, 1);
      const clamped = Math.max(0, Math.min(newIndex, next.length));
      next.splice(clamped, 0, moved);
      return { directories: next };
    }),

  renameRoutine: (id, name) =>
    set((state) => ({
      routines: state.routines.map((routine) =>
        routine.id === id
          ? {
              ...routine,
              name,
              payload: { ...routine.payload, title: name },
            }
          : routine,
      ),
    })),

  moveRoutine: (routineId, target) =>
    set((state) => {
      const sourceIndex = state.routines.findIndex((r) => r.id === routineId);
      if (sourceIndex === -1) return {};
      const next = state.routines.slice();
      const [moving] = next.splice(sourceIndex, 1);

      if (target.type === "before") {
        if (target.routineId === routineId) {
          next.splice(sourceIndex, 0, moving);
          return { routines: next };
        }
        const targetIndex = next.findIndex((r) => r.id === target.routineId);
        if (targetIndex === -1) {
          next.push(moving);
        } else {
          const updated = { ...moving, directoryId: next[targetIndex].directoryId };
          next.splice(targetIndex, 0, updated);
          return { routines: next };
        }
      } else {
        const updated = { ...moving, directoryId: target.directoryId };
        const lastSiblingIndex = (() => {
          let idx = -1;
          for (let i = 0; i < next.length; i += 1) {
            if (next[i].directoryId === target.directoryId) idx = i;
          }
          return idx;
        })();
        next.splice(lastSiblingIndex + 1, 0, updated);
        return { routines: next };
      }
      return { routines: next };
    }),

  setExistingFolders: (folders) =>
    set({ existingFolders: folders, existingFoldersLoaded: true }),

  attachToExistingFolder: (existingFolder) =>
    set((state) => {
      if (state.directories.some((dir) => dir.hevyFolderId === existingFolder.id)) {
        return {};
      }
      return {
        directories: [
          ...state.directories,
          {
            id: newId(),
            name: existingFolder.title,
            source: "existing",
            hevyFolderId: existingFolder.id,
          },
        ],
      };
    }),

  setRoutineStatus: (id, status) =>
    set((state) => ({
      routines: state.routines.map((routine) =>
        routine.id === id ? { ...routine, status } : routine,
      ),
    })),

  setDirectoryHevyId: (id, hevyFolderId) =>
    set((state) => ({
      directories: state.directories.map((dir) =>
        dir.id === id ? { ...dir, hevyFolderId } : dir,
      ),
    })),

  resetSubmitStatuses: () =>
    set((state) => ({
      routines: state.routines.map((routine) => ({
        ...routine,
        status: { kind: "pending" } as SubmitStatus,
      })),
    })),

  reset: () => set(getInitialState()),
}));
