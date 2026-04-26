import { Hono } from "hono";
import {
  getHevyApiBase,
  getHevyApiKey,
  getOpenAiApiKey,
  getOpenAiModel,
} from "../../shared/env.js";
import { runOpenAiJsonCompletion } from "../../shared/openAiClient.js";
import { getAllExerciseTemplates } from "../hevy/hevyClient.js";
import { normalizeWorkbookFile } from "./workbookNormalizer.js";
import {
  attachExerciseMatches,
  coerceParsedProgram,
  programFromNormalizedWorkbook,
  routinesFromProgram,
} from "./importMapper.js";
import {
  IMPORT_RESPONSE_SCHEMA,
  IMPORT_SYSTEM_PROMPT,
  buildImportUserPrompt,
  buildTextImportUserPrompt,
} from "./importPrompts.js";
import type { Bindings } from "../../shared/types.js";
import type { ParsedProgram } from "./importTypes.js";

const app = new Hono<{ Bindings: Bindings }>();
const OPENAI_IMPORT_TIMEOUT_MS = 10_000;
const EXERCISE_TEMPLATE_CACHE_MS = 5 * 60 * 1000;
const TEXT_IMPORT_MAX_CHARS = 50_000;

type ExerciseTemplate = Awaited<ReturnType<typeof getAllExerciseTemplates>>[number];

let exerciseTemplateCache:
  | { baseUrl: string; expiresAt: number; templates: ExerciseTemplate[] }
  | null = null;

function getOptionalOpenAiKey(env: Bindings): string | null {
  try {
    return getOpenAiApiKey(env);
  } catch {
    return null;
  }
}

function isTruthy(value: unknown): boolean {
  if (typeof value !== "string") return false;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function shouldUseAi(url: string, formData: FormData): boolean {
  const params = new URL(url).searchParams;
  return (
    isTruthy(params.get("ai")) ||
    isTruthy(params.get("useAi")) ||
    isTruthy(formData.get("ai")) ||
    isTruthy(formData.get("useAi"))
  );
}

function logParseStage(stage: string, startedAt: number, details = {}) {
  console.log("[imports/parse]", {
    stage,
    elapsedMs: Date.now() - startedAt,
    ...details,
  });
}

async function withTimeout<T>(
  timeoutMs: number,
  run: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await run(controller.signal);
  } catch (err) {
    if (controller.signal.aborted) {
      throw new Error(`OpenAI parsing timed out after ${timeoutMs / 1000}s`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

async function getCachedExerciseTemplates(baseUrl: string, apiKey: string) {
  const now = Date.now();
  if (
    exerciseTemplateCache &&
    exerciseTemplateCache.baseUrl === baseUrl &&
    exerciseTemplateCache.expiresAt > now
  ) {
    return exerciseTemplateCache.templates;
  }

  const templates = await getAllExerciseTemplates(baseUrl, apiKey);
  exerciseTemplateCache = {
    baseUrl,
    expiresAt: now + EXERCISE_TEMPLATE_CACHE_MS,
    templates,
  };
  return templates;
}

function buildEmptyTextProgram(programName: string): ParsedProgram {
  return {
    programName: programName || "Pasted Workout Program",
    sourceFileName: "Pasted workout plan",
    weeks: [],
    warnings: [],
  };
}

function hasParsedExercises(program: ParsedProgram): boolean {
  return program.weeks.some((week) =>
    week.blocks.some((block) => block.exercises.length > 0),
  );
}

app.post("/parse", async (c) => {
  const startedAt = Date.now();
  const finishParse = async (
    programDraft: ParsedProgram,
    extraResponseFields: Record<string, unknown> = {},
  ) => {
    let program = programDraft;

    try {
      const templates = await getCachedExerciseTemplates(getHevyApiBase(c.env), getHevyApiKey(c.env));
      program = attachExerciseMatches(program, templates);
      logParseStage("exercise_matching_completed", startedAt, {
        templates: templates.length,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to fetch Hevy exercises";
      program.warnings.push(`Exercise matching unavailable. ${message}`);
      logParseStage("exercise_matching_failed", startedAt, { message });
    }

    const suggestedRoutines = (() => {
      try {
        return routinesFromProgram(program);
      } catch {
        return [];
      }
    })();

    logParseStage("completed", startedAt, {
      routines: suggestedRoutines.length,
      warnings: program.warnings.length,
    });

    return c.json({
      ...extraResponseFields,
      program,
      suggestedRoutines,
      warnings: program.warnings,
    });
  };

  const contentType = c.req.header("content-type") || "";
  if (contentType.includes("application/json")) {
    const body = await c.req.json<{
      source?: string;
      programName?: string;
      text?: string;
    }>().catch(() => null);

    if (body?.source !== "text") {
      return c.json({ error: "Unsupported import source" }, 400);
    }

    const text = typeof body.text === "string" ? body.text.trim() : "";
    const programName = typeof body.programName === "string" ? body.programName.trim() : "";

    if (!text) {
      return c.json({ error: "Paste workout plan text before parsing" }, 400);
    }

    if (text.length > TEXT_IMPORT_MAX_CHARS) {
      return c.json(
        {
          error: `Pasted workout plan is too long. Keep it under ${TEXT_IMPORT_MAX_CHARS.toLocaleString()} characters.`,
        },
        400,
      );
    }

    const openAiApiKey = getOptionalOpenAiKey(c.env);
    if (!openAiApiKey) {
      return c.json(
        { error: "Missing OPENAI_API_KEY secret. Pasted imports require OpenAI parsing." },
        400,
      );
    }

    logParseStage("text_received", startedAt, {
      characters: text.length,
      hasProgramName: Boolean(programName),
    });

    let program: ParsedProgram;
    try {
      const parsed = await withTimeout(OPENAI_IMPORT_TIMEOUT_MS, (signal) =>
        runOpenAiJsonCompletion({
          apiKey: openAiApiKey,
          model: getOpenAiModel(c.env),
          systemPrompt: IMPORT_SYSTEM_PROMPT,
          userPrompt: buildTextImportUserPrompt({ programName, text }),
          schema: IMPORT_RESPONSE_SCHEMA,
          signal,
        }),
      );
      program = coerceParsedProgram(parsed, buildEmptyTextProgram(programName));
      logParseStage("openai_completed", startedAt);
    } catch (err) {
      const message = err instanceof Error ? err.message : "OpenAI parsing failed";
      logParseStage("openai_failed", startedAt, { message });
      return c.json({ error: `Text parsing failed: ${message}` }, 500);
    }

    if (!hasParsedExercises(program)) {
      return c.json(
        { error: "Could not find any routines in the pasted workout plan." },
        422,
      );
    }

    return finishParse(program);
  }

  const formData = await c.req.formData();
  const upload = formData.get("file");
  const useAi = shouldUseAi(c.req.raw.url, formData);

  const file = upload as unknown as {
    name?: string;
    arrayBuffer?: () => Promise<ArrayBuffer>;
  };

  if (!upload || typeof upload === "string" || typeof file.arrayBuffer !== "function") {
    return c.json({ error: "Missing uploaded file" }, 400);
  }

  const fileName = typeof file.name === "string" ? file.name : "workout-upload.xlsx";
  logParseStage("upload_received", startedAt, { fileName, useAi });

  const workbook = await normalizeWorkbookFile(fileName, await file.arrayBuffer());
  let program: ParsedProgram = programFromNormalizedWorkbook(workbook);
  logParseStage("workbook_normalized", startedAt, {
    sheets: workbook.sheets.length,
    weeks: workbook.weeks.length,
  });

  const openAiApiKey = getOptionalOpenAiKey(c.env);
  if (useAi && openAiApiKey) {
    try {
      const parsed = await withTimeout(OPENAI_IMPORT_TIMEOUT_MS, (signal) =>
        runOpenAiJsonCompletion({
          apiKey: openAiApiKey,
          model: getOpenAiModel(c.env),
          systemPrompt: IMPORT_SYSTEM_PROMPT,
          userPrompt: buildImportUserPrompt(workbook),
          schema: IMPORT_RESPONSE_SCHEMA,
          signal,
        }),
      );
      program = coerceParsedProgram(parsed, program);
      logParseStage("openai_completed", startedAt);
    } catch (err) {
      const message = err instanceof Error ? err.message : "OpenAI parsing failed";
      program.warnings.push(`OpenAI parsing failed; used deterministic parser. ${message}`);
      logParseStage("openai_failed", startedAt, { message });
    }
  } else if (useAi) {
    program.warnings.push("OPENAI_API_KEY is not configured; used deterministic parser.");
  }

  return finishParse(program, { workbook });
});

export { app as importsRoute };
