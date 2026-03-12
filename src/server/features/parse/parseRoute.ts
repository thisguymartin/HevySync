import { Hono } from "hono";
import { PARSE_SYSTEM_PROMPT, buildParseUserPrompt } from "./aiPrompts.js";
import { matchExercise } from "../hevy/exerciseMatcher.js";
import { getAllExerciseTemplates } from "../hevy/hevyClient.js";

type Bindings = {
  ANTHROPIC_API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

async function callClaude(
  apiKey: string,
  system: string,
  userMessage: string
): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      system,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${body}`);
  }

  const data = (await res.json()) as {
    content: Array<{ type: string; text: string }>;
  };
  const textBlock = data.content.find((b) => b.type === "text");
  if (!textBlock) throw new Error("No text in AI response");
  return textBlock.text;
}

app.post("/", async (c) => {
  const { rows, fileName } = await c.req.json<{
    rows: string[][];
    fileName: string;
  }>();

  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return c.json({ error: "No spreadsheet data provided" }, 400);
  }

  const apiKey = c.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "your-key-here") {
    return c.json({ error: "ANTHROPIC_API_KEY not configured" }, 500);
  }

  const rawText = await callClaude(
    apiKey,
    PARSE_SYSTEM_PROMPT,
    buildParseUserPrompt(rows)
  );

  let parsed: Record<string, unknown>;
  try {
    let jsonText = rawText.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }
    parsed = JSON.parse(jsonText);
  } catch {
    return c.json(
      { error: "Failed to parse AI response as JSON", raw: rawText },
      500
    );
  }

  // Try to match exercises to Hevy templates if API key provided
  const hevyApiKey = c.req.header("x-hevy-api-key");
  if (hevyApiKey) {
    try {
      const templates = await getAllExerciseTemplates(hevyApiKey);
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
