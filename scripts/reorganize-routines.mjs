#!/usr/bin/env node
// Reorganize Hevy routines into weekly folders.
// Usage:
//   dotenvx run -- node scripts/reorganize-routines.mjs --mode=discover
//   dotenvx run -- node scripts/reorganize-routines.mjs --mode=plan
//   dotenvx run -- node scripts/reorganize-routines.mjs --mode=apply [--probe]
//
// Modes:
//   discover  Read-only. Lists routines + folders, writes scripts/.hevy-inventory.json.
//   plan      Reads inventory + scripts/reorganize-mapping.json. Prints actions, no writes.
//   apply     Same as plan, but executes. Use --probe to PUT a single routine first and stop.

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const INVENTORY_PATH = join(SCRIPT_DIR, ".hevy-inventory.json");
const MAPPING_PATH = join(SCRIPT_DIR, "reorganize-mapping.json");

const THROTTLE_MS = 1000;
const PAGE_SIZE = 10;

function getEnv(name, fallback) {
  const value = process.env[name];
  if (value && !value.startsWith("encrypted:")) return value;
  return fallback;
}

function getApiKey() {
  const key = getEnv("HEVY_API_KEY") || getEnv("HEAVY_API");
  if (!key) {
    throw new Error("Missing HEVY_API_KEY (or HEAVY_API). Run via dotenvx.");
  }
  return key;
}

function getApiBase() {
  return getEnv("HEVY_API_BASE", "https://api.hevyapp.com");
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function hevyFetch(path, apiKey, init = {}) {
  const url = `${getApiBase()}${path}`;
  const headers = {
    "api-key": apiKey,
    "Content-Type": "application/json",
    ...(init.headers ?? {}),
  };
  const backoffsMs = [2000, 5000, 10000, 20000];
  let res;
  for (let attempt = 0; ; attempt += 1) {
    res = await fetch(url, { ...init, headers });
    if (res.status !== 429) break;
    if (attempt >= backoffsMs.length) break;
    const wait = backoffsMs[attempt];
    console.log(`  (429 from ${path}, backing off ${wait}ms)`);
    await sleep(wait);
  }
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Hevy ${init.method ?? "GET"} ${path} -> ${res.status}: ${body}`);
  }
  return res;
}

async function hevyJson(path, apiKey, init) {
  const res = await hevyFetch(path, apiKey, init);
  return res.json();
}

async function listAllRoutines(apiKey) {
  const out = [];
  let page = 1;
  let pageCount = 1;
  while (page <= pageCount) {
    const json = await hevyJson(
      `/v1/routines?page=${page}&pageSize=${PAGE_SIZE}`,
      apiKey,
    );
    for (const r of json.routines ?? []) out.push(r);
    pageCount = json.page_count ?? 1;
    page += 1;
    if (page <= pageCount) await sleep(250);
  }
  return out;
}

async function listAllFolders(apiKey) {
  const out = [];
  let page = 1;
  let pageCount = 1;
  while (page <= pageCount) {
    const json = await hevyJson(
      `/v1/routine_folders?page=${page}&pageSize=${PAGE_SIZE}`,
      apiKey,
    );
    for (const f of json.routine_folders ?? []) out.push(f);
    pageCount = json.page_count ?? 1;
    page += 1;
    if (page <= pageCount) await sleep(250);
  }
  return out;
}

async function getRoutine(apiKey, routineId) {
  const json = await hevyJson(`/v1/routines/${routineId}`, apiKey);
  return Array.isArray(json.routine) ? json.routine[0] : json.routine ?? json;
}

async function createFolder(apiKey, title) {
  const json = await hevyJson("/v1/routine_folders", apiKey, {
    method: "POST",
    body: JSON.stringify({ routine_folder: { title } }),
  });
  return Array.isArray(json.routine_folder) ? json.routine_folder[0] : json.routine_folder ?? json;
}

// Hevy PUT /v1/routines/{id} rejects folder_id ("routine.folder_id is not allowed").
// So this body is title-only rename; folder placement is left to manual drag in the Hevy app.
function buildRoutinePutBody(routine, overrides) {
  const exercises = (routine.exercises ?? []).map((ex) => ({
    exercise_template_id: ex.exercise_template_id,
    superset_id: ex.superset_id ?? ex.supersets_id ?? null,
    rest_seconds: ex.rest_seconds ?? null,
    notes: ex.notes ?? null,
    sets: (ex.sets ?? []).map((s) => {
      const out = {
        type: s.type,
        weight_kg: s.weight_kg ?? null,
        reps: s.reps ?? null,
        distance_meters: s.distance_meters ?? null,
        duration_seconds: s.duration_seconds ?? null,
        custom_metric: s.custom_metric ?? null,
      };
      const start = s.rep_range?.start;
      const end = s.rep_range?.end;
      if (typeof start === "number" && typeof end === "number") {
        out.rep_range = { start, end };
      }
      return out;
    }),
  }));

  return {
    routine: {
      title: overrides.title ?? routine.title,
      notes: routine.notes ?? null,
      exercises,
    },
  };
}

async function updateRoutine(apiKey, routineId, body) {
  return hevyJson(`/v1/routines/${routineId}`, apiKey, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

function fmtRoutineRow(r, folderById) {
  const folderTitle = r.folder_id ? folderById.get(r.folder_id)?.title ?? `?${r.folder_id}` : "(none)";
  const id = String(r.id ?? "").slice(0, 12);
  const title = String(r.title ?? "").slice(0, 50);
  return `  ${id.padEnd(12)}  ${title.padEnd(52)}  ${folderTitle}`;
}

async function modeDiscover(apiKey) {
  console.log("Listing folders...");
  const folders = await listAllFolders(apiKey);
  console.log(`  ${folders.length} folder(s) found`);
  await sleep(500);

  console.log("Listing routines...");
  const routines = await listAllRoutines(apiKey);
  console.log(`  ${routines.length} routine(s) found`);

  const folderById = new Map(folders.map((f) => [f.id, f]));

  console.log("\n=== FOLDERS ===");
  if (folders.length === 0) console.log("  (none)");
  for (const f of folders) {
    console.log(`  [${f.id}] (idx ${f.index}) ${f.title}`);
  }

  console.log("\n=== ROUTINES ===");
  console.log(`  ${"id".padEnd(12)}  ${"title".padEnd(52)}  folder`);
  console.log(`  ${"-".repeat(12)}  ${"-".repeat(52)}  ------`);
  for (const r of routines) console.log(fmtRoutineRow(r, folderById));

  const inventory = {
    fetchedAt: new Date().toISOString(),
    folders: folders.map((f) => ({ id: f.id, title: f.title, index: f.index })),
    routines: routines.map((r) => ({
      id: r.id,
      title: r.title,
      folder_id: r.folder_id ?? null,
    })),
  };
  await writeFile(INVENTORY_PATH, JSON.stringify(inventory, null, 2));
  console.log(`\nWrote ${INVENTORY_PATH}`);
  console.log(`\nNext: edit ${MAPPING_PATH} (see scripts/reorganize-mapping.example.json), then run --mode=plan.`);
}

async function loadMapping() {
  if (!existsSync(MAPPING_PATH)) {
    throw new Error(`Mapping file not found: ${MAPPING_PATH}. See scripts/reorganize-mapping.example.json.`);
  }
  const raw = await readFile(MAPPING_PATH, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed.routines)) throw new Error("mapping.routines must be an array");
  return parsed;
}

async function loadInventory() {
  if (!existsSync(INVENTORY_PATH)) {
    throw new Error(`Inventory not found: ${INVENTORY_PATH}. Run --mode=discover first.`);
  }
  return JSON.parse(await readFile(INVENTORY_PATH, "utf8"));
}

function weekFolderTitle(format, week) {
  return (format ?? "Week {n}").replace("{n}", String(week));
}

function planActions(mapping, inventory) {
  const folderTitleToId = new Map(
    inventory.folders.map((f) => [f.title.toLowerCase(), f.id]),
  );
  const routineById = new Map(inventory.routines.map((r) => [r.id, r]));

  const weeks = [...new Set(mapping.routines.map((r) => r.week))].sort((a, b) => a - b);
  const folderActions = [];
  for (const w of weeks) {
    const title = weekFolderTitle(mapping.weekFolderTitleFormat, w);
    if (!folderTitleToId.has(title.toLowerCase())) {
      folderActions.push({ kind: "create-folder", week: w, title });
    }
  }

  const routineActions = [];
  for (const m of mapping.routines) {
    const current = routineById.get(m.id);
    if (!current) {
      routineActions.push({ kind: "skip-missing", id: m.id });
      continue;
    }
    const targetFolderTitle = weekFolderTitle(mapping.weekFolderTitleFormat, m.week);
    routineActions.push({
      kind: "update-routine",
      id: m.id,
      currentTitle: current.title,
      newTitle: m.newTitle,
      currentFolderId: current.folder_id ?? null,
      week: m.week,
      targetFolderTitle,
    });
  }

  return { folderActions, routineActions };
}

function printPlan(plan) {
  console.log("\n=== FOLDER ACTIONS ===");
  if (plan.folderActions.length === 0) console.log("  (no new folders needed)");
  for (const a of plan.folderActions) {
    console.log(`  CREATE folder week=${a.week} title="${a.title}"`);
  }

  console.log("\n=== ROUTINE ACTIONS ===");
  if (plan.routineActions.length === 0) console.log("  (none)");
  for (const a of plan.routineActions) {
    if (a.kind === "skip-missing") {
      console.log(`  SKIP id=${a.id} (not in inventory)`);
      continue;
    }
    const titleChange =
      a.currentTitle !== a.newTitle ? `"${a.currentTitle}" -> "${a.newTitle}"` : `(title unchanged: "${a.currentTitle}")`;
    console.log(
      `  UPDATE id=${a.id}  ${titleChange}  -> folder "${a.targetFolderTitle}" (week ${a.week})`,
    );
  }
}

async function modePlan() {
  const inventory = await loadInventory();
  const mapping = await loadMapping();
  const plan = planActions(mapping, inventory);
  printPlan(plan);
  console.log("\nDry run only. Run --mode=apply to execute.");
}

async function modeApply(probeOnly) {
  const apiKey = getApiKey();
  const inventory = await loadInventory();
  const mapping = await loadMapping();
  const plan = planActions(mapping, inventory);
  printPlan(plan);

  console.log("\n--- EXECUTING ---");

  // 1. Create folders.
  const folderTitleToId = new Map(
    inventory.folders.map((f) => [f.title.toLowerCase(), f.id]),
  );
  for (const a of plan.folderActions) {
    console.log(`Creating folder "${a.title}"...`);
    const created = await createFolder(apiKey, a.title);
    folderTitleToId.set(a.title.toLowerCase(), created.id);
    console.log(`  -> id=${created.id}`);
    await sleep(THROTTLE_MS);
  }

  // 2. Rename routines (folder placement is manual; PUT rejects folder_id).
  let count = 0;
  let skipped = 0;
  for (const a of plan.routineActions) {
    if (a.kind !== "update-routine") continue;

    if (a.currentTitle === a.newTitle) {
      console.log(`Skip ${a.id}: title already "${a.newTitle}"`);
      skipped += 1;
      continue;
    }

    console.log(`Renaming ${a.id}: "${a.currentTitle}" -> "${a.newTitle}"`);
    const current = await getRoutine(apiKey, a.id);
    await sleep(THROTTLE_MS);

    const body = buildRoutinePutBody(current, { title: a.newTitle });
    await updateRoutine(apiKey, a.id, body);
    console.log(`  ok`);
    await sleep(THROTTLE_MS);

    count += 1;
    if (probeOnly) {
      console.log("\nProbe complete. Halting after 1 rename. Inspect Hevy and rerun without --probe.");
      return;
    }
  }

  console.log(`\nDone. Renamed ${count} routine(s); skipped ${skipped} already-correct.`);

  // 3. Print drag-drop guide.
  console.log("\n=== MANUAL STEP: drag routines into folders in the Hevy app ===");
  const byWeek = new Map();
  for (const a of plan.routineActions) {
    if (a.kind !== "update-routine") continue;
    if (!byWeek.has(a.week)) byWeek.set(a.week, []);
    byWeek.get(a.week).push(a);
  }
  for (const week of [...byWeek.keys()].sort((x, y) => x - y)) {
    console.log(`\n  Folder "${weekFolderTitle("Week {n}", week)}":`);
    for (const a of byWeek.get(week)) {
      console.log(`    - ${a.newTitle}  (id ${a.id.slice(0, 8)})`);
    }
  }
}

async function main() {
  const { values } = parseArgs({
    options: {
      mode: { type: "string", default: "discover" },
      probe: { type: "boolean", default: false },
    },
    strict: false,
  });

  switch (values.mode) {
    case "discover":
      await modeDiscover(getApiKey());
      break;
    case "plan":
      await modePlan();
      break;
    case "apply":
      await modeApply(Boolean(values.probe));
      break;
    default:
      console.error(`Unknown mode "${values.mode}". Use discover | plan | apply.`);
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(err.stack ?? err.message ?? err);
  process.exit(1);
});
