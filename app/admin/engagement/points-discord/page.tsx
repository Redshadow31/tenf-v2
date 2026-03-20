"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import EventDiscordPointsTab from "@/components/admin/EventDiscordPointsTab";

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

const panelClass =
  "rounded-2xl border border-[#2f344a] bg-[linear-gradient(150deg,rgba(79,70,229,0.12),rgba(14,18,28,0.95)_42%,rgba(30,41,59,0.9))] shadow-[0_18px_46px_rgba(2,6,23,0.5)]";
const controlClass =
  "rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-[#93a0ff] focus:ring-2 focus:ring-[#4f46e5]/20";
const secondaryButtonClass =
  "rounded-xl border border-white/20 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-gray-100 transition-colors hover:bg-white/[0.12] disabled:opacity-60 disabled:cursor-not-allowed";
const primaryButtonClass =
  "rounded-xl border border-white/25 bg-[linear-gradient(145deg,rgba(99,102,241,0.32),rgba(79,70,229,0.2))] px-3 py-2 text-xs font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_10px_24px_rgba(15,23,42,0.35)] transition-colors hover:bg-[linear-gradient(145deg,rgba(129,140,248,0.4),rgba(99,102,241,0.27))] disabled:opacity-60 disabled:cursor-not-allowed";
const tabBaseClass =
  "rounded-xl border px-3 py-2 text-xs font-semibold transition-all";
const tabActiveTodoClass = `${tabBaseClass} border-amber-400/55 bg-amber-500/12 text-amber-100 shadow-[0_8px_18px_rgba(245,158,11,0.2)]`;
const tabActiveHistoryClass = `${tabBaseClass} border-emerald-400/55 bg-emerald-500/12 text-emerald-100 shadow-[0_8px_18px_rgba(16,185,129,0.18)]`;
const tabInactiveClass = `${tabBaseClass} border-white/15 bg-white/[0.03] text-slate-300 hover:text-white hover:bg-white/[0.08]`;

export default function AdminEngagementPointsDiscordPage() {
  const pathname = usePathname();
  const [sourceTab, setSourceTab] = useState<"raids" | "events">("raids");
  const [activeTab, setActiveTab] = useState<"todo" | "history">("todo");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [bulkSaving, setBulkSaving] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [runId, setRunId] = useState<string | null>(null);
  const [todo, setTodo] = useState<TodoRaidItem[]>([]);
  const [history, setHistory] = useState<AwardHistoryItem[]>([]);
  const [lastRefreshAt, setLastRefreshAt] = useState<Date | null>(null);
  const [noteByEventId, setNoteByEventId] = useState<Record<string, string>>({});
  const [copyFeedback, setCopyFeedback] = useState("");
  const [bulkFeedback, setBulkFeedback] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string>(() => toMonthKey(new Date()));
  const historyLoadedAtRef = useRef<Record<string, number>>({});
  const availableMonths = useMemo(() => getLast12Months(), []);
  const backHref = pathname.startsWith("/admin/communaute")
    ? "/admin/communaute/engagement/historique-raids"
    : "/admin/raids";

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
    if (sourceTab !== "raids") return;
    void loadData({ includeTodo: true, includeHistory: true, month: selectedMonth });
    const interval = window.setInterval(() => {
      void loadData({ includeTodo: true, includeHistory: activeTab === "history", month: selectedMonth });
    }, 30_000);
    return () => window.clearInterval(interval);
  }, [sourceTab, activeTab, selectedMonth]);

  useEffect(() => {
    if (sourceTab !== "raids") return;
    if (activeTab !== "history") return;
    const loadedAt = historyLoadedAtRef.current[selectedMonth] || 0;
    const ageMs = Date.now() - loadedAt;
    if (!loadedAt || ageMs > 120_000) {
      void loadData({ includeTodo: false, includeHistory: true, month: selectedMonth });
    }
  }, [sourceTab, activeTab, selectedMonth]);

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

  async function awardAllPoints() {
    if (sortedTodo.length === 0) {
      setBulkFeedback("Aucun raid en attente à valider.");
      return;
    }
    const confirmed = window.confirm(
      `Valider ${sortedTodo.length} raid(s) en une seule fois ?\n` +
        "Cette action attribue +500 points pour chaque raid non encore traité."
    );
    if (!confirmed) return;

    setBulkSaving(true);
    setBulkFeedback("");
    try {
      const response = await fetch("/api/admin/engagement/raids-sub/points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventIds: sortedTodo.map((item) => item.id),
          points: 500,
          note: "Validation groupée depuis points-discord",
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || "Impossible de valider tous les raids.");
      }
      const inserted = Number(body.insertedCount || 0);
      const already = Number(body.alreadyAwardedCount || 0);
      const invalid = Number(body.invalidStatusCount || 0);
      const missing = Number(body.missingCount || 0);
      setBulkFeedback(
        `Validation groupée terminée: ${inserted} ajouté(s), ${already} déjà attribué(s), ${invalid} statut non matched, ${missing} introuvable(s).`
      );
      await loadData({ includeTodo: true, includeHistory: activeTab === "history", month: selectedMonth });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur reseau.");
    } finally {
      setBulkSaving(false);
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

  const todoPointsTotal = useMemo(() => sortedTodo.length * 500, [sortedTodo.length]);
  const historyPointsTotal = useMemo(
    () => filteredHistory.reduce((sum, item) => sum + Number(item.points || 0), 0),
    [filteredHistory]
  );
  const uniqueTodoRaiders = useMemo(() => {
    return new Set(sortedTodo.map((item) => String(item.from_broadcaster_user_login || "").toLowerCase())).size;
  }, [sortedTodo]);
  const completionRate = useMemo(() => {
    const total = sortedTodo.length + history.length;
    if (total === 0) return 100;
    return Math.round((history.length / total) * 100);
  }, [sortedTodo.length, history.length]);

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
    <div className="min-h-screen space-y-6 bg-[#0b0f1a] p-4 text-white md:p-6 xl:p-8">
      <div className={`${panelClass} p-6`}>
        <Link href={backHref} className="mb-4 inline-block text-gray-300 transition-colors hover:text-white">
          ← Retour à Engagement
        </Link>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h1 className="mb-2 bg-gradient-to-r from-white via-[#dbe4ff] to-[#93a0ff] bg-clip-text text-3xl font-bold text-transparent md:text-4xl">
              Points Discord - Raids & Evenements
            </h1>
            <p className="text-sm text-slate-300">
              Gestion des points Discord sur deux flux: raids EventSub (+500) et presences evenements (+300).
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Auto-refresh: 30s
              {lastRefreshAt ? ` • dernière mise à jour ${lastRefreshAt.toLocaleTimeString("fr-FR")}` : ""}
              {runId ? ` • run actif ${runId.slice(0, 8)}...` : " • aucun run actif"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-emerald-400/35 bg-emerald-500/12 px-3 py-1 text-xs font-semibold text-emerald-200">
              {completionRate}% traité
            </span>
            <span className="rounded-full border border-sky-400/35 bg-sky-500/12 px-3 py-1 text-xs font-semibold text-sky-200">
              {history.length} validations
            </span>
            <button
              type="button"
              onClick={() => void loadData({ includeTodo: true, includeHistory: activeTab === "history", month: selectedMonth })}
              disabled={loading}
              className={secondaryButtonClass}
            >
              Rafraîchir
            </button>
          </div>
        </div>
      </div>

      <section className={`${panelClass} p-5`}>
        <h2 className="text-base font-semibold text-slate-100">Explication du fonctionnement</h2>
        <div className="mt-3 grid grid-cols-1 gap-2 text-sm md:grid-cols-3">
          <p className="rounded-lg border border-indigo-300/30 bg-indigo-300/10 px-3 py-2 text-indigo-100">
            1. Choisir l&apos;onglet source: <strong>Raids</strong> ou <strong>Evenements</strong>.
          </p>
          <p className="rounded-lg border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-cyan-100">
            2. Generer la commande Discord puis verifier les pseudos avant attribution.
          </p>
          <p className="rounded-lg border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-amber-100">
            3. Valider ligne par ligne ou en masse pour alimenter l&apos;historique mensuel.
          </p>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-emerald-300/35 bg-emerald-300/10 p-3 text-xs text-emerald-100">
            <p className="font-semibold">Flux Raids EventSub</p>
            <p className="mt-1">
              Source: raids <strong>matched</strong> non encore traites. Attribution: <strong>+500</strong>. Commande:
              <strong> /raid @pseudo</strong>.
            </p>
          </div>
          <div className="rounded-xl border border-sky-300/35 bg-sky-300/10 p-3 text-xs text-sky-100">
            <p className="font-semibold">Flux Presences Evenements</p>
            <p className="mt-1">
              Source: presences <strong>validees</strong> (`present=true`). Attribution: <strong>+300</strong>. Commande:
              <strong> /event @pseudo</strong>.
            </p>
          </div>
        </div>
      </section>

      <div className={`${panelClass} p-4`}>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSourceTab("raids")}
            className={sourceTab === "raids" ? tabActiveTodoClass : tabInactiveClass}
          >
            Points Discord raids
          </button>
          <button
            type="button"
            onClick={() => setSourceTab("events")}
            className={sourceTab === "events" ? tabActiveHistoryClass : tabInactiveClass}
          >
            Points Discord evenements
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          {sourceTab === "raids"
            ? "Mode raids: verification des raids EventSub avant attribution +500."
            : "Mode evenements: presences validees +300 avec commande /event."}
        </p>
      </div>

      {sourceTab === "raids" ? (
        <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className={`${panelClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Raids à traiter</p>
          <p className="text-2xl font-bold text-amber-300">{sortedTodo.length}</p>
        </div>
        <div className={`${panelClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Points potentiels</p>
          <p className="text-2xl font-bold text-indigo-200">{todoPointsTotal}</p>
        </div>
        <div className={`${panelClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Raiders uniques</p>
          <p className="text-2xl font-bold text-cyan-200">{uniqueTodoRaiders}</p>
        </div>
        <div className={`${panelClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Points attribués (filtre)</p>
          <p className="text-2xl font-bold text-emerald-300">{historyPointsTotal}</p>
        </div>
      </div>

      <div className={`${panelClass} p-4`}>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("todo")}
            className={activeTab === "todo" ? tabActiveTodoClass : tabInactiveClass}
          >
            À faire ({todo.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={activeTab === "history" ? tabActiveHistoryClass : tabInactiveClass}
          >
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
                placeholder="Rechercher raider / cible / admin / note..."
                className={`${controlClass} w-full max-w-[420px]`}
              />
            </>
          ) : null}
        </div>
      </div>

      {warning ? (
        <div className="rounded-xl border border-yellow-500/40 bg-yellow-900/20 px-4 py-3 text-sm text-yellow-200">{warning}</div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-red-500/40 bg-red-900/20 px-4 py-3 text-sm text-red-200">{error}</div>
      ) : null}

      <div className={`${panelClass} p-6`}>
        {loading ? (
          <p className="text-sm text-gray-300">Chargement des donnees...</p>
        ) : activeTab === "todo" ? (
          sortedTodo.length === 0 ? (
            <p className="text-sm text-gray-300">Aucun point de raid en attente.</p>
          ) : (
            <div className="space-y-4">
              <article className="rounded-xl border border-cyan-400/35 bg-cyan-500/10 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-cyan-100">
                    Commandes Discord pour raids à valider (raiders uniquement, 20 pseudos max/commande)
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" onClick={() => void copyRaidCommands()} className={secondaryButtonClass}>
                      Générer + Copier
                    </button>
                    <button
                      type="button"
                      onClick={() => void awardAllPoints()}
                      disabled={bulkSaving || sortedTodo.length === 0}
                      className={primaryButtonClass}
                    >
                      {bulkSaving ? "Validation globale..." : "Tout valider (+500)"}
                    </button>
                  </div>
                </div>
                {copyFeedback ? <p className="mt-2 text-xs text-cyan-100">{copyFeedback}</p> : null}
                {bulkFeedback ? <p className="mt-2 text-xs text-emerald-200">{bulkFeedback}</p> : null}
                {raidCommands.length === 0 ? (
                  <p className="mt-2 text-xs text-gray-300">Aucun pseudo Discord exploitable trouvé sur les raids en attente.</p>
                ) : (
                  <textarea
                    readOnly
                    value={raidCommands.join("\n")}
                    className="mt-3 min-h-[84px] w-full rounded-xl border border-cyan-400/35 bg-[#0e1720] px-3 py-2 font-mono text-xs text-cyan-100"
                  />
                )}
                {missingRaiders.length > 0 ? (
                  <p className="mt-2 text-xs text-amber-200">Pseudo Discord manquant pour: {missingRaiders.join(", ")}</p>
                ) : null}
              </article>
              {missingRaiders.length > 0 ? (
                <article className="rounded-xl border border-amber-400/35 bg-amber-500/10 p-4">
                  <p className="text-sm font-semibold text-amber-100">Raids sans pseudo Discord relié</p>
                  <p className="mt-1 text-xs text-amber-200">
                    Ces comptes doivent être rapprochés côté membres pour faciliter l’attribution automatique.
                  </p>
                </article>
              ) : null}
              {sortedTodo.map((item) => (
                <article key={item.id} className="rounded-xl border border-[#343a52] bg-[#111725]/85 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-base font-semibold text-white">
                      Raider: {item.from_broadcaster_user_login} → Cible: {item.to_broadcaster_user_login}
                    </p>
                    <span className="inline-flex items-center rounded-full border border-yellow-400/40 bg-yellow-500/10 px-2 py-1 text-xs font-semibold text-yellow-300">
                      +500 à attribuer
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-400">
                    Raid: {new Date(item.event_at).toLocaleString("fr-FR")} • viewers: {item.viewers}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Pseudo Discord raider:{" "}
                    {item.raider_discord_username ? `@${String(item.raider_discord_username).replace(/^@/, "")}` : "introuvable"}
                  </p>
                  <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto]">
                    <input
                      value={noteByEventId[item.id] || ""}
                      onChange={(event) => setNoteByEventId((prev) => ({ ...prev, [item.id]: event.target.value }))}
                      placeholder="Note optionnelle (ex: points envoyés via bot manuellement)"
                      className={controlClass}
                    />
                    <button
                      type="button"
                      onClick={() => void awardPoints(item.id)}
                      disabled={bulkSaving || savingId === item.id}
                      className={primaryButtonClass}
                    >
                      {savingId === item.id ? "Validation..." : "Valider points +500"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )
        ) : filteredHistory.length === 0 ? (
          <p className="text-sm text-gray-300">Aucun point attribué pour ce mois.</p>
        ) : (
          <div className="space-y-3">
            {filteredHistory.map((item) => (
              <article key={item.id} className="rounded-xl border border-[#2f3d3a] bg-[#111b19]/80 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-base font-semibold text-white">
                    {item.raider_twitch_login} → {item.target_twitch_login}
                  </p>
                  <span className="inline-flex items-center rounded-full border border-emerald-400/45 bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-300">
                    {item.status === "awarded" ? "Points attribués" : item.status}
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
      </div>
        </>
      ) : (
        <EventDiscordPointsTab />
      )}
    </div>
  );
}
