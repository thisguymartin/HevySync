import * as XLSX from "xlsx";
import type {
  NormalizedBlock,
  NormalizedExercise,
  NormalizedWeek,
  NormalizedWorkbook,
} from "./importTypes.js";

function cleanCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\s+/g, " ").trim();
}

function trimRow(row: unknown[]): string[] {
  const cells = row.map(cleanCell);
  let end = cells.length;
  while (end > 0 && !cells[end - 1]) end--;
  return cells.slice(0, end);
}

function getCell(row: string[] | undefined, index: number): string {
  return row?.[index] || "";
}

function parseWeek(value: string): number | null {
  const match = value.match(/^week\s+(\d+)\b/i);
  return match ? Number(match[1]) : null;
}

function parseBlock(value: string): number | null {
  const match = value.match(/^block\s+(\d+)\b/i);
  return match ? Number(match[1]) : null;
}

function isExerciseHeader(value: string): boolean {
  return /^exercise$/i.test(value);
}

function isLikelyNote(value: string, weight: string, reps: string, sets: string): boolean {
  if (!value || weight || reps || sets) return false;
  return value.length > 28 || /[.!?]/.test(value);
}

function isIgnorableRowValue(value: string): boolean {
  return (
    !value ||
    isExerciseHeader(value) ||
    /^weight\s+or\s+%$/i.test(value) ||
    /^reps$/i.test(value) ||
    /^sets$/i.test(value)
  );
}

function readMetadata(rows: string[][], fallbackName: string): string {
  for (const row of rows.slice(0, 12)) {
    for (const cell of row) {
      const match = cell.match(/^programming:\s*(.+)$/i);
      if (match?.[1]) return match[1].trim();
    }
  }
  return fallbackName.replace(/\.[^.]+$/, "") || "Workout Program";
}

function getWeekHeaders(rows: string[][]) {
  return rows.flatMap((row, rowIndex) =>
    row.flatMap((cell, columnIndex) => {
      const weekNumber = parseWeek(cell);
      return weekNumber
        ? [{ rowIndex, columnIndex, weekNumber }]
        : [];
    }),
  );
}

function buildWeek(
  rows: string[][],
  sheetName: string,
  header: { rowIndex: number; columnIndex: number; weekNumber: number },
  endRow: number,
): NormalizedWeek {
  const blocks: NormalizedBlock[] = [];
  let currentBlock: NormalizedBlock | null = null;
  const exerciseColumn = header.columnIndex;
  const weightColumn = exerciseColumn + 1;
  const repsColumn = exerciseColumn + 2;
  const setsColumn = exerciseColumn + 3;

  for (let rowIndex = header.rowIndex + 1; rowIndex < endRow; rowIndex++) {
    const row = rows[rowIndex];
    const exercise = getCell(row, exerciseColumn);
    const blockNumber = parseBlock(exercise);

    if (blockNumber !== null) {
      currentBlock = {
        blockNumber,
        blockName: exercise,
        notes: "",
        exercises: [],
      };
      blocks.push(currentBlock);
      continue;
    }

    if (!currentBlock || isIgnorableRowValue(exercise)) continue;

    const weight = getCell(row, weightColumn);
    const reps = getCell(row, repsColumn);
    const sets = getCell(row, setsColumn);

    if (isLikelyNote(exercise, weight, reps, sets)) {
      currentBlock.notes = currentBlock.notes
        ? `${currentBlock.notes}\n${exercise}`
        : exercise;
      continue;
    }

    const normalizedExercise: NormalizedExercise = {
      name: exercise,
      weight,
      reps,
      sets,
      notes: "",
    };
    currentBlock.exercises.push(normalizedExercise);
  }

  return {
    weekNumber: header.weekNumber,
    sourceSheet: sheetName,
    startRow: header.rowIndex + 1,
    startColumn: header.columnIndex + 1,
    blocks: blocks.filter((block) => block.exercises.length > 0),
  };
}

export async function normalizeWorkbookFile(
  fileName: string,
  buffer: ArrayBuffer,
): Promise<NormalizedWorkbook> {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
  const weeks: NormalizedWeek[] = [];
  const warnings: string[] = [];
  let programName = "";

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      defval: "",
      raw: false,
    });
    const rows = rawRows.map(trimRow);
    if (!programName) programName = readMetadata(rows, fileName);

    const headers = getWeekHeaders(rows);
    if (headers.length === 0) {
      warnings.push(`No week headers found in sheet "${sheetName}".`);
      continue;
    }

    for (let index = 0; index < headers.length; index++) {
      const header = headers[index];
      const nextHeaderBelow = headers.find(
        (candidate) =>
          candidate.rowIndex > header.rowIndex &&
          candidate.columnIndex <= header.columnIndex,
      );
      const endRow = nextHeaderBelow?.rowIndex ?? rows.length;
      const week = buildWeek(rows, sheetName, header, endRow);
      if (week.blocks.length === 0) {
        warnings.push(`Week ${week.weekNumber} in "${sheetName}" had no exercises.`);
      } else {
        weeks.push(week);
      }
    }
  }

  weeks.sort((a, b) => a.sourceSheet.localeCompare(b.sourceSheet) || a.weekNumber - b.weekNumber);

  return {
    fileName,
    programName: programName || fileName.replace(/\.[^.]+$/, "") || "Workout Program",
    sheets: workbook.SheetNames.map((name) => ({
      name,
      rowCount: XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[name], {
        header: 1,
        defval: "",
      }).length,
    })),
    weeks,
    warnings,
  };
}
