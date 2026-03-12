import { useState, useCallback } from "react";
import * as XLSX from "xlsx";
import { useApi } from "@/shared/hooks/useApi.js";
import type { ParsedProgram } from "@/shared/types/index.js";

type UploadStep = "upload" | "preview" | "parsed" | "pushing";

export function useFileUpload() {
  const { apiFetch } = useApi();
  const [step, setStep] = useState<UploadStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [parsedProgram, setParsedProgram] = useState<ParsedProgram | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pushResult, setPushResult] = useState<string | null>(null);

  const parseFile = useCallback(async (f: File) => {
    setFile(f);
    setError(null);

    try {
      const buffer = await f.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: string[][] = XLSX.utils.sheet_to_json(firstSheet, {
        header: 1,
        defval: "",
      });

      // Filter out completely empty rows
      const filtered = rows.filter((row) =>
        row.some((cell) => String(cell).trim() !== "")
      );

      setRawRows(filtered);
      setStep("preview");
    } catch (err) {
      setError(
        `Failed to parse file: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }
  }, []);

  const sendToParse = useCallback(async () => {
    if (rawRows.length === 0) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await apiFetch<{
        program: ParsedProgram;
        warnings: string[];
      }>("/api/parse", {
        method: "POST",
        body: JSON.stringify({
          rows: rawRows,
          fileName: file?.name || "unknown",
        }),
      });

      setParsedProgram(res.program);
      setWarnings(res.warnings || []);
      setStep("parsed");
    } catch (err) {
      setError(
        `AI parsing failed: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      setIsLoading(false);
    }
  }, [rawRows, file, apiFetch]);

  const pushToHevy = useCallback(
    async (
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
    ) => {
      setStep("pushing");
      setError(null);
      setPushResult(null);

      try {
        let created = 0;
        for (const routine of routines) {
          await apiFetch("/api/hevy/routines", {
            method: "POST",
            body: JSON.stringify({ routine }),
          });
          created++;
          // Brief delay to respect rate limits
          if (created < routines.length) {
            await new Promise((r) => setTimeout(r, 500));
          }
        }
        setPushResult(`Successfully created ${created} routine(s) in Hevy!`);
      } catch (err) {
        setError(
          `Push failed: ${err instanceof Error ? err.message : "Unknown error"}`
        );
        setStep("parsed");
      }
    },
    [apiFetch]
  );

  const reset = useCallback(() => {
    setStep("upload");
    setFile(null);
    setRawRows([]);
    setParsedProgram(null);
    setWarnings([]);
    setError(null);
    setPushResult(null);
    setIsLoading(false);
  }, []);

  return {
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
  };
}
