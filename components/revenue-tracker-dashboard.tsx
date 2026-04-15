"use client";

import { useEffect, useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Scorecard = {
  leadsContacted: number;
  replies: number;
  callsBooked: number;
  consultsBooked: number;
  consultsCompleted: number;
  clientsSigned: number;
  sessionsBooked: number;
};

const emptyScorecard = (): Scorecard => ({
  leadsContacted: 0,
  replies: 0,
  callsBooked: 0,
  consultsBooked: 0,
  consultsCompleted: 0,
  clientsSigned: 0,
  sessionsBooked: 0
});

// ─── Packages ────────────────────────────────────────────────────────────────

const PACKAGES = [
  { label: "Foundation", weekly: 129, color: "text-sky-700 bg-sky-50 border-sky-200" },
  { label: "Transformation", weekly: 199, color: "text-amber-700 bg-amber-50 border-amber-200" },
  { label: "Elite", weekly: 289, color: "text-emerald-700 bg-emerald-50 border-emerald-200" }
];

// ─── Scripts ─────────────────────────────────────────────────────────────────

type ScriptStep = { type: string; lines: string[]; isPause?: boolean };

type LeadScript = {
  id: string;
  label: string;
  heat: string;
  heatColor: string;
  steps: ScriptStep[];
};

const LEAD_SCRIPTS: LeadScript[] = [
  {
    id: "direct",
    label: "Direct Enquiry",
    heat: "Hottest",
    heatColor: "bg-rose-100 text-rose-700 border-rose-200",
    steps: [
      { type: "OPENER", lines: ["Hey, it's Jazzay Sallah calling from Fitness First Richmond. How are you going today?"] },
      { type: "PAUSE", lines: ["Let them respond, then lower your tone."], isPause: true },
      { type: "REASON FOR CALL", lines: ["The reason I'm calling is because you reached out about personal training…", "So I wanted to see what you're looking to achieve and get you booked in."] },
      { type: "SOFT HOOK", lines: ["What made you reach out right now?"] },
      { type: "QUALIFY", lines: ["What specific result are you trying to achieve?", "What's been stopping you up until now?", "How long has that been frustrating you?"] },
      { type: "COMMITMENT FILTER", lines: ["On a scale of 1 to 10, how serious are you about fixing this right now?"] },
      { type: "POSITION", lines: ["Got it. I'll be straight with you. I get the best results with people who are ready to follow structure, stay accountable, and implement straight away.", "From what you've told me, you sound like someone who'd do really well with that."] },
      { type: "TRANSITION", lines: ["The next step is bringing you in for a consultation so we can map everything out properly.", "I've only got a couple of spots left this week."] },
      { type: "CLOSE", lines: ["Would Monday or Wednesday work better for you?"] },
      { type: "URGENCY", lines: ["Just to confirm, you'd be ready to start if everything makes sense, correct?", "Because if nothing changes, how do you think you'll feel in 3 to 6 months being in the same position?"] }
    ]
  },
  {
    id: "reception",
    label: "Reception Enquiry",
    heat: "Hot",
    heatColor: "bg-orange-100 text-orange-700 border-orange-200",
    steps: [
      { type: "OPENER", lines: ["Hey, it's Jazzay from Fitness First Richmond. I heard you had a chat with reception about PT. How are you going?"] },
      { type: "REASON FOR CALL", lines: ["The reason I'm calling is because you're looking to get started, so I wanted to reach out personally."] },
      { type: "SOFT HOOK", lines: ["What are you looking to work on at the moment?"] },
      { type: "QUALIFY", lines: ["What result are you trying to achieve?", "What's been the biggest challenge so far?", "Have you tried anything before?"] },
      { type: "COMMITMENT FILTER", lines: ["How serious are you about making a change right now, say 1 to 10?"] },
      { type: "POSITION", lines: ["Yeah, that makes sense. That's exactly what I specialise in: getting people from where you are now to that result with structure and accountability."] },
      { type: "TRANSITION", lines: ["The next step is getting you in for a consultation so we can build this out properly. I've only got limited spots available this week."] },
      { type: "CLOSE", lines: ["Would Monday or Wednesday suit you better?"] },
      { type: "URGENCY", lines: ["If everything makes sense, you'd be ready to start straight away?"] }
    ]
  },
  {
    id: "fitness-packs",
    label: "Fitness Packs",
    heat: "Warm Hot",
    heatColor: "bg-yellow-100 text-yellow-700 border-yellow-200",
    steps: [
      { type: "OPENER", lines: ["Hey, it's Jazzay from Fitness First Richmond. How are you going?"] },
      { type: "REASON", lines: ["I'm your trainer for the sessions you grabbed when you joined.", "So I wanted to get your first one locked in."] },
      { type: "SOFT HOOK", lines: ["What are you wanting to get out of those sessions?"] },
      { type: "LIGHT QUALIFY", lines: ["Any specific goals?", "Anything you've struggled with before?"] },
      { type: "POSITION", lines: ["Perfect. That's exactly what we'll focus on and build from."] },
      { type: "TRANSITION", lines: ["Let's get your first session booked in."] },
      { type: "CLOSE", lines: ["When are you usually in the gym?", "Then: Sweet, I'll lock you in for that time."] },
      { type: "OPTIONAL SEED", lines: ["If you get a lot out of these, we can look at building something longer-term after."] }
    ]
  },
  {
    id: "new-joiners",
    label: "New Joiners",
    heat: "Warm",
    heatColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
    steps: [
      { type: "OPENER", lines: ["Hey, it's Jazzay from Fitness First Richmond. Just checking in to see how you're settling into the gym so far?"] },
      { type: "REASON", lines: ["I wanted to see how your training's been going since you joined."] },
      { type: "SOFT HOOK", lines: ["What have you been working on so far?"] },
      { type: "QUALIFY", lines: ["Are you following a structured program?", "Do you feel like you've got a clear plan?"] },
      { type: "AWARENESS SHIFT", lines: ["Yeah, that's super common. Most people come in motivated but without structure, and that's where progress stalls."] },
      { type: "POSITION", lines: ["What I do is build that structure for you so you actually see progress."] },
      { type: "OFFER", lines: ["What I can do is run you through a couple of sessions and map everything out properly."] },
      { type: "CLOSE", lines: ["When are you next in the gym?"] },
      { type: "URGENCY", lines: ["Better to get it right early instead of spinning your wheels for months."] }
    ]
  },
  {
    id: "mia",
    label: "MIA / Birthday Lists",
    heat: "Coldest",
    heatColor: "bg-slate-100 text-slate-600 border-slate-200",
    steps: [
      { type: "OPENER", lines: ["Hey, it's Jazzay from Fitness First Richmond. How are you going?"] },
      { type: "REASON", lines: ["Just giving you a quick check-in. Haven't seen you around much lately."] },
      { type: "SOFT HOOK", lines: ["How's your training been going?"] },
      { type: "QUALIFY", lines: ["Still getting sessions in consistently?", "Or has it been a bit on and off?"] },
      { type: "RELATE", lines: ["Yeah, that happens a lot. Life gets busy and structure drops off."] },
      { type: "POSITION", lines: ["That's exactly where I come in: getting you back on track with structure and accountability."] },
      { type: "OFFER", lines: ["What I can do is run you through a couple of sessions to rebuild momentum."] },
      { type: "CLOSE", lines: ["When are you usually free to come in?"] },
      { type: "URGENCY", lines: ["Once you're back into a routine, everything starts falling into place again."] }
    ]
  }
];

const OBJECTION_STEPS: ScriptStep[] = [
  { type: "IF THEY SAY IT'S TOO EXPENSIVE", lines: ["I get that."], isPause: true },
  { type: "PAUSE", lines: [""], isPause: true },
  { type: "REFRAME", lines: ["Let me ask you: what's more important right now, saving money or actually getting the result you want?"] },
  { type: "ANCHOR BACK", lines: ["Then go back into their goal and what they said they want to fix."] }
];

// ─── Storage keys ─────────────────────────────────────────────────────────────

const KEY_GOAL = "tun-monthly-goal";
const KEY_WEEKLY = "tun-weekly-revenue";
const scorecardKey = (date: string) => `tun-scorecard-${date}`;
const notesKey = (date: string) => `tun-notes-${date}`;

function todayStr() {
  return new Date().toLocaleDateString("en-AU", { year: "numeric", month: "2-digit", day: "2-digit" }).split("/").reverse().join("-");
}

function fmtAUD(n: number) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(n);
}

// ─── Step type label colours ─────────────────────────────────────────────────

const stepColor: Record<string, string> = {
  "OPENER": "bg-[#15314a] text-white",
  "REASON": "bg-[#15314a] text-white",
  "REASON FOR CALL": "bg-[#15314a] text-white",
  "SOFT HOOK": "bg-[#9a6820] text-white",
  "QUALIFY": "bg-violet-700 text-white",
  "LIGHT QUALIFY": "bg-violet-700 text-white",
  "COMMITMENT FILTER": "bg-rose-700 text-white",
  "AWARENESS SHIFT": "bg-sky-700 text-white",
  "POSITION": "bg-emerald-700 text-white",
  "TRANSITION": "bg-teal-700 text-white",
  "CLOSE": "bg-[#d2a86c] text-[#10233f]",
  "URGENCY": "bg-rose-600 text-white",
  "OPTIONAL SEED": "bg-slate-500 text-white",
  "OFFER": "bg-indigo-700 text-white",
  "RELATE": "bg-slate-600 text-white",
  "ANCHOR BACK": "bg-slate-600 text-white",
  "REFRAME": "bg-emerald-700 text-white",
  "IF THEY SAY IT'S TOO EXPENSIVE": "bg-rose-800 text-white",
  "PAUSE": "bg-stone-300 text-stone-600"
};

function stepBadge(type: string) {
  const cls = stepColor[type] ?? "bg-stone-200 text-stone-700";
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest ${cls}`}>
      {type}
    </span>
  );
}

// ─── Scorecard counter ───────────────────────────────────────────────────────

function Counter({ label, value, onChange, accent = false }: {
  label: string; value: number; onChange: (v: number) => void; accent?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-4 flex flex-col gap-2 ${accent ? "border-[#d2a86c] bg-[#fdf3e3]" : "border-stone-200 bg-white"}`}>
      <p className={`text-xs font-semibold uppercase tracking-widest ${accent ? "text-[#9a6820]" : "text-[#6b7b91]"}`}>{label}</p>
      <div className="flex items-center gap-3 mt-1">
        <button onClick={() => onChange(Math.max(0, value - 1))}
          className="h-8 w-8 rounded-full border border-stone-200 bg-white text-[#15314a] font-bold text-lg flex items-center justify-center hover:bg-stone-100 transition">−</button>
        <span className={`text-3xl font-black min-w-[2ch] text-center ${accent ? "text-[#9a6820]" : "text-[#10233f]"}`}>{value}</span>
        <button onClick={() => onChange(value + 1)}
          className={`h-8 w-8 rounded-full font-bold text-lg flex items-center justify-center transition ${accent ? "bg-[#9a6820] text-white hover:bg-[#7a5218]" : "bg-[#15314a] text-white hover:bg-[#1e3f60]"}`}>+</button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function RevenueTrackerDashboard() {
  const today = todayStr();

  // Goal + revenue
  const [monthlyGoal, setMonthlyGoal] = useState(5000);
  const [weeklyRevenue, setWeeklyRevenue] = useState(0);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("5000");

  // Scorecard
  const [scorecard, setScorecard] = useState<Scorecard>(emptyScorecard());
  const [savedToday, setSavedToday] = useState(false);

  // Notes
  const [notes, setNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(false);

  // Script tab
  const [activeScript, setActiveScript] = useState("direct");

  // Hydrate from localStorage
  useEffect(() => {
    const g = localStorage.getItem(KEY_GOAL);
    const w = localStorage.getItem(KEY_WEEKLY);
    const s = localStorage.getItem(scorecardKey(today));
    const n = localStorage.getItem(notesKey(today));
    if (g) { setMonthlyGoal(Number(g)); setGoalInput(g); }
    if (w) setWeeklyRevenue(Number(w));
    if (s) setScorecard(JSON.parse(s));
    if (n) setNotes(n);
  }, [today]);

  // Revenue maths
  const monthlyRevenue = weeklyRevenue * 4.33;
  const gap = Math.max(0, monthlyGoal - monthlyRevenue);
  const progress = Math.min(100, (monthlyRevenue / monthlyGoal) * 100);

  // Fastest path: how many of each tier closes the gap
  const fastestPath = PACKAGES.map((pkg) => ({
    ...pkg,
    monthly: pkg.weekly * 4.33,
    needed: Math.ceil(gap / (pkg.weekly * 4.33))
  }));

  function saveGoal() {
    const val = Math.max(0, Number(goalInput) || 0);
    setMonthlyGoal(val);
    localStorage.setItem(KEY_GOAL, String(val));
    setEditingGoal(false);
  }

  function updateWeekly(val: number) {
    setWeeklyRevenue(val);
    localStorage.setItem(KEY_WEEKLY, String(val));
  }

  function updateScorecard(key: keyof Scorecard, val: number) {
    setScorecard((prev) => ({ ...prev, [key]: val }));
    setSavedToday(false);
  }

  function saveDay() {
    localStorage.setItem(scorecardKey(today), JSON.stringify(scorecard));
    localStorage.setItem(notesKey(today), notes);
    setSavedToday(true);
    setNotesSaved(true);
    setTimeout(() => { setSavedToday(false); setNotesSaved(false); }, 2500);
  }

  function resetDay() {
    const fresh = emptyScorecard();
    setScorecard(fresh);
    setNotes("");
    localStorage.removeItem(scorecardKey(today));
    localStorage.removeItem(notesKey(today));
    setSavedToday(false);
  }

  const activeScriptData = LEAD_SCRIPTS.find((s) => s.id === activeScript)!;

  return (
    <main className="min-h-screen bg-[linear-gradient(160deg,#f7f4ef_0%,#ede8df_100%)] text-[#10233f]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">

        {/* Nav */}
        <nav className="flex flex-wrap items-center gap-2 print:hidden">
          <span className="rounded-full bg-[#fdf3e3] px-4 py-1.5 text-xs font-semibold tracking-widest text-[#9a6820] uppercase">The Upper Notch</span>
          {[
            { href: "/", label: "New Consultation" },
            { href: "/clients", label: "Client Hub" },
            { href: "/leads", label: "Lead Tracker" },
            { href: "/onboarding", label: "Onboarding" },
            { href: "/screening", label: "Movement Screening" }
          ].map((l) => (
            <a key={l.href} href={l.href}
              className="rounded-full border border-stone-200 bg-white/80 px-4 py-2 text-sm font-semibold text-[#15314a] transition hover:border-[#9a6820]/60">
              {l.label}
            </a>
          ))}
        </nav>

        {/* Header */}
        <div className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.07)] sm:p-8">
          <p className="text-xs uppercase tracking-[0.32em] text-[#9a6820]">Daily Operations</p>
          <h1 className="mt-1 text-3xl font-bold text-[#10233f] sm:text-4xl">Revenue Tracker</h1>
          <p className="mt-1 text-sm text-[#4a5c73]">
            {new Date().toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>

        {/* ── Revenue goal + fastest path ──────────────────────────── */}
        <div className="grid gap-4 lg:grid-cols-2">

          {/* Goal card */}
          <div className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.07)]">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs uppercase tracking-widest text-[#9a6820]">Monthly Goal</p>
                {editingGoal ? (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-lg font-bold text-[#10233f]">$</span>
                    <input
                      type="number"
                      value={goalInput}
                      onChange={(e) => setGoalInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveGoal()}
                      className="w-32 rounded-xl border border-[#9a6820] bg-white px-3 py-1.5 text-xl font-bold text-[#10233f] outline-none focus:ring-2 focus:ring-[#9a6820]/20"
                      autoFocus
                    />
                    <button onClick={saveGoal}
                      className="rounded-full bg-[#9a6820] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#7a5218]">Save</button>
                    <button onClick={() => setEditingGoal(false)}
                      className="rounded-full border border-stone-200 px-3 py-1.5 text-sm text-[#6b7b91] hover:border-stone-300">Cancel</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-3xl font-black text-[#10233f]">{fmtAUD(monthlyGoal)}</span>
                    <button onClick={() => setEditingGoal(true)}
                      className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-semibold text-[#6b7b91] hover:border-[#9a6820]/60 hover:text-[#9a6820]">
                      Edit goal
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Current weekly input */}
            <div className="mb-4">
              <label className="text-xs font-semibold uppercase tracking-widest text-[#6b7b91]">Current weekly client revenue ($)</label>
              <input
                type="number"
                value={weeklyRevenue || ""}
                onChange={(e) => updateWeekly(Number(e.target.value) || 0)}
                placeholder="e.g. 1200"
                className="mt-1.5 w-full rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-[#10233f] shadow-sm outline-none focus:border-[#9a6820] focus:ring-2 focus:ring-[#9a6820]/20"
              />
              <p className="mt-1 text-xs text-[#6b7b91]">≈ {fmtAUD(monthlyRevenue)}/month estimated</p>
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex items-end justify-between mb-1.5">
                <span className="text-sm font-semibold text-[#10233f]">{fmtAUD(monthlyRevenue)}</span>
                <span className="text-xs text-[#6b7b91]">
                  {gap > 0 ? `${fmtAUD(gap)} to go` : "🏆 Goal hit!"}
                </span>
              </div>
              <div className="h-4 overflow-hidden rounded-full bg-stone-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#d2a86c] to-[#9a6820] transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between mt-1 text-xs text-[#6b7b91]">
                <span>$0</span>
                <span className="font-bold text-[#9a6820]">{progress.toFixed(1)}%</span>
                <span>{fmtAUD(monthlyGoal)}</span>
              </div>
            </div>
          </div>

          {/* Fastest path card */}
          <div className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.07)]">
            <p className="text-xs uppercase tracking-widest text-[#9a6820] mb-1">Fastest Path to Goal</p>
            <p className="text-sm text-[#4a5c73] mb-4">New clients needed to close the {fmtAUD(gap)} gap</p>
            <div className="space-y-3">
              {fastestPath.map((pkg) => (
                <div key={pkg.label} className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${pkg.color}`}>
                  <div>
                    <p className="font-bold text-sm">{pkg.label}</p>
                    <p className="text-xs opacity-70">{fmtAUD(pkg.weekly)}/wk · {fmtAUD(pkg.monthly)}/mo per client</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black">{gap <= 0 ? "✓" : pkg.needed}</p>
                    <p className="text-xs opacity-70">{gap <= 0 ? "goal hit" : "client" + (pkg.needed === 1 ? "" : "s")}</p>
                  </div>
                </div>
              ))}
              {gap > 0 && (
                <div className="rounded-2xl border border-[#e8d5b0] bg-[#fdf3e3] px-4 py-3">
                  <p className="text-xs font-semibold text-[#9a6820] uppercase tracking-widest mb-1">Fastest mix</p>
                  <p className="text-sm text-[#4a5c73]">
                    <strong className="text-[#10233f]">1 Elite</strong> closes {fmtAUD(289 * 4.33)} — then{" "}
                    <strong className="text-[#10233f]">{Math.ceil(Math.max(0, gap - 289 * 4.33) / (199 * 4.33))} Transformation</strong> for the rest.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Daily Scorecard ───────────────────────────────────────── */}
        <div className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.07)] sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-[#9a6820]">Daily Scorecard</p>
              <h2 className="mt-0.5 text-xl font-bold text-[#10233f]">Today's Numbers</h2>
            </div>
            <div className="flex gap-2">
              <button onClick={saveDay}
                className={`rounded-full px-5 py-2 text-sm font-semibold text-white transition ${savedToday ? "bg-emerald-600" : "bg-[#9a6820] hover:bg-[#7a5218]"}`}>
                {savedToday ? "✓ Saved" : "Save Day"}
              </button>
              <button onClick={resetDay}
                className="rounded-full border border-stone-200 bg-white px-5 py-2 text-sm font-semibold text-[#15314a] transition hover:border-rose-300 hover:text-rose-600">
                Reset Day
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
            <Counter label="Leads Contacted" value={scorecard.leadsContacted} onChange={(v) => updateScorecard("leadsContacted", v)} />
            <Counter label="Replies" value={scorecard.replies} onChange={(v) => updateScorecard("replies", v)} />
            <Counter label="Calls Booked" value={scorecard.callsBooked} onChange={(v) => updateScorecard("callsBooked", v)} />
            <Counter label="Consults Booked" value={scorecard.consultsBooked} onChange={(v) => updateScorecard("consultsBooked", v)} accent />
            <Counter label="Consults Completed" value={scorecard.consultsCompleted} onChange={(v) => updateScorecard("consultsCompleted", v)} />
            <Counter label="Clients Signed" value={scorecard.clientsSigned} onChange={(v) => updateScorecard("clientsSigned", v)} accent />
            <Counter label="Sessions Booked" value={scorecard.sessionsBooked} onChange={(v) => updateScorecard("sessionsBooked", v)} />
          </div>
        </div>

        {/* ── Scripts ───────────────────────────────────────────────── */}
        <div className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.07)] sm:p-8">
          <p className="text-xs uppercase tracking-widest text-[#9a6820] mb-1">Call Scripts</p>
          <h2 className="text-xl font-bold text-[#10233f] mb-5">Scripts by Lead Type</h2>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {LEAD_SCRIPTS.map((s) => (
              <button key={s.id} onClick={() => setActiveScript(s.id)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  activeScript === s.id
                    ? "border-[#9a6820] bg-[#9a6820] text-white"
                    : "border-stone-200 bg-white text-[#15314a] hover:border-[#9a6820]/60"
                }`}>
                {s.label}
              </button>
            ))}
          </div>

          {/* Active script */}
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <h3 className="text-lg font-bold text-[#10233f]">{activeScriptData.label}</h3>
              <span className={`rounded-full border px-3 py-0.5 text-xs font-bold uppercase tracking-widest ${activeScriptData.heatColor}`}>
                {activeScriptData.heat}
              </span>
            </div>

            <div className="space-y-3">
              {activeScriptData.steps.map((step, i) => (
                <div key={i} className={`rounded-xl p-4 ${step.isPause ? "bg-stone-100 border border-stone-200" : "bg-white border border-stone-200"}`}>
                  <div className="mb-2">{stepBadge(step.type)}</div>
                  {step.lines.filter(l => l).map((line, j) => (
                    <p key={j} className={`text-sm leading-6 ${step.isPause ? "text-[#6b7b91] italic" : "text-[#10233f]"} ${j > 0 ? "mt-1.5" : ""}`}>
                      {line}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Objection Handling ─────────────────────────────────────── */}
        <div className="rounded-[2rem] border border-rose-100 bg-white/90 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.07)] sm:p-8">
          <p className="text-xs uppercase tracking-widest text-rose-600 mb-1">Objection Handling</p>
          <h2 className="text-xl font-bold text-[#10233f] mb-5">Common Objections</h2>

          <div className="rounded-2xl border border-rose-100 bg-rose-50 p-5">
            <h3 className="font-bold text-rose-800 mb-4">If They Say It's Too Expensive</h3>
            <div className="space-y-3">
              {OBJECTION_STEPS.map((step, i) => (
                <div key={i} className={`rounded-xl p-4 ${step.isPause ? "bg-white/60 border border-rose-100" : "bg-white border border-rose-100"}`}>
                  <div className="mb-2">{stepBadge(step.type)}</div>
                  {step.lines.filter(l => l).map((line, j) => (
                    <p key={j} className={`text-sm leading-6 ${step.isPause ? "text-[#6b7b91] italic" : "text-[#10233f]"}`}>{line}</p>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Notes ─────────────────────────────────────────────────── */}
        <div className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.07)] sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-[#9a6820]">Daily Notes</p>
              <h2 className="mt-0.5 text-xl font-bold text-[#10233f]">Follow-ups & Lessons</h2>
            </div>
            <button onClick={saveDay}
              className={`rounded-full px-5 py-2 text-sm font-semibold text-white transition ${notesSaved ? "bg-emerald-600" : "bg-[#9a6820] hover:bg-[#7a5218]"}`}>
              {notesSaved ? "✓ Saved" : "Save Notes"}
            </button>
          </div>
          <textarea
            rows={5}
            value={notes}
            onChange={(e) => { setNotes(e.target.value); setNotesSaved(false); }}
            placeholder="Who needs a follow-up? What objections came up? What content landed? What will you do differently tomorrow?"
            className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-[#10233f] shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#9a6820] focus:ring-2 focus:ring-[#9a6820]/20 resize-none"
          />
        </div>

      </div>
    </main>
  );
}
