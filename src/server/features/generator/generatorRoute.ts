import { Hono } from "hono";
import Anthropic from "@anthropic-ai/sdk";
import {
  GENERATE_SYSTEM_PROMPT,
  buildGenerateUserPrompt,
} from "../parse/aiPrompts.js";
import { getAllExerciseTemplates } from "../hevy/hevyClient.js";

type Bindings = {
  ANTHROPIC_API_KEY: string;
};

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

  const apiKey = c.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "your-key-here") {
    return c.json({ error: "ANTHROPIC_API_KEY not configured" }, 500);
  }

  // Fetch exercise templates for the AI to use
  const hevyApiKey = c.req.header("x-hevy-api-key");
  let templates: { id: string; title: string; type: string; primary_muscle_group: string }[] = [];

  if (hevyApiKey) {
    try {
      templates = await getAllExerciseTemplates(hevyApiKey);
    } catch {
      // Continue without templates — AI will use generic exercise names
    }
  }

  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    system: GENERATE_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: buildGenerateUserPrompt(body, templates),
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return c.json({ error: "AI returned no text response" }, 500);
  }

  let parsed: Record<string, unknown>;
  try {
    let jsonText = textBlock.text.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }
    parsed = JSON.parse(jsonText);
  } catch {
    return c.json(
      { error: "Failed to parse AI response as JSON", raw: textBlock.text },
      500
    );
  }

  return c.json(parsed);
});

export { app as generatorRoute };
