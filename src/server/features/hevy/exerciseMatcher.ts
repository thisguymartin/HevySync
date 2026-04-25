interface Template {
  id: string;
  title: string;
  type: string;
  primary_muscle_group: string;
}

interface MatchResult {
  originalName: string;
  matchedTemplate: Template | null;
  confidence: number;
  alternatives: Template[];
}

// Common abbreviations in trainer sheets
const ALIASES: Record<string, string> = {
  bb: "barbell",
  db: "dumbbell",
  "d.b.": "dumbbell",
  "d.b": "dumbbell",
  oh: "overhead",
  "o.h.": "overhead",
  ez: "ez-bar",
  "ez bar": "ez-bar",
  inc: "incline",
  dec: "decline",
  lat: "lateral",
  rdl: "romanian deadlift",
  dl: "deadlift",
  bp: "bench press",
  ohp: "overhead press",
  cgbp: "close grip bench press",
  prress: "press",
  sldl: "stiff leg deadlift",
  ghr: "glute ham raise",
  "t-bar": "t-bar row",
  pulldown: "lat pulldown",
  "pull down": "lat pulldown",
  squat: "squat",
  "front squat": "front squat",
  "back squat": "squat",
  "high bar": "high bar squat",
  "low bar": "low bar squat",
  curl: "curl",
  press: "press",
  row: "row",
  fly: "fly",
  flye: "fly",
  "skull crusher": "skullcrusher",
  skulls: "skullcrusher",
  "face pull": "face pull",
  shrug: "shrug",
  lunge: "lunge",
  "leg press": "leg press",
  "leg curl": "leg curl",
  "leg ext": "leg extension",
  "leg extension": "leg extension",
  "ham curl": "hamstring curl",
  "calf raise": "calf raise",
  dip: "dip",
  dips: "dip",
  "pull up": "pull up",
  pullup: "pull up",
  "chin up": "chin up",
  chinup: "chin up",
  "push up": "push up",
  pushup: "push up",
};

const STOP_WORDS = new Set(["at", "for", "in", "of", "on", "the", "to", "with"]);

function normalize(text: string): string {
  let lower = text.toLowerCase().trim();
  // Replace common abbreviations
  for (const [abbr, full] of Object.entries(ALIASES)) {
    const regex = new RegExp(`\\b${abbr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
    lower = lower.replace(regex, full);
  }
  // Remove parenthetical content
  lower = lower.replace(/\([^)]*\)/g, "").trim();
  // Remove extra whitespace
  lower = lower.replace(/\s+/g, " ");
  return lower;
}

function tokenize(text: string): Set<string> {
  return new Set(
    normalize(text)
      .split(/[\s\-_,/]+/)
      .filter((t) => t.length > 1 && !STOP_WORDS.has(t))
  );
}

function tokenOverlap(a: string, b: string): number {
  const tokensA = tokenize(a);
  const tokensB = tokenize(b);
  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let matches = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) matches++;
  }
  const total = Math.max(tokensA.size, tokensB.size);
  return matches / total;
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

export function matchExercise(
  name: string,
  templates: Template[]
): MatchResult {
  if (!name || !name.trim()) {
    return {
      originalName: name,
      matchedTemplate: null,
      confidence: 0,
      alternatives: [],
    };
  }

  const normalizedName = normalize(name);

  // Score each template
  const scored = templates.map((t) => {
    const normalizedTitle = normalize(t.title);

    // Exact match after normalization
    if (normalizedName === normalizedTitle) {
      return { template: t, score: 1.0 };
    }

    // Contains match
    if (
      normalizedTitle.includes(normalizedName) ||
      normalizedName.includes(normalizedTitle)
    ) {
      return { template: t, score: 0.85 };
    }

    // Token overlap
    const overlap = tokenOverlap(name, t.title);

    // Levenshtein distance normalized
    const maxLen = Math.max(normalizedName.length, normalizedTitle.length);
    const dist = levenshtein(normalizedName, normalizedTitle);
    const levScore = maxLen > 0 ? 1 - dist / maxLen : 0;

    // Combined score (weighted)
    const score = overlap * 0.6 + levScore * 0.4;
    return { template: t, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const best = scored[0];
  const alternatives = scored.slice(1, 4).map((s) => s.template);

  return {
    originalName: name,
    matchedTemplate: best && best.score > 0.3 ? best.template : null,
    confidence: best ? best.score : 0,
    alternatives,
  };
}

export function matchAllExercises(
  names: string[],
  templates: Template[]
): MatchResult[] {
  return names.map((name) => matchExercise(name, templates));
}
