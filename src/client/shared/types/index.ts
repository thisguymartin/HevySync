// ── Hevy API Types ──

export type MuscleGroup =
  | "abdominals"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "forearms"
  | "quadriceps"
  | "hamstrings"
  | "calves"
  | "glutes"
  | "abductors"
  | "adductors"
  | "lats"
  | "upper_back"
  | "traps"
  | "lower_back"
  | "chest"
  | "cardio"
  | "neck"
  | "full_body"
  | "other";

export type SetType = "normal" | "warmup" | "dropset" | "failure";

export interface HevySet {
  index: number;
  type: SetType;
  weight_kg: number | null;
  reps: number | null;
  rep_range?: { start: number | null; end: number | null } | null;
  distance_meters: number | null;
  duration_seconds: number | null;
  custom_metric?: number | null;
  rpe: number | null;
}

export interface HevyExercise {
  index: number;
  title: string;
  notes: string;
  exercise_template_id: string;
  superset_id: number | null;
  rest_seconds?: number | null;
  sets: HevySet[];
}

export interface HevyWorkout {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  is_private: boolean;
  exercises: HevyExercise[];
  created_at: string;
  updated_at: string;
}

export interface HevyRoutine {
  id: string;
  title: string;
  folder_id: number | null;
  notes: string;
  exercises: HevyExercise[];
  created_at: string;
  updated_at: string;
}

export interface ExerciseTemplate {
  id: string;
  title: string;
  type: string;
  primary_muscle_group: MuscleGroup;
  secondary_muscle_groups: MuscleGroup[];
  is_custom: boolean;
}

// ── Parsed Workout Types ──

export interface ParsedSet {
  type: SetType;
  weight_kg: number | null;
  reps: number | null;
  rep_range: { start: number | null; end: number | null } | null;
  distance_meters: number | null;
  duration_seconds: number | null;
  custom_metric: number | null;
  rpe: number | null;
}

export interface ParsedExercise {
  name: string;
  weight: string;
  reps: string;
  sets: string;
  notes: string;
  isSuperset: boolean;
  supersetGroup: number | null;
  restSeconds: number | null;
  parsedSets: ParsedSet[];
  matchedTemplate: ExerciseTemplate | null;
  selectedTemplateId: string | null;
  matchConfidence: number;
  alternatives: ExerciseTemplate[];
}

export interface ParsedBlock {
  blockNumber: number;
  blockName: string;
  notes: string;
  exercises: ParsedExercise[];
}

export interface ParsedWeek {
  weekNumber: number;
  sourceSheet: string;
  blocks: ParsedBlock[];
}

export interface ParsedProgram {
  programName: string;
  sourceFileName: string;
  weeks: ParsedWeek[];
  warnings: string[];
}

// ── API Request/Response Types ──

export interface ParseRequest {
  rows: string[][];
  fileName: string;
}

export interface ParseResponse {
  program: ParsedProgram;
  warnings: string[];
}

export interface GenerateRequest {
  goal: "strength" | "hypertrophy" | "endurance" | "fat_loss";
  split: "push_pull_legs" | "upper_lower" | "full_body" | "bro_split";
  daysPerWeek: number;
  experience: "beginner" | "intermediate" | "advanced";
  equipment: string[];
  sessionDuration: number;
  notes: string;
}

export interface GenerateResponse {
  routines: {
    title: string;
    notes: string;
    exercises: HevyExercise[];
  }[];
}

export interface ExerciseMatchResult {
  originalName: string;
  matchedTemplate: ExerciseTemplate | null;
  confidence: number;
  alternatives: ExerciseTemplate[];
}

// ── Pagination ──

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageCount: number;
}
