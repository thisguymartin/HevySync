import { useCallback } from "react";
import { useAppStore } from "../stores/appStore.js";

export function useApi() {
  const hevyApiKey = useAppStore((s) => s.hevyApiKey);

  const apiFetch = useCallback(
    async <T>(path: string, options: RequestInit = {}): Promise<T> => {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
      };

      if (hevyApiKey) {
        headers["x-hevy-api-key"] = hevyApiKey;
      }

      const res = await fetch(path, { ...options, headers });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(
          (body as { error?: string }).error || `API error: ${res.status}`
        );
      }

      return res.json() as Promise<T>;
    },
    [hevyApiKey]
  );

  return { apiFetch, hevyApiKey };
}
