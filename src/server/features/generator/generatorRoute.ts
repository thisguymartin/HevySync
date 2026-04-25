import { Hono } from "hono";
import {
  GENERATE_SYSTEM_PROMPT,
  buildGenerateUserPrompt,
} from "../parse/aiPrompts.js";
import { getAllExerciseTemplates } from "../hevy/hevyClient.js";
import {
  getHevyApiBase,
  getHevyApiKey,
  getOpenAiApiKey,
  getOpenAiModel,
} from "../../shared/env.js";
import { runOpenAiJsonCompletion } from "../../shared/openAiClient.js";
import type { Bindings } from "../../shared/types.js";

const app = new Hono<{ Bindings: Bindings }>();

const GENERATE_SCHEMA = {
  name: "generated_hevy_program",
  strict: false,
  schema: {
    type: "object",
    additionalProperties: true,
    properties: {
      routines: { type: "array" },
    },
  },
};

app.post("/", async (c) => {
  const body = await c.req.json<{
    goal: string;
    split: string;
    daysPerWeek: number;
    experience: string;
    equipment: string[];
    sessionDuration: number;
    notes: string;
  }>();

  let templates: { id: string; title: string; type: string; primary_muscle_group: string }[] = [];

  try {
    templates = await getAllExerciseTemplates(getHevyApiBase(c.env), getHevyApiKey(c.env));
  } catch {
    // Continue without templates; the route will still return a draft.
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = await runOpenAiJsonCompletion({
      apiKey: getOpenAiApiKey(c.env),
      model: getOpenAiModel(c.env),
      systemPrompt: GENERATE_SYSTEM_PROMPT,
      userPrompt: buildGenerateUserPrompt(body, templates),
      schema: GENERATE_SCHEMA,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI generation failed";
    return c.json({ error: message }, 500);
  }

  return c.json(parsed);
});

export { app as generatorRoute };
