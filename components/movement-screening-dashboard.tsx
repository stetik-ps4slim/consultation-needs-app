"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import {
  createEmptyClient,
  getClientAverageScore,
  getCompletedTests,
  getTotalTests,
  scoreOptions,
  sortClients,
  type ClientSort,
  type MovementSection,
  type MovementTest,
  type ScreeningClient
} from "@/lib/movement-screening";

type DashboardProps = {
  initialClients: ScreeningClient[];
  isPersistent: boolean;
};

const storageKey = "movement-screening-clients";

const inputCls =
  "w-full rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-[#10233f] shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#9a6820] focus:ring-2 focus:ring-[#9a6820]/20";

function scoreColor(score: number | null) {
  if (!score) return "bg-stone-100 text-stone-500";
  if (score <= 2) return "bg-rose-100 text-rose-700";
  if (score === 3) return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
}

function scoreLabel(score: number | null) {
  if (!score) return "—";
  if (score === 1) return "1 – Needs work";
  if (score === 2) return "2 – Below avg";
  if (score === 3) return "3 – Average";
  if (score === 4) return "4 – Good";
  return "5 – Excellent";
}

function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderSection(section: MovementSection) {
  const rows = section.tests
    .filter((test) => test.completed)
    .map(
      (test) => `
      <tr>
        <td>${escapeHtml(test.name)}</td>
        <td style="text-align:center;font-weight:600">${test.score ?? "—"}</td>
        <td>${escapeHtml(test.observations)}</td>
        <td>${escapeHtml(test.notes)}</td>
        <td>${escapeHtml(test.assessedOn)}</td>
      </tr>`
    )
    .join("");

  if (!rows) return "";

  return `
    <div class="section">
      <h3>${escapeHtml(section.title)}</h3>
      <table>
        <thead>
          <tr>
            <th>Test</th><th>Score</th><th>Observations</th><th>Notes</th><th>Date</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

export function MovementScreeningDashboard({ initialClients, isPersistent }: DashboardProps) {
  const [clients, setClients] = useState(initialClients);
  const [selectedClientId, setSelectedClientId] = useState(initialClients[0]?.id ?? null);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<ClientSort>("recent");
  const [statusMessage, setStatusMessage] = useState(
    isPersistent ? "Cloud sync is active." : "Saving locally in this browser."
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [dirtyClientIds, setDirtyClientIds] = useState<number[]>([]);
  const [showPrintHint, setShowPrintHint] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const hydratedRef = useRef(false);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    if (isPersistent || hydratedRef.current) {
      hydratedRef.current = true;
      return;
    }
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) { hydratedRef.current = true; return; }
    try {
      const parsed = JSON.parse(stored) as ScreeningClient[];
      if (Array.isArray(parsed) && parsed.length) {
        setClients(parsed);
        setSelectedClientId(parsed[0].id);
      }
    } catch { /* ignore */ } finally {
      hydratedRef.current = true;
    }
  }, [isPersistent]);

  useEffect(() => {
    if (!hydratedRef.current || isPersistent) return;
    window.localStorage.setItem(storageKey, JSON.stringify(clients));
  }, [clients, isPersistent]);

  useEffect(() => {
    if (!isPersistent || !dirtyClientIds.length) return;
    const timer = window.setTimeout(async () => {
      const ids = [...new Set(dirtyClientIds)];
      setIsSyncing(true);
      setStatusMessage("Saving to cloud…");
      try {
        await Promise.all(
          ids.map(async (id) => {
            const client = clients.find((c) => c.id === id);
            if (!client) return;
            const res = await fetch(`/api/screenings/${client.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: client.name, injury: client.injury,
                screeningDate: client.screeningDate, contact: client.contact,
                health: client.health, conductedBy: client.conductedBy,
                warmupNotes: client.warmupNotes, overallNotes: client.overallNotes,
                sections: client.sections
              })
            });
            if (!res.ok) throw new Error("Patch failed");
            const payload = (await res.json()) as { client?: ScreeningClient };
            if (payload.client) {
              setClients((cur) => cur.map((c) => c.id === payload.client?.id ? payload.client! : c));
            }
          })
        );
        setDirtyClientIds((cur) => cur.filter((id) => !ids.includes(id)));
        setStatusMessage("All changes synced.");
      } catch {
        setStatusMessage("Sync failed — edits still on screen.");
      } finally {
        setIsSyncing(false);
      }
    }, 700);
    return () => window.clearTimeout(timer);
  }, [clients, dirtyClientIds, isPersistent]);

  const visibleClients = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    const filtered = clients.filter((c) => {
      if (!q) return true;
      const blob = [c.name, c.injury, c.contact, c.health, c.overallNotes,
        c.sections.flatMap((s) => s.tests).map((t) => `${t.name} ${t.observations} ${t.notes}`).join(" ")
      ].join(" ").toLowerCase();
      return blob.includes(q);
    });
    return sortClients(filtered, sortBy);
  }, [clients, deferredQuery, sortBy]);

  const selectedClient =
    visibleClients.find((c) => c.id === selectedClientId) ??
    clients.find((c) => c.id === selectedClientId) ??
    visibleClients[0] ?? null;

  useEffect(() => {
    if (!selectedClient && visibleClients[0]) setSelectedClientId(visibleClients[0].id);
  }, [selectedClient, visibleClients]);

  const stats = useMemo(() => {
    const scores = clients.map((c) => getClientAverageScore(c)).filter((s): s is number => s !== null);
    return {
      totalClients: clients.length,
      completedScreens: clients.filter((c) => getCompletedTests(c) > 0).length,
      averageScore: scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : "—",
      filteredCount: visibleClients.length
    };
  }, [clients, visibleClients]);

  function markDirty(id: number) {
    if (!isPersistent) return;
    setDirtyClientIds((cur) => cur.includes(id) ? cur : [...cur, id]);
  }

  function updateClient(id: number, updater: (c: ScreeningClient) => ScreeningClient) {
    setClients((cur) => cur.map((c) => c.id === id ? { ...updater(c), updatedAt: new Date().toISOString() } : c));
    markDirty(id);
  }

  function updateTest(clientId: number, si: number, ti: number, updater: (t: MovementTest) => MovementTest) {
    updateClient(clientId, (c) => ({
      ...c,
      sections: c.sections.map((s, i) =>
        i === si ? { ...s, tests: s.tests.map((t, j) => j === ti ? updater(t) : t) } : s
      )
    }));
  }

  async function handleNewClient() {
    const nextId = clients.length ? Math.max(...clients.map((c) => c.id)) + 1 : 1;
    const client = createEmptyClient(nextId);
    if (!isPersistent) {
      setClients((cur) => [client, ...cur]);
      setSelectedClientId(client.id);
      setStatusMessage("Client added locally.");
      return;
    }
    setIsSyncing(true);
    setStatusMessage("Creating client…");
    try {
      const res = await fetch("/api/screenings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: client.name, injury: client.injury, screeningDate: client.screeningDate,
          contact: client.contact, health: client.health, conductedBy: client.conductedBy,
          warmupNotes: client.warmupNotes, overallNotes: client.overallNotes, sections: client.sections
        })
      });
      if (!res.ok) throw new Error();
      const payload = (await res.json()) as { client?: ScreeningClient };
      if (!payload.client) throw new Error();
      setClients((cur) => [payload.client!, ...cur]);
      setSelectedClientId(payload.client.id);
      setStatusMessage("Client saved to cloud.");
    } catch {
      setStatusMessage("Cloud create failed. Check Supabase keys.");
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleDeleteClient(id: number) {
    const next = clients.filter((c) => c.id !== id);
    setClients(next);
    setSelectedClientId(next[0]?.id ?? null);
    setDeleteConfirm(null);
    if (!isPersistent) { setStatusMessage("Client deleted."); return; }
    setIsSyncing(true);
    setStatusMessage("Removing from cloud…");
    try {
      const res = await fetch(`/api/screenings/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setStatusMessage("Client removed.");
    } catch {
      setStatusMessage("Cloud delete failed. Refresh before continuing.");
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleSaveClient(client: ScreeningClient) {
    setSaveStatus("saving");

    if (!isPersistent) {
      // localStorage auto-saves on every change — just confirm it
      window.localStorage.setItem(storageKey, JSON.stringify(clients));
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
      return;
    }

    try {
      const res = await fetch(`/api/screenings/${client.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: client.name, injury: client.injury,
          screeningDate: client.screeningDate, contact: client.contact,
          health: client.health, conductedBy: client.conductedBy,
          warmupNotes: client.warmupNotes, overallNotes: client.overallNotes,
          sections: client.sections
        })
      });
      if (!res.ok) throw new Error("Save failed");
      const payload = (await res.json()) as { client?: ScreeningClient };
      if (payload.client) {
        setClients((cur) => cur.map((c) => c.id === payload.client?.id ? payload.client! : c));
      }
      setDirtyClientIds((cur) => cur.filter((id) => id !== client.id));
      setStatusMessage("Saved.");
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setStatusMessage("Save failed — try again.");
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  }

  function handlePrint(client: ScreeningClient) {
    const win = window.open("", "_blank", "width=1080,height=900");
    if (!win) { setShowPrintHint(true); return; }
    const avg = getClientAverageScore(client);
    const done = getCompletedTests(client);
    const total = getTotalTests(client);

    win.document.write(`
      <html><head>
        <title>${escapeHtml(client.name)} – Movement Screening</title>
        <style>
          body { font-family: "Avenir Next","Segoe UI",sans-serif; color:#10233f; margin:32px; background:#fff; }
          h1,h2,h3 { margin:0 0 10px; }
          .hero { padding:24px 28px; border-radius:20px; background:linear-gradient(135deg,#d2a86c,#9a6820); color:#fff; }
          .hero p { margin:4px 0 0; opacity:.85; font-size:14px; }
          .meta { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin:20px 0 24px; }
          .card { border:1px solid #e8e0d5; border-radius:16px; padding:14px 16px; background:#fdf8ef; }
          .card strong { display:block; font-size:11px; text-transform:uppercase; letter-spacing:.12em; color:#9a6820; margin-bottom:4px; }
          .section { margin-top:24px; page-break-inside:avoid; }
          .section h3 { font-size:15px; text-transform:uppercase; letter-spacing:.1em; color:#9a6820; border-bottom:1px solid #e8e0d5; padding-bottom:8px; }
          table { width:100%; border-collapse:collapse; margin-top:10px; }
          th,td { border:1px solid #e8e0d5; padding:9px 11px; text-align:left; vertical-align:top; font-size:13px; }
          th { background:#fdf3e3; color:#9a6820; font-size:11px; text-transform:uppercase; letter-spacing:.1em; }
          .note { margin-top:20px; padding:14px 16px; border-radius:16px; background:#fdf8ef; border:1px solid #e8e0d5; font-size:14px; }
          .note strong { display:block; font-size:11px; text-transform:uppercase; letter-spacing:.12em; color:#9a6820; margin-bottom:6px; }
          @media print { body { margin:14mm; } }
        </style>
      </head><body>
        <div class="hero">
          <h1>${escapeHtml(client.name)}</h1>
          <p>Movement Screening Report &nbsp;·&nbsp; The Upper Notch</p>
          <p>Conducted by ${escapeHtml(client.conductedBy || "Jazzay Sallah")}</p>
        </div>
        <div class="meta">
          <div class="card"><strong>Date</strong>${escapeHtml(client.screeningDate || "—")}</div>
          <div class="card"><strong>Injury / notes</strong>${escapeHtml(client.injury || "—")}</div>
          <div class="card"><strong>Contact</strong>${escapeHtml(client.contact || "—")}</div>
          <div class="card"><strong>Health</strong>${escapeHtml(client.health || "—")}</div>
          <div class="card"><strong>Tests completed</strong>${done} / ${total}</div>
          <div class="card"><strong>Avg score</strong>${avg ?? "—"} / 5</div>
        </div>
        <div class="note"><strong>Warm up</strong>${escapeHtml(client.warmupNotes || "—")}</div>
        ${client.sections.map(renderSection).join("")}
        <div class="note"><strong>Overall notes</strong>${escapeHtml(client.overallNotes || "—")}</div>
      </body></html>`);
    win.document.close();
    win.focus();
    win.print();
  }

  return (
    <main className="min-h-dvh overflow-x-hidden bg-[linear-gradient(160deg,#f7f4ef_0%,#ede8df_100%)] text-[#10233f]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

        {/* Nav */}
        <nav className="print:hidden">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="shrink-0 rounded-full bg-[#fdf3e3] px-4 py-1.5 text-xs font-semibold tracking-widest text-[#9a6820] uppercase">The Upper Notch</span>
            {[
              { href: "/", label: "New Consultation" },
              { href: "/clients", label: "Client Hub" },
              { href: "/onboarding", label: "Onboarding" },
              { href: "/leads", label: "Lead Tracker" },
              { href: "/revenue", label: "Revenue Tracker" }
            ].map((link) => (
              <a key={link.href} href={link.href}
                className="shrink-0 rounded-full border border-stone-200 bg-white/80 px-4 py-2 text-sm font-semibold text-[#15314a] transition hover:border-[#9a6820]/60">
                {link.label}
              </a>
            ))}
          </div>
        </nav>

        {/* Header */}
        <section className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.07)] backdrop-blur-xl sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-[#9a6820]">Movement Screening Tracker</p>
              <h1 className="mt-2 text-3xl font-bold text-[#10233f] sm:text-4xl">Movement Screening</h1>
              <p className="mt-2 text-sm leading-6 text-[#4a5c73]">
                Record, score, and track client movement assessments across all key patterns.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Clients", value: String(stats.totalClients) },
                  { label: "Screened", value: String(stats.completedScreens) },
                  { label: "Avg Score", value: String(stats.averageScore) },
                  { label: "Showing", value: String(stats.filteredCount) }
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-widest text-[#9a6820]">{s.label}</p>
                    <p className="mt-1 text-2xl font-bold text-[#10233f]">{s.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-[#e8d5b0] bg-[#fdf3e3] p-5 text-sm print:hidden sm:min-w-[220px]">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#9a6820]">Save + Export</p>
              <div className="space-y-2 text-[#4a5c73]">
                <p><span className="font-medium text-[#10233f]">Storage:</span> {isPersistent ? "Cloud sync on" : "Browser only"}</p>
                <p><span className="font-medium text-[#10233f]">Status:</span> {isSyncing ? "Saving…" : statusMessage}</p>
                <p className="text-xs text-[#6b7b91]">Use "Print / Save PDF" on any client to export a clean branded report.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Main grid */}
        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">

          {/* Client list */}
          <aside className="flex flex-col gap-4 print:hidden">
            <div className="rounded-2xl border border-white/70 bg-white/90 p-4 shadow-[0_8px_30px_rgba(0,0,0,0.06)] backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <p className="text-xs uppercase tracking-widest text-[#9a6820]">Client List</p>
                  <h2 className="mt-0.5 text-lg font-bold text-[#10233f]">Search & sort</h2>
                </div>
                <button type="button" onClick={handleNewClient}
                  className="rounded-full bg-[#9a6820] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#7a5218]">
                  + New client
                </button>
              </div>

              <input value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, injury, notes…" className={inputCls} />

              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as ClientSort)}
                className={`${inputCls} mt-2`}>
                <option value="recent">Recently updated</option>
                <option value="name-asc">Name A–Z</option>
                <option value="name-desc">Name Z–A</option>
                <option value="score-high">Highest score</option>
                <option value="score-low">Lowest score</option>
              </select>
            </div>

            <div className="space-y-2">
              {visibleClients.length ? visibleClients.map((client) => {
                const avg = getClientAverageScore(client);
                const isActive = client.id === selectedClient?.id;
                return (
                  <button key={client.id} type="button" onClick={() => setSelectedClientId(client.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      isActive
                        ? "border-[#d2a86c] bg-[#fdf3e3] shadow-[0_4px_20px_rgba(210,168,108,0.25)]"
                        : "border-stone-200 bg-white/90 hover:border-[#d2a86c]/60 hover:bg-[#fdf8ef]"
                    }`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-[#10233f] truncate">{client.name}</p>
                        <p className="mt-0.5 text-xs text-[#4a5c73] truncate">{client.injury || "No injury listed"}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${scoreColor(avg)}`}>
                        {avg ? `${avg}/5` : "—"}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-[#6b7b91]">
                      <span>{getCompletedTests(client)}/{getTotalTests(client)} tests</span>
                      <span>{client.screeningDate || "No date"}</span>
                    </div>
                  </button>
                );
              }) : (
                <div className="rounded-2xl border border-dashed border-stone-300 bg-white/60 p-6 text-center text-sm text-[#6b7b91]">
                  No clients match that search.
                </div>
              )}
            </div>
          </aside>

          {/* Client record */}
          <section className="rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.07)] backdrop-blur-xl sm:p-6">
            {selectedClient ? (
              <div className="space-y-6">

                {/* Record header */}
                <div className="flex flex-col gap-4 border-b border-stone-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-[#9a6820]">Client Record</p>
                    <h2 className="mt-1 text-2xl font-bold text-[#10233f]">{selectedClient.name}</h2>
                    <p className="mt-1 text-xs text-[#6b7b91]">
                      Last updated {new Date(selectedClient.updatedAt).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 print:hidden">
                    <button type="button" onClick={() => handleSaveClient(selectedClient)}
                      disabled={saveStatus === "saving"}
                      className={`rounded-full px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60 ${
                        saveStatus === "saved"
                          ? "bg-emerald-600 hover:bg-emerald-700"
                          : saveStatus === "error"
                          ? "bg-rose-600 hover:bg-rose-700"
                          : "bg-[#15314a] hover:bg-[#1e3f60]"
                      }`}>
                      {saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "✓ Saved" : saveStatus === "error" ? "Save failed" : "Save"}
                    </button>
                    <button type="button" onClick={() => handlePrint(selectedClient)}
                      className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-[#15314a] transition hover:border-[#9a6820]/60">
                      Print / PDF
                    </button>
                    {deleteConfirm === selectedClient.id ? (
                      <>
                        <button type="button" onClick={() => handleDeleteClient(selectedClient.id)}
                          className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700">
                          Confirm delete
                        </button>
                        <button type="button" onClick={() => setDeleteConfirm(null)}
                          className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-[#15314a] transition hover:border-stone-300">
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button type="button" onClick={() => setDeleteConfirm(selectedClient.id)}
                        className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-[#15314a] transition hover:border-rose-300 hover:text-rose-600">
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                {showPrintHint && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Allow pop-ups for this site so the print/PDF view can open.
                  </div>
                )}

                {/* Client details grid */}
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {[
                    { label: "Name", field: "name" as const },
                    { label: "Injury / notes", field: "injury" as const },
                    { label: "Contact", field: "contact" as const },
                    { label: "Health clearance", field: "health" as const },
                    { label: "Conducted by", field: "conductedBy" as const },
                  ].map(({ label, field }) => (
                    <Field key={field} label={label}>
                      <input value={selectedClient[field]}
                        onChange={(e) => updateClient(selectedClient.id, (c) => ({ ...c, [field]: e.target.value }))}
                        className={inputCls} />
                    </Field>
                  ))}
                  <Field label="Screening date">
                    <input type="date" lang="en-AU" value={selectedClient.screeningDate}
                      onChange={(e) => updateClient(selectedClient.id, (c) => ({ ...c, screeningDate: e.target.value }))}
                      className={inputCls} />
                  </Field>
                  <Field label="Warm up notes" className="md:col-span-2 xl:col-span-3">
                    <textarea rows={2} value={selectedClient.warmupNotes}
                      onChange={(e) => updateClient(selectedClient.id, (c) => ({ ...c, warmupNotes: e.target.value }))}
                      className={`${inputCls} resize-none`} />
                  </Field>
                  <Field label="Overall notes" className="md:col-span-2 xl:col-span-3">
                    <textarea rows={3} value={selectedClient.overallNotes}
                      onChange={(e) => updateClient(selectedClient.id, (c) => ({ ...c, overallNotes: e.target.value }))}
                      className={`${inputCls} resize-none`} />
                  </Field>
                </div>

                {/* Movement sections */}
                <div className="space-y-4">
                  {selectedClient.sections.map((section, si) => {
                    const done = section.tests.filter((t) => t.completed).length;
                    const total = section.tests.length;
                    return (
                      <div key={section.title} className="rounded-2xl border border-stone-200 bg-stone-50 p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-3 mb-4">
                          <div>
                            <h3 className="font-bold text-[#10233f]">{section.title}</h3>
                            <p className="text-xs text-[#6b7b91] mt-0.5">Score each movement and add observations</p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-xs font-bold ${done === total ? "bg-emerald-100 text-emerald-700" : "bg-stone-200 text-stone-600"}`}>
                            {done}/{total} done
                          </span>
                        </div>

                        <div className="space-y-3">
                          {section.tests.map((test, ti) => (
                            <div key={`${section.title}-${test.name}`}
                              className={`rounded-xl border p-4 transition ${test.completed ? "border-[#e8d5b0] bg-white" : "border-stone-200 bg-white/60"}`}>
                              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                                <div className="flex items-center gap-3">
                                  <input type="checkbox" checked={test.completed}
                                    onChange={(e) => updateTest(selectedClient.id, si, ti, (t) => ({ ...t, completed: e.target.checked }))}
                                    className="h-4 w-4 cursor-pointer accent-[#9a6820]" />
                                  <span className="font-semibold text-sm text-[#10233f]">{test.name}</span>
                                </div>
                                {test.score && (
                                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${scoreColor(test.score)}`}>
                                    {test.score}/5
                                  </span>
                                )}
                              </div>

                              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_160px_160px]">
                                <div className="sm:col-span-2 xl:col-span-1">
                                  <label className="block text-xs font-medium text-[#6b7b91] mb-1">Observations</label>
                                  <textarea rows={2} value={test.observations} placeholder="What did you see?"
                                    onChange={(e) => updateTest(selectedClient.id, si, ti, (t) => ({ ...t, observations: e.target.value }))}
                                    className={`${inputCls} resize-none`} />
                                </div>
                                <div className="sm:col-span-2 xl:col-span-1">
                                  <label className="block text-xs font-medium text-[#6b7b91] mb-1">Notes / considerations</label>
                                  <textarea rows={2} value={test.notes} placeholder="Programming notes…"
                                    onChange={(e) => updateTest(selectedClient.id, si, ti, (t) => ({ ...t, notes: e.target.value }))}
                                    className={`${inputCls} resize-none`} />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-[#6b7b91] mb-1">Score</label>
                                  <select value={test.score ?? ""}
                                    onChange={(e) => updateTest(selectedClient.id, si, ti, (t) => ({
                                      ...t, score: e.target.value ? Number(e.target.value) as typeof scoreOptions[number] : null
                                    }))}
                                    className={inputCls}>
                                    <option value="">Not scored</option>
                                    {scoreOptions.map((s) => (
                                      <option key={s} value={s}>{scoreLabel(s)}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-[#6b7b91] mb-1">Assessed date</label>
                                  <input type="date" lang="en-AU" value={test.assessedOn}
                                    onChange={(e) => updateTest(selectedClient.id, si, ti, (t) => ({ ...t, assessedOn: e.target.value }))}
                                    className={inputCls} />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-stone-300 p-8 text-center text-sm text-[#6b7b91]">
                Add your first client to start tracking movement screening results.
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`flex flex-col gap-1 ${className ?? ""}`}>
      <span className="text-xs font-medium text-[#6b7b91]">{label}</span>
      {children}
    </label>
  );
}
