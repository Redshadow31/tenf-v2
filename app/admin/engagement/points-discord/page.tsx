"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { History, Search } from "lucide-react";
import EventDiscordPointsTab from "@/components/admin/EventDiscordPointsTab";
import PointsDiscordHeader from "@/components/admin/points-discord/PointsDiscordHeader";
import PointsDiscordSidePanel from "@/components/admin/points-discord/PointsDiscordSidePanel";
import PointsDiscordAwardConfirmModal, {
  type PointsDiscordAwardTarget,
} from "@/components/admin/points-discord/PointsDiscordAwardConfirmModal";
import AdminConfirmModal from "@/components/admin/AdminConfirmModal";

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

type SourceTab = "raids" | "events";
type RaidStateTab = "todo" | "history";
type TodoFilter = "all" | "missing-discord" | "ready";

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
  "rounded-2xl border border-white/[0.08] bg-zinc-950/55 shadow-sm shadow-black/20";
const controlClass =
  "rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-violet-400/60 focus-visible:ring-2 focus-visible:ring-violet-400/40";
const secondaryButtonClass =
  "rounded-xl border border-white/15 bg-white/[0.05] px-3 py-2 text-xs font-semibold text-zinc-100 transition hover:bg-white/[0.1] disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";
const primaryButtonClass =
  "rounded-xl border border-violet-500/45 bg-violet-500/25 px-3 py-2 text-xs font-semibold text-violet-50 transition hover:bg-violet-500/35 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";
const tabBaseClass =
  "rounded-xl border px-3 py-2 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";
const tabActiveTodoClass = `${tabBaseClass} border-amber-400/55 bg-amber-500/15 text-amber-100`;
const tabActiveHistoryClass = `${tabBaseClass} border-emerald-400/55 bg-emerald-500/15 text-emerald-100`;
const tabInactiveClass = `${tabBaseClass} border-white/15 bg-white/[0.03] text-slate-300 hover:bg-white/[0.08] hover:text-white`;

export default function AdminEngagementPointsDiscordPage() {
  const pathname = usePathname() || "";
  const hubLayout = pathname.startsWith("/admin/communaute");
  const [sourceTab, setSourceTab] = useState<SourceTab>("raids");
  const [activeTab, setActiveTab] = useState<RaidStateTab>("todo");
  const [todoFilter, setTodoFilter] = useState<TodoFilter>("all");
  const [todoSearch, setTodoSearch] = useState("");
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
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [awardTarget, setAwardTarget] = useState<(PointsDiscordAwardTarget & { eventId: string }) | null>(null);
  const [pollingActive, setPollingActive] = useState(true);
  const historyLoadedAtRef = useRef<Record<string, number>>({});
  const abortRef = useRef<AbortController | null>(null);
  const availableMonths = useMemo(() => getLast12Months(), []);

  const loadData = useCallback(
    async (options?: { includeTodo?: boolean; includeHistory?: boolean; month?: string; silent?: boolean }) => {
      const includeTodo = options?.includeTodo ?? true;
      const includeHistory = options?.includeHistory ?? true;
      const month = options?.month || selectedMonth;
      const silent = options?.silent ?? false;
      // Annule la requête précédente : évite la course entre auto-poll et clic manuel.
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        if (!silent) setLoading(true);
        setError("");
        const params = new URLSearchParams({
          includeTodo: includeTodo ? "true" : "false",
          includeHistory: includeHistory ? "true" : "false",
        });
        if (includeHistory) {
          params.set("month", month);
        }
        const response = await fetch(`/api/admin/engagement/raids-sub/points?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });
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
        if ((e as Error).name === "AbortError") return;
        setError(e instanceof Error ? e.message : "Erreur réseau.");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [selectedMonth],
  );

  // Page Visibility : suspend l'auto-poll quand l'onglet n'est pas visible.
  useEffect(() => {
    if (typeof document === "undefined") return;
    function syncVisibility() {
      setPollingActive(!document.hidden);
    }
    syncVisibility();
    document.addEventListener("visibilitychange", syncVisibility);
    return () => document.removeEventListener("visibilitychange", syncVisibility);
  }, []);

  useEffect(() => {
    if (sourceTab !== "raids") return;
    void loadData({ includeTodo: true, includeHistory: true, month: selectedMonth });
    if (!pollingActive) return;
    const interval = window.setInterval(() => {
      void loadData({
        includeTodo: true,
        includeHistory: activeTab === "history",
        month: selectedMonth,
        silent: true,
      });
    }, 30_000);
    return () => window.clearInterval(interval);
  }, [sourceTab, activeTab, selectedMonth, pollingActive, loadData]);

  useEffect(() => {
    if (sourceTab !== "raids") return;
    if (activeTab !== "history") return;
    const loadedAt = historyLoadedAtRef.current[selectedMonth] || 0;
    const ageMs = Date.now() - loadedAt;
    if (!loadedAt || ageMs > 120_000) {
      void loadData({ includeTodo: false, includeHistory: true, month: selectedMonth, silent: true });
    }
  }, [sourceTab, activeTab, selectedMonth, loadData]);

  const sortedTodo = useMemo(() => {
    return [...todo].sort((a, b) => new Date(b.event_at).getTime() - new Date(a.event_at).getTime());
  }, [todo]);

  const filteredTodo = useMemo(() => {
    const query = todoSearch.trim().toLowerCase();
    let next = sortedTodo;
    if (todoFilter === "missing-discord") {
      next = next.filter((row) => !row.raider_discord_username);
    } else if (todoFilter === "ready") {
      next = next.filter((row) => !!row.raider_discord_username);
    }
    if (!query) return next;
    return next.filter((row) => {
      const haystack = [
        row.from_broadcaster_user_login,
        row.to_broadcaster_user_login,
        row.raider_discord_username || "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [sortedTodo, todoFilter, todoSearch]);

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
    [filteredHistory],
  );
  const uniqueTodoRaiders = useMemo(() => {
    return new Set(sortedTodo.map((item) => String(item.from_broadcaster_user_login || "").toLowerCase())).size;
  }, [sortedTodo]);

  function openAwardModal(item: TodoRaidItem) {
    setAwardTarget({
      eventId: item.id,
      source: "raid",
      displayLabel: `${item.from_broadcaster_user_login} → ${item.to_broadcaster_user_login}`,
      discordUsername: item.raider_discord_username,
      contextLabel: `Raid du ${new Date(item.event_at).toLocaleString("fr-FR")} · ${item.viewers} viewers`,
    });
  }

  async function confirmAwardUnitary() {
    if (!awardTarget) return;
    const eventId = awardTarget.eventId;
    setSavingId(eventId);
    try {
      const response = await fetch("/api/admin/engagement/raids-sub/points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          note: (noteByEventId[eventId] || "").trim(),
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || "Impossible d’attribuer les points.");
      }
      setAwardTarget(null);
      await loadData({ includeTodo: true, includeHistory: activeTab === "history", month: selectedMonth });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur réseau.");
    } finally {
      setSavingId("");
    }
  }

  function openBulkConfirmModal() {
    if (sortedTodo.length === 0) {
      setBulkFeedback("Aucun raid en attente à valider.");
      return;
    }
    setBulkModalOpen(true);
  }

  async function executeBulkAward() {
    if (sortedTodo.length === 0) return;
    setBulkSaving(true);
    setBulkFeedback("");
    try {
      const response = await fetch("/api/admin/engagement/raids-sub/points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventIds: sortedTodo.map((item) => item.id),
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
        `Validation groupée terminée : ${inserted} ajouté(s), ${already} déjà attribué(s), ${invalid} statut non matched, ${missing} introuvable(s).`,
      );
      setBulkModalOpen(false);
      await loadData({ includeTodo: true, includeHistory: activeTab === "history", month: selectedMonth });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur réseau.");
    } finally {
      setBulkSaving(false);
    }
  }

  async function copyRaidCommands() {
    const payload = raidCommands.join("\n").trim();
    if (!payload) {
      setCopyFeedback("Aucune commande à copier.");
      return;
    }
    try {
      await navigator.clipboard.writeText(payload);
      setCopyFeedback(`Copie effectuée (${raidCommands.length} commande${raidCommands.length > 1 ? "s" : ""}).`);
    } catch {
      setCopyFeedback("Copie impossible depuis le navigateur.");
    }
  }

  const monthChipBase =
    "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";
  const monthChipInactive = "border-white/10 bg-white/[0.04] text-slate-300 hover:border-violet-300/35 hover:text-slate-100";
  const monthChipActive = "border-violet-400/55 bg-violet-500/20 text-violet-50";

  /* --------------------------------------------------------------- */
  /* Mode legacy (`/admin/engagement/points-discord` direct)         */
  /*                                                                  */
  /* La sidebar pointe uniquement vers le hub `/admin/communaute/...` */
  /* mais on conserve ce mode pour la rétro-compatibilité d'URL.      */
  /* --------------------------------------------------------------- */
  if (!hubLayout) {
    return (
      <div className="min-h-screen bg-[#0b0f1a] p-4 text-white md:p-6 xl:p-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className={`${panelClass} p-6`}>
            <Link
              href="/admin/raids"
              className="mb-4 inline-block text-sm text-zinc-300 transition hover:text-white"
            >
              ← Retour à Engagement
            </Link>
            <h1 className="text-3xl font-bold">Points Discord — Raids & Évènements</h1>
            <p className="mt-2 text-sm text-slate-300">
              Gestion des points Discord sur deux flux : raids EventSub (+500) et présences évènements (+300).
            </p>
            <p className="mt-3 text-sm text-amber-200">
              Ce mode est conservé pour rétro-compatibilité. Préférer le hub
              <Link href="/admin/communaute/engagement/points-discord" className="ml-1 underline">
                /admin/communaute/engagement/points-discord
              </Link>
              .
            </p>
          </div>
          <EventDiscordPointsTab />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07080f] text-white">
      <div className="mx-auto max-w-[1480px] px-3 pb-12 pt-4 md:px-6">
        <PointsDiscordHeader
          month={selectedMonth}
          runId={runId}
          lastRefreshAt={lastRefreshAt}
          loading={loading}
          pollingActive={pollingActive}
          onRefresh={() => void loadData({ includeTodo: true, includeHistory: activeTab === "history", month: selectedMonth })}
        />

        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-5">
            {/* Bandeau "À lire en priorité" */}
            {sourceTab === "raids" && (warning || error || bulkFeedback || (activeTab === "todo" && missingRaiders.length > 0)) ? (
              <section
                aria-label="Informations importantes"
                aria-live="polite"
                className={`${panelClass} space-y-3 p-4`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  À lire en priorité
                </p>
                {warning ? (
                  <p className="rounded-xl border border-amber-500/40 bg-amber-950/30 px-3 py-2 text-sm text-amber-100">
                    {warning}
                  </p>
                ) : null}
                {error ? (
                  <p
                    role="alert"
                    className="rounded-xl border border-rose-500/40 bg-rose-950/35 px-3 py-2 text-sm text-rose-100"
                  >
                    {error}
                  </p>
                ) : null}
                {bulkFeedback ? (
                  <p className="rounded-xl border border-emerald-500/35 bg-emerald-950/25 px-3 py-2 text-sm text-emerald-100">
                    {bulkFeedback}
                  </p>
                ) : null}
                {activeTab === "todo" && missingRaiders.length > 0 ? (
                  <p className="rounded-xl border border-amber-400/45 bg-amber-950/30 px-3 py-2 text-sm text-amber-100">
                    <strong>Pseudo Discord manquant</strong> pour&nbsp;: {missingRaiders.join(", ")}. Ces comptes
                    doivent être rapprochés côté fiche membre pour générer les commandes <code>/raid</code>.
                  </p>
                ) : null}
              </section>
            ) : null}

            {/* Sélecteur de source */}
            <div
              role="tablist"
              aria-label="Source des points Discord"
              className={`${panelClass} flex flex-wrap items-center gap-2 p-3`}
            >
              <button
                type="button"
                role="tab"
                aria-selected={sourceTab === "raids"}
                aria-controls="panel-raids"
                id="tab-raids"
                tabIndex={sourceTab === "raids" ? 0 : -1}
                onClick={() => setSourceTab("raids")}
                className={sourceTab === "raids" ? tabActiveTodoClass : tabInactiveClass}
              >
                Raids EventSub (+500)
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={sourceTab === "events"}
                aria-controls="panel-events"
                id="tab-events"
                tabIndex={sourceTab === "events" ? 0 : -1}
                onClick={() => setSourceTab("events")}
                className={sourceTab === "events" ? tabActiveHistoryClass : tabInactiveClass}
              >
                Présences évènements (+300)
              </button>
              <p className="ml-auto text-xs text-slate-500">
                {sourceTab === "raids"
                  ? "Mode raids : vérification des raids EventSub avant attribution +500."
                  : "Mode évènements : présences validées +300 avec commande /event."}
              </p>
            </div>

            {sourceTab === "raids" ? (
              <section
                role="tabpanel"
                id="panel-raids"
                aria-labelledby="tab-raids"
                className="space-y-5"
              >
                {/* KPI (non cliquables : indicateurs purs) */}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <div className={`${panelClass} p-4`}>
                    <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Raids à traiter</p>
                    <p className="mt-1 text-[clamp(1.5rem,1.25rem+0.8vw,2rem)] font-bold text-amber-300">{sortedTodo.length}</p>
                    <p className="mt-1 text-[11px] text-slate-500">Run actif uniquement</p>
                  </div>
                  <div className={`${panelClass} p-4`}>
                    <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Points potentiels</p>
                    <p className="mt-1 text-[clamp(1.5rem,1.25rem+0.8vw,2rem)] font-bold text-violet-200">{todoPointsTotal}</p>
                    <p className="mt-1 text-[11px] text-slate-500">Si toute la file est validée</p>
                  </div>
                  <div className={`${panelClass} p-4`}>
                    <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Raiders uniques</p>
                    <p className="mt-1 text-[clamp(1.5rem,1.25rem+0.8vw,2rem)] font-bold text-cyan-200">{uniqueTodoRaiders}</p>
                    <p className="mt-1 text-[11px] text-slate-500">Sur la file en cours</p>
                  </div>
                  <div className={`${panelClass} p-4`}>
                    <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Points attribués ({selectedMonth})</p>
                    <p className="mt-1 text-[clamp(1.5rem,1.25rem+0.8vw,2rem)] font-bold text-emerald-300">{historyPointsTotal}</p>
                    <p className="mt-1 text-[11px] text-slate-500">Total mensuel filtré</p>
                  </div>
                </div>

                {/* Tabs todo/history */}
                <div
                  role="tablist"
                  aria-label="État des raids"
                  className={`${panelClass} flex flex-wrap items-center gap-2 p-3`}
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "todo"}
                    aria-controls="panel-raids-todo"
                    id="tab-raids-todo"
                    tabIndex={activeTab === "todo" ? 0 : -1}
                    onClick={() => setActiveTab("todo")}
                    className={activeTab === "todo" ? tabActiveTodoClass : tabInactiveClass}
                  >
                    À traiter ({todo.length})
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "history"}
                    aria-controls="panel-raids-history"
                    id="tab-raids-history"
                    tabIndex={activeTab === "history" ? 0 : -1}
                    onClick={() => setActiveTab("history")}
                    className={activeTab === "history" ? tabActiveHistoryClass : tabInactiveClass}
                  >
                    <History className="mr-1 inline-block h-3.5 w-3.5" aria-hidden />
                    Historique ({history.length})
                  </button>
                </div>

                {/* Barre de filtres unifiée */}
                {activeTab === "todo" ? (
                  <div className={`${panelClass} flex flex-col gap-3 p-3 sm:flex-row sm:flex-wrap sm:items-center`}>
                    <div className="flex flex-wrap items-center gap-2">
                      {(
                        [
                          { id: "all" as TodoFilter, label: "Tous" },
                          { id: "ready" as TodoFilter, label: "Prêts à valider" },
                          { id: "missing-discord" as TodoFilter, label: "Discord manquant" },
                        ] as const
                      ).map((chip) => {
                        const active = todoFilter === chip.id;
                        return (
                          <button
                            key={chip.id}
                            type="button"
                            aria-pressed={active}
                            onClick={() => setTodoFilter(chip.id)}
                            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 ${
                              active
                                ? "border-violet-400/55 bg-violet-500/20 text-violet-50"
                                : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-violet-300/35 hover:text-slate-100"
                            }`}
                          >
                            {chip.label}
                          </button>
                        );
                      })}
                    </div>
                    <label className="relative flex-1 min-w-[200px] max-w-xl">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" aria-hidden />
                      <input
                        type="search"
                        value={todoSearch}
                        onChange={(event) => setTodoSearch(event.target.value)}
                        placeholder="Rechercher raider, cible, pseudo Discord…"
                        className={`${controlClass} w-full pl-9`}
                        aria-label="Rechercher dans les raids à traiter"
                      />
                    </label>
                    <p role="status" aria-live="polite" className="text-xs text-slate-400">
                      {filteredTodo.length} / {sortedTodo.length} raid(s)
                    </p>
                  </div>
                ) : null}

                {activeTab === "history" ? (
                  <div className={`${panelClass} flex flex-col gap-3 p-3 sm:flex-row sm:flex-wrap sm:items-center`}>
                    <div className="flex w-full min-w-0 flex-col gap-2 lg:max-w-none">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Mois
                      </p>
                      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
                        {availableMonths.map((month) => (
                          <button
                            key={month}
                            type="button"
                            aria-pressed={selectedMonth === month}
                            onClick={() => setSelectedMonth(month)}
                            className={`${monthChipBase} ${selectedMonth === month ? monthChipActive : monthChipInactive}`}
                          >
                            {formatMonthLabel(month)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <label className="relative w-full min-w-[200px] max-w-xl">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" aria-hidden />
                      <input
                        type="search"
                        value={historySearch}
                        onChange={(event) => setHistorySearch(event.target.value)}
                        placeholder="Rechercher raider, cible, admin, note…"
                        className={`${controlClass} w-full pl-9`}
                        aria-label="Rechercher dans l’historique"
                      />
                    </label>
                  </div>
                ) : null}

                {/* Liste */}
                <div className={`${panelClass} p-4`}>
                  {loading ? (
                    <div className="space-y-3">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="animate-pulse rounded-xl border border-white/10 bg-black/20 p-4">
                          <div className="h-4 w-1/2 rounded bg-white/10" />
                          <div className="mt-3 h-3 w-full rounded bg-white/5" />
                          <div className="mt-2 h-3 w-4/5 rounded bg-white/5" />
                        </div>
                      ))}
                    </div>
                  ) : activeTab === "todo" ? (
                    <div
                      role="tabpanel"
                      id="panel-raids-todo"
                      aria-labelledby="tab-raids-todo"
                      className="space-y-4"
                    >
                      {sortedTodo.length === 0 ? (
                        <p className="py-6 text-center text-sm text-slate-400">
                          Aucun raid en attente. Tout est validé pour le run actuel.
                        </p>
                      ) : (
                        <>
                          <article className="rounded-xl border border-cyan-400/30 bg-cyan-500/[0.07] p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-cyan-100">
                                Commandes Discord (raiders uniquement, 20 pseudos max par commande)
                              </p>
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => void copyRaidCommands()}
                                  className={secondaryButtonClass}
                                >
                                  Générer + Copier
                                </button>
                                <button
                                  type="button"
                                  onClick={openBulkConfirmModal}
                                  disabled={bulkSaving || sortedTodo.length === 0}
                                  className={primaryButtonClass}
                                  aria-describedby="bulk-help"
                                >
                                  {bulkSaving ? "Validation globale…" : "Tout valider (+500)"}
                                </button>
                              </div>
                            </div>
                            <p id="bulk-help" className="sr-only">
                              Ouvre une confirmation avant d’attribuer {sortedTodo.length * 500} points en lot.
                            </p>
                            {copyFeedback ? (
                              <p role="status" aria-live="polite" className="mt-2 text-xs text-cyan-100">
                                {copyFeedback}
                              </p>
                            ) : null}
                            {raidCommands.length === 0 ? (
                              <p className="mt-2 text-xs text-slate-300">
                                Aucun pseudo Discord exploitable trouvé sur les raids en attente.
                              </p>
                            ) : (
                              <textarea
                                readOnly
                                value={raidCommands.join("\n")}
                                aria-label="Commandes Discord générées"
                                className="mt-3 min-h-[84px] w-full rounded-xl border border-cyan-400/35 bg-black/40 px-3 py-2 font-mono text-xs text-cyan-100"
                              />
                            )}
                          </article>

                          {filteredTodo.length === 0 ? (
                            <p className="py-6 text-center text-sm text-slate-400">
                              Aucun raid ne correspond aux filtres actuels.
                            </p>
                          ) : (
                            filteredTodo.map((item) => (
                              <article
                                key={item.id}
                                className="rounded-xl border border-white/10 bg-zinc-950/60 p-4 transition hover:border-violet-400/30"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <p className="text-base font-semibold text-white">
                                    Raider : {item.from_broadcaster_user_login} → Cible :{" "}
                                    {item.to_broadcaster_user_login}
                                  </p>
                                  <span className="inline-flex items-center rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-200">
                                    +500 à attribuer
                                  </span>
                                </div>
                                <p className="mt-1 text-sm text-slate-400">
                                  Raid : {new Date(item.event_at).toLocaleString("fr-FR")} · viewers :{" "}
                                  {item.viewers}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  Pseudo Discord raider :{" "}
                                  {item.raider_discord_username
                                    ? `@${String(item.raider_discord_username).replace(/^@/, "")}`
                                    : "introuvable"}
                                </p>
                                <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto]">
                                  <input
                                    value={noteByEventId[item.id] || ""}
                                    onChange={(event) =>
                                      setNoteByEventId((prev) => ({ ...prev, [item.id]: event.target.value }))
                                    }
                                    placeholder="Note optionnelle (ex. : points envoyés via bot manuellement)"
                                    className={controlClass}
                                    aria-label={`Note pour le raid de ${item.from_broadcaster_user_login}`}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => openAwardModal(item)}
                                    disabled={bulkSaving || savingId === item.id}
                                    className={primaryButtonClass}
                                  >
                                    {savingId === item.id ? "Validation…" : "Valider points +500"}
                                  </button>
                                </div>
                              </article>
                            ))
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    <div
                      role="tabpanel"
                      id="panel-raids-history"
                      aria-labelledby="tab-raids-history"
                      className="space-y-3"
                    >
                      {filteredHistory.length === 0 ? (
                        <p className="py-6 text-center text-sm text-slate-400">
                          Aucun point attribué pour ce mois.
                        </p>
                      ) : (
                        filteredHistory.map((item) => (
                          <article
                            key={item.id}
                            className="rounded-xl border border-white/10 bg-zinc-950/60 p-4 transition hover:border-emerald-400/25"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-base font-semibold text-white">
                                {item.raider_twitch_login} → {item.target_twitch_login}
                              </p>
                              <span className="inline-flex items-center rounded-full border border-emerald-400/45 bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-300">
                                {item.status === "awarded" ? "Points attribués" : item.status}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-slate-400">
                              Raid : {new Date(item.event_at).toLocaleString("fr-FR")} · Validation :{" "}
                              {new Date(item.awarded_at).toLocaleString("fr-FR")}
                            </p>
                            <p className="mt-1 text-sm text-slate-200">Points : +{item.points}</p>
                            <p className="mt-1 text-xs text-slate-400">
                              Validé par : {item.awarded_by_username} ({item.awarded_by_discord_id})
                            </p>
                            {item.note ? (
                              <p className="mt-1 text-xs text-slate-400">Note : {item.note}</p>
                            ) : null}
                          </article>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </section>
            ) : (
              <section
                role="tabpanel"
                id="panel-events"
                aria-labelledby="tab-events"
              >
                <EventDiscordPointsTab />
              </section>
            )}
          </div>

          <div className="min-w-0">
            <PointsDiscordSidePanel
              runId={runId}
              month={selectedMonth}
              lastRefreshAt={lastRefreshAt}
              source={sourceTab}
              pollingActive={pollingActive}
            />
          </div>
        </div>
      </div>

      <PointsDiscordAwardConfirmModal
        open={awardTarget !== null}
        target={awardTarget}
        loading={Boolean(awardTarget && savingId === awardTarget.eventId)}
        onCancel={() => !savingId && setAwardTarget(null)}
        onConfirm={() => void confirmAwardUnitary()}
      />

      <AdminConfirmModal
        open={bulkModalOpen}
        tone="warning"
        title={`Valider ${sortedTodo.length} raid${sortedTodo.length > 1 ? "s" : ""} ?`}
        description={
          <>
            Attribution de <strong className="text-amber-200">+500 points</strong> par ligne. Les lignes déjà
            traitées côté serveur seront ignorées. Les compteurs détaillés (ajoutés, déjà attribués, invalides,
            introuvables) seront affichés à la fin.
          </>
        }
        confirmLabel="Confirmer la validation groupée"
        loading={bulkSaving}
        onCancel={() => !bulkSaving && setBulkModalOpen(false)}
        onConfirm={() => void executeBulkAward()}
      />
    </div>
  );
}
