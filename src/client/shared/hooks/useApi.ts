import { useCallback } from "react";

export function useApi() {
  const apiFetch = useCallback(async <T>(path: string, options: RequestInit = {}): Promise<T> => {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(path, { ...options, headers });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error((body as { error?: string }).error || `API error: ${res.status}`);
    }

    return res.json() as Promise<T>;
  }, []);

  return { apiFetch };
}
