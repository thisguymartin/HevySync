import { useEffect, useState } from "react";
import { useAppStore } from "@/shared/stores/appStore.js";

type SetupStatus = {
  hevyConfigured: boolean;
  openAiConfigured: boolean;
  hevyApiBase: string;
  openAiModel: string;
};

type UserInfo = {
  data?: {
    name: string;
    url: string;
  };
};

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        ok
          ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
          : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
      }`}
    >
      {label}
    </span>
  );
}

export function ApiKeyForm() {
  const { darkMode, toggleDarkMode } = useAppStore();
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const setup = (await fetch("/api/setup").then((res) => res.json())) as SetupStatus;
        if (ignore) return;
        setStatus(setup);

        if (setup.hevyConfigured) {
          const profile = (await fetch("/api/hevy/user").then((res) => {
            if (!res.ok) throw new Error("Unable to validate Hevy API key");
            return res.json();
          })) as UserInfo;
          if (!ignore) setUser(profile);
        }
      } catch (err) {
        if (!ignore) setError(err instanceof Error ? err.message : "Unable to load setup");
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 space-y-4">
        <div>
          <h3 className="font-medium">Server Secrets</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Hevy and OpenAI keys are read on the server from dotenvx locally and
            Wrangler secrets in production.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">Hevy API</p>
              <StatusPill ok={Boolean(status?.hevyConfigured)} label={status?.hevyConfigured ? "Ready" : "Missing"} />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {user?.data?.name
                ? `${user.data.name}${user.data.url ? ` - ${user.data.url}` : ""}`
                : status?.hevyApiBase || "https://api.hevyapp.com"}
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">OpenAI</p>
              <StatusPill ok={Boolean(status?.openAiConfigured)} label={status?.openAiConfigured ? "Ready" : "Missing"} />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Model: {status?.openAiModel || "gpt-5-mini"}
            </p>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <div className="rounded-lg bg-gray-50 dark:bg-gray-950 p-3 text-xs text-gray-600 dark:text-gray-400">
          Local: <span className="font-mono">dotenvx run -- npm run dev</span>
          <br />
          Production: set <span className="font-mono">HEVY_API_KEY</span> and{" "}
          <span className="font-mono">OPENAI_API_KEY</span> as Cloudflare secrets.
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Dark Mode</h3>
            <p className="text-sm text-gray-500 mt-0.5">Toggle dark theme</p>
          </div>
          <button
            onClick={toggleDarkMode}
            className={`relative h-6 w-12 rounded-full transition-colors ${
              darkMode ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                darkMode ? "translate-x-6" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
        <h3 className="font-medium">About HevySync</h3>
        <p className="text-sm text-gray-500 mt-1">
          Upload workout spreadsheets, review the parsed draft, edit routines,
          and push them to Hevy through the public API.
        </p>
        <p className="text-xs text-gray-400 mt-2">v0.1.0</p>
      </div>
    </div>
  );
}
