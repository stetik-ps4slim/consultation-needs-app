"use client";

import { useEffect, useMemo, useState } from "react";
import type { ConsultationNeedsRecord } from "@/lib/consultation-needs";
import type { Lead, LeadStatus } from "@/lib/leads";
import {
  getClientAverageScore,
  getCompletedTests,
  getTotalTests,
  type ScreeningClient
} from "@/lib/movement-screening";

type ApiResponse = {
  records?: ConsultationNeedsRecord[];
  leads?: Lead[];
  clients?: ScreeningClient[];
  error?: string;
};

type OnboardingProfile = {
  key: string;
  name: string;
  phone: string;
  email: string;
  goal: string;
  updatedAt: string;
  leads: Lead[];
  consultations: ConsultationNeedsRecord[];
  screenings: ScreeningClient[];
};

type PipelineStageId =
  | "new-lead"
  | "contacted"
  | "consult-booked"
  | "needs-analysis"
  | "screening"
  | "offer-made"
  | "signed-up";

type PipelineStage = {
  id: PipelineStageId;
  title: string;
  description: string;
};

const pipelineStages: PipelineStage[] = [
  { id: "new-lead", title: "New Lead", description: "New enquiry or record to qualify." },
  { id: "contacted", title: "Contacted", description: "Conversation started, needs next step." },
  { id: "consult-booked", title: "Consult Booked", description: "Consult is booked or ready to run." },
  { id: "needs-analysis", title: "Needs Analysis Done", description: "Consultation form saved." },
  { id: "screening", title: "Screening Done", description: "Movement screen is on file." },
  { id: "offer-made", title: "Offer Made", description: "Plan/proposal sent or decision pending." },
  { id: "signed-up", title: "Signed Up", description: "Won or ready to start." }
];

const stageOrder = Object.fromEntries(pipelineStages.map((stage, index) => [stage.id, index]));

function clean(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function normalizeText(value: string | null | undefined) {
  return clean(value).toLowerCase();
}

function normalizePhone(value: string | null | undefined) {
  return clean(value).replace(/\D/g, "");
}

function makeProfileKey(input: { name?: string; email?: string; phone?: string; contact?: string }) {
  const email = normalizeText(input.email);
  const phone = normalizePhone(input.phone || input.contact);
  const name = normalizeText(input.name);

  return email || phone || name || "unknown-profile";
}

function latestDate(values: Array<string | null | undefined>) {
  const dates = values
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => new Date(right).getTime() - new Date(left).getTime());

  return dates[0] ?? "";
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Not set";
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

function displayValue(value: string | null | undefined) {
  return clean(value) || "Not recorded";
}

function upsertProfile(map: Map<string, OnboardingProfile>, key: string, defaults: Partial<OnboardingProfile>) {
  const existing = map.get(key);

  if (existing) {
    return existing;
  }

  const profile: OnboardingProfile = {
    key,
    name: defaults.name || "Unnamed person",
    phone: defaults.phone || "",
    email: defaults.email || "",
    goal: defaults.goal || "",
    updatedAt: defaults.updatedAt || "",
    leads: [],
    consultations: [],
    screenings: []
  };

  map.set(key, profile);
  return profile;
}

function buildProfiles(
  leads: Lead[],
  consultations: ConsultationNeedsRecord[],
  screenings: ScreeningClient[]
) {
  const profiles = new Map<string, OnboardingProfile>();

  leads.forEach((lead) => {
    const key = makeProfileKey({ name: lead.name, email: lead.email, phone: lead.phone });
    const profile = upsertProfile(profiles, key, {
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      goal: lead.goal,
      updatedAt: lead.created_at
    });

    profile.leads.push(lead);
    profile.name = profile.name || lead.name;
    profile.phone = profile.phone || lead.phone;
    profile.email = profile.email || lead.email;
    profile.goal = profile.goal || lead.goal;
    profile.updatedAt = latestDate([profile.updatedAt, lead.created_at, lead.last_contacted_at, lead.next_follow_up_at]);
  });

  consultations.forEach((consultation) => {
    const key = makeProfileKey({
      name: consultation.client_name,
      email: consultation.client_email,
      phone: consultation.client_phone
    });
    const profile = upsertProfile(profiles, key, {
      name: consultation.client_name,
      phone: consultation.client_phone,
      email: consultation.client_email,
      goal: consultation.goal,
      updatedAt: consultation.updated_at
    });

    profile.consultations.push(consultation);
    profile.name = profile.name || consultation.client_name;
    profile.phone = profile.phone || consultation.client_phone;
    profile.email = profile.email || consultation.client_email;
    profile.goal = profile.goal || consultation.goal;
    profile.updatedAt = latestDate([profile.updatedAt, consultation.updated_at, consultation.created_at]);
  });

  screenings.forEach((screening) => {
    const key = makeProfileKey({ name: screening.name, contact: screening.contact });
    const profile = upsertProfile(profiles, key, {
      name: screening.name,
      phone: screening.contact,
      goal: screening.injury,
      updatedAt: screening.updatedAt
    });

    profile.screenings.push(screening);
    profile.name = profile.name || screening.name;
    profile.phone = profile.phone || screening.contact;
    profile.goal = profile.goal || screening.injury;
    profile.updatedAt = latestDate([profile.updatedAt, screening.updatedAt, screening.createdAt]);
  });

  return [...profiles.values()].sort(
    (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
  );
}

function getLeadStatus(profile: OnboardingProfile): LeadStatus | "none" {
  return profile.leads[0]?.status ?? "none";
}

function getStage(profile: OnboardingProfile): PipelineStageId {
  const status = getLeadStatus(profile);

  if (status === "won") {
    return "signed-up";
  }

  if (status === "proposal-sent") {
    return "offer-made";
  }

  if (profile.screenings.length) {
    return "screening";
  }

  if (profile.consultations.length) {
    return "needs-analysis";
  }

  if (status === "consult-booked") {
    return "consult-booked";
  }

  if (status === "contacted") {
    return "contacted";
  }

  return "new-lead";
}

function getNextAction(profile: OnboardingProfile) {
  const status = getLeadStatus(profile);

  if (!profile.leads.length) {
    return "Add/attach a lead record so the follow-up status is tracked.";
  }

  if (status === "new") {
    return "Contact them and decide whether to book a consultation.";
  }

  if (status === "contacted") {
    return "Book the consultation or set the next follow-up date.";
  }

  if (status === "consult-booked" && !profile.consultations.length) {
    return "Complete and save the consultation needs analysis.";
  }

  if (profile.consultations.length && !profile.screenings.length) {
    return "Complete the movement screening or note why it is not needed.";
  }

  if (profile.screenings.length && status !== "proposal-sent" && status !== "won") {
    return "Choose the best offer and follow up with the plan recommendation.";
  }

  if (status === "proposal-sent") {
    return "Follow up on the offer and mark the result.";
  }

  if (status === "won") {
    return "Ready for active coaching setup.";
  }

  return "Review profile and choose the next best onboarding step.";
}

function getChecklist(profile: OnboardingProfile) {
  const status = getLeadStatus(profile);

  return [
    { label: "Lead captured", done: profile.leads.length > 0 },
    { label: "Contacted", done: !["none", "new"].includes(status) },
    { label: "Consult booked", done: ["consult-booked", "proposal-sent", "won"].includes(status) || profile.consultations.length > 0 },
    { label: "Needs analysis saved", done: profile.consultations.length > 0 },
    { label: "Movement screening saved", done: profile.screenings.length > 0 },
    { label: "Offer / result recorded", done: ["proposal-sent", "won", "lost"].includes(status) }
  ];
}

async function fetchJson(path: string) {
  const response = await fetch(path, { cache: "no-store" });
  const result = (await response.json()) as ApiResponse;

  if (!response.ok) {
    throw new Error(result.error ?? `Could not load ${path}.`);
  }

  return result;
}

export function OnboardingDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [consultations, setConsultations] = useState<ConsultationNeedsRecord[]>([]);
  const [screenings, setScreenings] = useState<ScreeningClient[]>([]);
  const [query, setQuery] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [status, setStatus] = useState("Loading onboarding data...");
  const [isLoading, setIsLoading] = useState(true);

  async function loadOnboardingData() {
    setIsLoading(true);
    setStatus("Loading onboarding data...");

    try {
      const [leadResult, consultationResult, screeningResult] = await Promise.allSettled([
        fetchJson("/api/leads"),
        fetchJson("/api/consultation-needs"),
        fetchJson("/api/screenings")
      ]);

      const nextLeads = leadResult.status === "fulfilled" ? leadResult.value.leads ?? [] : [];
      const nextConsultations =
        consultationResult.status === "fulfilled" ? consultationResult.value.records ?? [] : [];
      const nextScreenings =
        screeningResult.status === "fulfilled" ? screeningResult.value.clients ?? [] : [];
      const loadErrors = [leadResult, consultationResult, screeningResult].flatMap((result) =>
        result.status === "rejected"
          ? [result.reason instanceof Error ? result.reason.message : "A data source failed to load."]
          : []
      );
      const nextProfiles = buildProfiles(nextLeads, nextConsultations, nextScreenings);

      setLeads(nextLeads);
      setConsultations(nextConsultations);
      setScreenings(nextScreenings);
      setSelectedKey((currentKey) => currentKey ?? nextProfiles[0]?.key ?? null);
      setStatus(
        `${nextProfiles.length} onboarding profile${nextProfiles.length === 1 ? "" : "s"} loaded. ${loadErrors.length ? `Some sources need attention: ${loadErrors.join(" ")}` : ""}`
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not load onboarding data.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadOnboardingData();
  }, []);

  const profiles = useMemo(
    () => buildProfiles(leads, consultations, screenings),
    [leads, consultations, screenings]
  );

  const filteredProfiles = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();

    if (!cleanQuery) {
      return profiles;
    }

    return profiles.filter((profile) => {
      const searchableText = [
        profile.name,
        profile.phone,
        profile.email,
        profile.goal,
        getLeadStatus(profile),
        getStage(profile),
        ...profile.leads.flatMap((lead) => [lead.notes, lead.budget, lead.service_interest]),
        ...profile.consultations.flatMap((consultation) => [consultation.goal, consultation.form_data.goalWhy, consultation.form_data.needsFromCoach]),
        ...profile.screenings.flatMap((screening) => [screening.injury, screening.health, screening.overallNotes])
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(cleanQuery);
    });
  }, [profiles, query]);

  const selectedProfile = useMemo(
    () => filteredProfiles.find((profile) => profile.key === selectedKey) ?? filteredProfiles[0] ?? null,
    [filteredProfiles, selectedKey]
  );

  const profilesByStage = useMemo(() => {
    return pipelineStages.map((stage) => ({
      ...stage,
      profiles: filteredProfiles
        .filter((profile) => getStage(profile) === stage.id)
        .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
    }));
  }, [filteredProfiles]);

  const followUpsDue = profiles.filter((profile) =>
    profile.leads.some((lead) => lead.next_follow_up_at && new Date(lead.next_follow_up_at).getTime() <= Date.now())
  ).length;
  const signedUp = profiles.filter((profile) => getStage(profile) === "signed-up").length;
  const incompleteProfiles = profiles.filter((profile) => getChecklist(profile).some((item) => !item.done)).length;

  return (
    <main className="min-h-screen bg-[linear-gradient(160deg,#f7f4ef_0%,#ede8df_100%)] px-4 py-8 text-[#10233f] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1500px]">
        <header className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_24px_90px_rgba(0,0,0,0.08)] backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.36em] text-[#9a6820]">The Upper Notch</p>
              <h1 className="mt-4 max-w-4xl font-[Arial_Narrow] text-5xl uppercase tracking-[0.08em] text-[#10233f] sm:text-7xl">
                Onboarding Pipeline
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[#4a5c73] sm:text-base">
                One connected coach view for leads, consultations, movement screenings, next actions, and sign-up readiness.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href="/" className="rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-[#15314a] transition hover:border-[#9a6820]/60">
                New Consultation
              </a>
              <a href="/clients" className="rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-[#15314a] transition hover:border-[#9a6820]/60">
                Client Hub
              </a>
              <a href="/pricing-presentation" className="rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-[#15314a] transition hover:border-[#9a6820]/60">
                Pricing
              </a>
              <a href="/leads" className="rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-[#15314a] transition hover:border-[#9a6820]/60">
                Lead Tracker
              </a>
              <button
                type="button"
                onClick={loadOnboardingData}
                disabled={isLoading}
                className="rounded-full bg-[#9a6820] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-4">
          <MetricCard label="Profiles" value={profiles.length} helper="Connected people in onboarding" />
          <MetricCard label="Follow-Ups Due" value={followUpsDue} helper="Need your attention now" />
          <MetricCard label="Incomplete" value={incompleteProfiles} helper="Missing at least one step" />
          <MetricCard label="Signed Up" value={signedUp} helper="Won / ready to start" />
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_420px]">
          <div className="rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.06)] backdrop-blur-xl sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-xl font-black text-[#10233f]">Pipeline Board</h2>
                <p className="mt-2 text-sm leading-6 text-[#4a5c73]">{status}</p>
              </div>
              <label className="w-full max-w-md text-xs font-bold uppercase tracking-[0.2em] text-[#9a6820]" htmlFor="onboarding-search">
                Search
                <input
                  id="onboarding-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Name, phone, goal, status, note..."
                  className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm normal-case tracking-normal text-[#10233f] outline-none transition placeholder:text-[#8a98aa] focus:border-[#9a6820] focus:ring-4 focus:ring-[#9a6820]/15"
                />
              </label>
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-7">
              {profilesByStage.map((stage) => (
                <section key={stage.id} className="min-h-[220px] rounded-[1.5rem] border border-stone-200 bg-stone-50/70 p-3">
                  <div className="rounded-2xl bg-white p-3 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9a6820]">{stage.title}</p>
                    <p className="mt-2 text-xs leading-5 text-[#6b7b91]">{stage.description}</p>
                    <p className="mt-3 font-[Arial_Narrow] text-4xl text-[#10233f]">{stage.profiles.length}</p>
                  </div>

                  <div className="mt-3 space-y-3">
                    {stage.profiles.map((profile) => (
                      <button
                        key={profile.key}
                        type="button"
                        onClick={() => setSelectedKey(profile.key)}
                        className={`w-full rounded-2xl border bg-white p-3 text-left text-sm transition ${
                          selectedProfile?.key === profile.key
                            ? "border-[#9a6820] shadow-[0_12px_30px_rgba(154,104,32,0.16)]"
                            : "border-white hover:border-[#9a6820]/50"
                        }`}
                      >
                        <span className="block font-black text-[#10233f]">{profile.name}</span>
                        <span className="mt-1 line-clamp-2 block text-xs leading-5 text-[#4a5c73]">{profile.goal || "No goal recorded"}</span>
                        <span className="mt-3 flex flex-wrap gap-1 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-[#15314a]">
                          <span className="rounded-full bg-stone-100 px-2 py-1">L {profile.leads.length}</span>
                          <span className="rounded-full bg-stone-100 px-2 py-1">C {profile.consultations.length}</span>
                          <span className="rounded-full bg-stone-100 px-2 py-1">S {profile.screenings.length}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>

          <aside className="rounded-[2rem] border border-white/70 bg-white/92 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.06)] backdrop-blur-xl sm:p-6">
            {selectedProfile ? <ProfilePanel profile={selectedProfile} /> : <EmptyProfilePanel />}
          </aside>
        </section>
      </div>
    </main>
  );
}

function MetricCard({ label, value, helper }: { label: string; value: number; helper: string }) {
  return (
    <div className="rounded-[1.5rem] border border-white/70 bg-white/90 p-5 shadow-[0_16px_55px_rgba(0,0,0,0.06)] backdrop-blur-xl">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-[#9a6820]">{label}</p>
      <p className="mt-3 font-[Arial_Narrow] text-5xl text-[#10233f]">{value}</p>
      <p className="mt-2 text-sm text-[#4a5c73]">{helper}</p>
    </div>
  );
}

function ProfilePanel({ profile }: { profile: OnboardingProfile }) {
  const checklist = getChecklist(profile);
  const latestLead = profile.leads[0];
  const latestConsultation = profile.consultations[0];
  const latestScreening = profile.screenings[0];
  const stage = pipelineStages[stageOrder[getStage(profile)]];
  const screeningAverage = latestScreening ? getClientAverageScore(latestScreening) : null;
  const screeningCompleted = latestScreening ? getCompletedTests(latestScreening) : 0;
  const screeningTotal = latestScreening ? getTotalTests(latestScreening) : 0;

  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.28em] text-[#9a6820]">Selected Profile</p>
      <h2 className="mt-3 font-[Arial_Narrow] text-5xl uppercase tracking-[0.08em] text-[#10233f]">{profile.name}</h2>
      <p className="mt-3 text-sm leading-7 text-[#4a5c73]">{profile.goal || "No main goal recorded."}</p>

      <div className="mt-5 rounded-2xl border border-stone-200 bg-white p-4 text-sm leading-7 text-[#4a5c73]">
        <p><span className="font-bold text-[#10233f]">Stage:</span> {stage.title}</p>
        <p><span className="font-bold text-[#10233f]">Phone:</span> {displayValue(profile.phone)}</p>
        <p><span className="font-bold text-[#10233f]">Email:</span> {displayValue(profile.email)}</p>
        <p><span className="font-bold text-[#10233f]">Updated:</span> {formatDate(profile.updatedAt)}</p>
      </div>

      <div className="mt-5 rounded-2xl border border-[#9a6820]/25 bg-[#9a6820]/10 p-4">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#9a6820]">Next Best Action</p>
        <p className="mt-2 text-sm leading-6 text-[#15314a]">{getNextAction(profile)}</p>
      </div>

      <section className="mt-5 rounded-2xl border border-stone-200 bg-white p-4">
        <h3 className="font-black text-[#10233f]">Onboarding Checklist</h3>
        <div className="mt-4 space-y-3">
          {checklist.map((item) => (
            <div key={item.label} className="flex items-center gap-3 text-sm text-[#4a5c73]">
              <span className={`h-3 w-3 rounded-full ${item.done ? "bg-[#9a6820]" : "bg-stone-300"}`} />
              <span className={item.done ? "font-semibold text-[#10233f]" : ""}>{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-5 grid gap-4">
        <MiniRecordCard title="Lead" empty={!latestLead}>
          {latestLead ? (
            <>
              <p>Status: {latestLead.status}</p>
              <p>Interest: {latestLead.service_interest}</p>
              <p>Budget: {displayValue(latestLead.budget)}</p>
              <p>Next follow-up: {formatDate(latestLead.next_follow_up_at)}</p>
              <p className="whitespace-pre-wrap">Notes: {displayValue(latestLead.notes)}</p>
            </>
          ) : null}
        </MiniRecordCard>

        <MiniRecordCard title="Consultation" empty={!latestConsultation}>
          {latestConsultation ? (
            <>
              <p>Date: {formatDate(latestConsultation.consultation_date)}</p>
              <p>Commitment: {displayValue(latestConsultation.form_data.commitmentLevel)}</p>
              <p>Budget: {displayValue(latestConsultation.form_data.weeklyInvestmentRange || latestConsultation.form_data.setBudget)}</p>
              <p className="whitespace-pre-wrap">Needs from coach: {displayValue(latestConsultation.form_data.needsFromCoach)}</p>
            </>
          ) : null}
        </MiniRecordCard>

        <MiniRecordCard title="Movement Screening" empty={!latestScreening}>
          {latestScreening ? (
            <>
              <p>Date: {formatDate(latestScreening.screeningDate)}</p>
              <p>Average score: {screeningAverage ?? "N/A"}</p>
              <p>Completed: {screeningCompleted}/{screeningTotal}</p>
              <p className="whitespace-pre-wrap">Overall notes: {displayValue(latestScreening.overallNotes)}</p>
            </>
          ) : null}
        </MiniRecordCard>
      </section>
    </div>
  );
}

function MiniRecordCard({ title, empty, children }: { title: string; empty: boolean; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 text-sm leading-7 text-[#4a5c73]">
      <h3 className="font-black text-[#10233f]">{title}</h3>
      {empty ? <p className="mt-2">Not saved yet.</p> : <div className="mt-2">{children}</div>}
    </div>
  );
}

function EmptyProfilePanel() {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-6 text-center text-sm leading-7 text-[#4a5c73]">
      <h2 className="font-[Arial_Narrow] text-4xl uppercase tracking-[0.08em] text-[#10233f]">No Profile Selected</h2>
      <p className="mt-3">Add a lead, consultation, or movement screening to start building the onboarding pipeline.</p>
    </div>
  );
}
