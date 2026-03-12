import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./shared/components/Layout.js";
import { ErrorBoundary } from "./shared/components/ErrorBoundary.js";
import { UploadPage } from "./features/upload/UploadPage.js";
import { WorkoutsPage } from "./features/workouts/WorkoutsPage.js";
import { RoutinesPage } from "./features/routines/RoutinesPage.js";
import { HistoryPage } from "./features/history/HistoryPage.js";
import { GeneratorPage } from "./features/generator/GeneratorPage.js";
import { SettingsPage } from "./features/settings/SettingsPage.js";
import { useEffect } from "react";
import { useAppStore } from "./shared/stores/appStore.js";

function DarkModeInit() {
  const darkMode = useAppStore((s) => s.darkMode);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);
  return null;
}

function TemplateLoader() {
  const hevyApiKey = useAppStore((s) => s.hevyApiKey);
  const templatesLoaded = useAppStore((s) => s.templatesLoaded);
  const setExerciseTemplates = useAppStore((s) => s.setExerciseTemplates);

  useEffect(() => {
    if (!hevyApiKey || templatesLoaded) return;
    fetch("/api/hevy/exercises/all", {
      headers: { "x-hevy-api-key": hevyApiKey },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setExerciseTemplates(data.exercise_templates))
      .catch(() => {});
  }, [hevyApiKey, templatesLoaded, setExerciseTemplates]);

  return null;
}

export function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <DarkModeInit />
        <TemplateLoader />
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<UploadPage />} />
            <Route path="workouts" element={<WorkoutsPage />} />
            <Route path="routines" element={<RoutinesPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="generate" element={<GeneratorPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
