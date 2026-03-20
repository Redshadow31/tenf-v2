"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type EventTodoItem = {
  presence_key: string;
  event_id: string;
  event_title: string;
  event_at: string;
  twitch_login: string;
  display_name: string;
  discord_username?: string | null;
  validated_at?: string;
};

type EventAwardHistoryItem = {
  id: string;
  presenceKey: string;
  eventId: string;
  eventTitle: string;
  eventAt: string;
  twitchLogin: string;
  displayName: string;
  discordUsername?: string;
  points: number;
  status: "awarded" | "cancelled";
  note: string;
  awardedByDiscordId: string;
  awardedByUsername: string;
  awardedAt: string;
};

type EventPointsResponse = {
  backendReady: boolean;
  warning?: string;
  month?: string;
  todo?: EventTodoItem[];
  history?: EventAwardHistoryItem[];
  counters: {
    todo: number;
    history: number;
  };
};

function toMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getLast12Months(): string[] {
  const now = new Date();
  return Array.from({ length: 12 }, (_, idx) => {
    const d = new Date(now.getFullYear(), now.getMonth() - idx, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
}

function formatMonthLabel(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!year || !month || month < 1 || month > 12) {
    return monthKey;
  }
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

const panelClass =
  "rounded-2xl border border-[#2f344a] bg-[linear-gradient(150deg,rgba(79,70,229,0.12),rgba(14,18,28,0.95)_42%,rgba(30,41,59,0.9))] shadow-[0_18px_46px_rgba(2,6,23,0.5)]";
const controlClass =
  "rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-[#93a0ff] focus:ring-2 focus:ring-[#4f46e5]/20";
const secondaryButtonClass =
  "rounded-xl border border-white/20 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-gray-100 transition-colors hover:bg-white/[0.12] disabled:opacity-60 disabled:cursor-not-allowed";
const primaryButtonClass =
  "rounded-xl border border-white/25 bg-[linear-gradient(145deg,rgba(99,102,241,0.32),rgba(79,70,229,0.2))] px-3 py-2 text-xs font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_10px_24px_rgba(15,23,42,0.35)] transition-colors hover:bg-[linear-gradient(145deg,rgba(129,140,248,0.4),rgba(99,102,241,0.27))] disabled:opacity-60 disabled:cursor-not-allowed";
const tabBaseClass = "rounded-xl border px-3 py-2 text-xs font-semibold transition-all";
const tabActiveTodoClass = `${tabBaseClass} border-amber-400/55 bg-amber-500/12 text-amber-100 shadow-[0_8px_18px_rgba(245,158,11,0.2)]`;
const tabActiveHistoryClass = `${tabBaseClass} border-emerald-400/55 bg-emerald-500/12 text-emerald-100 shadow-[0_8px_18px_rgba(16,185,129,0.18)]`;
const tabInactiveClass = `${tabBaseClass} border-white/15 bg-white/[0.03] text-slate-300 hover:text-white hover:bg-white/[0.08]`;

export default function EventDiscordPointsTab() {
  const [activeTab, setActiveTab] = useState<"todo" | "history">("todo");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [bulkSaving, setBulkSaving] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [todo, setTodo] = useState<EventTodoItem[]>([]);
  const [history, setHistory] = useState<EventAwardHistoryItem[]>([]);
  const [lastRefreshAt, setLastRefreshAt] = useState<Date | null>(null);
  const [noteByPresenceKey, setNoteByPresenceKey] = useState<Record<string, string>>({});
  const [copyFeedback, setCopyFeedback] = useState("");
  const [bulkFeedback, setBulkFeedback] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string>(() => toMonthKey(new Date()));
  const historyLoadedAtRef = useRef<Record<string, number>>({});
  const availableMonths = useMemo(() => getLast12Months(), []);

  async function loadData(options?: { includeTodo?: boolean; includeHistory?: boolean; month?: string }) {
    const includeTodo = options?.includeTodo ?? true;
    const includeHistory = options?.includeHistory ?? true;
    const month = options?.month || selectedMonth;
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({
        includeTodo: includeTodo ? "true" : "false",
        includeHistory: includeHistory ? "true" : "false",
      });
      if (includeHistory) {
        params.set("month", month);
      }
      const response = await fetch(`/api/admin/events/points-discord?${params.toString()}`, { cache: "no-store" });
      const body = (await response.json()) as EventPointsResponse & { error?: string };
      if (!response.ok) {
        throw new Error(body.error || "Impossible de charger les points evenement.");
      }
      setWarning(body.warning || "");
      if (includeTodo) {
        setTodo(body.todo || []);
      }
      if (includeHistory) {
        setHistory(body.history || []);
        historyLoadedAtRef.current[month] = Date.now();
      }
      setLastRefreshAt(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur reseau.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData({ includeTodo: true, includeHistory: true, month: selectedMonth });
    const interval = window.setInterval(() => {
      void loadData({ includeTodo: true, includeHistory: activeTab === "history", month: selectedMonth });
    }, 30_000);
    return () => window.clearInterval(interval);
  }, [activeTab, selectedMonth]);

  useEffect(() => {
    if (activeTab !== "history") return;
    const loadedAt = historyLoadedAtRef.current[selectedMonth] || 0;
    const ageMs = Date.now() - loadedAt;
    if (!loadedAt || ageMs > 120_000) {
      void loadData({ includeTodo: false, includeHistory: true, month: selectedMonth });
    }
  }, [activeTab, selectedMonth]);

  const sortedTodo = useMemo(
    () => [...todo].sort((a, b) => new Date(b.event_at).getTime() - new Date(a.event_at).getTime()),
    [todo]
  );
  const sortedHistory = useMemo(
    () => [...history].sort((a, b) => new Date(b.awardedAt).getTime() - new Date(a.awardedAt).getTime()),
    [history]
  );
  const filteredHistory = useMemo(() => {
    const query = historySearch.trim().toLowerCase();
    if (!query) return sortedHistory;
    return sortedHistory.filter((item) => {
      const eventTitle = String(item.eventTitle || "").toLowerCase();
      const twitch = String(item.twitchLogin || "").toLowerCase();
      const discord = String(item.discordUsername || "").toLowerCase();
      const by = String(item.awardedByUsername || "").toLowerCase();
      const note = String(item.note || "").toLowerCase();
      return (
        eventTitle.includes(query) ||
        twitch.includes(query) ||
        discord.includes(query) ||
        by.includes(query) ||
        note.includes(query)
      );
    });
  }, [sortedHistory, historySearch]);

  const eventCommands = useMemo(() => {
    const uniquePseudo = new Map<string, string>();
    for (const item of sortedTodo) {
      const raw = String(item.discord_username || "").trim();
      if (!raw) continue;
      const mention = raw.startsWith("@") ? raw : `@${raw}`;
      const key = mention.toLowerCase();
      if (!uniquePseudo.has(key)) {
        uniquePseudo.set(key, mention);
      }
    }
    const pseudos = Array.from(uniquePseudo.values());
    const commands: string[] = [];
    for (let index = 0; index < pseudos.length; index += 20) {
      const chunk = pseudos.slice(index, index + 20);
      commands.push(`/event ${chunk.join(" ")}`);
    }
    return commands;
  }, [sortedTodo]);

  const missingDiscord = useMemo(() => {
    const missing = new Set<string>();
    for (const item of sortedTodo) {
      if (!item.discord_username) {
        missing.add(item.twitch_login);
      }
    }
    return Array.from(missing).sort();
  }, [sortedTodo]);

  const todoPointsTotal = useMemo(() => sortedTodo.length * 300, [sortedTodo.length]);
  const historyPointsTotal = useMemo(
    () => filteredHistory.reduce((sum, item) => sum + Number(item.points || 0), 0),
    [filteredHistory]
  );

  async function awardPoints(presenceKey: string) {
    setSavingId(presenceKey);
    try {
      const response = await fetch("/api/admin/events/points-discord", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          presenceKey,
          points: 300,
          note: (noteByPresenceKey[presenceKey] || "").trim(),
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || "Impossible d attribuer les points evenement.");
      }
      await loadData({ includeTodo: true, includeHistory: activeTab === "history", month: selectedMonth });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur reseau.");
    } finally {
      setSavingId("");
    }
  }

  async function awardAllPoints() {
    if (sortedTodo.length === 0) {
      setBulkFeedback("Aucun participant evenement en attente.");
      return;
    }
    const confirmed = window.confirm(
      `Valider ${sortedTodo.length} presence(s) en une seule fois ?\n` +
        "Cette action attribue +300 points pour chaque presence validee non encore traitee."
    );
    if (!confirmed) return;

    setBulkSaving(true);
    setBulkFeedback("");
    try {
      const response = await fetch("/api/admin/events/points-discord", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          presenceKeys: sortedTodo.map((item) => item.presence_key),
          points: 300,
          note: "Validation groupee depuis points-discord (events)",
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || "Impossible de valider toutes les presences.");
      }
      const inserted = Number(body.insertedCount || 0);
      const already = Number(body.alreadyAwardedCount || 0);
      const invalid = Number(body.invalidCount || 0);
      const missing = Number(body.missingCount || 0);
      setBulkFeedback(
        `Validation groupee terminee: ${inserted} ajoute(s), ${already} deja attribue(s), ${invalid} invalide(s), ${missing} introuvable(s).`
      );
      await loadData({ includeTodo: true, includeHistory: activeTab === "history", month: selectedMonth });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur reseau.");
    } finally {
      setBulkSaving(false);
    }
  }

  async function copyEventCommands() {
    const payload = eventCommands.join("\n").trim();
    if (!payload) {
      setCopyFeedback("Aucune commande a copier.");
      return;
    }
    try {
      await navigator.clipboard.writeText(payload);
      setCopyFeedback(`Copie OK (${eventCommands.length} commande${eventCommands.length > 1 ? "s" : ""}).`);
    } catch {
      setCopyFeedback("Copie impossible depuis le navigateur.");
    }
  }

  return (
    <div className="space-y-6">
      <section className={`${panelClass} p-5`}>
        <h2 className="text-base font-semibold text-slate-100">Comment fonctionne l&apos;onglet Evenements</h2>
        <div className="mt-3 grid grid-cols-1 gap-2 text-sm md:grid-cols-3">
          <p className="rounded-lg border border-indigo-300/30 bg-indigo-300/10 px-3 py-2 text-indigo-100">
            1. On recupere les presences validees (`present=true`) sur les evenements du mois.
          </p>
          <p className="rounded-lg border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-cyan-100">
            2. On resolve le pseudo Discord depuis la presence, sinon depuis l&apos;inscription event.
          </p>
          <p className="rounded-lg border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-amber-100">
            3. Validation points: <strong>+300</strong> avec commande bot <strong>/event @pseudo</strong>.
          </p>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className={`${panelClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Presences validees a traiter</p>
          <p className="text-2xl font-bold text-amber-300">{sortedTodo.length}</p>
        </div>
        <div className={`${panelClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Points potentiels</p>
          <p className="text-2xl font-bold text-indigo-200">{todoPointsTotal}</p>
        </div>
        <div className={`${panelClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Historique (mois)</p>
          <p className="text-2xl font-bold text-cyan-200">{history.length}</p>
        </div>
        <div className={`${panelClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Points attribues (filtre)</p>
          <p className="text-2xl font-bold text-emerald-300">{historyPointsTotal}</p>
        </div>
      </div>

      <div className={`${panelClass} p-4`}>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setActiveTab("todo")} className={activeTab === "todo" ? tabActiveTodoClass : tabInactiveClass}>
            A faire ({todo.length})
          </button>
          <button type="button" onClick={() => setActiveTab("history")} className={activeTab === "history" ? tabActiveHistoryClass : tabInactiveClass}>
            Historique ({history.length})
          </button>
          {activeTab === "history" ? (
            <>
              <select value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} className={controlClass}>
                {availableMonths.map((month) => (
                  <option key={month} value={month}>
                    {formatMonthLabel(month)}
                  </option>
                ))}
              </select>
              <input
                value={historySearch}
                onChange={(event) => setHistorySearch(event.target.value)}
                placeholder="Rechercher event / twitch / discord / admin / note..."
                className={`${controlClass} w-full max-w-[420px]`}
              />
            </>
          ) : null}
        </div>
      </div>

      {warning ? <div className="rounded-xl border border-yellow-500/40 bg-yellow-900/20 px-4 py-3 text-sm text-yellow-200">{warning}</div> : null}
      {error ? <div className="rounded-xl border border-red-500/40 bg-red-900/20 px-4 py-3 text-sm text-red-200">{error}</div> : null}

      <div className={`${panelClass} p-6`}>
        <p className="mb-3 text-xs text-slate-400">
          Auto-refresh: 30s
          {lastRefreshAt ? ` • derniere mise a jour ${lastRefreshAt.toLocaleTimeString("fr-FR")}` : ""}
        </p>
        {loading ? (
          <p className="text-sm text-gray-300">Chargement des donnees...</p>
        ) : activeTab === "todo" ? (
          sortedTodo.length === 0 ? (
            <p className="text-sm text-gray-300">Aucun point evenement en attente.</p>
          ) : (
            <div className="space-y-4">
              <article className="rounded-xl border border-cyan-400/35 bg-cyan-500/10 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-cyan-100">
                    Commandes Discord evenements (participants valides, 20 pseudos max/commande)
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" onClick={() => void copyEventCommands()} className={secondaryButtonClass}>
                      Generer + Copier
                    </button>
                    <button type="button" onClick={() => void awardAllPoints()} disabled={bulkSaving || sortedTodo.length === 0} className={primaryButtonClass}>
                      {bulkSaving ? "Validation globale..." : "Tout valider (+300)"}
                    </button>
                  </div>
                </div>
                {copyFeedback ? <p className="mt-2 text-xs text-cyan-100">{copyFeedback}</p> : null}
                {bulkFeedback ? <p className="mt-2 text-xs text-emerald-200">{bulkFeedback}</p> : null}
                {eventCommands.length === 0 ? (
                  <p className="mt-2 text-xs text-gray-300">Aucun pseudo Discord exploitable sur les presences en attente.</p>
                ) : (
                  <textarea readOnly value={eventCommands.join("\n")} className="mt-3 min-h-[84px] w-full rounded-xl border border-cyan-400/35 bg-[#0e1720] px-3 py-2 font-mono text-xs text-cyan-100" />
                )}
                {missingDiscord.length > 0 ? (
                  <p className="mt-2 text-xs text-amber-200">Pseudo Discord manquant pour: {missingDiscord.join(", ")}</p>
                ) : null}
              </article>
              {sortedTodo.map((item) => (
                <article key={item.presence_key} className="rounded-xl border border-[#343a52] bg-[#111725]/85 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-base font-semibold text-white">
                      {item.display_name} ({item.twitch_login}) • {item.event_title}
                    </p>
                    <span className="inline-flex items-center rounded-full border border-yellow-400/40 bg-yellow-500/10 px-2 py-1 text-xs font-semibold text-yellow-300">
                      +300 a attribuer
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-400">
                    Event: {new Date(item.event_at).toLocaleString("fr-FR")}
                    {item.validated_at ? ` • presence validee: ${new Date(item.validated_at).toLocaleString("fr-FR")}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Pseudo Discord: {item.discord_username ? `@${String(item.discord_username).replace(/^@/, "")}` : "introuvable"}
                  </p>
                  <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto]">
                    <input
                      value={noteByPresenceKey[item.presence_key] || ""}
                      onChange={(event) => setNoteByPresenceKey((prev) => ({ ...prev, [item.presence_key]: event.target.value }))}
                      placeholder="Note optionnelle (ex: points envoyes via bot manuellement)"
                      className={controlClass}
                    />
                    <button type="button" onClick={() => void awardPoints(item.presence_key)} disabled={bulkSaving || savingId === item.presence_key} className={primaryButtonClass}>
                      {savingId === item.presence_key ? "Validation..." : "Valider points +300"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )
        ) : filteredHistory.length === 0 ? (
          <p className="text-sm text-gray-300">Aucun point evenement attribue pour ce mois.</p>
        ) : (
          <div className="space-y-3">
            {filteredHistory.map((item) => (
              <article key={item.id} className="rounded-xl border border-[#2f3d3a] bg-[#111b19]/80 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-base font-semibold text-white">
                    {item.displayName} ({item.twitchLogin}) • {item.eventTitle}
                  </p>
                  <span className="inline-flex items-center rounded-full border border-emerald-400/45 bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-300">
                    {item.status === "awarded" ? "Points attribues" : item.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-400">
                  Event: {new Date(item.eventAt).toLocaleString("fr-FR")} • Validation points: {new Date(item.awardedAt).toLocaleString("fr-FR")}
                </p>
                <p className="mt-1 text-sm text-gray-300">Points: +{item.points}</p>
                <p className="mt-1 text-xs text-gray-400">
                  Valide par: {item.awardedByUsername} ({item.awardedByDiscordId})
                </p>
                {item.discordUsername ? <p className="mt-1 text-xs text-gray-400">Discord: @{String(item.discordUsername).replace(/^@/, "")}</p> : null}
                {item.note ? <p className="mt-1 text-xs text-gray-400">Note: {item.note}</p> : null}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
