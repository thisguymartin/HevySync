import { Hono } from "hono";
import * as hevy from "./hevyClient.js";
import type { Bindings } from "../../shared/types.js";

const app = new Hono<{ Bindings: Bindings }>();

function getApiKey(c: { req: { header: (name: string) => string | undefined } }): string {
  const key = c.req.header("x-hevy-api-key");
  if (!key) throw new Error("Missing x-hevy-api-key header");
  return key;
}

// ── Exercise Templates ──

app.get("/exercises", async (c) => {
  const apiKey = getApiKey(c);
  const page = Number(c.req.query("page") || "1");
  const data = await hevy.getExerciseTemplates(c.env.HEVY_API_BASE, apiKey, page);
  return c.json(data);
});

app.get("/exercises/all", async (c) => {
  const apiKey = getApiKey(c);
  const templates = await hevy.getAllExerciseTemplates(c.env.HEVY_API_BASE, apiKey);
  return c.json({ exercise_templates: templates });
});

// ── Workouts ──

app.get("/workouts", async (c) => {
  const apiKey = getApiKey(c);
  const page = Number(c.req.query("page") || "1");
  const pageSize = Number(c.req.query("pageSize") || "10");
  const data = await hevy.listWorkouts(c.env.HEVY_API_BASE, apiKey, page, pageSize);
  return c.json(data);
});

app.get("/workouts/:id", async (c) => {
  const apiKey = getApiKey(c);
  const data = await hevy.getWorkout(c.env.HEVY_API_BASE, apiKey, c.req.param("id"));
  return c.json(data);
});

app.post("/workouts", async (c) => {
  const apiKey = getApiKey(c);
  const body = await c.req.json();
  const data = await hevy.createWorkout(c.env.HEVY_API_BASE, apiKey, body.workout);
  return c.json(data, 201);
});

// ── Routines ──

app.get("/routines", async (c) => {
  const apiKey = getApiKey(c);
  const page = Number(c.req.query("page") || "1");
  const pageSize = Number(c.req.query("pageSize") || "10");
  const data = await hevy.listRoutines(c.env.HEVY_API_BASE, apiKey, page, pageSize);
  return c.json(data);
});

app.get("/routines/:id", async (c) => {
  const apiKey = getApiKey(c);
  const data = await hevy.getRoutine(c.env.HEVY_API_BASE, apiKey, c.req.param("id"));
  return c.json(data);
});

app.post("/routines", async (c) => {
  const apiKey = getApiKey(c);
  const body = await c.req.json();
  const data = await hevy.createRoutine(c.env.HEVY_API_BASE, apiKey, body.routine);
  return c.json(data, 201);
});

app.put("/routines/:id", async (c) => {
  const apiKey = getApiKey(c);
  const body = await c.req.json();
  const data = await hevy.updateRoutine(c.env.HEVY_API_BASE, apiKey, c.req.param("id"), body.routine);
  return c.json(data);
});

// ── Routine Folders ──

app.get("/routine-folders", async (c) => {
  const apiKey = getApiKey(c);
  const data = await hevy.listRoutineFolders(c.env.HEVY_API_BASE, apiKey);
  return c.json(data);
});

app.post("/routine-folders", async (c) => {
  const apiKey = getApiKey(c);
  const body = await c.req.json();
  const data = await hevy.createRoutineFolder(c.env.HEVY_API_BASE, apiKey, body.title);
  return c.json(data, 201);
});

export { app as hevyRoute };
