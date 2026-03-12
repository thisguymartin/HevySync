import { DropZone } from "./components/DropZone.js";
import { FilePreview } from "./components/FilePreview.js";
import { ParsedWorkoutPreview } from "./components/ParsedWorkoutPreview.js";
import { PushToHevyButton } from "./components/PushToHevyButton.js";
import { useFileUpload } from "./hooks/useFileUpload.js";
import { LoadingSpinner } from "@/shared/components/LoadingSpinner.js";

export function UploadPage() {
  const {
    step,
    file,
    rawRows,
    parsedProgram,
    warnings,
    isLoading,
    error,
    pushResult,
    parseFile,
    sendToParse,
    pushToHevy,
    reset,
    setStep,
  } = useFileUpload();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Upload Workout Program</h2>
        <p className="text-gray-500 text-sm mt-1">
          Upload your trainer's spreadsheet and push it to Hevy
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        {["Upload", "Preview", "Review", "Done"].map((label, i) => {
          const stepIndex = ["upload", "preview", "parsed", "pushing"].indexOf(step);
          const isActive = i === stepIndex;
          const isDone = i < stepIndex;
          return (
            <div key={label} className="flex items-center gap-2">
              {i > 0 && (
                <div
                  className={`w-8 h-0.5 ${
                    isDone ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
                  }`}
                />
              )}
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : isDone
                      ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Step content */}
      {step === "upload" && <DropZone onFileSelected={parseFile} />}

      {step === "preview" && file && (
        <FilePreview
          fileName={file.name}
          rows={rawRows}
          onConfirm={sendToParse}
          onBack={reset}
          isLoading={isLoading}
        />
      )}

      {step === "parsed" && parsedProgram && (
        <ParsedWorkoutPreview
          program={parsedProgram}
          warnings={warnings}
          onPush={pushToHevy}
          onBack={() => setStep("preview")}
        />
      )}

      {step === "pushing" && !pushResult && (
        <div className="text-center py-12">
          <LoadingSpinner className="mb-4" />
          <p className="text-gray-500">Pushing routines to Hevy...</p>
        </div>
      )}

      {step === "pushing" && pushResult && (
        <PushToHevyButton pushResult={pushResult} onReset={reset} />
      )}
    </div>
  );
}
