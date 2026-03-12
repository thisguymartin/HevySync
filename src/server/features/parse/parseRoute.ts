import { Hono } from "hono";
import { PARSE_SYSTEM_PROMPT, buildParseUserPrompt } from "./aiPrompts.js";
import { matchExercise } from "../hevy/exerciseMatcher.js";
import { getAllExerciseTemplates } from "../hevy/hevyClient.js";
import { runAiJsonCompletion } from "../../shared/aiClient.js";
import type { Bindings } from "../../shared/types.js";

const app = new Hono<{ Bindings: Bindings }>();

app.post("/", async (c) => {
  const { rows, fileName } = await c.req.json<{
    rows: string[][];
    fileName: string;
  }>();

  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return c.json({ error: "No spreadsheet data provided" }, 400);
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = await runAiJsonCompletion(
      c.env.AI,
      PARSE_SYSTEM_PROMPT,
      buildParseUserPrompt(rows),
      { maxTokens: 16384 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI parsing failed";
    return c.json({ error: message }, 500);
  }

  // Try to match exercises to Hevy templates if API key provided
  const hevyApiKey = c.req.header("x-hevy-api-key");
  if (hevyApiKey) {
    try {
      const templates = await getAllExerciseTemplates(c.env.HEVY_API_BASE, hevyApiKey);
      const program = parsed as {
        weeks?: Array<{
          blocks?: Array<{
            exercises?: Array<{
              name?: string;
              matchedTemplate?: unknown;
              matchConfidence?: number;
              alternatives?: unknown[];
            }>;
          }>;
        }>;
      };

      if (program.weeks) {
        for (const week of program.weeks) {
          if (!week.blocks) continue;
          for (const block of week.blocks) {
            if (!block.exercises) continue;
            for (const exercise of block.exercises) {
              if (!exercise.name) continue;
              const match = matchExercise(exercise.name, templates);
              exercise.matchedTemplate = match.matchedTemplate;
              exercise.matchConfidence = match.confidence;
              exercise.alternatives = match.alternatives;
            }
          }
        }
      }
    } catch {
      // Non-fatal: exercise matching is optional
    }
  }

  return c.json({
    program: parsed,
    fileName,
    warnings: (parsed as { warnings?: string[] }).warnings || [],
  });
});

export { app as parseRoute };
