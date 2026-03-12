import { GeneratorForm } from "./components/GeneratorForm.js";
import { GeneratedPlan } from "./components/GeneratedPlan.js";
import { useGenerator } from "./hooks/useGenerator.js";
import { ErrorAlert } from "@/shared/components/ErrorAlert.js";

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

      <ErrorAlert error={error} />

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
