import { DropZone } from "./components/DropZone.js";
import { FilePreview } from "./components/FilePreview.js";
import { ParsedWorkoutPreview } from "./components/ParsedWorkoutPreview.js";
import { OrganizePage } from "./components/OrganizePage.js";
import { SubmitProgress } from "./components/SubmitProgress.js";
import { useFileUpload } from "./hooks/useFileUpload.js";
import { ErrorAlert } from "@/shared/components/ErrorAlert.js";

const STEP_KEYS = ["upload", "preview", "parsed", "organize", "pushing"] as const;
const STEP_LABELS = ["Upload", "Preview", "Review", "Organize", "Submit"];

export function UploadPage() {
  const {
    step,
    file,
    rawRows,
    parsedProgram,
    warnings,
    isLoading,
    parseStatus,
    error,
    pushResult,
    parseFile,
    sendToParse,
    goToOrganize,
    submitToHevy,
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
        {STEP_LABELS.map((label, i) => {
          const stepIndex = STEP_KEYS.indexOf(step);
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

      <ErrorAlert error={step === "parsed" || step === "organize" ? null : error} />

      {step === "upload" && <DropZone onFileSelected={parseFile} />}

      {step === "preview" && file && (
        <FilePreview
          fileName={file.name}
          rows={rawRows}
          onConfirm={sendToParse}
          onBack={reset}
          isLoading={isLoading}
          parseStatus={parseStatus}
        />
      )}

      {step === "parsed" && parsedProgram && (
        <ParsedWorkoutPreview
          warnings={warnings}
          onContinue={goToOrganize}
          onBack={() => setStep("preview")}
        />
      )}

      {step === "organize" && (
        <OrganizePage onBack={() => setStep("parsed")} onSubmit={submitToHevy} />
      )}

      {step === "pushing" && (
        <SubmitProgress isFinished={pushResult !== null} onReset={reset} />
      )}
    </div>
  );
}
