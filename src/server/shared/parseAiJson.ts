export function parseAiJsonResponse<T = Record<string, unknown>>(
  rawText: string
): T {
  let jsonText = rawText.trim();

  // Strip markdown code fences (```json ... ``` or ``` ... ```)
  const fenceMatch = jsonText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fenceMatch) {
    jsonText = fenceMatch[1].trim();
  }

  // If it still doesn't start with { or [, try to find the first JSON object/array
  if (!jsonText.startsWith("{") && !jsonText.startsWith("[")) {
    const objStart = jsonText.indexOf("{");
    const arrStart = jsonText.indexOf("[");
    const start =
      objStart === -1
        ? arrStart
        : arrStart === -1
          ? objStart
          : Math.min(objStart, arrStart);
    if (start !== -1) {
      jsonText = jsonText.slice(start);
    }
  }

  // Trim any trailing text after the JSON closes
  if (jsonText.startsWith("{") || jsonText.startsWith("[")) {
    const closingChar = jsonText.startsWith("{") ? "}" : "]";
    let depth = 0;
    let inString = false;
    let escaped = false;
    let foundEnd = false;
    for (let i = 0; i < jsonText.length; i++) {
      const ch = jsonText[i];
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === "\\") {
        escaped = true;
        continue;
      }
      if (ch === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;
      if (ch === "{" || ch === "[") depth++;
      if (ch === "}" || ch === "]") {
        depth--;
        if (depth === 0 && ch === closingChar) {
          jsonText = jsonText.slice(0, i + 1);
          foundEnd = true;
          break;
        }
      }
    }

    if (!foundEnd && depth > 0) {
      throw new Error(
        `AI response was truncated — JSON incomplete (unclosed brackets: ${depth}). Try reducing the spreadsheet size.`
      );
    }
  }

  // Strip trailing commas before } or ] (common LLM output issue)
  jsonText = jsonText.replace(/,\s*([}\]])/g, "$1");

  return JSON.parse(jsonText) as T;
}
