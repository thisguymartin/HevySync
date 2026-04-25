import { Hono } from "hono";
import * as hevy from "./hevyClient.js";
import { getHevyApiBase, getHevyApiKey } from "../../shared/env.js";
import type { Bindings } from "../../shared/types.js";

const app = new Hono<{ Bindings: Bindings }>();

function getConfig(c: { env: Bindings }) {
  return {
    apiKey: getHevyApiKey(c.env),
    baseUrl: getHevyApiBase(c.env),
  };
}

app.get("/user", async (c) => {
  const { baseUrl, apiKey } = getConfig(c);
  const data = await hevy.getUserInfo(baseUrl, apiKey);
  return c.json(data);
});

app.get("/exercises", async (c) => {
  const { baseUrl, apiKey } = getConfig(c);
  const page = Number(c.req.query("page") || "1");
  const pageSize = Number(c.req.query("pageSize") || "100");
  const data = await hevy.getExerciseTemplates(baseUrl, apiKey, page, pageSize);
  return c.json(data);
});

app.get("/exercises/all", async (c) => {
  const { baseUrl, apiKey } = getConfig(c);
  const templates = await hevy.getAllExerciseTemplates(baseUrl, apiKey);
  return c.json({ exercise_templates: templates });
});

app.post("/exercises/custom", async (c) => {
  const { baseUrl, apiKey } = getConfig(c);
  const body = await c.req.json<{ exercise: hevy.CustomExerciseInput }>();
  const data = await hevy.createCustomExercise(baseUrl, apiKey, body.exercise);
  return c.json(data, 201);
});

app.get("/workouts", async (c) => {
  const { baseUrl, apiKey } = getConfig(c);
  const page = Number(c.req.query("page") || "1");
  const pageSize = Number(c.req.query("pageSize") || "10");
  const data = await hevy.listWorkouts(baseUrl, apiKey, page, pageSize);
  return c.json(data);
});

app.get("/workouts/events", async (c) => {
  const { baseUrl, apiKey } = getConfig(c);
  const since = c.req.query("since") || "1970-01-01T00:00:00Z";
  const page = Number(c.req.query("page") || "1");
  const pageSize = Number(c.req.query("pageSize") || "10");
  const data = await hevy.getWorkoutEvents(baseUrl, apiKey, since, page, pageSize);
  return c.json(data);
});

app.get("/workouts/:id", async (c) => {
  const { baseUrl, apiKey } = getConfig(c);
  const data = await hevy.getWorkout(baseUrl, apiKey, c.req.param("id"));
  return c.json(data);
});

app.post("/workouts", async (c) => {
  const { baseUrl, apiKey } = getConfig(c);
  const body = await c.req.json<{ workout: hevy.HevyWorkoutInput }>();
  const data = await hevy.createWorkout(baseUrl, apiKey, body.workout);
  return c.json(data, 201);
});

app.put("/workouts/:id", async (c) => {
  const { baseUrl, apiKey } = getConfig(c);
  const body = await c.req.json<{ workout: hevy.HevyWorkoutInput }>();
  const data = await hevy.updateWorkout(baseUrl, apiKey, c.req.param("id"), body.workout);
  return c.json(data);
});

app.get("/routines", async (c) => {
  const { baseUrl, apiKey } = getConfig(c);
  const page = Number(c.req.query("page") || "1");
  const pageSize = Number(c.req.query("pageSize") || "10");
  const data = await hevy.listRoutines(baseUrl, apiKey, page, pageSize);
  return c.json(data);
});

app.get("/routines/:id", async (c) => {
  const { baseUrl, apiKey } = getConfig(c);
  const data = await hevy.getRoutine(baseUrl, apiKey, c.req.param("id"));
  return c.json(data);
});

app.post("/routines", async (c) => {
  const { baseUrl, apiKey } = getConfig(c);
  const body = await c.req.json<{ routine: hevy.HevyRoutineCreateInput }>();
  const data = await hevy.createRoutine(baseUrl, apiKey, body.routine);
  return c.json(data, 201);
});

app.put("/routines/:id", async (c) => {
  const { baseUrl, apiKey } = getConfig(c);
  const body = await c.req.json<{ routine: hevy.HevyRoutineUpdateInput }>();
  const data = await hevy.updateRoutine(baseUrl, apiKey, c.req.param("id"), body.routine);
  return c.json(data);
});

app.get("/routine-folders", async (c) => {
  const { baseUrl, apiKey } = getConfig(c);
  const page = Number(c.req.query("page") || "1");
  const pageSize = Number(c.req.query("pageSize") || "10");
  const data = await hevy.listRoutineFolders(baseUrl, apiKey, page, pageSize);
  return c.json(data);
});

app.post("/routine-folders", async (c) => {
  const { baseUrl, apiKey } = getConfig(c);
  const body = await c.req.json<{ title: string }>();
  const data = await hevy.createRoutineFolder(baseUrl, apiKey, body.title);
  return c.json(data, 201);
});

export { app as hevyRoute };
