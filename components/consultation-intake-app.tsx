"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  ConsultationNeedsForm,
  ConsultationNeedsRecord,
  InvestmentRange,
  WeeklyScheduleEntry,
  YesNo
} from "@/lib/consultation-needs";

const STORAGE_KEY = "consultation-intake-draft";
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

type StoredDraft = {
  form: ConsultationNeedsForm;
  savedRecordId: number | null;
};

const createInitialState = (): ConsultationNeedsForm => ({
  fullName: "",
  dateOfBirth: "",
  age: "",
  gender: "",
  phoneNumber: "",
  emailAddress: "",
  emergencyContactName: "",
  emergencyContactNumber: "",
  occupation: "",
  workSchedule: "",
  referredBy: "",
  consultationDate: new Date().toISOString().slice(0, 10),
  goalWhat: "",
  goalWhere: "",
  goalWhy: "",
  goalWhen: "",
  feelAchieved: "",
  feelNotAchieved: "",
  needsToChange: "",
  needsFromCoach: "",
  commitmentLevel: "",
  commitmentWhy: "",
  pastHabits: "",
  otherConsiderations: "",
  weeklyInvestmentRange: "",
  investmentCloserTo: "",
  howLongWantedToStart: "",
  whatsStoppingYou: "",
  setBudget: "",
  daysAvailable: "",
  preferredTrainingTime: "",
  currentTrainingLevel: "",
  otherActivityStyles: "",
  likedBefore: "",
  dislikedBefore: "",
  favouriteStyles: "",
  favouriteWhy: "",
  leastFavourite: "",
  leastFavouriteWhy: "",
  idealSession: "",
  openToGroupTraining: "",
  preferredSessionDuration: "",
  workedWithCoachBefore: "",
  heartCondition: "",
  chestPain: "",
  dizziness: "",
  asthmaAttack: "",
  bloodSugarIssues: "",
  otherConditionsAffectingExercise: "",
  injuriesHistory: "",
  riskAge: "",
  riskGender: "",
  familyHistory: "",
  smokingStatus: "",
  smokingAmount: "",
  weightKg: "",
  heightCm: "",
  bmi: "",
  waistCircumference: "",
  highBloodPressure: "",
  highBloodPressureDetails: "",
  highCholesterol: "",
  highCholesterolDetails: "",
  highBloodSugar: "",
  highBloodSugarDetails: "",
  takingMedications: "",
  medicationDetails: "",
  hospitalVisits: "",
  hospitalVisitDetails: "",
  pregnancy: "",
  muscleJointIssues: "",
  muscleJointDetails: "",
  signOffName: "",
  signature: "",
  signOffDate: "",
  weeklySchedule: Object.fromEntries(
    days.map((day) => [day, { commitments: "", trainingTime: "", notes: "" }])
  ) as Record<string, WeeklyScheduleEntry>
});

const textFieldKeys: Array<keyof ConsultationNeedsForm> = [
  "fullName",
  "dateOfBirth",
  "age",
  "gender",
  "phoneNumber",
  "emailAddress",
  "emergencyContactName",
  "emergencyContactNumber",
  "occupation",
  "workSchedule",
  "referredBy",
  "consultationDate",
  "goalWhat",
  "goalWhere",
  "goalWhy",
  "goalWhen",
  "feelAchieved",
  "feelNotAchieved",
  "needsToChange",
  "needsFromCoach",
  "commitmentLevel",
  "commitmentWhy",
  "pastHabits",
  "otherConsiderations",
  "weeklyInvestmentRange",
  "investmentCloserTo",
  "howLongWantedToStart",
  "whatsStoppingYou",
  "setBudget",
  "daysAvailable",
  "preferredTrainingTime",
  "currentTrainingLevel",
  "otherActivityStyles",
  "likedBefore",
  "dislikedBefore",
  "favouriteStyles",
  "favouriteWhy",
  "leastFavourite",
  "leastFavouriteWhy",
  "idealSession",
  "openToGroupTraining",
  "preferredSessionDuration",
  "workedWithCoachBefore",
  "heartCondition",
  "chestPain",
  "dizziness",
  "asthmaAttack",
  "bloodSugarIssues",
  "otherConditionsAffectingExercise",
  "injuriesHistory",
  "riskAge",
  "riskGender",
  "familyHistory",
  "smokingStatus",
  "smokingAmount",
  "weightKg",
  "heightCm",
  "bmi",
  "waistCircumference",
  "highBloodPressure",
  "highBloodPressureDetails",
  "highCholesterol",
  "highCholesterolDetails",
  "highBloodSugar",
  "highBloodSugarDetails",
  "takingMedications",
  "medicationDetails",
  "hospitalVisits",
  "hospitalVisitDetails",
  "pregnancy",
  "muscleJointIssues",
  "muscleJointDetails",
  "signOffName",
  "signature",
  "signOffDate"
];

const sections = [
  { id: "client-details", title: "Client Details", blurb: "Core details, work context, and contact information." },
  { id: "goals", title: "Goals", blurb: "Clarify outcome, timeframe, motivation, and support required." },
  { id: "planning", title: "Planning For Success", blurb: "Shape schedule, availability, and realistic training flow." },
  { id: "training", title: "Training Background", blurb: "Understand preferences, history, and ideal session design." },
  { id: "screening", title: "Health Screening", blurb: "Capture APSS, risk factors, and medical considerations." },
  { id: "sign-off", title: "Client Sign-Off", blurb: "Finish with acknowledgement and readiness to proceed." }
] as const;

function SectionCard({
  id,
  title,
  blurb,
  children
}: {
  id: string;
  title: string;
  blurb: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="panel relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 p-6 text-[#10233f] shadow-[0_20px_80px_rgba(39,71,132,0.22)] backdrop-blur-xl sm:p-8 print:break-inside-avoid print:shadow-none">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#f02f9b] to-transparent opacity-70" />
      <div className="mb-6 flex flex-col gap-2 border-b border-sky-100 pb-5">
        <p className="text-xs uppercase tracking-[0.28em] text-[#f02f9b]">Assessment Section</p>
        <h2 className="font-[Arial_Narrow] text-2xl uppercase tracking-[0.08em] text-[#10233f] sm:text-3xl">{title}</h2>
        <p className="max-w-3xl text-sm leading-6 text-[#4a5c73]">{blurb}</p>
      </div>
      {children}
    </section>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text"
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm text-[#15314a]">
      <span className="font-medium">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-[#10233f] shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#f02f9b] focus:ring-2 focus:ring-[#f02f9b]/20"
      />
    </label>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 4
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm text-[#15314a]">
      <span className="font-medium">{label}</span>
      <textarea
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-[#10233f] shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#f02f9b] focus:ring-2 focus:ring-[#f02f9b]/20"
      />
    </label>
  );
}

function ToggleField({
  label,
  value,
  onChange
}: {
  label: string;
  value: YesNo;
  onChange: (value: YesNo) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-sky-100 bg-white/95 p-4 shadow-sm">
      <span className="text-sm font-medium text-[#15314a]">{label}</span>
      <div className="flex gap-2">
        {["Yes", "No"].map((option) => {
          const active = value === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option as YesNo)}
              className={`rounded-full px-4 py-2 text-sm transition ${
                active
                  ? "bg-[#f02f9b] text-white"
                  : "border border-sky-100 bg-white text-[#15314a] hover:border-[#f02f9b]/60"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ChoiceCard({
  label,
  active,
  onClick
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
        active
          ? "border-[#f02f9b] bg-[#f02f9b] text-white"
          : "border-sky-100 bg-white text-[#15314a] hover:border-[#f02f9b]/60"
      }`}
    >
      {label}
    </button>
  );
}

export function ConsultationIntakeApp() {
  const [form, setForm] = useState<ConsultationNeedsForm>(createInitialState);
  const [hydrated, setHydrated] = useState(false);
  const [localStatus, setLocalStatus] = useState("Draft autosaves on this device.");
  const [onlineStatus, setOnlineStatus] = useState(
    "Save online to keep each client form connected in one place."
  );
  const [isSavingOnline, setIsSavingOnline] = useState(false);
  const [savedRecordId, setSavedRecordId] = useState<number | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (stored) {
      try {
        const parsed = JSON.parse(stored) as StoredDraft | ConsultationNeedsForm;

        if (parsed && typeof parsed === "object" && "form" in parsed) {
          setForm({ ...createInitialState(), ...parsed.form });
          setSavedRecordId(parsed.savedRecordId ?? null);
        } else {
          setForm({ ...createInitialState(), ...(parsed as ConsultationNeedsForm) });
        }

        setLocalStatus("Loaded saved draft.");
      } catch {
        setLocalStatus("Starting with a fresh form.");
      }
    }

    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const payload: StoredDraft = {
      form,
      savedRecordId
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    setLocalStatus("Draft autosaved on this device.");
  }, [form, hydrated, savedRecordId]);

  const answeredCount = useMemo(() => {
    const basicCount = textFieldKeys.filter((key) => String(form[key]).trim() !== "").length;
    const scheduleCount = Object.values(form.weeklySchedule).reduce((total, day) => {
      return total + [day.commitments, day.trainingTime, day.notes].filter((entry) => entry.trim() !== "").length;
    }, 0);

    return basicCount + scheduleCount;
  }, [form]);

  const totalQuestions = textFieldKeys.length + days.length * 3;
  const progress = Math.min(100, Math.round((answeredCount / totalQuestions) * 100));
  const clearanceRequired = [
    form.heartCondition,
    form.chestPain,
    form.dizziness,
    form.asthmaAttack,
    form.bloodSugarIssues,
    form.otherConditionsAffectingExercise
  ].includes("Yes");

  const updateField = <K extends keyof ConsultationNeedsForm>(
    key: K,
    value: ConsultationNeedsForm[K]
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateSchedule = (day: string, field: keyof WeeklyScheduleEntry, value: string) => {
    setForm((current) => ({
      ...current,
      weeklySchedule: {
        ...current.weeklySchedule,
        [day]: {
          ...current.weeklySchedule[day],
          [field]: value
        }
      }
    }));
  };

  const handleReset = () => {
    const nextState = createInitialState();
    setForm(nextState);
    setSavedRecordId(null);
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ form: nextState, savedRecordId: null } satisfies StoredDraft)
    );
    setLocalStatus("Form cleared and fresh draft saved.");
    setOnlineStatus("Save online to create a new client record.");
  };

  const saveOnline = async () => {
    setIsSavingOnline(true);
    setOnlineStatus(savedRecordId ? "Updating online record..." : "Saving online record...");

    try {
      const response = await fetch(
        savedRecordId ? `/api/consultation-needs/${savedRecordId}` : "/api/consultation-needs",
        {
          method: savedRecordId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(form)
        }
      );

      const payload = (await response.json()) as {
        error?: string;
        message?: string;
        record?: ConsultationNeedsRecord;
      };

      if (!response.ok) {
        throw new Error(payload.error || "Could not save this form online.");
      }

      if (payload.record?.id) {
        setSavedRecordId(payload.record.id);
      }

      setOnlineStatus(
        `${payload.message || "Consultation form saved."}${payload.record?.id ? ` Record #${payload.record.id}.` : ""}`
      );
    } catch (error) {
      setOnlineStatus(
        error instanceof Error
          ? error.message
          : "Cloud save failed. Your local draft is still safe in this browser."
      );
    } finally {
      setIsSavingOnline(false);
    }
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[linear-gradient(120deg,_#31c7f4_0%,_#84a0ee_50%,_#f09bd5_100%)] text-[#10233f] print:bg-white print:text-black">
      <div className="container-shell section-space relative z-10">
        <div className="mb-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] print:grid-cols-1">
          <div className="panel rounded-[2rem] border border-white/70 bg-white/90 p-6 text-[#10233f] shadow-[0_20px_80px_rgba(39,71,132,0.22)] backdrop-blur-xl sm:p-8">
            <p className="mb-3 text-xs uppercase tracking-[0.35em] text-[#f02f9b]">Upper Notch Coaching</p>
            <h1 className="max-w-3xl font-[Arial_Narrow] text-4xl uppercase tracking-[0.08em] text-[#10233f] sm:text-5xl lg:text-6xl">
              Consultation Needs Analysis App
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#4a5c73] sm:text-lg">
              A clean client intake experience for capturing goals, weekly realities, training history, and pre-exercise screening in one place.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 text-sm text-[#15314a]">
              <span className="rounded-full border border-[#f02f9b]/30 bg-[#f02f9b]/10 text-[#10233f] px-4 py-2">Live consultation ready</span>
              <span className="rounded-full border border-sky-100 bg-white text-[#10233f] px-4 py-2">Print or PDF friendly</span>
              <span className="rounded-full border border-sky-100 bg-white text-[#10233f] px-4 py-2">Save online ready</span>
            </div>
          </div>

          <aside className="panel flex flex-col justify-between rounded-[2rem] border border-white/70 bg-white/90 p-6 text-[#10233f] shadow-[0_20px_80px_rgba(39,71,132,0.22)] backdrop-blur-xl sm:p-8">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-[#f02f9b]">Session Snapshot</p>
              <div className="mt-4 flex items-end gap-3">
                <span className="font-[Arial_Narrow] text-5xl text-[#10233f]">{progress}%</span>
                <span className="pb-2 text-sm text-[#4a5c73]">complete</span>
              </div>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-sky-100">
                <div className="h-full rounded-full bg-gradient-to-r from-[#00afe8] via-[#6c7cf3] to-[#f02f9b]" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-4 text-sm leading-6 text-[#4a5c73]">{localStatus}</p>
              <p className="mt-2 text-sm leading-6 text-[#15314a]">{onlineStatus}</p>
              {savedRecordId ? (
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[#f02f9b]">Connected record #{savedRecordId}</p>
              ) : null}
            </div>

            <div className="mt-8 space-y-3">
              {sections.map((section, index) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="flex items-center justify-between rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-[#15314a] transition hover:border-[#f02f9b]/60"
                >
                  <span>
                    <span className="mr-3 text-[#f02f9b]">0{index + 1}</span>
                    {section.title}
                  </span>
                  <span className="text-[#6b7b91]">Jump</span>
                </a>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3 print:hidden">
              <button
                type="button"
                onClick={saveOnline}
                disabled={isSavingOnline}
                className="rounded-full bg-[#f02f9b] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSavingOnline ? "Saving..." : savedRecordId ? "Update Online" : "Save Online"}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-full border border-sky-100 bg-white/80 px-5 py-3 text-sm font-semibold text-[#15314a] transition hover:border-[#f02f9b]/60"
              >
                Print / Save PDF
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="rounded-full border border-sky-100 bg-white/80 px-5 py-3 text-sm font-semibold text-[#15314a] transition hover:border-[#f02f9b]/60"
              >
                Clear Form
              </button>
            </div>
          </aside>
        </div>

        <div className="grid gap-6">
          <SectionCard id="client-details" title="Client Details" blurb="Capture the basics first so the rest of the conversation stays grounded in the client's actual life context.">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <InputField label="Full Name" value={form.fullName} onChange={(value) => updateField("fullName", value)} />
              <InputField label="Date of Birth" type="date" value={form.dateOfBirth} onChange={(value) => updateField("dateOfBirth", value)} />
              <InputField label="Age" value={form.age} onChange={(value) => updateField("age", value)} />
              <InputField label="Gender" value={form.gender} onChange={(value) => updateField("gender", value)} />
              <InputField label="Phone Number" value={form.phoneNumber} onChange={(value) => updateField("phoneNumber", value)} />
              <InputField label="Email Address" type="email" value={form.emailAddress} onChange={(value) => updateField("emailAddress", value)} />
              <InputField label="Emergency Contact Name" value={form.emergencyContactName} onChange={(value) => updateField("emergencyContactName", value)} />
              <InputField label="Emergency Contact Number" value={form.emergencyContactNumber} onChange={(value) => updateField("emergencyContactNumber", value)} />
              <InputField label="Occupation" value={form.occupation} onChange={(value) => updateField("occupation", value)} />
              <InputField label="Referred By" value={form.referredBy} onChange={(value) => updateField("referredBy", value)} />
              <InputField label="Date" type="date" value={form.consultationDate} onChange={(value) => updateField("consultationDate", value)} />
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <TextareaField
                label="Work Schedule / Physical Demands"
                value={form.workSchedule}
                onChange={(value) => updateField("workSchedule", value)}
                placeholder="Shift times, desk work, manual labour, travel, parenting load..."
              />
              <TextareaField
                label="Anything Else To Consider (Non-Medical)"
                value={form.otherConsiderations}
                onChange={(value) => updateField("otherConsiderations", value)}
                placeholder="Stress, support systems, confidence, schedule chaos, life events..."
              />
            </div>
          </SectionCard>

          <SectionCard id="goals" title="Goals" blurb="This section helps translate a vague desire into a specific coaching target with emotional meaning and practical expectations.">
            <div className="grid gap-4 md:grid-cols-2">
              <InputField label="What" value={form.goalWhat} onChange={(value) => updateField("goalWhat", value)} />
              <InputField label="Where (specific area/focus)" value={form.goalWhere} onChange={(value) => updateField("goalWhere", value)} />
              <InputField label="Why does this matter?" value={form.goalWhy} onChange={(value) => updateField("goalWhy", value)} />
              <InputField label="When (timeframe)" value={form.goalWhen} onChange={(value) => updateField("goalWhen", value)} />
              <InputField label="How will you feel when achieved?" value={form.feelAchieved} onChange={(value) => updateField("feelAchieved", value)} placeholder="2-3 words" />
              <InputField label="How will you feel if not achieved?" value={form.feelNotAchieved} onChange={(value) => updateField("feelNotAchieved", value)} placeholder="2-3 words" />
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <TextareaField label="What needs to change?" value={form.needsToChange} onChange={(value) => updateField("needsToChange", value)} placeholder="Habits, routine, nutrition, training..." />
              <TextareaField label="What do you need from me / the plan?" value={form.needsFromCoach} onChange={(value) => updateField("needsFromCoach", value)} placeholder="Accountability, structure, flexibility, education..." />
              <InputField label="Commitment level (1-10)" value={form.commitmentLevel} onChange={(value) => updateField("commitmentLevel", value)} placeholder="e.g. 8" />
              <TextareaField label="Why that score?" value={form.commitmentWhy} onChange={(value) => updateField("commitmentWhy", value)} placeholder="Example: I'm ready, but work is unpredictable." />
              <TextareaField label="Past habits that led here" value={form.pastHabits} onChange={(value) => updateField("pastHabits", value)} />
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {(["$100-150", "$150-250", "$250-400+"] as InvestmentRange[]).map((range) => (
                <ChoiceCard
                  key={range}
                  label={range}
                  active={form.weeklyInvestmentRange === range}
                  onClick={() => updateField("weeklyInvestmentRange", range)}
                />
              ))}
              <InputField label="Closer To" value={form.investmentCloserTo} onChange={(value) => updateField("investmentCloserTo", value)} />
              <InputField label="How long have you wanted to start?" value={form.howLongWantedToStart} onChange={(value) => updateField("howLongWantedToStart", value)} />
              <InputField label="Set budget" value={form.setBudget} onChange={(value) => updateField("setBudget", value)} />
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <TextareaField label="What's been stopping you?" value={form.whatsStoppingYou} onChange={(value) => updateField("whatsStoppingYou", value)} />
              <div className="rounded-[1.75rem] border border-sky-100 bg-white/95 p-5 text-[#10233f] shadow-sm">
                <p className="text-xs uppercase tracking-[0.25em] text-[#f02f9b]">Coaching Lens</p>
                <p className="mt-3 text-sm leading-7 text-[#4a5c73]">
                  Use this section to listen for mismatch between the stated goal, current routine, and real barriers. Those gaps usually shape the best first-phase plan.
                </p>
              </div>
            </div>
          </SectionCard>

          <SectionCard id="planning" title="Planning For Success" blurb="Build the week with the client instead of around them. This makes adherence more realistic from day one.">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <InputField label="Days per week available" value={form.daysAvailable} onChange={(value) => updateField("daysAvailable", value)} />
              <InputField label="Preferred training time" value={form.preferredTrainingTime} onChange={(value) => updateField("preferredTrainingTime", value as "" | "AM" | "PM")} placeholder="AM or PM" />
              <div className="rounded-2xl border border-sky-100 bg-white/95 p-4 shadow-sm">
                <span className="text-sm font-medium text-[#15314a]">Preferred time quick select</span>
                <div className="mt-3 flex gap-2">
                  {(["AM", "PM"] as const).map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => updateField("preferredTrainingTime", slot)}
                      className={`rounded-full px-4 py-2 text-sm transition ${
                        form.preferredTrainingTime === slot
                          ? "bg-[#f02f9b] text-white"
                          : "border border-sky-100 bg-white text-[#15314a] hover:border-[#f02f9b]/60"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-sky-100 bg-white/95 shadow-sm">
              <div className="grid grid-cols-[0.7fr_1.2fr_0.9fr_1fr] border-b border-sky-100 bg-sky-50 text-xs uppercase tracking-[0.18em] text-[#4a5c73]">
                <div className="px-4 py-3">Day</div>
                <div className="px-4 py-3">Commitments</div>
                <div className="px-4 py-3">Training Time</div>
                <div className="px-4 py-3">Notes</div>
              </div>
              {days.map((day) => (
                <div key={day} className="grid grid-cols-1 border-b border-sky-100 last:border-b-0 md:grid-cols-[0.7fr_1.2fr_0.9fr_1fr]">
                  <div className="flex items-center px-4 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#f02f9b]">{day}</div>
                  <div className="px-4 py-3">
                    <textarea
                      rows={2}
                      value={form.weeklySchedule[day].commitments}
                      onChange={(event) => updateSchedule(day, "commitments", event.target.value)}
                      className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-[#10233f] shadow-sm outline-none focus:border-[#f02f9b] focus:ring-2 focus:ring-[#f02f9b]/20"
                    />
                  </div>
                  <div className="px-4 py-3">
                    <input
                      value={form.weeklySchedule[day].trainingTime}
                      onChange={(event) => updateSchedule(day, "trainingTime", event.target.value)}
                      className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-[#10233f] shadow-sm outline-none focus:border-[#f02f9b] focus:ring-2 focus:ring-[#f02f9b]/20"
                    />
                  </div>
                  <div className="px-4 py-3">
                    <textarea
                      rows={2}
                      value={form.weeklySchedule[day].notes}
                      onChange={(event) => updateSchedule(day, "notes", event.target.value)}
                      className="w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-[#10233f] shadow-sm outline-none focus:border-[#f02f9b] focus:ring-2 focus:ring-[#f02f9b]/20"
                    />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard id="training" title="Training Background" blurb="Past experience and preference tell us how to build a program the client will actually enjoy and stick with.">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <ToggleField label="Worked with a coach before" value={form.workedWithCoachBefore} onChange={(value) => updateField("workedWithCoachBefore", value)} />
              <ToggleField label="Open to group training" value={form.openToGroupTraining} onChange={(value) => updateField("openToGroupTraining", value)} />
              <InputField label="Preferred session duration" value={form.preferredSessionDuration} onChange={(value) => updateField("preferredSessionDuration", value)} placeholder="e.g. 45 mins" />
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <TextareaField label="Current training / activity level" value={form.currentTrainingLevel} onChange={(value) => updateField("currentTrainingLevel", value)} />
              <TextareaField label="Other activity styles" value={form.otherActivityStyles} onChange={(value) => updateField("otherActivityStyles", value)} placeholder="Classes, Pilates, running, sport..." />
              <TextareaField label="What did you like?" value={form.likedBefore} onChange={(value) => updateField("likedBefore", value)} />
              <TextareaField label="What didn't you like?" value={form.dislikedBefore} onChange={(value) => updateField("dislikedBefore", value)} />
              <TextareaField label="Favourite training styles / exercises" value={form.favouriteStyles} onChange={(value) => updateField("favouriteStyles", value)} />
              <TextareaField label="Why those?" value={form.favouriteWhy} onChange={(value) => updateField("favouriteWhy", value)} />
              <TextareaField label="Least favourite / avoid" value={form.leastFavourite} onChange={(value) => updateField("leastFavourite", value)} />
              <TextareaField label="Why those?" value={form.leastFavouriteWhy} onChange={(value) => updateField("leastFavouriteWhy", value)} />
            </div>
            <div className="mt-4">
              <TextareaField label="Ideal session / program (2-3 things)" value={form.idealSession} onChange={(value) => updateField("idealSession", value)} rows={5} />
            </div>
          </SectionCard>

          <SectionCard id="screening" title="Health Screening" blurb="Pre-exercise screening and health context help us coach responsibly and flag when medical clearance is needed.">
            <div className="rounded-[1.75rem] border border-sky-100 bg-white/95 p-5 text-[#10233f] shadow-sm">
              <p className="text-xs uppercase tracking-[0.28em] text-[#f02f9b]">Medical Clearance Status</p>
              <p className={`mt-3 text-lg font-semibold ${clearanceRequired ? "text-[#b91c1c]" : "text-[#166534]"}`}>
                {clearanceRequired ? "Medical clearance required before exercise." : "No stage 1 clearance flags selected."}
              </p>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <ToggleField label="Heart condition / stroke" value={form.heartCondition} onChange={(value) => updateField("heartCondition", value)} />
              <ToggleField label="Chest pain (rest or exercise)" value={form.chestPain} onChange={(value) => updateField("chestPain", value)} />
              <ToggleField label="Dizziness / fainting" value={form.dizziness} onChange={(value) => updateField("dizziness", value)} />
              <ToggleField label="Asthma attack (last 12 months)" value={form.asthmaAttack} onChange={(value) => updateField("asthmaAttack", value)} />
              <ToggleField label="Blood sugar control issues" value={form.bloodSugarIssues} onChange={(value) => updateField("bloodSugarIssues", value)} />
              <ToggleField label="Other conditions affecting exercise" value={form.otherConditionsAffectingExercise} onChange={(value) => updateField("otherConditionsAffectingExercise", value)} />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <TextareaField label="Injuries / conditions / medical history" value={form.injuriesHistory} onChange={(value) => updateField("injuriesHistory", value)} />
              <TextareaField label="Family history of heart disease" value={form.familyHistory} onChange={(value) => updateField("familyHistory", value)} />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <InputField label="Age" value={form.riskAge} onChange={(value) => updateField("riskAge", value)} />
              <InputField label="Gender" value={form.riskGender} onChange={(value) => updateField("riskGender", value)} />
              <ToggleField label="Smoking status" value={form.smokingStatus} onChange={(value) => updateField("smokingStatus", value)} />
              <InputField label="If yes, amount" value={form.smokingAmount} onChange={(value) => updateField("smokingAmount", value)} />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <InputField label="Weight (kg)" value={form.weightKg} onChange={(value) => updateField("weightKg", value)} />
              <InputField label="Height (cm)" value={form.heightCm} onChange={(value) => updateField("heightCm", value)} />
              <InputField label="BMI" value={form.bmi} onChange={(value) => updateField("bmi", value)} />
              <InputField label="Waist circumference (cm)" value={form.waistCircumference} onChange={(value) => updateField("waistCircumference", value)} />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <ToggleField label="High blood pressure" value={form.highBloodPressure} onChange={(value) => updateField("highBloodPressure", value)} />
              <InputField label="Details" value={form.highBloodPressureDetails} onChange={(value) => updateField("highBloodPressureDetails", value)} />
              <ToggleField label="High cholesterol" value={form.highCholesterol} onChange={(value) => updateField("highCholesterol", value)} />
              <InputField label="Details" value={form.highCholesterolDetails} onChange={(value) => updateField("highCholesterolDetails", value)} />
              <ToggleField label="High blood sugar" value={form.highBloodSugar} onChange={(value) => updateField("highBloodSugar", value)} />
              <InputField label="Details" value={form.highBloodSugarDetails} onChange={(value) => updateField("highBloodSugarDetails", value)} />
              <ToggleField label="Taking medications" value={form.takingMedications} onChange={(value) => updateField("takingMedications", value)} />
              <InputField label="Medication details" value={form.medicationDetails} onChange={(value) => updateField("medicationDetails", value)} />
              <ToggleField label="Hospital visits (last 12 months)" value={form.hospitalVisits} onChange={(value) => updateField("hospitalVisits", value)} />
              <InputField label="Hospital visit details" value={form.hospitalVisitDetails} onChange={(value) => updateField("hospitalVisitDetails", value)} />
              <ToggleField label="Pregnancy (if applicable)" value={form.pregnancy} onChange={(value) => updateField("pregnancy", value)} />
              <ToggleField label="Muscle / joint issues" value={form.muscleJointIssues} onChange={(value) => updateField("muscleJointIssues", value)} />
            </div>
            <div className="mt-4">
              <TextareaField label="Muscle / joint details" value={form.muscleJointDetails} onChange={(value) => updateField("muscleJointDetails", value)} />
            </div>
          </SectionCard>

          <SectionCard id="sign-off" title="Client Sign-Off" blurb="Capture acknowledgement at the end of the conversation so the notes can move straight into planning.">
            <div className="grid gap-4 md:grid-cols-3">
              <InputField label="Full Name" value={form.signOffName} onChange={(value) => updateField("signOffName", value)} />
              <InputField label="Signature" value={form.signature} onChange={(value) => updateField("signature", value)} placeholder="Typed signature" />
              <InputField label="Date" type="date" value={form.signOffDate} onChange={(value) => updateField("signOffDate", value)} />
            </div>
            <div className="mt-6 rounded-[1.75rem] border border-sky-100 bg-white/95 p-5 text-sm leading-7 text-[#4a5c73] shadow-sm">
              This form stores a local draft in the browser and can now save online as a reusable client record. That gives us the base to connect future forms for the same client in one place.
            </div>
          </SectionCard>
        </div>
      </div>
    </main>
  );
}
