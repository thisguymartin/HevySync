import { matchExercise } from "../hevy/exerciseMatcher.js";
import type { HevyRoutineCreateInput } from "../hevy/hevyClient.js";
import type {
  NormalizedWorkbook,
  ParsedBlock,
  ParsedExercise,
  ParsedProgram,
  ParsedSet,
  ParsedWeek,
} from "./importTypes.js";

type Template = {
  id: string;
  title: string;
  type: string;
  primary_muscle_group: string;
  secondary_muscle_groups?: string[];
  is_custom?: boolean;
};

function parseNumber(value: string): number | null {
  const match = value.match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function poundsToKg(value: number): number {
  return Math.round((value / 2.2046226218) * 2) / 2;
}

function parseWeightKg(value: string): number | null {
  if (!value || value.includes("%")) return null;
  const number = parseNumber(value);
  if (number === null) return null;
  if (/\bkg\b/i.test(value)) return number;
  return poundsToKg(number);
}

function parseReps(value: string): {
  reps: number | null;
  rep_range: { start: number | null; end: number | null } | null;
} {
  const range = value.match(/(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)/);
  if (range) {
    return {
      reps: null,
      rep_range: { start: Number(range[1]), end: Number(range[2]) },
    };
  }

  const reps = parseNumber(value);
  return { reps: reps === null ? null : Math.round(reps), rep_range: null };
}

function parseSetCount(value: string): number {
  const sets = parseNumber(value);
  if (!sets || sets < 1) return 1;
  return Math.min(Math.round(sets), 12);
}

function buildParsedSets(weight: string, repsValue: string, setsValue: string): ParsedSet[] {
  const weight_kg = parseWeightKg(weight);
  const reps = parseReps(repsValue);
  const setCount = parseSetCount(setsValue);

  return Array.from({ length: setCount }, (): ParsedSet => ({
    type: "normal",
    weight_kg,
    reps: reps.reps,
    rep_range: reps.rep_range,
    distance_meters: null,
    duration_seconds: null,
    custom_metric: null,
    rpe: null,
  }));
}

function getSupersetGroup(name: string): number | null {
  const match = name.match(/^([A-Z])\d\b/i);
  if (!match) return null;
  return match[1].toUpperCase().charCodeAt(0) - 64;
}

export function programFromNormalizedWorkbook(workbook: NormalizedWorkbook): ParsedProgram {
  return {
    programName: workbook.programName,
    sourceFileName: workbook.fileName,
    weeks: workbook.weeks.map(
      (week): ParsedWeek => ({
        weekNumber: week.weekNumber,
        sourceSheet: week.sourceSheet,
        blocks: week.blocks.map(
          (block): ParsedBlock => ({
            blockNumber: block.blockNumber,
            blockName: block.blockName,
            notes: block.notes,
            exercises: block.exercises.map((exercise): ParsedExercise => {
              const supersetGroup = getSupersetGroup(exercise.name);
              return {
                name: exercise.name.replace(/^[A-Z]\d\s+/i, ""),
                weight: exercise.weight,
                reps: exercise.reps,
                sets: exercise.sets,
                notes: exercise.notes,
                isSuperset: supersetGroup !== null,
                supersetGroup,
                restSeconds: null,
                parsedSets: buildParsedSets(exercise.weight, exercise.reps, exercise.sets),
                matchedTemplate: null,
                selectedTemplateId: null,
                matchConfidence: 0,
                alternatives: [],
              };
            }),
          }),
        ),
      }),
    ),
    warnings: workbook.warnings,
  };
}

export function coerceParsedProgram(value: Record<string, unknown>, fallback: ParsedProgram) {
  const candidate = value as Partial<ParsedProgram>;
  if (!Array.isArray(candidate.weeks) || candidate.weeks.length === 0) {
    return fallback;
  }

  const weeks = candidate.weeks.map((week, weekIndex): ParsedWeek => {
    const fallbackWeek = fallback.weeks[weekIndex];
    const rawWeek = week as Partial<ParsedWeek>;
    return {
      weekNumber: Number(rawWeek.weekNumber || fallbackWeek?.weekNumber || weekIndex + 1),
      sourceSheet: String(rawWeek.sourceSheet || fallbackWeek?.sourceSheet || ""),
      blocks: Array.isArray(rawWeek.blocks)
        ? rawWeek.blocks.map((block, blockIndex): ParsedBlock => {
            const rawBlock = block as Partial<ParsedBlock>;
            return {
              blockNumber: Number(rawBlock.blockNumber || blockIndex + 1),
              blockName: String(rawBlock.blockName || `Block ${blockIndex + 1}`),
              notes: String(rawBlock.notes || ""),
              exercises: Array.isArray(rawBlock.exercises)
                ? rawBlock.exercises.map((exercise): ParsedExercise => {
                    const raw = exercise as Partial<ParsedExercise>;
                    const name = String(raw.name || "");
                    const weight = String(raw.weight || "");
                    const reps = String(raw.reps || "");
                    const sets = String(raw.sets || "");
                    const supersetGroup =
                      typeof raw.supersetGroup === "number"
                        ? raw.supersetGroup
                        : getSupersetGroup(name);
                    return {
                      name,
                      weight,
                      reps,
                      sets,
                      notes: String(raw.notes || ""),
                      isSuperset: Boolean(raw.isSuperset || supersetGroup !== null),
                      supersetGroup,
                      restSeconds:
                        typeof raw.restSeconds === "number" ? raw.restSeconds : null,
                      parsedSets: buildParsedSets(weight, reps, sets),
                      matchedTemplate: null,
                      selectedTemplateId: null,
                      matchConfidence: 0,
                      alternatives: [],
                    };
                  })
                : [],
            };
          })
        : [],
    };
  });

  return {
    programName: String(candidate.programName || fallback.programName),
    sourceFileName: String(candidate.sourceFileName || fallback.sourceFileName),
    weeks,
    warnings: [
      ...fallback.warnings,
      ...(Array.isArray(candidate.warnings) ? candidate.warnings.map(String) : []),
    ],
  };
}

export function attachExerciseMatches(program: ParsedProgram, templates: Template[]): ParsedProgram {
  const matchCache = new Map<string, ReturnType<typeof matchExercise>>();

  function getMatch(name: string) {
    const cacheKey = name.trim().toLowerCase();
    const cached = matchCache.get(cacheKey);
    if (cached) return cached;

    const match = matchExercise(name, templates);
    matchCache.set(cacheKey, match);
    return match;
  }

  return {
    ...program,
    weeks: program.weeks.map((week) => ({
      ...week,
      blocks: week.blocks.map((block) => ({
        ...block,
        exercises: block.exercises.map((exercise) => {
          const match = getMatch(exercise.name);
          const matchedTemplate = match.matchedTemplate;
          return {
            ...exercise,
            matchedTemplate,
            selectedTemplateId: matchedTemplate?.id || null,
            matchConfidence: match.confidence,
            alternatives: match.alternatives,
          };
        }),
      })),
    })),
  };
}

function hevyRoutineSetFromParsedSet(set: ParsedSet) {
  const routineSet: HevyRoutineCreateInput["exercises"][number]["sets"][number] = {
    type: set.type,
    weight_kg: set.weight_kg,
    reps: set.reps,
    distance_meters: set.distance_meters,
    duration_seconds: set.duration_seconds,
    custom_metric: set.custom_metric,
  };

  if (
    typeof set.rep_range?.start === "number" &&
    typeof set.rep_range?.end === "number" &&
    Number.isFinite(set.rep_range.start) &&
    Number.isFinite(set.rep_range.end)
  ) {
    routineSet.rep_range = {
      start: set.rep_range.start,
      end: set.rep_range.end,
    };
  }

  return routineSet;
}

export function routinesFromProgram(program: ParsedProgram): HevyRoutineCreateInput[] {
  return program.weeks.flatMap((week) =>
    week.blocks.map((block) => ({
      title: `Week ${week.weekNumber} - ${block.blockName || `Block ${block.blockNumber}`}`,
      folder_id: null,
      notes: [program.programName, block.notes].filter(Boolean).join("\n"),
      exercises: block.exercises.map((exercise) => {
        const templateId = exercise.selectedTemplateId || exercise.matchedTemplate?.id;
        if (!templateId) {
          throw new Error(`Exercise "${exercise.name}" needs a Hevy template match.`);
        }

        return {
          exercise_template_id: templateId,
          superset_id: exercise.supersetGroup,
          rest_seconds: exercise.restSeconds,
          notes: exercise.notes || (exercise.weight.includes("%") ? `Load: ${exercise.weight}` : ""),
          sets: exercise.parsedSets.map(hevyRoutineSetFromParsedSet),
        };
      }),
    })),
  );
}
