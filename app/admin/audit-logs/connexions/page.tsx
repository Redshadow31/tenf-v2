"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Activity,
  BarChart3,
  Filter,
  Globe2,
  RotateCcw,
  Shield,
  Users,
  Zap,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
} from "recharts";
import WorldConnectionsMap from "@/components/admin/WorldConnectionsMap";
import {
  ALI,
  REALTIME_ACTIVE_MINUTES,
  chartTooltipStyle,
  kpiAccentColors,
  kpiValueAccent,
} from "@/components/admin/audit-logs/auditLogsUi";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { periodToDateRange } from "@/lib/ui/loginLogsUi";

type ScopeTab = "members" | "general";
type Period = "today" | "7d" | "30d";
type ConnectionType = "all" | "discord" | "guest";

interface LoginLogRow {
  date: string;
  username: string | null;
  userId: string | null;
  connectionType: "discord" | "guest";
  country: string | null;
  countryCode: string | null;
  geoStatus: string | null;
  geoReason: string | null;
  region: string | null;
  city: string | null;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
  ipMasked: string | null;
  lastSeenAt: string;
}

interface LoginLogsResponse {
  page: number;
  limit: number;
  total: number;
  logs: LoginLogRow[];
}

interface LoginStatsResponse {
  totalConnections: number;
  memberConnections: number;
  guestConnections: number;
  hourlyConnections: Array<{ hour: number; count: number }>;
}

interface LoginMapItem {
  country: string;
  countryCode: string;
  latitude: number | null;
  longitude: number | null;
  connections: number;
}

interface LoginRealtimeResponse {
  totalActiveConnections: number;
}

function formatConnectionType(value: "discord" | "guest"): string {
  return value === "discord" ? "Membre Discord" : "Visiteur général";
}

function ConnectionTypeBadge({ type }: { type: "discord" | "guest" }) {
  return (
    <span className={type === "discord" ? ALI.typeBadgeDiscord : ALI.typeBadgeGuest}>
      {formatConnectionType(type)}
    </span>
  );
}

function formatGeoLabel(row: LoginLogRow): string {
  if (row.country) return row.country;
  if (row.countryCode) return row.countryCode;
  if (row.geoStatus === "missing_ip") return "IP indisponible";
  if (row.geoStatus === "private_ip" || row.geoStatus === "proxy_ip_only") return "Proxy / non localisable";
  if (row.geoStatus === "old_log_without_enrichment") return "Inconnu (ancien log)";
  return "Inconnu";
}

function KpiCard({
  label,
  value,
  hint,
  accent,
  iconClass,
  icon,
  footer,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent: keyof typeof kpiAccentColors;
  iconClass: string;
  icon: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <article className={ALI.kpiCard}>
      <span className={`${ALI.kpiAccentBar} ${kpiAccentColors[accent]}`} aria-hidden />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-medium ${ALI.textMuted}`}>{label}</p>
          <p
            className={`mt-1 font-bold tabular-nums tracking-tight ${kpiValueAccent[accent]}`}
            style={{ fontSize: "clamp(1.5rem, 2.4vw, 2rem)" }}
          >
            {value}
          </p>
          {hint ? <p className={`mt-1 text-xs ${ALI.textMuted}`}>{hint}</p> : null}
          {footer}
        </div>
        <span className={`${ALI.iconBox} ${iconClass}`} aria-hidden>
          {icon}
        </span>
      </div>
    </article>
  );
}

export default function ConnectionLogsPage() {
  const [tab, setTab] = useState<ScopeTab>("members");
  const [period, setPeriod] = useState<Period>("7d");
  const [country, setCountry] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const debouncedMemberSearch = useDebouncedValue(memberSearch, 350);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [connectionType, setConnectionType] = useState<ConnectionType>("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [realtimeLoading, setRealtimeLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [logsData, setLogsData] = useState<LoginLogsResponse | null>(null);
  const [statsData, setStatsData] = useState<LoginStatsResponse | null>(null);
  const [mapData, setMapData] = useState<LoginMapItem[]>([]);
  const [realtimeData, setRealtimeData] = useState<LoginRealtimeResponse | null>(null);

  const effectiveConnectionType = useMemo(
    () => (tab === "members" ? "discord" : connectionType === "all" ? undefined : connectionType),
    [tab, connectionType],
  );

  useEffect(() => {
    let cancelled = false;
    const loadRealtime = async () => {
      setRealtimeLoading(true);
      try {
        const res = await fetch("/api/admin/login-logs/realtime", { cache: "no-store" });
        if (!res.ok) throw new Error("realtime");
        const payload = (await res.json()) as LoginRealtimeResponse;
        if (!cancelled) setRealtimeData(payload);
      } catch {
        if (!cancelled) setRealtimeData(null);
      } finally {
        if (!cancelled) setRealtimeLoading(false);
      }
    };
    void loadRealtime();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadHistory = async () => {
      setHistoryLoading(true);
      setError(null);
      try {
        const range = periodToDateRange(period);
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(limit));
        params.set("startDate", range.startDate);
        params.set("endDate", range.endDate);
        if (country) params.set("country", country);
        if (selectedUserId) params.set("userId", selectedUserId);
        if (debouncedMemberSearch) params.set("userSearch", debouncedMemberSearch);
        if (effectiveConnectionType) params.set("connectionType", effectiveConnectionType);

        const statsParams = new URLSearchParams();
        statsParams.set("startDate", range.startDate);
        statsParams.set("endDate", range.endDate);
        if (country) statsParams.set("country", country);
        if (selectedUserId) statsParams.set("userId", selectedUserId);
        if (effectiveConnectionType) statsParams.set("connectionType", effectiveConnectionType);

        const [logsRes, statsRes, mapRes] = await Promise.all([
          fetch(`/api/admin/login-logs?${params.toString()}`, { cache: "no-store" }),
          fetch(`/api/admin/login-logs/stats?${statsParams.toString()}`, { cache: "no-store" }),
          fetch(`/api/admin/login-logs/map?${statsParams.toString()}`, { cache: "no-store" }),
        ]);

        if (!logsRes.ok || !statsRes.ok || !mapRes.ok) {
          throw new Error("Impossible de charger les logs de connexion.");
        }

        const [logsPayload, statsPayload, mapPayload] = await Promise.all([
          logsRes.json() as Promise<LoginLogsResponse>,
          statsRes.json() as Promise<LoginStatsResponse>,
          mapRes.json() as Promise<LoginMapItem[]>,
        ]);

        if (!cancelled) {
          setLogsData(logsPayload);
          setStatsData(statsPayload);
          setMapData(mapPayload);
        }
      } catch (err) {
        console.error("[audit-logs/connexions]", err);
        if (!cancelled) setError("Erreur lors du chargement des données.");
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    };

    void loadHistory();
    return () => {
      cancelled = true;
    };
  }, [tab, period, country, selectedUserId, debouncedMemberSearch, effectiveConnectionType, page, limit]);

  const countryOptions = useMemo(
    () =>
      mapData
        .map((entry) => ({ code: entry.countryCode, name: entry.country }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [mapData],
  );

  const memberOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of logsData?.logs || []) {
      if (!row.userId) continue;
      map.set(row.userId, row.username || row.userId);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [logsData]);

  const totalPages = logsData ? Math.max(1, Math.ceil(logsData.total / logsData.limit)) : 1;
  const tableLoading = historyLoading;
  const isEmpty = !tableLoading && (logsData?.logs || []).length === 0;

  const resetFilters = useCallback(() => {
    setCountry("");
    setSelectedUserId("");
    setMemberSearch("");
    setConnectionType("all");
    setPeriod("7d");
    setPage(1);
  }, []);

  const periodLabel =
    period === "today" ? "Aujourd'hui" : period === "7d" ? "7 jours" : "30 jours";

  const activeFilterCount = [
    country,
    selectedUserId,
    debouncedMemberSearch,
    tab === "general" && connectionType !== "all",
    period !== "7d",
  ].filter(Boolean).length;

  const memberSharePct = useMemo(() => {
    const total = statsData?.totalConnections ?? 0;
    if (!total) return null;
    return Math.round(((statsData?.memberConnections ?? 0) / total) * 100);
  }, [statsData]);

  return (
    <div className={`${ALI.pageWrap} space-y-[clamp(0.9rem,1.35vw,1.6rem)] ${ALI.text}`}>
      <header className={ALI.heroCard}>
        <div className={ALI.heroMesh} aria-hidden>
          <div
            className="absolute -right-16 -top-20 h-56 w-56 rounded-full opacity-40 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, color-mix(in srgb, var(--color-primary) 55%, transparent), transparent 70%)",
            }}
          />
          <div
            className="absolute -bottom-24 left-8 h-48 w-48 rounded-full opacity-30 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, color-mix(in srgb, #06b6d4 40%, transparent), transparent 70%)",
            }}
          />
        </div>
        <div
          className="relative flex flex-wrap items-start justify-between gap-4"
          style={{ padding: "clamp(1rem, 1.5vw, 1.35rem) clamp(1rem, 1.5vw, 1.5rem)" }}
        >
        <div className="min-w-0">
          <Link href="/admin/audit-logs" className={ALI.link}>
            ← Audit & Logs
          </Link>
          <p className={`mt-3 ${ALI.sectionLabel}`}>Observabilité</p>
          <h1
            className="mt-1 font-bold tracking-tight"
            style={{ fontSize: "clamp(1.45rem, 2.2vw, 2rem)" }}
          >
            Logs de connexion
          </h1>
          <p className={`mt-2 max-w-2xl text-sm leading-relaxed ${ALI.textSecondary}`}>
            Historique des connexions, répartition géographique, volume horaire et sessions actives.
          </p>
        </div>
        <div className="flex flex-wrap items-end justify-end gap-2 sm:flex-col">
          <span className={ALI.badge}>
            <Shield className="mr-1.5 inline h-3 w-3 opacity-80" aria-hidden />
            Conservation : 30 jours
          </span>
          <div className={ALI.heroStat}>
            <p className={`text-[10px] font-bold uppercase tracking-wider ${ALI.textMuted}`}>
              Sessions actives
            </p>
            <p className="mt-0.5 flex items-center justify-end gap-2 text-lg font-bold tabular-nums text-cyan-700 dark:text-cyan-300">
              {!realtimeLoading && (realtimeData?.totalActiveConnections ?? 0) > 0 ? (
                <span className={ALI.pulseDot} aria-hidden />
              ) : null}
              {realtimeLoading ? "—" : (realtimeData?.totalActiveConnections ?? 0)}
            </p>
          </div>
          <Link
            href="/admin/audit-logs/temps-reel"
            className="inline-flex items-center gap-1.5 rounded-xl border border-violet-400/35 bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-card))] px-3 py-2 text-xs font-semibold text-violet-700 shadow-[0_4px_14px_color-mix(in_srgb,var(--color-primary)_18%,transparent)] transition hover:border-violet-400/55 hover:shadow-[0_6px_18px_color-mix(in_srgb,var(--color-primary)_22%,transparent)] dark:text-violet-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/60"
          >
            <Zap className="h-3.5 w-3.5" aria-hidden />
            Temps réel
          </Link>
        </div>
        </div>
      </header>

      <section className={`overflow-hidden ${ALI.card}`} aria-label="Audience et filtres">
        <div
          className={`flex flex-wrap items-center justify-between gap-3 ${ALI.panelHeader}`}
          style={{ padding: "clamp(0.65rem, 1vw, 0.85rem) clamp(0.85rem, 1vw, 1.1rem)" }}
        >
          <div className="flex items-center gap-2">
            <span className={`${ALI.iconBox} ${ALI.iconViolet}`} aria-hidden>
              <Filter className="h-4 w-4" />
            </span>
            <div>
              <p className={ALI.sectionLabel}>Filtres</p>
              <p className={`text-sm font-semibold ${ALI.text}`}>
                {activeFilterCount > 0
                  ? `${activeFilterCount} filtre${activeFilterCount > 1 ? "s" : ""} actif${activeFilterCount > 1 ? "s" : ""}`
                  : "Critères par défaut"}
              </p>
            </div>
          </div>
          <div role="group" aria-label="Filtrer par audience" className="flex flex-wrap gap-2">
            {(["members", "general"] as const).map((scope) => {
              const pressed = tab === scope;
              return (
                <button
                  key={scope}
                  type="button"
                  aria-pressed={pressed}
                  onClick={() => {
                    setTab(scope);
                    setPage(1);
                  }}
                  className={
                    "transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/60 " +
                    (pressed ? ALI.scopeActive : ALI.scopeIdle)
                  }
                >
                  {scope === "members" ? "Membres" : "Général"}
                </button>
              );
            })}
          </div>
        </div>

        <div
          className="grid grid-cols-1 gap-[clamp(0.5rem,0.75vw,0.75rem)] p-[clamp(0.75rem,1vw,1rem)] sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6"
          aria-label="Filtres de recherche"
        >
        <label className="min-w-0 space-y-1">
          <span className={`block text-[11px] font-semibold uppercase tracking-wide ${ALI.textMuted}`}>
            Période
          </span>
          <select
            value={period}
            onChange={(event) => {
              setPeriod(event.target.value as Period);
              setPage(1);
            }}
            className={ALI.input}
          >
            <option value="today">Aujourd&apos;hui</option>
            <option value="7d">7 jours</option>
            <option value="30d">30 jours</option>
          </select>
        </label>

        <label className="min-w-0 space-y-1">
          <span className={`block text-[11px] font-semibold uppercase tracking-wide ${ALI.textMuted}`}>
            Pays
          </span>
          <select
            value={country}
            onChange={(event) => {
              setCountry(event.target.value);
              setPage(1);
            }}
            className={ALI.input}
          >
            <option value="">Tous les pays</option>
            {countryOptions.map((entry) => (
              <option key={entry.code} value={entry.code}>
                {entry.name}
              </option>
            ))}
          </select>
        </label>

        <label className="min-w-0 space-y-1">
          <span className={`block text-[11px] font-semibold uppercase tracking-wide ${ALI.textMuted}`}>
            Membre
          </span>
          <select
            value={selectedUserId}
            onChange={(event) => {
              setSelectedUserId(event.target.value);
              setPage(1);
            }}
            className={ALI.input}
          >
            <option value="">Tous les membres</option>
            {memberOptions.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </select>
        </label>

        <label className="min-w-0 space-y-1 sm:col-span-2 md:col-span-1">
          <span className={`block text-[11px] font-semibold uppercase tracking-wide ${ALI.textMuted}`}>
            Recherche
          </span>
          <input
            value={memberSearch}
            onChange={(event) => {
              setMemberSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Pseudo ou ID"
            className={`${ALI.input} ${ALI.inputPlaceholder}`}
            aria-describedby="member-search-hint"
          />
          <span id="member-search-hint" className={`sr-only`}>
            Recherche avec délai de 350 ms
          </span>
        </label>

        {tab === "general" ? (
          <label className="min-w-0 space-y-1">
            <span className={`block text-[11px] font-semibold uppercase tracking-wide ${ALI.textMuted}`}>
              Type
            </span>
            <select
              value={connectionType}
              onChange={(event) => {
                setConnectionType(event.target.value as ConnectionType);
                setPage(1);
              }}
              className={ALI.input}
            >
              <option value="all">Tous les types</option>
              <option value="discord">Membres Discord</option>
              <option value="guest">Visiteurs généraux</option>
            </select>
          </label>
        ) : (
          <div className="flex min-h-[2.5rem] flex-col justify-end space-y-1">
            <span className={`block text-[11px] font-semibold uppercase tracking-wide ${ALI.textMuted}`}>
              Type
            </span>
            <p
              className={`rounded-lg border border-dashed border-[var(--color-border)] px-3 py-2 text-sm ${ALI.textSecondary}`}
              style={{ backgroundColor: "color-mix(in srgb, var(--color-text) 3%, var(--color-card))" }}
            >
              Membres Discord uniquement
            </p>
          </div>
        )}

        <div className="flex flex-col justify-end sm:col-span-2 md:col-span-1 xl:col-span-1">
          <button type="button" onClick={resetFilters} className={`${ALI.btnSecondary} inline-flex items-center justify-center gap-2`}>
            <RotateCcw className="h-4 w-4 opacity-70" aria-hidden />
            Réinitialiser
          </button>
        </div>
        </div>
      </section>

      {error ? (
        <div className={ALI.alertError} role="alert">
          <p>{error}</p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-[clamp(0.65rem,1vw,1rem)] sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Connexions totales"
          value={historyLoading ? "—" : (statsData?.totalConnections ?? 0)}
          hint={`Période : ${periodLabel}`}
          accent="default"
          iconClass={ALI.iconViolet}
          icon={<BarChart3 className="h-4 w-4" />}
        />
        <KpiCard
          label="Membres Discord"
          value={historyLoading ? "—" : (statsData?.memberConnections ?? 0)}
          hint={memberSharePct != null ? `${memberSharePct} % du volume` : undefined}
          accent="indigo"
          iconClass={ALI.iconIndigo}
          icon={<Users className="h-4 w-4" />}
        />
        <KpiCard
          label="Visiteurs généraux"
          value={historyLoading ? "—" : (statsData?.guestConnections ?? 0)}
          accent="emerald"
          iconClass={ALI.iconEmerald}
          icon={<Globe2 className="h-4 w-4" />}
        />
        <KpiCard
          label="Actives maintenant"
          value={realtimeLoading ? "—" : (realtimeData?.totalActiveConnections ?? 0)}
          hint={`Temps réel · actif < ${REALTIME_ACTIVE_MINUTES} min`}
          accent="cyan"
          iconClass={ALI.iconCyan}
          icon={<Zap className="h-4 w-4" />}
          footer={
            <Link
              href="/admin/audit-logs/temps-reel"
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-violet-600 underline-offset-2 hover:underline dark:text-violet-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/60"
            >
              Voir le temps réel
              <Zap className="h-3 w-3" aria-hidden />
            </Link>
          }
        />
      </div>

      <WorldConnectionsMap
        countries={mapData.map((entry) => ({
          countryCode: entry.countryCode,
          countryName: entry.country,
          count: entry.connections,
        }))}
        selectedCountry={country || undefined}
        onCountryClick={(countryCode) => {
          setCountry(countryCode === country ? "" : countryCode);
          setPage(1);
        }}
      />

      <section className={`overflow-hidden ${ALI.card}`} aria-labelledby="hourly-chart-title">
        <header
          className={`flex flex-wrap items-center justify-between gap-3 ${ALI.panelHeader}`}
          style={{ padding: "clamp(0.75rem, 1vw, 1rem) clamp(0.85rem, 1vw, 1.1rem)" }}
        >
          <div className="flex items-center gap-2">
            <span className={`${ALI.iconBox} ${ALI.iconViolet}`} aria-hidden>
              <BarChart3 className="h-4 w-4" />
            </span>
            <div>
              <p className={ALI.sectionLabel}>Volume</p>
              <h3 id="hourly-chart-title" className={`text-lg font-bold ${ALI.text}`}>
                Connexions par heure (0–23h)
              </h3>
            </div>
          </div>
          <span className={ALI.badge}>Période : {periodLabel}</span>
        </header>
        <div className="p-[clamp(0.75rem,1vw,1rem)]">
          <div className={`${ALI.chartWrap} h-72 min-h-[12rem]`}>
            {historyLoading ? (
              <p className={`flex h-full items-center justify-center text-sm ${ALI.textMuted}`}>
                Chargement du graphique…
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statsData?.hourlyConnections || []}>
                  <defs>
                    <linearGradient id="connexionsBarFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a78bfa" />
                      <stop offset="100%" stopColor="#5b21b6" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="hour" stroke="var(--color-text-muted)" tickLine={false} />
                  <YAxis stroke="var(--color-text-muted)" tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={chartTooltipStyle}
                    formatter={(value) => [`${value} connexion(s)`, "Volume"]}
                    labelFormatter={(label) => `${label}h`}
                  />
                  <Bar dataKey="count" fill="url(#connexionsBarFill)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>

      <section className={`overflow-hidden ${ALI.card}`} aria-labelledby="logs-table-title">
        <div className={`${ALI.panelHeader} px-4 py-3`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className={`${ALI.iconBox} ${ALI.iconIndigo}`} aria-hidden>
                <Activity className="h-4 w-4" />
              </span>
              <div>
                <p className={ALI.sectionLabel}>Journal</p>
                <h3 id="logs-table-title" className={`text-lg font-bold ${ALI.text}`}>
                  Listing paginé des connexions
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs ${ALI.textMuted}`}>Lignes / page</span>
              <select
                value={limit}
                onChange={(event) => {
                  setLimit(Number(event.target.value));
                  setPage(1);
                }}
                className={`rounded border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-card)_88%,var(--color-bg))] px-2 py-1 text-xs ${ALI.text}`}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className={ALI.tableHead}>
                <th scope="col" className="px-4 py-3">
                  Date/heure
                </th>
                <th scope="col" className="px-4 py-3">
                  Utilisateur
                </th>
                <th scope="col" className="px-4 py-3">
                  Type
                </th>
                <th scope="col" className="px-4 py-3">
                  Pays
                </th>
                <th scope="col" className="px-4 py-3">
                  Région / ville
                </th>
                <th scope="col" className="px-4 py-3">
                  Appareil
                </th>
                <th scope="col" className="px-4 py-3">
                  Navigateur
                </th>
                <th scope="col" className="px-4 py-3">
                  OS
                </th>
                <th scope="col" className="px-4 py-3">
                  IP
                </th>
                <th scope="col" className="px-4 py-3">
                  Dernière activité
                </th>
              </tr>
            </thead>
            <tbody>
              {tableLoading ? (
                <tr>
                  <td className={`px-4 py-6 text-center ${ALI.textMuted}`} colSpan={10}>
                    Chargement…
                  </td>
                </tr>
              ) : isEmpty ? (
                <tr>
                  <td className="px-4 py-10" colSpan={10}>
                    <div className={ALI.emptyState}>
                      <span className={`${ALI.iconBox} ${ALI.iconViolet}`} aria-hidden>
                        <Activity className="h-5 w-5" />
                      </span>
                      <p className={`font-semibold ${ALI.text}`}>Aucun log sur cette période</p>
                      <p className={`text-sm ${ALI.textMuted}`}>
                        Essaie une période plus large ou consulte la vue temps réel.
                      </p>
                      <Link
                        href="/admin/audit-logs/temps-reel"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-violet-400/35 bg-[color-mix(in_srgb,var(--color-primary)_10%,var(--color-card))] px-3 py-2 text-sm font-semibold text-violet-700 dark:text-violet-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/60"
                      >
                        <Zap className="h-4 w-4" aria-hidden />
                        Ouvrir le temps réel
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                (logsData?.logs || []).map((row, index) => (
                  <tr key={`${row.userId || "guest"}-${row.date}-${index}`} className={ALI.tableRow}>
                    <td className="px-4 py-3">{new Date(row.date).toLocaleString("fr-FR")}</td>
                    <td className="px-4 py-3">
                      {row.username || row.userId || (
                        <span className={ALI.textMuted}>Visiteur anonyme</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <ConnectionTypeBadge type={row.connectionType} />
                    </td>
                    <td className="px-4 py-3">{formatGeoLabel(row)}</td>
                    <td className="px-4 py-3">
                      {[row.region, row.city].filter(Boolean).join(" / ") || (
                        <span className={ALI.textMuted}>N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{row.deviceType || "N/A"}</td>
                    <td className="px-4 py-3">{row.browser || "N/A"}</td>
                    <td className="px-4 py-3">{row.os || "N/A"}</td>
                    <td className="px-4 py-3">{row.ipMasked || "Masquée"}</td>
                    <td className="px-4 py-3">{new Date(row.lastSeenAt).toLocaleString("fr-FR")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--color-border)] px-4 py-3 text-sm">
          <span className={ALI.textMuted} aria-live="polite" aria-atomic="true">
            Page {logsData?.page || page} / {totalPages} · {logsData?.total ?? 0} résultat(s)
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page <= 1 || tableLoading}
              className={ALI.btnPager}
            >
              Précédent
            </button>
            <button
              type="button"
              onClick={() => setPage((prev) => (prev < totalPages ? prev + 1 : prev))}
              disabled={page >= totalPages || tableLoading}
              className={ALI.btnPager}
            >
              Suivant
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}



