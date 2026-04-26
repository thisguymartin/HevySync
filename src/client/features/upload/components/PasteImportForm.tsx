import { useState, type FormEvent } from "react";

export type PasteImportInput = {
  programName: string;
  text: string;
};

interface PasteImportFormProps {
  onSubmit: (input: PasteImportInput) => void | Promise<void>;
  isLoading: boolean;
  parseStatus?: string | null;
}

export function PasteImportForm({
  onSubmit,
  isLoading,
  parseStatus,
}: PasteImportFormProps) {
  const [programName, setProgramName] = useState("");
  const [text, setText] = useState("");
  const canSubmit = text.trim().length > 0 && !isLoading;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    void onSubmit({ programName, text });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
    >
      <div className="grid gap-4 sm:grid-cols-[16rem_1fr]">
        <label className="space-y-1">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Program name
          </span>
          <input
            value={programName}
            onChange={(event) => setProgramName(event.target.value)}
            placeholder="Optional"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition-colors focus:border-blue-500 dark:border-gray-700 dark:bg-gray-950"
          />
        </label>

        <div className="flex items-end justify-end">
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                {parseStatus || "Parsing..."}
              </>
            ) : (
              "Parse Text"
            )}
          </button>
        </div>
      </div>

      <label className="block space-y-1">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Workout plan
        </span>
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Week 1&#10;Day 1 - Upper&#10;Bench Press 3x8 @ 70%&#10;Row 3x10&#10;Rest 90 sec"
          className="min-h-72 w-full resize-y rounded-lg border border-gray-200 px-3 py-3 text-sm leading-6 outline-none transition-colors focus:border-blue-500 dark:border-gray-700 dark:bg-gray-950"
        />
      </label>
    </form>
  );
}
