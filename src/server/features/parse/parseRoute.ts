import { Hono } from "hono";
import { PARSE_SYSTEM_PROMPT, buildParseUserPrompt } from "./aiPrompts.js";
import { matchExercise } from "../hevy/exerciseMatcher.js";
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

const LEGACY_PARSE_SCHEMA = {
  name: "legacy_parsed_program",
  strict: false,
  schema: {
    type: "object",
    additionalProperties: true,
    properties: {
      programName: { type: "string" },
      weeks: { type: "array" },
      warnings: { type: "array", items: { type: "string" } },
    },
  },
};

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
    parsed = await runOpenAiJsonCompletion({
      apiKey: getOpenAiApiKey(c.env),
      model: getOpenAiModel(c.env),
      systemPrompt: PARSE_SYSTEM_PROMPT,
      userPrompt: buildParseUserPrompt(rows),
      schema: LEGACY_PARSE_SCHEMA,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI parsing failed";
    return c.json({ error: message }, 500);
  }

  try {
    const templates = await getAllExerciseTemplates(getHevyApiBase(c.env), getHevyApiKey(c.env));
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
    // Non-fatal: exercise matching is optional for the legacy endpoint.
  }

  return c.json({
    program: parsed,
    fileName,
    warnings: (parsed as { warnings?: string[] }).warnings || [],
  });
});

export { app as parseRoute };
