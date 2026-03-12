import type { MuscleGroup } from "../types/index.js";
import { MUSCLE_GROUP_COLORS, EXERCISE_TYPE_LABELS, formatMuscleGroupLabel } from "../utils/muscleGroups.js";

export function MuscleGroupBadge({ group }: { group: MuscleGroup }) {
  const c = MUSCLE_GROUP_COLORS[group] || MUSCLE_GROUP_COLORS.other;
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.bg} ${c.text} ${c.darkBg} ${c.darkText}`}
    >
      {formatMuscleGroupLabel(group)}
    </span>
  );
}

export function ExerciseTypeBadge({ type }: { type: string }) {
  const label = EXERCISE_TYPE_LABELS[type] || type;
  if (!label) return null;
  return (
    <span className="text-xs px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 font-mono">
      {label}
    </span>
  );
}
