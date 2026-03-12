import { ApiKeyForm } from "./components/ApiKeyForm.js";

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-gray-500 text-sm mt-1">Configure your GymSync experience</p>
      </div>
      <ApiKeyForm />
    </div>
  );
}
