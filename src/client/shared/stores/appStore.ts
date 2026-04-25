import { create } from "zustand";
import type { ExerciseTemplate } from "../types/index.js";

interface AppState {
  exerciseTemplates: ExerciseTemplate[];
  setExerciseTemplates: (templates: ExerciseTemplate[]) => void;
  templatesLoaded: boolean;
  resetTemplates: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  exerciseTemplates: [],
  setExerciseTemplates: (templates) =>
    set({ exerciseTemplates: templates, templatesLoaded: true }),
  templatesLoaded: false,
  resetTemplates: () => set({ exerciseTemplates: [], templatesLoaded: false }),

  darkMode: localStorage.getItem("dark_mode") === "true",
  toggleDarkMode: () =>
    set((state) => {
      const next = !state.darkMode;
      localStorage.setItem("dark_mode", String(next));
      document.documentElement.classList.toggle("dark", next);
      return { darkMode: next };
    }),
}));
