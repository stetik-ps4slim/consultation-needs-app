export const scoreOptions = [1, 2, 3, 4, 5] as const;

export const warmupItems = [
  "Spine roll",
  "Arm rotations",
  "Lateral leg kick",
  "Torso rotations"
] as const;

export const movementSections = [
  {
    title: "Hip / Knee",
    tests: ["Bodyweight squat", "Leg press", "Other"]
  },
  {
    title: "Lunge",
    tests: ["Static lunge (supported/free)", "Walking lunge", "Other"]
  },
  {
    title: "Hinge",
    tests: ["Romanian deadlift", "Glute bridge", "Other"]
  },
  {
    title: "Pull",
    tests: ["Bent over row", "Reverse fly", "Other"]
  },
  {
    title: "Push",
    tests: ["Push up (incline/knees/full)", "Chest press", "Shoulder press", "Other"]
  },
  {
    title: "Core",
    tests: ["Plank", "Controlled crunch", "Toe taps", "Other"]
  },
  {
    title: "Flexibility / Mobility",
    tests: ["Seated toe reach", "Lying leg raise", "Posture notes", "Other"]
  }
] as const;

export type Score = (typeof scoreOptions)[number];

export type MovementTest = {
  name: string;
  score: Score | null;
  completed: boolean;
  observations: string;
  notes: string;
  assessedOn: string;
};

export type MovementSection = {
  title: string;
  tests: MovementTest[];
};

export type ScreeningClient = {
  id: number;
  name: string;
  injury: string;
  screeningDate: string;
  contact: string;
  health: string;
  conductedBy: string;
  warmupNotes: string;
  overallNotes: string;
  sections: MovementSection[];
  updatedAt: string;
  createdAt?: string;
};

export type ScreeningClientInsert = Omit<ScreeningClient, "id" | "updatedAt" | "createdAt">;

export type ScreeningClientUpdate = Partial<ScreeningClientInsert>;

export type ClientSort =
  | "recent"
  | "name-asc"
  | "name-desc"
  | "score-high"
  | "score-low";

export function hasSupabaseConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export function createDefaultSections(): MovementSection[] {
  return movementSections.map((section) => ({
    title: section.title,
    tests: section.tests.map((test) => ({
      name: test,
      score: null,
      completed: false,
      observations: "",
      notes: "",
      assessedOn: ""
    }))
  }));
}

export function createEmptyClient(nextId: number): ScreeningClient {
  const today = new Date().toISOString().slice(0, 10);

  return {
    id: nextId,
    name: "New client",
    injury: "",
    screeningDate: today,
    contact: "",
    health: "",
    conductedBy: "Jazzay Sallah",
    warmupNotes: warmupItems.join(", "),
    overallNotes: "",
    sections: createDefaultSections(),
    updatedAt: new Date().toISOString()
  };
}

export function getClientAverageScore(client: ScreeningClient) {
  const scores = client.sections.flatMap((section) =>
    section.tests.flatMap((test) => (test.score ? [test.score] : []))
  );

  if (!scores.length) return null;

  const total = scores.reduce((sum, score) => sum + score, 0);
  return Number((total / scores.length).toFixed(1));
}

export function getCompletedTests(client: ScreeningClient) {
  return client.sections.reduce(
    (sum, section) => sum + section.tests.filter((test) => test.completed).length,
    0
  );
}

export function getTotalTests(client: ScreeningClient) {
  return client.sections.reduce((sum, section) => sum + section.tests.length, 0);
}

export function sortClients(clients: ScreeningClient[], sortBy: ClientSort) {
  return [...clients].sort((left, right) => {
    if (sortBy === "name-asc") return left.name.localeCompare(right.name);
    if (sortBy === "name-desc") return right.name.localeCompare(left.name);
    if (sortBy === "score-high")
      return (getClientAverageScore(right) ?? -1) - (getClientAverageScore(left) ?? -1);
    if (sortBy === "score-low")
      return (getClientAverageScore(left) ?? 6) - (getClientAverageScore(right) ?? 6);
    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
  });
}

export function sanitizeSections(input: unknown): MovementSection[] {
  if (!Array.isArray(input) || !input.length) {
    return createDefaultSections();
  }

  return input.map((section, sectionIndex) => {
    const defaultSection = createDefaultSections()[sectionIndex];
    const sectionRecord = isRecord(section) ? section : {};
    const tests = Array.isArray(sectionRecord.tests) ? sectionRecord.tests : [];

    return {
      title:
        typeof sectionRecord.title === "string" && sectionRecord.title.trim()
          ? sectionRecord.title.trim()
          : defaultSection?.title ?? `Section ${sectionIndex + 1}`,
      tests: tests.map((test, testIndex) => {
        const defaultTest = defaultSection?.tests[testIndex];
        const testRecord = isRecord(test) ? test : {};

        return {
          name:
            typeof testRecord.name === "string" && testRecord.name.trim()
              ? testRecord.name.trim()
              : defaultTest?.name ?? `Test ${testIndex + 1}`,
          score: parseScore(testRecord.score),
          completed: Boolean(testRecord.completed),
          observations:
            typeof testRecord.observations === "string" ? testRecord.observations.trim() : "",
          notes: typeof testRecord.notes === "string" ? testRecord.notes.trim() : "",
          assessedOn:
            typeof testRecord.assessedOn === "string" ? testRecord.assessedOn.trim() : ""
        };
      })
    };
  });
}

export function normalizeClientInsert(input: Partial<ScreeningClientInsert>) {
  return {
    name: typeof input.name === "string" ? input.name.trim() : "",
    injury: typeof input.injury === "string" ? input.injury.trim() : "",
    screeningDate:
      typeof input.screeningDate === "string" ? input.screeningDate.trim() : "",
    contact: typeof input.contact === "string" ? input.contact.trim() : "",
    health: typeof input.health === "string" ? input.health.trim() : "",
    conductedBy:
      typeof input.conductedBy === "string" && input.conductedBy.trim()
        ? input.conductedBy.trim()
        : "Jazzay Sallah",
    warmupNotes:
      typeof input.warmupNotes === "string" ? input.warmupNotes.trim() : warmupItems.join(", "),
    overallNotes: typeof input.overallNotes === "string" ? input.overallNotes.trim() : "",
    sections: sanitizeSections(input.sections)
  } satisfies ScreeningClientInsert;
}

export function normalizeClientUpdate(input: Record<string, unknown>): ScreeningClientUpdate {
  const normalized: ScreeningClientUpdate = {};

  if ("name" in input) normalized.name = typeof input.name === "string" ? input.name.trim() : "";
  if ("injury" in input) normalized.injury = typeof input.injury === "string" ? input.injury.trim() : "";
  if ("screeningDate" in input) normalized.screeningDate = typeof input.screeningDate === "string" ? input.screeningDate.trim() : "";
  if ("contact" in input) normalized.contact = typeof input.contact === "string" ? input.contact.trim() : "";
  if ("health" in input) normalized.health = typeof input.health === "string" ? input.health.trim() : "";
  if ("conductedBy" in input) normalized.conductedBy = typeof input.conductedBy === "string" ? input.conductedBy.trim() : "";
  if ("warmupNotes" in input) normalized.warmupNotes = typeof input.warmupNotes === "string" ? input.warmupNotes.trim() : "";
  if ("overallNotes" in input) normalized.overallNotes = typeof input.overallNotes === "string" ? input.overallNotes.trim() : "";
  if ("sections" in input) normalized.sections = sanitizeSections(input.sections);

  return normalized;
}

export const sampleClients: ScreeningClient[] = [
  {
    id: 1,
    name: "Mia Carter",
    injury: "Left knee discomfort when squatting deep",
    screeningDate: "2026-04-05",
    contact: "0401 555 881",
    health: "Cleared for training, mild asthma",
    conductedBy: "Jazzay Sallah",
    warmupNotes: "Completed full warm up with no issues.",
    overallNotes: "Needs hip stability work and better depth control.",
    updatedAt: "2026-04-07T10:20:00.000Z",
    createdAt: "2026-04-05T10:20:00.000Z",
    sections: [
      {
        title: "Hip / Knee",
        tests: [
          { name: "Bodyweight squat", score: 2, completed: true, observations: "Knees cave slightly, depth drops under load.", notes: "Start with box squat and tempo work.", assessedOn: "2026-04-05" },
          { name: "Leg press", score: 3, completed: true, observations: "Stronger pattern with stable foot pressure.", notes: "", assessedOn: "2026-04-05" },
          { name: "Other", score: null, completed: false, observations: "", notes: "", assessedOn: "" }
        ]
      },
      {
        title: "Lunge",
        tests: [
          { name: "Static lunge (supported/free)", score: 2, completed: true, observations: "Wobble on left side.", notes: "Keep support nearby.", assessedOn: "2026-04-05" },
          { name: "Walking lunge", score: null, completed: false, observations: "", notes: "", assessedOn: "" },
          { name: "Other", score: null, completed: false, observations: "", notes: "", assessedOn: "" }
        ]
      },
      ...createDefaultSections().slice(2)
    ]
  },
  {
    id: 2,
    name: "Noah Bennett",
    injury: "No current injury",
    screeningDate: "2026-04-08",
    contact: "noah@example.com",
    health: "Desk job stiffness through thoracic spine",
    conductedBy: "Jazzay Sallah",
    warmupNotes: "Needed extra shoulder mobility before pull work.",
    overallNotes: "Generally strong control. Focus on shoulder mobility and posture.",
    updatedAt: "2026-04-08T08:00:00.000Z",
    createdAt: "2026-04-08T08:00:00.000Z",
    sections: createDefaultSections().map((section) => ({
      ...section,
      tests: section.tests.map((test) => {
        if (test.name === "Romanian deadlift") {
          return { ...test, score: 4, completed: true, observations: "Good hinge pattern with solid hamstring tension.", notes: "", assessedOn: "2026-04-08" };
        }
        if (test.name === "Posture notes") {
          return { ...test, score: 3, completed: true, observations: "Some forward head carriage and rounded shoulders at rest.", notes: "Pair with breathing and thoracic drill.", assessedOn: "2026-04-08" };
        }
        return test;
      })
    }))
  }
];

function parseScore(value: unknown): Score | null {
  return typeof value === "number" && scoreOptions.includes(value as Score)
    ? (value as Score)
    : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
