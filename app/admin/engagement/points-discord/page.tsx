"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  ChevronLeft,
  History,
  Shield,
  Sparkles,
  Trophy,
  Users,
  X,
  Zap,
} from "lucide-react";
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
const hubHeroClass =
  "relative overflow-hidden rounded-3xl border border-indigo-400/25 bg-[linear-gradient(155deg,rgba(99,102,241,0.14),rgba(14,15,23,0.92)_38%,rgba(11,13,20,0.97))] shadow-[0_24px_70px_rgba(2,6,23,0.55)] backdrop-blur-xl";
const subtleHubLinkClass =
  "inline-flex items-center gap-2 rounded-xl border border-indigo-300/25 bg-[linear-gradient(135deg,rgba(79,70,229,0.24),rgba(30,41,59,0.36))] px-3 py-2 text-sm font-medium text-indigo-100 transition hover:-translate-y-0.5 hover:border-indigo-200/45";
const modalBackdropClass =
  "fixed inset-0 z-[100] flex animate-fadeIn items-center justify-center bg-black/70 p-4 backdrop-blur-md";
const modalShellClass =
  "relative w-full max-w-md animate-fadeIn overflow-hidden rounded-3xl border border-amber-400/30 bg-[linear-gradient(165deg,rgba(245,158,11,0.12),rgba(14,15,23,0.96)_40%,rgba(11,13,20,0.99))] shadow-[0_28px_80px_rgba(2,6,23,0.75)]";

export default function AdminEngagementPointsDiscordPage() {
  const pathname = usePathname() || "";
  const bulkModalTitleId = useId();
  const hubLayout = pathname.startsWith("/admin/communaute");
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
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const historyLoadedAtRef = useRef<Record<string, number>>({});
  const availableMonths = useMemo(() => getLast12Months(), []);
  const backHref = hubLayout ? "/admin/communaute/engagement/historique-raids" : "/admin/raids";
  const hubEngagementHref = "/admin/communaute/engagement";

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
      setBulkModalOpen(false);
      await loadData({ includeTodo: true, includeHistory: activeTab === "history", month: selectedMonth });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur reseau.");
    } finally {
      setBulkSaving(false);
    }
  }

  useEffect(() => {
    if (!bulkModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !bulkSaving) setBulkModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [bulkModalOpen, bulkSaving]);

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

  const monthChipBase =
    "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60";
  const monthChipInactive = "border-[#3b4157] bg-[#13192b] text-slate-300 hover:border-indigo-300/35 hover:text-slate-100";
  const monthChipActive = "border-indigo-400/50 bg-indigo-500/20 text-indigo-50";

  return (
    <div className="min-h-screen bg-[#0b0f1a] p-4 text-white md:p-6 xl:p-8">
      <div className={hubLayout ? "mx-auto max-w-6xl space-y-6 pb-10" : "space-y-6"}>
        {hubLayout ? (
          <section className={`${hubHeroClass} p-6 md:p-8`}>
            <div className="pointer-events-none absolute -right-12 top-0 h-44 w-44 rounded-full bg-violet-500/20 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 left-0 h-36 w-36 rounded-full bg-cyan-500/15 blur-3xl" />
            <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 max-w-3xl">
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <Link
                    href={hubEngagementHref}
                    className="inline-flex items-center gap-2 text-indigo-100/90 transition hover:text-white"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Hub engagement
                  </Link>
                  <span className="text-slate-600">·</span>
                  <Link href={backHref} className="text-slate-400 transition hover:text-white">
                    Historique raids
                  </Link>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/35 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-100">
                    <Users className="h-3.5 w-3.5" />
                    Récompenses membres
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/35 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                    <Shield className="h-3.5 w-3.5" />
                    Staff — contrôle
                  </span>
                </div>
                <h1 className="mt-4 flex flex-wrap items-center gap-3 bg-gradient-to-r from-indigo-100 via-sky-200 to-cyan-200 bg-clip-text text-3xl font-bold text-transparent md:text-4xl">
                  <Zap className="h-9 w-9 shrink-0 text-amber-300/90 md:h-10 md:w-10" />
                  Points Discord
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                  Validez les raids EventSub (+500) et basculez sur les présences événements (+300) : commandes Discord, historique
                  mensuel et validation groupée dans une vue plus lisible.
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Auto-refresh 30s
                  {lastRefreshAt ? ` · MAJ ${lastRefreshAt.toLocaleTimeString("fr-FR")}` : ""}
                  {runId ? ` · run ${runId.slice(0, 8)}…` : " · aucun run actif"}
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <Link href="/admin/communaute/engagement/follow" className={subtleHubLinkClass}>
                    Follow
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href={backHref} className={subtleHubLinkClass}>
                    Historique raids
                    <History className="h-4 w-4" />
                  </Link>
                </div>
              </div>
              <div className="flex flex-col items-stretch gap-2 sm:items-end">
                <div className="flex flex-wrap justify-end gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/35 bg-emerald-500/12 px-3 py-1.5 text-xs font-semibold text-emerald-200">
                    <Trophy className="h-3.5 w-3.5" />
                    {completionRate}% traité
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-sky-400/35 bg-sky-500/12 px-3 py-1.5 text-xs font-semibold text-sky-200">
                    <Sparkles className="h-3.5 w-3.5" />
                    {history.length} validations
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => void loadData({ includeTodo: true, includeHistory: activeTab === "history", month: selectedMonth })}
                  disabled={loading}
                  className={`${secondaryButtonClass} w-full sm:w-auto`}
                >
                  Rafraîchir
                </button>
              </div>
            </div>
          </section>
        ) : (
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
        )}

      {(warning || error) && (
        <div className="space-y-2">
          {warning ? (
            <div className="rounded-xl border border-yellow-500/50 bg-yellow-950/40 px-4 py-3 text-sm text-yellow-100">{warning}</div>
          ) : null}
          {error ? (
            <div className="rounded-xl border border-red-500/50 bg-red-950/40 px-4 py-3 text-sm text-red-100">{error}</div>
          ) : null}
        </div>
      )}

      {sourceTab === "raids" && activeTab === "todo" && (bulkFeedback || missingRaiders.length > 0) ? (
        <div className={`${panelClass} space-y-3 p-4`}>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">À lire en priorité</p>
          {bulkFeedback ? (
            <p className="text-sm text-emerald-200">
              {bulkFeedback}
              {/\b0 ajouté/i.test(bulkFeedback) && /\bdéjà attribué/i.test(bulkFeedback) ? (
                <span className="mt-2 block text-xs text-slate-300">
                  Tout était déjà enregistré côté serveur : après rafraîchissement, la liste « À faire » doit se vider pour ces raids. Si ce
                  n’est pas le cas, signale-le (bug de synchro).
                </span>
              ) : null}
            </p>
          ) : null}
          {missingRaiders.length > 0 ? (
            <div className="rounded-xl border border-amber-400/45 bg-amber-950/35 px-3 py-2">
              <p className="text-sm font-semibold text-amber-100">
                Pseudo Discord manquant pour : {missingRaiders.join(", ")}
              </p>
              <p className="mt-1 text-xs text-amber-200/95">
                Ces comptes doivent être rapprochés côté fiche membre pour générer les commandes /raid et faciliter le suivi.
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

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
        <button
          type="button"
          onClick={() => {
            setActiveTab("todo");
          }}
          className={`${panelClass} p-4 text-left transition hover:border-amber-400/35 hover:shadow-[0_12px_32px_rgba(245,158,11,0.12)] ${
            activeTab === "todo" ? "ring-2 ring-amber-400/40 ring-offset-2 ring-offset-[#0b0f1a]" : ""
          }`}
        >
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Raids à traiter</p>
          <p className="text-2xl font-bold text-amber-300">{sortedTodo.length}</p>
          {hubLayout ? <p className="mt-1 text-[11px] text-slate-500">Ouvre l&apos;onglet À faire</p> : null}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("todo")}
          className={`${panelClass} p-4 text-left transition hover:border-indigo-400/35 hover:shadow-[0_12px_32px_rgba(99,102,241,0.12)]`}
        >
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Points potentiels</p>
          <p className="text-2xl font-bold text-indigo-200">{todoPointsTotal}</p>
          {hubLayout ? <p className="mt-1 text-[11px] text-slate-500">Si tout est validé</p> : null}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("todo")}
          className={`${panelClass} p-4 text-left transition hover:border-cyan-400/35`}
        >
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Raiders uniques</p>
          <p className="text-2xl font-bold text-cyan-200">{uniqueTodoRaiders}</p>
          {hubLayout ? <p className="mt-1 text-[11px] text-slate-500">File en cours</p> : null}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`${panelClass} p-4 text-left transition hover:border-emerald-400/35 hover:shadow-[0_12px_32px_rgba(16,185,129,0.12)] ${
            activeTab === "history" ? "ring-2 ring-emerald-400/40 ring-offset-2 ring-offset-[#0b0f1a]" : ""
          }`}
        >
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Points attribués (mois)</p>
          <p className="text-2xl font-bold text-emerald-300">{historyPointsTotal}</p>
          {hubLayout ? <p className="mt-1 text-[11px] text-slate-500">Ouvre l&apos;historique</p> : null}
        </button>
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
              <div className="flex w-full min-w-0 max-w-full flex-col gap-2 lg:max-w-none">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Mois</p>
                <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:thin]">
                  {availableMonths.map((month) => (
                    <button
                      key={month}
                      type="button"
                      onClick={() => setSelectedMonth(month)}
                      className={`${monthChipBase} ${selectedMonth === month ? monthChipActive : monthChipInactive}`}
                    >
                      {formatMonthLabel(month)}
                    </button>
                  ))}
                </div>
              </div>
              <input
                value={historySearch}
                onChange={(event) => setHistorySearch(event.target.value)}
                placeholder="Rechercher raider / cible / admin / note..."
                className={`${controlClass} w-full min-w-[200px] max-w-[420px]`}
              />
            </>
          ) : null}
        </div>
      </div>

      <div className={`${panelClass} p-6`}>
        {loading ? (
          hubLayout ? (
            <div className="space-y-4">
              <div className="animate-pulse rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-4">
                <div className="h-4 w-2/3 rounded bg-slate-700/40" />
                <div className="mt-3 h-16 w-full rounded-lg bg-slate-800/40" />
              </div>
              {[0, 1, 2].map((i) => (
                <div key={i} className="animate-pulse rounded-xl border border-[#343a52] bg-[#111725]/60 p-4">
                  <div className="h-4 w-1/2 rounded bg-slate-700/40" />
                  <div className="mt-3 h-3 w-full rounded bg-slate-800/40" />
                  <div className="mt-2 h-3 w-4/5 rounded bg-slate-800/40" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-300">Chargement des donnees...</p>
          )
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
                      onClick={openBulkConfirmModal}
                      disabled={bulkSaving || sortedTodo.length === 0}
                      className={primaryButtonClass}
                    >
                      {bulkSaving ? "Validation globale..." : "Tout valider (+500)"}
                    </button>
                  </div>
                </div>
                {copyFeedback ? (
                  <p
                    className={`mt-2 rounded-lg border px-3 py-2 text-xs ${
                      hubLayout
                        ? "animate-fadeIn border-cyan-400/35 bg-cyan-950/35 text-cyan-100"
                        : "text-cyan-100"
                    }`}
                  >
                    {copyFeedback}
                  </p>
                ) : null}
                {raidCommands.length === 0 ? (
                  <p className="mt-2 text-xs text-gray-300">Aucun pseudo Discord exploitable trouvé sur les raids en attente.</p>
                ) : (
                  <textarea
                    readOnly
                    value={raidCommands.join("\n")}
                    className="mt-3 min-h-[84px] w-full rounded-xl border border-cyan-400/35 bg-[#0e1720] px-3 py-2 font-mono text-xs text-cyan-100"
                  />
                )}
                <p className="mt-2 text-xs text-slate-500">
                  Retour validation groupée et pseudos manquants : voir l’encart <strong>À lire en priorité</strong> en haut de page.
                </p>
              </article>
              {sortedTodo.map((item) => (
                <article
                  key={item.id}
                  className={`rounded-xl border border-[#343a52] bg-[#111725]/85 p-4 transition hover:border-indigo-400/30 ${
                    hubLayout ? "border-l-4 border-l-amber-500/50 pl-3" : ""
                  }`}
                >
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
              <article
                key={item.id}
                className={`rounded-xl border border-[#2f3d3a] bg-[#111b19]/80 p-4 transition hover:border-emerald-400/25 ${
                  hubLayout ? "border-l-4 border-l-emerald-500/45 pl-3" : ""
                }`}
              >
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
        <div className={hubLayout ? "rounded-2xl border border-violet-500/15 bg-violet-950/5 p-1" : ""}>
          {hubLayout ? (
            <p className="px-3 pb-2 pt-3 text-center text-xs text-violet-200/90">
              Présences événements (+300) — commandes <strong className="text-violet-100">/event</strong> et même logique que les
              raids.
            </p>
          ) : null}
          <EventDiscordPointsTab />
        </div>
      )}

      {bulkModalOpen ? (
        <div
          className={modalBackdropClass}
          role="presentation"
          onMouseDown={(e) => {
            if (bulkSaving) return;
            if (e.target === e.currentTarget) setBulkModalOpen(false);
          }}
        >
          <div
            className={modalShellClass}
            role="dialog"
            aria-modal="true"
            aria-labelledby={bulkModalTitleId}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end border-b border-white/10 px-2 py-2">
              <button
                type="button"
                onClick={() => setBulkModalOpen(false)}
                disabled={bulkSaving}
                className="rounded-xl border border-white/10 bg-black/30 p-2 text-slate-300 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-6 pb-2 pt-2">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/40 bg-amber-500/15">
                <Zap className="h-7 w-7 text-amber-200" />
              </div>
              <h2 id={bulkModalTitleId} className="mt-4 text-center text-lg font-semibold text-white">
                Valider {sortedTodo.length} raid{sortedTodo.length > 1 ? "s" : ""} ?
              </h2>
              <p className="mt-2 text-center text-sm text-slate-400">
                Attribution de <strong className="text-amber-200">+500 points</strong> pour chaque ligne encore en attente. Les
                lignes déjà traitées côté serveur seront ignorées.
              </p>
              <p className="mt-3 text-center text-xs text-slate-500">Échap ou clic hors fenêtre pour annuler.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 border-t border-white/10 px-6 py-4">
              <button
                type="button"
                onClick={() => setBulkModalOpen(false)}
                disabled={bulkSaving}
                className="rounded-xl border border-slate-500/50 bg-slate-800/80 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => void executeBulkAward()}
                disabled={bulkSaving}
                className="rounded-xl border border-amber-500/45 bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-50"
              >
                {bulkSaving ? "Envoi…" : "Confirmer la validation groupée"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      </div>
    </div>
  );
}
