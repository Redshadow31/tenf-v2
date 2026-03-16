"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import RaidDailyChart, { type DailyRaidPoint } from "@/components/RaidDailyChart";

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
  processing_status: "received" | "matched" | "ignored" | "duplicate" | "error";
};

export default function AdminRaidsSubPage() {
  const [loading, setLoading] = useState(true);
  const [runningAction, setRunningAction] = useState<"" | "refresh" | "sync">("");
  const [activeTab, setActiveTab] = useState<"overview" | "stats">("overview");
  const [statsSubTab, setStatsSubTab] = useState<"received" | "sent">("sent");
  const [statsPage, setStatsPage] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [selectedChartDay, setSelectedChartDay] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [syncMessage, setSyncMessage] = useState("");
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [reviewEvents, setReviewEvents] = useState<ReviewEvent[]>([]);
  const [lastRefreshAt, setLastRefreshAt] = useState<Date | null>(null);

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
        fetch("/api/admin/engagement/raids-sub/summary", { cache: "no-store" }),
        fetch("/api/admin/engagement/raids-sub/review?status=all&limit=500", { cache: "no-store" }),
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

  useEffect(() => {
    void loadData();
    const intervalId = window.setInterval(() => {
      void loadData({ silent: true });
    }, 30_000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    setStatsPage(1);
  }, [activeTab, statsSubTab]);

  const nonDuplicateEvents = useMemo(
    () => reviewEvents.filter((event) => event.processing_status !== "duplicate" && event.processing_status !== "error"),
    [reviewEvents]
  );

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

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    const now = new Date();
    set.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
    for (const event of nonDuplicateEvents) {
      const value = String(event.event_at || "");
      if (!value) continue;
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) continue;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      set.add(key);
    }
    return Array.from(set).sort((a, b) => (a < b ? 1 : -1));
  }, [nonDuplicateEvents]);

  const dailyChartData = useMemo((): DailyRaidPoint[] => {
    if (!/^\d{4}-\d{2}$/.test(selectedMonth)) return [];
    const [yearStr, monthStr] = selectedMonth.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);
    const daysInMonth = new Date(year, month, 0).getDate();
    const byDay = new Map<number, DailyRaidPoint>();
    for (let day = 1; day <= daysInMonth; day++) {
      byDay.set(day, { day, raidsFaits: 0, raidsRecus: 0 });
    }
    for (const event of nonDuplicateEvents) {
      const value = String(event.event_at || "");
      if (!value) continue;
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) continue;
      if (date.getFullYear() !== year || date.getMonth() + 1 !== month) continue;
      const point = byDay.get(date.getDate());
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
    const previousDate = new Date(Number(yearStr), Number(monthStr) - 2, 1);
    const prevYear = previousDate.getFullYear();
    const prevMonth = previousDate.getMonth() + 1;
    const daysInMonth = new Date(prevYear, prevMonth, 0).getDate();
    const byDay = new Map<number, DailyRaidPoint>();
    for (let day = 1; day <= daysInMonth; day++) {
      byDay.set(day, { day, raidsFaits: 0, raidsRecus: 0 });
    }
    for (const event of nonDuplicateEvents) {
      const value = String(event.event_at || "");
      if (!value) continue;
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) continue;
      if (date.getFullYear() !== prevYear || date.getMonth() + 1 !== prevMonth) continue;
      const point = byDay.get(date.getDate());
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
    if (!selectedChartDay) return null;
    const point = dailyChartData.find((item) => item.day === selectedChartDay);
    if (!point) return null;
    return {
      sent: point.raidsFaits,
      received: point.raidsRecus,
    };
  }, [dailyChartData, selectedChartDay]);

  return (
    <div className="min-h-screen bg-[#0e0e10] p-8 text-white">
      <div className="mb-8">
        <Link href="/admin/raids" className="mb-4 inline-block text-gray-400 transition-colors hover:text-white">
          ← Retour au suivi des raids
        </Link>
        <div className="mb-3 flex flex-wrap gap-2">
          <Link
            href="/admin/engagement/historique-raids"
            className="inline-flex rounded-full border px-3 py-1 text-xs font-semibold text-[#c4b5fd]"
            style={{ borderColor: "rgba(167,139,250,0.45)" }}
          >
            Ouvrir historique raids
          </Link>
          <Link
            href="/admin/engagement/raids-test"
            className="inline-flex rounded-full border px-3 py-1 text-xs font-semibold text-[#93c5fd]"
            style={{ borderColor: "rgba(96,165,250,0.45)" }}
          >
            Ouvrir hub raids EventSub test
          </Link>
        </div>
        <h1 className="mb-2 text-4xl font-bold">Raids Sub - Suivi EventSub</h1>
        <p className="text-gray-400">Vue dediee au flux EventSub (hors declarations manuelles), stylee comme l'historique raids.</p>
      </div>

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
            href="/admin/engagement/raids-sub/a-valider"
            className="rounded-lg border px-3 py-2 text-sm font-semibold text-[#facc15]"
            style={{ borderColor: "rgba(250,204,21,0.45)" }}
          >
            Ouvrir raids-sub a valider
          </Link>
          <Link
            href="/admin/engagement/raids-test/watchlist"
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

      <div className="rounded-lg border border-gray-700 bg-[#1a1a1d] p-6">
        {loading ? <p className="mb-3 text-sm text-gray-300">Chargement des donnees...</p> : null}

        {activeTab === "overview" ? (
          <>
            <div className="space-y-3">
              <section className="rounded-lg border border-gray-700 bg-[#101014] p-3">
                <p className="mb-2 text-xs uppercase tracking-[0.12em] text-gray-400">Vue generale</p>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
                  <Card label="Events total" value={summary?.stats.eventsTotal ?? 0} />
                  <Card label="Abonnements total" value={summary?.stats.subscriptionsTotal ?? 0} />
                  <Card label="Abonnements actifs" value={summary?.stats.activeSubscriptions ?? 0} />
                  <Card label="Abonnements en echec" value={summary?.stats.failedSubscriptions ?? 0} />
                  <Card label="Abonnements revoques" value={summary?.stats.revokedSubscriptions ?? 0} />
                </div>
              </section>

              <section className="rounded-lg border border-gray-700 bg-[#101014] p-3">
                <p className="mb-2 text-xs uppercase tracking-[0.12em] text-gray-400">Watchlist et couverture</p>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
                  <Card label="Membres eligibles" value={summary?.watchlist.eligibleMembers ?? 0} />
                  <Card label="En live maintenant" value={summary?.watchlist.liveNow ?? 0} />
                  <Card label="A surveiller" value={summary?.watchlist.targetedByPolicy ?? 0} />
                  <Card label="Subs locales active/pending" value={summary?.watchlist.localSubscriptionsActiveOrPending ?? 0} />
                  <Card label="Subs distantes actives" value={summary?.watchlist.remoteSubscriptionsEnabled ?? 0} />
                </div>
              </section>

              <section className="rounded-lg border border-gray-700 bg-[#101014] p-3">
                <p className="mb-2 text-xs uppercase tracking-[0.12em] text-gray-400">Statut des events</p>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
                  <Mini label="recus" value={summary?.eventStatus.received ?? 0} color="#e5e7eb" />
                  <Mini label="matches" value={summary?.eventStatus.matched ?? 0} color="#34d399" />
                  <Mini label="ignores" value={summary?.eventStatus.ignored ?? 0} color="#f59e0b" />
                  <Mini label="doublons" value={summary?.eventStatus.duplicate ?? 0} color="#93c5fd" />
                  <Mini label="erreurs" value={summary?.eventStatus.error ?? 0} color="#f87171" />
                </div>
              </section>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <Link href="/admin/engagement/raids-sub/a-valider" className="rounded-xl border border-gray-700 bg-[#151519] p-4 transition-colors hover:border-[#9146ff]/60">
                <p className="text-lg font-semibold">Raids Sub a valider</p>
                <p className="mt-1 text-sm text-gray-400">Validation manuelle et forcage en matched des events ignores.</p>
              </Link>
              <Link href="/admin/engagement/raids-sub/a-valider?status=ignored" className="rounded-xl border border-gray-700 bg-[#151519] p-4 transition-colors hover:border-amber-400/70">
                <p className="text-lg font-semibold text-amber-300">Details des ignores</p>
                <p className="mt-1 text-sm text-gray-400">Ouvre directement les events ignores pour correction rapide.</p>
              </Link>
              <Link href="/admin/engagement/raids-test/watchlist" className="rounded-xl border border-gray-700 bg-[#151519] p-4 transition-colors hover:border-[#9146ff]/60">
                <p className="text-lg font-semibold">Watchlist live vs surveille</p>
                <p className="mt-1 text-sm text-gray-400">Controle qui est en live et qui est effectivement surveille.</p>
              </Link>
            </div>
          </>
        ) : (
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
            </div>
            <RaidDailyChart month={selectedMonth} data={dailyChartData} previousData={previousDailyChartData} onDaySelect={setSelectedChartDay} />
            {selectedDaySummary ? (
              <div className="mb-4 rounded-lg border border-gray-700 bg-[#101014] p-3">
                <p className="text-sm font-semibold text-white">Detail du jour {selectedChartDay}</p>
                <p className="text-xs text-gray-400">
                  {selectedDaySummary.sent} raid(s) fait(s) et {selectedDaySummary.received} raid(s) recu(s)
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
        )}
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-gray-700 px-3 py-2 text-sm">
      <p className="text-gray-400">{label}</p>
      <p className="font-semibold text-white">{value}</p>
    </div>
  );
}

function Mini({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#121216] p-3">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-lg font-semibold" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

