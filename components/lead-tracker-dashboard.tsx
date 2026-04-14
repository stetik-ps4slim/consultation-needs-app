"use client";

import { useMemo, useState, useTransition } from "react";
import {
  formatSourceLabel,
  formatStatusLabel,
  getLeadStats,
  leadSources,
  leadStatuses,
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
  new: "border-sky-300/50 bg-sky-50 text-sky-700",
  contacted: "border-amber-300/50 bg-amber-50 text-amber-700",
  "consult-booked": "border-violet-300/50 bg-violet-50 text-violet-700",
  "proposal-sent": "border-orange-300/50 bg-orange-50 text-orange-700",
  won: "border-emerald-300/50 bg-emerald-50 text-emerald-700",
  lost: "border-rose-300/50 bg-rose-50 text-rose-700"
};

function isOverdue(dateStr: string | null) {
  if (!dateStr) return false;
  return new Date(dateStr).getTime() <= Date.now();
}

function formatDateTime(value: string | null) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-AU", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function formatDateTimeLocal(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

const inputCls = "w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-[#10233f] outline-none transition placeholder:text-stone-400 focus:border-[#9a6820] focus:ring-2 focus:ring-[#9a6820]/15";

export function LeadTrackerDashboard({ initialLeads, isFallback }: DashboardProps) {
  const [leads, setLeads] = useState(initialLeads);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [sourceFilter, setSourceFilter] = useState<LeadSource | "all">("all");
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<DraftLead>(emptyDraft);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const blob = `${lead.name} ${lead.email} ${lead.phone} ${lead.goal} ${lead.notes}`.toLowerCase();
      const matchesQuery = !query || blob.includes(query.toLowerCase());
      const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
      const matchesSource = sourceFilter === "all" || lead.source === sourceFilter;
      return matchesQuery && matchesStatus && matchesSource;
    });
  }, [leads, query, statusFilter, sourceFilter]);

  const stats = useMemo(() => getLeadStats(filteredLeads), [filteredLeads]);
  const dueCount = useMemo(
    () => leads.filter((l) => isOverdue(l.next_follow_up_at) && !["won", "lost"].includes(l.status)).length,
    [leads]
  );

  async function createLead(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    startTransition(async () => {
      try {
        const response = await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...draft,
            priority: Number(draft.priority),
            follow_up_calls: Number(draft.follow_up_calls),
            consultation_sessions_completed: Number(draft.consultation_sessions_completed)
          })
        });
        const payload = (await response.json()) as { lead?: Lead; error?: string };
        if (!response.ok) throw new Error(payload.error || "Could not save lead.");
        if (payload.lead) setLeads((prev) => [payload.lead as Lead, ...prev]);
        setDraft(emptyDraft);
        setShowForm(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  function updateLeadOptimistic(id: number, patch: Partial<Lead>) {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    startTransition(async () => {
      await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch)
      });
    });
  }

  function logFollowUp(lead: Lead) {
    updateLeadOptimistic(lead.id, {
      follow_up_calls: lead.follow_up_calls + 1,
      last_contacted_at: new Date().toISOString(),
      status: lead.status === "new" ? "contacted" : lead.status
    });
  }

  function addConsultation(lead: Lead) {
    updateLeadOptimistic(lead.id, {
      consultation_sessions_completed: lead.consultation_sessions_completed + 1,
      status: lead.status === "new" || lead.status === "contacted" ? "consult-booked" : lead.status
    });
  }

  async function deleteLead(id: number) {
    await fetch(`/api/leads/${id}`, { method: "DELETE" });
    setLeads((prev) => prev.filter((l) => l.id !== id));
    setDeleteConfirm(null);
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(160deg,#f7f4ef_0%,#ede8df_100%)] text-[#10233f]">
      {/* Page header */}
      <div className="border-b border-stone-200 bg-white/80 backdrop-blur">
        <div className="container-shell max-w-7xl py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.36em] text-[#9a6820]">The Upper Notch</p>
              <h1 className="mt-1 text-2xl font-black text-[#10233f]">Lead Tracker</h1>
              <p className="text-sm text-[#6b7b91]">Manage your pipeline and follow-ups</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <a href="/" className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-[#15314a] transition hover:border-[#9a6820]/60">New Consultation</a>
              <a href="/onboarding" className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-[#15314a] transition hover:border-[#9a6820]/60">Onboarding</a>
              <a href="/clients" className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-[#15314a] transition hover:border-[#9a6820]/60">Client Hub</a>
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="rounded-full bg-[#9a6820] px-5 py-2 text-sm font-semibold text-white transition hover:brightness-105"
              >
                + Add Lead
              </button>
            </div>
          </div>
          {isFallback && (
            <p className="mt-3 inline-flex rounded-lg border border-amber-300/50 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
              Running on sample data — add your Supabase keys to save changes permanently.
            </p>
          )}
        </div>
      </div>

      <div className="container-shell max-w-7xl py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Visible Leads" value={filteredLeads.length} />
          <StatCard label="Active Pipeline" value={stats.pipelineValue} />
          <StatCard label="Clients Won" value={stats.won} />
          <StatCard label="Due Follow-Ups" value={dueCount} highlight={dueCount > 0} />
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4">
          <div className="flex min-w-48 flex-1 items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2">
            <svg className="h-4 w-4 shrink-0 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" /></svg>
            <input
              type="text"
              placeholder="Search leads..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm text-[#10233f] outline-none placeholder:text-stone-400"
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as LeadStatus | "all")} className={inputCls + " w-auto min-w-32"}>
            <option value="all">All Status</option>
            {leadStatuses.map((s) => <option key={s} value={s}>{formatStatusLabel(s)}</option>)}
          </select>
          <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value as LeadSource | "all")} className={inputCls + " w-auto min-w-32"}>
            <option value="all">All Sources</option>
            {leadSources.map((s) => <option key={s} value={s}>{formatSourceLabel(s)}</option>)}
          </select>
        </div>

        {/* Lead list */}
        <div className="mt-5 space-y-3">
          {filteredLeads.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-white/60 py-14 text-center">
              <p className="text-base font-semibold text-[#6b7b91]">No leads match this filter yet.</p>
              <p className="mt-1 text-sm text-stone-400">Add your first lead or adjust filters above.</p>
            </div>
          ) : (
            filteredLeads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                expanded={expandedId === lead.id}
                onToggle={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
                onUpdate={updateLeadOptimistic}
                onLogFollowUp={() => logFollowUp(lead)}
                onAddConsultation={() => addConsultation(lead)}
                onDeleteRequest={() => setDeleteConfirm(lead.id)}
                deleteConfirm={deleteConfirm === lead.id}
                onDeleteConfirm={() => deleteLead(lead.id)}
                onDeleteCancel={() => setDeleteConfirm(null)}
              />
            ))
          )}
        </div>
      </div>

      {/* Add lead modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-y-auto rounded-2xl border border-stone-200 bg-white shadow-2xl" style={{ maxHeight: "90vh" }}>
            <div className="flex items-center justify-between border-b border-stone-200 px-6 py-5">
              <h2 className="text-lg font-black text-[#10233f]">Add New Lead</h2>
              <button type="button" onClick={() => { setShowForm(false); setError(""); }} className="text-stone-400 transition hover:text-[#10233f]">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={createLead} className="grid gap-4 p-6 sm:grid-cols-2">
              {([
                { key: "name", label: "Name *", placeholder: "Full name", required: true },
                { key: "phone", label: "Phone", placeholder: "0400 000 000" },
                { key: "email", label: "Email", placeholder: "email@example.com" },
                { key: "goal", label: "Goal", placeholder: "What are they trying to achieve?" },
                { key: "budget", label: "Budget", placeholder: "$200–$300/wk" },
                { key: "service_interest", label: "Service Interest", placeholder: "e.g. Hybrid Coaching" }
              ] as Array<{ key: keyof DraftLead; label: string; placeholder: string; required?: boolean }>).map(({ key, label, placeholder, required }) => (
                <div key={key}>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-stone-400">{label}</label>
                  <input
                    type="text"
                    required={required}
                    placeholder={placeholder}
                    value={draft[key] as string}
                    onChange={(e) => setDraft((p) => ({ ...p, [key]: e.target.value }))}
                    className={inputCls}
                  />
                </div>
              ))}
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-stone-400">Source</label>
                <select value={draft.source} onChange={(e) => setDraft((p) => ({ ...p, source: e.target.value as LeadSource }))} className={inputCls}>
                  {leadSources.map((s) => <option key={s} value={s}>{formatSourceLabel(s)}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-stone-400">Priority</label>
                <select value={draft.priority} onChange={(e) => setDraft((p) => ({ ...p, priority: e.target.value as DraftLead["priority"] }))} className={inputCls}>
                  <option value="3">High</option>
                  <option value="2">Medium</option>
                  <option value="1">Low</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-stone-400">Status</label>
                <select value={draft.source} onChange={(e) => setDraft((p) => ({ ...p, source: e.target.value as LeadSource }))} className={inputCls}>
                  {leadStatuses.map((s) => <option key={s} value={s}>{formatStatusLabel(s)}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-stone-400">Next Follow-Up</label>
                <input type="datetime-local" lang="en-AU" value={draft.next_follow_up_at} onChange={(e) => setDraft((p) => ({ ...p, next_follow_up_at: e.target.value }))} className={inputCls} />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-stone-400">Notes</label>
                <textarea rows={3} value={draft.notes} onChange={(e) => setDraft((p) => ({ ...p, notes: e.target.value }))} placeholder="Any additional notes..." className={inputCls + " resize-none"} />
              </div>
              {error && <p className="text-sm text-rose-600 sm:col-span-2">{error}</p>}
              <div className="flex gap-3 sm:col-span-2">
                <button type="submit" disabled={isPending} className="flex-1 rounded-full bg-[#9a6820] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-105 disabled:opacity-60">
                  {isPending ? "Saving..." : "Add Lead"}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setError(""); }} className="rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-[#15314a] transition hover:border-[#9a6820]/60">
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

// ─── STAT CARD ────────────────────────────────────────────────────────────────

function StatCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 ${highlight ? "border-rose-300/50 bg-rose-50" : "border-stone-200 bg-white"}`}>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-stone-400">{label}</p>
      <p className={`mt-3 font-[Arial_Narrow] text-5xl ${highlight ? "text-rose-600" : "text-[#10233f]"}`}>{value}</p>
    </div>
  );
}

// ─── LEAD CARD ────────────────────────────────────────────────────────────────

interface LeadCardProps {
  lead: Lead;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (id: number, patch: Partial<Lead>) => void;
  onLogFollowUp: () => void;
  onAddConsultation: () => void;
  onDeleteRequest: () => void;
  deleteConfirm: boolean;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
}

function LeadCard({ lead, expanded, onToggle, onUpdate, onLogFollowUp, onAddConsultation, onDeleteRequest, deleteConfirm, onDeleteConfirm, onDeleteCancel }: LeadCardProps) {
  const overdue = isOverdue(lead.next_follow_up_at) && !["won", "lost"].includes(lead.status);
  const priorityLabel = lead.priority === 3 ? "High" : lead.priority === 2 ? "Medium" : "Low";
  const priorityColor = lead.priority === 3 ? "text-rose-500" : lead.priority === 2 ? "text-amber-500" : "text-stone-400";
  const initial = lead.name.charAt(0).toUpperCase();

  return (
    <div className={`rounded-2xl border bg-white transition-all ${overdue ? "border-rose-300" : "border-stone-200 hover:border-[#d2a86c]/60"}`}>
      {/* Card header row */}
      <div className="flex items-center gap-4 px-5 py-4">
        {/* Avatar */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#d2a86c]/40 bg-[#9a6820]/10 text-sm font-black text-[#9a6820]">
          {initial}
        </div>

        {/* Name + meta */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-[#10233f]">{lead.name}</span>
            <span className={`text-xs font-semibold uppercase ${priorityColor}`}>{priorityLabel}</span>
            {overdue && (
              <span className="rounded-full border border-rose-300/50 bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-600">
                ⚠ Overdue
              </span>
            )}
          </div>
          <div className="mt-0.5 flex flex-wrap gap-3 text-xs text-stone-400">
            {lead.phone && <span>{lead.phone}</span>}
            {lead.email && <span>{lead.email}</span>}
            {lead.source && <span>via {formatSourceLabel(lead.source)}</span>}
          </div>
        </div>

        {/* Status badge + toggle */}
        <div className="flex shrink-0 items-center gap-3">
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusTone[lead.status]}`}>
            {formatStatusLabel(lead.status)}
          </span>
          <button type="button" onClick={onToggle} className="text-stone-400 transition hover:text-[#10233f]" aria-label="Toggle details">
            <svg className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-stone-100 px-5 py-5 space-y-5">
          {/* Goal + details */}
          <div className="grid gap-4 sm:grid-cols-2">
            {lead.goal && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-stone-400">Goal</p>
                <p className="mt-1 text-sm text-[#4a5c73]">{lead.goal}</p>
              </div>
            )}
            {lead.service_interest && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-stone-400">Service Interest</p>
                <p className="mt-1 text-sm text-[#4a5c73]">{lead.service_interest}</p>
              </div>
            )}
            {lead.budget && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-stone-400">Budget</p>
                <p className="mt-1 text-sm text-[#4a5c73]">{lead.budget}</p>
              </div>
            )}
            {lead.notes && (
              <div className="sm:col-span-2">
                <p className="text-xs font-bold uppercase tracking-wider text-stone-400">Notes</p>
                <p className="mt-1 rounded-xl border border-stone-100 bg-stone-50 p-3 text-sm text-[#4a5c73]">{lead.notes}</p>
              </div>
            )}
          </div>

          {/* Activity stats */}
          <div className="flex flex-wrap gap-6 border-y border-stone-100 py-4">
            <div>
              <p className="font-[Arial_Narrow] text-3xl text-[#10233f]">{lead.follow_up_calls}</p>
              <p className="text-xs text-stone-400">Follow-up Calls</p>
            </div>
            <div>
              <p className="font-[Arial_Narrow] text-3xl text-[#10233f]">{lead.consultation_sessions_completed}</p>
              <p className="text-xs text-stone-400">Consultations</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#4a5c73]">{formatDateTime(lead.last_contacted_at)}</p>
              <p className="text-xs text-stone-400">Last Contacted</p>
            </div>
            <div>
              <p className={`text-sm font-semibold ${overdue ? "text-rose-500" : "text-[#4a5c73]"}`}>{formatDateTime(lead.next_follow_up_at)}</p>
              <p className="text-xs text-stone-400">Next Follow-Up</p>
            </div>
          </div>

          {/* Action row */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={lead.status}
              onChange={(e) => onUpdate(lead.id, { status: e.target.value as LeadStatus })}
              className={inputCls + " w-auto min-w-36"}
            >
              {leadStatuses.map((s) => <option key={s} value={s}>{formatStatusLabel(s)}</option>)}
            </select>
            <input
              type="datetime-local" lang="en-AU"
              value={formatDateTimeLocal(lead.next_follow_up_at)}
              onChange={(e) => onUpdate(lead.id, { next_follow_up_at: e.target.value })}
              className={inputCls + " w-auto"}
              title="Set next follow-up"
            />
            <button type="button" onClick={onLogFollowUp} className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-[#15314a] transition hover:border-[#9a6820]/60">
              Log Call
            </button>
            <button type="button" onClick={onAddConsultation} className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-[#15314a] transition hover:border-[#9a6820]/60">
              Add Consult
            </button>
            {deleteConfirm ? (
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs text-rose-600">Confirm delete?</span>
                <button type="button" onClick={onDeleteConfirm} className="rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600">Yes, Delete</button>
                <button type="button" onClick={onDeleteCancel} className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-[#15314a] transition hover:border-stone-300">Cancel</button>
              </div>
            ) : (
              <button type="button" onClick={onDeleteRequest} className="ml-auto rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-rose-500 transition hover:border-rose-300">
                Delete
              </button>
            )}
          </div>

          {/* Editable notes */}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-stone-400">Update Notes</label>
            <textarea
              rows={2}
              defaultValue={lead.notes ?? ""}
              onBlur={(e) => { if (e.target.value !== lead.notes) onUpdate(lead.id, { notes: e.target.value }); }}
              placeholder="Add or update notes..."
              className={inputCls + " resize-none"}
            />
          </div>
        </div>
      )}
    </div>
  );
}
