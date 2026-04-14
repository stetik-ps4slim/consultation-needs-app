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

export function MovementScreeningDashboard({
  initialClients,
  isPersistent
}: DashboardProps) {
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
  const hydratedRef = useRef(false);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    if (isPersistent || hydratedRef.current) {
      hydratedRef.current = true;
      return;
    }

    const storedValue = window.localStorage.getItem(storageKey);

    if (!storedValue) {
      hydratedRef.current = true;
      return;
    }

    try {
      const parsed = JSON.parse(storedValue) as ScreeningClient[];
      if (Array.isArray(parsed) && parsed.length) {
        setClients(parsed);
        setSelectedClientId(parsed[0].id);
      }
    } catch (error) {
      console.error("Could not read saved movement screening data", error);
    } finally {
      hydratedRef.current = true;
    }
  }, [isPersistent]);

  useEffect(() => {
    if (!hydratedRef.current || isPersistent) {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(clients));
  }, [clients, isPersistent]);

  useEffect(() => {
    if (!isPersistent || !dirtyClientIds.length) {
      return;
    }

    const timer = window.setTimeout(async () => {
      const idsToSync = [...new Set(dirtyClientIds)];
      setIsSyncing(true);
      setStatusMessage("Saving changes to the cloud...");

      try {
        const currentClients = idsToSync
          .map((id) => clients.find((client) => client.id === id))
          .filter((client): client is ScreeningClient => Boolean(client));

        await Promise.all(
          currentClients.map(async (client) => {
            const response = await fetch(`/api/screenings/${client.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: client.name,
                injury: client.injury,
                screeningDate: client.screeningDate,
                contact: client.contact,
                health: client.health,
                conductedBy: client.conductedBy,
                warmupNotes: client.warmupNotes,
                overallNotes: client.overallNotes,
                sections: client.sections
              })
            });

            if (!response.ok) {
              throw new Error("Patch failed");
            }

            const payload = (await response.json()) as { client?: ScreeningClient };

            if (payload.client) {
              setClients((current) =>
                current.map((entry) => (entry.id === payload.client?.id ? payload.client : entry))
              );
            }
          })
        );

        setDirtyClientIds((current) => current.filter((id) => !idsToSync.includes(id)));
        setStatusMessage("All changes synced to the cloud.");
      } catch (error) {
        console.error("Could not sync screening updates", error);
        setStatusMessage("Cloud sync failed. Your edits are still on screen.");
      } finally {
        setIsSyncing(false);
      }
    }, 700);

    return () => window.clearTimeout(timer);
  }, [clients, dirtyClientIds, isPersistent]);

  const visibleClients = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();

    const filtered = clients.filter((client) => {
      if (!normalizedQuery) {
        return true;
      }

      const searchBlob = [
        client.name,
        client.injury,
        client.contact,
        client.health,
        client.overallNotes,
        client.sections
          .flatMap((section) => section.tests)
          .map((test) => `${test.name} ${test.observations} ${test.notes}`)
          .join(" ")
      ]
        .join(" ")
        .toLowerCase();

      return searchBlob.includes(normalizedQuery);
    });

    return sortClients(filtered, sortBy);
  }, [clients, deferredQuery, sortBy]);

  const selectedClient =
    visibleClients.find((client) => client.id === selectedClientId) ??
    clients.find((client) => client.id === selectedClientId) ??
    visibleClients[0] ??
    null;

  useEffect(() => {
    if (!selectedClient && visibleClients[0]) {
      setSelectedClientId(visibleClients[0].id);
    }
  }, [selectedClient, visibleClients]);

  const stats = useMemo(() => {
    const totalClients = clients.length;
    const completedScreens = clients.filter((client) => getCompletedTests(client) > 0).length;
    const averageScore = clients
      .map((client) => getClientAverageScore(client))
      .filter((score): score is number => score !== null);

    return {
      totalClients,
      completedScreens,
      averageScore: averageScore.length
        ? (averageScore.reduce((sum, score) => sum + score, 0) / averageScore.length).toFixed(1)
        : "-",
      filteredCount: visibleClients.length
    };
  }, [clients, visibleClients]);

  function markDirty(clientId: number) {
    if (!isPersistent) {
      return;
    }

    setDirtyClientIds((current) => (current.includes(clientId) ? current : [...current, clientId]));
  }

  function updateClient(clientId: number, updater: (client: ScreeningClient) => ScreeningClient) {
    setClients((current) =>
      current.map((client) =>
        client.id === clientId
          ? {
              ...updater(client),
              updatedAt: new Date().toISOString()
            }
          : client
      )
    );
    markDirty(clientId);
  }

  function updateTest(
    clientId: number,
    sectionIndex: number,
    testIndex: number,
    updater: (test: MovementTest) => MovementTest
  ) {
    updateClient(clientId, (client) => ({
      ...client,
      sections: client.sections.map((section, currentSectionIndex) =>
        currentSectionIndex === sectionIndex
          ? {
              ...section,
              tests: section.tests.map((test, currentTestIndex) =>
                currentTestIndex === testIndex ? updater(test) : test
              )
            }
          : section
      )
    }));
  }

  async function handleNewClient() {
    const nextId = clients.length ? Math.max(...clients.map((client) => client.id)) + 1 : 1;
    const client = createEmptyClient(nextId);

    if (!isPersistent) {
      setClients((current) => [client, ...current]);
      setSelectedClientId(client.id);
      setStatusMessage("Client added locally.");
      return;
    }

    setIsSyncing(true);
    setStatusMessage("Creating client in the cloud...");

    try {
      const response = await fetch("/api/screenings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: client.name,
          injury: client.injury,
          screeningDate: client.screeningDate,
          contact: client.contact,
          health: client.health,
          conductedBy: client.conductedBy,
          warmupNotes: client.warmupNotes,
          overallNotes: client.overallNotes,
          sections: client.sections
        })
      });

      if (!response.ok) {
        throw new Error("Create failed");
      }

      const payload = (await response.json()) as { client?: ScreeningClient };

      if (!payload.client) {
        throw new Error("Missing client payload");
      }

      setClients((current) => [payload.client!, ...current]);
      setSelectedClientId(payload.client.id);
      setStatusMessage("Client saved to the cloud.");
    } catch (error) {
      console.error("Could not create screening client", error);
      setStatusMessage("Cloud create failed. Add Supabase keys or try again.");
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleDeleteClient(clientId: number) {
    const nextClients = clients.filter((client) => client.id !== clientId);

    if (!isPersistent) {
      setClients(nextClients);
      setSelectedClientId(nextClients[0]?.id ?? null);
      setStatusMessage("Client deleted locally.");
      return;
    }

    setClients(nextClients);
    setSelectedClientId(nextClients[0]?.id ?? null);
    setIsSyncing(true);
    setStatusMessage("Removing client from the cloud...");

    try {
      const response = await fetch(`/api/screenings/${clientId}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      setStatusMessage("Client removed from the cloud.");
    } catch (error) {
      console.error("Could not delete screening client", error);
      setStatusMessage("Cloud delete failed. Refresh before making more changes.");
    } finally {
      setIsSyncing(false);
    }
  }

  function handlePrint(client: ScreeningClient) {
    const printWindow = window.open("", "_blank", "width=1080,height=900");

    if (!printWindow) {
      setShowPrintHint(true);
      return;
    }

    const averageScore = getClientAverageScore(client);
    const completed = getCompletedTests(client);
    const total = getTotalTests(client);

    printWindow.document.write(`
      <html>
        <head>
          <title>${escapeHtml(client.name)} Movement Screening</title>
          <style>
            body {
              font-family: "Avenir Next", "Segoe UI", sans-serif;
              color: #111111;
              margin: 32px;
              background: #ffffff;
            }
            h1, h2, h3 { margin: 0 0 12px; }
            .hero {
              padding: 24px;
              border-radius: 24px;
              background: linear-gradient(180deg, #111111 0%, #2b2b2b 56%, #4a4a4a 100%);
              color: white;
            }
            .meta {
              display: grid;
              grid-template-columns: repeat(3, minmax(0, 1fr));
              gap: 12px;
              margin: 20px 0 28px;
            }
            .card {
              border: 1px solid #d4d4d4;
              border-radius: 18px;
              padding: 14px 16px;
              background: #f5f5f5;
            }
            .section {
              margin-top: 24px;
              page-break-inside: avoid;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 12px;
            }
            th, td {
              border: 1px solid #d4d4d4;
              padding: 10px;
              text-align: left;
              vertical-align: top;
              font-size: 14px;
            }
            th {
              background: #ebebeb;
            }
            .note {
              margin-top: 20px;
              padding: 14px 16px;
              border-radius: 18px;
              background: #f5f5f5;
              border: 1px solid #d4d4d4;
            }
            @media print {
              body { margin: 14mm; }
            }
          </style>
        </head>
        <body>
          <div class="hero">
            <h1>${escapeHtml(client.name)}</h1>
            <p>Movement Screening Report</p>
            <p>Conducted by ${escapeHtml(client.conductedBy || "Jazzay Sallah")}</p>
          </div>
          <div class="meta">
            <div class="card"><strong>Date</strong><br />${escapeHtml(client.screeningDate || "-")}</div>
            <div class="card"><strong>Injury</strong><br />${escapeHtml(client.injury || "-")}</div>
            <div class="card"><strong>Contact</strong><br />${escapeHtml(client.contact || "-")}</div>
            <div class="card"><strong>Health</strong><br />${escapeHtml(client.health || "-")}</div>
            <div class="card"><strong>Completed tests</strong><br />${completed}/${total}</div>
            <div class="card"><strong>Average score</strong><br />${averageScore ?? "-"}</div>
          </div>
          <div class="note"><strong>Warm up</strong><br />${escapeHtml(client.warmupNotes || "-")}</div>
          ${client.sections
            .map((section) => renderSection(section))
            .join("")}
          <div class="note"><strong>Overall notes</strong><br />${escapeHtml(client.overallNotes || "-")}</div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_20%_14%,rgba(255,255,255,0.18),transparent_20%),radial-gradient(circle_at_52%_26%,rgba(180,180,180,0.12),transparent_18%),radial-gradient(circle_at_80%_16%,rgba(110,110,110,0.18),transparent_24%),linear-gradient(180deg,#f6f6f6_0%,#e2e2e2_40%,#fafafa_100%)] text-slate-900">
      <PillBackdrop />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/55 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.12)] backdrop-blur-xl sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-5">
              <div className="inline-flex w-fit items-center rounded-full border border-slate-300 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-800">
                Movement Screening Tracker
              </div>
              <div className="space-y-3">
                <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                  Movement Screning "Upper Notch"
                </h1>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Clients" value={String(stats.totalClients)} />
                <StatCard label="Screened" value={String(stats.completedScreens)} />
                <StatCard label="Avg Score" value={String(stats.averageScore)} />
                <StatCard label="Showing" value={String(stats.filteredCount)} />
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-slate-300 bg-[linear-gradient(180deg,#111111_0%,#2b2b2b_44%,#4a4a4a_100%)] p-5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_20px_60px_rgba(0,0,0,0.22)] sm:p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-200">
                Save + Export
              </p>
              <div className="mt-4 space-y-3 text-sm leading-6 text-white/85">
                <div className="rounded-[1.25rem] border border-white/15 bg-white/10 p-4 backdrop-blur">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-100">
                    Storage mode
                  </p>
                  <p className="mt-1">{isPersistent ? "Cloud sync enabled" : "Browser-only saving"}</p>
                </div>
                <div className="rounded-[1.25rem] border border-white/15 bg-white/10 p-4 backdrop-blur">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-100">
                    Status
                  </p>
                  <p className="mt-1">{statusMessage}</p>
                </div>
                <div className="rounded-[1.25rem] border border-white/15 bg-white/10 p-4 backdrop-blur">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-100">
                    PDF export
                  </p>
                  <p className="mt-1">
                    Use “Print / Save PDF” on any client to open a clean report layout.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-8 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="rounded-[2rem] border border-white/70 bg-white/58 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.1)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Client List
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">Search and sort</h2>
              </div>
              <button
                type="button"
                onClick={handleNewClient}
                className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(0,0,0,0.22)] transition hover:bg-slate-800"
              >
                New client
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-600">Search</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by name, injury, notes..."
                  className={inputClassName}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-600">Sort by</span>
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value as ClientSort)}
                  className={inputClassName}
                >
                  <option value="recent">Recently updated</option>
                  <option value="name-asc">Name A-Z</option>
                  <option value="name-desc">Name Z-A</option>
                  <option value="score-high">Highest score</option>
                  <option value="score-low">Lowest score</option>
                </select>
              </label>
            </div>

            <div className="mt-4 rounded-[1.35rem] border border-white/60 bg-white/45 px-4 py-3 text-sm text-slate-600">
              {isSyncing ? "Syncing changes..." : statusMessage}
            </div>

            <div className="mt-5 space-y-3">
              {visibleClients.length ? (
                visibleClients.map((client) => {
                  const averageScore = getClientAverageScore(client);
                  const isActive = client.id === selectedClient?.id;

                  return (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => setSelectedClientId(client.id)}
                      className={`w-full rounded-[1.5rem] border p-4 text-left transition ${
                        isActive
                          ? "border-slate-900 bg-slate-900 text-white shadow-[0_18px_40px_rgba(0,0,0,0.18)]"
                          : "border-white/70 bg-white/55 text-slate-900 hover:border-slate-400 hover:bg-white/75"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-semibold">{client.name}</p>
                          <p
                            className={`mt-1 text-sm ${
                              isActive ? "text-slate-300" : "text-slate-500"
                            }`}
                          >
                            {client.injury || "No injury listed"}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            isActive ? "bg-white/18 text-white" : "bg-slate-200 text-slate-800"
                          }`}
                        >
                          {averageScore ? `${averageScore}/5` : "No score"}
                        </span>
                      </div>
                      <div
                        className={`mt-3 flex items-center justify-between text-sm ${
                          isActive ? "text-slate-300" : "text-slate-500"
                        }`}
                      >
                        <span>
                          {getCompletedTests(client)}/{getTotalTests(client)} tests complete
                        </span>
                        <span>{client.screeningDate || "No date"}</span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-slate-400/50 bg-white/50 p-5 text-sm text-slate-600">
                  No clients match that search yet.
                </div>
              )}
            </div>
          </aside>

          <section className="rounded-[2rem] border border-white/70 bg-white/58 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.1)] backdrop-blur-xl sm:p-6">
            {selectedClient ? (
              <div className="space-y-8">
                <div className="flex flex-col gap-4 border-b border-slate-900/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                      Client Record
                    </p>
                    <h2 className="mt-2 text-3xl font-semibold text-slate-950">
                      {selectedClient.name}
                    </h2>
                    <p className="mt-2 text-sm text-slate-600">
                      Last updated{" "}
                      {new Date(selectedClient.updatedAt).toLocaleString("en-AU", {
                        dateStyle: "medium",
                        timeStyle: "short"
                      })}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => handlePrint(selectedClient)}
                      className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(0,0,0,0.22)] transition hover:bg-slate-800"
                    >
                      Print / Save PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteClient(selectedClient.id)}
                      className="rounded-full border border-slate-400/40 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
                    >
                      Delete client
                    </button>
                  </div>
                </div>

                {showPrintHint ? (
                  <div className="rounded-[1.35rem] border border-slate-400/40 bg-slate-100 px-4 py-3 text-sm text-slate-800">
                    Please allow pop-ups for this site so the print/PDF view can open.
                  </div>
                ) : null}

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <Field label="Name">
                    <input
                      value={selectedClient.name}
                      onChange={(event) =>
                        updateClient(selectedClient.id, (client) => ({
                          ...client,
                          name: event.target.value
                        }))
                      }
                      className={inputClassName}
                    />
                  </Field>
                  <Field label="Injury">
                    <input
                      value={selectedClient.injury}
                      onChange={(event) =>
                        updateClient(selectedClient.id, (client) => ({
                          ...client,
                          injury: event.target.value
                        }))
                      }
                      className={inputClassName}
                    />
                  </Field>
                  <Field label="Date">
                    <input
                      type="date" lang="en-AU"
                      value={selectedClient.screeningDate}
                      onChange={(event) =>
                        updateClient(selectedClient.id, (client) => ({
                          ...client,
                          screeningDate: event.target.value
                        }))
                      }
                      className={inputClassName}
                    />
                  </Field>
                  <Field label="Contact">
                    <input
                      value={selectedClient.contact}
                      onChange={(event) =>
                        updateClient(selectedClient.id, (client) => ({
                          ...client,
                          contact: event.target.value
                        }))
                      }
                      className={inputClassName}
                    />
                  </Field>
                  <Field label="Health">
                    <input
                      value={selectedClient.health}
                      onChange={(event) =>
                        updateClient(selectedClient.id, (client) => ({
                          ...client,
                          health: event.target.value
                        }))
                      }
                      className={inputClassName}
                    />
                  </Field>
                  <Field label="Conducted by">
                    <input
                      value={selectedClient.conductedBy}
                      onChange={(event) =>
                        updateClient(selectedClient.id, (client) => ({
                          ...client,
                          conductedBy: event.target.value
                        }))
                      }
                      className={inputClassName}
                    />
                  </Field>
                  <Field label="Warm up notes" className="md:col-span-2 xl:col-span-3">
                    <textarea
                      rows={2}
                      value={selectedClient.warmupNotes}
                      onChange={(event) =>
                        updateClient(selectedClient.id, (client) => ({
                          ...client,
                          warmupNotes: event.target.value
                        }))
                      }
                      className={`${inputClassName} resize-none`}
                    />
                  </Field>
                  <Field label="Overall notes" className="md:col-span-2 xl:col-span-3">
                    <textarea
                      rows={3}
                      value={selectedClient.overallNotes}
                      onChange={(event) =>
                        updateClient(selectedClient.id, (client) => ({
                          ...client,
                          overallNotes: event.target.value
                        }))
                      }
                      className={`${inputClassName} resize-none`}
                    />
                  </Field>
                </div>

                <div className="space-y-6">
                  {selectedClient.sections.map((section, sectionIndex) => (
                    <div
                      key={section.title}
                      className="rounded-[1.75rem] border border-white/70 bg-white/65 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.06)] sm:p-5"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-semibold text-slate-950">{section.title}</h3>
                          <p className="mt-1 text-sm text-slate-500">
                            Update observations, notes, dates, and movement score.
                          </p>
                        </div>
                        <div className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                          {section.tests.filter((test) => test.completed).length}/
                          {section.tests.length} done
                        </div>
                      </div>

                      <div className="mt-4 space-y-4">
                        {section.tests.map((test, testIndex) => (
                          <article
                            key={`${section.title}-${test.name}`}
                            className="rounded-[1.25rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(242,242,242,0.96)_100%)] p-4"
                          >
                            <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                              <div className="space-y-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <div>
                                    <h4 className="text-lg font-semibold text-slate-950">
                                      {test.name}
                                    </h4>
                                    <p className="mt-1 text-sm text-slate-500">
                                      Mark this test complete and record the result.
                                    </p>
                                  </div>
                                  <label className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white/90 px-3 py-2 text-sm font-medium text-slate-700">
                                    <input
                                      type="checkbox"
                                      checked={test.completed}
                                      onChange={(event) =>
                                        updateTest(
                                          selectedClient.id,
                                          sectionIndex,
                                          testIndex,
                                          (currentTest) => ({
                                            ...currentTest,
                                            completed: event.target.checked
                                          })
                                        )
                                      }
                                      className="h-4 w-4 accent-slate-900"
                                    />
                                    Completed
                                  </label>
                                </div>

                                <Field label="Observations">
                                  <textarea
                                    rows={2}
                                    value={test.observations}
                                    onChange={(event) =>
                                      updateTest(
                                        selectedClient.id,
                                        sectionIndex,
                                        testIndex,
                                        (currentTest) => ({
                                          ...currentTest,
                                          observations: event.target.value
                                        })
                                      )
                                    }
                                    className={`${inputClassName} resize-none`}
                                  />
                                </Field>

                                <Field label="Notes / considerations">
                                  <textarea
                                    rows={2}
                                    value={test.notes}
                                    onChange={(event) =>
                                      updateTest(
                                        selectedClient.id,
                                        sectionIndex,
                                        testIndex,
                                        (currentTest) => ({
                                          ...currentTest,
                                          notes: event.target.value
                                        })
                                      )
                                    }
                                    className={`${inputClassName} resize-none`}
                                  />
                                </Field>
                              </div>

                              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                                <Field label="Score">
                                  <select
                                    value={test.score ?? ""}
                                    onChange={(event) =>
                                      updateTest(
                                        selectedClient.id,
                                        sectionIndex,
                                        testIndex,
                                        (currentTest) => ({
                                          ...currentTest,
                                          score: event.target.value
                                            ? (Number(event.target.value) as (typeof scoreOptions)[number])
                                            : null
                                        })
                                      )
                                    }
                                    className={inputClassName}
                                  >
                                    <option value="">Not scored</option>
                                    {scoreOptions.map((score) => (
                                      <option key={score} value={score}>
                                        {score} / 5
                                      </option>
                                    ))}
                                  </select>
                                </Field>

                                <Field label="Assessed date">
                                  <input
                                    type="date" lang="en-AU"
                                    value={test.assessedOn}
                                    onChange={(event) =>
                                      updateTest(
                                        selectedClient.id,
                                        sectionIndex,
                                        testIndex,
                                        (currentTest) => ({
                                          ...currentTest,
                                          assessedOn: event.target.value
                                        })
                                      )
                                    }
                                    className={inputClassName}
                                  />
                                </Field>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex min-h-[420px] items-center justify-center rounded-[1.5rem] border border-dashed border-slate-400/50 bg-white/55 p-8 text-center text-slate-600">
                Add your first client to start tracking movement screening results.
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}

function PillBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-12 top-0 h-[92vh] w-28 rounded-full bg-[linear-gradient(180deg,rgba(245,245,245,0.9)_0%,rgba(120,120,120,0.9)_40%,rgba(230,230,230,0.95)_100%)] blur-[2px]" />
      <div className="absolute left-[12%] top-0 h-[78vh] w-36 rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(90,90,90,0.95)_42%,rgba(238,238,238,0.96)_100%)] shadow-[0_0_35px_rgba(0,0,0,0.18)]" />
      <div className="absolute left-[32%] top-0 h-[44vh] w-40 rounded-[999px] bg-[linear-gradient(180deg,rgba(60,60,60,0.98)_0%,rgba(150,150,150,0.82)_58%,rgba(235,235,235,0.9)_100%)] shadow-[0_0_45px_rgba(0,0,0,0.16)]" />
      <div className="absolute left-[35%] top-[38vh] h-40 w-40 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(210,210,210,0.96),rgba(150,150,150,0.92)_60%,rgba(245,245,245,0.98)_100%)] shadow-[0_0_50px_rgba(0,0,0,0.14)]" />
      <div className="absolute left-[34%] top-[54vh] h-[44vh] w-40 rounded-[999px] bg-[linear-gradient(180deg,rgba(245,245,245,0.75)_0%,rgba(140,140,140,0.85)_70%,rgba(55,55,55,0.98)_100%)] shadow-[0_0_45px_rgba(0,0,0,0.14)]" />
      <div className="absolute right-[16%] top-0 h-[88vh] w-36 rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(85,85,85,0.95)_40%,rgba(236,236,236,0.96)_100%)] shadow-[0_0_40px_rgba(0,0,0,0.16)]" />
      <div className="absolute -right-10 top-0 h-[100vh] w-32 rounded-full bg-[linear-gradient(180deg,rgba(245,245,245,0.9)_0%,rgba(70,70,70,0.96)_38%,rgba(160,160,160,0.82)_66%,rgba(245,245,245,0.96)_100%)] shadow-[0_0_40px_rgba(0,0,0,0.14)]" />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-white/70 bg-white/58 p-4 backdrop-blur">
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
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
      <span className="mb-2 block text-sm font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}

function renderSection(section: MovementSection) {
  return `
    <section class="section">
      <h2>${escapeHtml(section.title)}</h2>
      <table>
        <thead>
          <tr>
            <th>Test</th>
            <th>Completed</th>
            <th>Score</th>
            <th>Observations</th>
            <th>Notes</th>
            <th>Assessed</th>
          </tr>
        </thead>
        <tbody>
          ${section.tests
            .map(
              (test) => `
                <tr>
                  <td>${escapeHtml(test.name)}</td>
                  <td>${test.completed ? "Yes" : "No"}</td>
                  <td>${test.score ?? "-"}</td>
                  <td>${escapeHtml(test.observations || "-")}</td>
                  <td>${escapeHtml(test.notes || "-")}</td>
                  <td>${escapeHtml(test.assessedOn || "-")}</td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    </section>
  `;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

const inputClassName =
  "w-full rounded-2xl border border-slate-300 bg-white/88 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-300/40";
