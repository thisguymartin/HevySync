import { useState } from "react";
import type { ParsedProgram } from "@/shared/types/index.js";

interface ParsedWorkoutPreviewProps {
  program: ParsedProgram;
  warnings: string[];
  onPush: (
    routines: Array<{
      title: string;
      notes?: string;
      exercises: Array<{
        exercise_template_id: string;
        superset_id?: number | null;
        notes?: string;
        sets: Array<{
          type: string;
          weight_kg?: number | null;
          reps?: number | null;
        }>;
      }>;
    }>
  ) => void;
  onBack: () => void;
}

export function ParsedWorkoutPreview({
  program,
  warnings,
  onPush,
  onBack,
}: ParsedWorkoutPreviewProps) {
  const [expandedWeek, setExpandedWeek] = useState<number>(0);

  const buildRoutines = () => {
    const routines: Array<{
      title: string;
      notes?: string;
      exercises: Array<{
        exercise_template_id: string;
        superset_id?: number | null;
        notes?: string;
        sets: Array<{
          type: string;
          weight_kg?: number | null;
          reps?: number | null;
        }>;
      }>;
    }> = [];

    for (const week of program.weeks) {
      for (const block of week.blocks) {
        const exercises = block.exercises.map((ex, idx) => {
          const templateId =
            ex.matchedTemplate?.id || `custom_${idx}`;

          // Parse sets from the exercise data
          const numSets = parseInt(ex.sets) || 3;
          const numReps = parseInt(ex.reps) || 10;
          const weightMatch = ex.weight?.match(/[\d.]+/);
          const weightKg = weightMatch ? parseFloat(weightMatch[0]) : null;

          const sets = Array.from({ length: numSets }, (_, i) => ({
            type: "normal" as const,
            weight_kg: weightKg,
            reps: numReps,
            index: i,
          }));

          return {
            exercise_template_id: templateId,
            superset_id: ex.supersetGroup,
            notes: ex.notes || "",
            sets,
          };
        });

        routines.push({
          title: `Week ${week.weekNumber} - ${block.blockName || `Block ${block.blockNumber}`}`,
          notes: "",
          exercises,
        });
      }
    }

    return routines;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">
            {program.programName || "Parsed Program"}
          </h3>
          <p className="text-sm text-gray-500">
            {program.weeks.length} week(s),{" "}
            {program.weeks.reduce((sum, w) => sum + w.blocks.length, 0)} block(s)
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onBack}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Back
          </button>
          <button
            onClick={() => onPush(buildRoutines())}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
          >
            Push to Hevy
          </button>
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            Warnings:
          </p>
          <ul className="text-sm text-amber-700 dark:text-amber-300 list-disc list-inside mt-1">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Week tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {program.weeks.map((week, i) => (
          <button
            key={i}
            onClick={() => setExpandedWeek(i)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              expandedWeek === i
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            Week {week.weekNumber}
          </button>
        ))}
      </div>

      {/* Blocks for selected week */}
      {program.weeks[expandedWeek] && (
        <div className="space-y-4">
          {program.weeks[expandedWeek].blocks.map((block) => (
            <div
              key={block.blockNumber}
              className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden"
            >
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <h4 className="font-medium">
                  {block.blockName || `Block ${block.blockNumber}`}
                </h4>
                <p className="text-xs text-gray-500">
                  {block.exercises.length} exercise(s)
                </p>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {block.exercises.map((exercise, i) => (
                  <div key={i} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {exercise.name}
                        </p>
                        {exercise.matchedTemplate && (
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            Matched: {exercise.matchedTemplate.title}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 shrink-0">
                        <span>{exercise.sets}x{exercise.reps}</span>
                        {exercise.weight && (
                          <span className="text-blue-600 dark:text-blue-400 font-medium">
                            {exercise.weight}
                          </span>
                        )}
                      </div>
                    </div>
                    {exercise.matchConfidence < 0.7 &&
                      exercise.matchConfidence > 0 && (
                        <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300">
                          Low match confidence ({Math.round(exercise.matchConfidence * 100)}%)
                        </span>
                      )}
                    {exercise.notes && (
                      <p className="text-xs text-gray-500 mt-1">
                        {exercise.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
