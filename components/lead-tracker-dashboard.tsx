"use client";

import { useMemo, useState, useTransition } from "react";
import {
  formatSourceLabel,
  formatStatusLabel,
  getLeadStats,
  leadSources,
  leadStatuses,
  sampleLeads,
  serviceOptions,
  type Lead,
  type LeadSource,
  type LeadStatus
} from "@/lib/leads";

type DashboardProps = {
  initialLeads: Lead[];
  isFallback: boolean;
};

type DraftLead = {
  name: string;
  phone: string;
  email: string;
  goal: string;
  source: LeadSource;
  service_interest: string;
  priority: "1" | "2" | "3";
  budget: string;
  notes: string;
  follow_up_calls: string;
  consultation_sessions_completed: string;
  next_follow_up_at: string;
};

const emptyDraft: DraftLead = {
  name: "",
  phone: "",
  email: "",
  goal: "",
  source: "website",
  service_interest: "1:1 PT",
  priority: "2",
  budget: "",
  notes: "",
  follow_up_calls: "0",
  consultation_sessions_completed: "0",
  next_follow_up_at: ""
};

const statusTone: Record<LeadStatus, string> = {
  new: "border-sky-400/30 bg-sky-400/10 text-sky-100",
  contacted: "border-amber-400/30 bg-amber-400/10 text-amber-100",
  "consult-booked": "border-violet-400/30 bg-violet-400/10 text-violet-100",
  "proposal-sent": "border-orange-400/30 bg-orange-400/10 text-orange-100",
  won: "border-emerald-400/30 bg-emerald-400/10 text-emerald-100",
  lost: "border-rose-400/30 bg-rose-400/10 text-rose-100"
};

export function LeadTrackerDashboard({
  initialLeads,
  isFallback
}: DashboardProps) {
  const [leads, setLeads] = useState(initialLeads);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [sourceFilter, setSourceFilter] = useState<LeadSource | "all">("all");
  const [draft, setDraft] = useState<DraftLead>(emptyDraft);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const filteredLeads = useMemo(() => {
    return leads
      .filter((lead) => {
        const searchBlob =
          `${lead.name} ${lead.email} ${lead.phone} ${lead.goal} ${lead.notes}`.toLowerCase();
        const matchesQuery = !query || searchBlob.includes(query.toLowerCase());
        const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
        const matchesSource = sourceFilter === "all" || lead.source === sourceFilter;

        return matchesQuery && matchesStatus && matchesSource;
      })
      .sort((left, right) => {
        const leftDue = left.next_follow_up_at
          ? new Date(left.next_follow_up_at).getTime()
          : Number.POSITIVE_INFINITY;
        const rightDue = right.next_follow_up_at
          ? new Date(right.next_follow_up_at).getTime()
          : Number.POSITIVE_INFINITY;

        if (leftDue !== rightDue) {
          return leftDue - rightDue;
        }

        if (left.priority !== right.priority) {
          return right.priority - left.priority;
        }

        return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
      });
  }, [leads, query, sourceFilter, statusFilter]);

  const stats = getLeadStats(filteredLeads);

  async function createLead(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (isFallback) {
      const newLead: Lead = {
        id: Math.max(0, ...leads.map((lead) => lead.id)) + 1,
        name: draft.name,
        phone: draft.phone,
        email: draft.email,
        goal: draft.goal,
        source: draft.source,
        service_interest: draft.service_interest,
        priority: Number(draft.priority) as 1 | 2 | 3,
        budget: draft.budget,
        notes: draft.notes,
        follow_up_calls: Number(draft.follow_up_calls) || 0,
        consultation_sessions_completed:
          Number(draft.consultation_sessions_completed) || 0,
        status: "new",
        last_contacted_at: null,
        next_follow_up_at: draft.next_follow_up_at
          ? new Date(draft.next_follow_up_at).toISOString()
          : null,
        created_at: new Date().toISOString()
      };

      setLeads((current) => [newLead, ...current]);
      setDraft(emptyDraft);
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draft,
          priority: Number(draft.priority),
          follow_up_calls: Number(draft.follow_up_calls) || 0,
          consultation_sessions_completed:
            Number(draft.consultation_sessions_completed) || 0
        })
      });

      const payload = (await response.json()) as { error?: string; lead?: Lead };

      if (!response.ok || !payload.lead) {
        setError(payload.error ?? "Could not create lead.");
        return;
      }

      const createdLead = payload.lead;
      setLeads((current) => [createdLead, ...current]);
      setDraft(emptyDraft);
    });
  }

  async function updateLead(leadId: number, update: Partial<Lead>) {
    const sanitizedUpdate = Object.fromEntries(
      Object.entries(update).filter(([, value]) => value !== undefined)
    ) as Partial<Lead>;

    if (isFallback) {
      setLeads((current) =>
        current.map((lead) =>
          lead.id === leadId ? { ...lead, ...sanitizedUpdate } : lead
        )
      );
      return;
    }

    const previousLeads = leads;
    setLeads((current) =>
      current.map((lead) =>
        lead.id === leadId ? { ...lead, ...sanitizedUpdate } : lead
      )
    );

    const response = await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sanitizedUpdate)
    });

    if (!response.ok) {
      setLeads(previousLeads);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(120,119,198,0.18),transparent_25%),radial-gradient(circle_at_top_right,rgba(67,168,139,0.16),transparent_28%),linear-gradient(180deg,#07111a_0%,#0b1621_38%,#061017_100%)] text-slate-100">
      <div className="container-shell max-w-7xl py-10 sm:py-12">
        <section className="relative overflow-hidden rounded-[2.25rem] border border-white/10 bg-white/5 p-7 shadow-glow backdrop-blur sm:p-10">
          <div className="absolute inset-0 bg-grid bg-[size:32px_32px] opacity-20" />
          <div className="relative grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-100">
                PT Lead Tracker
              </div>
              <div className="space-y-4">
                <h1 className="max-w-4xl text-5xl font-semibold leading-tight text-white sm:text-6xl">
                  Keep every enquiry moving from first message to signed client.
                </h1>
                <p className="max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
                  Built for a personal training business: see new leads, book consults,
                  stay on top of follow-ups, and keep sales notes in one place.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Visible Leads" value={stats.total} hint="Current filtered view" />
                <StatCard label="Active Pipeline" value={stats.pipelineValue} hint="Not won or lost" />
                <StatCard label="Clients Won" value={stats.won} hint="Converted leads" />
                <StatCard label="Due Follow-Ups" value={stats.followUps} hint="Needs action now" />
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-slate-950/60 p-6 sm:p-7">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">
                Workflow
              </p>
              <div className="mt-4 space-y-3">
                {leadStatuses.map((status, index) => (
                  <div key={status} className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/5 px-5 py-4">
                    <div>
                      <p className="text-base font-semibold text-white">{formatStatusLabel(status)}</p>
                      <p className="text-sm text-slate-400">Stage {index + 1}</p>
                    </div>
                    <span className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${statusTone[status]}`}>
                      {leads.filter((lead) => lead.status === status).length}
                    </span>
                  </div>
                ))}
              </div>
              {isFallback ? (
                <p className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-5 py-4 text-base leading-7 text-amber-100">
                  Running with sample data right now. Add your Supabase keys to make every lead save permanently.
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-8 2xl:grid-cols-[1.08fr_0.92fr]">
          <form onSubmit={createLead} className="rounded-[2.25rem] border border-white/10 bg-slate-950/55 p-7 backdrop-blur sm:p-8 2xl:sticky 2xl:top-8">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-200/80">
                  Add Lead
                </p>
                <h2 className="mt-2 text-3xl font-semibold text-white">New enquiry capture</h2>
                <p className="mt-3 max-w-2xl text-base leading-7 text-slate-400">
                  Capture the lead once, then manage calls, consults, and follow-ups from the board.
                </p>
              </div>
              <span className="rounded-full border border-white/10 px-4 py-1.5 text-sm text-slate-400">
                Quick intake
              </span>
            </div>

            <div className="mt-7 grid gap-5 md:grid-cols-2">
              <Field label="Full name">
                <input required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className={inputClassName} />
              </Field>
              <Field label="Phone">
                <input required value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} className={inputClassName} />
              </Field>
              <Field label="Email">
                <input required type="email" value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} className={inputClassName} />
              </Field>
              <Field label="Lead source">
                <select value={draft.source} onChange={(event) => setDraft({ ...draft, source: event.target.value as LeadSource })} className={inputClassName}>
                  {leadSources.map((source) => (
                    <option key={source} value={source}>
                      {formatSourceLabel(source)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Service">
                <select value={draft.service_interest} onChange={(event) => setDraft({ ...draft, service_interest: event.target.value })} className={inputClassName}>
                  {serviceOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Priority">
                <select value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value as DraftLead["priority"] })} className={inputClassName}>
                  <option value="1">Low</option>
                  <option value="2">Medium</option>
                  <option value="3">High</option>
                </select>
              </Field>
              <Field label="Budget">
                <input value={draft.budget} onChange={(event) => setDraft({ ...draft, budget: event.target.value })} placeholder="$60-$90/week" className={inputClassName} />
              </Field>
              <Field label="Follow-up calls">
                <input value={draft.follow_up_calls} onChange={(event) => setDraft({ ...draft, follow_up_calls: event.target.value })} type="number" min="0" className={inputClassName} />
              </Field>
              <Field label="Consult sessions done">
                <input value={draft.consultation_sessions_completed} onChange={(event) => setDraft({ ...draft, consultation_sessions_completed: event.target.value })} type="number" min="0" className={inputClassName} />
              </Field>
              <Field label="Next follow-up">
                <input value={draft.next_follow_up_at} onChange={(event) => setDraft({ ...draft, next_follow_up_at: event.target.value })} type="datetime-local" className={inputClassName} />
              </Field>
              <Field label="Goal" className="md:col-span-2">
                <textarea required value={draft.goal} onChange={(event) => setDraft({ ...draft, goal: event.target.value })} rows={3} className={`${inputClassName} resize-none`} />
              </Field>
              <Field label="Notes" className="md:col-span-2">
                <textarea value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} rows={4} className={`${inputClassName} resize-none`} />
              </Field>
            </div>

            {error ? <p className="mt-5 text-base text-rose-300">{error}</p> : null}

            <button type="submit" disabled={isPending} className="mt-7 inline-flex items-center justify-center rounded-full bg-cyan-300 px-6 py-3.5 text-base font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60">
              {isPending ? "Saving..." : "Add lead"}
            </button>
          </form>

          <section className="rounded-[2.25rem] border border-white/10 bg-slate-950/55 p-7 backdrop-blur sm:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-200/80">
                  Lead Board
                </p>
                <h2 className="mt-2 text-3xl font-semibold text-white">Your pipeline at a glance</h2>
                <p className="mt-3 text-base leading-7 text-slate-400">
                  Ordered by nearest follow-up date first, then by lead priority.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search name, goal, note..."
                  className={inputClassName}
                />
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as LeadStatus | "all")} className={inputClassName}>
                  <option value="all">All stages</option>
                  {leadStatuses.map((status) => (
                    <option key={status} value={status}>
                      {formatStatusLabel(status)}
                    </option>
                  ))}
                </select>
                <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value as LeadSource | "all")} className={inputClassName}>
                  <option value="all">All sources</option>
                  {leadSources.map((source) => (
                    <option key={source} value={source}>
                      {formatSourceLabel(source)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-7 space-y-5">
              {filteredLeads.length ? (
                filteredLeads.map((lead) => (
                  <article key={lead.id} className="rounded-[1.8rem] border border-white/10 bg-white/[0.045] p-6 sm:p-7">
                    <div className="flex flex-col gap-6 2xl:flex-row 2xl:items-start 2xl:justify-between">
                      <div className="min-w-0 flex-1 space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-2xl font-semibold text-white sm:text-3xl">{lead.name}</h3>
                          <span className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${statusTone[lead.status]}`}>
                            {formatStatusLabel(lead.status)}
                          </span>
                          <span className="rounded-full border border-white/10 px-4 py-1.5 text-sm text-slate-300">
                            {lead.service_interest}
                          </span>
                        </div>
                        <p className="max-w-3xl break-words text-base leading-8 text-slate-300 sm:text-lg">
                          {lead.goal}
                        </p>
                        <div className="flex flex-wrap gap-x-5 gap-y-2 text-base text-slate-400">
                          <span>{lead.phone}</span>
                          <span className="break-all">{lead.email}</span>
                          <span>{formatSourceLabel(lead.source)}</span>
                          <span>Priority {lead.priority}</span>
                          {lead.budget ? <span>{lead.budget}</span> : null}
                        </div>
                        {lead.notes ? (
                          <p className="rounded-2xl border border-white/8 bg-slate-900/70 px-5 py-4 text-base leading-8 text-slate-300">
                            {lead.notes}
                          </p>
                        ) : null}
                        <div className="grid gap-5 2xl:grid-cols-[1fr_1.15fr]">
                          <div className="rounded-[1.7rem] border border-white/8 bg-slate-900/70 px-6 py-5 text-base text-slate-300">
                            <p className="text-sm uppercase tracking-[0.18em] text-slate-500">
                              Follow-Up Calls
                            </p>
                            <p className="mt-4 text-4xl font-semibold text-white">
                              {lead.follow_up_calls}
                            </p>
                            <button
                              type="button"
                              onClick={() =>
                                updateLead(lead.id, {
                                  follow_up_calls: lead.follow_up_calls + 1,
                                  last_contacted_at: new Date().toISOString()
                                })
                              }
                              className="mt-4 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-5 py-3 text-base font-semibold text-cyan-100 transition hover:bg-cyan-300/20"
                            >
                              Log follow-up call
                            </button>
                          </div>
                          <div className="rounded-[1.7rem] border border-white/8 bg-slate-900/70 px-6 py-5 text-base text-slate-300">
                            <p className="text-sm uppercase tracking-[0.18em] text-slate-500">
                              Consultation
                            </p>
                            <p className="mt-4 text-4xl font-semibold leading-tight text-white">
                              {lead.consultation_sessions_completed} sessions completed
                            </p>
                            <button
                              type="button"
                              onClick={() =>
                                updateLead(lead.id, {
                                  consultation_sessions_completed:
                                    lead.consultation_sessions_completed + 1
                                })
                              }
                              className="mt-4 rounded-full border border-violet-300/30 bg-violet-300/10 px-5 py-3 text-base font-semibold text-violet-100 transition hover:bg-violet-300/20"
                            >
                              Add consultation session
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2 2xl:w-[360px] 2xl:grid-cols-1">
                        <label className="text-base text-slate-300">
                          <span className="mb-2 block text-sm uppercase tracking-[0.18em] text-slate-500">
                            Stage
                          </span>
                          <select
                            value={lead.status}
                            onChange={(event) =>
                              updateLead(lead.id, { status: event.target.value as LeadStatus })
                            }
                            className={inputClassName}
                          >
                            {leadStatuses.map((status) => (
                              <option key={status} value={status}>
                                {formatStatusLabel(status)}
                              </option>
                            ))}
                          </select>
                        </label>

                        <button
                          type="button"
                          onClick={() =>
                            updateLead(lead.id, {
                              last_contacted_at: new Date().toISOString()
                            })
                          }
                          className="rounded-2xl border border-cyan-300/30 bg-cyan-300/10 px-5 py-4 text-base font-semibold text-cyan-100 transition hover:bg-cyan-300/20"
                        >
                          Mark contacted now
                        </button>

                        <div className="rounded-2xl border border-white/8 bg-slate-900/70 px-5 py-4 text-base text-slate-300">
                          <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Last contacted</p>
                          <p className="mt-2 break-words leading-7">{formatDate(lead.last_contacted_at)}</p>
                        </div>

                        <div className="rounded-2xl border border-white/8 bg-slate-900/70 px-5 py-4 text-base text-slate-300">
                          <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Next follow-up</p>
                          <p className="mt-2 break-words leading-7">{formatDate(lead.next_follow_up_at)}</p>
                        </div>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-[1.8rem] border border-dashed border-white/15 bg-white/[0.03] px-8 py-12 text-center text-lg text-slate-400">
                  No leads match this filter yet.
                </div>
              )}
            </div>
          </section>
        </section>

      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  hint
}: {
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <div className="rounded-[1.6rem] border border-white/10 bg-slate-950/60 p-5">
      <p className="text-sm uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-3 text-4xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-base text-slate-400">{hint}</p>
    </div>
  );
}

function Field({
  label,
  className,
  children
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={className}>
      <span className="mb-2 block text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

const inputClassName =
  "w-full rounded-2xl border border-white/10 bg-slate-900/80 px-5 py-4 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/15";
