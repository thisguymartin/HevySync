import type { Bindings } from "./types.js";

const DEFAULT_HEVY_API_BASE = "https://api.hevyapp.com";
const DEFAULT_OPENAI_MODEL = "gpt-5-mini";

function isUsableSecret(value: string | undefined): value is string {
  return Boolean(value && !value.startsWith("encrypted:"));
}

function getProcessEnv(name: string): string | undefined {
  const processLike = (globalThis as unknown as {
    process?: { env?: Record<string, string | undefined> };
  }).process;
  return processLike?.env?.[name];
}

function firstUsableSecret(...values: Array<string | undefined>): string | undefined {
  return values.find(isUsableSecret);
}

export function getHevyApiBase(env: Bindings): string {
  return env.HEVY_API_BASE || getProcessEnv("HEVY_API_BASE") || DEFAULT_HEVY_API_BASE;
}

export function getHevyApiKey(env: Bindings): string {
  const key = firstUsableSecret(
    env.HEVY_API_KEY,
    env.HEAVY_API,
    getProcessEnv("HEVY_API_KEY"),
    getProcessEnv("HEAVY_API"),
  );
  if (!key) {
    throw new Error("Missing HEVY_API_KEY secret. If .env is encrypted, run through dotenvx.");
  }
  return key;
}

export function getOpenAiApiKey(env: Bindings): string {
  const key = firstUsableSecret(
    env.OPENAI_API_KEY,
    env.OPENAI_KEY,
    getProcessEnv("OPENAI_API_KEY"),
    getProcessEnv("OPENAI_KEY"),
  );
  if (!key) {
    throw new Error("Missing OPENAI_API_KEY secret. If .env is encrypted, run through dotenvx.");
  }
  return key;
}

export function getOpenAiModel(env: Bindings): string {
  return env.OPENAI_MODEL || getProcessEnv("OPENAI_MODEL") || DEFAULT_OPENAI_MODEL;
}

export function getSetupStatus(env: Bindings) {
  const hevyKey = firstUsableSecret(
    env.HEVY_API_KEY,
    env.HEAVY_API,
    getProcessEnv("HEVY_API_KEY"),
    getProcessEnv("HEAVY_API"),
  );
  const openAiKey = firstUsableSecret(
    env.OPENAI_API_KEY,
    env.OPENAI_KEY,
    getProcessEnv("OPENAI_API_KEY"),
    getProcessEnv("OPENAI_KEY"),
  );

  return {
    hevyConfigured: Boolean(hevyKey),
    openAiConfigured: Boolean(openAiKey),
    hevyApiBase: getHevyApiBase(env),
    openAiModel: getOpenAiModel(env),
  };
}
