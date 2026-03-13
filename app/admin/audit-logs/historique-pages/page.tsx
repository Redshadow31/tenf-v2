"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PageActivityStatsCards from "@/components/admin/page-activity/PageActivityStatsCards";
import PageActivityDailyChart from "@/components/admin/page-activity/PageActivityDailyChart";
import PageActivityTopPagesTable from "@/components/admin/page-activity/PageActivityTopPagesTable";
import PageActivityHistoryTable from "@/components/admin/page-activity/PageActivityHistoryTable";

type ScopeTab = "public" | "admin";
type PeriodKey = "month" | "30d";
type AuthState = "all" | "authenticated" | "guest";
type EventType = "all" | "page_view" | "click";

interface HistoryResponse {
  page: number;
  limit: number;
  total: number;
  rows: Array<{
    zone: ScopeTab;
    path: string;
    title: string | null;
    userId: string | null;
    username: string | null;
    authState: "authenticated" | "guest";
    visits: number;
    clicks: number;
    lastVisitedAt: string;
  }>;
}

interface StatsResponse {
  totalVisits: number;
  totalClicks: number;
  totalEvents: number;
  daily: Array<{ date: string; visits: number; clicks: number; uniquePages: number }>;
}

interface TopResponse {
  topPages: Array<{ path: string; zone: ScopeTab; visits: number; clicks: number; lastVisitedAt: string }>;
  topPublicPages: Array<{ path: string; zone: ScopeTab; visits: number; clicks: number; lastVisitedAt: string }>;
  topAdminPages: Array<{ path: string; zone: ScopeTab; visits: number; clicks: number; lastVisitedAt: string }>;
}

function getPeriodRange(period: PeriodKey): { startDate: string; endDate: string } {
  const now = new Date();
  if (period === "month") {
    return {
      startDate: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString(),
      endDate: now.toISOString(),
    };
  }
  return {
    startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: now.toISOString(),
  };
}

export default function PageHistoryAuditPage() {
  const [tab, setTab] = useState<ScopeTab>("public");
  const [period, setPeriod] = useState<PeriodKey>("month");
  const [pathFilter, setPathFilter] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [authState, setAuthState] = useState<AuthState>("all");
  const [eventType, setEventType] = useState<EventType>("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [historyData, setHistoryData] = useState<HistoryResponse | null>(null);
  const [statsData, setStatsData] = useState<StatsResponse | null>(null);
  const [topData, setTopData] = useState<TopResponse | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const range = getPeriodRange(period);
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(limit));
        params.set("startDate", range.startDate);
        params.set("endDate", range.endDate);
        params.set("zone", tab);
        if (pathFilter) params.set("path", pathFilter);
        if (userSearch) params.set("userSearch", userSearch);
        if (authState !== "all") params.set("authState", authState);
        if (eventType !== "all") params.set("eventType", eventType);

        const [historyRes, statsRes, topRes] = await Promise.all([
          fetch(`/api/admin/page-activity?${params.toString()}`, { cache: "no-store" }),
          fetch(`/api/admin/page-activity/stats?${params.toString()}`, { cache: "no-store" }),
          fetch(`/api/admin/page-activity/top?${params.toString()}`, { cache: "no-store" }),
        ]);

        if (!historyRes.ok || !statsRes.ok || !topRes.ok) {
          throw new Error("Impossible de charger l'historique de navigation.");
        }

        const [historyPayload, statsPayload, topPayload] = await Promise.all([
          historyRes.json() as Promise<HistoryResponse>,
          statsRes.json() as Promise<StatsResponse>,
          topRes.json() as Promise<TopResponse>,
        ]);

        setHistoryData(historyPayload);
        setStatsData(statsPayload);
        setTopData(topPayload);
      } catch (e) {
        console.error("[audit-logs/historique-pages] error:", e);
        setError("Erreur lors du chargement des statistiques de navigation.");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [tab, period, pathFilter, userSearch, authState, eventType, page, limit]);

  const totalPages = useMemo(() => {
    if (!historyData) return 1;
    return Math.max(1, Math.ceil(historyData.total / historyData.limit));
  }, [historyData]);

  return (
    <div className="space-y-6 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/audit-logs" className="text-sm text-gray-400 transition-colors hover:text-white">
            ← Audit & Logs
          </Link>
          <h1 className="mt-2 text-3xl font-bold">Historique des pages</h1>
          <p className="text-sm text-gray-400">
            Analyse de navigation (pages visitées, clics, tendances journalières) séparée Public / Admin.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => {
            setTab("public");
            setPage(1);
          }}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${
            tab === "public" ? "bg-[#9146ff] text-white" : "bg-[#1a1a1d] text-gray-300"
          }`}
        >
          Public
        </button>
        <button
          onClick={() => {
            setTab("admin");
            setPage(1);
          }}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${
            tab === "admin" ? "bg-[#9146ff] text-white" : "bg-[#1a1a1d] text-gray-300"
          }`}
        >
          Admin
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-lg border border-[#2a2a2d] bg-[#1a1a1d] p-4 lg:grid-cols-6">
        <select
          value={period}
          onChange={(event) => {
            setPeriod(event.target.value as PeriodKey);
            setPage(1);
          }}
          className="rounded-lg border border-[#303038] bg-[#111114] px-3 py-2 text-sm text-white"
        >
          <option value="month">Mois en cours</option>
          <option value="30d">30 derniers jours</option>
        </select>

        <select
          value={authState}
          onChange={(event) => {
            setAuthState(event.target.value as AuthState);
            setPage(1);
          }}
          className="rounded-lg border border-[#303038] bg-[#111114] px-3 py-2 text-sm text-white"
        >
          <option value="all">Connecté + invité</option>
          <option value="authenticated">Connecté uniquement</option>
          <option value="guest">Invité uniquement</option>
        </select>

        <select
          value={eventType}
          onChange={(event) => {
            setEventType(event.target.value as EventType);
            setPage(1);
          }}
          className="rounded-lg border border-[#303038] bg-[#111114] px-3 py-2 text-sm text-white"
        >
          <option value="all">Visites + clics</option>
          <option value="page_view">Visites (page_view)</option>
          <option value="click">Clics (click)</option>
        </select>

        <input
          value={pathFilter}
          onChange={(event) => {
            setPathFilter(event.target.value);
            setPage(1);
          }}
          placeholder="Filtre path"
          className="rounded-lg border border-[#303038] bg-[#111114] px-3 py-2 text-sm text-white placeholder:text-gray-500"
        />

        <input
          value={userSearch}
          onChange={(event) => {
            setUserSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Filtre utilisateur"
          className="rounded-lg border border-[#303038] bg-[#111114] px-3 py-2 text-sm text-white placeholder:text-gray-500"
        />

        <button
          onClick={() => {
            setPeriod("month");
            setPathFilter("");
            setUserSearch("");
            setAuthState("all");
            setEventType("all");
            setPage(1);
          }}
          className="rounded-lg border border-[#303038] bg-[#111114] px-3 py-2 text-sm text-gray-200 transition-colors hover:border-[#9146ff]"
        >
          Réinitialiser
        </button>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>
      ) : null}

      <PageActivityStatsCards
        totalVisits={statsData?.totalVisits || 0}
        totalClicks={statsData?.totalClicks || 0}
        totalEvents={statsData?.totalEvents || 0}
        topPage={topData?.topPages?.[0]?.path || null}
      />

      <PageActivityDailyChart daily={statsData?.daily || []} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <PageActivityTopPagesTable title="Top pages (zone filtrée)" rows={topData?.topPages || []} />
        <PageActivityTopPagesTable title="Top pages Public" rows={topData?.topPublicPages || []} />
        <PageActivityTopPagesTable title="Top pages Admin" rows={topData?.topAdminPages || []} />
      </div>

      <PageActivityHistoryTable loading={loading} rows={historyData?.rows || []} />

      <div className="flex items-center justify-between rounded-lg border border-[#2a2a2d] bg-[#1a1a1d] px-4 py-3 text-sm">
        <span className="text-gray-400">
          Page {historyData?.page || page} / {totalPages} · {historyData?.total || 0} ligne(s) agrégée(s)
        </span>
        <div className="flex items-center gap-2">
          <select
            value={limit}
            onChange={(event) => {
              setLimit(Number(event.target.value));
              setPage(1);
            }}
            className="rounded border border-[#303038] bg-[#111114] px-2 py-1 text-xs text-white"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <button
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page <= 1 || loading}
            className="rounded border border-[#303038] bg-[#111114] px-3 py-1 text-gray-200 disabled:opacity-40"
          >
            Précédent
          </button>
          <button
            onClick={() => setPage((prev) => (prev < totalPages ? prev + 1 : prev))}
            disabled={page >= totalPages || loading}
            className="rounded border border-[#303038] bg-[#111114] px-3 py-1 text-gray-200 disabled:opacity-40"
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  );
}
