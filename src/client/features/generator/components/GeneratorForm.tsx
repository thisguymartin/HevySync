import { useState } from "react";
import type { GenerateRequest } from "@/shared/types/index.js";

interface GeneratorFormProps {
  onGenerate: (params: GenerateRequest) => void;
  isGenerating: boolean;
}

const GOALS = [
  { value: "strength", label: "Strength" },
  { value: "hypertrophy", label: "Hypertrophy" },
  { value: "endurance", label: "Endurance" },
  { value: "fat_loss", label: "Fat Loss" },
] as const;

const SPLITS = [
  { value: "push_pull_legs", label: "Push / Pull / Legs" },
  { value: "upper_lower", label: "Upper / Lower" },
  { value: "full_body", label: "Full Body" },
  { value: "bro_split", label: "Bro Split" },
] as const;

const EXPERIENCE = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
] as const;

const EQUIPMENT_OPTIONS = [
  "Barbell",
  "Dumbbells",
  "Cables",
  "Machines",
  "Bodyweight",
  "Kettlebells",
  "Resistance Bands",
  "Pull-up Bar",
];

export function GeneratorForm({ onGenerate, isGenerating }: GeneratorFormProps) {
  const [goal, setGoal] = useState<GenerateRequest["goal"]>("hypertrophy");
  const [split, setSplit] = useState<GenerateRequest["split"]>("push_pull_legs");
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [experience, setExperience] = useState<GenerateRequest["experience"]>("intermediate");
  const [equipment, setEquipment] = useState<string[]>(["Barbell", "Dumbbells", "Cables", "Machines"]);
  const [sessionDuration, setSessionDuration] = useState(60);
  const [notes, setNotes] = useState("");

  const toggleEquipment = (item: string) => {
    setEquipment((prev) =>
      prev.includes(item) ? prev.filter((e) => e !== item) : [...prev, item]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate({
      goal,
      split,
      daysPerWeek,
      experience,
      equipment,
      sessionDuration,
      notes,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Goal */}
      <div>
        <label className="block text-sm font-medium mb-1.5">Goal</label>
        <div className="grid grid-cols-2 gap-2">
          {GOALS.map((g) => (
            <button
              key={g.value}
              type="button"
              onClick={() => setGoal(g.value)}
              className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                goal === g.value
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300"
                  : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* Split */}
      <div>
        <label className="block text-sm font-medium mb-1.5">Split Type</label>
        <div className="grid grid-cols-2 gap-2">
          {SPLITS.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setSplit(s.value)}
              className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                split === s.value
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300"
                  : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Days per week */}
      <div>
        <label className="block text-sm font-medium mb-1.5">
          Days per Week: {daysPerWeek}
        </label>
        <input
          type="range"
          min={2}
          max={7}
          value={daysPerWeek}
          onChange={(e) => setDaysPerWeek(Number(e.target.value))}
          className="w-full accent-blue-600"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>2</span>
          <span>7</span>
        </div>
      </div>

      {/* Experience */}
      <div>
        <label className="block text-sm font-medium mb-1.5">Experience</label>
        <div className="grid grid-cols-3 gap-2">
          {EXPERIENCE.map((e) => (
            <button
              key={e.value}
              type="button"
              onClick={() => setExperience(e.value)}
              className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                experience === e.value
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300"
                  : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              {e.label}
            </button>
          ))}
        </div>
      </div>

      {/* Equipment */}
      <div>
        <label className="block text-sm font-medium mb-1.5">Equipment</label>
        <div className="flex flex-wrap gap-2">
          {EQUIPMENT_OPTIONS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => toggleEquipment(item)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                equipment.includes(item)
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300"
                  : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Session duration */}
      <div>
        <label className="block text-sm font-medium mb-1.5">
          Session Duration: {sessionDuration} min
        </label>
        <input
          type="range"
          min={30}
          max={120}
          step={15}
          value={sessionDuration}
          onChange={(e) => setSessionDuration(Number(e.target.value))}
          className="w-full accent-blue-600"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>30 min</span>
          <span>120 min</span>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium mb-1.5">
          Additional Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="E.g., focus on weak points, injuries to work around..."
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={isGenerating}
        className="w-full px-4 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {isGenerating ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Generating...
          </>
        ) : (
          "Generate Workout Plan"
        )}
      </button>
    </form>
  );
}
