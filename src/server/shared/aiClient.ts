import { parseAiJsonResponse } from "./parseAiJson.js";

const AI_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast" as const;

export async function runAiJsonCompletion(
  ai: Ai,
  systemPrompt: string,
  userPrompt: string,
  options?: { maxTokens?: number; temperature?: number },
): Promise<Record<string, unknown>> {
  const result = await ai.run(AI_MODEL, {
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    max_tokens: options?.maxTokens ?? 16384,
    temperature: options?.temperature ?? 0.2,
  });

  if (typeof result === "string") {
    return parseAiJsonResponse(result);
  }

  if (!result || typeof result !== "object" || !("response" in result) || !result.response) {
    throw new Error("AI returned no valid response");
  }

  const responseText = typeof result.response === "string" 
    ? result.response 
    : JSON.stringify(result.response);

  return parseAiJsonResponse(responseText);
}
