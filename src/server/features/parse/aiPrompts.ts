export const PARSE_SYSTEM_PROMPT = `You are a workout programming parser. Given raw spreadsheet data from a trainer's workout plan, extract structured workout data.

The data typically follows these patterns:
- Header rows contain: program name, gym name, client name, week/phase info
- Weeks are laid out horizontally (Week 1, Week 2, etc.) OR as separate sections
- Each week has Blocks (training days): Block 1 (legs), Block 2 (push), Block 3 (pull) etc.
- Each block lists exercises with: Exercise name, Weight or %, Reps, Sets
- Supersets may be marked with letters (A1/A2, B1/B2) or grouped together
- Coach notes may appear at the bottom of blocks or in separate cells
- Weights may be absolute (135LB, 135lb, 135) or percentage-based (70%, 0.7)
- Sets x Reps notation varies: "3x10", "3 x 10", "3 sets of 10", or separate columns

IMPORTANT RULES:
- Convert ALL weights from pounds (lbs) to kilograms: divide by 2.205, round to nearest 0.5kg
- If weight is a percentage (e.g., "70%"), keep it as-is in the weight field and note it
- Parse "3x10" as 3 sets of 10 reps
- Group exercises by their block/day
- Identify supersets and group them
- Extract any coach notes

You MUST respond with ONLY a valid JSON object. Do NOT include any text, explanation, or markdown before or after the JSON. Start your response with { and end with }.`;

export function buildParseUserPrompt(rows: string[][]): string {
  // Cap rows to stay within model context window (~24K tokens)
  const limitedRows = rows.slice(0, 150);
  const csvText = limitedRows.map((row) => row.join("\t")).join("\n");
  return `Parse this spreadsheet data into a structured workout program.

Raw spreadsheet data (tab-separated):
${csvText}

Return JSON in this exact format:
{
  "programName": "string - name of the program if found, otherwise 'Workout Program'",
  "weeks": [
    {
      "weekNumber": 1,
      "blocks": [
        {
          "blockNumber": 1,
          "blockName": "string - e.g. 'Legs', 'Push', 'Pull', 'Block 1'",
          "exercises": [
            {
              "name": "string - exercise name as written",
              "weight": "string - weight value with unit, e.g. '60kg' or '70%'",
              "reps": "string - rep scheme, e.g. '10' or '8-12'",
              "sets": "string - number of sets, e.g. '3'",
              "notes": "string - any notes or special instructions",
              "isSuperset": false,
              "supersetGroup": null
            }
          ]
        }
      ]
    }
  ],
  "warnings": ["string - any issues or ambiguities found"]
}`;
}

export const GENERATE_SYSTEM_PROMPT = `You are an expert strength and conditioning coach. Generate workout programs based on the user's goals, experience level, and available equipment.

Design programs following evidence-based principles:
- Progressive overload with appropriate volume
- Proper exercise selection for the target muscles
- Appropriate rep ranges for the stated goal (strength: 1-5, hypertrophy: 6-15, endurance: 15+)
- Rest time considerations
- Balanced push/pull ratios
- Include compound movements as primary lifts

You MUST respond with ONLY a valid JSON object. Do NOT include any text, explanation, or markdown before or after the JSON. Start your response with { and end with }.`;

export function buildGenerateUserPrompt(
  params: {
    goal: string;
    split: string;
    daysPerWeek: number;
    experience: string;
    equipment: string[];
    sessionDuration: number;
    notes: string;
  },
  exerciseTemplates: { id: string; title: string; type: string; primary_muscle_group: string }[]
): string {
  const templateList = exerciseTemplates
    .slice(0, 200) // limit to avoid token overflow
    .map((t) => `${t.id}: ${t.title} (${t.primary_muscle_group})`)
    .join("\n");

  return `Generate a workout program with these parameters:
- Goal: ${params.goal}
- Split: ${params.split.replace(/_/g, " ")}
- Days per week: ${params.daysPerWeek}
- Experience: ${params.experience}
- Available equipment: ${params.equipment.join(", ") || "full gym"}
- Session duration: ${params.sessionDuration} minutes
- Additional notes: ${params.notes || "none"}

You MUST use exercise_template_id values from this list:
${templateList}

Return JSON in this exact format:
{
  "routines": [
    {
      "title": "Day 1 - Push",
      "notes": "Focus description",
      "exercises": [
        {
          "exercise_template_id": "ID_FROM_LIST",
          "title": "Exercise Name",
          "notes": "",
          "superset_id": null,
          "sets": [
            { "index": 0, "type": "warmup", "weight_kg": 20, "reps": 12 },
            { "index": 1, "type": "normal", "weight_kg": 60, "reps": 8 }
          ]
        }
      ]
    }
  ]
}`;
}
