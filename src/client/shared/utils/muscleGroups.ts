import type { MuscleGroup, ExerciseTemplate } from "../types/index.js";

interface MuscleGroupStyle {
  bg: string;
  text: string;
  darkBg: string;
  darkText: string;
}

export const MUSCLE_GROUP_COLORS: Record<MuscleGroup, MuscleGroupStyle> = {
  chest: { bg: "bg-red-100", text: "text-red-700", darkBg: "dark:bg-red-900/30", darkText: "dark:text-red-400" },
  shoulders: { bg: "bg-orange-100", text: "text-orange-700", darkBg: "dark:bg-orange-900/30", darkText: "dark:text-orange-400" },
  biceps: { bg: "bg-emerald-100", text: "text-emerald-700", darkBg: "dark:bg-emerald-900/30", darkText: "dark:text-emerald-400" },
  triceps: { bg: "bg-violet-100", text: "text-violet-700", darkBg: "dark:bg-violet-900/30", darkText: "dark:text-violet-400" },
  forearms: { bg: "bg-emerald-100", text: "text-emerald-700", darkBg: "dark:bg-emerald-900/30", darkText: "dark:text-emerald-400" },
  lats: { bg: "bg-blue-100", text: "text-blue-700", darkBg: "dark:bg-blue-900/30", darkText: "dark:text-blue-400" },
  upper_back: { bg: "bg-blue-100", text: "text-blue-700", darkBg: "dark:bg-blue-900/30", darkText: "dark:text-blue-400" },
  traps: { bg: "bg-blue-100", text: "text-blue-700", darkBg: "dark:bg-blue-900/30", darkText: "dark:text-blue-400" },
  lower_back: { bg: "bg-sky-100", text: "text-sky-700", darkBg: "dark:bg-sky-900/30", darkText: "dark:text-sky-400" },
  quadriceps: { bg: "bg-amber-100", text: "text-amber-700", darkBg: "dark:bg-amber-900/30", darkText: "dark:text-amber-400" },
  hamstrings: { bg: "bg-amber-100", text: "text-amber-700", darkBg: "dark:bg-amber-900/30", darkText: "dark:text-amber-400" },
  glutes: { bg: "bg-amber-100", text: "text-amber-700", darkBg: "dark:bg-amber-900/30", darkText: "dark:text-amber-400" },
  calves: { bg: "bg-yellow-100", text: "text-yellow-700", darkBg: "dark:bg-yellow-900/30", darkText: "dark:text-yellow-400" },
  abductors: { bg: "bg-yellow-100", text: "text-yellow-700", darkBg: "dark:bg-yellow-900/30", darkText: "dark:text-yellow-400" },
  adductors: { bg: "bg-yellow-100", text: "text-yellow-700", darkBg: "dark:bg-yellow-900/30", darkText: "dark:text-yellow-400" },
  abdominals: { bg: "bg-teal-100", text: "text-teal-700", darkBg: "dark:bg-teal-900/30", darkText: "dark:text-teal-400" },
  cardio: { bg: "bg-pink-100", text: "text-pink-700", darkBg: "dark:bg-pink-900/30", darkText: "dark:text-pink-400" },
  neck: { bg: "bg-slate-100", text: "text-slate-700", darkBg: "dark:bg-slate-900/30", darkText: "dark:text-slate-400" },
  full_body: { bg: "bg-indigo-100", text: "text-indigo-700", darkBg: "dark:bg-indigo-900/30", darkText: "dark:text-indigo-400" },
  other: { bg: "bg-gray-100", text: "text-gray-700", darkBg: "dark:bg-gray-800", darkText: "dark:text-gray-400" },
};

export const EXERCISE_TYPE_LABELS: Record<string, string> = {
  barbell: "BB",
  dumbbell: "DB",
  machine: "M",
  cable: "C",
  bodyweight: "BW",
  duration: "DUR",
  weighted_bodyweight: "WBW",
  assisted_bodyweight: "ABW",
  cardio: "Cardio",
  other: "",
};

export function formatMuscleGroupLabel(group: string): string {
  return group
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

export function getUniqueMuscleGroups(
  exercises: Array<{ exercise_template_id: string }>,
  templates: ExerciseTemplate[]
): MuscleGroup[] {
  const seen = new Set<MuscleGroup>();
  for (const ex of exercises) {
    const tmpl = templates.find((t) => t.id === ex.exercise_template_id);
    if (tmpl) seen.add(tmpl.primary_muscle_group);
  }
  return Array.from(seen);
}

export function getTemplateForExercise(
  exerciseTemplateId: string,
  templates: ExerciseTemplate[]
): ExerciseTemplate | undefined {
  return templates.find((t) => t.id === exerciseTemplateId);
}
