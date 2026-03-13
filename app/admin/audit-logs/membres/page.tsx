"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { periodToDateRange } from "@/lib/ui/loginLogsUi";

type Period = "today" | "7d" | "30d";

interface DailyEntry {
  label: string;
  count: number;
  type: "member" | "unknown_visitor";
}

interface DailyGroup {
  date: string;
  totalConnections: number;
  membersCount: number;
  unknownVisitorsConnections: number;
  entries: DailyEntry[];
}

interface DailyMembersResponse {
  days: DailyGroup[];
  totalDays: number;
  totalConnections: number;
}

interface CountryMapItem {
  country: string;
  countryCode: string;
}

export default function AuditLogsMembersPage() {
  const [period, setPeriod] = useState<Period>("7d");
  const [country, setCountry] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DailyMembersResponse | null>(null);
  const [countries, setCountries] = useState<CountryMapItem[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const range = periodToDateRange(period);
        const params = new URLSearchParams();
        params.set("startDate", range.startDate);
        params.set("endDate", range.endDate);
        if (country) params.set("country", country);

        const [dailyRes, mapRes] = await Promise.all([
          fetch(`/api/admin/login-logs/members-daily?${params.toString()}`, { cache: "no-store" }),
          fetch(`/api/admin/login-logs/map?startDate=${range.startDate}&endDate=${range.endDate}`, { cache: "no-store" }),
        ]);

        if (!dailyRes.ok || !mapRes.ok) {
          throw new Error("Impossible de charger les logs membres.");
        }

        const [dailyPayload, mapPayload] = await Promise.all([
          dailyRes.json() as Promise<DailyMembersResponse>,
          mapRes.json() as Promise<Array<{ country: string; countryCode: string }>>,
        ]);

        setData(dailyPayload);
        setCountries(
          mapPayload
            .map((item) => ({ country: item.country, countryCode: item.countryCode }))
            .sort((a, b) => a.country.localeCompare(b.country))
        );
      } catch (err) {
        console.error("[audit-logs/membres]", err);
        setError("Erreur lors du chargement des logs membres.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [period, country]);

  const totals = useMemo(() => {
    const groups = data?.days || [];
    return {
      totalMembersListed: groups.reduce((sum, day) => sum + day.membersCount, 0),
      totalUnknownVisitors: groups.reduce((sum, day) => sum + day.unknownVisitorsConnections, 0),
    };
  }, [data]);

  return (
    <div className="space-y-6 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/audit-logs" className="text-sm text-gray-400 transition-colors hover:text-white">
            ← Audit & Logs
          </Link>
          <h1 className="mt-2 text-3xl font-bold">Logs membres (par jour)</h1>
          <p className="text-sm text-gray-400">
            Liste journaliere des membres connectes, avec regroupement des visiteurs inconnus.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-lg border border-[#2a2a2d] bg-[#1a1a1d] p-4 md:grid-cols-3">
        <select
          value={period}
          onChange={(event) => setPeriod(event.target.value as Period)}
          className="rounded-lg border border-[#303038] bg-[#111114] px-3 py-2 text-sm text-white"
        >
          <option value="today">Aujourd hui</option>
          <option value="7d">7 jours</option>
          <option value="30d">30 jours</option>
        </select>

        <select
          value={country}
          onChange={(event) => setCountry(event.target.value)}
          className="rounded-lg border border-[#303038] bg-[#111114] px-3 py-2 text-sm text-white"
        >
          <option value="">Tous les pays</option>
          {countries.map((entry) => (
            <option key={entry.countryCode} value={entry.countryCode}>
              {entry.country}
            </option>
          ))}
        </select>

        <button
          onClick={() => {
            setPeriod("7d");
            setCountry("");
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
          <p className="text-sm text-gray-400">Jours avec connexions</p>
          <p className="mt-1 text-3xl font-bold">{data?.totalDays ?? 0}</p>
        </div>
        <div className="rounded-lg border border-[#2a2a2d] bg-[#1a1a1d] p-4">
          <p className="text-sm text-gray-400">Connexions totales</p>
          <p className="mt-1 text-3xl font-bold">{data?.totalConnections ?? 0}</p>
        </div>
        <div className="rounded-lg border border-[#2a2a2d] bg-[#1a1a1d] p-4">
          <p className="text-sm text-gray-400">Membres listes</p>
          <p className="mt-1 text-3xl font-bold text-indigo-300">{totals.totalMembersListed}</p>
        </div>
        <div className="rounded-lg border border-[#2a2a2d] bg-[#1a1a1d] p-4">
          <p className="text-sm text-gray-400">Visiteurs inconnus (connexions)</p>
          <p className="mt-1 text-3xl font-bold text-emerald-300">{totals.totalUnknownVisitors}</p>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="rounded-lg border border-[#2a2a2d] bg-[#1a1a1d] p-6 text-sm text-gray-400">Chargement...</div>
        ) : (data?.days || []).length === 0 ? (
          <div className="rounded-lg border border-[#2a2a2d] bg-[#1a1a1d] p-6 text-sm text-gray-400">
            Aucun log trouve sur cette periode.
          </div>
        ) : (
          (data?.days || []).map((day) => (
            <div key={day.date} className="overflow-hidden rounded-lg border border-[#2a2a2d] bg-[#1a1a1d]">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2a2a2d] bg-[#121216] px-4 py-3">
                <p className="font-semibold">{new Date(day.date).toLocaleDateString("fr-FR")}</p>
                <div className="flex flex-wrap gap-2 text-xs text-gray-300">
                  <span className="rounded bg-[#23232b] px-2 py-1">Connexions: {day.totalConnections}</span>
                  <span className="rounded bg-[#23232b] px-2 py-1">Membres: {day.membersCount}</span>
                  <span className="rounded bg-[#23232b] px-2 py-1">
                    Visiteur inconnu: {day.unknownVisitorsConnections}
                  </span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-gray-400">
                      <th className="px-4 py-3">Nom</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Connexions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {day.entries.map((entry) => (
                      <tr key={`${day.date}-${entry.label}`} className="border-t border-[#26262c] text-gray-200">
                        <td className="px-4 py-3">{entry.label}</td>
                        <td className="px-4 py-3">
                          {entry.type === "member" ? (
                            <span className="rounded bg-indigo-500/20 px-2 py-1 text-xs text-indigo-200">Membre</span>
                          ) : (
                            <span className="rounded bg-emerald-500/20 px-2 py-1 text-xs text-emerald-200">
                              Visiteur inconnu
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-semibold">{entry.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
