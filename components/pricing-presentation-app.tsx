"use client";

import { useMemo, useState } from "react";

type PackageOption = {
  id: string;
  name: string;
  tagline: string;
  weeklyPrice: number;
  upfrontPrice: number;
  savings: number;
  results: string[];
  inclusions: string[];
};

const initialPackages: PackageOption[] = [
  {
    id: "foundation",
    name: "Foundation",
    tagline: "Build consistency and start seeing results",
    weeklyPrice: 129,
    upfrontPrice: 1376,
    savings: 172,
    results: [
      "Develop strong training habits and routine",
      "Improve confidence and motivation",
      "Become more self-motivated and independent",
      "Make sustainable progress"
    ],
    inclusions: [
      "1x personal training session per week",
      "Structured training program tailored to your goals",
      "Weekly check-ins and habit tracking: steps, sleep, water",
      "Basic support for accountability and consistency"
    ]
  },
  {
    id: "transformation",
    name: "Transformation",
    tagline: "Faster results and higher accountability",
    weeklyPrice: 199,
    upfrontPrice: 1956,
    savings: 432,
    results: [
      "Hit your goals faster with increased frequency",
      "Higher accountability and motivation",
      "Noticeable physique and performance changes",
      "Stay locked in with regular guidance"
    ],
    inclusions: [
      "2x personal training sessions per week",
      "Progressively updated training program",
      "Weekly check-ins and direct messaging support: Mon-Fri",
      "Technique feedback and habit coaching system"
    ]
  },
  {
    id: "elite",
    name: "Elite",
    tagline: "Maximum results and complete transformation",
    weeklyPrice: 289,
    upfrontPrice: 2836,
    savings: 632,
    results: [
      "Fastest rate of progress possible",
      "Highest level of accountability and motivation",
      "Full lifestyle and performance optimisation",
      "Everything dialled in for you with no guesswork"
    ],
    inclusions: [
      "3x personal training sessions per week",
      "Fully customised training and progression system",
      "Priority check-ins and unlimited support",
      "Weekly program and lifestyle optimisation"
    ]
  }
];

function dollars(value: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0
  }).format(Number.isFinite(value) ? value : 0);
}

function numberFromInput(value: string) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function listToText(items: string[]) {
  return items.join("\n");
}

function textToList(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function PricingPresentationApp() {
  const [packages, setPackages] = useState(initialPackages);
  const [selectedPackageId, setSelectedPackageId] = useState(initialPackages[1].id);
  const [openPackageId, setOpenPackageId] = useState(initialPackages[1].id);
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
  const [clientName, setClientName] = useState("Client Name");
  const [clientGoal, setClientGoal] = useState("Build strength, improve consistency, and feel confident in training.");
  const [clientNeeds, setClientNeeds] = useState("Needs structure, accountability, and a clear plan that fits work and lifestyle.");
  const [recommendation, setRecommendation] = useState("Based on the consultation, Transformation is the best fit because it gives enough weekly contact to build momentum while keeping the plan realistic.");
  const [nutritionAdded, setNutritionAdded] = useState(false);
  const [nutritionWeeklyPrice, setNutritionWeeklyPrice] = useState(49);
  const [nutritionDescription, setNutritionDescription] = useState(
    "Nutrition coaching add-on: calorie and protein targets, simple habit targets, meal structure guidance, weekly nutrition review, and accountability support."
  );

  const selectedPackage = packages.find((item) => item.id === selectedPackageId) ?? packages[0];
  const weeklyTotal = selectedPackage.weeklyPrice + (nutritionAdded ? nutritionWeeklyPrice : 0);
  const upfrontTotal = selectedPackage.upfrontPrice + (nutritionAdded ? nutritionWeeklyPrice * 12 : 0);

  const packageRecommendation = useMemo(() => {
    if (selectedPackage.id === "foundation") {
      return "Best when the client needs a simple start, a sustainable routine, and lower weekly support.";
    }

    if (selectedPackage.id === "elite") {
      return "Best when the client wants the highest support level, fastest possible progress, and full lifestyle structure.";
    }

    return "Best when the client wants stronger accountability, faster progress, and enough support to stay locked in.";
  }, [selectedPackage.id]);

  function updatePackage(id: string, update: Partial<PackageOption>) {
    setPackages((current) =>
      current.map((item) => (item.id === id ? { ...item, ...update } : item))
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] px-4 py-6 text-[#101010] sm:px-6 lg:px-10 print:bg-white">
      <section className="mx-auto max-w-[1600px] rounded-[2rem] border border-white/10 bg-white p-5 shadow-[0_26px_100px_rgba(0,0,0,0.45)] sm:p-7 lg:p-9 print:shadow-none">
        <div className="flex flex-col gap-4 border-b border-zinc-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.36em] text-[#f02f9b]">Upper Notch Coaching</p>
            <h1 className="mt-3 text-3xl font-black uppercase tracking-[0.12em] text-[#101010] sm:text-5xl">Package Options</h1>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-zinc-600">
            Tailor this to the consultation, select the best package, and show the client exactly what is included.
          </p>
        </div>

        <section className="mt-6 rounded-[1.75rem] border border-zinc-200 bg-zinc-50 p-5 sm:p-6 print:hidden">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#f02f9b]">Consultation Tailor</p>
          <h2 className="mt-3 text-2xl font-black text-[#101010]">Personalise The Offer</h2>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <TextInput label="Client name" value={clientName} onChange={setClientName} />
            <TextArea label="Goal / outcome" value={clientGoal} onChange={setClientGoal} rows={3} />
            <TextArea label="Consultation needs" value={clientNeeds} onChange={setClientNeeds} rows={3} />
            <TextArea label="Coach recommendation" value={recommendation} onChange={setRecommendation} rows={3} />
          </div>

          <div className="mt-5 rounded-[1.5rem] border border-zinc-200 bg-white p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#f02f9b]">Nutrition Add-On</p>
                <p className="mt-2 text-sm leading-6 text-zinc-600">Add nutrition coaching to the selected package total.</p>
              </div>
              <button
                type="button"
                onClick={() => setNutritionAdded((current) => !current)}
                className={`rounded-full px-5 py-3 text-sm font-bold transition ${nutritionAdded ? "bg-[#f02f9b] text-white" : "bg-[#101010] text-white hover:bg-zinc-800"}`}
              >
                {nutritionAdded ? "Nutrition Added" : "Add Nutrition"}
              </button>
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-[220px_1fr]">
              <NumberInput label="Nutrition weekly price" value={nutritionWeeklyPrice} onChange={setNutritionWeeklyPrice} />
              <TextArea label="Nutrition description" value={nutritionDescription} onChange={setNutritionDescription} rows={3} />
            </div>
          </div>
        </section>

        <section className="mt-6">
          <div className="flex flex-col gap-4 border-b border-zinc-200 pb-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#f02f9b]">Presentation For</p>
              <h2 className="mt-3 font-[Arial_Narrow] text-5xl uppercase tracking-[0.08em] text-[#101010] sm:text-6xl">{clientName || "Client"}</h2>
              <p className="mt-3 max-w-3xl text-base leading-8 text-zinc-700">{clientGoal}</p>
            </div>
            <div className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-5 text-base leading-8 text-zinc-700">
              <p><span className="font-bold text-[#101010]">Selected:</span> {selectedPackage.name}</p>
              <p><span className="font-bold text-[#101010]">Weekly total:</span> {dollars(weeklyTotal)}/week</p>
              <p><span className="font-bold text-[#101010]">12-week upfront:</span> {dollars(upfrontTotal)}</p>
              <p><span className="font-bold text-[#101010]">Nutrition:</span> {nutritionAdded ? "Included" : "Not added"}</p>
            </div>
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-[#f02f9b]/25 bg-[#fff3fa] p-5">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#f02f9b]">Why This Recommendation Fits</p>
            <p className="mt-3 whitespace-pre-wrap text-base leading-8 text-[#101010]">{recommendation}</p>
            <p className="mt-3 text-base leading-8 text-zinc-700">{packageRecommendation}</p>
          </div>

          <div className="mt-6 grid gap-5 xl:grid-cols-3">
            {packages.map((packageOption) => {
              const isSelected = packageOption.id === selectedPackageId;
              const isOpen = packageOption.id === openPackageId;
              const isEditing = packageOption.id === editingPackageId;

              return (
                <article
                  key={packageOption.id}
                  className={`rounded-[1.75rem] border bg-white p-5 transition ${isSelected ? "border-[#f02f9b] shadow-[0_18px_45px_rgba(240,47,155,0.18)]" : "border-zinc-200"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-[#f02f9b]">12 Week Minimum</p>
                      {isEditing ? (
                        <input
                          value={packageOption.name}
                          onChange={(event) => updatePackage(packageOption.id, { name: event.target.value })}
                          className="mt-2 w-full rounded-xl border border-zinc-200 px-3 py-2 text-lg font-black text-[#101010] outline-none focus:border-[#f02f9b]"
                        />
                      ) : (
                        <h3 className="mt-2 text-2xl font-black uppercase tracking-[0.08em] text-[#101010]">{packageOption.name}</h3>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingPackageId(isEditing ? null : packageOption.id)}
                      className="rounded-full bg-zinc-100 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#101010] print:hidden"
                    >
                      {isEditing ? "Done" : "Edit"}
                    </button>
                  </div>

                  {isEditing ? (
                    <div className="mt-4 grid gap-3">
                      <TextArea label="Tagline" value={packageOption.tagline} onChange={(value) => updatePackage(packageOption.id, { tagline: value })} rows={2} />
                      <NumberInput label="Weekly price" value={packageOption.weeklyPrice} onChange={(value) => updatePackage(packageOption.id, { weeklyPrice: value })} />
                      <NumberInput label="Upfront price" value={packageOption.upfrontPrice} onChange={(value) => updatePackage(packageOption.id, { upfrontPrice: value })} />
                      <NumberInput label="Upfront saving" value={packageOption.savings} onChange={(value) => updatePackage(packageOption.id, { savings: value })} />
                      <TextArea label="Results and benefits" value={listToText(packageOption.results)} onChange={(value) => updatePackage(packageOption.id, { results: textToList(value) })} rows={5} />
                      <TextArea label="What is included" value={listToText(packageOption.inclusions)} onChange={(value) => updatePackage(packageOption.id, { inclusions: textToList(value) })} rows={5} />
                    </div>
                  ) : (
                    <>
                      <p className="mt-3 text-base leading-7 text-zinc-700">{packageOption.tagline}</p>
                      <div className="mt-5 rounded-2xl bg-zinc-50 p-4">
                        <p className="font-[Arial_Narrow] text-5xl text-[#101010]">{dollars(packageOption.weeklyPrice)}</p>
                        <p className="text-sm font-semibold text-zinc-600">per week</p>
                        <p className="mt-3 text-base text-zinc-700">{dollars(packageOption.upfrontPrice)} upfront</p>
                        <p className="text-sm font-bold text-[#f02f9b]">Save {dollars(packageOption.savings)}</p>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-2 print:hidden">
                        <button
                          type="button"
                          onClick={() => setSelectedPackageId(packageOption.id)}
                          className={`rounded-full px-4 py-2 text-sm font-bold transition ${isSelected ? "bg-[#f02f9b] text-white" : "bg-[#101010] text-white hover:bg-zinc-800"}`}
                        >
                          {isSelected ? "Selected" : "Select"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setOpenPackageId(isOpen ? "" : packageOption.id)}
                          className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-bold text-[#101010] transition hover:border-[#f02f9b]/60"
                        >
                          {isOpen ? "Hide included" : "Show included"}
                        </button>
                      </div>

                      {isOpen ? <PackageDetails packageOption={packageOption} /> : null}
                    </>
                  )}
                </article>
              );
            })}
          </div>

          {nutritionAdded ? (
            <div className="mt-6 rounded-[1.5rem] border border-[#f02f9b]/30 bg-white p-5">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#f02f9b]">Nutrition Added To Package</p>
              <p className="mt-3 text-base leading-8 text-zinc-700">{nutritionDescription}</p>
              <p className="mt-4 text-lg font-black text-[#101010]">+ {dollars(nutritionWeeklyPrice)}/week, included in total above</p>
            </div>
          ) : null}

          <div className="mt-6 rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-5">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#f02f9b]">Consultation Notes</p>
            <p className="mt-3 whitespace-pre-wrap text-base leading-8 text-zinc-700">{clientNeeds}</p>
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-zinc-200 pt-6 print:hidden">
            <a href="/onboarding" className="rounded-full border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-[#101010] transition hover:border-[#f02f9b]/60">
              Onboarding
            </a>
            <a href="/clients" className="rounded-full border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-[#101010] transition hover:border-[#f02f9b]/60">
              Client Hub
            </a>
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-full bg-[#f02f9b] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-105"
            >
              Print / Save PDF
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}

function PackageDetails({ packageOption }: { packageOption: PackageOption }) {
  return (
    <div className="mt-5 grid gap-4 text-base leading-7 text-zinc-700">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#f02f9b]">Results and Benefits</p>
        <ul className="mt-3 space-y-2">
          {packageOption.results.map((item) => (
            <li key={item} className="rounded-2xl bg-zinc-50 px-3 py-2">{item}</li>
          ))}
        </ul>
      </div>
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#f02f9b]">What Is Included</p>
        <ul className="mt-3 space-y-2">
          {packageOption.inclusions.map((item) => (
            <li key={item} className="rounded-2xl bg-zinc-50 px-3 py-2">{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function TextInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="text-xs font-bold uppercase tracking-[0.2em] text-[#f02f9b]">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm normal-case tracking-normal text-[#101010] outline-none transition focus:border-[#f02f9b] focus:ring-4 focus:ring-[#f02f9b]/15"
      />
    </label>
  );
}

function NumberInput({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="text-xs font-bold uppercase tracking-[0.2em] text-[#f02f9b]">
      {label}
      <input
        type="number"
        value={value}
        onChange={(event) => onChange(numberFromInput(event.target.value))}
        className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm normal-case tracking-normal text-[#101010] outline-none transition focus:border-[#f02f9b] focus:ring-4 focus:ring-[#f02f9b]/15"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 3
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <label className="text-xs font-bold uppercase tracking-[0.2em] text-[#f02f9b]">
      {label}
      <textarea
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full resize-y rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm normal-case leading-6 tracking-normal text-[#101010] outline-none transition focus:border-[#f02f9b] focus:ring-4 focus:ring-[#f02f9b]/15"
      />
    </label>
  );
}
