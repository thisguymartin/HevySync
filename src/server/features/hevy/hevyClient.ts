function sanitizeNotes(text: string): string {
  return text.replace(/@/g, "(at)");
}

function sanitizePayload<T>(obj: T): T {
  if (typeof obj === "string") return sanitizeNotes(obj) as T;
  if (Array.isArray(obj)) return obj.map(sanitizePayload) as T;
  if (obj && typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = sanitizePayload(value);
    }
    return result as T;
  }
  return obj;
}

function normalizeHevyResponse<T>(obj: T): T {
  if (Array.isArray(obj)) return obj.map(normalizeHevyResponse) as T;
  if (obj && typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const normalizedKey = key === "supersets_id" ? "superset_id" : key;
      result[normalizedKey] = normalizeHevyResponse(value);
    }
    return result as T;
  }
  return obj;
}

export class HevyApiError extends Error {
  status: number;
  body: string;

  constructor(status: number, body: string) {
    super(`Hevy API error ${status}: ${body}`);
    this.name = "HevyApiError";
    this.status = status;
    this.body = body;
  }
}

export type HevySetInput = {
  type: "warmup" | "normal" | "failure" | "dropset";
  weight_kg?: number | null;
  reps?: number | null;
  rep_range?: { start: number | null; end: number | null } | null;
  distance_meters?: number | null;
  duration_seconds?: number | null;
  custom_metric?: number | null;
  rpe?: number | null;
};

export type HevyExerciseInput = {
  exercise_template_id: string;
  superset_id?: number | null;
  rest_seconds?: number | null;
  notes?: string | null;
  sets: HevySetInput[];
};

export type HevyRoutineCreateInput = {
  title: string;
  folder_id?: number | null;
  notes?: string | null;
  exercises: HevyExerciseInput[];
};

export type HevyRoutineUpdateInput = {
  title: string;
  notes?: string | null;
  exercises: HevyExerciseInput[];
};

export type HevyWorkoutInput = {
  title: string;
  description?: string | null;
  start_time: string;
  end_time: string;
  is_private?: boolean;
  exercises: HevyExerciseInput[];
};

export type CustomExerciseInput = {
  title: string;
  exercise_type:
    | "weight_reps"
    | "reps_only"
    | "bodyweight_reps"
    | "bodyweight_assisted_reps"
    | "duration"
    | "weight_duration"
    | "distance_duration"
    | "short_distance_weight";
  equipment_category:
    | "none"
    | "barbell"
    | "dumbbell"
    | "kettlebell"
    | "machine"
    | "plate"
    | "resistance_band"
    | "suspension"
    | "other";
  muscle_group: string;
  other_muscles?: string[];
};

async function hevyFetch(
  baseUrl: string,
  path: string,
  apiKey: string,
  options: RequestInit = {},
): Promise<Response> {
  const url = `${baseUrl}${path}`;
  const headers = {
    "api-key": apiKey,
    "Content-Type": "application/json",
    ...options.headers,
  };

  const res = await fetch(url, { ...options, headers });

  if (res.status === 429) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const retry = await fetch(url, { ...options, headers });
    if (!retry.ok) {
      throw new HevyApiError(retry.status, await retry.text());
    }
    return retry;
  }

  if (!res.ok) {
    throw new HevyApiError(res.status, await res.text());
  }

  return res;
}

async function hevyJson<T>(
  baseUrl: string,
  path: string,
  apiKey: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await hevyFetch(baseUrl, path, apiKey, options);
  return normalizeHevyResponse((await res.json()) as T);
}

function getRoutineRepRange(set: HevySetInput): HevySetInput["rep_range"] | undefined {
  const start = set.rep_range?.start;
  const end = set.rep_range?.end;
  if (typeof start !== "number" || typeof end !== "number") return undefined;
  if (!Number.isFinite(start) || !Number.isFinite(end)) return undefined;
  return { start, end };
}

function sanitizeRoutineSet(set: HevySetInput): Omit<HevySetInput, "rpe"> {
  const routineSet: Omit<HevySetInput, "rpe"> = {
    type: set.type,
    weight_kg: set.weight_kg ?? null,
    reps: set.reps ?? null,
    distance_meters: set.distance_meters ?? null,
    duration_seconds: set.duration_seconds ?? null,
    custom_metric: set.custom_metric ?? null,
  };
  const repRange = getRoutineRepRange(set);
  if (repRange) {
    routineSet.rep_range = repRange;
  }
  return routineSet;
}

function sanitizeRoutineExercise(exercise: HevyExerciseInput): HevyExerciseInput {
  return {
    exercise_template_id: exercise.exercise_template_id,
    superset_id: exercise.superset_id ?? null,
    rest_seconds: exercise.rest_seconds ?? null,
    notes: exercise.notes ?? null,
    sets: exercise.sets.map(sanitizeRoutineSet),
  };
}

function sanitizeRoutineCreateInput(routine: HevyRoutineCreateInput): HevyRoutineCreateInput {
  return {
    title: routine.title,
    folder_id: routine.folder_id ?? null,
    notes: routine.notes ?? null,
    exercises: routine.exercises.map(sanitizeRoutineExercise),
  };
}

function sanitizeRoutineUpdateInput(routine: HevyRoutineUpdateInput): HevyRoutineUpdateInput {
  return {
    title: routine.title,
    notes: routine.notes ?? null,
    exercises: routine.exercises.map(sanitizeRoutineExercise),
  };
}

export async function getUserInfo(baseUrl: string, apiKey: string) {
  return hevyJson<{
    data: { id: string; name: string; url: string };
  }>(baseUrl, "/v1/user/info", apiKey);
}

export async function getExerciseTemplates(
  baseUrl: string,
  apiKey: string,
  page = 1,
  pageSize = 100,
) {
  return hevyJson<{
    page: number;
    page_count: number;
    exercise_templates: Array<{
      id: string;
      title: string;
      type: string;
      primary_muscle_group: string;
      secondary_muscle_groups: string[];
      is_custom: boolean;
    }>;
  }>(baseUrl, `/v1/exercise_templates?page=${page}&pageSize=${pageSize}`, apiKey);
}

export async function getAllExerciseTemplates(baseUrl: string, apiKey: string) {
  const templates: Array<{
    id: string;
    title: string;
    type: string;
    primary_muscle_group: string;
    secondary_muscle_groups: string[];
    is_custom: boolean;
  }> = [];

  let page = 1;
  let pageCount = 1;

  while (page <= pageCount) {
    const res = await getExerciseTemplates(baseUrl, apiKey, page, 100);
    templates.push(...res.exercise_templates);
    pageCount = res.page_count;
    page++;
  }

  return templates;
}

export async function createCustomExercise(
  baseUrl: string,
  apiKey: string,
  exercise: CustomExerciseInput,
) {
  return hevyJson<{ id: string | number }>(baseUrl, "/v1/exercise_templates", apiKey, {
    method: "POST",
    body: JSON.stringify({ exercise: sanitizePayload(exercise) }),
  });
}

export async function listWorkouts(
  baseUrl: string,
  apiKey: string,
  page = 1,
  pageSize = 10,
) {
  return hevyJson<{
    page: number;
    page_count: number;
    workouts: Array<Record<string, unknown>>;
  }>(baseUrl, `/v1/workouts?page=${page}&pageSize=${pageSize}`, apiKey);
}

export async function getWorkout(baseUrl: string, apiKey: string, workoutId: string) {
  return hevyJson(baseUrl, `/v1/workouts/${workoutId}`, apiKey);
}

export async function getWorkoutEvents(
  baseUrl: string,
  apiKey: string,
  since: string,
  page = 1,
  pageSize = 10,
) {
  return hevyJson<{
    page: number;
    page_count: number;
    events: Array<Record<string, unknown>>;
  }>(
    baseUrl,
    `/v1/workouts/events?since=${encodeURIComponent(since)}&page=${page}&pageSize=${pageSize}`,
    apiKey,
  );
}

export async function createWorkout(
  baseUrl: string,
  apiKey: string,
  workout: HevyWorkoutInput,
) {
  return hevyJson(baseUrl, "/v1/workouts", apiKey, {
    method: "POST",
    body: JSON.stringify({ workout: sanitizePayload(workout) }),
  });
}

export async function updateWorkout(
  baseUrl: string,
  apiKey: string,
  workoutId: string,
  workout: HevyWorkoutInput,
) {
  return hevyJson(baseUrl, `/v1/workouts/${workoutId}`, apiKey, {
    method: "PUT",
    body: JSON.stringify({ workout: sanitizePayload(workout) }),
  });
}

export async function listRoutines(
  baseUrl: string,
  apiKey: string,
  page = 1,
  pageSize = 10,
) {
  return hevyJson<{
    page: number;
    page_count: number;
    routines: Array<Record<string, unknown>>;
  }>(baseUrl, `/v1/routines?page=${page}&pageSize=${pageSize}`, apiKey);
}

export async function getRoutine(baseUrl: string, apiKey: string, routineId: string) {
  return hevyJson(baseUrl, `/v1/routines/${routineId}`, apiKey);
}

export async function createRoutine(
  baseUrl: string,
  apiKey: string,
  routine: HevyRoutineCreateInput,
) {
  return hevyJson(baseUrl, "/v1/routines", apiKey, {
    method: "POST",
    body: JSON.stringify({ routine: sanitizePayload(sanitizeRoutineCreateInput(routine)) }),
  });
}

export async function updateRoutine(
  baseUrl: string,
  apiKey: string,
  routineId: string,
  routine: HevyRoutineUpdateInput,
) {
  return hevyJson(baseUrl, `/v1/routines/${routineId}`, apiKey, {
    method: "PUT",
    body: JSON.stringify({ routine: sanitizePayload(sanitizeRoutineUpdateInput(routine)) }),
  });
}

export async function listRoutineFolders(
  baseUrl: string,
  apiKey: string,
  page = 1,
  pageSize = 10,
) {
  return hevyJson<{
    page: number;
    page_count: number;
    routine_folders: Array<{ id: number; title: string; index: number }>;
  }>(baseUrl, `/v1/routine_folders?page=${page}&pageSize=${pageSize}`, apiKey);
}

export async function createRoutineFolder(
  baseUrl: string,
  apiKey: string,
  title: string,
) {
  return hevyJson(baseUrl, "/v1/routine_folders", apiKey, {
    method: "POST",
    body: JSON.stringify({ routine_folder: { title } }),
  });
}
