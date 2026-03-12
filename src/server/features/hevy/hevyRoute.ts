import { Hono } from "hono";
import * as hevy from "./hevyClient.js";

const app = new Hono();

function getApiKey(c: { req: { header: (name: string) => string | undefined } }): string {
  const key = c.req.header("x-hevy-api-key");
  if (!key) throw new Error("Missing x-hevy-api-key header");
  return key;
}

// ── Exercise Templates ──

app.get("/exercises", async (c) => {
  const apiKey = getApiKey(c);
  const page = Number(c.req.query("page") || "1");
  const data = await hevy.getExerciseTemplates(apiKey, page);
  return c.json(data);
});

app.get("/exercises/all", async (c) => {
  const apiKey = getApiKey(c);
  const templates = await hevy.getAllExerciseTemplates(apiKey);
  return c.json({ exercise_templates: templates });
});

// ── Workouts ──

app.get("/workouts", async (c) => {
  const apiKey = getApiKey(c);
  const page = Number(c.req.query("page") || "1");
  const pageSize = Number(c.req.query("pageSize") || "10");
  const data = await hevy.listWorkouts(apiKey, page, pageSize);
  return c.json(data);
});

app.get("/workouts/:id", async (c) => {
  const apiKey = getApiKey(c);
  const data = await hevy.getWorkout(apiKey, c.req.param("id"));
  return c.json(data);
});

app.post("/workouts", async (c) => {
  const apiKey = getApiKey(c);
  const body = await c.req.json();
  const data = await hevy.createWorkout(apiKey, body.workout);
  return c.json(data, 201);
});

// ── Routines ──

app.get("/routines", async (c) => {
  const apiKey = getApiKey(c);
  const page = Number(c.req.query("page") || "1");
  const pageSize = Number(c.req.query("pageSize") || "10");
  const data = await hevy.listRoutines(apiKey, page, pageSize);
  return c.json(data);
});

app.get("/routines/:id", async (c) => {
  const apiKey = getApiKey(c);
  const data = await hevy.getRoutine(apiKey, c.req.param("id"));
  return c.json(data);
});

app.post("/routines", async (c) => {
  const apiKey = getApiKey(c);
  const body = await c.req.json();
  const data = await hevy.createRoutine(apiKey, body.routine);
  return c.json(data, 201);
});

app.put("/routines/:id", async (c) => {
  const apiKey = getApiKey(c);
  const body = await c.req.json();
  const data = await hevy.updateRoutine(apiKey, c.req.param("id"), body.routine);
  return c.json(data);
});

// ── Routine Folders ──

app.get("/routine-folders", async (c) => {
  const apiKey = getApiKey(c);
  const data = await hevy.listRoutineFolders(apiKey);
  return c.json(data);
});

app.post("/routine-folders", async (c) => {
  const apiKey = getApiKey(c);
  const body = await c.req.json();
  const data = await hevy.createRoutineFolder(apiKey, body.title);
  return c.json(data, 201);
});

export { app as hevyRoute };
