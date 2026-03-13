"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import WorldConnectionsMap from "@/components/admin/WorldConnectionsMap";
import RealtimeStatsCards from "@/components/admin/realtime/RealtimeStatsCards";
import RealtimeCountryDistribution from "@/components/admin/realtime/RealtimeCountryDistribution";
import RealtimeSessionsTable from "@/components/admin/realtime/RealtimeSessionsTable";
import { useRealtimeLoginLogs } from "@/lib/hooks/useRealtimeLoginLogs";

export default function RealtimeConnectionsPage() {
  const [connectionType, setConnectionType] = useState<"all" | "discord" | "guest">("all");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [memberSearch, setMemberSearch] = useState("");

  const { data, loading, error } = useRealtimeLoginLogs(
    {
      connectionType: connectionType === "all" ? undefined : connectionType,
      country: selectedCountry || undefined,
      userSearch: memberSearch || undefined,
    },
    20_000
  );

  const mapCountries = useMemo(
    () =>
      (data?.countries || []).map((country) => ({
        countryCode: country.countryCode,
        countryName: country.country,
        count: country.active,
        members: country.members,
        general: country.guests,
      })),
    [data]
  );

  return (
    <div className="space-y-6 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/audit-logs" className="text-sm text-gray-400 transition-colors hover:text-white">
            ← Audit & Logs
          </Link>
          <h1 className="mt-2 text-3xl font-bold">Temps réel</h1>
          <p className="text-sm text-gray-400">
            Connexions actives (actif si dernière activité &lt; 5 minutes), mises à jour automatiquement.
          </p>
        </div>
        <div className="rounded-lg border border-[#2a2a2d] bg-[#17171a] px-3 py-2 text-xs text-gray-300">
          Rafraîchissement auto: 20s
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-lg border border-[#2a2a2d] bg-[#1a1a1d] p-4 md:grid-cols-4">
        <select
          value={connectionType}
          onChange={(event) => setConnectionType(event.target.value as "all" | "discord" | "guest")}
          className="rounded-lg border border-[#303038] bg-[#111114] px-3 py-2 text-sm text-white"
        >
          <option value="all">Tous les types</option>
          <option value="discord">Membres Discord</option>
          <option value="guest">Visiteurs généraux</option>
        </select>
        <select
          value={selectedCountry}
          onChange={(event) => setSelectedCountry(event.target.value)}
          className="rounded-lg border border-[#303038] bg-[#111114] px-3 py-2 text-sm text-white"
        >
          <option value="">Tous les pays</option>
          {(data?.countries || []).map((country) => (
            <option key={country.countryCode} value={country.countryCode}>
              {country.country}
            </option>
          ))}
        </select>
        <input
          value={memberSearch}
          onChange={(event) => setMemberSearch(event.target.value)}
          placeholder="Recherche membre (pseudo / ID)"
          className="rounded-lg border border-[#303038] bg-[#111114] px-3 py-2 text-sm text-white placeholder:text-gray-500"
        />
        <button
          onClick={() => {
            setConnectionType("all");
            setSelectedCountry("");
            setMemberSearch("");
          }}
          className="rounded-lg border border-[#303038] bg-[#111114] px-3 py-2 text-sm text-gray-200 transition-colors hover:border-[#9146ff]"
        >
          Réinitialiser
        </button>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>
      ) : null}

      <RealtimeStatsCards
        totalActiveConnections={data?.totalActiveConnections || 0}
        activeMembers={data?.activeMembers || 0}
        activeGuests={data?.activeGuests || 0}
        countriesRepresented={data?.countriesRepresented || 0}
        latestHeartbeatAt={data?.latestHeartbeatAt || null}
      />

      <WorldConnectionsMap
        countries={mapCountries}
        selectedCountry={selectedCountry || undefined}
        onCountryClick={(countryCode) => setSelectedCountry(countryCode === selectedCountry ? "" : countryCode)}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <RealtimeCountryDistribution
            countries={data?.countries || []}
            total={data?.totalActiveConnections || 0}
          />
        </div>
        <div className="lg:col-span-2">
          <RealtimeSessionsTable sessions={data?.activeConnections || []} loading={loading} />
        </div>
      </div>

      <p className="text-xs text-gray-500">
        Dernière mise à jour: {new Date().toLocaleString("fr-FR")}
      </p>
    </div>
  );
}
