import { useEffect, useState } from "react";
import type { ReactNode } from "react";

interface RequireHevyKeyProps {
  noun: string;
  children: ReactNode;
}

export function RequireHevyKey({ noun, children }: RequireHevyKeyProps) {
  const [hevyConfigured, setHevyConfigured] = useState(true);

  useEffect(() => {
    let ignore = false;
    fetch("/api/setup")
      .then((res) => res.json())
      .then((data: { hevyConfigured?: boolean }) => {
        if (!ignore) setHevyConfigured(Boolean(data.hevyConfigured));
      })
      .catch(() => {
        if (!ignore) setHevyConfigured(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  if (!hevyConfigured) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">
          Add the Hevy API secret in{" "}
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
