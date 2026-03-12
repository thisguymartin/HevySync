import { create } from "zustand";
import type { ExerciseTemplate } from "../types/index.js";

interface AppState {
  hevyApiKey: string;
  setHevyApiKey: (key: string) => void;
  exerciseTemplates: ExerciseTemplate[];
  setExerciseTemplates: (templates: ExerciseTemplate[]) => void;
  templatesLoaded: boolean;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  hevyApiKey: localStorage.getItem("hevy_api_key") || "",
  setHevyApiKey: (key: string) => {
    localStorage.setItem("hevy_api_key", key);
    set({ hevyApiKey: key });
  },

  exerciseTemplates: [],
  setExerciseTemplates: (templates) =>
    set({ exerciseTemplates: templates, templatesLoaded: true }),
  templatesLoaded: false,

  darkMode: localStorage.getItem("dark_mode") === "true",
  toggleDarkMode: () =>
    set((state) => {
      const next = !state.darkMode;
      localStorage.setItem("dark_mode", String(next));
      document.documentElement.classList.toggle("dark", next);
      return { darkMode: next };
    }),
}));
