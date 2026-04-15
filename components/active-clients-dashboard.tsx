"use client";

import { useEffect, useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Package config ───────────────────────────────────────────────────────────

const PACKAGES: { label: PackageKey; weekly: number; badge: string }[] = [
  { label: "Foundation",      weekly: 129, badge: "bg-sky-100 text-sky-700 border-sky-200" },
  { label: "Transformation",  weekly: 199, badge: "bg-amber-100 text-amber-700 border-amber-200" },
  { label: "Elite",           weekly: 289, badge: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { label: "Custom",          weekly: 0,   badge: "bg-stone-100 text-stone-600 border-stone-200" }
];

function pkgBadge(pkg: PackageKey) {
  const p = PACKAGES.find((p) => p.label === pkg);
  return p?.badge ?? "bg-stone-100 text-stone-600 border-stone-200";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = "tun-active-clients";

function load(): Client[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(clients: Client[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
}

function fmtAUD(n: number) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(n);
}

function daysSince(dateStr: string) {
  if (!dateStr) return null;
  const ms = Date.now() - new Date(dateStr).getTime();
  return Math.floor(ms / 86_400_000);
}

function durationLabel(days: number | null) {
  if (days === null) return "—";
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.floor(days / 7)}wk`;
  if (days < 365) return `${Math.floor(days / 30)}mo`;
  return `${(days / 365).toFixed(1)}yr`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

// ─── Blank form ───────────────────────────────────────────────────────────────

type FormState = {
  name: string;
  package: PackageKey;
  weeklyRate: string;
  startDate: string;
  contact: string;
  notes: string;
};

function blankForm(): FormState {
  return { name: "", package: "Foundation", weeklyRate: "129", startDate: today(), contact: "", notes: "" };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/90 px-5 py-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-widest text-[#9a6820]">{label}</p>
      <p className="mt-1 text-2xl font-black text-[#10233f]">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-[#6b7b91]">{sub}</p>}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ActiveClientsDashboard() {
  const [clients, setClients] = useState<Client[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<FormState>(blankForm());
  const [editId, setEditId] = useState<number | null>(null);

  // Loss modal
  const [lossId, setLossId] = useState<number | null>(null);
  const [lossReason, setLossReason] = useState("");
  const [lossDate, setLossDate] = useState(today());

  // Delete confirm
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Tab
  const [tab, setTab] = useState<"active" | "lost">("active");

  useEffect(() => {
    setClients(load());
  }, []);

  // ── Derived ──────────────────────────────────────────────────────────────

  const active = clients.filter((c) => c.status === "active");
  const lost   = clients.filter((c) => c.status === "lost");

  const totalWeekly  = active.reduce((s, c) => s + c.weeklyRate, 0);
  const totalMonthly = totalWeekly * 4.33;

  // ── Handlers ─────────────────────────────────────────────────────────────

  function openAdd() {
    setEditId(null);
    setForm(blankForm());
    setShowAdd(true);
  }

  function openEdit(client: Client) {
    setEditId(client.id);
    setForm({
      name: client.name,
      package: client.package,
      weeklyRate: String(client.weeklyRate),
      startDate: client.startDate,
      contact: client.contact,
      notes: client.notes
    });
    setShowAdd(true);
  }

  function handlePackageChange(pkg: PackageKey) {
    const rate = PACKAGES.find((p) => p.label === pkg)?.weekly ?? 0;
    setForm((f) => ({ ...f, package: pkg, weeklyRate: pkg === "Custom" ? f.weeklyRate : String(rate) }));
  }

  function submitForm(e: React.FormEvent) {
    e.preventDefault();
    const rate = Math.max(0, Number(form.weeklyRate) || 0);

    if (editId !== null) {
      // Update existing
      const updated = clients.map((c) =>
        c.id === editId
          ? { ...c, name: form.name, package: form.package, weeklyRate: rate, startDate: form.startDate, contact: form.contact, notes: form.notes }
          : c
      );
      setClients(updated);
      save(updated);
    } else {
      // Create new
      const newClient: Client = {
        id: Date.now(),
        name: form.name,
        package: form.package,
        weeklyRate: rate,
        startDate: form.startDate,
        contact: form.contact,
        notes: form.notes,
        status: "active",
        lostDate: "",
        lostReason: "",
        createdAt: new Date().toISOString()
      };
      const updated = [...clients, newClient];
      setClients(updated);
      save(updated);
    }
    setShowAdd(false);
  }

  function markLost() {
    if (lossId === null) return;
    const updated = clients.map((c) =>
      c.id === lossId ? { ...c, status: "lost" as const, lostDate: lossDate, lostReason: lossReason } : c
    );
    setClients(updated);
    save(updated);
    setLossId(null);
    setLossReason("");
    setLossDate(today());
    setTab("lost");
  }

  function winBack(id: number) {
    const updated = clients.map((c) =>
      c.id === id ? { ...c, status: "active" as const, lostDate: "", lostReason: "" } : c
    );
    setClients(updated);
    save(updated);
    setTab("active");
  }

  function deleteClient(id: number) {
    const updated = clients.filter((c) => c.id !== id);
    setClients(updated);
    save(updated);
    setDeleteId(null);
  }

  const displayed = tab === "active" ? active : lost;

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <main className="min-h-dvh overflow-x-hidden bg-[linear-gradient(160deg,#f7f4ef_0%,#ede8df_100%)] text-[#10233f]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">

        {/* ── Nav ─────────────────────────────────────────────────── */}
        <nav className="print:hidden">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="shrink-0 rounded-full bg-[#fdf3e3] px-4 py-1.5 text-xs font-semibold tracking-widest text-[#9a6820] uppercase">The Upper Notch</span>
            {[
              { href: "/",          label: "New Consultation" },
              { href: "/clients",   label: "Client Hub" },
              { href: "/onboarding",label: "Onboarding" },
              { href: "/leads",     label: "Lead Tracker" },
              { href: "/screening", label: "Movement Screening" },
              { href: "/revenue",   label: "Revenue Tracker" }
            ].map((l) => (
              <a key={l.href} href={l.href}
                className="shrink-0 rounded-full border border-stone-200 bg-white/80 px-4 py-2 text-sm font-semibold text-[#15314a] transition hover:border-[#9a6820]/60">
                {l.label}
              </a>
            ))}
          </div>
        </nav>

        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.07)] sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-[#9a6820]">Client Management</p>
              <h1 className="mt-1 text-2xl font-bold text-[#10233f] sm:text-3xl">Active &amp; Lost Clients</h1>
              <p className="mt-1 text-sm text-[#4a5c73]">Track who's training, who's left, and your live weekly revenue.</p>
            </div>
            <button
              onClick={openAdd}
              className="shrink-0 rounded-full bg-[#15314a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1e3f60]">
              + Add Client
            </button>
          </div>
        </div>

        {/* ── Stats ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Active Clients"   value={String(active.length)} />
          <StatCard label="Weekly Revenue"   value={fmtAUD(totalWeekly)} sub="from active clients" />
          <StatCard label="Monthly Est."     value={fmtAUD(totalMonthly)} sub="weekly × 4.33" />
          <StatCard label="Lost Clients"     value={String(lost.length)} sub="all time" />
        </div>

        {/* ── Package breakdown ────────────────────────────────────── */}
        {active.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {PACKAGES.filter((p) => p.label !== "Custom").map((pkg) => {
              const count = active.filter((c) => c.package === pkg.label).length;
              return (
                <div key={pkg.label} className={`rounded-2xl border px-4 py-3 ${pkg.badge}`}>
                  <p className="text-xs font-bold uppercase tracking-widest opacity-70">{pkg.label}</p>
                  <p className="mt-1 text-2xl font-black">{count}</p>
                  <p className="text-xs opacity-60">{count === 1 ? "client" : "clients"}</p>
                </div>
              );
            })}
            {(() => {
              const count = active.filter((c) => c.package === "Custom").length;
              return count > 0 ? (
                <div className="rounded-2xl border border-stone-200 bg-stone-100 px-4 py-3 text-stone-600">
                  <p className="text-xs font-bold uppercase tracking-widest opacity-70">Custom</p>
                  <p className="mt-1 text-2xl font-black">{count}</p>
                  <p className="text-xs opacity-60">{count === 1 ? "client" : "clients"}</p>
                </div>
              ) : null;
            })()}
          </div>
        )}

        {/* ── Tabs + list ─────────────────────────────────────────── */}
        <div className="rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.07)] sm:p-6">
          {/* Tab bar */}
          <div className="flex gap-2 mb-5">
            <button
              onClick={() => setTab("active")}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                tab === "active"
                  ? "bg-[#15314a] text-white"
                  : "border border-stone-200 bg-white text-[#15314a] hover:border-[#9a6820]/60"
              }`}>
              Active ({active.length})
            </button>
            <button
              onClick={() => setTab("lost")}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                tab === "lost"
                  ? "bg-rose-600 text-white"
                  : "border border-stone-200 bg-white text-[#15314a] hover:border-rose-300"
              }`}>
              Lost ({lost.length})
            </button>
          </div>

          {/* Empty state */}
          {displayed.length === 0 && (
            <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-6 py-12 text-center">
              <p className="text-sm font-semibold text-[#6b7b91]">
                {tab === "active" ? "No active clients yet. Hit + Add Client to get started." : "No lost clients recorded — keep it that way!"}
              </p>
            </div>
          )}

          {/* Client cards */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {displayed.map((client) => {
              const days = tab === "active"
                ? daysSince(client.startDate)
                : (client.lostDate ? daysSince(client.startDate) : null);
              const lostDays = client.lostDate ? daysSince(client.lostDate) : null;

              return (
                <div
                  key={client.id}
                  className={`rounded-2xl border p-4 ${
                    tab === "active"
                      ? "border-stone-200 bg-white"
                      : "border-rose-100 bg-rose-50/60"
                  }`}>
                  {/* Name + package */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <p className="font-bold text-[#10233f] leading-tight">{client.name}</p>
                      {client.contact && (
                        <p className="text-xs text-[#6b7b91] mt-0.5">{client.contact}</p>
                      )}
                    </div>
                    <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${pkgBadge(client.package)}`}>
                      {client.package}
                    </span>
                  </div>

                  {/* Stats row */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#6b7b91] mb-3">
                    <span><strong className="text-[#10233f]">{fmtAUD(client.weeklyRate)}</strong>/wk</span>
                    <span><strong className="text-[#10233f]">{fmtAUD(client.weeklyRate * 4.33)}</strong>/mo</span>
                    {client.startDate && (
                      <span>Started <strong className="text-[#10233f]">{client.startDate}</strong></span>
                    )}
                    {days !== null && (
                      <span>Duration: <strong className="text-[#10233f]">{durationLabel(days)}</strong></span>
                    )}
                  </div>

                  {/* Lost info */}
                  {tab === "lost" && client.lostDate && (
                    <div className="mb-3 rounded-xl border border-rose-200 bg-rose-100 px-3 py-2">
                      <p className="text-xs font-semibold text-rose-700">
                        Left {client.lostDate}
                        {lostDays !== null && ` · ${durationLabel(lostDays)} ago`}
                      </p>
                      {client.lostReason && (
                        <p className="text-xs text-rose-600 mt-0.5">"{client.lostReason}"</p>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  {client.notes && (
                    <p className="text-xs text-[#6b7b91] mb-3 leading-5">{client.notes}</p>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 mt-auto">
                    {tab === "active" ? (
                      <>
                        <button
                          onClick={() => openEdit(client)}
                          className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#15314a] transition hover:border-[#9a6820]/60">
                          Edit
                        </button>
                        <button
                          onClick={() => { setLossId(client.id); setLossReason(""); setLossDate(today()); }}
                          className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-100">
                          Mark as Lost
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => winBack(client.id)}
                          className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100">
                          Win Back
                        </button>
                        <button
                          onClick={() => setDeleteId(client.id)}
                          className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-500 transition hover:border-rose-200">
                          Remove
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* ── Add / Edit Modal ─────────────────────────────────────── */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 px-4 pt-12 pb-8 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-100 px-6 py-5">
              <h2 className="text-lg font-bold text-[#10233f]">{editId ? "Edit Client" : "Add Active Client"}</h2>
              <button onClick={() => setShowAdd(false)}
                className="rounded-full p-2 text-slate-400 transition hover:bg-stone-100 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={submitForm} className="grid gap-4 px-6 py-5">
              {/* Name */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-[#6b7b91]">Full Name *</label>
                <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Sarah Johnson"
                  className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-[#10233f] outline-none focus:border-[#9a6820] focus:ring-2 focus:ring-[#9a6820]/20" />
              </div>
              {/* Package */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-[#6b7b91]">Package *</label>
                <div className="grid grid-cols-2 gap-2">
                  {PACKAGES.map((pkg) => (
                    <button key={pkg.label} type="button"
                      onClick={() => handlePackageChange(pkg.label)}
                      className={`rounded-2xl border px-3 py-2.5 text-sm font-semibold transition ${
                        form.package === pkg.label
                          ? "border-[#9a6820] bg-[#9a6820] text-white"
                          : "border-stone-200 bg-white text-[#15314a] hover:border-[#9a6820]/60"
                      }`}>
                      {pkg.label}{pkg.weekly > 0 ? ` · $${pkg.weekly}` : ""}
                    </button>
                  ))}
                </div>
              </div>
              {/* Weekly rate */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-[#6b7b91]">Weekly Rate ($) *</label>
                <input required type="number" min="0" value={form.weeklyRate}
                  onChange={(e) => setForm((f) => ({ ...f, weeklyRate: e.target.value, package: "Custom" }))}
                  className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-[#10233f] outline-none focus:border-[#9a6820] focus:ring-2 focus:ring-[#9a6820]/20" />
              </div>
              {/* Start date */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-[#6b7b91]">Start Date</label>
                <input type="date" value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                  className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-[#10233f] outline-none focus:border-[#9a6820] focus:ring-2 focus:ring-[#9a6820]/20" />
              </div>
              {/* Contact */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-[#6b7b91]">Contact</label>
                <input value={form.contact} onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))}
                  placeholder="Phone or email"
                  className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-[#10233f] outline-none focus:border-[#9a6820] focus:ring-2 focus:ring-[#9a6820]/20" />
              </div>
              {/* Notes */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-[#6b7b91]">Notes</label>
                <textarea rows={2} value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Goals, training days, anything useful…"
                  className="w-full resize-none rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-[#10233f] outline-none focus:border-[#9a6820] focus:ring-2 focus:ring-[#9a6820]/20" />
              </div>
              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button type="submit"
                  className="flex-1 rounded-full bg-[#15314a] py-3 text-sm font-semibold text-white transition hover:bg-[#1e3f60]">
                  {editId ? "Save Changes" : "Add Client"}
                </button>
                <button type="button" onClick={() => setShowAdd(false)}
                  className="rounded-full border border-stone-200 px-5 py-3 text-sm font-semibold text-[#6b7b91] transition hover:border-stone-300">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Mark as Lost Modal ───────────────────────────────────── */}
      {lossId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-100 px-6 py-5">
              <h2 className="text-lg font-bold text-rose-700">Mark as Lost</h2>
              <button onClick={() => setLossId(null)}
                className="rounded-full p-2 text-slate-400 transition hover:bg-stone-100">✕</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-[#6b7b91]">Date Left</label>
                <input type="date" value={lossDate} onChange={(e) => setLossDate(e.target.value)}
                  className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-[#10233f] outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-[#6b7b91]">Reason (optional)</label>
                <textarea rows={3} value={lossReason}
                  onChange={(e) => setLossReason(e.target.value)}
                  placeholder="e.g. Moving away, financial reasons, schedule conflict…"
                  className="w-full resize-none rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-[#10233f] outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20" />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={markLost}
                  className="flex-1 rounded-full bg-rose-600 py-3 text-sm font-semibold text-white transition hover:bg-rose-700">
                  Confirm
                </button>
                <button onClick={() => setLossId(null)}
                  className="rounded-full border border-stone-200 px-5 py-3 text-sm font-semibold text-[#6b7b91] transition hover:border-stone-300">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirm ───────────────────────────────────────── */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl text-center">
            <p className="text-base font-bold text-[#10233f] mb-2">Remove this client record?</p>
            <p className="text-sm text-[#6b7b91] mb-5">This can't be undone.</p>
            <div className="flex gap-2 justify-center">
              <button onClick={() => deleteClient(deleteId)}
                className="rounded-full bg-rose-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700">
                Remove
              </button>
              <button onClick={() => setDeleteId(null)}
                className="rounded-full border border-stone-200 px-6 py-2.5 text-sm font-semibold text-[#15314a] transition hover:border-stone-300">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
