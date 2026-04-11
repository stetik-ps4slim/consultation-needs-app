"use client";

import { useEffect, useMemo, useState } from "react";
import type { ConsultationNeedsForm, ConsultationNeedsRecord } from "@/lib/consultation-needs";
import type { Lead } from "@/lib/leads";
import {
  getClientAverageScore,
  getCompletedTests,
  getTotalTests,
  type ScreeningClient
} from "@/lib/movement-screening";

type RecordsResponse = {
  records?: ConsultationNeedsRecord[];
  leads?: Lead[];
  clients?: ScreeningClient[];
  error?: string;
};

type ClientBundle = {
  key: string;
  displayName: string;
  phone: string;
  email: string;
  goal: string;
  updatedAt: string;
  consultations: ConsultationNeedsRecord[];
  leads: Lead[];
  screenings: ScreeningClient[];
};

type DetailItem = {
  label: string;
  key: keyof ConsultationNeedsForm;
};

type DetailGroup = {
  title: string;
  items: DetailItem[];
};

const detailGroups: DetailGroup[] = [
  {
    title: "Client Details",
    items: [
      { label: "Full name", key: "fullName" },
      { label: "Date of birth", key: "dateOfBirth" },
      { label: "Age", key: "age" },
      { label: "Gender", key: "gender" },
      { label: "Phone", key: "phoneNumber" },
      { label: "Email", key: "emailAddress" },
      { label: "Emergency contact", key: "emergencyContactName" },
      { label: "Emergency number", key: "emergencyContactNumber" },
      { label: "Occupation", key: "occupation" },
      { label: "Work schedule / demands", key: "workSchedule" },
      { label: "Referred by", key: "referredBy" },
      { label: "Consultation date", key: "consultationDate" }
    ]
  },
  {
    title: "Goals",
    items: [
      { label: "What", key: "goalWhat" },
      { label: "Where", key: "goalWhere" },
      { label: "Why it matters", key: "goalWhy" },
      { label: "Timeframe", key: "goalWhen" },
      { label: "Feel when achieved", key: "feelAchieved" },
      { label: "Feel if not achieved", key: "feelNotAchieved" },
      { label: "What needs to change", key: "needsToChange" },
      { label: "Needs from coach / plan", key: "needsFromCoach" },
      { label: "Commitment level", key: "commitmentLevel" },
      { label: "Commitment why", key: "commitmentWhy" },
      { label: "Past habits", key: "pastHabits" }
    ]
  },
  {
    title: "Needs Analysis",
    items: [
      { label: "Other considerations", key: "otherConsiderations" },
      { label: "Weekly investment", key: "weeklyInvestmentRange" },
      { label: "Closer to", key: "investmentCloserTo" },
      { label: "How long wanted to start", key: "howLongWantedToStart" },
      { label: "What has been stopping them", key: "whatsStoppingYou" },
      { label: "Set budget", key: "setBudget" }
    ]
  },
  {
    title: "Training Background",
    items: [
      { label: "Worked with coach before", key: "workedWithCoachBefore" },
      { label: "Current training/activity", key: "currentTrainingLevel" },
      { label: "Other activity styles", key: "otherActivityStyles" },
      { label: "What they liked", key: "likedBefore" },
      { label: "What they disliked", key: "dislikedBefore" },
      { label: "Favourite styles/exercises", key: "favouriteStyles" },
      { label: "Why those", key: "favouriteWhy" },
      { label: "Least favourite / avoid", key: "leastFavourite" },
      { label: "Why avoid those", key: "leastFavouriteWhy" },
      { label: "Ideal session/program", key: "idealSession" },
      { label: "Open to group training", key: "openToGroupTraining" },
      { label: "Preferred duration", key: "preferredSessionDuration" }
    ]
  },
  {
    title: "Pre-Exercise Screen",
    items: [
      { label: "Heart condition / stroke", key: "heartCondition" },
      { label: "Chest pain", key: "chestPain" },
      { label: "Dizziness / fainting", key: "dizziness" },
      { label: "Asthma attack", key: "asthmaAttack" },
      { label: "Blood sugar issues", key: "bloodSugarIssues" },
      { label: "Other exercise conditions", key: "otherConditionsAffectingExercise" },
      { label: "Injuries / medical history", key: "injuriesHistory" }
    ]
  },
  {
    title: "Risk Factors & Body Composition",
    items: [
      { label: "Risk age", key: "riskAge" },
      { label: "Risk gender", key: "riskGender" },
      { label: "Family history", key: "familyHistory" },
      { label: "Smoking status", key: "smokingStatus" },
      { label: "Smoking amount", key: "smokingAmount" },
      { label: "Weight", key: "weightKg" },
      { label: "Height", key: "heightCm" },
      { label: "BMI", key: "bmi" },
      { label: "Waist circumference", key: "waistCircumference" }
    ]
  },
  {
    title: "Health Markers & Medical History",
    items: [
      { label: "High blood pressure", key: "highBloodPressure" },
      { label: "Blood pressure details", key: "highBloodPressureDetails" },
      { label: "High cholesterol", key: "highCholesterol" },
      { label: "Cholesterol details", key: "highCholesterolDetails" },
      { label: "High blood sugar", key: "highBloodSugar" },
      { label: "Blood sugar details", key: "highBloodSugarDetails" },
      { label: "Taking medications", key: "takingMedications" },
      { label: "Medication details", key: "medicationDetails" },
      { label: "Hospital visits", key: "hospitalVisits" },
      { label: "Hospital details", key: "hospitalVisitDetails" },
      { label: "Pregnancy", key: "pregnancy" },
      { label: "Muscle/joint issues", key: "muscleJointIssues" },
      { label: "Muscle/joint details", key: "muscleJointDetails" }
    ]
  },
  {
    title: "Sign-Off",
    items: [
      { label: "Full name", key: "signOffName" },
      { label: "Signature", key: "signature" },
      { label: "Date", key: "signOffDate" }
    ]
  }
];

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function clean(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function normalizeText(value: string | null | undefined) {
  return clean(value).toLowerCase();
}

function normalizePhone(value: string | null | undefined) {
  return clean(value).replace(/\D/g, "");
}

function displayValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value : "Not recorded";
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Not recorded";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
}

function latestDate(values: Array<string | null | undefined>) {
  const sorted = values
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => new Date(right).getTime() - new Date(left).getTime());

  return sorted[0] ?? "";
}

function createClientKey(input: { name?: string; email?: string; phone?: string; contact?: string }) {
  const email = normalizeText(input.email);
  const phone = normalizePhone(input.phone || input.contact);
  const name = normalizeText(input.name);

  return email || phone || name || `client-${Math.random().toString(36).slice(2)}`;
}

function upsertBundle(map: Map<string, ClientBundle>, key: string, defaults: Partial<ClientBundle>) {
  const existing = map.get(key);

  if (existing) {
    return existing;
  }

  const bundle: ClientBundle = {
    key,
    displayName: defaults.displayName || "Unnamed client",
    phone: defaults.phone || "",
    email: defaults.email || "",
    goal: defaults.goal || "",
    updatedAt: defaults.updatedAt || "",
    consultations: [],
    leads: [],
    screenings: []
  };

  map.set(key, bundle);
  return bundle;
}

function buildClientBundles(
  consultations: ConsultationNeedsRecord[],
  leads: Lead[],
  screenings: ScreeningClient[]
) {
  const bundles = new Map<string, ClientBundle>();

  leads.forEach((lead) => {
    const key = createClientKey({ name: lead.name, email: lead.email, phone: lead.phone });
    const bundle = upsertBundle(bundles, key, {
      displayName: lead.name,
      phone: lead.phone,
      email: lead.email,
      goal: lead.goal,
      updatedAt: lead.created_at
    });

    bundle.leads.push(lead);
    bundle.displayName = bundle.displayName || lead.name;
    bundle.phone = bundle.phone || lead.phone;
    bundle.email = bundle.email || lead.email;
    bundle.goal = bundle.goal || lead.goal;
    bundle.updatedAt = latestDate([bundle.updatedAt, lead.created_at]);
  });

  consultations.forEach((record) => {
    const key = createClientKey({
      name: record.client_name,
      email: record.client_email,
      phone: record.client_phone
    });
    const bundle = upsertBundle(bundles, key, {
      displayName: record.client_name,
      phone: record.client_phone,
      email: record.client_email,
      goal: record.goal,
      updatedAt: record.updated_at
    });

    bundle.consultations.push(record);
    bundle.displayName = bundle.displayName || record.client_name;
    bundle.phone = bundle.phone || record.client_phone;
    bundle.email = bundle.email || record.client_email;
    bundle.goal = bundle.goal || record.goal;
    bundle.updatedAt = latestDate([bundle.updatedAt, record.updated_at, record.created_at]);
  });

  screenings.forEach((screening) => {
    const key = createClientKey({ name: screening.name, contact: screening.contact });
    const bundle = upsertBundle(bundles, key, {
      displayName: screening.name,
      phone: screening.contact,
      goal: screening.injury,
      updatedAt: screening.updatedAt
    });

    bundle.screenings.push(screening);
    bundle.displayName = bundle.displayName || screening.name;
    bundle.phone = bundle.phone || screening.contact;
    bundle.goal = bundle.goal || screening.injury;
    bundle.updatedAt = latestDate([bundle.updatedAt, screening.updatedAt, screening.createdAt]);
  });

  return [...bundles.values()].sort(
    (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
  );
}

async function fetchJson(path: string) {
  const response = await fetch(path, { cache: "no-store" });
  const result = (await response.json()) as RecordsResponse;

  if (!response.ok) {
    throw new Error(result.error ?? `Could not load ${path}.`);
  }

  return result;
}

export function ConsultationRecordsDashboard() {
  const [consultations, setConsultations] = useState<ConsultationNeedsRecord[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [screenings, setScreenings] = useState<ScreeningClient[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [hiddenClientKeys, setHiddenClientKeys] = useState<Set<string>>(() => new Set());
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState("Loading saved Supabase data...");

  async function loadRecords() {
    setIsLoading(true);
    setStatus("Loading saved Supabase data...");

    try {
      const [consultationResult, leadResult, screeningResult] = await Promise.allSettled([
        fetchJson("/api/consultation-needs"),
        fetchJson("/api/leads"),
        fetchJson("/api/screenings")
      ]);

      const nextConsultations =
        consultationResult.status === "fulfilled" ? consultationResult.value.records ?? [] : [];
      const nextLeads = leadResult.status === "fulfilled" ? leadResult.value.leads ?? [] : [];
      const nextScreenings =
        screeningResult.status === "fulfilled" ? screeningResult.value.clients ?? [] : [];
      const loadErrors = [consultationResult, leadResult, screeningResult].flatMap((result) =>
        result.status === "rejected"
          ? [result.reason instanceof Error ? result.reason.message : "A data source failed to load."]
          : []
      );

      setConsultations(nextConsultations);
      setLeads(nextLeads);
      setScreenings(nextScreenings);
      setHiddenClientKeys(new Set());

      const nextBundles = buildClientBundles(nextConsultations, nextLeads, nextScreenings);
      setSelectedKey((currentKey) => currentKey ?? nextBundles[0]?.key ?? null);
      const successMessage = `${nextBundles.length} client profile${nextBundles.length === 1 ? "" : "s"} loaded from ${nextLeads.length} leads, ${nextConsultations.length} consultation forms, and ${nextScreenings.length} screenings.`;
      setStatus(loadErrors.length ? `${successMessage} Some sources need attention: ${loadErrors.join(" ")}` : successMessage);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not load saved Supabase data.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadRecords();
  }, []);

  const bundles = useMemo(
    () => buildClientBundles(consultations, leads, screenings),
    [consultations, leads, screenings]
  );

  const visibleBundles = useMemo(
    () => bundles.filter((bundle) => !hiddenClientKeys.has(bundle.key)),
    [bundles, hiddenClientKeys]
  );

  const filteredBundles = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();

    if (!cleanQuery) {
      return visibleBundles;
    }

    return visibleBundles.filter((bundle) => {
      const searchableText = [
        bundle.displayName,
        bundle.phone,
        bundle.email,
        bundle.goal,
        ...bundle.leads.flatMap((lead) => [lead.status, lead.source, lead.service_interest, lead.budget, lead.notes]),
        ...bundle.consultations.flatMap((record) => [record.goal, record.form_data.goalWhy, record.form_data.occupation]),
        ...bundle.screenings.flatMap((screening) => [screening.injury, screening.health, screening.overallNotes])
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(cleanQuery);
    });
  }, [query, visibleBundles]);

  const selectedBundle = useMemo(() => {
    return filteredBundles.find((bundle) => bundle.key === selectedKey) ?? filteredBundles[0] ?? null;
  }, [filteredBundles, selectedKey]);

  function clearSelectedFromPage() {
    if (!selectedBundle) {
      return;
    }

    const nextVisibleBundle = filteredBundles.find((bundle) => bundle.key !== selectedBundle.key) ?? null;

    setHiddenClientKeys((currentKeys) => {
      const nextKeys = new Set(currentKeys);
      nextKeys.add(selectedBundle.key);
      return nextKeys;
    });
    setSelectedKey(nextVisibleBundle?.key ?? null);
    setStatus(`${selectedBundle.displayName} cleared from this page only. Supabase records are still saved. Press Refresh or Show all records to bring it back.`);
  }

  function showAllRecords() {
    setHiddenClientKeys(new Set());
    setStatus("All cleared page records are visible again. Supabase data was not changed.");
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#2cc5e8_0%,#93d5d2_32%,#c9a4ea_58%,#627bde_100%)] px-4 py-8 text-[#10233f] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_20px_80px_rgba(39,71,132,0.22)] backdrop-blur-xl sm:p-8 print:shadow-none">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.34em] text-[#f02f9b]">Upper Notch Coaching</p>
              <h1 className="mt-4 max-w-3xl font-[Arial_Narrow] text-5xl uppercase tracking-[0.08em] text-[#10233f] sm:text-7xl">
                Client Hub
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#4a5c73] sm:text-base">
                Search one client and see their leads, consultation needs analysis, and movement screening records together.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 print:hidden">
              <a
                href="/"
                className="rounded-full border border-sky-100 bg-white px-5 py-3 text-sm font-semibold text-[#15314a] transition hover:border-[#f02f9b]/60"
              >
                New Form
              </a>
              <button
                type="button"
                onClick={loadRecords}
                disabled={isLoading}
                className="rounded-full bg-[#f02f9b] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? "Refreshing..." : "Refresh"}
              </button>
              {hiddenClientKeys.size ? (
                <button
                  type="button"
                  onClick={showAllRecords}
                  className="rounded-full border border-sky-100 bg-white px-5 py-3 text-sm font-semibold text-[#15314a] transition hover:border-[#f02f9b]/60"
                >
                  Show all records
                </button>
              ) : null}
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-6 lg:grid-cols-[380px_1fr]">
          <aside className="rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-[0_20px_80px_rgba(39,71,132,0.18)] backdrop-blur-xl print:hidden">
            <label className="text-xs font-bold uppercase tracking-[0.24em] text-[#f02f9b]" htmlFor="client-search">
              Search All Client Data
            </label>
            <input
              id="client-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Type a name, phone, email, goal, note, or injury"
              className="mt-3 w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-[#10233f] outline-none transition placeholder:text-[#8a98aa] focus:border-[#f02f9b] focus:ring-4 focus:ring-[#f02f9b]/15"
            />
            <p className="mt-3 text-sm text-[#4a5c73]">{status}</p>

            <div className="mt-5 space-y-3">
              {filteredBundles.map((bundle) => {
                const isSelected = selectedBundle?.key === bundle.key;
                const recordCount = bundle.leads.length + bundle.consultations.length + bundle.screenings.length;

                return (
                  <button
                    key={bundle.key}
                    type="button"
                    onClick={() => setSelectedKey(bundle.key)}
                    className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                      isSelected
                        ? "border-[#f02f9b] bg-[#f02f9b]/10 shadow-[0_12px_35px_rgba(240,47,155,0.18)]"
                        : "border-sky-100 bg-white hover:border-[#f02f9b]/60"
                    }`}
                  >
                    <span className="block text-base font-bold text-[#10233f]">{bundle.displayName}</span>
                    <span className="mt-1 block text-sm text-[#4a5c73]">{bundle.goal || "No goal recorded"}</span>
                    <span className="mt-3 flex flex-wrap gap-2 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#15314a]">
                      <span className="rounded-full bg-sky-100 px-2 py-1">{bundle.leads.length} lead{bundle.leads.length === 1 ? "" : "s"}</span>
                      <span className="rounded-full bg-sky-100 px-2 py-1">{bundle.consultations.length} consult{bundle.consultations.length === 1 ? "" : "s"}</span>
                      <span className="rounded-full bg-sky-100 px-2 py-1">{bundle.screenings.length} screen{bundle.screenings.length === 1 ? "" : "s"}</span>
                    </span>
                    <span className="mt-2 block text-xs uppercase tracking-[0.18em] text-[#6b7b91]">
                      {recordCount} total record{recordCount === 1 ? "" : "s"} · {formatDate(bundle.updatedAt)}
                    </span>
                  </button>
                );
              })}
            </div>

            {!filteredBundles.length ? (
              <div className="mt-6 rounded-2xl border border-dashed border-sky-200 bg-white/75 p-5 text-sm leading-6 text-[#4a5c73]">
                No matching client data yet. If you just saved a form, press Refresh or try searching a different name.
              </div>
            ) : null}
          </aside>

          <section className="rounded-[2rem] border border-white/70 bg-white/92 p-5 shadow-[0_20px_80px_rgba(39,71,132,0.18)] backdrop-blur-xl sm:p-8 print:shadow-none">
            {selectedBundle ? (
              <div>
                <div className="flex flex-col gap-4 border-b border-sky-100 pb-6 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#f02f9b]">Selected Client</p>
                    <h2 className="mt-3 font-[Arial_Narrow] text-4xl uppercase tracking-[0.08em] text-[#10233f] sm:text-6xl">
                      {selectedBundle.displayName}
                    </h2>
                    <p className="mt-3 max-w-3xl text-sm leading-7 text-[#4a5c73]">{selectedBundle.goal || "No main goal recorded."}</p>
                  </div>
                  <div className="rounded-2xl border border-sky-100 bg-white p-4 text-sm text-[#4a5c73]">
                    <p><span className="font-semibold text-[#10233f]">Phone:</span> {displayValue(selectedBundle.phone)}</p>
                    <p className="mt-2"><span className="font-semibold text-[#10233f]">Email:</span> {displayValue(selectedBundle.email)}</p>
                    <p className="mt-2"><span className="font-semibold text-[#10233f]">Latest update:</span> {formatDate(selectedBundle.updatedAt)}</p>
                    <button
                      type="button"
                      onClick={clearSelectedFromPage}
                      className="mt-4 w-full rounded-full border border-sky-100 bg-white px-4 py-2 text-sm font-semibold text-[#15314a] transition hover:border-[#f02f9b]/60 print:hidden"
                    >
                      Clear from page
                    </button>
                    <p className="mt-2 text-xs leading-5 text-[#6b7b91] print:hidden">This only hides it here. Supabase records stay saved.</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <SummaryCard label="Leads" value={selectedBundle.leads.length} />
                  <SummaryCard label="Consultation Forms" value={selectedBundle.consultations.length} />
                  <SummaryCard label="Movement Screenings" value={selectedBundle.screenings.length} />
                </div>

                <div className="mt-8 space-y-8">
                  <LeadsSection leads={selectedBundle.leads} />
                  <ConsultationsSection records={selectedBundle.consultations} />
                  <ScreeningsSection screenings={selectedBundle.screenings} />
                </div>
              </div>
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-sky-200 bg-white p-8 text-center text-[#4a5c73]">
                <h2 className="font-[Arial_Narrow] text-4xl uppercase tracking-[0.08em] text-[#10233f]">No Client Selected</h2>
                <p className="mt-3 text-sm leading-7">Save a lead, consultation form, or screening first, then come back here and search for the client.</p>
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[1.5rem] border border-sky-100 bg-white p-5">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f02f9b]">{label}</p>
      <p className="mt-3 font-[Arial_Narrow] text-5xl text-[#10233f]">{value}</p>
    </div>
  );
}

function EmptyDataCard({ label }: { label: string }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-sky-200 bg-white/75 p-5 text-sm leading-6 text-[#4a5c73]">
      No {label} saved for this client yet.
    </div>
  );
}

function LeadsSection({ leads }: { leads: Lead[] }) {
  return (
    <section className="rounded-[1.5rem] border border-sky-100 bg-white p-5">
      <h3 className="text-xl font-bold text-[#10233f]">Lead Tracker Data</h3>
      {!leads.length ? <EmptyDataCard label="lead tracker data" /> : null}
      <div className="mt-4 space-y-4">
        {leads.map((lead) => (
          <article key={lead.id} className="rounded-2xl border border-sky-100 bg-white p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-lg font-bold text-[#10233f]">{lead.goal}</p>
                <p className="mt-1 text-sm text-[#4a5c73]">{lead.service_interest} · {lead.source} · priority {lead.priority}</p>
              </div>
              <span className="rounded-full bg-[#f02f9b]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[#f02f9b]">{lead.status}</span>
            </div>
            <div className="mt-4 grid gap-3 text-sm text-[#4a5c73] md:grid-cols-2">
              <p><span className="font-semibold text-[#10233f]">Budget:</span> {displayValue(lead.budget)}</p>
              <p><span className="font-semibold text-[#10233f]">Follow-up calls:</span> {lead.follow_up_calls}</p>
              <p><span className="font-semibold text-[#10233f]">Consult sessions completed:</span> {lead.consultation_sessions_completed}</p>
              <p><span className="font-semibold text-[#10233f]">Next follow-up:</span> {formatDate(lead.next_follow_up_at)}</p>
              <p><span className="font-semibold text-[#10233f]">Last contacted:</span> {formatDate(lead.last_contacted_at)}</p>
              <p><span className="font-semibold text-[#10233f]">Created:</span> {formatDate(lead.created_at)}</p>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[#4a5c73]"><span className="font-semibold text-[#10233f]">Notes:</span> {displayValue(lead.notes)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ConsultationsSection({ records }: { records: ConsultationNeedsRecord[] }) {
  return (
    <section className="rounded-[1.5rem] border border-sky-100 bg-white p-5">
      <h3 className="text-xl font-bold text-[#10233f]">Consultation Needs Analysis</h3>
      {!records.length ? <EmptyDataCard label="consultation forms" /> : null}
      <div className="mt-4 space-y-6">
        {records.map((record) => (
          <article key={record.id} className="rounded-2xl border border-sky-100 bg-white p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-lg font-bold text-[#10233f]">{record.goal || "No goal recorded"}</p>
                <p className="mt-1 text-sm text-[#4a5c73]">Consultation date: {formatDate(record.consultation_date)}</p>
              </div>
              <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[#15314a]">Record #{record.id}</span>
            </div>
            <WeeklySchedule form={record.form_data} />
            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              {detailGroups.map((group) => (
                <section key={`${record.id}-${group.title}`} className="rounded-[1.25rem] border border-sky-100 bg-white p-4">
                  <h4 className="font-bold text-[#10233f]">{group.title}</h4>
                  <dl className="mt-4 space-y-4">
                    {group.items.map((item) => (
                      <div key={`${record.id}-${group.title}-${item.key}`}>
                        <dt className="text-xs font-bold uppercase tracking-[0.18em] text-[#f02f9b]">{item.label}</dt>
                        <dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#4a5c73]">{displayValue(record.form_data[item.key])}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function WeeklySchedule({ form }: { form: ConsultationNeedsForm }) {
  return (
    <div className="mt-6 rounded-[1.25rem] border border-sky-100 bg-white p-4">
      <h4 className="font-bold text-[#10233f]">Weekly Schedule</h4>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.18em] text-[#f02f9b]">
            <tr>
              <th className="border-b border-sky-100 px-3 py-3">Day</th>
              <th className="border-b border-sky-100 px-3 py-3">Commitments</th>
              <th className="border-b border-sky-100 px-3 py-3">Training Time</th>
              <th className="border-b border-sky-100 px-3 py-3">Notes</th>
            </tr>
          </thead>
          <tbody>
            {days.map((day) => {
              const entry = form.weeklySchedule?.[day];

              return (
                <tr key={day} className="align-top text-[#4a5c73]">
                  <td className="border-b border-sky-50 px-3 py-3 font-semibold text-[#10233f]">{day}</td>
                  <td className="border-b border-sky-50 px-3 py-3">{displayValue(entry?.commitments)}</td>
                  <td className="border-b border-sky-50 px-3 py-3">{displayValue(entry?.trainingTime)}</td>
                  <td className="border-b border-sky-50 px-3 py-3">{displayValue(entry?.notes)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-4 grid gap-3 text-sm text-[#4a5c73] sm:grid-cols-2">
        <p><span className="font-semibold text-[#10233f]">Days available:</span> {displayValue(form.daysAvailable)}</p>
        <p><span className="font-semibold text-[#10233f]">Preferred training time:</span> {displayValue(form.preferredTrainingTime)}</p>
      </div>
    </div>
  );
}

function ScreeningsSection({ screenings }: { screenings: ScreeningClient[] }) {
  return (
    <section className="rounded-[1.5rem] border border-sky-100 bg-white p-5">
      <h3 className="text-xl font-bold text-[#10233f]">Movement Screening Data</h3>
      {!screenings.length ? <EmptyDataCard label="movement screenings" /> : null}
      <div className="mt-4 space-y-4">
        {screenings.map((screening) => {
          const average = getClientAverageScore(screening);
          const completed = getCompletedTests(screening);
          const total = getTotalTests(screening);

          return (
            <article key={screening.id} className="rounded-2xl border border-sky-100 bg-white p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-lg font-bold text-[#10233f]">{screening.injury || "Movement screening"}</p>
                  <p className="mt-1 text-sm text-[#4a5c73]">Screening date: {formatDate(screening.screeningDate)} · Conducted by {displayValue(screening.conductedBy)}</p>
                </div>
                <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[#15314a]">
                  Avg {average ?? "N/A"} · {completed}/{total} done
                </span>
              </div>
              <div className="mt-4 grid gap-3 text-sm text-[#4a5c73] md:grid-cols-2">
                <p><span className="font-semibold text-[#10233f]">Contact:</span> {displayValue(screening.contact)}</p>
                <p><span className="font-semibold text-[#10233f]">Health:</span> {displayValue(screening.health)}</p>
                <p><span className="font-semibold text-[#10233f]">Warmup notes:</span> {displayValue(screening.warmupNotes)}</p>
                <p><span className="font-semibold text-[#10233f]">Overall notes:</span> {displayValue(screening.overallNotes)}</p>
              </div>
              <div className="mt-5 space-y-4">
                {screening.sections.map((section) => (
                  <div key={`${screening.id}-${section.title}`} className="rounded-[1.25rem] border border-sky-100 p-4">
                    <h4 className="font-bold text-[#10233f]">{section.title}</h4>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      {section.tests.map((test) => (
                        <div key={`${screening.id}-${section.title}-${test.name}`} className="rounded-2xl bg-sky-50/70 p-3 text-sm text-[#4a5c73]">
                          <p className="font-semibold text-[#10233f]">{test.name}</p>
                          <p className="mt-1">Score: {test.score ?? "N/A"} · {test.completed ? "Completed" : "Not completed"}</p>
                          <p className="mt-1 whitespace-pre-wrap">Observations: {displayValue(test.observations)}</p>
                          <p className="mt-1 whitespace-pre-wrap">Notes: {displayValue(test.notes)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
