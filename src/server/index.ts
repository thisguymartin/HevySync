import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { hevyRoute } from "./features/hevy/hevyRoute.js";
import { parseRoute } from "./features/parse/parseRoute.js";
import { generatorRoute } from "./features/generator/generatorRoute.js";

type Bindings = {
  ANTHROPIC_API_KEY: string;
  HEVY_API_BASE: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", logger());
app.use("/api/*", cors());

// Error handler
app.onError((err, c) => {
  console.error("Server error:", err);
  return c.json(
    {
      error: err.message || "Internal server error",
      ...(err.name === "HevyApiError" && {
        status: (err as unknown as { status: number }).status,
      }),
    },
    500
  );
});

// Health check
app.get("/api/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));

// Mount feature routes
app.route("/api/hevy", hevyRoute);
app.route("/api/parse", parseRoute);
app.route("/api/generate", generatorRoute);

export default app;
