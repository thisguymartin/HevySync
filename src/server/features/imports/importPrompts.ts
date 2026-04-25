import type { NormalizedWorkbook } from "./importTypes.js";

export const IMPORT_SYSTEM_PROMPT = `You are a workout program parser for Hevy imports.

You receive a deterministic extraction from a spreadsheet. Preserve the week, block, exercise, weight, reps, sets, and note data. Clean obvious spelling/casing issues only when the exercise identity is clear. Do not invent exercises, weeks, or sets.

Return only JSON that matches the provided schema.`;

export function buildImportUserPrompt(workbook: NormalizedWorkbook): string {
  return `Normalize this extracted workbook into a Hevy import draft.

Rules:
- Keep weights exactly as written in "weight"; do not convert units in your response.
- Keep percentage loads like "70%" in "weight".
- Keep reps as written, including ranges like "8-12".
- Keep sets as written.
- Put long block-level coaching text in block notes.
- Use sourceSheet from the extracted week.

Extracted workbook:
${JSON.stringify(workbook)}`;
}

const parsedExerciseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: { type: "string" },
    weight: { type: "string" },
    reps: { type: "string" },
    sets: { type: "string" },
    notes: { type: "string" },
    isSuperset: { type: "boolean" },
    supersetGroup: { type: ["number", "null"] },
    restSeconds: { type: ["number", "null"] },
  },
  required: [
    "name",
    "weight",
    "reps",
    "sets",
    "notes",
    "isSuperset",
    "supersetGroup",
    "restSeconds",
  ],
};

const parsedBlockSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    blockNumber: { type: "number" },
    blockName: { type: "string" },
    notes: { type: "string" },
    exercises: {
      type: "array",
      items: parsedExerciseSchema,
    },
  },
  required: ["blockNumber", "blockName", "notes", "exercises"],
};

const parsedWeekSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    weekNumber: { type: "number" },
    sourceSheet: { type: "string" },
    blocks: {
      type: "array",
      items: parsedBlockSchema,
    },
  },
  required: ["weekNumber", "sourceSheet", "blocks"],
};

export const IMPORT_RESPONSE_SCHEMA = {
  name: "hevy_import_program",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      programName: { type: "string" },
      sourceFileName: { type: "string" },
      weeks: {
        type: "array",
        items: parsedWeekSchema,
      },
      warnings: {
        type: "array",
        items: { type: "string" },
      },
    },
    required: ["programName", "sourceFileName", "weeks", "warnings"],
  },
};
