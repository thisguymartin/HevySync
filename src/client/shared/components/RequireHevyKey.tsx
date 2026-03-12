import { useAppStore } from "@/shared/stores/appStore.js";
import type { ReactNode } from "react";

interface RequireHevyKeyProps {
  noun: string;
  children: ReactNode;
}

export function RequireHevyKey({ noun, children }: RequireHevyKeyProps) {
  const hevyApiKey = useAppStore((s) => s.hevyApiKey);

  if (!hevyApiKey) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">
          Add your Hevy API key in{" "}
          <a href="/settings" className="text-blue-600 underline">
            Settings
          </a>{" "}
          to view {noun}.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
