"use client";

import { useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

type OnlinePackage = {
  id: string;
  name: string;
  tagline: string;
  weeklyPrice: number;
  minCommitment: string; // e.g. "8 weeks", "12 weeks"
  results: string[];
  inclusions: string[];
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function dollars(value: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

function listToText(items: string[]) {
  return items.join("\n");
}

function textToList(value: string) {
  return value.split("\n").map((s) => s.trim()).filter(Boolean);
}

// ── Default packages ─────────────────────────────────────────────────────────

const initialPackages: OnlinePackage[] = [
  {
    id: "online-elite",
    name: "Online Elite",
    tagline: "Full coaching experience — remotely, without compromise",
    weeklyPrice: 149,
    minCommitment: "12 weeks",
    results: [
      "Fastest remote progress with full structure",
      "Daily accountability and coach access",
      "Fully personalised training and lifestyle plan",
      "Everything managed — no guesswork required",
    ],
    inclusions: [
      "Custom training program (updated every 4 weeks)",
      "Daily check-ins via coaching app",
      "Unlimited coach messaging Mon–Fri",
      "Weekly video call or voice note review",
      "Technique video analysis",
      "Nutrition targets and habit coaching",
      "Coaching app access",
    ],
  },
  {
    id: "online-performance",
    name: "Online Performance",
    tagline: "Structured coaching with regular accountability",
    weeklyPrice: 99,
    minCommitment: "8 weeks",
    results: [
      "Consistent progress with a clear plan",
      "Regular check-ins to keep you on track",
      "Tailored training around your schedule",
      "Build strong habits that stick",
    ],
    inclusions: [
      "Custom training program (updated every 4 weeks)",
      "Twice-weekly check-ins",
      "Coach messaging Mon–Fri",
      "Technique video feedback",
      "Nutrition targets",
      "Coaching app access",
    ],
  },
  {
    id: "online-essential",
    name: "Online Essential",
    tagline: "A clear program and the support to follow through",
    weeklyPrice: 59,
    minCommitment: "8 weeks",
    results: [
      "A structured plan built around your goals",
      "Weekly accountability to stay consistent",
      "Build confidence training independently",
      "Simple, sustainable progress",
    ],
    inclusions: [
      "Custom training program (updated every 4 weeks)",
      "Weekly check-in",
      "Coach messaging Mon–Fri",
      "Coaching app access",
    ],
  },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 text-xs font-black uppercase tracking-[0.2em] text-[#9a6820]">
      {children}
    </p>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-[#101010] outline-none transition focus:border-[#9a6820] focus:ring-2 focus:ring-[#9a6820]/15"
      />
    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-[#101010] outline-none transition focus:border-[#9a6820] focus:ring-2 focus:ring-[#9a6820]/15"
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 3,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-[#101010] outline-none transition focus:border-[#9a6820] focus:ring-2 focus:ring-[#9a6820]/15"
      />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function OnlineCoachingApp() {
  const [packages, setPackages] = useState<OnlinePackage[]>(initialPackages);
  const [selectedId, setSelectedId] = useState(initialPackages[1].id);
  const [openId, setOpenId] = useState(initialPackages[1].id);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Client info
  const [clientName, setClientName] = useState("Client Name");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientGoal, setClientGoal] = useState("Get lean, build consistent habits, and train effectively from home.");
  const [clientNeeds, setClientNeeds] = useState("Needs flexibility, accountability, and a plan that fits their lifestyle and budget.");
  const [recommendation, setRecommendation] = useState("Online coaching is a great fit here — same structure and accountability as in-person, delivered remotely at a price that works.");

  // Nutrition add-on
  const [nutritionAdded, setNutritionAdded] = useState(false);
  const [nutritionWeeklyPrice, setNutritionWeeklyPrice] = useState(30);
  const [nutritionDescription, setNutritionDescription] = useState(
    "Nutrition coaching add-on: personalised calorie and protein targets, simple meal structure guidance, weekly nutrition check-in, and ongoing habit coaching."
  );

  const selectedPackage = packages.find((p) => p.id === selectedId) ?? packages[0];
  const weeklyTotal = selectedPackage.weeklyPrice + (nutritionAdded ? nutritionWeeklyPrice : 0);
  const totalCommitment = (() => {
    const weeks = parseInt(selectedPackage.minCommitment);
    if (!Number.isFinite(weeks)) return selectedPackage.minCommitment;
    return `${dollars(weeklyTotal * weeks)} over ${selectedPackage.minCommitment}`;
  })();

  function updatePackage(id: string, patch: Partial<OnlinePackage>) {
    setPackages((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  return (
    <main className="min-h-screen bg-[#050505] px-4 py-6 text-[#101010] sm:px-6 lg:px-10 print:bg-white">
      <section className="mx-auto max-w-[1600px] rounded-[2rem] border border-white/10 bg-white p-5 shadow-[0_26px_100px_rgba(0,0,0,0.45)] sm:p-7 lg:p-9 print:shadow-none">

        {/* ── Page header ── */}
        <div className="flex flex-col gap-4 border-b border-zinc-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.36em] text-[#9a6820]">The Upper Notch</p>
            <h1 className="mt-3 text-3xl font-black uppercase tracking-[0.12em] text-[#101010] sm:text-6xl">Online Coaching</h1>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/pricing-presentation"
              className="rounded-full border border-zinc-200 bg-white px-5 py-3 text-base font-black text-[#101010] transition hover:border-[#9a6820]/60 print:hidden"
            >
              ← In-Person Packages
            </a>
            <p className="max-w-lg text-xl font-bold leading-9 text-zinc-800 hidden lg:block">
              Flexible remote coaching — same results, no gym required.
            </p>
          </div>
        </div>

        {/* ── Consultation tailor ── */}
        <section className="mt-6 rounded-[1.75rem] border border-zinc-200 bg-zinc-50 p-5 sm:p-6 print:hidden">
          <p className="text-sm font-black uppercase tracking-[0.28em] text-[#9a6820]">Consultation Tailor</p>
          <h2 className="mt-3 text-4xl font-black text-[#101010]">Personalise The Offer</h2>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <TextInput label="Client name" value={clientName} onChange={setClientName} />
            <TextInput label="Client phone" value={clientPhone} onChange={setClientPhone} />
            <TextInput label="Client email" value={clientEmail} onChange={setClientEmail} />
            <TextArea label="Goal / outcome" value={clientGoal} onChange={setClientGoal} rows={3} />
            <TextArea label="Consultation notes" value={clientNeeds} onChange={setClientNeeds} rows={3} />
            <TextArea label="Coach recommendation" value={recommendation} onChange={setRecommendation} rows={3} />
          </div>

          {/* Nutrition add-on */}
          <div className="mt-5 rounded-[1.5rem] border border-zinc-200 bg-white p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-[#9a6820]">Nutrition Add-On</p>
                <p className="mt-2 text-lg font-semibold leading-8 text-zinc-700">Add nutrition coaching to the selected package total.</p>
              </div>
              <button
                type="button"
                onClick={() => setNutritionAdded((v) => !v)}
                className={`rounded-full px-5 py-3 text-base font-black transition ${nutritionAdded ? "bg-[#9a6820] text-white" : "bg-[#101010] text-white hover:bg-zinc-800"}`}
              >
                {nutritionAdded ? "Nutrition Added" : "Add Nutrition"}
              </button>
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-[220px_1fr]">
              <NumberInput label="Nutrition weekly price ($)" value={nutritionWeeklyPrice} onChange={setNutritionWeeklyPrice} />
              <TextArea label="Nutrition description" value={nutritionDescription} onChange={setNutritionDescription} rows={3} />
            </div>
          </div>
        </section>

        {/* ── Presentation view ── */}
        <section className="mt-6">
          <div className="flex flex-col gap-4 border-b border-zinc-200 pb-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.28em] text-[#9a6820]">Presentation For</p>
              <h2 className="mt-3 font-[Arial_Narrow] text-6xl uppercase tracking-[0.08em] text-[#101010] sm:text-7xl">
                {clientName || "Client"}
              </h2>
              <p className="mt-3 max-w-3xl text-xl font-bold leading-9 text-zinc-900">{clientGoal}</p>
            </div>
            <div className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-5 text-xl font-bold leading-9 text-zinc-900 shrink-0">
              <p><span className="font-bold text-[#101010]">Selected:</span> {selectedPackage.name}</p>
              <p><span className="font-bold text-[#101010]">Weekly:</span> {dollars(weeklyTotal)}/week</p>
              <p><span className="font-bold text-[#101010]">Minimum:</span> {selectedPackage.minCommitment}</p>
              <p><span className="font-bold text-[#101010]">Total commitment:</span> {totalCommitment}</p>
              <p><span className="font-bold text-[#101010]">Nutrition:</span> {nutritionAdded ? "Included" : "Not added"}</p>
            </div>
          </div>

          {/* Recommendation */}
          <div className="mt-6 rounded-[1.5rem] border border-[#9a6820]/25 bg-[#fdf8ef] p-5">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-[#9a6820]">Why This Fits</p>
            <p className="mt-3 whitespace-pre-wrap text-xl font-black leading-10 text-[#101010]">{recommendation}</p>
          </div>

          {/* Packages grid */}
          <div className="mt-6 grid gap-6 2xl:grid-cols-3">
            {packages.map((pkg) => {
              const isSelected = pkg.id === selectedId;
              const isOpen = pkg.id === openId;
              const isEditing = pkg.id === editingId;
              const commitWeeks = parseInt(pkg.minCommitment);
              const pkgWeeklyTotal = pkg.weeklyPrice + (nutritionAdded ? nutritionWeeklyPrice : 0);

              return (
                <article
                  key={pkg.id}
                  className={`rounded-[1.75rem] border bg-white p-6 transition ${isSelected ? "border-[#9a6820] shadow-[0_18px_45px_rgba(154,104,32,0.18)]" : "border-zinc-200"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      {isEditing ? (
                        <>
                          <div className="mb-2">
                            <Label>Minimum commitment</Label>
                            <input
                              value={pkg.minCommitment}
                              onChange={(e) => updatePackage(pkg.id, { minCommitment: e.target.value })}
                              placeholder="e.g. 8 weeks"
                              className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm font-black text-[#9a6820] outline-none focus:border-[#9a6820]"
                            />
                          </div>
                          <input
                            value={pkg.name}
                            onChange={(e) => updatePackage(pkg.id, { name: e.target.value })}
                            className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-lg font-black text-[#101010] outline-none focus:border-[#9a6820]"
                          />
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-black uppercase tracking-[0.22em] text-[#9a6820]">
                            {pkg.minCommitment} minimum
                          </p>
                          <h3 className="mt-2 text-4xl font-black uppercase tracking-[0.08em] text-[#101010]">{pkg.name}</h3>
                        </>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingId(isEditing ? null : pkg.id)}
                      className="shrink-0 rounded-full bg-zinc-100 px-3 py-2 text-sm font-black uppercase tracking-[0.16em] text-[#101010] print:hidden"
                    >
                      {isEditing ? "Done" : "Edit"}
                    </button>
                  </div>

                  {isEditing ? (
                    <div className="mt-4 grid gap-3">
                      <TextArea label="Tagline" value={pkg.tagline} onChange={(v) => updatePackage(pkg.id, { tagline: v })} rows={2} />
                      <NumberInput label="Weekly price ($)" value={pkg.weeklyPrice} onChange={(v) => updatePackage(pkg.id, { weeklyPrice: v })} />
                      <TextArea
                        label="Results & benefits (one per line)"
                        value={listToText(pkg.results)}
                        onChange={(v) => updatePackage(pkg.id, { results: textToList(v) })}
                        rows={5}
                      />
                      <TextArea
                        label="What is included (one per line)"
                        value={listToText(pkg.inclusions)}
                        onChange={(v) => updatePackage(pkg.id, { inclusions: textToList(v) })}
                        rows={6}
                      />
                    </div>
                  ) : (
                    <>
                      <p className="mt-3 text-xl font-bold leading-9 text-zinc-900">{pkg.tagline}</p>

                      <div className="mt-5 rounded-2xl bg-zinc-50 p-4">
                        <p className="font-[Arial_Narrow] text-7xl text-[#101010]">{dollars(pkgWeeklyTotal)}</p>
                        <p className="text-xl font-black text-zinc-800">per week</p>
                        {Number.isFinite(commitWeeks) && (
                          <p className="mt-3 text-xl font-bold text-zinc-900">
                            {dollars(pkgWeeklyTotal * commitWeeks)} total over {pkg.minCommitment}
                          </p>
                        )}
                        <p className="mt-1 text-base font-semibold text-[#9a6820]">{pkg.minCommitment} minimum commitment</p>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-2 print:hidden">
                        <button
                          type="button"
                          onClick={() => setSelectedId(pkg.id)}
                          className={`rounded-full px-5 py-3 text-lg font-black transition ${isSelected ? "bg-[#9a6820] text-white" : "bg-[#101010] text-white hover:bg-zinc-800"}`}
                        >
                          {isSelected ? "Selected" : "Select"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setOpenId(isOpen ? "" : pkg.id)}
                          className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-bold text-[#101010] transition hover:border-[#9a6820]/60"
                        >
                          {isOpen ? "Hide included" : "Show included"}
                        </button>
                      </div>

                      {isOpen && (
                        <div className="mt-5 space-y-4">
                          {pkg.results.length > 0 && (
                            <div>
                              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#9a6820]">What You Get</p>
                              <ul className="mt-3 space-y-2">
                                {pkg.results.map((r, i) => (
                                  <li key={i} className="flex gap-2 text-base font-semibold text-zinc-800">
                                    <span className="mt-0.5 shrink-0 text-[#9a6820]">✓</span>
                                    {r}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {pkg.inclusions.length > 0 && (
                            <div>
                              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#9a6820]">Included</p>
                              <ul className="mt-3 space-y-2">
                                {pkg.inclusions.map((inc, i) => (
                                  <li key={i} className="flex gap-2 text-base text-zinc-700">
                                    <span className="shrink-0 text-zinc-400">—</span>
                                    {inc}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </article>
              );
            })}
          </div>

          {/* Nutrition add-on banner */}
          {nutritionAdded && (
            <div className="mt-6 rounded-[1.5rem] border border-[#9a6820]/30 bg-white p-5">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-[#9a6820]">Nutrition Added To Package</p>
              <p className="mt-3 text-xl font-bold leading-9 text-zinc-900">{nutritionDescription}</p>
              <p className="mt-4 text-lg font-black text-[#101010]">+ {dollars(nutritionWeeklyPrice)}/week, included in total above</p>
            </div>
          )}

          {/* Consultation notes */}
          <div className="mt-6 rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-5">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-[#9a6820]">Consultation Notes</p>
            <p className="mt-3 whitespace-pre-wrap text-xl font-bold leading-9 text-zinc-900">{clientNeeds}</p>
          </div>

          {/* Action bar */}
          <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-zinc-200 pt-6 print:hidden">
            <a
              href="/pricing-presentation"
              className="rounded-full border border-zinc-200 bg-white px-6 py-4 text-lg font-black text-[#101010] transition hover:border-[#9a6820]/60"
            >
              ← In-Person Packages
            </a>
            <a
              href="/clients"
              className="rounded-full border border-zinc-200 bg-white px-6 py-4 text-lg font-black text-[#101010] transition hover:border-[#9a6820]/60"
            >
              Client Hub
            </a>
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-full bg-[#9a6820] px-6 py-4 text-lg font-black text-white transition hover:brightness-105"
            >
              Print / Save PDF
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}
