export const pricingDecisionStatuses = [
  "presented",
  "follow-up-needed",
  "signed-up",
  "not-proceeding"
] as const;

export type PricingDecisionStatus = (typeof pricingDecisionStatuses)[number];

export type PricingPackageOption = {
  id: string;
  name: string;
  tagline: string;
  weeklyPrice: number;
  upfrontPrice: number;
  savings: number;
  results: string[];
  inclusions: string[];
};

export type PricingPresentationForm = {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientGoal: string;
  clientNeeds: string;
  recommendation: string;
  selectedPackageId: string;
  selectedPackage: PricingPackageOption;
  packages: PricingPackageOption[];
  nutritionAdded: boolean;
  nutritionWeeklyPrice: number;
  nutritionDescription: string;
  weeklyTotal: number;
  upfrontTotal: number;
};

export type PricingPresentationRecord = {
  id: number;
  client_name: string;
  client_email: string;
  client_phone: string;
  goal: string;
  selected_package_name: string;
  weekly_total: number;
  upfront_total: number;
  nutrition_added: boolean;
  decision_status: PricingDecisionStatus;
  accepted_package_name: string;
  follow_up_at: string | null;
  follow_up_note: string;
  presentation_data: PricingPresentationForm;
  created_at: string;
  updated_at: string;
};

export type PricingPresentationUpdate = Partial<{
  decision_status: PricingDecisionStatus;
  accepted_package_name: string;
  follow_up_at: string | null;
  follow_up_note: string;
}>;

export function hasSupabaseConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanNumber(value: unknown) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : 0;
}

function cleanStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => cleanString(item)).filter(Boolean)
    : [];
}

function cleanPackage(value: unknown): PricingPackageOption {
  const record = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

  return {
    id: cleanString(record.id),
    name: cleanString(record.name),
    tagline: cleanString(record.tagline),
    weeklyPrice: cleanNumber(record.weeklyPrice),
    upfrontPrice: cleanNumber(record.upfrontPrice),
    savings: cleanNumber(record.savings),
    results: cleanStringArray(record.results),
    inclusions: cleanStringArray(record.inclusions)
  };
}

function parseDecisionStatus(value: unknown): PricingDecisionStatus | undefined {
  return typeof value === "string" && pricingDecisionStatuses.includes(value as PricingDecisionStatus)
    ? (value as PricingDecisionStatus)
    : undefined;
}

function normalizeDateTime(value: unknown): string | null | undefined {
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

export function normalizePricingPresentation(input: Partial<PricingPresentationForm>) {
  const packages = Array.isArray(input.packages) ? input.packages.map(cleanPackage) : [];
  const selectedPackage = cleanPackage(input.selectedPackage);

  return {
    clientName: cleanString(input.clientName),
    clientEmail: cleanString(input.clientEmail).toLowerCase(),
    clientPhone: cleanString(input.clientPhone),
    clientGoal: cleanString(input.clientGoal),
    clientNeeds: cleanString(input.clientNeeds),
    recommendation: cleanString(input.recommendation),
    selectedPackageId: cleanString(input.selectedPackageId || selectedPackage.id),
    selectedPackage,
    packages,
    nutritionAdded: Boolean(input.nutritionAdded),
    nutritionWeeklyPrice: cleanNumber(input.nutritionWeeklyPrice),
    nutritionDescription: cleanString(input.nutritionDescription),
    weeklyTotal: cleanNumber(input.weeklyTotal),
    upfrontTotal: cleanNumber(input.upfrontTotal)
  } satisfies PricingPresentationForm;
}

export function buildPricingPresentationInsert(input: Partial<PricingPresentationForm>) {
  const normalized = normalizePricingPresentation(input);

  return {
    client_name: normalized.clientName,
    client_email: normalized.clientEmail,
    client_phone: normalized.clientPhone,
    goal: normalized.clientGoal,
    selected_package_name: normalized.selectedPackage.name,
    weekly_total: normalized.weeklyTotal,
    upfront_total: normalized.upfrontTotal,
    nutrition_added: normalized.nutritionAdded,
    decision_status: "presented" satisfies PricingDecisionStatus,
    accepted_package_name: "",
    follow_up_at: null,
    follow_up_note: "",
    presentation_data: normalized
  };
}

export function normalizePricingPresentationUpdate(input: Record<string, unknown>) {
  const followUpAt = normalizeDateTime(input.follow_up_at);

  return {
    ...(parseDecisionStatus(input.decision_status) ? { decision_status: parseDecisionStatus(input.decision_status) } : {}),
    ...(input.accepted_package_name !== undefined ? { accepted_package_name: cleanString(input.accepted_package_name) } : {}),
    ...(followUpAt !== undefined ? { follow_up_at: followUpAt } : {}),
    ...(input.follow_up_note !== undefined ? { follow_up_note: cleanString(input.follow_up_note) } : {})
  } satisfies PricingPresentationUpdate;
}

export function formatPricingDecisionStatus(status: PricingDecisionStatus) {
  return status.replaceAll("-", " ").replace(/\b\w/g, (match) => match.toUpperCase());
}
