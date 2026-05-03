"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
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
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [reviewEvents, setReviewEvents] = useState<ReviewEvent[]>([]);
  const [lastRefreshAt, setLastRefreshAt] = useState<Date | null>(null);
  const [upaReport, setUpaReport] = useState<UpaReportResponse | null>(null);
  const [upaLoading, setUpaLoading] = useState(false);
  const [upaError, setUpaError] = useState("");

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

  async function loadData(options?: { silent?: boolean }) {
    const silent = Boolean(options?.silent);
    try {
      if (!silent) {
        setLoading(true);
      }
      if (!silent) {
        setError("");
      }
      const [summaryResponse, reviewResponse] = await Promise.all([
        fetch("/api/admin/engagement/raids-sub/summary"),
        fetch("/api/admin/engagement/raids-sub/review?status=all&limit=500"),
      ]);
      const [summaryBody, reviewBody] = await Promise.all([summaryResponse.json(), reviewResponse.json()]);
      if (!summaryResponse.ok) throw new Error(summaryBody.error || "Impossible de charger le suivi raids-sub.");
      setSummary(summaryBody);
      if (reviewResponse.ok) {
        setReviewEvents((reviewBody.events || []) as ReviewEvent[]);
      }
      setLastRefreshAt(new Date());
    } catch (e) {
      if (!silent) {
        setError(e instanceof Error ? e.message : "Erreur reseau.");
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }

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

  async function invalidateMatchedRaid(item: ReviewEvent) {
    const reason = window.prompt("Raison obligatoire pour invalider ce raid (visible sur l'espace membre) :", "");
    const trimmedReason = String(reason || "").trim();
    if (!trimmedReason) {
      setError("Invalider un raid apres validation exige une raison.");
      return;
    }

    setRunningAction("refresh");
    setError("");
    try {
      const response = await fetch(`/api/admin/engagement/raids-sub/review/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          processingStatus: "ignored",
          invalidateAfterValidation: true,
          staffComment: trimmedReason,
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || "Impossible d invalider ce raid.");
      }
      setReviewEvents((previous) => previous.map((row) => (row.id === item.id ? (body.event as ReviewEvent) : row)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur reseau.");
    } finally {
      setRunningAction("");
    }
  }

  useEffect(() => {
    void loadData();
    const intervalId = window.setInterval(() => {
      void loadData({ silent: true });
    }, 30_000);

    return () => window.clearInterval(intervalId);
  }, []);

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

  return (
    <div
      className={`text-white space-y-6 ${isCommunity ? "pb-2" : "min-h-screen bg-[#0e0e10] p-8"}`}
    >
      <section className="rounded-2xl border border-indigo-300/20 bg-[linear-gradient(150deg,rgba(99,102,241,0.12),rgba(14,15,23,0.85)_45%,rgba(56,189,248,0.08))] p-5 md:p-6 shadow-[0_20px_50px_rgba(2,6,23,0.45)] backdrop-blur">
        <Link href={backHref} className="mb-4 inline-block text-gray-300 transition-colors hover:text-white">
          {isCommunity ? "← Hub engagement" : "← Retour au suivi des raids"}
        </Link>
        <div className="mb-3 flex flex-wrap gap-2">
          <Link
            href={historyHref}
            className="inline-flex rounded-full border px-3 py-1 text-xs font-semibold text-[#c4b5fd]"
            style={{ borderColor: "rgba(167,139,250,0.45)" }}
          >
            Historique consolidé
          </Link>
          {isCommunity ? (
            <Link
              href={signalementsHref}
              className="inline-flex rounded-full border px-3 py-1 text-xs font-semibold text-[#facc15]"
              style={{ borderColor: "rgba(250,204,21,0.45)" }}
            >
              File signalements
            </Link>
          ) : (
            <Link
              href={eventSubHubHref}
              className="inline-flex rounded-full border px-3 py-1 text-xs font-semibold text-[#93c5fd]"
              style={{ borderColor: "rgba(96,165,250,0.45)" }}
            >
              Ouvrir hub raids EventSub test
            </Link>
          )}
          <Link
            href={pointsDiscordHref}
            className="inline-flex rounded-full border px-3 py-1 text-xs font-semibold text-emerald-200"
            style={{ borderColor: "rgba(52,211,153,0.45)" }}
          >
            Points Discord (+500)
          </Link>
        </div>
        <h1 className="mb-2 bg-gradient-to-r from-indigo-100 via-sky-200 to-cyan-200 bg-clip-text text-3xl font-bold text-transparent md:text-4xl">
          {isCommunity ? "Raids EventSub — santé du flux" : "Raids Sub - Suivi EventSub"}
        </h1>
        <p className="max-w-4xl text-sm text-slate-300">
          {isCommunity ? (
            <>
              Pour les <span className="text-slate-100">membres TENF</span>, un raid mal compté = frustration. Ce tableau permet
              de voir en direct si Twitch envoie bien les événements, combien sont <strong>matched</strong>, et où corriger. La
              synchronisation ne garde les abonnements <span className="font-mono text-xs text-slate-200">channel.raid</span> que
              pour les chaînes réellement en live (Helix) ou en fenêtre de grâce après le live — paramètres dans{" "}
              <span className="font-mono text-xs text-slate-200">lib/raidEventsubTest.ts</span>.
            </>
          ) : (
            <>
              Cette page pilote le flux EventSub de bout en bout: surveillance des subscriptions, suivi des statuts de traitement,
              analyse des volumes quotidiens et corrections rapides des raids mal classés. Périmètre membres :{" "}
              <span className="text-slate-100">non archivés</span> (<span className="font-mono text-xs">members.is_archived</span>
              ), actifs ou inactifs côté communauté. La sync ne garde des subscriptions
              <span className="text-slate-100"> channel.raid</span> que pour ceux qui sont en live (Helix) ou dans la fenêtre de
              grâce après fin de live (<span className="font-mono text-xs text-slate-200">GRACE_PERIOD_MINUTES</span>, plus long pour
              le rôle <span className="text-slate-100">Nouveau</span>, dans{" "}
              <span className="font-mono text-xs text-slate-200">lib/raidEventsubTest.ts</span>).
            </>
          )}
        </p>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-[#2f3244] bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.10),_rgba(11,13,20,0.95)_46%)] p-4 shadow-[0_16px_40px_rgba(2,6,23,0.45)]">
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Events total</p>
          <p className="mt-2 text-3xl font-semibold">{summary?.stats.eventsTotal ?? 0}</p>
        </article>
        <article className="rounded-2xl border border-[#2f3244] bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.10),_rgba(11,13,20,0.95)_46%)] p-4 shadow-[0_16px_40px_rgba(2,6,23,0.45)]">
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Abonnements actifs</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-300">{summary?.stats.activeSubscriptions ?? 0}</p>
        </article>
        <article className="rounded-2xl border border-[#2f3244] bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.10),_rgba(11,13,20,0.95)_46%)] p-4 shadow-[0_16px_40px_rgba(2,6,23,0.45)]">
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Raids matchés</p>
          <p className="mt-2 text-3xl font-semibold text-cyan-300">{summary?.eventStatus.matched ?? 0}</p>
        </article>
        <article className="rounded-2xl border border-[#2f3244] bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.10),_rgba(11,13,20,0.95)_46%)] p-4 shadow-[0_16px_40px_rgba(2,6,23,0.45)]">
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">En erreur</p>
          <p className="mt-2 text-3xl font-semibold text-rose-300">{summary?.eventStatus.error ?? 0}</p>
        </article>
      </section>

      <div
        className="mb-6 rounded-xl border p-4"
        style={{
          borderColor: "rgba(139,92,246,0.26)",
          background: "radial-gradient(circle at 10% 8%, rgba(139,92,246,0.14), rgba(26,26,29,0.95) 42%)",
        }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className="rounded-lg border px-3 py-2 text-sm font-semibold"
            style={{
              borderColor: activeTab === "overview" ? "rgba(145,70,255,0.6)" : "rgba(255,255,255,0.2)",
              color: activeTab === "overview" ? "#d8b4fe" : "#cbd5e1",
            }}
          >
            Tableau de bord
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("stats")}
            className="rounded-lg border px-3 py-2 text-sm font-semibold"
            style={{
              borderColor: activeTab === "stats" ? "rgba(145,70,255,0.6)" : "rgba(255,255,255,0.2)",
              color: activeTab === "stats" ? "#d8b4fe" : "#cbd5e1",
            }}
          >
            Stats de raids
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className="rounded-lg border px-3 py-2 text-sm font-semibold"
            style={{
              borderColor: activeTab === "history" ? "rgba(145,70,255,0.6)" : "rgba(255,255,255,0.2)",
              color: activeTab === "history" ? "#d8b4fe" : "#cbd5e1",
            }}
          >
            Historique des raids
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("upa")}
            className="rounded-lg border px-3 py-2 text-sm font-semibold"
            style={{
              borderColor: activeTab === "upa" ? "rgba(212,175,55,0.65)" : "rgba(255,255,255,0.2)",
              color: activeTab === "upa" ? "#f2d891" : "#cbd5e1",
              backgroundColor: activeTab === "upa" ? "rgba(212,175,55,0.12)" : "transparent",
            }}
          >
            UPA (Lives caritatifs)
          </button>
          <button
            type="button"
            onClick={() => {
              setRunningAction("refresh");
              void loadData().finally(() => setRunningAction(""));
            }}
            disabled={loading || runningAction !== ""}
            className="rounded-lg border px-3 py-2 text-sm font-semibold text-gray-100 disabled:opacity-50"
            style={{ borderColor: "rgba(255,255,255,0.2)" }}
          >
            {runningAction === "refresh" || loading ? "Rafraichissement..." : "Rafraichir"}
          </button>
          <button
            type="button"
            onClick={() => void runSyncNow()}
            disabled={runningAction !== "" || !summary?.activeRun}
            className="rounded-lg border px-3 py-2 text-sm font-semibold text-sky-300 disabled:opacity-50"
            style={{ borderColor: "rgba(56,189,248,0.45)", backgroundColor: "rgba(56,189,248,0.08)" }}
          >
            {runningAction === "sync" ? "Sync..." : "Sync EventSub maintenant"}
          </button>
          <Link
            href={reviewHref}
            className="rounded-lg border px-3 py-2 text-sm font-semibold text-[#facc15]"
            style={{ borderColor: "rgba(250,204,21,0.45)" }}
          >
            Ouvrir raids-sub a valider
          </Link>
          <Link
            href={watchlistHref}
            className="rounded-lg border px-3 py-2 text-sm font-semibold text-emerald-300"
            style={{ borderColor: "rgba(52,211,153,0.45)" }}
          >
            Watchlist live vs surveille
          </Link>
        </div>

        <p className="mt-3 text-xs text-gray-400">
          Auto-refresh: 30s
          {lastRefreshAt ? ` - derniere mise a jour ${lastRefreshAt.toLocaleTimeString("fr-FR")}` : ""}
          {" - "}Run actif:{" "}
          {summary?.activeRun ? (
            <span className="text-emerald-300">
              {summary.activeRun.label} ({summary.activeRun.id.slice(0, 8)}...)
            </span>
          ) : (
            <span className="text-gray-300">Aucun run actif</span>
          )}
        </p>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-red-500/40 bg-red-900/20 px-4 py-3 text-sm text-red-200">{error}</div>
      ) : null}

      {syncMessage ? (
        <div className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-900/20 px-4 py-3 text-sm text-emerald-200">{syncMessage}</div>
      ) : null}

      {!summary?.testEnabled ? (
        <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-900/20 px-4 py-3 text-sm text-amber-200">
          RAID_EVENTSUB_TEST_ENABLED est desactive.
        </div>
      ) : null}

      <section className="rounded-2xl border border-[#2f3244] bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.10),_rgba(11,13,20,0.95)_46%)] p-4 shadow-[0_16px_40px_rgba(2,6,23,0.45)]">
        <h2 className="text-base font-semibold text-slate-100">Explication opérationnelle</h2>
        <div className="mt-3 grid grid-cols-1 gap-2 text-sm md:grid-cols-3">
          <p className="rounded-lg border border-indigo-300/30 bg-indigo-300/10 px-3 py-2 text-indigo-100">
            1. Vérifier le tableau de bord pour détecter les erreurs et abonnements défaillants.
          </p>
          <p className="rounded-lg border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-cyan-100">
            2. Utiliser les stats pour suivre les tendances mensuelles et les streamers les plus actifs.
          </p>
          <p className="rounded-lg border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-amber-100">
            3. Corriger les cas ignorés ou invalidés depuis l'historique et la file à valider.
          </p>
        </div>
      </section>

      <div className="rounded-lg border border-gray-700 bg-[#1a1a1d] p-6">
        {loading ? <p className="mb-3 text-sm text-gray-300">Chargement des donnees...</p> : null}

        {activeTab === "overview" ? (
          <>
            <div className="space-y-4">
              <section className="rounded-xl border border-[#353a50] bg-[#101622]/85 p-4 shadow-[0_10px_24px_rgba(2,6,23,0.35)]">
                <p className="mb-3 text-xs uppercase tracking-[0.12em] text-slate-400">Vue generale</p>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                  <Card label="Events total" value={summary?.stats.eventsTotal ?? 0} />
                  <Card label="Abonnements total" value={summary?.stats.subscriptionsTotal ?? 0} />
                  <Card label="Abonnements actifs" value={summary?.stats.activeSubscriptions ?? 0} />
                  <Card label="Abonnements en echec" value={summary?.stats.failedSubscriptions ?? 0} />
                  <Card label="Abonnements revoques" value={summary?.stats.revokedSubscriptions ?? 0} />
                </div>
              </section>

              <section className="rounded-xl border border-[#353a50] bg-[#101622]/85 p-4 shadow-[0_10px_24px_rgba(2,6,23,0.35)]">
                <p className="mb-3 text-xs uppercase tracking-[0.12em] text-slate-400">Watchlist et couverture</p>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                  <Card label="Membres eligibles" value={summary?.watchlist.eligibleMembers ?? 0} />
                  <Card label="En live maintenant" value={summary?.watchlist.liveNow ?? 0} />
                  <Card label="A surveiller" value={summary?.watchlist.targetedByPolicy ?? 0} />
                  <Card label="Subs locales active/pending" value={summary?.watchlist.localSubscriptionsActiveOrPending ?? 0} />
                  <Card label="Subs distantes actives" value={summary?.watchlist.remoteSubscriptionsEnabled ?? 0} />
                </div>
              </section>

              <section className="rounded-xl border border-[#353a50] bg-[#101622]/85 p-4 shadow-[0_10px_24px_rgba(2,6,23,0.35)]">
                <p className="mb-3 text-xs uppercase tracking-[0.12em] text-slate-400">Statut des events</p>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                  <Mini label="recus" value={summary?.eventStatus.received ?? 0} tone="neutral" />
                  <Mini label="matches" value={summary?.eventStatus.matched ?? 0} tone="success" />
                  <Mini label="ignores" value={summary?.eventStatus.ignored ?? 0} tone="warning" />
                  <Mini label="doublons" value={summary?.eventStatus.duplicate ?? 0} tone="info" />
                  <Mini label="erreurs" value={summary?.eventStatus.error ?? 0} tone="danger" />
                </div>
              </section>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <Link href={reviewHref} className="rounded-xl border border-indigo-300/30 bg-indigo-300/10 p-4 transition hover:border-indigo-200/50 hover:brightness-110">
                <p className="text-lg font-semibold">Raids Sub a valider</p>
                <p className="mt-1 text-sm text-gray-400">Validation manuelle et forcage en matched des events ignores.</p>
              </Link>
              <Link href={`${reviewHref}?status=ignored`} className="rounded-xl border border-amber-300/30 bg-amber-300/10 p-4 transition hover:border-amber-200/60 hover:brightness-110">
                <p className="text-lg font-semibold text-amber-300">Details des ignores</p>
                <p className="mt-1 text-sm text-gray-400">Ouvre directement les events ignores pour correction rapide.</p>
              </Link>
              <Link href={watchlistHref} className="rounded-xl border border-emerald-300/30 bg-emerald-300/10 p-4 transition hover:border-emerald-200/60 hover:brightness-110">
                <p className="text-lg font-semibold">Watchlist live vs surveille</p>
                <p className="mt-1 text-sm text-gray-400">Controle qui est en live et qui est effectivement surveille.</p>
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
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStatsSubTab("received")}
                  className="rounded-md border px-3 py-1.5 text-xs font-semibold"
                  style={{
                    borderColor: statsSubTab === "received" ? "rgba(96,165,250,0.55)" : "rgba(255,255,255,0.18)",
                    color: statsSubTab === "received" ? "#93c5fd" : "#cbd5e1",
                  }}
                >
                  Raids recus
                </button>
                <button
                  type="button"
                  onClick={() => setStatsSubTab("sent")}
                  className="rounded-md border px-3 py-1.5 text-xs font-semibold"
                  style={{
                    borderColor: statsSubTab === "sent" ? "rgba(167,139,250,0.55)" : "rgba(255,255,255,0.18)",
                    color: statsSubTab === "sent" ? "#c4b5fd" : "#cbd5e1",
                  }}
                >
                  Raids faits
                </button>
              </div>
              <span className="text-xs text-gray-400">{activeStatsRows.length} streamer(s)</span>
            </div>

            {activeStatsRows.length === 0 ? (
              <p className="text-sm text-gray-300">Aucune donnee exploitable pour les stats sur ce run.</p>
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
              <div className="rounded-lg border border-red-500/40 bg-red-900/20 px-4 py-3 text-sm text-red-200">{upaError}</div>
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

            {filteredHistoryRows.length === 0 ? (
              <p className="text-sm text-gray-300">Aucun raid dans l historique avec ces filtres.</p>
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
                            onClick={() => void invalidateMatchedRaid(item)}
                            disabled={runningAction !== ""}
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
  );
}

function Card({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[#3b4157] bg-[#0f1422] px-3 py-2.5 text-sm">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

function Mini({ label, value, tone }: { label: string; value: number; tone: "neutral" | "success" | "warning" | "info" | "danger" }) {
  const toneClass =
    tone === "success"
      ? "text-emerald-300 border-emerald-300/25 bg-emerald-300/10"
      : tone === "warning"
        ? "text-amber-300 border-amber-300/25 bg-amber-300/10"
        : tone === "info"
          ? "text-sky-300 border-sky-300/25 bg-sky-300/10"
          : tone === "danger"
            ? "text-rose-300 border-rose-300/25 bg-rose-300/10"
            : "text-slate-200 border-slate-300/20 bg-slate-300/10";
  return (
    <div className={`rounded-lg border p-3 ${toneClass}`}>
      <p className="text-xs opacity-90">{label}</p>
      <p className="text-lg font-semibold">
        {value}
      </p>
    </div>
  );
}

