import { Hono } from "hono";
import {
  GENERATE_SYSTEM_PROMPT,
  buildGenerateUserPrompt,
} from "../parse/aiPrompts.js";
import { getAllExerciseTemplates } from "../hevy/hevyClient.js";
import { runAiJsonCompletion } from "../../shared/aiClient.js";
import type { Bindings } from "../../shared/types.js";

const app = new Hono<{ Bindings: Bindings }>();

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

  // Fetch exercise templates for the AI to use
  const hevyApiKey = c.req.header("x-hevy-api-key");
  let templates: { id: string; title: string; type: string; primary_muscle_group: string }[] = [];

  if (hevyApiKey) {
    try {
      templates = await getAllExerciseTemplates(c.env.HEVY_API_BASE, hevyApiKey);
    } catch {
      // Continue without templates — AI will use generic exercise names
    }
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = await runAiJsonCompletion(
      c.env.AI,
      GENERATE_SYSTEM_PROMPT,
      buildGenerateUserPrompt(body, templates),
      { temperature: 0.4 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI generation failed";
    return c.json({ error: message }, 500);
  }

  return c.json(parsed);
});

export { app as generatorRoute };
