"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  ConsultationNeedsForm,
  ConsultationNeedsRecord,
  InvestmentRange,
  WeeklyScheduleEntry,
  YesNo
} from "@/lib/consultation-needs";

const STORAGE_KEY = "client-intake-draft";
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

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

// ─── SMALL UI COMPONENTS ──────────────────────────────────────────────────────

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm text-[#15314a]">
      <span className="font-semibold">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </span>
      {children}
    </label>
  );
}

const inputCls = "rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-[#10233f] shadow-sm outline-none transition placeholder:text-stone-400 focus:border-[#9a6820] focus:ring-2 focus:ring-[#9a6820]/15";

function InputField({ label, value, onChange, placeholder, type = "text", required }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; required?: boolean;
}) {
  return (
    <Field label={label} required={required}>
      <input
        type={type}
        lang={type === "date" || type === "datetime-local" ? "en-AU" : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className={inputCls}
      />
    </Field>
  );
}

function TextareaField({ label, value, onChange, placeholder, rows = 3, required }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; rows?: number; required?: boolean;
}) {
  return (
    <Field label={label} required={required}>
      <textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required} className={inputCls + " resize-none"} />
    </Field>
  );
}

function ToggleField({ label, value, onChange }: { label: string; value: YesNo; onChange: (v: YesNo) => void }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <span className="text-sm font-semibold text-[#15314a]">{label}</span>
      <div className="flex gap-2">
        {(["Yes", "No"] as YesNo[]).filter(Boolean).map((opt) => (
          <button key={opt} type="button" onClick={() => onChange(opt as YesNo)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${value === opt ? "bg-[#9a6820] text-white" : "border border-stone-200 bg-white text-[#15314a] hover:border-[#9a6820]/60"}`}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function SectionBlock({ number, title, blurb, children }: { number: string; title: string; blurb: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-6 border-b border-stone-100 pb-5">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-[#9a6820]">Section {number}</p>
        <h2 className="mt-2 font-[Arial_Narrow] text-2xl uppercase tracking-[0.06em] text-[#10233f] sm:text-3xl">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6b7b91]">{blurb}</p>
      </div>
      {children}
    </section>
  );
}

// ─── AGREEMENT CLAUSES ───────────────────────────────────────────────────────

const agreementClauses = [
  {
    number: "1",
    title: "PURPOSE OF CONSULTATION",
    text: "The initial consultation is designed to assess the client's current fitness level, goals, lifestyle, and suitability for personal training services. It may include discussion, movement screening, and light physical activity."
  },
  {
    number: "2",
    title: "HEALTH DECLARATION",
    text: "By attending this consultation, you confirm that:\n• You are physically able to participate in light to moderate exercise\n• You have disclosed any injuries, medical conditions, or limitations\n• You understand it is your responsibility to inform the trainer of any changes to your health status\n\nIf you have any concerns, you should seek medical clearance prior to participation."
  },
  {
    number: "3",
    title: "ASSUMPTION OF RISK",
    text: "You acknowledge that participation in any form of physical activity involves inherent risks, including but not limited to:\n• Muscle soreness\n• Strains or sprains\n• Dizziness or fatigue\n\nBy attending the consultation, you voluntarily accept these risks."
  },
  {
    number: "4",
    title: "LIMITATION OF LIABILITY",
    text: "To the maximum extent permitted by law, Jazzay Sallah Personal Training is not liable for:\n• Any injury, loss, or damage sustained during or after the consultation\n• Any pre-existing condition aggravated during the session\n\nYou participate at your own risk."
  },
  {
    number: "5",
    title: "NO OBLIGATION TO CONTINUE",
    text: "The consultation is an assessment only. There is no obligation to purchase personal training services following the session."
  },
  {
    number: "6",
    title: "PAYMENT & CANCELLATION (IF APPLICABLE)",
    text: "• Consultation fees (if charged) must be paid prior to or at the time of booking\n• A minimum of 12 hours' notice is required to reschedule or cancel\n• Late cancellations or no-shows may result in forfeiture of the session"
  },
  {
    number: "7",
    title: "PROFESSIONAL BOUNDARIES",
    text: "All sessions are conducted in a professional manner. Any inappropriate behaviour may result in termination of the consultation."
  },
  {
    number: "8",
    title: "PRIVACY",
    text: "All personal information collected during the consultation will remain confidential and used solely for the purpose of providing fitness services."
  },
  {
    number: "9",
    title: "ACKNOWLEDGEMENT",
    text: "By signing below, you confirm that you have read, understood, and agree to these terms and conditions."
  }
];

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export function ClientIntakeForm() {
  const [form, setForm] = useState<ConsultationNeedsForm>(createInitialState);
  const [hydrated, setHydrated] = useState(false);
  const [agreementRead, setAgreementRead] = useState(false);
  const [agreementAcknowledged, setAgreementAcknowledged] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ConsultationNeedsForm;
        setForm({ ...createInitialState(), ...parsed });
      }
    } catch { /* ignore */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
  }, [form, hydrated]);

  const updateField = <K extends keyof ConsultationNeedsForm>(key: K, value: ConsultationNeedsForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateSchedule = (day: string, field: keyof WeeklyScheduleEntry, value: string) => {
    setForm((prev) => ({
      ...prev,
      weeklySchedule: { ...prev.weeklySchedule, [day]: { ...prev.weeklySchedule[day], [field]: value } }
    }));
  };

  const clearanceRequired = [
    form.heartCondition, form.chestPain, form.dizziness,
    form.asthmaAttack, form.bloodSugarIssues, form.otherConditionsAffectingExercise
  ].includes("Yes");

  const canSubmit = agreementRead && agreementAcknowledged && form.signOffName.trim() && form.signature.trim() && form.signOffDate;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setIsSubmitting(true);
    setStatusMessage("");

    try {
      const payload = {
        ...form,
        agreementRead,
        agreementAcknowledged,
        signOffDate: form.signOffDate || new Date().toISOString().slice(0, 10)
      };

      const res = await fetch("/api/consultation-needs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = (await res.json()) as { record?: ConsultationNeedsRecord; error?: string };

      if (!res.ok) throw new Error(data.error || "Could not submit the form.");

      window.localStorage.removeItem(STORAGE_KEY);
      setSubmitStatus("success");
      setStatusMessage(`Thank you, ${form.fullName || "your form"}! Your consultation form has been received. We'll be in touch shortly.`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setSubmitStatus("error");
      setStatusMessage(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Thank-you screen ──────────────────────────────────────────────────────
  if (submitStatus === "success") {
    return (
      <main className="min-h-dvh bg-[linear-gradient(160deg,#f7f4ef_0%,#ede8df_100%)] px-5 py-12 sm:px-6">
        <div className="mx-auto max-w-2xl space-y-6">

          {/* Confirmation banner */}
          <div className="rounded-3xl bg-[#15314a] px-8 py-10 text-center shadow-[0_24px_64px_rgba(21,49,74,0.18)]">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-2xl">✓</div>
            <p className="text-xs font-bold uppercase tracking-[0.32em] text-[#d2a86c] mb-3">You&apos;re locked in</p>
            <h1 className="font-[Arial_Narrow] text-3xl uppercase tracking-[0.06em] text-white sm:text-4xl">
              Your spot is locked in
            </h1>
            <p className="mt-4 text-base leading-7 text-white/75">
              Jazzay has everything he needs to prepare for your first session.
            </p>
          </div>

          {/* Intro line */}
          <div className="rounded-3xl border border-white/70 bg-white/90 px-8 py-7 shadow-[0_20px_80px_rgba(0,0,0,0.06)]">
            <p className="text-sm leading-7 text-[#4a5c73]">
              Here&apos;s a quick rundown of what the next two complimentary sessions will look like so you can show up ready.
            </p>
          </div>

          {/* Session 1 */}
          <div className="rounded-3xl border border-white/70 bg-white/90 px-8 py-7 shadow-[0_20px_80px_rgba(0,0,0,0.06)]">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#9a6820]">Session 1</p>
                <h2 className="mt-1 text-xl font-bold text-[#10233f]">Getting To Know You</h2>
              </div>
              <span className="shrink-0 rounded-full border border-stone-200 bg-stone-50 px-4 py-1.5 text-xs font-semibold text-[#6b7b91]">30–45 min · Complimentary</span>
            </div>
            <p className="text-sm leading-7 text-[#4a5c73]">
              Your first session isn&apos;t a workout — it&apos;s a conversation. Jazzay will sit down with you and go through everything in detail: your goals, your training history, your schedule, and run through a movement screening to check for any injuries or limitations to work around. This is where the real coaching starts — nothing gets assumed, everything gets covered.
            </p>
          </div>

          {/* Session 2 */}
          <div className="rounded-3xl border border-white/70 bg-white/90 px-8 py-7 shadow-[0_20px_80px_rgba(0,0,0,0.06)]">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#9a6820]">Session 2</p>
                <h2 className="mt-1 text-xl font-bold text-[#10233f]">Full PT Session &amp; Program Presentation</h2>
              </div>
              <span className="shrink-0 rounded-full border border-stone-200 bg-stone-50 px-4 py-1.5 text-xs font-semibold text-[#6b7b91]">Complimentary</span>
            </div>
            <p className="text-sm leading-7 text-[#4a5c73]">
              Come ready to train. Session 2 is a full hands-on personal training session on the house, followed by Jazzay walking you through your custom program and nutrition starting point. You&apos;ll leave knowing exactly what your coaching looks like and ready to hit the ground running.
            </p>
          </div>

          {/* Sign-off */}
          <div className="rounded-3xl border border-[#e8d5b0] bg-[#fdf8f0] px-8 py-7 text-center shadow-[0_20px_80px_rgba(0,0,0,0.04)]">
            <p className="text-base font-semibold text-[#10233f]">See you soon — let&apos;s get to work.</p>
            <p className="mt-2 text-sm text-[#9a6820] font-medium">Jazzay · Upper Notch Coaching</p>
          </div>

        </div>
      </main>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-dvh bg-[linear-gradient(160deg,#f7f4ef_0%,#ede8df_100%)]">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-3xl px-5 py-5 sm:px-6">
          <p className="text-xs font-black uppercase tracking-[0.36em] text-[#9a6820]">The Upper Notch</p>
          <h1 className="mt-1 font-[Arial_Narrow] text-2xl uppercase tracking-[0.06em] text-[#10233f]">Initial Consultation Form</h1>
          <p className="mt-1 text-sm text-[#6b7b91]">Please complete this form before your consultation. Your answers help us prepare the best session possible.</p>
        </div>
      </header>

      <form onSubmit={handleSubmit}>
        <div className="mx-auto max-w-3xl space-y-6 px-5 py-8 sm:px-6">

          {/* 01 — Client Details */}
          <SectionBlock number="01" title="About You" blurb="Your basic details so we can keep your file complete and get in touch if needed.">
            <div className="grid gap-4 sm:grid-cols-2">
              <InputField label="Full Name" value={form.fullName} onChange={(v) => updateField("fullName", v)} required />
              <InputField label="Date of Birth" type="date" value={form.dateOfBirth} onChange={(v) => updateField("dateOfBirth", v)} />
              <InputField label="Age" value={form.age} onChange={(v) => updateField("age", v)} />
              <InputField label="Gender" value={form.gender} onChange={(v) => updateField("gender", v)} placeholder="e.g. Male, Female, Non-binary" />
              <InputField label="Phone Number" value={form.phoneNumber} onChange={(v) => updateField("phoneNumber", v)} required />
              <InputField label="Email Address" type="email" value={form.emailAddress} onChange={(v) => updateField("emailAddress", v)} required />
              <InputField label="Emergency Contact Name" value={form.emergencyContactName} onChange={(v) => updateField("emergencyContactName", v)} />
              <InputField label="Emergency Contact Number" value={form.emergencyContactNumber} onChange={(v) => updateField("emergencyContactNumber", v)} />
              <InputField label="Occupation" value={form.occupation} onChange={(v) => updateField("occupation", v)} />
              <InputField label="How did you hear about us?" value={form.referredBy} onChange={(v) => updateField("referredBy", v)} />
            </div>
            <div className="mt-4">
              <TextareaField label="Work schedule / physical demands" value={form.workSchedule} onChange={(v) => updateField("workSchedule", v)} placeholder="Shift times, desk work, manual labour, travel, parenting load..." />
            </div>
          </SectionBlock>

          {/* 02 — Goals */}
          <SectionBlock number="02" title="Your Goals" blurb="Tell us what you want to achieve and why it matters to you. There are no wrong answers.">
            <div className="grid gap-4 sm:grid-cols-2">
              <InputField label="What is your main goal?" value={form.goalWhat} onChange={(v) => updateField("goalWhat", v)} placeholder="e.g. Lose weight, build muscle, improve fitness" required />
              <InputField label="Where specifically?" value={form.goalWhere} onChange={(v) => updateField("goalWhere", v)} placeholder="e.g. Overall body, core, upper body..." />
              <InputField label="Why does this goal matter to you?" value={form.goalWhy} onChange={(v) => updateField("goalWhy", v)} required />
              <InputField label="Timeframe" value={form.goalWhen} onChange={(v) => updateField("goalWhen", v)} placeholder="e.g. 3 months, before summer" />
              <InputField label="How will you feel when you achieve it?" value={form.feelAchieved} onChange={(v) => updateField("feelAchieved", v)} placeholder="2–3 words" />
              <InputField label="How will you feel if you don't?" value={form.feelNotAchieved} onChange={(v) => updateField("feelNotAchieved", v)} placeholder="2–3 words" />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <TextareaField label="What needs to change to get there?" value={form.needsToChange} onChange={(v) => updateField("needsToChange", v)} placeholder="Habits, routine, nutrition, mindset..." />
              <TextareaField label="What do you need from a coach / plan?" value={form.needsFromCoach} onChange={(v) => updateField("needsFromCoach", v)} placeholder="Accountability, structure, flexibility, education..." />
              <InputField label="Commitment level (1–10)" value={form.commitmentLevel} onChange={(v) => updateField("commitmentLevel", v)} placeholder="e.g. 8" />
              <TextareaField label="Why that score?" value={form.commitmentWhy} onChange={(v) => updateField("commitmentWhy", v)} placeholder="e.g. Ready but work is unpredictable." />
            </div>
            <div className="mt-4">
              <TextareaField label="Past habits that have led you here" value={form.pastHabits} onChange={(v) => updateField("pastHabits", v)} rows={3} />
            </div>
            <div className="mt-4">
              <TextareaField label="What's been stopping you from starting?" value={form.whatsStoppingYou} onChange={(v) => updateField("whatsStoppingYou", v)} />
            </div>
          </SectionBlock>

          {/* 03 — Planning */}
          <SectionBlock number="03" title="Your Schedule" blurb="Help us build a plan around your real week — not an ideal one.">
            <div className="grid gap-4 sm:grid-cols-2">
              <InputField label="Days available per week" value={form.daysAvailable} onChange={(v) => updateField("daysAvailable", v)} placeholder="e.g. 3–4 days" />
              <div className="flex flex-col gap-2 rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                <span className="text-sm font-semibold text-[#15314a]">Preferred training time</span>
                <div className="flex gap-2">
                  {(["AM", "PM"] as const).map((slot) => (
                    <button key={slot} type="button" onClick={() => updateField("preferredTrainingTime", slot)}
                      className={`rounded-full px-5 py-2 text-sm font-medium transition ${form.preferredTrainingTime === slot ? "bg-[#9a6820] text-white" : "border border-stone-200 bg-white text-[#15314a] hover:border-[#9a6820]/60"}`}>
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Weekly schedule grid */}
            <div className="mt-5 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
              <div className="grid grid-cols-[80px_1fr_120px_1fr] border-b border-stone-100 bg-stone-50 text-xs font-bold uppercase tracking-[0.16em] text-stone-400">
                <div className="px-4 py-3">Day</div>
                <div className="px-4 py-3">Commitments</div>
                <div className="px-4 py-3">Training time</div>
                <div className="px-4 py-3">Notes</div>
              </div>
              {days.map((day) => (
                <div key={day} className="grid grid-cols-1 border-b border-stone-100 last:border-b-0 sm:grid-cols-[80px_1fr_120px_1fr]">
                  <div className="flex items-center px-4 py-4 text-sm font-black uppercase tracking-[0.16em] text-[#9a6820]">{day}</div>
                  <div className="px-3 py-3">
                    <textarea rows={2} value={form.weeklySchedule[day].commitments} onChange={(e) => updateSchedule(day, "commitments", e.target.value)}
                      className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-[#10233f] outline-none focus:border-[#9a6820] focus:ring-1 focus:ring-[#9a6820]/15" />
                  </div>
                  <div className="px-3 py-3">
                    <input value={form.weeklySchedule[day].trainingTime} onChange={(e) => updateSchedule(day, "trainingTime", e.target.value)}
                      className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-[#10233f] outline-none focus:border-[#9a6820] focus:ring-1 focus:ring-[#9a6820]/15" />
                  </div>
                  <div className="px-3 py-3">
                    <textarea rows={2} value={form.weeklySchedule[day].notes} onChange={(e) => updateSchedule(day, "notes", e.target.value)}
                      className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-[#10233f] outline-none focus:border-[#9a6820] focus:ring-1 focus:ring-[#9a6820]/15" />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <TextareaField label="Anything else about your schedule to consider?" value={form.otherConsiderations} onChange={(v) => updateField("otherConsiderations", v)} placeholder="Stress, travel, family load, shift work..." />
            </div>
          </SectionBlock>

          {/* 04 — Training Background */}
          <SectionBlock number="04" title="Training Background" blurb="Your history and preferences help us build a program you'll actually enjoy.">
            <div className="grid gap-4 sm:grid-cols-2">
              <ToggleField label="Worked with a coach before?" value={form.workedWithCoachBefore} onChange={(v) => updateField("workedWithCoachBefore", v)} />
              <ToggleField label="Open to group training?" value={form.openToGroupTraining} onChange={(v) => updateField("openToGroupTraining", v)} />
              <InputField label="Preferred session duration" value={form.preferredSessionDuration} onChange={(v) => updateField("preferredSessionDuration", v)} placeholder="e.g. 45–60 mins" />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <TextareaField label="Current training / activity level" value={form.currentTrainingLevel} onChange={(v) => updateField("currentTrainingLevel", v)} placeholder="What do you currently do, if anything?" />
              <TextareaField label="Other activity styles" value={form.otherActivityStyles} onChange={(v) => updateField("otherActivityStyles", v)} placeholder="Classes, Pilates, running, sport..." />
              <TextareaField label="What have you enjoyed in the past?" value={form.likedBefore} onChange={(v) => updateField("likedBefore", v)} />
              <TextareaField label="What haven't you enjoyed?" value={form.dislikedBefore} onChange={(v) => updateField("dislikedBefore", v)} />
              <TextareaField label="Favourite styles / exercises" value={form.favouriteStyles} onChange={(v) => updateField("favouriteStyles", v)} />
              <TextareaField label="Least favourite / things to avoid" value={form.leastFavourite} onChange={(v) => updateField("leastFavourite", v)} />
            </div>
            <div className="mt-4">
              <TextareaField label="Describe your ideal session or program (2–3 things)" value={form.idealSession} onChange={(v) => updateField("idealSession", v)} rows={4} />
            </div>
          </SectionBlock>

          {/* 05 — Health Screening */}
          <SectionBlock number="05" title="Health Screening" blurb="This section is required for your safety. Please answer honestly — all information is confidential.">
            {clearanceRequired && (
              <div className="mb-5 rounded-xl border border-rose-300/50 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
                ⚠ Based on your answers, medical clearance may be required before exercise. Please discuss this with your GP if needed.
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <ToggleField label="Heart condition or stroke" value={form.heartCondition} onChange={(v) => updateField("heartCondition", v)} />
              <ToggleField label="Chest pain at rest or during exercise" value={form.chestPain} onChange={(v) => updateField("chestPain", v)} />
              <ToggleField label="Dizziness or fainting" value={form.dizziness} onChange={(v) => updateField("dizziness", v)} />
              <ToggleField label="Asthma attack (last 12 months)" value={form.asthmaAttack} onChange={(v) => updateField("asthmaAttack", v)} />
              <ToggleField label="Blood sugar control issues" value={form.bloodSugarIssues} onChange={(v) => updateField("bloodSugarIssues", v)} />
              <ToggleField label="Other conditions affecting exercise" value={form.otherConditionsAffectingExercise} onChange={(v) => updateField("otherConditionsAffectingExercise", v)} />
              <ToggleField label="High blood pressure" value={form.highBloodPressure} onChange={(v) => updateField("highBloodPressure", v)} />
              <InputField label="Blood pressure details (if yes)" value={form.highBloodPressureDetails} onChange={(v) => updateField("highBloodPressureDetails", v)} />
              <ToggleField label="High cholesterol" value={form.highCholesterol} onChange={(v) => updateField("highCholesterol", v)} />
              <InputField label="Cholesterol details (if yes)" value={form.highCholesterolDetails} onChange={(v) => updateField("highCholesterolDetails", v)} />
              <ToggleField label="High blood sugar / diabetes" value={form.highBloodSugar} onChange={(v) => updateField("highBloodSugar", v)} />
              <InputField label="Blood sugar details (if yes)" value={form.highBloodSugarDetails} onChange={(v) => updateField("highBloodSugarDetails", v)} />
              <ToggleField label="Currently taking medications" value={form.takingMedications} onChange={(v) => updateField("takingMedications", v)} />
              <InputField label="Medication details (if yes)" value={form.medicationDetails} onChange={(v) => updateField("medicationDetails", v)} />
              <ToggleField label="Hospital visits (last 12 months)" value={form.hospitalVisits} onChange={(v) => updateField("hospitalVisits", v)} />
              <InputField label="Hospital visit details (if yes)" value={form.hospitalVisitDetails} onChange={(v) => updateField("hospitalVisitDetails", v)} />
              <ToggleField label="Pregnancy (if applicable)" value={form.pregnancy} onChange={(v) => updateField("pregnancy", v)} />
              <ToggleField label="Muscle / joint issues" value={form.muscleJointIssues} onChange={(v) => updateField("muscleJointIssues", v)} />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <TextareaField label="Injuries / conditions / medical history" value={form.injuriesHistory} onChange={(v) => updateField("injuriesHistory", v)} placeholder="List any relevant injuries, surgeries, or ongoing conditions." />
              <TextareaField label="Muscle / joint details" value={form.muscleJointDetails} onChange={(v) => updateField("muscleJointDetails", v)} />
              <TextareaField label="Family history of heart disease" value={form.familyHistory} onChange={(v) => updateField("familyHistory", v)} />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-4">
              <InputField label="Weight (kg)" value={form.weightKg} onChange={(v) => updateField("weightKg", v)} />
              <InputField label="Height (cm)" value={form.heightCm} onChange={(v) => updateField("heightCm", v)} />
              <ToggleField label="Smoker?" value={form.smokingStatus} onChange={(v) => updateField("smokingStatus", v)} />
              <InputField label="Amount (if yes)" value={form.smokingAmount} onChange={(v) => updateField("smokingAmount", v)} />
            </div>
          </SectionBlock>

          {/* 06 — Agreement */}
          <section className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
            {/* Header */}
            <div className="border-b border-stone-100 bg-[#9a6820]/5 px-6 py-5 sm:px-8">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#9a6820]">Section 06</p>
              <h2 className="mt-2 font-[Arial_Narrow] text-2xl uppercase tracking-[0.06em] text-[#10233f] sm:text-3xl">Initial Consultation Agreement</h2>
              <p className="mt-1 text-sm text-[#6b7b91]">The Upper Notch — Please read each clause carefully before signing.</p>
            </div>

            {/* Clauses */}
            <div className="divide-y divide-stone-100 px-6 sm:px-8">
              {agreementClauses.map((clause) => (
                <div key={clause.number} className="py-5">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#9a6820]">{clause.number}. {clause.title}</p>
                  <p className="mt-2 whitespace-pre-line text-sm leading-7 text-[#4a5c73]">{clause.text}</p>
                </div>
              ))}
            </div>

            {/* Acknowledgement checkboxes */}
            <div className="border-t border-stone-200 bg-stone-50 px-6 py-6 sm:px-8">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#9a6820]">Read & Acknowledged</p>
              <div className="mt-4 space-y-3">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={agreementRead}
                    onChange={(e) => setAgreementRead(e.target.checked)}
                    className="mt-0.5 h-5 w-5 shrink-0 accent-[#9a6820] cursor-pointer rounded"
                  />
                  <span className="text-sm leading-6 text-[#15314a]">
                    I have <strong>read and understood</strong> the Initial Consultation Agreement above, including all nine clauses.
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={agreementAcknowledged}
                    onChange={(e) => setAgreementAcknowledged(e.target.checked)}
                    className="mt-0.5 h-5 w-5 shrink-0 accent-[#9a6820] cursor-pointer rounded"
                  />
                  <span className="text-sm leading-6 text-[#15314a]">
                    I <strong>acknowledge and agree</strong> to these terms and conditions, and confirm all health information provided is accurate to the best of my knowledge.
                  </span>
                </label>
              </div>
            </div>

            {/* Sign-off */}
            <div className="border-t border-stone-200 px-6 py-6 sm:px-8">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#9a6820]">Client Sign-Off</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <InputField label="Client Name" value={form.signOffName} onChange={(v) => updateField("signOffName", v)} placeholder="Full name" required />
                <InputField label="Signature (typed)" value={form.signature} onChange={(v) => updateField("signature", v)} placeholder="Type your full name" required />
                <InputField label="Date" type="date" value={form.signOffDate} onChange={(v) => updateField("signOffDate", v)} required />
              </div>
            </div>
          </section>

          {/* Error message */}
          {submitStatus === "error" && (
            <div className="rounded-xl border border-rose-300/50 bg-rose-50 px-5 py-4 text-sm text-rose-700">
              {statusMessage}
            </div>
          )}

          {/* Not ready notice */}
          {!canSubmit && (agreementRead || agreementAcknowledged || form.signOffName || form.signature) && (
            <p className="text-center text-xs text-stone-400">
              Please tick both boxes and complete your name, signature, and date to submit.
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="w-full rounded-2xl bg-[#9a6820] py-4 text-base font-black uppercase tracking-[0.12em] text-white shadow-sm transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Submitting..." : "Submit Consultation Form"}
          </button>

          <p className="pb-4 text-center text-xs text-stone-400">
            Your form is autosaved in this browser as you fill it in. Submitting sends it directly to The Upper Notch.
          </p>
        </div>
      </form>
    </main>
  );
}
