export const leadStatuses = [
  "new",
  "contacted",
  "consult-booked",
  "proposal-sent",
  "won",
  "lost"
] as const;

export const leadSources = [
  "instagram",
  "facebook",
  "website",
  "referral",
  "walk-in",
  "other"
] as const;

export const serviceOptions = [
  "1:1 PT",
  "Online Coaching",
  "Small Group PT",
  "Nutrition Coaching",
  "Hybrid Coaching"
] as const;

export type LeadStatus = (typeof leadStatuses)[number];
export type LeadSource = (typeof leadSources)[number];
export type ServiceOption = (typeof serviceOptions)[number];

export type Lead = {
  id: number;
  name: string;
  phone: string;
  email: string;
  goal: string;
  status: LeadStatus;
  source: LeadSource;
  service_interest: string;
  priority: 1 | 2 | 3;
  budget: string;
  notes: string;
  follow_up_calls: number;
  consultation_sessions_completed: number;
  last_contacted_at: string | null;
  next_follow_up_at: string | null;
  created_at: string;
};

export type LeadInsert = {
  name: string;
  phone: string;
  email: string;
  goal: string;
  source?: LeadSource;
  service_interest?: string;
  priority?: 1 | 2 | 3;
  budget?: string;
  notes?: string;
  follow_up_calls?: number;
  consultation_sessions_completed?: number;
  next_follow_up_at?: string | null;
};

export type LeadPayload = Partial<LeadInsert>;

export type LeadUpdate = Partial<
  Pick<
    Lead,
    | "status"
    | "source"
    | "service_interest"
    | "priority"
    | "budget"
    | "notes"
    | "follow_up_calls"
    | "consultation_sessions_completed"
    | "last_contacted_at"
    | "next_follow_up_at"
  >
>;

export function hasSupabaseConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export function normalizeLeadInsert(input: Partial<LeadInsert>) {
  return {
    name: input.name?.trim() ?? "",
    phone: input.phone?.trim() ?? "",
    email: input.email?.trim().toLowerCase() ?? "",
    goal: input.goal?.trim() ?? "",
    source: parseLeadSource(input.source),
    service_interest: input.service_interest?.trim() || "1:1 PT",
    priority: parsePriority(input.priority),
    budget: input.budget?.trim() ?? "",
    notes: input.notes?.trim() ?? "",
    follow_up_calls: parseCount(input.follow_up_calls),
    consultation_sessions_completed: parseCount(input.consultation_sessions_completed),
    next_follow_up_at: normalizeDateTime(input.next_follow_up_at)
  };
}

export function normalizeLeadUpdate(input: Record<string, unknown>): LeadUpdate {
  return {
    status: parseLeadStatus(input.status),
    source: parseLeadSource(input.source),
    service_interest:
      typeof input.service_interest === "string" && input.service_interest.trim()
        ? input.service_interest.trim()
        : undefined,
    priority: parsePriority(input.priority),
    budget:
      typeof input.budget === "string"
        ? input.budget.trim()
        : undefined,
    notes:
      typeof input.notes === "string"
        ? input.notes.trim()
        : undefined,
    follow_up_calls: parseOptionalCount(input.follow_up_calls),
    consultation_sessions_completed: parseOptionalCount(
      input.consultation_sessions_completed
    ),
    last_contacted_at: normalizeDateTime(input.last_contacted_at),
    next_follow_up_at: normalizeDateTime(input.next_follow_up_at)
  };
}

export function parseLeadStatus(value: unknown): LeadStatus | undefined {
  return typeof value === "string" && leadStatuses.includes(value as LeadStatus)
    ? (value as LeadStatus)
    : undefined;
}

export function parseLeadSource(value: unknown): LeadSource {
  return typeof value === "string" && leadSources.includes(value as LeadSource)
    ? (value as LeadSource)
    : "website";
}

export function parsePriority(value: unknown): 1 | 2 | 3 {
  return value === 1 || value === 2 || value === 3 ? value : 2;
}

export function parseCount(value: unknown): number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : 0;
}

export function parseOptionalCount(value: unknown): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  return parseCount(value);
}

export function normalizeDateTime(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

export function formatStatusLabel(status: LeadStatus) {
  return status.replace("-", " ").replace(/\b\w/g, (match) => match.toUpperCase());
}

export function formatSourceLabel(source: LeadSource) {
  return source.replace("-", " ").replace(/\b\w/g, (match) => match.toUpperCase());
}

export function getLeadStats(leads: Lead[]) {
  const total = leads.length;
  const pipelineValue = leads.filter((lead) => !["won", "lost"].includes(lead.status)).length;
  const won = leads.filter((lead) => lead.status === "won").length;
  const followUps = leads.filter((lead) => {
    if (!lead.next_follow_up_at) {
      return false;
    }

    return new Date(lead.next_follow_up_at).getTime() <= Date.now();
  }).length;

  return { total, pipelineValue, won, followUps };
}

export const sampleLeads: Lead[] = [
  {
    id: 1,
    name: "Tiana Brooks",
    phone: "0402 555 019",
    email: "tiana@example.com",
    goal: "Lose 8kg and get stronger before a July holiday.",
    status: "consult-booked",
    source: "instagram",
    service_interest: "1:1 PT",
    priority: 3,
    budget: "$70-$90/week",
    notes: "Shift worker. Best contact time is after 2pm.",
    follow_up_calls: 2,
    consultation_sessions_completed: 1,
    last_contacted_at: "2026-04-07T03:00:00.000Z",
    next_follow_up_at: "2026-04-09T00:00:00.000Z",
    created_at: "2026-04-04T01:15:00.000Z"
  },
  {
    id: 2,
    name: "Marcus Lane",
    phone: "0418 555 244",
    email: "marcus@example.com",
    goal: "Build muscle and improve confidence in the gym.",
    status: "new",
    source: "website",
    service_interest: "Hybrid Coaching",
    priority: 2,
    budget: "$60/week",
    notes: "Submitted form late last night. Wants morning sessions.",
    follow_up_calls: 0,
    consultation_sessions_completed: 0,
    last_contacted_at: null,
    next_follow_up_at: "2026-04-08T22:00:00.000Z",
    created_at: "2026-04-08T00:45:00.000Z"
  },
  {
    id: 3,
    name: "Elena Ruiz",
    phone: "0431 555 882",
    email: "elena@example.com",
    goal: "Online accountability for fat loss after second baby.",
    status: "proposal-sent",
    source: "referral",
    service_interest: "Online Coaching",
    priority: 3,
    budget: "$50-$70/week",
    notes: "Warm referral from Chloe. High intent.",
    follow_up_calls: 3,
    consultation_sessions_completed: 1,
    last_contacted_at: "2026-04-06T05:30:00.000Z",
    next_follow_up_at: "2026-04-08T23:30:00.000Z",
    created_at: "2026-04-02T23:15:00.000Z"
  },
  {
    id: 4,
    name: "Daniel Price",
    phone: "0407 555 677",
    email: "daniel@example.com",
    goal: "Training around old knee injury and desk job stiffness.",
    status: "won",
    source: "facebook",
    service_interest: "Small Group PT",
    priority: 1,
    budget: "$45/week",
    notes: "Started trial pack on Monday.",
    follow_up_calls: 1,
    consultation_sessions_completed: 2,
    last_contacted_at: "2026-04-05T02:00:00.000Z",
    next_follow_up_at: null,
    created_at: "2026-03-29T04:00:00.000Z"
  }
];
