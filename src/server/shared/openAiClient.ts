import { parseAiJsonResponse } from "./parseAiJson.js";

type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
};

function getResponseText(data: ChatCompletionResponse): string {
  const content = data.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => (part.type === "text" || !part.type ? part.text || "" : ""))
      .join("");
  }
  throw new Error("OpenAI returned no message content");
}

export async function runOpenAiJsonCompletion(params: {
  apiKey: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  schema: JsonSchema;
  signal?: AbortSignal;
}): Promise<Record<string, unknown>> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    signal: params.signal,
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: params.model,
      messages: [
        { role: "system", content: params.systemPrompt },
        { role: "user", content: params.userPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: params.schema.name,
          strict: params.schema.strict ?? true,
          schema: params.schema.schema,
        },
      },
      reasoning_effort: "low",
      verbosity: "low",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${body}`);
  }

  const data = (await res.json()) as ChatCompletionResponse;
  return parseAiJsonResponse(getResponseText(data));
}
