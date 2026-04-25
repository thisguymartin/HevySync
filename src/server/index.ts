import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { hevyRoute } from "./features/hevy/hevyRoute.js";
import { parseRoute } from "./features/parse/parseRoute.js";
import { generatorRoute } from "./features/generator/generatorRoute.js";
import { importsRoute } from "./features/imports/importsRoute.js";
import { HevyApiError } from "./features/hevy/hevyClient.js";
import { getSetupStatus } from "./shared/env.js";
import type { Bindings } from "./shared/types.js";

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", logger());
app.use("/api/*", cors());

// Error handler
app.onError((err, c) => {
  console.error("Server error:", err);
  const status = err instanceof HevyApiError ? err.status : 500;
  return c.json(
    {
      error: err.message || "Internal server error",
      ...(err instanceof HevyApiError && { status: err.status }),
    },
    status as Parameters<typeof c.json>[1]
  );
});

// Health check
app.get("/api/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));
app.get("/api/setup", (c) => c.json(getSetupStatus(c.env)));

// Mount feature routes
app.route("/api/hevy", hevyRoute);
app.route("/api/imports", importsRoute);
app.route("/api/parse", parseRoute);
app.route("/api/generate", generatorRoute);

export default app;
