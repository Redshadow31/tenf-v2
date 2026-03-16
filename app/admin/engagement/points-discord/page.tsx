"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type TodoRaidItem = {
  id: string;
  run_id: string;
  from_broadcaster_user_login: string;
  to_broadcaster_user_login: string;
  event_at: string;
  viewers: number;
  raider_discord_username?: string | null;
};

type AwardHistoryItem = {
  id: string;
  run_id: string;
  raid_test_event_id: string;
  raider_twitch_login: string;
  target_twitch_login: string;
  event_at: string;
  points: number;
  status: "awarded" | "cancelled";
  note: string;
  awarded_by_discord_id: string;
  awarded_by_username: string;
  awarded_at: string;
};

type PointsResponse = {
  backendReady: boolean;
  warning?: string;
  runId: string | null;
  month?: string;
  todo?: TodoRaidItem[];
  history?: AwardHistoryItem[];
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

export default function AdminEngagementPointsDiscordPage() {
  const [activeTab, setActiveTab] = useState<"todo" | "history">("todo");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [runId, setRunId] = useState<string | null>(null);
  const [todo, setTodo] = useState<TodoRaidItem[]>([]);
  const [history, setHistory] = useState<AwardHistoryItem[]>([]);
  const [lastRefreshAt, setLastRefreshAt] = useState<Date | null>(null);
  const [noteByEventId, setNoteByEventId] = useState<Record<string, string>>({});
  const [copyFeedback, setCopyFeedback] = useState("");
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
      const response = await fetch(`/api/admin/engagement/raids-sub/points?${params.toString()}`, { cache: "no-store" });
      const body = (await response.json()) as PointsResponse & { error?: string };
      if (!response.ok) {
        throw new Error(body.error || "Impossible de charger les points de raid.");
      }
      setWarning(body.warning || "");
      setRunId(body.runId);
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

  async function awardPoints(eventId: string) {
    setSavingId(eventId);
    try {
      const response = await fetch("/api/admin/engagement/raids-sub/points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          points: 500,
          note: (noteByEventId[eventId] || "").trim(),
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || "Impossible d attribuer les points.");
      }
      await loadData({ includeTodo: true, includeHistory: activeTab === "history", month: selectedMonth });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur reseau.");
    } finally {
      setSavingId("");
    }
  }

  const sortedTodo = useMemo(() => {
    return [...todo].sort((a, b) => new Date(b.event_at).getTime() - new Date(a.event_at).getTime());
  }, [todo]);

  const sortedHistory = useMemo(() => {
    return [...history].sort((a, b) => new Date(b.awarded_at).getTime() - new Date(a.awarded_at).getTime());
  }, [history]);

  const filteredHistory = useMemo(() => {
    const query = historySearch.trim().toLowerCase();
    if (!query) return sortedHistory;
    return sortedHistory.filter((item) => {
      const raider = String(item.raider_twitch_login || "").toLowerCase();
      const target = String(item.target_twitch_login || "").toLowerCase();
      const by = String(item.awarded_by_username || "").toLowerCase();
      const note = String(item.note || "").toLowerCase();
      return raider.includes(query) || target.includes(query) || by.includes(query) || note.includes(query);
    });
  }, [sortedHistory, historySearch]);

  const raidCommands = useMemo(() => {
    const uniquePseudo = new Map<string, string>();
    for (const item of sortedTodo) {
      const raw = String(item.raider_discord_username || "").trim();
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
      commands.push(`/raid ${chunk.join(" ")}`);
    }
    return commands;
  }, [sortedTodo]);

  const missingRaiders = useMemo(() => {
    const missing = new Set<string>();
    for (const item of sortedTodo) {
      if (!item.raider_discord_username) {
        missing.add(item.from_broadcaster_user_login);
      }
    }
    return Array.from(missing).sort();
  }, [sortedTodo]);

  async function copyRaidCommands() {
    const payload = raidCommands.join("\n").trim();
    if (!payload) {
      setCopyFeedback("Aucune commande a copier.");
      return;
    }
    try {
      await navigator.clipboard.writeText(payload);
      setCopyFeedback(`Copie OK (${raidCommands.length} commande${raidCommands.length > 1 ? "s" : ""}).`);
    } catch {
      setCopyFeedback("Copie impossible depuis le navigateur.");
    }
  }

  return (
    <div className="min-h-screen bg-[#0e0e10] p-8 text-white">
      <div className="mb-8">
        <Link href="/admin/raids" className="mb-4 inline-block text-gray-400 transition-colors hover:text-white">
          ← Retour à Engagement
        </Link>
        <h1 className="mb-2 text-4xl font-bold">Points de raid Discord</h1>
        <p className="text-gray-400">
          Validation des points (+500) apres verification des raids EventSub.
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Auto-refresh: 30s
          {lastRefreshAt ? ` • derniere mise a jour ${lastRefreshAt.toLocaleTimeString("fr-FR")}` : ""}
          {runId ? ` • run actif ${runId.slice(0, 8)}...` : " • aucun run actif"}
        </p>
      </div>

      <div className="mb-6 rounded-xl border border-gray-700 bg-[#1a1a1d] p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("todo")}
            className="rounded-md border px-3 py-1.5 text-xs font-semibold"
            style={{
              borderColor: activeTab === "todo" ? "rgba(250,204,21,0.55)" : "rgba(255,255,255,0.18)",
              color: activeTab === "todo" ? "#fde68a" : "#cbd5e1",
            }}
          >
            A faire ({todo.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className="rounded-md border px-3 py-1.5 text-xs font-semibold"
            style={{
              borderColor: activeTab === "history" ? "rgba(52,211,153,0.55)" : "rgba(255,255,255,0.18)",
              color: activeTab === "history" ? "#6ee7b7" : "#cbd5e1",
            }}
          >
            Historique ({history.length})
          </button>
          <button
            type="button"
            onClick={() => void loadData({ includeTodo: true, includeHistory: activeTab === "history", month: selectedMonth })}
            disabled={loading}
            className="rounded-md border border-white/20 px-3 py-1.5 text-xs font-semibold text-gray-200 disabled:opacity-60"
          >
            Rafraichir
          </button>
        </div>
      </div>

      {warning ? <div className="mb-4 rounded-lg border border-yellow-500/40 bg-yellow-900/20 px-4 py-3 text-sm text-yellow-200">{warning}</div> : null}
      {error ? <div className="mb-4 rounded-lg border border-red-500/40 bg-red-900/20 px-4 py-3 text-sm text-red-200">{error}</div> : null}

      <div className="rounded-lg border border-gray-700 bg-[#1a1a1d] p-6">
        {loading ? (
          <p className="text-sm text-gray-300">Chargement des donnees...</p>
        ) : activeTab === "todo" ? (
          sortedTodo.length === 0 ? (
            <p className="text-sm text-gray-300">Aucun point de raid en attente.</p>
          ) : (
            <div className="space-y-3">
              <article className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-cyan-200">
                    Commandes Discord pour raids a valider (raiders uniquement, 20 pseudos max/commande)
                  </p>
                  <button
                    type="button"
                    onClick={() => void copyRaidCommands()}
                    className="rounded-md border border-cyan-400/50 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-200"
                  >
                    Generer + Copier
                  </button>
                </div>
                {copyFeedback ? <p className="mt-2 text-xs text-cyan-100">{copyFeedback}</p> : null}
                {raidCommands.length === 0 ? (
                  <p className="mt-2 text-xs text-gray-300">
                    Aucun pseudo Discord exploitable trouve sur les raids en attente.
                  </p>
                ) : (
                  <textarea
                    readOnly
                    value={raidCommands.join("\n")}
                    className="mt-3 min-h-[84px] w-full rounded-md border border-cyan-400/35 bg-[#0e1720] px-3 py-2 font-mono text-xs text-cyan-100"
                  />
                )}
                {missingRaiders.length > 0 ? (
                  <p className="mt-2 text-xs text-amber-200">
                    Pseudo Discord manquant pour: {missingRaiders.join(", ")}
                  </p>
                ) : null}
              </article>
              {sortedTodo.map((item) => (
                <article key={item.id} className="rounded-lg border border-gray-700 bg-[#101014] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-base font-semibold text-white">
                      Raider: {item.from_broadcaster_user_login} → Cible: {item.to_broadcaster_user_login}
                    </p>
                    <span className="inline-flex items-center rounded-full border border-yellow-400/40 bg-yellow-500/10 px-2 py-1 text-xs font-semibold text-yellow-300">
                      +500 a attribuer
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-400">
                    Raid: {new Date(item.event_at).toLocaleString("fr-FR")} • viewers: {item.viewers}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Pseudo Discord raider: {item.raider_discord_username ? `@${String(item.raider_discord_username).replace(/^@/, "")}` : "introuvable"}
                  </p>
                  <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto]">
                    <input
                      value={noteByEventId[item.id] || ""}
                      onChange={(event) => setNoteByEventId((prev) => ({ ...prev, [item.id]: event.target.value }))}
                      placeholder="Note optionnelle (ex: points envoyes via bot manuellement)"
                      className="rounded-md border px-3 py-2 text-sm"
                      style={{ borderColor: "rgba(255,255,255,0.18)", backgroundColor: "#0e0e10", color: "#fff" }}
                    />
                    <button
                      type="button"
                      onClick={() => void awardPoints(item.id)}
                      disabled={savingId === item.id}
                      className="rounded-md border border-emerald-400/50 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 disabled:opacity-60"
                    >
                      {savingId === item.id ? "Validation..." : "Valider points +500"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )
        ) : (
          <>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <select
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className="rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: "rgba(255,255,255,0.15)", backgroundColor: "#0e0e10", color: "#fff" }}
              >
                {availableMonths.map((month) => (
                  <option key={month} value={month}>
                    {formatMonthLabel(month)}
                  </option>
                ))}
              </select>
              <input
                value={historySearch}
                onChange={(event) => setHistorySearch(event.target.value)}
                placeholder="Rechercher raider/cible/admin/note..."
                className="w-full max-w-[460px] rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: "rgba(255,255,255,0.15)", backgroundColor: "#0e0e10", color: "#fff" }}
              />
            </div>
            {filteredHistory.length === 0 ? (
          <p className="text-sm text-gray-300">Aucun point attribue pour ce mois.</p>
        ) : (
          <div className="space-y-3">
            {filteredHistory.map((item) => (
              <article key={item.id} className="rounded-lg border border-gray-700 bg-[#101014] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-base font-semibold text-white">
                    {item.raider_twitch_login} → {item.target_twitch_login}
                  </p>
                  <span className="inline-flex items-center rounded-full border border-emerald-400/45 bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-300">
                    {item.status === "awarded" ? "Points attribues" : item.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-400">
                  Raid: {new Date(item.event_at).toLocaleString("fr-FR")} • Validation points: {new Date(item.awarded_at).toLocaleString("fr-FR")}
                </p>
                <p className="mt-1 text-sm text-gray-300">Points: +{item.points}</p>
                <p className="mt-1 text-xs text-gray-400">
                  Valide par: {item.awarded_by_username} ({item.awarded_by_discord_id})
                </p>
                {item.note ? <p className="mt-1 text-xs text-gray-400">Note: {item.note}</p> : null}
              </article>
            ))}
          </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
