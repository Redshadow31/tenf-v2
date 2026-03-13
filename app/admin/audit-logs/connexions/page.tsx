"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
  return value === "discord" ? "Membre Discord" : "Visiteur general";
}

function formatGeoLabel(row: LoginLogRow): string {
  if (row.country) return row.country;
  if (row.countryCode) return row.countryCode;
  if (row.geoStatus === "missing_ip") return "IP indisponible";
  if (row.geoStatus === "private_ip" || row.geoStatus === "proxy_ip_only") return "Proxy / non localisable";
  if (row.geoStatus === "old_log_without_enrichment") return "Inconnu (ancien log)";
  return "Inconnu";
}

export default function ConnectionLogsPage() {
  const [tab, setTab] = useState<ScopeTab>("members");
  const [period, setPeriod] = useState<Period>("7d");
  const [country, setCountry] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [connectionType, setConnectionType] = useState<ConnectionType>("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [logsData, setLogsData] = useState<LoginLogsResponse | null>(null);
  const [statsData, setStatsData] = useState<LoginStatsResponse | null>(null);
  const [mapData, setMapData] = useState<LoginMapItem[]>([]);
  const [realtimeData, setRealtimeData] = useState<LoginRealtimeResponse | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const range = periodToDateRange(period);
        const effectiveConnectionType =
          tab === "members" ? "discord" : connectionType === "all" ? undefined : connectionType;
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(limit));
        params.set("startDate", range.startDate);
        params.set("endDate", range.endDate);
        if (country) params.set("country", country);
        if (selectedUserId) params.set("userId", selectedUserId);
        if (memberSearch) params.set("userSearch", memberSearch);
        if (effectiveConnectionType) params.set("connectionType", effectiveConnectionType);

        const statsParams = new URLSearchParams();
        statsParams.set("startDate", range.startDate);
        statsParams.set("endDate", range.endDate);
        if (country) statsParams.set("country", country);
        if (selectedUserId) statsParams.set("userId", selectedUserId);
        if (effectiveConnectionType) statsParams.set("connectionType", effectiveConnectionType);

        const [logsRes, statsRes, mapRes, realtimeRes] = await Promise.all([
          fetch(`/api/admin/login-logs?${params.toString()}`, { cache: "no-store" }),
          fetch(`/api/admin/login-logs/stats?${statsParams.toString()}`, { cache: "no-store" }),
          fetch(`/api/admin/login-logs/map?${statsParams.toString()}`, { cache: "no-store" }),
          fetch("/api/admin/login-logs/realtime", { cache: "no-store" }),
        ]);

        if (!logsRes.ok || !statsRes.ok || !mapRes.ok || !realtimeRes.ok) {
          throw new Error("Impossible de charger les logs de connexion.");
        }

        const [logsPayload, statsPayload, mapPayload, realtimePayload] = await Promise.all([
          logsRes.json() as Promise<LoginLogsResponse>,
          statsRes.json() as Promise<LoginStatsResponse>,
          mapRes.json() as Promise<LoginMapItem[]>,
          realtimeRes.json() as Promise<LoginRealtimeResponse>,
        ]);

        setLogsData(logsPayload);
        setStatsData(statsPayload);
        setMapData(mapPayload);
        setRealtimeData(realtimePayload);
      } catch (error) {
        console.error("[audit-logs/connexions]", error);
        setError("Erreur lors du chargement des donnees.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [tab, period, country, selectedUserId, memberSearch, connectionType, page, limit]);

  const countryOptions = useMemo(
    () =>
      mapData
        .map((entry) => ({ code: entry.countryCode, name: entry.country }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [mapData]
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

  return (
    <div className="space-y-6 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/audit-logs" className="text-sm text-gray-400 transition-colors hover:text-white">
            ← Audit & Logs
          </Link>
          <h1 className="mt-2 text-3xl font-bold">Logs de connexion</h1>
          <p className="text-sm text-gray-400">
            Historique des connexions, carte mondiale, volume horaire et sessions actives.
          </p>
        </div>
        <div className="rounded-lg border border-[#2a2a2d] bg-[#17171a] px-3 py-2 text-xs text-gray-300">
          Conservation automatique: 30 jours
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setTab("members")}
          disabled={loading}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${
            tab === "members" ? "bg-[#9146ff] text-white" : "bg-[#1a1a1d] text-gray-300 hover:text-white"
          }`}
        >
          Membres
        </button>
        <button
          onClick={() => setTab("general")}
          disabled={loading}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${
            tab === "general" ? "bg-[#9146ff] text-white" : "bg-[#1a1a1d] text-gray-300 hover:text-white"
          }`}
        >
          Général
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-lg border border-[#2a2a2d] bg-[#1a1a1d] p-4 lg:grid-cols-6">
        <select
          value={period}
          onChange={(event) => {
            setPeriod(event.target.value as Period);
            setPage(1);
          }}
          className="rounded-lg border border-[#303038] bg-[#111114] px-3 py-2 text-sm text-white"
        >
          <option value="today">Aujourd hui</option>
          <option value="7d">7 jours</option>
          <option value="30d">30 jours</option>
        </select>

        <select
          value={country}
          onChange={(event) => {
            setCountry(event.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-[#303038] bg-[#111114] px-3 py-2 text-sm text-white"
        >
          <option value="">Tous les pays</option>
          {countryOptions.map((entry) => (
            <option key={entry.code} value={entry.code}>
              {entry.name}
            </option>
          ))}
        </select>

        <select
          value={selectedUserId}
          onChange={(event) => {
            setSelectedUserId(event.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-[#303038] bg-[#111114] px-3 py-2 text-sm text-white"
        >
          <option value="">Tous les membres</option>
          {memberOptions.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.name}
            </option>
          ))}
        </select>

        <input
          value={memberSearch}
          onChange={(event) => {
            setMemberSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Recherche membre (pseudo / ID)"
          className="rounded-lg border border-[#303038] bg-[#111114] px-3 py-2 text-sm text-white placeholder:text-gray-500"
        />

        <select
          value={connectionType}
          onChange={(event) => {
            setConnectionType(event.target.value as ConnectionType);
            setPage(1);
          }}
          disabled={tab === "members"}
          className="rounded-lg border border-[#303038] bg-[#111114] px-3 py-2 text-sm text-white"
        >
          <option value="all">Tous les types</option>
          <option value="discord">Membres Discord</option>
          <option value="guest">Visiteurs généraux</option>
        </select>

        <button
          onClick={() => {
            setCountry("");
            setSelectedUserId("");
            setMemberSearch("");
            setConnectionType("all");
            setPeriod("7d");
            setPage(1);
          }}
          className="rounded-lg border border-[#303038] bg-[#111114] px-3 py-2 text-sm text-gray-200 transition-colors hover:border-[#9146ff]"
        >
          Reinitialiser
        </button>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-sm text-red-200">{error}</p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-[#2a2a2d] bg-[#1a1a1d] p-4">
          <p className="text-sm text-gray-400">Connexions totales</p>
          <p className="mt-1 text-3xl font-bold">{statsData?.totalConnections ?? 0}</p>
        </div>
        <div className="rounded-lg border border-[#2a2a2d] bg-[#1a1a1d] p-4">
          <p className="text-sm text-gray-400">Membres Discord</p>
          <p className="mt-1 text-3xl font-bold text-indigo-300">{statsData?.memberConnections ?? 0}</p>
        </div>
        <div className="rounded-lg border border-[#2a2a2d] bg-[#1a1a1d] p-4">
          <p className="text-sm text-gray-400">Visiteurs généraux</p>
          <p className="mt-1 text-3xl font-bold text-emerald-300">{statsData?.guestConnections ?? 0}</p>
        </div>
        <div className="rounded-lg border border-[#2a2a2d] bg-[#1a1a1d] p-4">
          <p className="text-sm text-gray-400">Connexions actives</p>
          <p className="mt-1 text-3xl font-bold text-cyan-300">{realtimeData?.totalActiveConnections ?? 0}</p>
        </div>
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

      <div className="rounded-lg border border-[#2a2a2d] bg-[#1a1a1d] p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Connexions par heure (0-23h)</h3>
          <span className="text-xs text-gray-400">Periode: {period}</span>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statsData?.hourlyConnections || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#32323a" />
              <XAxis dataKey="hour" stroke="#9ca3af" tickLine={false} />
              <YAxis stroke="#9ca3af" tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#121218", border: "1px solid #2a2a2d", borderRadius: 8 }}
                formatter={(value) => [`${value} connexion(s)`, "Volume"]}
                labelFormatter={(label) => `${label}h`}
              />
              <Bar dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#2a2a2d] bg-[#1a1a1d]">
        <div className="border-b border-[#2a2a2d] px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-semibold">Listing paginé des connexions</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Lignes / page</span>
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
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-[#121216] text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="px-4 py-3">Date/Heure</th>
                <th className="px-4 py-3">Utilisateur</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Pays</th>
                <th className="px-4 py-3">Region/Ville</th>
                <th className="px-4 py-3">Appareil</th>
                <th className="px-4 py-3">Navigateur</th>
                <th className="px-4 py-3">OS</th>
                <th className="px-4 py-3">IP</th>
                <th className="px-4 py-3">Derniere activite</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-center text-gray-400" colSpan={10}>
                    Chargement...
                  </td>
                </tr>
              ) : (logsData?.logs || []).length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-gray-400" colSpan={10}>
                    Aucun log sur cette periode.
                  </td>
                </tr>
              ) : (
                (logsData?.logs || []).map((row, index) => (
                  <tr key={`${row.userId || "guest"}-${row.date}-${index}`} className="border-t border-[#26262c] text-gray-200">
                    <td className="px-4 py-3">{new Date(row.date).toLocaleString("fr-FR")}</td>
                    <td className="px-4 py-3">
                      {row.username || row.userId || <span className="text-gray-500">Visiteur anonyme</span>}
                    </td>
                    <td className="px-4 py-3">{formatConnectionType(row.connectionType)}</td>
                    <td className="px-4 py-3">{formatGeoLabel(row)}</td>
                    <td className="px-4 py-3">
                      {[row.region, row.city].filter(Boolean).join(" / ") || <span className="text-gray-500">N/A</span>}
                    </td>
                    <td className="px-4 py-3">{row.deviceType || "N/A"}</td>
                    <td className="px-4 py-3">{row.browser || "N/A"}</td>
                    <td className="px-4 py-3">{row.os || "N/A"}</td>
                    <td className="px-4 py-3">{row.ipMasked || "Masquee"}</td>
                    <td className="px-4 py-3">{new Date(row.lastSeenAt).toLocaleString("fr-FR")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-[#2a2a2d] px-4 py-3 text-sm">
          <span className="text-gray-400">
            Page {logsData?.page || page} / {totalPages} · {logsData?.total || 0} resultat(s)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page <= 1 || loading}
              className="rounded border border-[#303038] bg-[#111114] px-3 py-1 text-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Précédent
            </button>
            <button
              onClick={() => setPage((prev) => (prev < totalPages ? prev + 1 : prev))}
              disabled={page >= totalPages || loading}
              className="rounded border border-[#303038] bg-[#111114] px-3 py-1 text-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Suivant
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
