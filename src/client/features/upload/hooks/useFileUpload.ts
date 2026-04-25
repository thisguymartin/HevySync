import { useCallback } from "react";
import { useApi } from "@/shared/hooks/useApi.js";
import type { ParsedProgram } from "@/shared/types/index.js";
import { useUploadStore } from "../stores/uploadStore.js";
import { buildOrganizeState } from "../lib/buildOrganizeState.js";

const SUBMIT_GAP_MS = 1000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useFileUpload() {
  const { apiFetch } = useApi();
  const {
    step,
    file,
    rawRows,
    parsedProgram,
    warnings,
    isLoading,
    parseStatus,
    error,
    pushResult,
    selectFile,
    setStep,
    setParsedProgram,
    setWarnings,
    setIsLoading,
    setParseStatus,
    setError,
    setPushResult,
    reset,
  } = useUploadStore();

  const parseFile = useCallback(async (f: File) => {
    selectFile(f);
  }, [selectFile]);

  const sendToParse = useCallback(async () => {
    if (!file) return;
    setIsLoading(true);
    setParseStatus("Uploading workbook...");
    setError(null);
    const timers: ReturnType<typeof setTimeout>[] = [
      setTimeout(() => setParseStatus("Reading workbook..."), 700),
      setTimeout(() => setParseStatus("Matching exercises..."), 2500),
    ];

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await apiFetch<{
        program: ParsedProgram;
        warnings: string[];
      }>("/api/imports/parse", {
        method: "POST",
        body: formData,
      });

      setParsedProgram(res.program);
      setWarnings(res.warnings || []);
      setStep("parsed");
    } catch (err) {
      setError(
        `Parsing failed: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      timers.forEach(clearTimeout);
      setIsLoading(false);
      setParseStatus(null);
    }
  }, [
    apiFetch,
    file,
    setError,
    setIsLoading,
    setParsedProgram,
    setParseStatus,
    setStep,
    setWarnings,
  ]);

  const goToOrganize = useCallback(() => {
    const program = useUploadStore.getState().parsedProgram;
    if (!program) return;
    const { directories, routines, unresolvedCount } = buildOrganizeState(program);
    if (unresolvedCount > 0) {
      setError(`${unresolvedCount} exercise match(es) still need a Hevy template.`);
      return;
    }
    setError(null);
    useUploadStore.getState().initOrganize(directories, routines);
    setStep("organize");
  }, [setError, setStep]);

  const submitToHevy = useCallback(async () => {
    const store = useUploadStore.getState();
    if (store.routines.length === 0) return;

    store.resetSubmitStatuses();
    setStep("pushing");
    setError(null);
    setPushResult(null);

    let firstHevyCall = true;
    const dispatchedFolderForDir = new Map<string, number>();

    // Phase 1: create new folders for any directory that needs one.
    for (const directory of useUploadStore.getState().directories) {
      if (directory.source === "existing" || directory.hevyFolderId !== null) {
        if (directory.hevyFolderId !== null) {
          dispatchedFolderForDir.set(directory.id, directory.hevyFolderId);
        }
        continue;
      }
      try {
        if (!firstHevyCall) await sleep(SUBMIT_GAP_MS);
        firstHevyCall = false;
        const created = await apiFetch<{ routine_folder?: { id: number; title: string } }>(
          "/api/hevy/routine-folders",
          {
            method: "POST",
            body: JSON.stringify({ title: directory.name }),
          },
        );
        const folderId = created.routine_folder?.id;
        if (typeof folderId === "number") {
          useUploadStore.getState().setDirectoryHevyId(directory.id, folderId);
          dispatchedFolderForDir.set(directory.id, folderId);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Folder create failed";
        setError(`Failed to create folder "${directory.name}": ${message}`);
      }
    }

    // Phase 2: create routines, each with the resolved folder_id.
    for (const routine of useUploadStore.getState().routines) {
      const folderId = routine.directoryId
        ? dispatchedFolderForDir.get(routine.directoryId) ?? null
        : null;

      useUploadStore.getState().setRoutineStatus(routine.id, { kind: "creating" });
      try {
        if (!firstHevyCall) await sleep(SUBMIT_GAP_MS);
        firstHevyCall = false;
        const created = await apiFetch<{ routine?: { id: string }; id?: string }>(
          "/api/hevy/routines",
          {
            method: "POST",
            body: JSON.stringify({
              routine: {
                ...routine.payload,
                title: routine.name,
                folder_id: folderId,
              },
            }),
          },
        );
        const hevyId = created.routine?.id ?? created.id ?? "";
        useUploadStore.getState().setRoutineStatus(routine.id, {
          kind: "success",
          hevyId,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Push failed";
        useUploadStore.getState().setRoutineStatus(routine.id, {
          kind: "error",
          message,
        });
      }
    }

    const finalRoutines = useUploadStore.getState().routines;
    const succeeded = finalRoutines.filter((r) => r.status.kind === "success").length;
    const failed = finalRoutines.filter((r) => r.status.kind === "error").length;
    setPushResult(
      failed > 0
        ? `Created ${succeeded} of ${finalRoutines.length} routine(s); ${failed} failed.`
        : `Successfully created ${succeeded} routine(s) in Hevy!`,
    );
  }, [apiFetch, setError, setPushResult, setStep]);

  return {
    step,
    file,
    rawRows,
    parsedProgram,
    warnings,
    isLoading,
    parseStatus,
    error,
    pushResult,
    parseFile,
    sendToParse,
    goToOrganize,
    submitToHevy,
    reset,
    setStep,
  };
}
