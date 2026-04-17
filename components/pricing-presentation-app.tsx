"use client";

import { useMemo, useState } from "react";
import type { PricingPresentationRecord } from "@/lib/pricing-presentations";

type SavePricingResponse = {
  pricingPresentation?: PricingPresentationRecord;
  error?: string;
};

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
      "Weekly program and lifestyle optimisation",
      "Coaching app access"
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
      "Technique feedback and habit coaching system",
      "Coaching app access"
    ]
  },
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
      "Basic support for accountability and consistency",
      "Coaching app access"
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
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientGoal, setClientGoal] = useState("Build strength, improve consistency, and feel confident in training.");
  const [clientNeeds, setClientNeeds] = useState("Needs structure, accountability, and a clear plan that fits work and lifestyle.");
  const [recommendation, setRecommendation] = useState("Based on the consultation, Transformation is the best fit because it gives enough weekly contact to build momentum while keeping the plan realistic.");
  const [nutritionAdded, setNutritionAdded] = useState(false);
  const [nutritionWeeklyPrice, setNutritionWeeklyPrice] = useState(49);
  const [nutritionDescription, setNutritionDescription] = useState(
    "Nutrition coaching add-on: calorie and protein targets, simple habit targets, meal structure guidance, weekly nutrition review, and accountability support."
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [showAgreement, setShowAgreement] = useState(false);

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

  async function saveOnline() {
    setIsSaving(true);
    setSaveStatus("Saving pricing presentation online...");

    try {
      const response = await fetch("/api/pricing-presentations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName,
          clientEmail,
          clientPhone,
          clientGoal,
          clientNeeds,
          recommendation,
          selectedPackageId,
          selectedPackage,
          packages,
          nutritionAdded,
          nutritionWeeklyPrice,
          nutritionDescription,
          weeklyTotal,
          upfrontTotal
        })
      });
      const result = (await response.json()) as SavePricingResponse;

      if (!response.ok) {
        throw new Error(result.error || "Could not save this pricing presentation.");
      }

      setSaveStatus(`Saved online. This price presentation is now in Client Hub as record #${result.pricingPresentation?.id ?? "new"}.`);
    } catch (error) {
      setSaveStatus(error instanceof Error ? error.message : "Could not save this pricing presentation.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#050505] px-4 py-6 text-[#101010] sm:px-6 lg:px-10 print:bg-white">
      <section className="mx-auto max-w-[1600px] rounded-[2rem] border border-white/10 bg-white p-5 shadow-[0_26px_100px_rgba(0,0,0,0.45)] sm:p-7 lg:p-9 print:shadow-none">
        <div className="flex flex-col gap-4 border-b border-zinc-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.36em] text-[#9a6820]">The Upper Notch</p>
            <h1 className="mt-3 text-3xl font-black uppercase tracking-[0.12em] text-[#101010] sm:text-6xl">Package Options</h1>
          </div>
          <p className="max-w-2xl text-xl font-bold leading-9 text-zinc-800">
            Tailor this to the consultation, select the best package, and show the client exactly what is included.
          </p>
        </div>

        <section className="mt-6 rounded-[1.75rem] border border-zinc-200 bg-zinc-50 p-5 sm:p-6 print:hidden">
          <p className="text-sm font-black uppercase tracking-[0.28em] text-[#9a6820]">Consultation Tailor</p>
          <h2 className="mt-3 text-4xl font-black text-[#101010]">Personalise The Offer</h2>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <TextInput label="Client name" value={clientName} onChange={setClientName} />
            <TextInput label="Client phone" value={clientPhone} onChange={setClientPhone} />
            <TextInput label="Client email" value={clientEmail} onChange={setClientEmail} />
            <TextArea label="Goal / outcome" value={clientGoal} onChange={setClientGoal} rows={3} />
            <TextArea label="Consultation needs" value={clientNeeds} onChange={setClientNeeds} rows={3} />
            <TextArea label="Coach recommendation" value={recommendation} onChange={setRecommendation} rows={3} />
          </div>

          <div className="mt-5 rounded-[1.5rem] border border-zinc-200 bg-white p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-[#9a6820]">Nutrition Add-On</p>
                <p className="mt-2 text-lg font-semibold leading-8 text-zinc-700">Add nutrition coaching to the selected package total.</p>
              </div>
              <button
                type="button"
                onClick={() => setNutritionAdded((current) => !current)}
                className={`rounded-full px-5 py-3 text-base font-black transition ${nutritionAdded ? "bg-[#9a6820] text-white" : "bg-[#101010] text-white hover:bg-zinc-800"}`}
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
              <p className="text-sm font-black uppercase tracking-[0.28em] text-[#9a6820]">Presentation For</p>
              <h2 className="mt-3 font-[Arial_Narrow] text-6xl uppercase tracking-[0.08em] text-[#101010] sm:text-7xl">{clientName || "Client"}</h2>
              <p className="mt-3 max-w-3xl text-xl font-bold leading-9 text-zinc-900">{clientGoal}</p>
            </div>
            <div className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-5 text-xl font-bold leading-9 text-zinc-900">
              <p><span className="font-bold text-[#101010]">Selected:</span> {selectedPackage.name}</p>
              <p><span className="font-bold text-[#101010]">Weekly total:</span> {dollars(weeklyTotal)}/week</p>
              <p><span className="font-bold text-[#101010]">12-week upfront:</span> {dollars(upfrontTotal)}</p>
              <p><span className="font-bold text-[#101010]">Nutrition:</span> {nutritionAdded ? "Included" : "Not added"}</p>
            </div>
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-[#9a6820]/25 bg-[#fdf8ef] p-5">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-[#9a6820]">Why This Recommendation Fits</p>
            <p className="mt-3 whitespace-pre-wrap text-xl font-black leading-10 text-[#101010]">{recommendation}</p>
            <p className="mt-3 text-xl font-bold leading-9 text-zinc-900">{packageRecommendation}</p>
          </div>

          <div className="mt-6 grid gap-6 2xl:grid-cols-3">
            {packages.map((packageOption) => {
              const isSelected = packageOption.id === selectedPackageId;
              const isOpen = packageOption.id === openPackageId;
              const isEditing = packageOption.id === editingPackageId;

              return (
                <article
                  key={packageOption.id}
                  className={`rounded-[1.75rem] border bg-white p-6 transition ${isSelected ? "border-[#9a6820] shadow-[0_18px_45px_rgba(154,104,32,0.18)]" : "border-zinc-200"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black uppercase tracking-[0.22em] text-[#9a6820]">12 Week Minimum</p>
                      {isEditing ? (
                        <input
                          value={packageOption.name}
                          onChange={(event) => updatePackage(packageOption.id, { name: event.target.value })}
                          className="mt-2 w-full rounded-xl border border-zinc-200 px-3 py-2 text-lg font-black text-[#101010] outline-none focus:border-[#9a6820]"
                        />
                      ) : (
                        <h3 className="mt-2 text-4xl font-black uppercase tracking-[0.08em] text-[#101010]">{packageOption.name}</h3>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingPackageId(isEditing ? null : packageOption.id)}
                      className="rounded-full bg-zinc-100 px-3 py-2 text-sm font-black uppercase tracking-[0.16em] text-[#101010] print:hidden"
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
                      <p className="mt-3 text-xl font-bold leading-9 text-zinc-900">{packageOption.tagline}</p>
                      <div className="mt-5 rounded-2xl bg-zinc-50 p-4">
                        <p className="font-[Arial_Narrow] text-7xl text-[#101010]">{dollars(packageOption.weeklyPrice)}</p>
                        <p className="text-xl font-black text-zinc-800">per week</p>
                        <p className="mt-3 text-xl font-bold text-zinc-900">{dollars(packageOption.upfrontPrice)} upfront</p>
                        <p className="text-xl font-black text-[#9a6820]">Save {dollars(packageOption.savings)}</p>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-2 print:hidden">
                        <button
                          type="button"
                          onClick={() => setSelectedPackageId(packageOption.id)}
                          className={`rounded-full px-5 py-3 text-lg font-black transition ${isSelected ? "bg-[#9a6820] text-white" : "bg-[#101010] text-white hover:bg-zinc-800"}`}
                        >
                          {isSelected ? "Selected" : "Select"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setOpenPackageId(isOpen ? "" : packageOption.id)}
                          className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-bold text-[#101010] transition hover:border-[#9a6820]/60"
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
            <div className="mt-6 rounded-[1.5rem] border border-[#9a6820]/30 bg-white p-5">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-[#9a6820]">Nutrition Added To Package</p>
              <p className="mt-3 text-xl font-bold leading-9 text-zinc-900">{nutritionDescription}</p>
              <p className="mt-4 text-lg font-black text-[#101010]">+ {dollars(nutritionWeeklyPrice)}/week, included in total above</p>
            </div>
          ) : null}

          <div className="mt-6 rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-5">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-[#9a6820]">Consultation Notes</p>
            <p className="mt-3 whitespace-pre-wrap text-xl font-bold leading-9 text-zinc-900">{clientNeeds}</p>
          </div>

          {saveStatus ? (
            <div className="mt-6 rounded-[1.25rem] border border-zinc-200 bg-zinc-50 p-5 text-lg font-bold leading-8 text-zinc-900 print:hidden">
              {saveStatus}
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-zinc-200 pt-6 print:hidden">
            <a href="/onboarding" className="rounded-full border border-zinc-200 bg-white px-6 py-4 text-lg font-black text-[#101010] transition hover:border-[#9a6820]/60">
              Onboarding
            </a>
            <a href="/clients" className="rounded-full border border-zinc-200 bg-white px-6 py-4 text-lg font-black text-[#101010] transition hover:border-[#9a6820]/60">
              Client Hub
            </a>
            <button
              type="button"
              onClick={saveOnline}
              disabled={isSaving}
              className="rounded-full bg-[#101010] px-6 py-4 text-lg font-black text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? "Saving..." : "Save Online"}
            </button>
            <button
              type="button"
              onClick={() => setShowAgreement(true)}
              className="rounded-full border-2 border-[#9a6820] bg-white px-6 py-4 text-lg font-black text-[#9a6820] transition hover:bg-[#fdf3e3]"
            >
              Generate Agreement
            </button>
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

      {/* ── Trainer–Client Agreement Modal ──────────────────────────────── */}
      {showAgreement && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 py-8 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl my-4">

            {/* Modal header – screen only */}
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-5 print:hidden">
              <div>
                <p className="text-xs uppercase tracking-widest font-black text-[#9a6820]">Upper Notch Coaching</p>
                <h2 className="mt-0.5 text-lg font-black text-[#101010]">Trainer & Client Agreement</h2>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="rounded-full bg-[#9a6820] px-4 py-2 text-sm font-black text-white transition hover:brightness-105">
                  Print / Save PDF
                </button>
                <button onClick={() => setShowAgreement(false)} className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100">✕</button>
              </div>
            </div>

            {/* Agreement document */}
            <div id="agreement-print" className="px-8 py-8 space-y-6 text-[#101010]">

              {/* Letterhead */}
              <div className="text-center border-b border-zinc-200 pb-6">
                <p className="text-xs uppercase tracking-[0.3em] font-black text-[#9a6820]">Upper Notch Coaching</p>
                <h1 className="mt-2 text-2xl font-black text-[#101010]">Trainer & Client Agreement</h1>
                <p className="mt-1 text-sm text-zinc-500">Jazzay Sallah Personal Training (JS PT)</p>
              </div>

              {/* Client details band */}
              <div className="rounded-2xl border border-[#9a6820]/25 bg-[#fdf8ef] px-5 py-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-black text-[#9a6820]">Client Name</p>
                  <p className="font-bold text-[#101010] mt-0.5">{clientName}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-black text-[#9a6820]">Package</p>
                  <p className="font-bold text-[#101010] mt-0.5">{selectedPackage.name} — {dollars(weeklyTotal)}/wk{nutritionAdded ? " (incl. nutrition)" : ""}</p>
                </div>
                {clientPhone && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-black text-[#9a6820]">Phone</p>
                    <p className="font-bold text-[#101010] mt-0.5">{clientPhone}</p>
                  </div>
                )}
                {clientEmail && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-black text-[#9a6820]">Email</p>
                    <p className="font-bold text-[#101010] mt-0.5">{clientEmail}</p>
                  </div>
                )}
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-black text-[#9a6820]">Agreement Date</p>
                  <p className="font-bold text-[#101010] mt-0.5">{new Date().toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}</p>
                </div>
              </div>

              {/* Clauses */}
              {[
                {
                  title: "Health & Medical Responsibility",
                  body: "I confirm that I am physically capable of participating in exercise and training activities. I understand that it is my responsibility to consult with a medical professional before beginning any exercise program if I have any medical conditions, injuries, or health concerns. I agree to inform the trainer of any health changes, injuries, discomfort, or pain experienced during training sessions so that exercises can be adjusted where necessary."
                },
                {
                  title: "Assumption of Risk",
                  body: "I understand that participation in physical exercise — including strength training, cardiovascular exercise, and other fitness activities — involves inherent risks such as muscle soreness, injury, or other physical complications. I voluntarily participate in all training activities and assume full responsibility for any risks, injuries, or damages that may occur."
                },
                {
                  title: "Release of Liability",
                  body: "I release and hold harmless Upper Notch Coaching and Jazzay Sallah Personal Training (JS PT), its trainers, and any associated staff from any liability, claims, demands, or causes of action that may arise from participation in personal training sessions, including injury, illness, or damages resulting from exercise activities."
                },
                {
                  title: "Supplement & Lifestyle Advice",
                  body: "Any advice provided regarding nutrition, supplements, or lifestyle is for educational purposes only and should not be considered medical advice. Clients should consult a qualified healthcare professional before beginning any supplementation or making significant dietary changes."
                },
                {
                  title: "Client Responsibility",
                  body: "I agree to follow the trainer's instructions during sessions and to train within my personal limits. I understand that results depend on personal effort, consistency, and lifestyle factors outside of training sessions."
                },
                {
                  title: "Payments & Pricing",
                  body: "All personal training sessions and packages must be paid in advance of the scheduled session. Payments may be made via direct debit or upfront payment as agreed. Failure to complete payment may result in suspension or cancellation of sessions until payment is received."
                },
                {
                  title: "Minimum Commitment",
                  body: "All training packages require a minimum commitment of 12 weeks. This commitment is in place to allow sufficient time for measurable progress and results."
                },
                {
                  title: "24-Hour Cancellation Policy",
                  body: "All personal training sessions require a minimum of 24 hours' notice for cancellation or rescheduling. If less than 24 hours' notice is provided, the session will be charged in full, as the time has been reserved and cannot be filled on short notice."
                },
                {
                  title: "Notice of Cancellation",
                  body: "Clients must provide a minimum of 2 weeks' written notice if they wish to cancel ongoing training services. Any sessions scheduled within this notice period will remain payable."
                },
                {
                  title: "Going Away?",
                  body: "If you have a holiday or trip planned, just let Jazzay know in advance. Any time missed due to travel can be made up with complementary sessions before you leave or after you're back — so you never lose what you've paid for."
                }
              ].map(clause => (
                <div key={clause.title}>
                  <h3 className="text-sm font-black text-[#101010] mb-1">{clause.title}</h3>
                  <p className="text-sm leading-7 text-zinc-600">{clause.body}</p>
                </div>
              ))}

              {/* Signature block */}
              <div className="border-t border-zinc-200 pt-6 space-y-5">
                <p className="text-sm font-bold text-[#101010]">By signing below, both parties confirm they have read, understood, and agree to all terms outlined in this agreement.</p>

                <div className="grid gap-6 sm:grid-cols-2">
                  {/* Client */}
                  <div className="space-y-4">
                    <p className="text-xs font-black uppercase tracking-widest text-[#9a6820]">Client Acknowledgement & Signature</p>
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Client Name</p>
                      <div className="border-b-2 border-zinc-300 pb-1 min-h-[28px] text-sm font-bold text-[#101010]">{clientName}</div>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Signature</p>
                      <div className="border-b-2 border-zinc-300 pb-1 min-h-[36px]"></div>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Date</p>
                      <div className="border-b-2 border-zinc-300 pb-1 min-h-[28px] text-sm text-[#101010]">{new Date().toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}</div>
                    </div>
                  </div>

                  {/* Trainer */}
                  <div className="space-y-4">
                    <p className="text-xs font-black uppercase tracking-widest text-[#9a6820]">Trainer</p>
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Trainer Name</p>
                      <div className="border-b-2 border-zinc-300 pb-1 min-h-[28px] text-sm font-bold text-[#101010]">Jazzay Sallah</div>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Signature</p>
                      <div className="border-b-2 border-zinc-300 pb-1 min-h-[36px]"></div>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Date</p>
                      <div className="border-b-2 border-zinc-300 pb-1 min-h-[28px] text-sm text-[#101010]">{new Date().toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}</div>
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-center text-zinc-400 pt-2">Upper Notch Coaching · Jazzay Sallah Personal Training (JS PT) · {new Date().getFullYear()}</p>
              </div>
            </div>

          </div>
        </div>
      )}

    </main>
  );
}

function PackageDetails({ packageOption }: { packageOption: PackageOption }) {
  return (
    <div className="mt-5 grid gap-4 text-xl font-bold leading-9 text-zinc-900">
      <div>
        <p className="rounded-full bg-[#101010] px-4 py-2 text-lg font-black uppercase tracking-[0.2em] text-white">Results and Benefits</p>
        <ul className="mt-3 space-y-3">
          {packageOption.results.map((item) => (
            <li key={item} className="rounded-2xl border border-zinc-200 bg-white px-5 py-4 shadow-sm">{item}</li>
          ))}
        </ul>
      </div>
      <div>
        <p className="rounded-full bg-[#9a6820] px-4 py-2 text-xl font-black uppercase tracking-[0.2em] text-white">What Is Included</p>
        <ul className="mt-3 space-y-3">
          {packageOption.inclusions.map((item) => (
            <li key={item} className="rounded-2xl border border-zinc-200 bg-white px-5 py-4 shadow-sm">{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function TextInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="text-sm font-black uppercase tracking-[0.2em] text-[#9a6820]">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-zinc-300 bg-white px-5 py-4 text-lg font-bold normal-case tracking-normal text-[#101010] outline-none transition focus:border-[#9a6820] focus:ring-4 focus:ring-[#9a6820]/15"
      />
    </label>
  );
}

function NumberInput({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="text-sm font-black uppercase tracking-[0.2em] text-[#9a6820]">
      {label}
      <input
        type="number"
        value={value}
        onChange={(event) => onChange(numberFromInput(event.target.value))}
        className="mt-2 w-full rounded-2xl border border-zinc-300 bg-white px-5 py-4 text-lg font-bold normal-case tracking-normal text-[#101010] outline-none transition focus:border-[#9a6820] focus:ring-4 focus:ring-[#9a6820]/15"
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
    <label className="text-sm font-black uppercase tracking-[0.2em] text-[#9a6820]">
      {label}
      <textarea
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full resize-y rounded-2xl border border-zinc-300 bg-white px-5 py-4 text-lg font-bold normal-case leading-8 tracking-normal text-[#101010] outline-none transition focus:border-[#9a6820] focus:ring-4 focus:ring-[#9a6820]/15"
      />
    </label>
  );
}
