import { useEffect } from "react";
import { useApi } from "@/shared/hooks/useApi.js";
import { useUploadStore } from "../stores/uploadStore.js";

type ListRoutineFoldersResponse = {
  page: number;
  page_count: number;
  routine_folders: Array<{ id: number; title: string; index: number }>;
};

export function useHevyFolders() {
  const { apiFetch } = useApi();
  const loaded = useUploadStore((s) => s.existingFoldersLoaded);
  const folders = useUploadStore((s) => s.existingFolders);
  const setExistingFolders = useUploadStore((s) => s.setExistingFolders);

  useEffect(() => {
    if (loaded) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch<ListRoutineFoldersResponse>(
          "/api/hevy/routine-folders?page=1&pageSize=100",
        );
        if (!cancelled) {
          setExistingFolders(
            (res.routine_folders || []).map((folder) => ({
              id: folder.id,
              title: folder.title,
            })),
          );
        }
      } catch {
        if (!cancelled) setExistingFolders([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiFetch, loaded, setExistingFolders]);

  return { folders, loaded };
}
