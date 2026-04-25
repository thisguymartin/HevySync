import { useMemo, useState } from "react";
import { useApi } from "@/shared/hooks/useApi.js";
import { useAppStore } from "@/shared/stores/appStore.js";
import type { ExerciseTemplate, ParsedSet } from "@/shared/types/index.js";
import { useUploadStore } from "../stores/uploadStore.js";

interface ParsedWorkoutPreviewProps {
  warnings: string[];
  onContinue: () => void;
  onBack: () => void;
}

function numberOrNull(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function ensureSet(): ParsedSet {
  return {
    type: "normal",
    weight_kg: null,
    reps: null,
    rep_range: null,
    distance_meters: null,
    duration_seconds: null,
    custom_metric: null,
    rpe: null,
  };
}

export function ParsedWorkoutPreview({
  warnings,
  onContinue,
  onBack,
}: ParsedWorkoutPreviewProps) {
  const { apiFetch } = useApi();
  const templates = useAppStore((s) => s.exerciseTemplates);
  const setExerciseTemplates = useAppStore((s) => s.setExerciseTemplates);
  const draft = useUploadStore((s) => s.parsedProgram);
  const expandedWeek = useUploadStore((s) => s.activeWeekIndex);
  const setExpandedWeek = useUploadStore((s) => s.setActiveWeekIndex);
  const updateDraft = useUploadStore((s) => s.updateParsedProgram);
  const error = useUploadStore((s) => s.error);
  const setError = useUploadStore((s) => s.setError);
  const [isCreatingCustom, setIsCreatingCustom] = useState<string | null>(null);

  const unresolved = useMemo(
    () =>
      draft?.weeks.flatMap((week) =>
        week.blocks.flatMap((block) =>
          block.exercises.filter((exercise) => !exercise.selectedTemplateId),
        ),
      ) || [],
    [draft],
  );

  async function createCustomExercise(weekIndex: number, blockIndex: number, exerciseIndex: number) {
    if (!draft) return;
    const exercise = draft.weeks[weekIndex].blocks[blockIndex].exercises[exerciseIndex];
    setIsCreatingCustom(`${weekIndex}-${blockIndex}-${exerciseIndex}`);
    setError(null);

    try {
      const result = await apiFetch<{ id: string | number }>("/api/hevy/exercises/custom", {
        method: "POST",
        body: JSON.stringify({
          exercise: {
            title: exercise.name,
            exercise_type: "weight_reps",
            equipment_category: "other",
            muscle_group: "other",
            other_muscles: [],
          },
        }),
      });
      const template: ExerciseTemplate = {
        id: String(result.id),
        title: exercise.name,
        type: "weight_reps",
        primary_muscle_group: "other",
        secondary_muscle_groups: [],
        is_custom: true,
      };
      setExerciseTemplates([...templates, template]);
      updateDraft((next) => {
        next.weeks[weekIndex].blocks[blockIndex].exercises[exerciseIndex].selectedTemplateId =
          template.id;
        next.weeks[weekIndex].blocks[blockIndex].exercises[exerciseIndex].matchedTemplate =
          template;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create custom exercise");
    } finally {
      setIsCreatingCustom(null);
    }
  }

  if (!draft) return null;

  const activeWeekIndex = Math.min(expandedWeek, Math.max(draft.weeks.length - 1, 0));
  const activeWeek = draft.weeks[activeWeekIndex];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <input
            value={draft.programName}
            onChange={(event) =>
              updateDraft((next) => {
                next.programName = event.target.value;
              })
            }
            className="w-full rounded-md border border-transparent bg-transparent px-0 py-1 text-lg font-semibold focus:border-blue-500 focus:bg-white focus:px-2 focus:outline-none dark:focus:bg-gray-900"
          />
          <p className="text-sm text-gray-500">
            {draft.weeks.length} week(s),{" "}
            {draft.weeks.reduce((sum, week) => sum + week.blocks.length, 0)} routine(s)
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
            onClick={() => {
              setError(null);
              onContinue();
            }}
            disabled={unresolved.length > 0}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
          >
            Continue to Organize
          </button>
        </div>
      </div>

      {(warnings.length > 0 || error || unresolved.length > 0) && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            Review
          </p>
          <ul className="text-sm text-amber-700 dark:text-amber-300 list-disc list-inside mt-1">
            {error && <li>{error}</li>}
            {unresolved.length > 0 && (
              <li>{unresolved.length} exercise match(es) need a template.</li>
            )}
            {warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-1 overflow-x-auto pb-1">
        {draft.weeks.map((week, index) => (
          <button
            key={`${week.sourceSheet}-${week.weekNumber}-${index}`}
            onClick={() => setExpandedWeek(index)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeWeekIndex === index
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            Week {week.weekNumber}
          </button>
        ))}
      </div>

      {activeWeek && (
        <div className="space-y-4">
          {activeWeek.blocks.map((block, blockIndex) => (
            <div
              key={`${activeWeek.weekNumber}-${block.blockNumber}-${blockIndex}`}
              className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden"
            >
              <div className="grid gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-950 sm:grid-cols-[1fr_2fr]">
                <input
                  value={block.blockName}
                  onChange={(event) =>
                    updateDraft((next) => {
                      next.weeks[activeWeekIndex].blocks[blockIndex].blockName =
                        event.target.value;
                    })
                  }
                  className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium dark:border-gray-700 dark:bg-gray-900"
                />
                <input
                  value={block.notes}
                  onChange={(event) =>
                    updateDraft((next) => {
                      next.weeks[activeWeekIndex].blocks[blockIndex].notes = event.target.value;
                    })
                  }
                  placeholder="Block notes"
                  className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
                />
              </div>

              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {block.exercises.map((exercise, exerciseIndex) => {
                  const customKey = `${activeWeekIndex}-${blockIndex}-${exerciseIndex}`;
                  return (
                    <div key={exerciseIndex} className="space-y-3 px-4 py-4">
                      <div className="grid gap-3 lg:grid-cols-[1.2fr_1.3fr_0.5fr_0.5fr_0.5fr]">
                        <input
                          value={exercise.name}
                          onChange={(event) =>
                            updateDraft((next) => {
                              next.weeks[activeWeekIndex].blocks[blockIndex].exercises[
                                exerciseIndex
                              ].name = event.target.value;
                            })
                          }
                          className="rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
                        />
                        <div className="flex gap-2">
                          <select
                            value={exercise.selectedTemplateId || ""}
                            onChange={(event) =>
                              updateDraft((next) => {
                                const target =
                                  next.weeks[activeWeekIndex].blocks[blockIndex].exercises[
                                    exerciseIndex
                                  ];
                                target.selectedTemplateId = event.target.value || null;
                              })
                            }
                            className="min-w-0 flex-1 rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
                          >
                            <option value="">Select template</option>
                            {exercise.matchedTemplate && (
                              <option value={exercise.matchedTemplate.id}>
                                {exercise.matchedTemplate.title}
                              </option>
                            )}
                            {exercise.alternatives.map((template) => (
                              <option key={template.id} value={template.id}>
                                {template.title}
                              </option>
                            ))}
                            {templates.map((template) => (
                              <option key={template.id} value={template.id}>
                                {template.title}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() =>
                              createCustomExercise(activeWeekIndex, blockIndex, exerciseIndex)
                            }
                            disabled={isCreatingCustom === customKey}
                            className="rounded-md bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                          >
                            Custom
                          </button>
                        </div>
                        <input
                          value={exercise.weight}
                          onChange={(event) =>
                            updateDraft((next) => {
                              next.weeks[activeWeekIndex].blocks[blockIndex].exercises[
                                exerciseIndex
                              ].weight = event.target.value;
                            })
                          }
                          placeholder="Weight"
                          className="rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
                        />
                        <input
                          value={exercise.reps}
                          onChange={(event) =>
                            updateDraft((next) => {
                              next.weeks[activeWeekIndex].blocks[blockIndex].exercises[
                                exerciseIndex
                              ].reps = event.target.value;
                            })
                          }
                          placeholder="Reps"
                          className="rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
                        />
                        <input
                          value={exercise.sets}
                          onChange={(event) =>
                            updateDraft((next) => {
                              next.weeks[activeWeekIndex].blocks[blockIndex].exercises[
                                exerciseIndex
                              ].sets = event.target.value;
                            })
                          }
                          placeholder="Sets"
                          className="rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
                        />
                      </div>

                      <div className="grid gap-3 sm:grid-cols-[1fr_9rem_9rem]">
                        <input
                          value={exercise.notes}
                          onChange={(event) =>
                            updateDraft((next) => {
                              next.weeks[activeWeekIndex].blocks[blockIndex].exercises[
                                exerciseIndex
                              ].notes = event.target.value;
                            })
                          }
                          placeholder="Exercise notes"
                          className="rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
                        />
                        <input
                          value={exercise.supersetGroup ?? ""}
                          onChange={(event) =>
                            updateDraft((next) => {
                              next.weeks[activeWeekIndex].blocks[blockIndex].exercises[
                                exerciseIndex
                              ].supersetGroup = numberOrNull(event.target.value);
                            })
                          }
                          placeholder="Superset"
                          className="rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
                        />
                        <input
                          value={exercise.restSeconds ?? ""}
                          onChange={(event) =>
                            updateDraft((next) => {
                              next.weeks[activeWeekIndex].blocks[blockIndex].exercises[
                                exerciseIndex
                              ].restSeconds = numberOrNull(event.target.value);
                            })
                          }
                          placeholder="Rest sec"
                          className="rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
                        />
                      </div>

                      <div className="space-y-2">
                        {exercise.parsedSets.map((set, setIndex) => (
                          <div
                            key={setIndex}
                            className="grid gap-2 text-sm sm:grid-cols-[3rem_8rem_8rem_8rem_8rem_2.5rem]"
                          >
                            <span className="py-2 text-xs text-gray-400">Set {setIndex + 1}</span>
                            <select
                              value={set.type}
                              onChange={(event) =>
                                updateDraft((next) => {
                                  next.weeks[activeWeekIndex].blocks[blockIndex].exercises[
                                    exerciseIndex
                                  ].parsedSets[setIndex].type = event.target.value as ParsedSet["type"];
                                })
                              }
                              className="rounded-md border border-gray-200 px-2 py-2 dark:border-gray-700 dark:bg-gray-950"
                            >
                              <option value="normal">normal</option>
                              <option value="warmup">warmup</option>
                              <option value="failure">failure</option>
                              <option value="dropset">dropset</option>
                            </select>
                            <input
                              value={set.weight_kg ?? ""}
                              onChange={(event) =>
                                updateDraft((next) => {
                                  next.weeks[activeWeekIndex].blocks[blockIndex].exercises[
                                    exerciseIndex
                                  ].parsedSets[setIndex].weight_kg = numberOrNull(
                                    event.target.value,
                                  );
                                })
                              }
                              placeholder="kg"
                              className="rounded-md border border-gray-200 px-2 py-2 dark:border-gray-700 dark:bg-gray-950"
                            />
                            <input
                              value={set.reps ?? ""}
                              onChange={(event) =>
                                updateDraft((next) => {
                                  next.weeks[activeWeekIndex].blocks[blockIndex].exercises[
                                    exerciseIndex
                                  ].parsedSets[setIndex].reps = numberOrNull(event.target.value);
                                })
                              }
                              placeholder="reps"
                              className="rounded-md border border-gray-200 px-2 py-2 dark:border-gray-700 dark:bg-gray-950"
                            />
                            <input
                              value={set.rpe ?? ""}
                              onChange={(event) =>
                                updateDraft((next) => {
                                  next.weeks[activeWeekIndex].blocks[blockIndex].exercises[
                                    exerciseIndex
                                  ].parsedSets[setIndex].rpe = numberOrNull(event.target.value);
                                })
                              }
                              placeholder="RPE"
                              className="rounded-md border border-gray-200 px-2 py-2 dark:border-gray-700 dark:bg-gray-950"
                            />
                            <button
                              onClick={() =>
                                updateDraft((next) => {
                                  next.weeks[activeWeekIndex].blocks[blockIndex].exercises[
                                    exerciseIndex
                                  ].parsedSets.splice(setIndex, 1);
                                })
                              }
                              className="rounded-md bg-gray-100 px-2 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                              x
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() =>
                            updateDraft((next) => {
                              next.weeks[activeWeekIndex].blocks[blockIndex].exercises[
                                exerciseIndex
                              ].parsedSets.push(ensureSet());
                            })
                          }
                          className="rounded-md bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                          Add Set
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
