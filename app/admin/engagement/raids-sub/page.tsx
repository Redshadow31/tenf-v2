"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import AdminConfirmModal from "@/components/admin/AdminConfirmModal";
import RaidDailyChart, { type DailyRaidPoint } from "@/components/RaidDailyChart";
import { isoToParisYmd, parisMonthKeyFromDate, parisMonthKeyFromIso } from "@/lib/parisCalendar";

type SummaryData = {
  testEnabled: boolean;
  activeRun: { id: string; label: string } | null;
  stats: {
    eventsTotal: number;
    subscriptionsTotal: number;
    activeSubscriptions: number;
    failedSubscriptions: number;
    revokedSubscriptions: number;
  };
  eventStatus: {
    received: number;
    matched: number;
    ignored: number;
    duplicate: number;
    error: number;
  };
  watchlist: {
    eligibleMembers: number;
    liveNow: number;
    targetedByPolicy: number;
    localSubscriptionsActiveOrPending: number;
    remoteSubscriptionsEnabled: number;
  };
};

type ReviewEvent = {
  id: string;
  from_broadcaster_user_login: string | null;
  to_broadcaster_user_login: string | null;
  event_at: string | null;
  viewers?: number | null;
  raider_live_duration_minutes?: number | null;
  error_reason?: string | null;
  processing_status: "received" | "matched" | "ignored" | "duplicate" | "error";
};

type UpaRaidEventRow = {
  id: string;
  from_broadcaster_user_login?: string | null;
  from_broadcaster_user_name?: string | null;
  to_broadcaster_user_login?: string | null;
  to_broadcaster_user_name?: string | null;
  event_at?: string | null;
  viewers?: number | null;
  raider_live_duration_minutes?: number | null;
  processing_status?: string | null;
  error_reason?: string | null;
};

type UpaStreamerReport = {
  twitchLogin: string;
  displayName: string;
  upaCardActive: boolean;
  raidsReceivedCount: number;
  raidsSentCount: number;
  raidsReceived: UpaRaidEventRow[];
  raidsSent: UpaRaidEventRow[];
};

type UpaReportResponse = {
  period: { startDate: string; endDate: string; startIsoUtc: string; endIsoUtc: string };
  streamers: UpaStreamerReport[];
  meta: { eventsLoaded: number; streamerCardsConfigured: number };
};

function formatLiveDuration(minutes: number): string {
  const safeMinutes = Math.max(0, Math.floor(minutes));
  const hours = Math.floor(safeMinutes / 60);
  const remainingMinutes = safeMinutes % 60;
  if (hours <= 0) {
    return `${remainingMinutes} min`;
  }
  return `${hours}h${String(remainingMinutes).padStart(2, "0")}`;
}

const UPA_CSV_SEP = ";";

function upaCsvEscape(value: string | number | boolean | null | undefined): string {
  const raw = value === null || value === undefined ? "" : String(value);
  if (raw.includes(UPA_CSV_SEP) || raw.includes('"') || raw.includes("\n") || raw.includes("\r")) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

function stringifyUpaCsv(rows: (string | number | boolean | null | undefined)[][]): string {
  return `\ufeff${rows.map((row) => row.map(upaCsvEscape).join(UPA_CSV_SEP)).join("\r\n")}`;
}

function triggerTextDownload(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function buildUpaDetailCsvRows(report: UpaReportResponse): (string | number | boolean | null | undefined)[][] {
  const header = [
    "fiche_streamer_login",
    "fiche_streamer_display",
    "carte_upa_active",
    "sens_raid",
    "event_id",
    "from_login",
    "from_display",
    "to_login",
    "to_display",
    "event_at_iso",
    "viewers",
    "duree_live_raideur_minutes",
    "processing_status",
    "error_reason",
    "periode_upa_debut",
    "periode_upa_fin",
  ];
  const rows: (string | number | boolean | null | undefined)[][] = [header];
  for (const s of report.streamers) {
    const pushRow = (direction: "recu" | "fait", r: UpaRaidEventRow) => {
      rows.push([
        s.twitchLogin,
        s.displayName,
        s.upaCardActive,
        direction,
        r.id,
        r.from_broadcaster_user_login ?? "",
        r.from_broadcaster_user_name ?? "",
        r.to_broadcaster_user_login ?? "",
        r.to_broadcaster_user_name ?? "",
        r.event_at ?? "",
        r.viewers ?? "",
        r.raider_live_duration_minutes ?? "",
        r.processing_status ?? "",
        r.error_reason ?? "",
        report.period.startDate,
        report.period.endDate,
      ]);
    };
    for (const r of s.raidsReceived) pushRow("recu", r);
    for (const r of s.raidsSent) pushRow("fait", r);
  }
  return rows;
}

function isFetchAbortError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === "AbortError") return true;
  if (error instanceof Error && error.name === "AbortError") return true;
  return false;
}

function buildUpaSummaryCsvRows(report: UpaReportResponse): (string | number | boolean | null | undefined)[][] {
  const header = [
    "fiche_streamer_login",
    "fiche_streamer_display",
    "carte_upa_active",
    "nb_raids_recus",
    "nb_raids_faits",
    "periode_upa_debut",
    "periode_upa_fin",
  ];
  const rows: (string | number | boolean | null | undefined)[][] = [header];
  for (const s of report.streamers) {
    rows.push([
      s.twitchLogin,
      s.displayName,
      s.upaCardActive,
      s.raidsReceivedCount,
      s.raidsSentCount,
      report.period.startDate,
      report.period.endDate,
    ]);
  }
  return rows;
}

export default function AdminRaidsSubPage() {
  const pathname = usePathname() || "";
  const isCommunity = pathname.startsWith("/admin/communaute");
  const backHref = isCommunity ? "/admin/communaute/engagement" : "/admin/raids";
  const historyHref = isCommunity ? "/admin/communaute/engagement/historique-raids" : "/admin/engagement/historique-raids";
  const signalementsHref = isCommunity ? "/admin/communaute/engagement/signalements-raids" : "/admin/engagement/raids-a-valider";
  const pointsDiscordHref = isCommunity
    ? "/admin/communaute/engagement/points-discord"
    : "/admin/engagement/points-discord";
  const followHref = isCommunity ? "/admin/communaute/engagement/follow" : "/admin/engagement/follow";
  const fiabiliteHubHref = "/admin/communaute/engagement/raids-fiabilite";
  const eventSubHubHref = "/admin/engagement/raids-test";
  const reviewHref = "/admin/engagement/raids-sub/a-valider";
  const watchlistHref = "/admin/engagement/raids-test/watchlist";

  const [loading, setLoading] = useState(true);
  const [runningAction, setRunningAction] = useState<"" | "refresh" | "sync">("");
  const [activeTab, setActiveTab] = useState<"overview" | "stats" | "history" | "upa">("overview");
  const [statsSubTab, setStatsSubTab] = useState<"received" | "sent">("sent");
  const [statsPage, setStatsPage] = useState(1);
  const [historyStatusFilter, setHistoryStatusFilter] = useState<"all" | "received" | "matched" | "ignored" | "duplicate" | "error">("all");
  const [historySearch, setHistorySearch] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState(() => parisMonthKeyFromDate(new Date()));
  const statsMonthBootstrapped = useRef(false);
  const [selectedChartDay, setSelectedChartDay] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [syncMessage, setSyncMessage] = useState("");
  const [invalidateTarget, setInvalidateTarget] = useState<ReviewEvent | null>(null);
  const [invalidateReason, setInvalidateReason] = useState("");
  const [invalidateFieldError, setInvalidateFieldError] = useState<string | null>(null);
  const [invalidateModalLoading, setInvalidateModalLoading] = useState(false);
  const [invalidateSuccessMessage, setInvalidateSuccessMessage] = useState("");
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [reviewEvents, setReviewEvents] = useState<ReviewEvent[]>([]);
  const [lastRefreshAt, setLastRefreshAt] = useState<Date | null>(null);
  const [upaReport, setUpaReport] = useState<UpaReportResponse | null>(null);
  const [upaLoading, setUpaLoading] = useState(false);
  const [upaError, setUpaError] = useState("");
  const loadDataAbortRef = useRef<AbortController | null>(null);
  const pollIntervalRef = useRef<number | null>(null);
  const [pollingPausedByVisibility, setPollingPausedByVisibility] = useState(false);

  const tabIdOverview = useId();
  const tabIdStats = useId();
  const tabIdHistory = useId();
  const tabIdUpa = useId();
  const tabpanelMainId = useId();
  const mainTabpanelLabelledby =
    activeTab === "overview"
      ? tabIdOverview
      : activeTab === "stats"
        ? tabIdStats
        : activeTab === "history"
          ? tabIdHistory
          : tabIdUpa;

  const loadUpaReport = useCallback(async () => {
    setUpaLoading(true);
    setUpaError("");
    try {
      const response = await fetch("/api/admin/engagement/raids-sub/upa-report", { cache: "no-store" });
      const body = (await response.json()) as UpaReportResponse & { error?: string };
      if (!response.ok) {
        throw new Error(body.error || "Impossible de charger le rapport UPA.");
      }
      setUpaReport(body);
    } catch (e) {
      setUpaError(e instanceof Error ? e.message : "Erreur reseau.");
      setUpaReport(null);
    } finally {
      setUpaLoading(false);
    }
  }, []);

  const loadData = useCallback(async (options?: { silent?: boolean }) => {
    const silent = Boolean(options?.silent);
    loadDataAbortRef.current?.abort();
    const ac = new AbortController();
    loadDataAbortRef.current = ac;
    const { signal } = ac;
    try {
      if (!silent) {
        setLoading(true);
      }
      if (!silent) {
        setError("");
      }
      const [summaryResponse, reviewResponse] = await Promise.all([
        fetch("/api/admin/engagement/raids-sub/summary", { signal }),
        fetch("/api/admin/engagement/raids-sub/review?status=all&limit=500", { signal }),
      ]);
      if (signal.aborted) return;
      const [summaryBody, reviewBody] = await Promise.all([summaryResponse.json(), reviewResponse.json()]);
      if (signal.aborted) return;
      if (!summaryResponse.ok) throw new Error(summaryBody.error || "Impossible de charger le suivi raids-sub.");
      setSummary(summaryBody);
      if (reviewResponse.ok) {
        setReviewEvents((reviewBody.events || []) as ReviewEvent[]);
      }
      setLastRefreshAt(new Date());
    } catch (e) {
      if (signal.aborted || isFetchAbortError(e)) return;
      if (!silent) {
        setError(e instanceof Error ? e.message : "Erreur reseau.");
      }
    } finally {
      if (!silent && loadDataAbortRef.current === ac) {
        setLoading(false);
      }
    }
  }, []);

  async function runSyncNow() {
    setRunningAction("sync");
    setSyncMessage("");
    setError("");
    try {
      const response = await fetch("/api/admin/engagement/raids-test/sync", {
        method: "POST",
      });
      const body = (await response.json()) as {
        error?: string;
        created?: number;
        revoked?: number;
        retained?: number;
        liveMembers?: number;
        eligibleMembers?: number;
      };
      if (!response.ok) throw new Error(body.error || "Impossible de lancer la sync EventSub.");
      setSyncMessage(
        `Sync OK - created: ${body.created || 0}, retained: ${body.retained || 0}, revoked: ${body.revoked || 0}, live: ${
          body.liveMembers || 0
        }/${body.eligibleMembers || 0}`
      );
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur reseau.");
    } finally {
      setRunningAction("");
    }
  }

  function openInvalidateModal(item: ReviewEvent) {
    setInvalidateSuccessMessage("");
    setInvalidateFieldError(null);
    setInvalidateReason("");
    setInvalidateTarget(item);
  }

  function resetInvalidateModal() {
    setInvalidateTarget(null);
    setInvalidateReason("");
    setInvalidateFieldError(null);
  }

  function onCancelInvalidateModal() {
    if (invalidateModalLoading) return;
    resetInvalidateModal();
  }

  async function submitInvalidateRaid() {
    const item = invalidateTarget;
    if (!item || invalidateModalLoading) return;
    const trimmed = invalidateReason.trim();
    if (trimmed.length < 3) {
      setInvalidateFieldError("La raison doit contenir au moins 3 caracteres (exigence API).");
      return;
    }
    setInvalidateFieldError(null);
    setInvalidateModalLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/engagement/raids-sub/review/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          processingStatus: "ignored",
          invalidateAfterValidation: true,
          staffComment: trimmed,
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || "Impossible d'invalider ce raid.");
      }
      setReviewEvents((previous) => previous.map((row) => (row.id === item.id ? (body.event as ReviewEvent) : row)));
      setInvalidateSuccessMessage("Raid invalide : le statut a ete mis a jour avec votre raison.");
      resetInvalidateModal();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur reseau.");
    } finally {
      setInvalidateModalLoading(false);
    }
  }

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current !== null) {
      window.clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    pollIntervalRef.current = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      void loadData({ silent: true });
    }, 30_000);
  }, [loadData, stopPolling]);

  useEffect(() => {
    const syncPausedFromDocument = () => {
      setPollingPausedByVisibility(document.visibilityState === "hidden");
    };
    syncPausedFromDocument();

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        stopPolling();
        setPollingPausedByVisibility(true);
        return;
      }
      setPollingPausedByVisibility(false);
      void loadData({ silent: true });
      startPolling();
    };

    document.addEventListener("visibilitychange", onVisibility);

    void loadData();

    if (document.visibilityState === "visible") {
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      stopPolling();
      loadDataAbortRef.current?.abort();
    };
  }, [loadData, startPolling, stopPolling]);

  useEffect(() => {
    if (activeTab === "upa") {
      void loadUpaReport();
    }
  }, [activeTab, loadUpaReport]);

  useEffect(() => {
    setStatsPage(1);
  }, [activeTab, statsSubTab]);

  useEffect(() => {
    setHistoryPage(1);
  }, [activeTab, historyStatusFilter, historySearch]);

  const nonDuplicateEvents = useMemo(
    () => reviewEvents.filter((event) => event.processing_status !== "duplicate" && event.processing_status !== "error"),
    [reviewEvents]
  );

  const latestEventMonthKey = useMemo(() => {
    let best: string | null = null;
    let bestTime = -Infinity;
    for (const event of nonDuplicateEvents) {
      const value = String(event.event_at || "");
      if (!value) continue;
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) continue;
      const t = date.getTime();
      if (t > bestTime) {
        bestTime = t;
        const key = parisMonthKeyFromIso(value);
        if (key) best = key;
      }
    }
    return best;
  }, [nonDuplicateEvents]);

  useEffect(() => {
    if (statsMonthBootstrapped.current || loading) return;
    const currentKey = parisMonthKeyFromDate(new Date());
    const currentMonthHasData = nonDuplicateEvents.some((event) => {
      const value = String(event.event_at || "");
      if (!value) return false;
      return parisMonthKeyFromIso(value) === currentKey;
    });
    if (currentMonthHasData) {
      statsMonthBootstrapped.current = true;
      return;
    }
    if (latestEventMonthKey) {
      setSelectedMonth(latestEventMonthKey);
      setSelectedChartDay(null);
    }
    statsMonthBootstrapped.current = true;
  }, [loading, latestEventMonthKey, nonDuplicateEvents]);

  const sentRanking = useMemo(() => {
    const map = new Map<string, number>();
    for (const event of nonDuplicateEvents) {
      const login = String(event.from_broadcaster_user_login || "").toLowerCase();
      if (!login) continue;
      map.set(login, (map.get(login) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([login, total]) => ({ login, total }))
      .sort((a, b) => b.total - a.total);
  }, [nonDuplicateEvents]);

  const receivedRanking = useMemo(() => {
    const map = new Map<string, number>();
    for (const event of nonDuplicateEvents) {
      const login = String(event.to_broadcaster_user_login || "").toLowerCase();
      if (!login) continue;
      map.set(login, (map.get(login) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([login, total]) => ({ login, total }))
      .sort((a, b) => b.total - a.total);
  }, [nonDuplicateEvents]);

  const activeStatsRows = statsSubTab === "received" ? receivedRanking : sentRanking;
  const statsPerPage = 12;
  const statsTotalPages = Math.max(1, Math.ceil(activeStatsRows.length / statsPerPage));
  const pagedStatsRows = activeStatsRows.slice((statsPage - 1) * statsPerPage, statsPage * statsPerPage);

  const filteredHistoryRows = useMemo(() => {
    const query = historySearch.trim().toLowerCase();
    return reviewEvents
      .filter((event) => (historyStatusFilter === "all" ? true : event.processing_status === historyStatusFilter))
      .filter((event) => {
        if (!query) return true;
        const from = String(event.from_broadcaster_user_login || "").toLowerCase();
        const to = String(event.to_broadcaster_user_login || "").toLowerCase();
        const reason = String(event.error_reason || "").toLowerCase();
        return from.includes(query) || to.includes(query) || reason.includes(query);
      })
      .sort((a, b) => new Date(String(b.event_at || 0)).getTime() - new Date(String(a.event_at || 0)).getTime());
  }, [reviewEvents, historyStatusFilter, historySearch]);

  const historyPerPage = 12;
  const historyTotalPages = Math.max(1, Math.ceil(filteredHistoryRows.length / historyPerPage));
  const pagedHistoryRows = filteredHistoryRows.slice((historyPage - 1) * historyPerPage, historyPage * historyPerPage);

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    set.add(parisMonthKeyFromDate(new Date()));
    for (const event of nonDuplicateEvents) {
      const value = String(event.event_at || "");
      if (!value) continue;
      const key = parisMonthKeyFromIso(value);
      if (key) set.add(key);
    }
    return Array.from(set).sort((a, b) => (a < b ? 1 : -1));
  }, [nonDuplicateEvents]);

  const dailyChartData = useMemo((): DailyRaidPoint[] => {
    if (!/^\d{4}-\d{2}$/.test(selectedMonth)) return [];
    const [yearStr, monthStr] = selectedMonth.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const byDay = new Map<number, DailyRaidPoint>();
    for (let day = 1; day <= daysInMonth; day++) {
      byDay.set(day, { day, raidsFaits: 0, raidsRecus: 0 });
    }
    for (const event of nonDuplicateEvents) {
      const value = String(event.event_at || "");
      if (!value) continue;
      const cal = isoToParisYmd(value);
      if (!cal || cal.y !== year || cal.m !== month) continue;
      const point = byDay.get(cal.d);
      if (!point) continue;
      if (event.from_broadcaster_user_login) {
        point.raidsFaits += 1;
      }
      if (event.to_broadcaster_user_login) {
        point.raidsRecus += 1;
      }
    }
    return Array.from(byDay.values());
  }, [nonDuplicateEvents, selectedMonth]);

  const previousDailyChartData = useMemo((): DailyRaidPoint[] => {
    if (!/^\d{4}-\d{2}$/.test(selectedMonth)) return [];
    const [yearStr, monthStr] = selectedMonth.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);
    let prevYear = year;
    let prevMonthNum = month - 1;
    if (prevMonthNum < 1) {
      prevMonthNum = 12;
      prevYear -= 1;
    }
    const daysInMonth = new Date(Date.UTC(prevYear, prevMonthNum, 0)).getUTCDate();
    const byDay = new Map<number, DailyRaidPoint>();
    for (let day = 1; day <= daysInMonth; day++) {
      byDay.set(day, { day, raidsFaits: 0, raidsRecus: 0 });
    }
    for (const event of nonDuplicateEvents) {
      const value = String(event.event_at || "");
      if (!value) continue;
      const cal = isoToParisYmd(value);
      if (!cal || cal.y !== prevYear || cal.m !== prevMonthNum) continue;
      const point = byDay.get(cal.d);
      if (!point) continue;
      if (event.from_broadcaster_user_login) {
        point.raidsFaits += 1;
      }
      if (event.to_broadcaster_user_login) {
        point.raidsRecus += 1;
      }
    }
    return Array.from(byDay.values());
  }, [nonDuplicateEvents, selectedMonth]);

  const selectedDaySummary = useMemo(() => {
    if (!selectedChartDay || !/^\d{4}-\d{2}$/.test(selectedMonth)) return null;
    const point = dailyChartData.find((item) => item.day === selectedChartDay);
    if (!point) return null;
    const [ys, ms] = selectedMonth.split("-");
    const y = Number(ys);
    const mo = Number(ms);
    let eventCount = 0;
    for (const event of nonDuplicateEvents) {
      const cal = isoToParisYmd(String(event.event_at || ""));
      if (!cal || cal.y !== y || cal.m !== mo || cal.d !== selectedChartDay) continue;
      eventCount++;
    }
    return {
      sent: point.raidsFaits,
      received: point.raidsRecus,
      eventCount,
    };
  }, [dailyChartData, selectedChartDay, selectedMonth, nonDuplicateEvents]);

  const cockpitPanelClass =
    "rounded-2xl border border-white/[0.08] bg-zinc-950/55 shadow-sm shadow-black/20";
  const ignoredAndErrors =
    (summary?.eventStatus.ignored ?? 0) + (summary?.eventStatus.error ?? 0);

  return (
    <div className={`text-white ${isCommunity ? "pb-2" : "min-h-screen bg-[#07080f]"}`}>
      <div className={`mx-auto w-full max-w-[1480px] px-3 md:px-6 ${isCommunity ? "" : "py-6 md:py-8"}`}>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start xl:gap-8">
          <div className="min-w-0 space-y-6">
            <header className={`${cockpitPanelClass} p-4 sm:p-5`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Link
                  href={backHref}
                  className="inline-flex text-xs font-medium text-zinc-400 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                >
                  {isCommunity ? "← Hub engagement" : "← Retour au suivi des raids"}
                </Link>
                {isCommunity ? (
                  <Link
                    href={fiabiliteHubHref}
                    className="text-xs font-medium text-violet-300/90 underline-offset-2 hover:text-violet-100 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/45 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                  >
                    Accueil pilier Raids fiabilité
                  </Link>
                ) : null}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href={historyHref}
                  className="inline-flex rounded-lg border border-violet-500/25 bg-violet-950/25 px-2.5 py-1.5 text-xs font-medium text-violet-100 transition hover:border-violet-400/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/45"
                >
                  Historique
                </Link>
                {isCommunity ? (
                  <Link
                    href={signalementsHref}
                    className="inline-flex rounded-lg border border-amber-500/25 bg-amber-950/20 px-2.5 py-1.5 text-xs font-medium text-amber-100 transition hover:border-amber-400/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/45"
                  >
                    Signalements
                  </Link>
                ) : (
                  <Link
                    href={eventSubHubHref}
                    className="inline-flex rounded-lg border border-sky-500/25 bg-sky-950/25 px-2.5 py-1.5 text-xs font-medium text-sky-100 transition hover:border-sky-400/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/45"
                  >
                    Hub EventSub test
                  </Link>
                )}
                <Link
                  href={pointsDiscordHref}
                  className="inline-flex rounded-lg border border-emerald-500/25 bg-emerald-950/25 px-2.5 py-1.5 text-xs font-medium text-emerald-100 transition hover:border-emerald-400/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/45"
                >
                  Points Discord
                </Link>
                {isCommunity ? (
                  <Link
                    href={followHref}
                    className="inline-flex rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/45"
                  >
                    Follow
                  </Link>
                ) : null}
              </div>
              <h1 className="mt-4 text-[clamp(1.35rem,1.1rem+0.9vw,1.85rem)] font-semibold tracking-tight text-white">
                Raids EventSub
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-400">
                Suivre les raids détectés automatiquement par Twitch et repérer les écarts techniques.
              </p>
              <p className="mt-3 max-w-3xl rounded-lg border border-white/[0.06] bg-black/25 px-3 py-2.5 text-xs leading-relaxed text-zinc-500 sm:text-sm">
                EventSub est la source automatique. Elle aide à voir ce que Twitch a réellement remonté avant de comparer avec les
                signalements membres.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div
                  role="status"
                  aria-live="polite"
                  className="min-w-0 flex-1 basis-[14rem] text-xs leading-relaxed text-zinc-500"
                >
                  <span className="font-medium text-zinc-300">
                    {pollingPausedByVisibility ? "Auto-actualisation en pause" : "Auto-actualisation active"}
                  </span>
                  <span className="mx-1.5 text-zinc-700" aria-hidden>
                    ·
                  </span>
                  <span>Intervalle 30 s</span>
                  {lastRefreshAt ? (
                    <>
                      <span className="mx-1.5 text-zinc-700" aria-hidden>
                        ·
                      </span>
                      <span>Dernière mise à jour {lastRefreshAt.toLocaleString("fr-FR")}</span>
                    </>
                  ) : null}
                </div>
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRunningAction("refresh");
                      void loadData().finally(() => setRunningAction(""));
                    }}
                    disabled={loading || runningAction !== ""}
                    aria-label="Rafraîchir les données raids EventSub"
                    className="min-h-[2.5rem] rounded-xl border border-white/15 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-zinc-100 transition hover:bg-white/[0.1] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 sm:text-sm"
                  >
                    {runningAction === "refresh" || loading ? "Rafraîchissement…" : "Rafraîchir"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void runSyncNow()}
                    disabled={runningAction !== "" || !summary?.activeRun}
                    aria-label="Lancer une synchronisation EventSub maintenant"
                    className="min-h-[2.5rem] rounded-xl border border-sky-500/35 bg-sky-950/35 px-3 py-2 text-xs font-semibold text-sky-100 transition hover:bg-sky-900/45 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 sm:text-sm"
                  >
                    {runningAction === "sync" ? "Synchronisation…" : "Sync EventSub"}
                  </button>
                </div>
              </div>
            </header>

            <section className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4" aria-label="Indicateurs EventSub">
              <article className={`${cockpitPanelClass} min-w-0 bg-zinc-950/25 p-4 ring-1 ring-inset ring-white/[0.04]`}>
                <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Évènements détectés</p>
                <p className="mt-1 text-[clamp(1.5rem,1.2rem+1vw,2rem)] font-semibold tabular-nums text-white">
                  {summary?.stats.eventsTotal ?? 0}
                </p>
                <p className="mt-1 text-[11px] leading-snug text-zinc-600">Volume brut remonté par Twitch (EventSub).</p>
              </article>
              <article className={`${cockpitPanelClass} min-w-0 bg-zinc-950/25 p-4 ring-1 ring-inset ring-white/[0.04]`}>
                <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Raids reliés</p>
                <p className="mt-1 text-[clamp(1.5rem,1.2rem+1vw,2rem)] font-semibold tabular-nums text-emerald-300/95">
                  {summary?.eventStatus.matched ?? 0}
                </p>
                <p className="mt-1 text-[11px] leading-snug text-zinc-600">Évènements rattachés proprement au suivi.</p>
              </article>
              <article className={`${cockpitPanelClass} min-w-0 bg-zinc-950/25 p-4 ring-1 ring-inset ring-white/[0.04]`}>
                <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Ignorés / invalidés</p>
                <p className="mt-1 text-[clamp(1.5rem,1.2rem+1vw,2rem)] font-semibold tabular-nums text-amber-200/95">
                  {ignoredAndErrors}
                </p>
                <p className="mt-1 text-[11px] leading-snug text-zinc-600">Ignorés + erreurs — à regarder en priorité.</p>
              </article>
              <article className={`${cockpitPanelClass} min-w-0 bg-zinc-950/25 p-4 ring-1 ring-inset ring-white/[0.04]`}>
                <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Actualisation affichée</p>
                <p className="mt-1 text-[clamp(0.95rem,0.85rem+0.35vw,1.05rem)] font-semibold leading-snug text-zinc-200">
                  {lastRefreshAt ? lastRefreshAt.toLocaleString("fr-FR") : "—"}
                </p>
                <p className="mt-1 text-[11px] leading-snug text-zinc-600">
                  Dernier chargement de ce cockpit. L’onglet UPA se met à jour sur action.
                </p>
              </article>
            </section>

            <div className={`${cockpitPanelClass} min-w-0 p-3 sm:p-4`}>
              <div className="flex min-w-0 flex-wrap gap-2" role="tablist" aria-label="Sections du suivi raids EventSub">
                <button
                  type="button"
                  role="tab"
                  id={tabIdOverview}
                  aria-selected={activeTab === "overview"}
                  aria-controls={tabpanelMainId}
                  tabIndex={activeTab === "overview" ? 0 : -1}
                  onClick={() => setActiveTab("overview")}
                  className={`min-h-[2.5rem] rounded-xl border px-3 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 sm:text-sm ${
                    activeTab === "overview"
                      ? "border-violet-400/40 bg-violet-500/10 text-violet-100"
                      : "border-white/[0.08] bg-white/[0.02] text-zinc-400 hover:border-white/15 hover:bg-white/[0.04] hover:text-zinc-200"
                  }`}
                >
                  Tableau de bord
                </button>
                <button
                  type="button"
                  role="tab"
                  id={tabIdStats}
                  aria-selected={activeTab === "stats"}
                  aria-controls={tabpanelMainId}
                  tabIndex={activeTab === "stats" ? 0 : -1}
                  onClick={() => setActiveTab("stats")}
                  className={`min-h-[2.5rem] rounded-xl border px-3 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 sm:text-sm ${
                    activeTab === "stats"
                      ? "border-violet-400/40 bg-violet-500/10 text-violet-100"
                      : "border-white/[0.08] bg-white/[0.02] text-zinc-400 hover:border-white/15 hover:bg-white/[0.04] hover:text-zinc-200"
                  }`}
                >
                  Stats de raids
                </button>
                <button
                  type="button"
                  role="tab"
                  id={tabIdHistory}
                  aria-selected={activeTab === "history"}
                  aria-controls={tabpanelMainId}
                  tabIndex={activeTab === "history" ? 0 : -1}
                  onClick={() => setActiveTab("history")}
                  className={`min-h-[2.5rem] rounded-xl border px-3 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 sm:text-sm ${
                    activeTab === "history"
                      ? "border-violet-400/40 bg-violet-500/10 text-violet-100"
                      : "border-white/[0.08] bg-white/[0.02] text-zinc-400 hover:border-white/15 hover:bg-white/[0.04] hover:text-zinc-200"
                  }`}
                >
                  Historique des raids
                </button>
                <button
                  type="button"
                  role="tab"
                  id={tabIdUpa}
                  aria-selected={activeTab === "upa"}
                  aria-controls={tabpanelMainId}
                  tabIndex={activeTab === "upa" ? 0 : -1}
                  onClick={() => setActiveTab("upa")}
                  className={`min-h-[2.5rem] rounded-xl border px-3 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/45 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 sm:text-sm ${
                    activeTab === "upa"
                      ? "border-amber-400/35 bg-amber-500/10 text-amber-50"
                      : "border-white/[0.08] bg-white/[0.02] text-zinc-400 hover:border-amber-500/20 hover:bg-amber-500/5 hover:text-zinc-200"
                  }`}
                >
                  UPA (Lives caritatifs)
                </button>
              </div>
              <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2 border-t border-white/[0.06] pt-3" aria-label="Raccourcis vers les files">
                <Link
                  href={reviewHref}
                  className="min-h-[2.25rem] inline-flex items-center rounded-lg border border-amber-500/30 bg-amber-950/20 px-3 py-1.5 text-xs font-semibold text-amber-100 transition hover:border-amber-400/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 sm:text-sm"
                  aria-label="Ouvrir la file raids-sub à valider"
                >
                  File à valider
                </Link>
                <Link
                  href={watchlistHref}
                  className="min-h-[2.25rem] inline-flex items-center rounded-lg border border-emerald-500/30 bg-emerald-950/20 px-3 py-1.5 text-xs font-semibold text-emerald-100 transition hover:border-emerald-400/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 sm:text-sm"
                  aria-label="Ouvrir la watchlist live versus surveillés"
                >
                  Watchlist live
                </Link>
              </div>
            </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-red-500/40 bg-red-900/20 px-4 py-3 text-sm text-red-200" role="alert">
          {error}
        </div>
      ) : null}

      {invalidateSuccessMessage ? (
        <div
          className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-900/20 px-4 py-3 text-sm text-emerald-200"
          role="status"
          aria-live="polite"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <span>{invalidateSuccessMessage}</span>
            <button
              type="button"
              onClick={() => setInvalidateSuccessMessage("")}
              className="shrink-0 rounded border border-white/15 px-2 py-0.5 text-xs text-white/80 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50"
            >
              Fermer
            </button>
          </div>
        </div>
      ) : null}

      {syncMessage ? (
        <div
          className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-900/20 px-4 py-3 text-sm text-emerald-200"
          role="status"
          aria-live="polite"
        >
          {syncMessage}
        </div>
      ) : null}

      {!summary?.testEnabled ? (
        <div
          className="mb-4 rounded-lg border border-amber-500/40 bg-amber-900/20 px-4 py-3 text-sm text-amber-200"
          role="status"
          aria-live="polite"
        >
          RAID_EVENTSUB_TEST_ENABLED est desactive.
        </div>
      ) : null}

      <div
        id={tabpanelMainId}
        role="tabpanel"
        aria-labelledby={mainTabpanelLabelledby}
        className="rounded-2xl border border-white/[0.08] bg-zinc-950/40 p-4 sm:p-6"
      >
        {loading ? <p className="mb-3 text-sm text-gray-300" role="status" aria-live="polite">Chargement des données...</p> : null}

        {activeTab === "overview" ? (
          <>
            <div className="space-y-4">
              <section className="rounded-xl border border-white/[0.06] bg-zinc-900/35 p-4 sm:p-5 ring-1 ring-inset ring-white/[0.03]">
                <p className="mb-3 text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">Vue d’ensemble</p>
                <div className="grid min-w-0 grid-cols-2 gap-3 sm:gap-4 md:grid-cols-5">
                  <Card label="Évènements (total)" value={summary?.stats.eventsTotal ?? 0} />
                  <Card label="Abonnements (total)" value={summary?.stats.subscriptionsTotal ?? 0} />
                  <Card label="Abonnements actifs" value={summary?.stats.activeSubscriptions ?? 0} />
                  <Card label="Abonnements en échec" value={summary?.stats.failedSubscriptions ?? 0} />
                  <Card label="Abonnements révoqués" value={summary?.stats.revokedSubscriptions ?? 0} />
                </div>
              </section>

              <section className="rounded-xl border border-white/[0.06] bg-zinc-900/35 p-4 sm:p-5 ring-1 ring-inset ring-white/[0.03]">
                <p className="mb-3 text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">Watchlist et couverture</p>
                <div className="grid min-w-0 grid-cols-2 gap-3 sm:gap-4 md:grid-cols-5">
                  <Card label="Membres éligibles" value={summary?.watchlist.eligibleMembers ?? 0} />
                  <Card label="En live maintenant" value={summary?.watchlist.liveNow ?? 0} />
                  <Card label="À surveiller" value={summary?.watchlist.targetedByPolicy ?? 0} />
                  <Card label="Subs locales actives / en attente" value={summary?.watchlist.localSubscriptionsActiveOrPending ?? 0} />
                  <Card label="Subs distantes actives" value={summary?.watchlist.remoteSubscriptionsEnabled ?? 0} />
                </div>
              </section>

              <section className="rounded-xl border border-white/[0.06] bg-zinc-900/35 p-4 sm:p-5 ring-1 ring-inset ring-white/[0.03]">
                <p className="mb-3 text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">Statut des évènements</p>
                <div className="grid min-w-0 grid-cols-2 gap-3 sm:gap-4 md:grid-cols-5">
                  <Mini label="Reçus" value={summary?.eventStatus.received ?? 0} tone="neutral" />
                  <Mini label="Reliés" value={summary?.eventStatus.matched ?? 0} tone="success" />
                  <Mini label="Ignorés" value={summary?.eventStatus.ignored ?? 0} tone="warning" />
                  <Mini label="Doublons" value={summary?.eventStatus.duplicate ?? 0} tone="info" />
                  <Mini label="Erreurs" value={summary?.eventStatus.error ?? 0} tone="danger" />
                </div>
              </section>
            </div>

            <div className="mt-6 grid min-w-0 gap-3 md:grid-cols-3">
              <Link
                href={reviewHref}
                className="min-w-0 rounded-xl border border-indigo-400/20 bg-indigo-500/5 p-4 transition hover:border-indigo-300/35 hover:bg-indigo-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
              >
                <p className="text-base font-semibold text-zinc-100 sm:text-lg">File raids à valider</p>
                <p className="mt-1 text-sm leading-snug text-zinc-500">Validation manuelle et passage en « relié » des cas bloqués.</p>
              </Link>
              <Link
                href={`${reviewHref}?status=ignored`}
                className="min-w-0 rounded-xl border border-amber-400/20 bg-amber-500/5 p-4 transition hover:border-amber-300/35 hover:bg-amber-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
              >
                <p className="text-base font-semibold text-amber-200 sm:text-lg">Ignorés en détail</p>
                <p className="mt-1 text-sm leading-snug text-zinc-500">Ouvre directement les évènements ignorés pour correction rapide.</p>
              </Link>
              <Link
                href={watchlistHref}
                className="min-w-0 rounded-xl border border-emerald-400/20 bg-emerald-500/5 p-4 transition hover:border-emerald-300/35 hover:bg-emerald-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
              >
                <p className="text-base font-semibold text-emerald-100 sm:text-lg">Watchlist live</p>
                <p className="mt-1 text-sm leading-snug text-zinc-500">Voir qui est en live et qui est réellement sous surveillance.</p>
              </Link>
            </div>
          </>
        ) : activeTab === "stats" ? (
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-400">Mois:</span>
              <select
                value={selectedMonth}
                onChange={(event) => {
                  setSelectedMonth(event.target.value);
                  setSelectedChartDay(null);
                }}
                className="rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: "rgba(255,255,255,0.2)", backgroundColor: "#0e0e10", color: "white" }}
              >
                {availableMonths.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
              <p className="w-full text-xs text-slate-400 md:w-auto md:flex-1 md:min-w-[280px]">
                Jours regroupés en{" "}
                <span className="text-slate-200">Europe/Paris</span>. Chaque événement raid (A→B) compte une fois en « faits »
                (côté raideur) et une fois en « reçus » (côté cible) : ne pas additionner les deux courbes pour obtenir un nombre
                d&apos;événements.
              </p>
            </div>
            <RaidDailyChart month={selectedMonth} data={dailyChartData} previousData={previousDailyChartData} onDaySelect={setSelectedChartDay} />
            {selectedDaySummary ? (
              <div className="mb-4 rounded-lg border border-gray-700 bg-[#101014] p-3">
                <p className="text-sm font-semibold text-white">Détail du jour {selectedChartDay} (Paris)</p>
                <p className="mt-1 text-xs text-emerald-200/90">
                  {selectedDaySummary.eventCount} événement(s) raid distinct(s) ce jour-là (tous statuts confondus dans ce run).
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {selectedDaySummary.sent} lecture(s) « faits » et {selectedDaySummary.received} lecture(s) « reçus » (souvent
                  égales si chaque ligne a raideur et cible).
                </p>
              </div>
            ) : null}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Afficher les stats par sens de raid">
                <button
                  type="button"
                  aria-pressed={statsSubTab === "received"}
                  onClick={() => setStatsSubTab("received")}
                  className="rounded-md border px-3 py-1.5 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1d]"
                  style={{
                    borderColor: statsSubTab === "received" ? "rgba(96,165,250,0.55)" : "rgba(255,255,255,0.18)",
                    color: statsSubTab === "received" ? "#93c5fd" : "#cbd5e1",
                  }}
                >
                  Raids reçus
                </button>
                <button
                  type="button"
                  aria-pressed={statsSubTab === "sent"}
                  onClick={() => setStatsSubTab("sent")}
                  className="rounded-md border px-3 py-1.5 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1d]"
                  style={{
                    borderColor: statsSubTab === "sent" ? "rgba(167,139,250,0.55)" : "rgba(255,255,255,0.18)",
                    color: statsSubTab === "sent" ? "#c4b5fd" : "#cbd5e1",
                  }}
                >
                  Raids faits
                </button>
              </div>
              <span className="text-xs text-gray-400" role="status" aria-live="polite">
                {activeStatsRows.length} streamer(s)
              </span>
            </div>

            {activeStatsRows.length === 0 ? (
              <p className="text-sm text-gray-300">Aucune donnée exploitable pour les stats sur ce run.</p>
            ) : (
              <div className="space-y-2">
                {pagedStatsRows.map((item, index) => (
                  <div
                    key={`${statsSubTab}-${item.login}`}
                    className="flex items-center justify-between rounded-lg border border-gray-700 bg-[#101014] px-3 py-2"
                  >
                    <p className="text-sm text-white">
                      {(statsPage - 1) * statsPerPage + index + 1}. {item.login}
                    </p>
                    <span className="text-sm font-semibold" style={{ color: statsSubTab === "received" ? "#93c5fd" : "#c4b5fd" }}>
                      {item.total}
                    </span>
                  </div>
                ))}
                {statsTotalPages > 1 ? (
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setStatsPage((prev) => Math.max(1, prev - 1))}
                      disabled={statsPage === 1}
                      className="rounded-md border px-2 py-1 text-xs disabled:opacity-50"
                      style={{ borderColor: "rgba(255,255,255,0.18)" }}
                    >
                      Precedent
                    </button>
                    <span className="text-xs text-gray-400">
                      Page {statsPage}/{statsTotalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setStatsPage((prev) => Math.min(statsTotalPages, prev + 1))}
                      disabled={statsPage === statsTotalPages}
                      className="rounded-md border px-2 py-1 text-xs disabled:opacity-50"
                      style={{ borderColor: "rgba(255,255,255,0.18)" }}
                    >
                      Suivant
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        ) : activeTab === "upa" ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-amber-100">Raids EventSub — période UPA</p>
                <p className="mt-1 text-xs text-slate-400">
                  Streamers = liste « Lives caritatifs UPA » dans{" "}
                  <Link href="/admin/upa-event" className="text-amber-200 underline-offset-2 hover:underline">
                    /admin/upa-event
                  </Link>{" "}
                  (toutes les fiches avec login, quel que soit le interrupteur « Actif » sur la carte UPA). Fenêtre temporelle =
                  dates de l&apos;événement (Europe/Paris).
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => void loadUpaReport()}
                  disabled={upaLoading}
                  className="rounded-lg border border-amber-400/40 px-3 py-2 text-xs font-semibold text-amber-100 disabled:opacity-50"
                >
                  {upaLoading ? "Chargement..." : "Rafraîchir"}
                </button>
                {upaReport && !upaLoading ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        triggerTextDownload(
                          `upa-raids-detail_${upaReport.period.startDate}_${upaReport.period.endDate}.csv`,
                          stringifyUpaCsv(buildUpaDetailCsvRows(upaReport)),
                          "text/csv;charset=utf-8;"
                        );
                      }}
                      className="rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-100"
                      title="Une ligne par raid (reçu ou fait) avec viewers, logins, statuts — séparateur point-virgule pour Excel (FR)"
                    >
                      CSV détail raids
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        triggerTextDownload(
                          `upa-raids-synthese-streamers_${upaReport.period.startDate}_${upaReport.period.endDate}.csv`,
                          stringifyUpaCsv(buildUpaSummaryCsvRows(upaReport)),
                          "text/csv;charset=utf-8;"
                        );
                      }}
                      className="rounded-lg border border-sky-500/35 bg-sky-500/10 px-3 py-2 text-xs font-semibold text-sky-100"
                      title="Une ligne par streamer UPA : compteurs raids reçus / faits"
                    >
                      CSV synthèse streamers
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        triggerTextDownload(
                          `upa-raids-report_${upaReport.period.startDate}_${upaReport.period.endDate}.json`,
                          JSON.stringify(upaReport, null, 2),
                          "application/json;charset=utf-8;"
                        );
                      }}
                      className="rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold text-slate-200"
                      title="Export JSON brut du rapport (scripts, sauvegarde)"
                    >
                      JSON complet
                    </button>
                  </>
                ) : null}
              </div>
            </div>

            {upaError ? (
              <div className="rounded-lg border border-red-500/40 bg-red-900/20 px-4 py-3 text-sm text-red-200" role="alert">
                {upaError}
              </div>
            ) : null}

            {upaLoading && !upaReport ? (
              <p className="text-sm text-slate-400">Chargement du rapport UPA...</p>
            ) : null}

            {upaReport ? (
              <>
                <p className="text-sm text-slate-300">
                  Du <span className="text-white">{upaReport.period.startDate}</span> au{" "}
                  <span className="text-white">{upaReport.period.endDate}</span> (Paris, minuit → fin de journée).{" "}
                  <span className="text-slate-500">
                    {upaReport.meta.streamerCardsConfigured} streamer(s) configuré(s), {upaReport.meta.eventsLoaded}{" "}
                    événement(s) raid dans la fenêtre (hors doublons / erreurs).
                  </span>
                </p>

                {upaReport.streamers.length === 0 ? (
                  <p className="text-sm text-slate-400">
                    Aucun login Twitch dans « Lives caritatifs UPA ». Ajoutez des participants dans l&apos;admin UPA.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {upaReport.streamers.map((s) => (
                      <details
                        key={s.twitchLogin}
                        className="group rounded-xl border border-amber-500/20 bg-[#12100a]/90 px-4 py-3 open:border-amber-400/35"
                      >
                        <summary className="cursor-pointer list-none font-semibold text-amber-50 [&::-webkit-details-marker]:hidden">
                          <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span>
                              {s.displayName}{" "}
                              <span className="font-mono text-sm font-normal text-amber-200/90">({s.twitchLogin})</span>
                            </span>
                            <span className="text-xs font-normal text-slate-400">
                              Reçus: <span className="text-emerald-300">{s.raidsReceivedCount}</span> · Faits:{" "}
                              <span className="text-sky-300">{s.raidsSentCount}</span>
                              {!s.upaCardActive ? (
                                <span className="ml-2 rounded border border-white/15 px-1.5 py-0.5 text-[10px] text-slate-500">
                                  carte UPA désactivée
                                </span>
                              ) : null}
                            </span>
                          </span>
                        </summary>

                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-200/90">
                              Raids reçus (cible = ce streamer)
                            </p>
                            {s.raidsReceived.length === 0 ? (
                              <p className="text-xs text-slate-500">Aucun dans la période.</p>
                            ) : (
                              <ul className="max-h-64 space-y-2 overflow-y-auto text-xs">
                                {s.raidsReceived.map((r) => (
                                  <li key={r.id} className="rounded border border-white/10 bg-black/30 px-2 py-1.5 text-slate-200">
                                    <span className="font-mono text-amber-100/90">{r.from_broadcaster_user_login || "?"}</span>
                                    {" → "}
                                    <span className="font-mono">{r.to_broadcaster_user_login || "?"}</span>
                                    <span className="block text-[11px] text-slate-500">
                                      {r.event_at ? new Date(r.event_at).toLocaleString("fr-FR") : ""}
                                      {typeof r.viewers === "number" ? ` · ${r.viewers} viewers` : ""}
                                      {typeof r.raider_live_duration_minutes === "number"
                                        ? ` · live: ${formatLiveDuration(r.raider_live_duration_minutes)}`
                                        : ""}
                                      {r.processing_status ? ` · ${r.processing_status}` : ""}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                          <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-sky-200/90">
                              Raids faits (raideur = ce streamer)
                            </p>
                            {s.raidsSent.length === 0 ? (
                              <p className="text-xs text-slate-500">Aucun dans la période.</p>
                            ) : (
                              <ul className="max-h-64 space-y-2 overflow-y-auto text-xs">
                                {s.raidsSent.map((r) => (
                                  <li key={r.id} className="rounded border border-white/10 bg-black/30 px-2 py-1.5 text-slate-200">
                                    <span className="font-mono text-sky-100/90">{r.from_broadcaster_user_login || "?"}</span>
                                    {" → "}
                                    <span className="font-mono">{r.to_broadcaster_user_login || "?"}</span>
                                    <span className="block text-[11px] text-slate-500">
                                      {r.event_at ? new Date(r.event_at).toLocaleString("fr-FR") : ""}
                                      {typeof r.viewers === "number" ? ` · ${r.viewers} viewers` : ""}
                                      {typeof r.raider_live_duration_minutes === "number"
                                        ? ` · live: ${formatLiveDuration(r.raider_live_duration_minutes)}`
                                        : ""}
                                      {r.processing_status ? ` · ${r.processing_status}` : ""}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </details>
                    ))}
                  </div>
                )}
              </>
            ) : null}
          </div>
        ) : (
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {(["all", "received", "matched", "ignored", "duplicate", "error"] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setHistoryStatusFilter(status)}
                  className="rounded-md border px-3 py-1.5 text-xs font-semibold"
                  style={{
                    borderColor: historyStatusFilter === status ? "rgba(145,70,255,0.55)" : "rgba(255,255,255,0.18)",
                    color: historyStatusFilter === status ? "#d8b4fe" : "#cbd5e1",
                  }}
                >
                  {status === "all" ? "Tous" : status}
                </button>
              ))}
              <input
                value={historySearch}
                onChange={(event) => setHistorySearch(event.target.value)}
                placeholder="Rechercher raider/cible/raison..."
                className="w-full max-w-[360px] rounded-md border px-3 py-1.5 text-xs"
                style={{ borderColor: "rgba(255,255,255,0.2)", backgroundColor: "#101014", color: "#fff" }}
              />
            </div>
            <p className="mt-2 text-xs text-gray-500" role="status" aria-live="polite">
              {filteredHistoryRows.length} résultat(s) dans l&apos;historique avec les filtres actuels.
            </p>

            {filteredHistoryRows.length === 0 ? (
              <p className="text-sm text-gray-300">Aucun raid dans l&apos;historique avec ces filtres.</p>
            ) : (
              <div className="space-y-2">
                {pagedHistoryRows.map((item) => (
                  <article key={item.id} className="rounded-lg border border-gray-700 bg-[#101014] px-3 py-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm text-white">
                        {item.from_broadcaster_user_login || "inconnu"} → {item.to_broadcaster_user_login || "inconnu"}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full border border-white/20 bg-white/5 px-2 py-1 text-[11px] text-gray-200">{item.processing_status}</span>
                        {item.processing_status === "matched" ? (
                          <button
                            type="button"
                            onClick={() => openInvalidateModal(item)}
                            disabled={runningAction !== "" || invalidateTarget !== null || invalidateModalLoading}
                            className="rounded-md border px-2 py-1 text-[11px] font-semibold text-amber-300 disabled:opacity-50"
                            style={{ borderColor: "rgba(251,191,36,0.45)", backgroundColor: "rgba(251,191,36,0.08)" }}
                            title="Invalider apres coup avec raison"
                          >
                            Invalider
                          </button>
                        ) : null}
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-gray-400">
                      {item.event_at ? new Date(item.event_at).toLocaleString("fr-FR") : "Date inconnue"}
                      {typeof item.viewers === "number" ? ` • viewers: ${item.viewers}` : ""}
                      {typeof item.raider_live_duration_minutes === "number"
                        ? ` • live: ${formatLiveDuration(item.raider_live_duration_minutes)}`
                        : ""}
                    </p>
                    {item.error_reason ? <p className="mt-1 text-xs text-amber-200">Raison: {item.error_reason}</p> : null}
                  </article>
                ))}
                {historyTotalPages > 1 ? (
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setHistoryPage((prev) => Math.max(1, prev - 1))}
                      disabled={historyPage === 1}
                      className="rounded-md border px-2 py-1 text-xs disabled:opacity-50"
                      style={{ borderColor: "rgba(255,255,255,0.18)" }}
                    >
                      Precedent
                    </button>
                    <span className="text-xs text-gray-400">
                      Page {historyPage}/{historyTotalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setHistoryPage((prev) => Math.min(historyTotalPages, prev + 1))}
                      disabled={historyPage === historyTotalPages}
                      className="rounded-md border px-2 py-1 text-xs disabled:opacity-50"
                      style={{ borderColor: "rgba(255,255,255,0.18)" }}
                    >
                      Suivant
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}
      </div>

          </div>

          <aside className="min-w-0 space-y-4 xl:sticky xl:top-6 xl:self-start">
            <div className={`${cockpitPanelClass} p-4`}>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">À retenir</p>
              <ul className="mt-3 list-disc space-y-2.5 pl-4 text-xs leading-relaxed text-zinc-400 marker:text-zinc-600">
                <li>EventSub est la source automatique Twitch : ce que la plateforme remonte en premier.</li>
                <li>En cas de doute, croisez avec les signalements membres avant de trancher.</li>
                <li>Passez par l’onglet Historique pour contrôler les volumes sur la durée.</li>
                <li>
                  Après fiabilisation, enchaînez vers{" "}
                  <Link
                    href={pointsDiscordHref}
                    className="text-emerald-200/90 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/45 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                  >
                    Points Discord
                  </Link>{" "}
                  si vous récompensez l’activité.
                </li>
              </ul>
            </div>
            <div className={`${cockpitPanelClass} p-4`}>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Auto-actualisation</p>
              <p className="mt-2 text-sm text-zinc-300">
                {pollingPausedByVisibility ? "En pause tant que l’onglet est en arrière-plan." : "Active — toutes les 30 s."}
              </p>
              {lastRefreshAt ? (
                <p className="mt-2 text-xs text-zinc-500">
                  Dernière requête : <span className="text-zinc-300">{lastRefreshAt.toLocaleString("fr-FR")}</span>
                </p>
              ) : null}
              <p className="mt-2 text-xs text-zinc-500">
                Run actif :{" "}
                {summary?.activeRun ? (
                  <span className="text-emerald-300/95">
                    {summary.activeRun.label}{" "}
                    <code className="font-mono text-zinc-400">({summary.activeRun.id.slice(0, 8)}…)</code>
                  </span>
                ) : (
                  <span className="text-zinc-500">aucun</span>
                )}
              </p>
            </div>
            <div className={`${cockpitPanelClass} p-4`}>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Liens rapides</p>
              <ul className="mt-3 space-y-2 text-sm">
                {isCommunity ? (
                  <li>
                    <Link
                      href={fiabiliteHubHref}
                      className="text-violet-200/90 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/45 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                    >
                      Accueil pilier Raids fiabilité
                    </Link>
                  </li>
                ) : null}
                <li>
                  <Link
                    href={signalementsHref}
                    className="text-amber-200/90 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/45 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                  >
                    Signalements
                  </Link>
                </li>
                <li>
                  <Link
                    href={historyHref}
                    className="text-violet-200/90 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/45 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                  >
                    Historique consolidé
                  </Link>
                </li>
                <li>
                  <Link
                    href={pointsDiscordHref}
                    className="text-emerald-200/90 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/45 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                  >
                    Points Discord
                  </Link>
                </li>
                {isCommunity ? (
                  <li>
                    <Link
                      href={followHref}
                      className="text-zinc-300 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/45 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                    >
                      Follow communauté
                    </Link>
                  </li>
                ) : null}
                <li>
                  <Link
                    href={reviewHref}
                    className="text-zinc-300 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/45 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                  >
                    File raids-sub à valider
                  </Link>
                </li>
                <li>
                  <Link
                    href={watchlistHref}
                    className="text-emerald-200/90 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/45 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                  >
                    Watchlist live
                  </Link>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>

      <AdminConfirmModal
        open={invalidateTarget !== null}
        tone="warning"
        title="Invalider ce raid EventSub"
        description={
          invalidateTarget ? (
            <>
              <p className="mb-2">
                Cette action marque le raid comme ignore apres validation. La raison sera visible cote membre.
              </p>
              <ul className="list-inside list-disc space-y-1 text-zinc-400">
                <li>
                  Event ID : <span className="font-mono text-zinc-200">{invalidateTarget.id}</span>
                </li>
                <li>
                  Raideur :{" "}
                  <span className="text-zinc-200">{invalidateTarget.from_broadcaster_user_login || "inconnu"}</span> → Cible :{" "}
                  <span className="text-zinc-200">{invalidateTarget.to_broadcaster_user_login || "inconnu"}</span>
                </li>
                <li>
                  Date :{" "}
                  <span className="text-zinc-200">
                    {invalidateTarget.event_at ? new Date(invalidateTarget.event_at).toLocaleString("fr-FR") : "inconnue"}
                  </span>
                </li>
              </ul>
            </>
          ) : undefined
        }
        confirmLabel="Invalider le raid"
        loading={invalidateModalLoading}
        disableConfirm={invalidateReason.trim().length < 3}
        onCancel={onCancelInvalidateModal}
        onConfirm={() => {
          void submitInvalidateRaid();
        }}
        input={{
          label: "Raison (obligatoire)",
          placeholder: "Expliquez pourquoi ce raid ne doit plus etre comptabilise...",
          value: invalidateReason,
          onChange: (next) => {
            setInvalidateReason(next);
            if (invalidateFieldError) setInvalidateFieldError(null);
          },
          multiline: true,
          required: true,
          helperText: "Minimum 3 caracteres (regle API).",
          error: invalidateFieldError,
        }}
      />
    </div>
  );
}

function Card({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0 rounded-lg border border-white/[0.07] bg-black/20 px-3 py-2.5 text-sm ring-1 ring-inset ring-white/[0.02]">
      <p className="text-xs leading-snug text-zinc-500">{label}</p>
      <p className="mt-1 text-[clamp(1rem,0.88rem+0.45vw,1.35rem)] font-semibold tabular-nums text-zinc-100">{value}</p>
    </div>
  );
}

function Mini({ label, value, tone }: { label: string; value: number; tone: "neutral" | "success" | "warning" | "info" | "danger" }) {
  const toneClass =
    tone === "success"
      ? "text-emerald-200 border-emerald-400/20 bg-emerald-500/5"
      : tone === "warning"
        ? "text-amber-200 border-amber-400/20 bg-amber-500/5"
        : tone === "info"
          ? "text-sky-200 border-sky-400/20 bg-sky-500/5"
          : tone === "danger"
            ? "text-rose-200 border-rose-400/20 bg-rose-500/5"
            : "text-zinc-200 border-white/[0.08] bg-white/[0.03]";
  return (
    <div className={`min-w-0 rounded-lg border p-3 ring-1 ring-inset ring-white/[0.02] ${toneClass}`}>
      <p className="text-xs leading-snug text-zinc-500">{label}</p>
      <p className="mt-1 text-[clamp(1rem,0.88rem+0.45vw,1.25rem)] font-semibold tabular-nums">{value}</p>
    </div>
  );
}

