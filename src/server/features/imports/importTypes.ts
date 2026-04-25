export type ParsedSet = {
  type: "warmup" | "normal" | "failure" | "dropset";
  weight_kg: number | null;
  reps: number | null;
  rep_range: { start: number | null; end: number | null } | null;
  distance_meters: number | null;
  duration_seconds: number | null;
  custom_metric: number | null;
  rpe: number | null;
};

export type ParsedExercise = {
  name: string;
  weight: string;
  reps: string;
  sets: string;
  notes: string;
  isSuperset: boolean;
  supersetGroup: number | null;
  restSeconds: number | null;
  parsedSets: ParsedSet[];
  matchedTemplate: {
    id: string;
    title: string;
    type: string;
    primary_muscle_group: string;
    secondary_muscle_groups?: string[];
    is_custom?: boolean;
  } | null;
  selectedTemplateId: string | null;
  matchConfidence: number;
  alternatives: Array<{
    id: string;
    title: string;
    type: string;
    primary_muscle_group: string;
    secondary_muscle_groups?: string[];
    is_custom?: boolean;
  }>;
};

export type ParsedBlock = {
  blockNumber: number;
  blockName: string;
  notes: string;
  exercises: ParsedExercise[];
};

export type ParsedWeek = {
  weekNumber: number;
  sourceSheet: string;
  blocks: ParsedBlock[];
};

export type ParsedProgram = {
  programName: string;
  sourceFileName: string;
  weeks: ParsedWeek[];
  warnings: string[];
};

export type NormalizedExercise = {
  name: string;
  weight: string;
  reps: string;
  sets: string;
  notes: string;
};

export type NormalizedBlock = {
  blockNumber: number;
  blockName: string;
  notes: string;
  exercises: NormalizedExercise[];
};

export type NormalizedWeek = {
  weekNumber: number;
  sourceSheet: string;
  startRow: number;
  startColumn: number;
  blocks: NormalizedBlock[];
};

export type NormalizedWorkbook = {
  fileName: string;
  programName: string;
  sheets: Array<{
    name: string;
    rowCount: number;
  }>;
  weeks: NormalizedWeek[];
  warnings: string[];
};
