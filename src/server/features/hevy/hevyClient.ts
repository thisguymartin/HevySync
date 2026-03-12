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

async function hevyFetch(
  baseUrl: string,
  path: string,
  apiKey: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (res.status === 429) {
    // Rate limited — wait and retry once
    await new Promise((r) => setTimeout(r, 2000));
    const retry = await fetch(url, {
      ...options,
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
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

// ── Exercise Templates ──

export async function getExerciseTemplates(
  baseUrl: string,
  apiKey: string,
  page = 1,
  pageSize = 100
) {
  const res = await hevyFetch(
    baseUrl,
    `/v1/exercise_templates?page=${page}&page_size=${pageSize}`,
    apiKey
  );
  return res.json() as Promise<{
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
  }>;
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

// ── Workouts ──

export async function listWorkouts(
  baseUrl: string,
  apiKey: string,
  page = 1,
  pageSize = 10
) {
  const res = await hevyFetch(
    baseUrl,
    `/v1/workouts?page=${page}&page_size=${pageSize}`,
    apiKey
  );
  return res.json() as Promise<{
    page: number;
    page_count: number;
    workouts: Array<Record<string, unknown>>;
  }>;
}

export async function getWorkout(baseUrl: string, apiKey: string, workoutId: string) {
  const res = await hevyFetch(baseUrl, `/v1/workouts/${workoutId}`, apiKey);
  return res.json();
}

export async function createWorkout(
  baseUrl: string,
  apiKey: string,
  workout: {
    title: string;
    description?: string | null;
    start_time: string;
    end_time: string;
    is_private?: boolean;
    exercises: Array<{
      exercise_template_id: string;
      superset_id?: number | null;
      notes?: string;
      sets: Array<{
        type: string;
        weight_kg?: number | null;
        reps?: number | null;
        distance_meters?: number | null;
        duration_seconds?: number | null;
        rpe?: number | null;
      }>;
    }>;
  }
) {
  const sanitized = sanitizePayload(workout);
  const res = await hevyFetch(baseUrl, `/v1/workouts`, apiKey, {
    method: "POST",
    body: JSON.stringify({ workout: sanitized }),
  });
  return res.json();
}

// ── Routines ──

export async function listRoutines(
  baseUrl: string,
  apiKey: string,
  page = 1,
  pageSize = 10
) {
  const res = await hevyFetch(
    baseUrl,
    `/v1/routines?page=${page}&page_size=${pageSize}`,
    apiKey
  );
  return res.json() as Promise<{
    page: number;
    page_count: number;
    routines: Array<Record<string, unknown>>;
  }>;
}

export async function getRoutine(baseUrl: string, apiKey: string, routineId: string) {
  const res = await hevyFetch(baseUrl, `/v1/routines/${routineId}`, apiKey);
  return res.json();
}

export async function createRoutine(
  baseUrl: string,
  apiKey: string,
  routine: {
    title: string;
    folder_id?: number | null;
    notes?: string;
    exercises: Array<{
      exercise_template_id: string;
      superset_id?: number | null;
      notes?: string;
      sets: Array<{
        type: string;
        weight_kg?: number | null;
        reps?: number | null;
        distance_meters?: number | null;
        duration_seconds?: number | null;
        rpe?: number | null;
      }>;
    }>;
  }
) {
  const sanitized = sanitizePayload(routine);
  const res = await hevyFetch(baseUrl, `/v1/routines`, apiKey, {
    method: "POST",
    body: JSON.stringify({ routine: sanitized }),
  });
  return res.json();
}

export async function updateRoutine(
  baseUrl: string,
  apiKey: string,
  routineId: string,
  routine: {
    title: string;
    folder_id?: number | null;
    notes?: string;
    exercises: Array<{
      exercise_template_id: string;
      superset_id?: number | null;
      notes?: string;
      sets: Array<{
        type: string;
        weight_kg?: number | null;
        reps?: number | null;
        distance_meters?: number | null;
        duration_seconds?: number | null;
        rpe?: number | null;
      }>;
    }>;
  }
) {
  const sanitized = sanitizePayload(routine);
  const res = await hevyFetch(baseUrl, `/v1/routines/${routineId}`, apiKey, {
    method: "PUT",
    body: JSON.stringify({ routine: sanitized }),
  });
  return res.json();
}

// ── Routine Folders ──

export async function listRoutineFolders(baseUrl: string, apiKey: string) {
  const res = await hevyFetch(baseUrl, `/v1/routine_folders?page=1&page_size=100`, apiKey);
  return res.json() as Promise<{
    page: number;
    page_count: number;
    routine_folders: Array<{ id: number; title: string }>;
  }>;
}

export async function createRoutineFolder(
  baseUrl: string,
  apiKey: string,
  title: string
) {
  const res = await hevyFetch(baseUrl, `/v1/routine_folders`, apiKey, {
    method: "POST",
    body: JSON.stringify({ routine_folder: { title } }),
  });
  return res.json();
}
