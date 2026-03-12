import { useState } from "react";
import { useAppStore } from "@/shared/stores/appStore.js";

export function ApiKeyForm() {
  const { hevyApiKey, setHevyApiKey, darkMode, toggleDarkMode } = useAppStore();
  const [keyInput, setKeyInput] = useState(hevyApiKey);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setHevyApiKey(keyInput.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Hevy API Key */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 space-y-3">
        <div>
          <h3 className="font-medium">Hevy API Key</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Get your API key from Hevy app settings. Stored locally in your
            browser.
          </p>
        </div>
        <div className="flex gap-2">
          <input
            type="password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="Enter your Hevy API key"
            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {saved ? "Saved!" : "Save"}
          </button>
        </div>
        {hevyApiKey && (
          <p className="text-xs text-green-600 dark:text-green-400">
            API key configured
          </p>
        )}
      </div>

      {/* Theme */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Dark Mode</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Toggle dark theme
            </p>
          </div>
          <button
            onClick={toggleDarkMode}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              darkMode ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                darkMode ? "translate-x-6" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </div>

      {/* About */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
        <h3 className="font-medium">About GymSync</h3>
        <p className="text-sm text-gray-500 mt-1">
          Upload your trainer's workout spreadsheets and push them to Hevy.
          AI-powered parsing understands your trainer's format and matches
          exercises to Hevy's library.
        </p>
        <p className="text-xs text-gray-400 mt-2">v0.1.0</p>
      </div>
    </div>
  );
}
