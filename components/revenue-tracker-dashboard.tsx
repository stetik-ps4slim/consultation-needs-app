"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────


const CHECKLIST_ITEMS = [
  { title: "Contact 30 leads",        detail: "Direct enquiries first, then Reception, Fitness Packs, New Joiners, and colder lists." },
  { title: "Create 10 conversations", detail: "A real back-and-forth conversation. Do not just broadcast." },
  { title: "Book 3 consults",         detail: "Offer today or tomorrow. Speed matters." },
  { title: "Post 1 feed piece",       detail: "One useful post, reel, or direct offer." },
  { title: "Post 3–5 stories",        detail: "Training floor, lesson, client win, availability, and call to action." },
  { title: "Send 10 social DMs",      detail: "Start human conversations, then invite the right people into a consult." }
];

const EXPENSE_CATEGORIES = ["Rent / Facility", "Software / Apps", "Marketing", "Equipment", "Education", "Insurance", "Other"];

const WEEK_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
type WeekDay = typeof WEEK_DAYS[number];

// Times every 30 min from 5:00am → 10:30pm
const TIME_OPTIONS: string[] = (() => {
  const out: string[] = ["—"];
  for (let h = 5; h <= 22; h++) {
    for (const m of [0, 30]) {
      const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      out.push(`${h12}:${m === 0 ? "00" : "30"}${h >= 12 ? "pm" : "am"}`);
    }
  }
  return out;
})();

const ACTIVITY_OPTIONS = [
  "Floor walk", "Train", "Break", "Lunch", "Calls",
  "Follow up calls", "B2B", "Walk Floor", "Admin",
  "Social media", "Content creation", "Program writing",
  "Client session", "Prospecting", "Morning routine", "Off",
];

// ─── Types ────────────────────────────────────────────────────────────────────

type DayData = {
  leadsContacted: number;
  replies: number;
  callsBooked: number;
  consultsBooked: number;
  consultsCompleted: number;
  clientsSigned: number;
  sessionRevenue: number;
  checklist: boolean[];
  notes: string;
};

function emptyDay(): DayData {
  return {
    leadsContacted: 0, replies: 0, callsBooked: 0,
    consultsBooked: 0, consultsCompleted: 0, clientsSigned: 0,
    sessionRevenue: 0,
    checklist: Array(CHECKLIST_ITEMS.length).fill(false),
    notes: ""
  };
}

type PackageKey = "Foundation" | "Transformation" | "Elite" | "Custom";

type Client = {
  id: number;
  name: string;
  package: PackageKey;
  weeklyRate: number;
  startDate: string;
  contact: string;
  notes: string;
  status: "active" | "lost";
  lostDate: string;
  lostReason: string;
  createdAt: string;
};

type Expense = {
  id: number;
  name: string;
  amount: number;
  category: string;
};

type ClientForm = {
  name: string; package: PackageKey; weeklyRate: string;
  startDate: string; contact: string; notes: string;
};

type ExpenseForm = { name: string; amount: string; category: string };

type ScheduleBlock   = { id: number; start: string; end: string; activity: string };
type DaySchedule     = { blocks: ScheduleBlock[] };
type WeekSchedule    = Record<WeekDay, DaySchedule>;
type TwoWeekSchedule = { week1: WeekSchedule; week2: WeekSchedule };

// ─── Package config ───────────────────────────────────────────────────────────

const PACKAGES: { label: PackageKey; weekly: number }[] = [
  { label: "Foundation",     weekly: 129 },
  { label: "Transformation", weekly: 199 },
  { label: "Elite",          weekly: 289 },
  { label: "Custom",         weekly: 0   }
];

const PKG_BADGE: Record<PackageKey, string> = {
  Foundation:     "bg-sky-100 text-sky-700 border-sky-200",
  Transformation: "bg-amber-100 text-amber-700 border-amber-200",
  Elite:          "bg-emerald-100 text-emerald-700 border-emerald-200",
  Custom:         "bg-stone-100 text-stone-600 border-stone-200"
};

function blankClientForm(): ClientForm {
  const today = new Date().toISOString().slice(0, 10);
  return { name: "", package: "Foundation", weeklyRate: "129", startDate: today, contact: "", notes: "" };
}

function blankExpenseForm(): ExpenseForm {
  return { name: "", amount: "", category: "Software / Apps" };
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// ─── Scripts ──────────────────────────────────────────────────────────────────

type ScriptStep = { type: string; lines: string[]; isPause?: boolean };
type LeadScript = { id: string; label: string; steps: ScriptStep[] };

const LEAD_SCRIPTS: LeadScript[] = [
  {
    id: "direct", label: "Direct Enquiry",
    steps: [
      { type: "OPENER", lines: ["Hey, it's Jazzay Sallah calling from Fitness First Richmond. How are you going today?"] },
      { type: "PAUSE", lines: ["Let them respond, then lower your tone."], isPause: true },
      { type: "REASON FOR CALL", lines: ["The reason I'm calling is because you reached out about personal training…", "So I wanted to see what you're looking to achieve and get you booked in."] },
      { type: "PAUSE", lines: [""], isPause: true },
      { type: "SOFT HOOK", lines: ["What made you reach out right now?"] },
      { type: "QUALIFY", lines: ["What specific result are you trying to achieve?", "What's been stopping you up until now?", "How long has that been frustrating you?"] },
      { type: "COMMITMENT FILTER", lines: ["On a scale of 1 to 10, how serious are you about fixing this right now?"] },
      { type: "POSITION", lines: ["Got it. I'll be straight with you. I get the best results with people who are ready to follow structure, stay accountable, and implement straight away.", "From what you've told me, you sound like someone who'd do really well with that."] },
      { type: "PAUSE", lines: [""], isPause: true },
      { type: "TRANSITION", lines: ["The next step is bringing you in for a consultation so we can map everything out properly.", "I've only got a couple of spots left this week."] },
      { type: "CLOSE", lines: ["Would Monday or Wednesday work better for you?"] },
      { type: "URGENCY", lines: ["Just to confirm, you'd be ready to start if everything makes sense, correct?", "Because if nothing changes, how do you think you'll feel in 3 to 6 months being in the same position?"] }
    ]
  },
  {
    id: "reception", label: "Reception Enquiry",
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
    id: "fitness-packs", label: "Fitness Packs",
    steps: [
      { type: "OPENER", lines: ["Hey, it's Jazzay from Fitness First Richmond. How are you going?"] },
      { type: "REASON", lines: ["I'm your trainer for the sessions you grabbed when you joined.", "So I wanted to get your first one locked in."] },
      { type: "PAUSE", lines: [""], isPause: true },
      { type: "SOFT HOOK", lines: ["What are you wanting to get out of those sessions?"] },
      { type: "LIGHT QUALIFY", lines: ["Any specific goals?", "Anything you've struggled with before?"] },
      { type: "POSITION", lines: ["Perfect. That's exactly what we'll focus on and build from."] },
      { type: "TRANSITION", lines: ["Let's get your first session booked in."] },
      { type: "CLOSE", lines: ["When are you usually in the gym?", "Then: Sweet, I'll lock you in for that time."] },
      { type: "OPTIONAL SEED", lines: ["If you get a lot out of these, we can look at building something longer-term after."] }
    ]
  },
  {
    id: "new-joiners", label: "New Joiners",
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
    id: "mia", label: "Call Lists, MIAs, Birthdays",
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
  { type: "IF IT'S TOO EXPENSIVE", lines: ["I get that."] },
  { type: "PAUSE", lines: [""], isPause: true },
  { type: "REFRAME", lines: ["Let me ask you: what's more important right now, saving money or actually getting the result you want?"] },
  { type: "ANCHOR BACK", lines: ["Then go back into their goal and what they said they want to fix."] }
];

// ─── Storage ──────────────────────────────────────────────────────────────────

const KEY_GOAL     = "tun-monthly-goal";
const KEY_CLIENTS  = "tun-active-clients";
const KEY_EXPENSES = "tun-expenses";
const KEY_SCHEDULE = "tun-weekly-schedule";
const dayKey = (d: string) => `tun-daydata-${d}`;

const EMPTY_WEEK: WeekSchedule = { monday: { blocks: [] }, tuesday: { blocks: [] }, wednesday: { blocks: [] }, thursday: { blocks: [] }, friday: { blocks: [] }, saturday: { blocks: [] }, sunday: { blocks: [] } };

const DEFAULT_SCHEDULE: TwoWeekSchedule = {
  week1: {
    monday:    { blocks: [
      { id: 1, start: "6:00am",  end: "8:00am",  activity: "Floor walk" },
      { id: 2, start: "8:00am",  end: "9:30am",  activity: "Train" },
      { id: 3, start: "9:30am",  end: "10:30am", activity: "Break" },
      { id: 4, start: "10:30am", end: "12:30pm", activity: "Calls" },
      { id: 5, start: "12:30pm", end: "1:30pm",  activity: "Lunch" },
      { id: 6, start: "1:30pm",  end: "2:30pm",  activity: "Follow up calls" },
      { id: 7, start: "2:30pm",  end: "3:00pm",  activity: "B2B" },
    ]},
    tuesday:   { blocks: [
      { id: 1, start: "11:00am", end: "12:30pm", activity: "Train" },
      { id: 2, start: "12:30pm", end: "1:30pm",  activity: "Lunch" },
      { id: 3, start: "1:30pm",  end: "3:30pm",  activity: "Calls" },
      { id: 4, start: "3:30pm",  end: "4:30pm",  activity: "Break" },
      { id: 5, start: "4:30pm",  end: "6:00pm",  activity: "Walk Floor" },
      { id: 6, start: "6:00pm",  end: "7:00pm",  activity: "Follow up calls" },
    ]},
    wednesday: { blocks: [] }, thursday: { blocks: [] },
    friday:    { blocks: [] }, saturday: { blocks: [] }, sunday: { blocks: [] },
  },
  week2: { ...EMPTY_WEEK },
};

function todayStr() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

function fmtAUD(n: number) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(n);
}

function daysSince(d: string) {
  if (!d) return null;
  return Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000);
}

function durationLabel(days: number | null) {
  if (days === null) return "—";
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.floor(days / 7)}wk`;
  if (days < 365) return `${Math.floor(days / 30)}mo`;
  return `${(days / 365).toFixed(1)}yr`;
}

function ScriptSteps({ steps }: { steps: ScriptStep[] }) {
  return (
    <div className="space-y-4">
      {steps.map((step, i) => {
        if (step.isPause && step.lines.every(l => !l)) return <div key={i} className="h-px bg-stone-200 my-1" />;
        return (
          <div key={i} className="flex flex-col gap-1">
            {!step.isPause && (
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#6b7b91]">{step.type}</p>
            )}
            {step.lines.filter(l => l).map((line, j) => (
              <p key={j} className={`text-sm leading-6 ${step.isPause ? "italic text-[#6b7b91]" : "text-[#10233f]"}`}>{line}</p>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ─── Counter ──────────────────────────────────────────────────────────────────

function Counter({ label, value, onChange, accent = false }: {
  label: string; value: number; onChange: (v: number) => void; accent?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-3 flex flex-col gap-1.5 ${accent ? "border-[#d2a86c] bg-[#fdf3e3]" : "border-stone-200 bg-white"}`}>
      <p className={`text-[10px] font-bold uppercase tracking-widest leading-tight ${accent ? "text-[#9a6820]" : "text-[#6b7b91]"}`}>{label}</p>
      <div className="flex items-center gap-2 mt-0.5">
        <button onClick={() => onChange(Math.max(0, value - 1))} className="h-7 w-7 rounded-full font-bold text-base flex items-center justify-center transition border border-stone-200 bg-white text-[#15314a] hover:bg-stone-100">−</button>
        <span className={`text-2xl font-black min-w-[2ch] text-center ${accent ? "text-[#9a6820]" : "text-[#10233f]"}`}>{value}</span>
        <button onClick={() => onChange(value + 1)} className={`h-7 w-7 rounded-full font-bold text-base flex items-center justify-center transition ${accent ? "bg-[#9a6820] text-white hover:bg-[#7a5218]" : "bg-[#15314a] text-white hover:bg-[#1e3f60]"}`}>+</button>
      </div>
    </div>
  );
}

// ─── Session Revenue Input ─────────────────────────────────────────────────────

function SessionInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [raw, setRaw] = useState(value > 0 ? String(value) : "");
  useEffect(() => { setRaw(value > 0 ? String(value) : ""); }, [value]);
  return (
    <div className="rounded-2xl border border-[#15314a] bg-[#10233f] p-3 flex flex-col gap-1.5">
      <p className="text-[10px] font-bold uppercase tracking-widest leading-tight text-[#d2a86c]">Session Revenue Today</p>
      <div className="flex items-center gap-1.5 mt-0.5">
        <span className="text-xl font-black text-white">$</span>
        <input
          type="number" min="0" inputMode="numeric"
          value={raw}
          onChange={e => setRaw(e.target.value)}
          onBlur={() => { const n = Math.max(0, Number(raw) || 0); onChange(n); setRaw(n > 0 ? String(n) : ""); }}
          placeholder="0"
          className="w-full bg-transparent text-2xl font-black text-white outline-none placeholder:text-white/30"
        />
      </div>
      <p className="text-[10px] text-[#d2a86c]/70">Enter total $ earned from paid sessions today</p>
    </div>
  );
}

// ─── Calendar ────────────────────────────────────────────────────────────────

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function MonthCalendar({ year, month, today, monthData, onDayClick }: {
  year: number; month: number; today: string;
  monthData: Record<string, DayData>; onDayClick: (d: string) => void;
}) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDow = new Date(year, month - 1, 1).getDay();
  const offset = firstDow === 0 ? 6 : firstDow - 1;
  const cells: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map(d => <div key={d} className="py-1 text-center text-[10px] font-bold uppercase tracking-widest text-[#6b7b91]">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} />;
          const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isToday = dateStr === today;
          const isPast = dateStr < today;
          const data = monthData[dateStr];
          const sessions = data?.sessionRevenue ? 1 : 0;
          const contacts = data?.leadsContacted ?? 0;
          const consults = data?.consultsCompleted ?? 0;
          const hasData = contacts > 0 || consults > 0 || sessions > 0;
          return (
            <button key={idx} onClick={() => onDayClick(dateStr)}
              className={`relative rounded-xl border p-1.5 text-left transition min-h-[56px] ${isToday ? "border-[#9a6820] bg-[#fdf3e3] shadow-sm" : hasData && isPast ? "border-stone-300 bg-stone-50 hover:border-[#9a6820]/50" : "border-stone-100 bg-white hover:border-stone-300"}`}>
              <p className={`text-[11px] font-bold mb-1 ${isToday ? "text-[#9a6820]" : "text-[#10233f]"}`}>
                {day}{isToday && <span className="ml-1 text-[9px] font-black text-[#9a6820]">TODAY</span>}
              </p>
              {hasData && (
                <div className="space-y-0.5">
                  {contacts > 0 && <p className="text-[9px] text-[#6b7b91] leading-none">{contacts} leads</p>}
                  {consults > 0 && <p className="text-[9px] text-[#6b7b91] leading-none">{consults} consults</p>}
                  {sessions > 0 && <p className="text-[9px] font-bold text-[#9a6820] leading-none">{sessions} sessions</p>}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Input class ─────────────────────────────────────────────────────────────

const inputCls = "w-full rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-[#10233f] outline-none transition focus:border-[#9a6820] focus:ring-2 focus:ring-[#9a6820]/20";

// ─── Main component ───────────────────────────────────────────────────────────

export function RevenueTrackerDashboard() {
  const [today, setToday] = useState(todayStr);
  const curYear   = Number(today.slice(0, 4));
  const curMonth  = Number(today.slice(5, 7));
  const daysInMo  = new Date(curYear, curMonth, 0).getDate();

  // ── Goal ─────────────────────────────────────────────────────────────────
  const [monthlyGoal, setMonthlyGoal] = useState(10000);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput,   setGoalInput]   = useState("10000");

  // ── Today scorecard ──────────────────────────────────────────────────────
  const [dayData,    setDayData]    = useState<DayData>(emptyDay());
  const [savedToday, setSavedToday] = useState(false);

  // ── Month data ───────────────────────────────────────────────────────────
  const [monthData, setMonthData] = useState<Record<string, DayData>>({});
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // ── Clients ──────────────────────────────────────────────────────────────
  const [clients,      setClients]      = useState<Client[]>([]);
  const [clientTab,    setClientTab]    = useState<"active" | "lost">("active");
  const [showClientForm, setShowClientForm] = useState(false);
  const [editClientId,   setEditClientId]   = useState<number | null>(null);
  const [clientForm,     setClientForm]     = useState<ClientForm>(blankClientForm());
  const [lossModalId,    setLossModalId]    = useState<number | null>(null);
  const [lossReason,     setLossReason]     = useState("");
  const [lossDate,       setLossDate]       = useState(todayISO());
  const [deleteClientId, setDeleteClientId] = useState<number | null>(null);

  // ── Expenses ─────────────────────────────────────────────────────────────
  const [expenses,        setExpenses]        = useState<Expense[]>([]);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editExpenseId,   setEditExpenseId]   = useState<number | null>(null);
  const [expenseForm,     setExpenseForm]     = useState<ExpenseForm>(blankExpenseForm());
  const [deleteExpenseId, setDeleteExpenseId] = useState<number | null>(null);

  // ── Scripts ──────────────────────────────────────────────────────────────
  const [activeScript, setActiveScript] = useState("direct");

  // ── Daily schedule ────────────────────────────────────────────────────────
  const todayDayName = new Date(today + "T12:00:00").toLocaleDateString("en-US", { weekday: "long" }).toLowerCase() as WeekDay;
  const [schedule,       setSchedule]       = useState<TwoWeekSchedule>(DEFAULT_SCHEDULE);
  const [scheduleWeek,   setScheduleWeek]   = useState<"week1" | "week2">("week1");
  const [scheduleDay,    setScheduleDay]    = useState<WeekDay>(todayDayName);
  const [showBlockForm,  setShowBlockForm]  = useState(false);
  const [editBlockId,    setEditBlockId]    = useState<number | null>(null);
  const [blockForm,      setBlockForm]      = useState({ start: "—", end: "—", activity: ACTIVITY_OPTIONS[0] });

  // ── Track date/month changes (e.g. tab revisited after midnight) ──────────
  useEffect(() => {
    const check = () => setToday(todayStr());
    document.addEventListener("visibilitychange", check);
    return () => document.removeEventListener("visibilitychange", check);
  }, []);

  // ── Hydrate ──────────────────────────────────────────────────────────────
  useEffect(() => {
    // Goal
    const g = localStorage.getItem(KEY_GOAL);
    if (g) { setMonthlyGoal(Number(g)); setGoalInput(g); }

    // Today
    const raw = localStorage.getItem(dayKey(today));
    if (raw) {
      try {
        const p = JSON.parse(raw) as Partial<DayData>;
        setDayData({ ...emptyDay(), ...p, checklist: Array.isArray(p.checklist) ? p.checklist.concat(Array(Math.max(0, CHECKLIST_ITEMS.length - p.checklist.length)).fill(false)) : Array(CHECKLIST_ITEMS.length).fill(false) });
      } catch { /* skip */ }
    }

    // Month
    const md: Record<string, DayData> = {};
    for (let d = 1; d <= daysInMo; d++) {
      const ds = `${curYear}-${String(curMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const r = localStorage.getItem(dayKey(ds));
      if (r) { try { md[ds] = JSON.parse(r); } catch { /* skip */ } }
    }
    setMonthData(md);

    // Clients
    try {
      const c = localStorage.getItem(KEY_CLIENTS);
      if (c) setClients(JSON.parse(c));
    } catch { /* skip */ }

    // Expenses
    try {
      const e = localStorage.getItem(KEY_EXPENSES);
      if (e) setExpenses(JSON.parse(e));
    } catch { /* skip */ }

    // Schedule
    try {
      const sc = localStorage.getItem(KEY_SCHEDULE);
      if (sc) setSchedule(JSON.parse(sc));
    } catch { /* skip */ }

    // Sync schedule day tab to today
    setScheduleDay(new Date(today + "T12:00:00").toLocaleDateString("en-US", { weekday: "long" }).toLowerCase() as WeekDay);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today]);

  // ── Revenue maths ─────────────────────────────────────────────────────────
  const activeClients   = clients.filter(c => c.status === "active");
  const lostClients     = clients.filter(c => c.status === "lost");
  const recurringWeekly = activeClients.reduce((s, c) => s + c.weeklyRate, 0);
  const recurringMonthly   = recurringWeekly * 4.33;
  const savedSessionRev    = useMemo(() => Object.entries(monthData).reduce((s, [d, dd]) => d !== today ? s + (dd.sessionRevenue ?? 0) : s, 0), [monthData, today]);
  const totalSessionRev    = savedSessionRev + (dayData.sessionRevenue ?? 0);
  const monthlyRevenue     = recurringMonthly + totalSessionRev;
  const totalExpenses      = expenses.reduce((s, e) => s + e.amount, 0);
  const netProfit          = monthlyRevenue - totalExpenses;
  const gap                = Math.max(0, monthlyGoal - monthlyRevenue);
  const progress           = Math.min(100, monthlyGoal > 0 ? (monthlyRevenue / monthlyGoal) * 100 : 0);
  const wonThisMonth       = useMemo(() => Object.values(monthData).reduce((s, d) => s + (d.clientsSigned ?? 0), 0) + dayData.clientsSigned, [monthData, dayData.clientsSigned]);
  const checklistDone   = dayData.checklist.filter(Boolean).length;
  const selectedData    = selectedDay ? (monthData[selectedDay] ?? null) : null;

  // ── Goal handlers ────────────────────────────────────────────────────────
  function saveGoal() {
    const val = Math.max(0, Number(goalInput) || 0);
    setMonthlyGoal(val); localStorage.setItem(KEY_GOAL, String(val)); setEditingGoal(false);
  }

  // ── Scorecard handlers ────────────────────────────────────────────────────
  function updateDay(key: keyof DayData, val: unknown) {
    setDayData(p => ({ ...p, [key]: val })); setSavedToday(false);
  }
  function toggleChecklist(i: number) {
    const next = [...dayData.checklist]; next[i] = !next[i]; updateDay("checklist", next);
  }
  function saveDay() {
    const saved = { ...dayData };
    localStorage.setItem(dayKey(today), JSON.stringify(saved));
    setMonthData(p => ({ ...p, [today]: saved }));
    setSavedToday(true); setTimeout(() => setSavedToday(false), 2500);
  }
  function resetDay() {
    const fresh = emptyDay(); setDayData(fresh);
    localStorage.removeItem(dayKey(today));
    setMonthData(p => { const n = { ...p }; delete n[today]; return n; });
    setSavedToday(false);
  }

  // ── Client handlers ───────────────────────────────────────────────────────
  // Use functional setClients so localStorage write always uses the latest list,
  // avoiding any stale-closure bug where clients captured in a handler are outdated.
  const saveClients = useCallback((updater: (prev: Client[]) => Client[]) => {
    setClients(prev => {
      const next = updater(prev);
      localStorage.setItem(KEY_CLIENTS, JSON.stringify(next));
      return next;
    });
  }, []);

  function openAddClient() {
    setEditClientId(null); setClientForm(blankClientForm()); setShowClientForm(true);
  }
  function openEditClient(c: Client) {
    setEditClientId(c.id);
    setClientForm({ name: c.name, package: c.package, weeklyRate: String(c.weeklyRate), startDate: c.startDate, contact: c.contact, notes: c.notes });
    setShowClientForm(true);
  }
  function handlePkgChange(pkg: PackageKey) {
    const rate = PACKAGES.find(p => p.label === pkg)?.weekly ?? 0;
    setClientForm(f => ({ ...f, package: pkg, weeklyRate: pkg === "Custom" ? f.weeklyRate : String(rate) }));
  }
  function submitClient(e: React.FormEvent) {
    e.preventDefault();
    const rate = Math.max(0, Number(clientForm.weeklyRate) || 0);
    const eid = editClientId;
    if (eid !== null) {
      saveClients(prev => prev.map(c => c.id === eid
        ? { ...c, name: clientForm.name, package: clientForm.package, weeklyRate: rate, startDate: clientForm.startDate, contact: clientForm.contact, notes: clientForm.notes }
        : c));
    } else {
      const newClient: Client = { id: Date.now(), name: clientForm.name, package: clientForm.package, weeklyRate: rate, startDate: clientForm.startDate, contact: clientForm.contact, notes: clientForm.notes, status: "active", lostDate: "", lostReason: "", createdAt: new Date().toISOString() };
      saveClients(prev => [...prev, newClient]);
    }
    setShowClientForm(false);
  }
  function markLost() {
    if (lossModalId === null) return;
    const id = lossModalId, date = lossDate, reason = lossReason;
    saveClients(prev => prev.map(c => c.id === id ? { ...c, status: "lost" as const, lostDate: date, lostReason: reason } : c));
    setLossModalId(null); setLossReason(""); setLossDate(todayISO()); setClientTab("lost");
  }
  function winBack(id: number) {
    saveClients(prev => prev.map(c => c.id === id ? { ...c, status: "active" as const, lostDate: "", lostReason: "" } : c));
    setClientTab("active");
  }
  function deleteClient(id: number) {
    saveClients(prev => prev.filter(c => c.id !== id));
    setDeleteClientId(null);
  }

  // ── Expense handlers ──────────────────────────────────────────────────────
  const saveExpenses = useCallback((updater: (prev: Expense[]) => Expense[]) => {
    setExpenses(prev => {
      const next = updater(prev);
      localStorage.setItem(KEY_EXPENSES, JSON.stringify(next));
      return next;
    });
  }, []);

  function openAddExpense() {
    setEditExpenseId(null); setExpenseForm(blankExpenseForm()); setShowExpenseForm(true);
  }
  function openEditExpense(ex: Expense) {
    setEditExpenseId(ex.id); setExpenseForm({ name: ex.name, amount: String(ex.amount), category: ex.category }); setShowExpenseForm(true);
  }
  function submitExpense(e: React.FormEvent) {
    e.preventDefault();
    const amt = Math.max(0, Number(expenseForm.amount) || 0);
    const eid = editExpenseId;
    if (eid !== null) {
      saveExpenses(prev => prev.map(ex => ex.id === eid ? { ...ex, name: expenseForm.name, amount: amt, category: expenseForm.category } : ex));
    } else {
      saveExpenses(prev => [...prev, { id: Date.now(), name: expenseForm.name, amount: amt, category: expenseForm.category }]);
    }
    setShowExpenseForm(false);
  }
  function deleteExpense(id: number) {
    saveExpenses(prev => prev.filter(ex => ex.id !== id));
    setDeleteExpenseId(null);
  }

  // ── Schedule helpers ──────────────────────────────────────────────────────
  function timeToMins(t: string): number {
    if (!t || t === "—") return -1;
    const pm = t.endsWith("pm");
    const [hStr, mStr] = t.replace(/[ap]m$/, "").split(":");
    const h = parseInt(hStr, 10); const m = parseInt(mStr, 10);
    const h24 = pm ? (h === 12 ? 12 : h + 12) : (h === 12 ? 0 : h);
    return h24 * 60 + m;
  }
  function sortBlocks(blocks: ScheduleBlock[]): ScheduleBlock[] {
    return [...blocks].sort((a, b) => timeToMins(a.start) - timeToMins(b.start));
  }

  // ── Schedule handlers ─────────────────────────────────────────────────────
  const saveSchedule = useCallback((updater: (prev: TwoWeekSchedule) => TwoWeekSchedule) => {
    setSchedule(prev => {
      const next = updater(prev);
      localStorage.setItem(KEY_SCHEDULE, JSON.stringify(next));
      return next;
    });
  }, []);

  function openAddBlock() {
    setEditBlockId(null);
    setBlockForm({ start: "—", end: "—", activity: ACTIVITY_OPTIONS[0] });
    setShowBlockForm(true);
  }
  function openEditBlock(b: ScheduleBlock) {
    setEditBlockId(b.id);
    setBlockForm({ start: b.start, end: b.end, activity: b.activity });
    setShowBlockForm(true);
  }
  function submitBlock(e: React.FormEvent) {
    e.preventDefault();
    const day = scheduleDay; const wk = scheduleWeek;
    if (editBlockId !== null) {
      const bid = editBlockId;
      saveSchedule(prev => ({ ...prev, [wk]: { ...prev[wk], [day]: { blocks: sortBlocks(prev[wk][day].blocks.map(b => b.id === bid ? { ...b, ...blockForm } : b)) } } }));
    } else {
      saveSchedule(prev => ({ ...prev, [wk]: { ...prev[wk], [day]: { blocks: sortBlocks([...prev[wk][day].blocks, { id: Date.now(), ...blockForm }]) } } }));
    }
    setShowBlockForm(false); setEditBlockId(null);
  }
  function deleteBlock(id: number) {
    const day = scheduleDay; const wk = scheduleWeek;
    saveSchedule(prev => ({ ...prev, [wk]: { ...prev[wk], [day]: { blocks: prev[wk][day].blocks.filter(b => b.id !== id) } } }));
  }

  // ── Copy-day handler ──────────────────────────────────────────────────────
  const [showCopyModal,  setShowCopyModal]  = useState(false);
  const [copyTargets,    setCopyTargets]    = useState<{ week: "week1" | "week2"; day: WeekDay }[]>([]);

  function toggleCopyTarget(week: "week1" | "week2", day: WeekDay) {
    setCopyTargets(prev => {
      const exists = prev.some(t => t.week === week && t.day === day);
      return exists ? prev.filter(t => !(t.week === week && t.day === day)) : [...prev, { week, day }];
    });
  }
  function applyCopy() {
    const sourceBlocks = schedule[scheduleWeek][scheduleDay].blocks;
    saveSchedule(prev => {
      let next = { ...prev };
      copyTargets.forEach(({ week, day }) => {
        const newBlocks = sortBlocks(sourceBlocks.map(b => ({ ...b, id: Date.now() + Math.random() })));
        next = { ...next, [week]: { ...next[week], [day]: { blocks: newBlocks } } };
      });
      return next;
    });
    setShowCopyModal(false); setCopyTargets([]);
  }

  const displayedClients = clientTab === "active" ? activeClients : lostClients;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-dvh bg-[linear-gradient(160deg,#f7f4ef_0%,#ede8df_100%)] text-[#10233f]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-5">

        {/* Nav */}
        <nav className="print:hidden">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="shrink-0 rounded-full bg-[#fdf3e3] px-4 py-1.5 text-xs font-semibold tracking-widest text-[#9a6820] uppercase">The Upper Notch</span>
            {[
              { href: "/",           label: "New Consultation" },
              { href: "/clients",    label: "Client Hub" },
              { href: "/leads",      label: "Lead Tracker" },
              { href: "/onboarding", label: "Onboarding" },
              { href: "/screening",  label: "Movement Screening" }
            ].map(l => (
              <a key={l.href} href={l.href} className="shrink-0 rounded-full border border-stone-200 bg-white/80 px-4 py-2 text-sm font-semibold text-[#15314a] transition hover:border-[#9a6820]/60">{l.label}</a>
            ))}
          </div>
        </nav>

        {/* Header */}
        <div className="rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.07)] sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-[#9a6820]">Daily Operations</p>
              <h1 className="mt-1 text-2xl font-bold text-[#10233f] sm:text-3xl">Revenue Tracker</h1>
              <p className="mt-1 text-sm text-[#4a5c73]">{new Date(today + "T12:00:00").toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
            </div>
            <div className="flex flex-wrap gap-4 text-right">
              <div><p className="text-xs font-semibold uppercase tracking-widest text-[#6b7b91]">Active Clients</p><p className="text-2xl font-black text-[#10233f]">{activeClients.length}</p></div>
              <div><p className="text-xs font-semibold uppercase tracking-widest text-[#6b7b91]">Session Revenue</p><p className="text-2xl font-black text-[#10233f]">{fmtAUD(totalSessionRev)}</p></div>
              {wonThisMonth > 0 && <div><p className="text-xs font-semibold uppercase tracking-widest text-[#6b7b91]">Won This Month</p><p className="text-2xl font-black text-emerald-600">{wonThisMonth}</p></div>}
              <div><p className="text-xs font-semibold uppercase tracking-widest text-[#6b7b91]">Net Profit</p><p className={`text-2xl font-black ${netProfit >= 0 ? "text-[#9a6820]" : "text-rose-600"}`}>{fmtAUD(netProfit)}</p></div>
            </div>
          </div>
        </div>

        {/* Goal + Fastest Path */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Goal card */}
          <div className="rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.07)]">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-[#9a6820]">Monthly Goal</p>
                {editingGoal ? (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-bold">$</span>
                    <input type="number" value={goalInput} onChange={e => setGoalInput(e.target.value)} onKeyDown={e => e.key === "Enter" && saveGoal()} className="w-28 rounded-xl border border-[#9a6820] px-3 py-1.5 text-lg font-bold outline-none focus:ring-2 focus:ring-[#9a6820]/20" autoFocus />
                    <button onClick={saveGoal} className="rounded-full bg-[#9a6820] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#7a5218]">Save</button>
                    <button onClick={() => setEditingGoal(false)} className="rounded-full border border-stone-200 px-3 py-1.5 text-sm text-[#6b7b91]">Cancel</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-3xl font-black">{fmtAUD(monthlyGoal)}</span>
                    <button onClick={() => setEditingGoal(true)} className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-semibold text-[#6b7b91] hover:border-[#9a6820]/60 hover:text-[#9a6820]">Edit</button>
                  </div>
                )}
              </div>
            </div>
            {/* Progress */}
            <div className="mb-3">
              <div className="flex justify-between mb-1.5 text-sm"><span className="font-semibold">{fmtAUD(monthlyRevenue)}</span><span className="text-[#6b7b91]">{gap > 0 ? `${fmtAUD(gap)} to go` : "🏆 Goal hit!"}</span></div>
              <div className="h-4 overflow-hidden rounded-full bg-stone-100"><div className="h-full rounded-full bg-gradient-to-r from-[#d2a86c] to-[#9a6820] transition-all duration-500" style={{ width: `${progress}%` }} /></div>
              <div className="flex justify-between mt-1 text-xs text-[#6b7b91]"><span>$0</span><span className="font-bold text-[#9a6820]">{progress.toFixed(1)}%</span><span>{fmtAUD(monthlyGoal)}</span></div>
            </div>
            {/* Breakdown */}
            <div className="space-y-1.5 mt-3">
              <div className="flex justify-between text-xs"><span className="text-[#6b7b91]">Recurring clients ({activeClients.length})</span><span className="font-semibold">{fmtAUD(recurringMonthly)}/mo</span></div>
              <div className="flex justify-between text-xs"><span className="text-[#6b7b91]">Session revenue (manual)</span><span className="font-semibold">{fmtAUD(totalSessionRev)}</span></div>
              <div className="flex justify-between text-xs border-t border-stone-100 pt-1.5"><span className="font-bold">Gross revenue</span><span className="font-black text-[#9a6820]">{fmtAUD(monthlyRevenue)}</span></div>
              {expenses.length > 0 && <div className="flex justify-between text-xs"><span className="text-rose-600">Expenses</span><span className="font-semibold text-rose-600">− {fmtAUD(totalExpenses)}</span></div>}
              {expenses.length > 0 && <div className="flex justify-between text-xs border-t border-stone-100 pt-1.5"><span className="font-bold">Net profit</span><span className={`font-black ${netProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{fmtAUD(netProfit)}</span></div>}
              {gap > 0 && <p className="text-xs text-[#6b7b91] pt-0.5">{fmtAUD(gap)} to go — add sessions or a new client</p>}
            </div>
          </div>

          {/* Fastest path */}
          <div className="rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.07)]">
            <p className="text-xs uppercase tracking-widest text-[#9a6820] mb-1">Fastest Path to Goal</p>
            <p className="text-sm text-[#4a5c73] mb-4">{gap > 0 ? `${fmtAUD(gap)} still needed to hit your goal.` : "Monthly goal reached! 🏆"}</p>
            <div className="space-y-2">
              {[{ label: "Foundation (1×/wk)", mo: 129 * 4.33 }, { label: "Transformation (2×/wk)", mo: 199 * 4.33 }, { label: "Elite (3×/wk)", mo: 289 * 4.33 }].map(({ label, mo }) => (
                <div key={label} className="flex items-center justify-between rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
                  <div><p className="font-bold text-sm">{label}</p><p className="text-xs text-[#6b7b91]">{fmtAUD(mo)}/mo per client</p></div>
                  <p className={`text-2xl font-black ${gap <= 0 ? "text-emerald-600" : ""}`}>{gap <= 0 ? "✓" : Math.ceil(gap / mo)}<span className="text-xs font-normal text-[#6b7b91] ml-1">needed</span></p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Clients: Active & Lost ────────────────────────────────── */}
        <div className="rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.07)] sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-[#9a6820]">Clients</p>
              <h2 className="mt-0.5 text-lg font-bold text-[#10233f]">
                {activeClients.length} active · {fmtAUD(recurringWeekly)}/wk recurring
                {wonThisMonth > 0 && <span className="ml-2 text-emerald-600 text-sm">🏆 {wonThisMonth} won this month</span>}
              </h2>
            </div>
            <button onClick={openAddClient} className="shrink-0 rounded-full bg-[#15314a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1e3f60]">+ Add Client</button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            <button onClick={() => setClientTab("active")} className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${clientTab === "active" ? "bg-[#15314a] text-white" : "border border-stone-200 bg-white text-[#15314a] hover:border-[#15314a]/40"}`}>Active ({activeClients.length})</button>
            <button onClick={() => setClientTab("lost")} className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${clientTab === "lost" ? "bg-rose-600 text-white" : "border border-stone-200 bg-white text-[#15314a] hover:border-rose-300"}`}>Lost ({lostClients.length})</button>
          </div>

          {displayedClients.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-5 py-8 text-center">
              <p className="text-sm text-[#6b7b91]">{clientTab === "active" ? "No active clients yet. Hit + Add Client to get started." : "No lost clients — keep it that way!"}</p>
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {displayedClients.map(client => {
                const days = daysSince(client.startDate);
                const lostDays = client.lostDate ? daysSince(client.lostDate) : null;
                return (
                  <div key={client.id} className={`rounded-2xl border p-4 ${clientTab === "active" ? "border-stone-200 bg-white" : "border-rose-100 bg-rose-50/60"}`}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div><p className="font-bold text-sm text-[#10233f]">{client.name}</p>{client.contact && <p className="text-xs text-[#6b7b91]">{client.contact}</p>}</div>
                      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${PKG_BADGE[client.package]}`}>{client.package}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-[#6b7b91] mb-2">
                      <span><strong className="text-[#10233f]">{fmtAUD(client.weeklyRate)}</strong>/wk</span>
                      <span><strong className="text-[#10233f]">{fmtAUD(client.weeklyRate * 4.33)}</strong>/mo</span>
                      {days !== null && <span>Duration: <strong className="text-[#10233f]">{durationLabel(days)}</strong></span>}
                    </div>
                    {clientTab === "lost" && client.lostDate && (
                      <div className="mb-2 rounded-xl border border-rose-200 bg-rose-100 px-3 py-2">
                        <p className="text-xs font-semibold text-rose-700">Left {client.lostDate}{lostDays !== null ? ` · ${durationLabel(lostDays)} ago` : ""}</p>
                        {client.lostReason && <p className="text-xs text-rose-600 mt-0.5">"{client.lostReason}"</p>}
                      </div>
                    )}
                    {client.notes && <p className="text-xs text-[#6b7b91] mb-2 leading-5">{client.notes}</p>}
                    <div className="flex flex-wrap gap-2">
                      {clientTab === "active" ? (
                        <>
                          <button onClick={() => openEditClient(client)} className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-semibold text-[#15314a] hover:border-[#9a6820]/60 transition">Edit</button>
                          <button onClick={() => { setLossModalId(client.id); setLossReason(""); setLossDate(todayISO()); }} className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition">Mark as Lost</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => winBack(client.id)} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition">Win Back</button>
                          <button onClick={() => setDeleteClientId(client.id)} className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-semibold text-rose-500 hover:border-rose-200 transition">Remove</button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Business Expenses ────────────────────────────────────── */}
        <div className="rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.07)] sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-[#9a6820]">Business Expenses</p>
              <h2 className="mt-0.5 text-lg font-bold text-[#10233f]">
                {expenses.length === 0 ? "No expenses added" : `${fmtAUD(totalExpenses)}/mo in expenses`}
              </h2>
            </div>
            <button onClick={openAddExpense} className="shrink-0 rounded-full bg-[#15314a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1e3f60]">+ Add Expense</button>
          </div>

          {expenses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-5 py-6 text-center">
              <p className="text-sm text-[#6b7b91]">Add your monthly expenses to see your real net profit.</p>
            </div>
          ) : (
            <>
              <div className="space-y-2 mb-3">
                {expenses.map(ex => (
                  <div key={ex.id} className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white px-4 py-3">
                    <div>
                      <p className="font-semibold text-sm text-[#10233f]">{ex.name}</p>
                      <p className="text-xs text-[#6b7b91]">{ex.category}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-black text-sm text-rose-600">{fmtAUD(ex.amount)}/mo</p>
                      <button onClick={() => openEditExpense(ex)} className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-semibold text-[#15314a] hover:border-[#9a6820]/60 transition">Edit</button>
                      <button onClick={() => setDeleteExpenseId(ex.id)} className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-semibold text-rose-500 hover:border-rose-200 transition">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm">
                <span className="font-bold text-[#10233f]">Total monthly expenses</span>
                <span className="font-black text-rose-600">{fmtAUD(totalExpenses)}</span>
              </div>
              <div className="flex justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm mt-2">
                <span className="font-bold text-[#10233f]">Net profit after expenses</span>
                <span className={`font-black ${netProfit >= 0 ? "text-emerald-700" : "text-rose-600"}`}>{fmtAUD(netProfit)}</span>
              </div>
            </>
          )}
        </div>

        {/* ── Monthly Calendar ─────────────────────────────────────── */}
        <div className="rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.07)] sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-[#9a6820]">Monthly Calendar</p>
              <h2 className="mt-0.5 text-lg font-bold text-[#10233f]">{new Date(today + "T12:00:00").toLocaleDateString("en-AU", { month: "long", year: "numeric" })}</h2>
            </div>
            {selectedDay && <button onClick={() => setSelectedDay(null)} className="rounded-full border border-stone-200 bg-white px-4 py-1.5 text-xs font-semibold text-[#6b7b91] hover:border-stone-300">Clear</button>}
          </div>
          <MonthCalendar year={curYear} month={curMonth} today={today} monthData={{ ...monthData, [today]: dayData }} onDayClick={d => setSelectedDay(d === selectedDay ? null : d)} />
          {selectedDay && selectedDay !== today && (
            <div className="mt-4 rounded-2xl border border-[#e8d5b0] bg-[#fdf3e3] px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#9a6820] mb-2">{new Date(selectedDay + "T12:00:00").toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })}</p>
              {selectedData ? (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-7 text-center">
                  {[
                    { label: "Leads", val: selectedData.leadsContacted },
                    { label: "Replies", val: selectedData.replies },
                    { label: "Calls", val: selectedData.callsBooked },
                    { label: "Consults Booked", val: selectedData.consultsBooked },
                    { label: "Consults Done", val: selectedData.consultsCompleted },
                    { label: "Signed", val: selectedData.clientsSigned },
                    { label: "Session $", val: fmtAUD(selectedData.sessionRevenue ?? 0) }
                  ].map(item => (
                    <div key={item.label}><p className="text-[10px] font-semibold uppercase tracking-widest text-[#6b7b91]">{item.label}</p><p className="text-xl font-black">{item.val}</p></div>
                  ))}
                </div>
              ) : <p className="text-sm text-[#6b7b91]">No data saved for this day.</p>}
            </div>
          )}
        </div>

        {/* ── Daily Planning Schedule ──────────────────────────────── */}
        <div className="rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.07)] sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-[#9a6820]">2-Week Planner</p>
              <h2 className="mt-0.5 text-lg font-bold text-[#10233f]">Daily Schedule</h2>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setCopyTargets([]); setShowCopyModal(true); }}
                className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-[#15314a] transition hover:border-[#9a6820]/60">
                Copy day →
              </button>
              <button onClick={openAddBlock}
                className="rounded-full bg-[#15314a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1e3f60]">
                + Add Block
              </button>
            </div>
          </div>

          {/* Week tabs */}
          <div className="flex gap-2 mb-3">
            {(["week1", "week2"] as const).map(wk => (
              <button key={wk} onClick={() => setScheduleWeek(wk)}
                className={`rounded-full border px-5 py-1.5 text-sm font-semibold transition ${scheduleWeek === wk ? "border-[#15314a] bg-[#15314a] text-white" : "border-stone-200 bg-white text-[#15314a] hover:border-[#15314a]/40"}`}>
                {wk === "week1" ? "Week 1" : "Week 2"}
              </button>
            ))}
          </div>

          {/* Day tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
            {WEEK_DAYS.map(d => (
              <button key={d} onClick={() => setScheduleDay(d)}
                className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold capitalize transition ${
                  scheduleDay === d
                    ? "border-[#15314a] bg-[#15314a] text-white"
                    : d === todayDayName
                    ? "border-[#9a6820] bg-[#fdf3e3] text-[#9a6820]"
                    : "border-stone-200 bg-white text-[#15314a] hover:border-[#15314a]/40"
                }`}>
                {d.charAt(0).toUpperCase() + d.slice(1, 3)}
                {d === todayDayName && <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#9a6820] align-middle" />}
              </button>
            ))}
          </div>

          {/* Blocks */}
          {schedule[scheduleWeek][scheduleDay].blocks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-200 px-6 py-8 text-center">
              <p className="text-sm text-[#6b7b91]">No blocks planned for {scheduleDay.charAt(0).toUpperCase() + scheduleDay.slice(1)} — {scheduleWeek === "week1" ? "Week 1" : "Week 2"} yet.</p>
              <button onClick={openAddBlock} className="mt-3 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-[#15314a] hover:border-[#9a6820]/60 transition">+ Add first block</button>
            </div>
          ) : (
            <div className="space-y-2">
              {schedule[scheduleWeek][scheduleDay].blocks.map(block => (
                <div key={block.id} className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 transition hover:border-[#9a6820]/30">
                  <div className="shrink-0 text-right min-w-[80px]">
                    <p className="text-xs font-semibold text-[#9a6820]">{block.start}</p>
                    <p className="text-[10px] text-[#6b7b91]">→ {block.end}</p>
                  </div>
                  <div className="h-8 w-px bg-stone-200 shrink-0" />
                  <p className="flex-1 text-sm font-semibold text-[#10233f]">{block.activity}</p>
                  <div className="flex gap-1.5">
                    <button onClick={() => openEditBlock(block)} className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#15314a] hover:border-[#9a6820]/60 active:bg-stone-100 transition">Edit</button>
                    <button onClick={() => deleteBlock(block.id)} className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-500 hover:border-rose-300 active:bg-rose-50 transition">✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Today: Checklist + Scorecard ─────────────────────────── */}
        <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
          {/* Checklist */}
          <div className="rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.07)]">
            <div className="flex items-center justify-between mb-4">
              <div><p className="text-xs uppercase tracking-widest text-[#9a6820]">Today's Checklist</p><h2 className="mt-0.5 text-lg font-bold">Daily Actions</h2></div>
              <span className={`rounded-full px-3 py-1 text-xs font-black ${checklistDone === CHECKLIST_ITEMS.length ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-600"}`}>{checklistDone}/{CHECKLIST_ITEMS.length} done</span>
            </div>
            <div className="space-y-2">
              {CHECKLIST_ITEMS.map((item, i) => (
                <button key={i} onClick={() => toggleChecklist(i)}
                  className={`w-full flex items-start gap-3 rounded-2xl border px-4 py-3 text-left transition ${dayData.checklist[i] ? "border-emerald-200 bg-emerald-50" : "border-stone-200 bg-white hover:border-[#9a6820]/40"}`}>
                  <span className={`mt-0.5 shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center text-[10px] font-black ${dayData.checklist[i] ? "border-emerald-500 bg-emerald-500 text-white" : "border-stone-300"}`}>{dayData.checklist[i] ? "✓" : ""}</span>
                  <div>
                    <p className={`text-sm font-semibold leading-tight ${dayData.checklist[i] ? "text-emerald-700 line-through" : "text-[#10233f]"}`}>{item.title}</p>
                    <p className="text-xs text-[#6b7b91] leading-5 mt-0.5">{item.detail}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Scorecard */}
          <div className="rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.07)]">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div><p className="text-xs uppercase tracking-widest text-[#9a6820]">Daily Scorecard</p><h2 className="mt-0.5 text-lg font-bold">Today's Numbers</h2></div>
              <div className="flex gap-2">
                <button onClick={saveDay} className={`rounded-full px-4 py-2 text-sm font-semibold text-white transition ${savedToday ? "bg-emerald-600" : "bg-[#9a6820] hover:bg-[#7a5218]"}`}>{savedToday ? "✓ Saved" : "Save Day"}</button>
                <button onClick={resetDay} className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-[#15314a] hover:border-rose-300 hover:text-rose-600 transition">Reset</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 mb-3">
              <Counter label="Leads Contacted"   value={dayData.leadsContacted}   onChange={v => updateDay("leadsContacted", v)} />
              <Counter label="Replies"            value={dayData.replies}           onChange={v => updateDay("replies", v)} />
              <Counter label="Calls Booked"       value={dayData.callsBooked}       onChange={v => updateDay("callsBooked", v)} />
              <Counter label="Consults Booked"    value={dayData.consultsBooked}    onChange={v => updateDay("consultsBooked", v)} accent />
              <Counter label="Consults Completed" value={dayData.consultsCompleted} onChange={v => updateDay("consultsCompleted", v)} />
              <Counter label="Clients Signed"     value={dayData.clientsSigned}     onChange={v => updateDay("clientsSigned", v)} accent />
            </div>
            <SessionInput value={dayData.sessionRevenue ?? 0} onChange={v => updateDay("sessionRevenue", v)} />
            <div className="mt-3">
              <label className="text-xs font-semibold uppercase tracking-widest text-[#6b7b91]">Follow-ups &amp; Lessons</label>
              <textarea rows={3} value={dayData.notes} onChange={e => { setDayData(p => ({ ...p, notes: e.target.value })); setSavedToday(false); }}
                placeholder="Who needs a follow-up? What objections came up? What will you do differently tomorrow?"
                className="mt-1.5 w-full resize-none rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#9a6820] focus:ring-2 focus:ring-[#9a6820]/20" />
            </div>
          </div>
        </div>

        {/* ── Scripts ─────────────────────────────────────────────── */}
        <div className="rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.07)] sm:p-6">
          <h2 className="text-lg text-[#10233f] mb-4">Scripts by Lead Type</h2>
          <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
            {LEAD_SCRIPTS.map(s => (
              <button key={s.id} onClick={() => setActiveScript(s.id)}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${activeScript === s.id ? "border-[#15314a] bg-[#15314a] text-white" : "border-stone-200 bg-white text-[#15314a] hover:border-[#15314a]/40"}`}>
                {s.label}
              </button>
            ))}
            <button onClick={() => setActiveScript("objection")}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${activeScript === "objection" ? "border-rose-600 bg-rose-600 text-white" : "border-stone-200 bg-white text-[#15314a] hover:border-rose-300"}`}>
              Objections
            </button>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-stone-50 px-5 py-5">
            {activeScript === "objection"
              ? <><p className="font-semibold text-[#10233f] mb-4">If They Say It's Too Expensive</p><ScriptSteps steps={OBJECTION_STEPS} /></>
              : (() => { const s = LEAD_SCRIPTS.find(s => s.id === activeScript); return s ? <ScriptSteps steps={s.steps} /> : null; })()
            }
          </div>
        </div>

      </div>

      {/* ── Client Add/Edit Modal ────────────────────────────────── */}
      {showClientForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 px-4 pt-12 pb-8 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-100 px-6 py-5">
              <h2 className="text-lg font-bold text-[#10233f]">{editClientId ? "Edit Client" : "Add Client"}</h2>
              <button onClick={() => setShowClientForm(false)} className="rounded-full p-2 text-slate-400 hover:bg-stone-100">✕</button>
            </div>
            <form onSubmit={submitClient} className="grid gap-4 px-6 py-5">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-[#6b7b91]">Full Name *</label>
                <input required value={clientForm.name} onChange={e => setClientForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Sarah Johnson" className={inputCls} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-[#6b7b91]">Package *</label>
                <div className="grid grid-cols-2 gap-2">
                  {PACKAGES.map(pkg => (
                    <button key={pkg.label} type="button" onClick={() => handlePkgChange(pkg.label)}
                      className={`rounded-2xl border px-3 py-2.5 text-sm font-semibold transition ${clientForm.package === pkg.label ? "border-[#9a6820] bg-[#9a6820] text-white" : "border-stone-200 bg-white text-[#15314a] hover:border-[#9a6820]/60"}`}>
                      {pkg.label}{pkg.weekly > 0 ? ` · $${pkg.weekly}` : ""}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-[#6b7b91]">Weekly Rate ($) *</label>
                <input required type="number" min="0" value={clientForm.weeklyRate} onChange={e => setClientForm(f => ({ ...f, weeklyRate: e.target.value, package: "Custom" }))} className={inputCls} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-[#6b7b91]">Start Date</label>
                <input type="date" value={clientForm.startDate} onChange={e => setClientForm(f => ({ ...f, startDate: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-[#6b7b91]">Contact</label>
                <input value={clientForm.contact} onChange={e => setClientForm(f => ({ ...f, contact: e.target.value }))} placeholder="Phone or email" className={inputCls} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-[#6b7b91]">Notes</label>
                <textarea rows={2} value={clientForm.notes} onChange={e => setClientForm(f => ({ ...f, notes: e.target.value }))} placeholder="Goals, training days, anything useful…" className={`${inputCls} resize-none`} />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" className="flex-1 rounded-full bg-[#15314a] py-3 text-sm font-semibold text-white transition hover:bg-[#1e3f60]">{editClientId ? "Save Changes" : "Add Client"}</button>
                <button type="button" onClick={() => setShowClientForm(false)} className="rounded-full border border-stone-200 px-5 py-3 text-sm font-semibold text-[#6b7b91] hover:border-stone-300">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Mark as Lost Modal ───────────────────────────────────── */}
      {lossModalId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-100 px-6 py-5">
              <h2 className="text-lg font-bold text-rose-700">Mark as Lost</h2>
              <button onClick={() => setLossModalId(null)} className="rounded-full p-2 text-slate-400 hover:bg-stone-100">✕</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-[#6b7b91]">Date Left</label>
                <input type="date" value={lossDate} onChange={e => setLossDate(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-[#6b7b91]">Reason (optional)</label>
                <textarea rows={3} value={lossReason} onChange={e => setLossReason(e.target.value)} placeholder="e.g. Moving away, financial reasons, schedule conflict…" className={`${inputCls} resize-none`} />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={markLost} className="flex-1 rounded-full bg-rose-600 py-3 text-sm font-semibold text-white transition hover:bg-rose-700">Confirm</button>
                <button onClick={() => setLossModalId(null)} className="rounded-full border border-stone-200 px-5 py-3 text-sm font-semibold text-[#6b7b91]">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Client Confirm ────────────────────────────────── */}
      {deleteClientId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl text-center">
            <p className="text-base font-bold text-[#10233f] mb-2">Remove this client record?</p>
            <p className="text-sm text-[#6b7b91] mb-5">This can't be undone.</p>
            <div className="flex gap-2 justify-center">
              <button onClick={() => deleteClient(deleteClientId)} className="rounded-full bg-rose-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 transition">Remove</button>
              <button onClick={() => setDeleteClientId(null)} className="rounded-full border border-stone-200 px-6 py-2.5 text-sm font-semibold text-[#15314a] hover:border-stone-300 transition">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Expense Add/Edit Modal ───────────────────────────────── */}
      {showExpenseForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 px-4 pt-12 pb-8 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-100 px-6 py-5">
              <h2 className="text-lg font-bold text-[#10233f]">{editExpenseId ? "Edit Expense" : "Add Expense"}</h2>
              <button onClick={() => setShowExpenseForm(false)} className="rounded-full p-2 text-slate-400 hover:bg-stone-100">✕</button>
            </div>
            <form onSubmit={submitExpense} className="grid gap-4 px-6 py-5">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-[#6b7b91]">Expense Name *</label>
                <input required value={expenseForm.name} onChange={e => setExpenseForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Spotify, gym rent, phone bill" className={inputCls} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-[#6b7b91]">Monthly Amount ($) *</label>
                <input required type="number" min="0" value={expenseForm.amount} onChange={e => setExpenseForm(f => ({ ...f, amount: e.target.value }))} placeholder="e.g. 49" className={inputCls} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-[#6b7b91]">Category</label>
                <select value={expenseForm.category} onChange={e => setExpenseForm(f => ({ ...f, category: e.target.value }))} className={inputCls}>
                  {EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" className="flex-1 rounded-full bg-[#15314a] py-3 text-sm font-semibold text-white transition hover:bg-[#1e3f60]">{editExpenseId ? "Save Changes" : "Add Expense"}</button>
                <button type="button" onClick={() => setShowExpenseForm(false)} className="rounded-full border border-stone-200 px-5 py-3 text-sm font-semibold text-[#6b7b91]">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Expense Confirm ───────────────────────────────── */}
      {deleteExpenseId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl text-center">
            <p className="text-base font-bold text-[#10233f] mb-2">Remove this expense?</p>
            <p className="text-sm text-[#6b7b91] mb-5">This can't be undone.</p>
            <div className="flex gap-2 justify-center">
              <button onClick={() => deleteExpense(deleteExpenseId)} className="rounded-full bg-rose-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 transition">Remove</button>
              <button onClick={() => setDeleteExpenseId(null)} className="rounded-full border border-stone-200 px-6 py-2.5 text-sm font-semibold text-[#15314a] hover:border-stone-300 transition">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Copy Day Modal ───────────────────────────────────────── */}
      {showCopyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-[#10233f]">Copy day to…</h2>
                <p className="text-xs text-[#6b7b91] mt-0.5 capitalize">Copying: {scheduleWeek === "week1" ? "Week 1" : "Week 2"} — {scheduleDay}</p>
              </div>
              <button onClick={() => setShowCopyModal(false)} className="rounded-full p-2 text-slate-400 hover:bg-stone-100">✕</button>
            </div>
            <div className="px-6 py-5 space-y-5">
              {(["week1", "week2"] as const).map(wk => (
                <div key={wk}>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#9a6820] mb-2">{wk === "week1" ? "Week 1" : "Week 2"}</p>
                  <div className="grid grid-cols-4 gap-2">
                    {WEEK_DAYS.map(d => {
                      const isSource = wk === scheduleWeek && d === scheduleDay;
                      const checked = copyTargets.some(t => t.week === wk && t.day === d);
                      return (
                        <button key={d} disabled={isSource} onClick={() => toggleCopyTarget(wk, d)}
                          className={`rounded-xl border py-2 text-xs font-semibold capitalize transition ${
                            isSource ? "border-stone-100 bg-stone-50 text-stone-300 cursor-not-allowed"
                            : checked ? "border-[#15314a] bg-[#15314a] text-white"
                            : "border-stone-200 bg-white text-[#15314a] hover:border-[#15314a]/40"
                          }`}>
                          {d.slice(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <button onClick={applyCopy} disabled={copyTargets.length === 0}
                  className="flex-1 rounded-full bg-[#15314a] py-3 text-sm font-semibold text-white transition hover:bg-[#1e3f60] disabled:opacity-40">
                  Copy to {copyTargets.length > 0 ? `${copyTargets.length} day${copyTargets.length > 1 ? "s" : ""}` : "…"}
                </button>
                <button onClick={() => setShowCopyModal(false)} className="rounded-full border border-stone-200 px-5 py-3 text-sm font-semibold text-[#6b7b91] hover:border-stone-300">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Schedule Block Add/Edit Modal ────────────────────────── */}
      {showBlockForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-100 px-6 py-5">
              <h2 className="text-lg font-bold text-[#10233f]">
                {editBlockId ? "Edit Block" : "Add Block"} — <span className="capitalize">{scheduleDay}</span>
              </h2>
              <button onClick={() => { setShowBlockForm(false); setEditBlockId(null); }} className="rounded-full p-2 text-slate-400 hover:bg-stone-100">✕</button>
            </div>
            <form onSubmit={submitBlock} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-[#6b7b91]">Start time</label>
                  <select value={blockForm.start} onChange={e => setBlockForm(f => ({ ...f, start: e.target.value }))} className={inputCls}>
                    {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-[#6b7b91]">End time</label>
                  <select value={blockForm.end} onChange={e => setBlockForm(f => ({ ...f, end: e.target.value }))} className={inputCls}>
                    {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-[#6b7b91]">Activity</label>
                <select value={blockForm.activity} onChange={e => setBlockForm(f => ({ ...f, activity: e.target.value }))} className={inputCls}>
                  {ACTIVITY_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" className="flex-1 rounded-full bg-[#15314a] py-3 text-sm font-semibold text-white transition hover:bg-[#1e3f60]">
                  {editBlockId ? "Save Changes" : "Add Block"}
                </button>
                <button type="button" onClick={() => { setShowBlockForm(false); setEditBlockId(null); }}
                  className="rounded-full border border-stone-200 px-5 py-3 text-sm font-semibold text-[#6b7b91] hover:border-stone-300">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}
