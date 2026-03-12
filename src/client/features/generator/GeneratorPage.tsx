import { GeneratorForm } from "./components/GeneratorForm.js";
import { GeneratedPlan } from "./components/GeneratedPlan.js";
import { useGenerator } from "./hooks/useGenerator.js";

export function GeneratorPage() {
  const { routines, isGenerating, isPushing, error, pushResult, generate, pushToHevy } =
    useGenerator();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Generate Workout</h2>
        <p className="text-gray-500 text-sm mt-1">
          AI-powered workout plan generation
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <GeneratorForm onGenerate={generate} isGenerating={isGenerating} />
        </div>
        <div>
          {routines.length > 0 ? (
            <GeneratedPlan
              routines={routines}
              onPush={pushToHevy}
              isPushing={isPushing}
              pushResult={pushResult}
            />
          ) : !isGenerating ? (
            <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
              Configure your workout and hit Generate
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
