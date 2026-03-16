"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type HistoryResponse = {
  runId: string | null;
  days: number;
  selectedMonth: string | null;
  summary: {
    total: number;
    raidNotDone: number;
    differentTarget: number;
    unknownTarget: number;
  };
  months: Array<{
    month: string;
    label: string;
    total: number;
    raidNotDone: number;
    differentTarget: number;
    unknownTarget: number;
  }>;
  entries: Array<{
    id: string;
    month: string;
    revokedAt: string;
    memberName: string;
    memberLogin: string | null;
    twitchId: string;
    hasKnownMember: boolean;
    reasonKind: "unknown_target" | "raid_not_done" | "different_target";
    reasonLabel: string;
  }>;
};

function badgeClass(kind: string): string {
  if (kind === "unknown_target") return "border-red-500/40 bg-red-900/20 text-red-200";
  if (kind === "raid_not_done") return "border-amber-500/40 bg-amber-900/20 text-amber-200";
  return "border-orange-500/40 bg-orange-900/20 text-orange-200";
}

export default function AdminRaidsTestDropsHistoryPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [days, setDays] = useState(365);
  const [month, setMonth] = useState("");
  const [data, setData] = useState<HistoryResponse | null>(null);

  async function loadData(nextMonth?: string) {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({ days: String(days) });
      const chosenMonth = typeof nextMonth === "string" ? nextMonth : month;
      if (chosenMonth) params.set("month", chosenMonth);
      const response = await fetch(`/api/admin/engagement/raids-test/drops-history?${params.toString()}`, {
        cache: "no-store",
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Impossible de charger l'historique.");
      setData(body);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur reseau.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [days]);

  return (
    <div className="min-h-screen bg-[#0e0e10] p-8 text-white">
      <Link href="/admin/engagement/raids-test" className="mb-3 inline-block text-sm text-gray-400 hover:text-white">
        ← Retour au hub test
      </Link>
      <h1 className="text-3xl font-bold">Historique mensuel - live coupé sans raid</h1>
      <p className="mt-2 text-sm text-gray-400">Stat interne par mois: raid non fait, cible différente, cible inconnue.</p>

      {error ? (
        <div className="mt-4 rounded-lg border border-red-500/40 bg-red-900/20 px-4 py-3 text-sm text-red-200">{error}</div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <label className="text-sm text-gray-300">Fenêtre:</label>
        <select
          value={days}
          onChange={(event) => setDays(Number(event.target.value))}
          className="rounded-md border border-white/20 bg-[#121216] px-3 py-1.5 text-sm text-white"
        >
          <option value={90}>3 mois</option>
          <option value={180}>6 mois</option>
          <option value={365}>12 mois</option>
          <option value={730}>24 mois</option>
        </select>
        <select
          value={month}
          onChange={(event) => {
            const next = event.target.value;
            setMonth(next);
            void loadData(next);
          }}
          className="rounded-md border border-white/20 bg-[#121216] px-3 py-1.5 text-sm text-white"
        >
          <option value="">Tous les mois</option>
          {(data?.months || []).map((m) => (
            <option key={m.month} value={m.month}>
              {m.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => void loadData()}
          className="rounded-md border border-white/20 px-3 py-1.5 text-xs font-semibold text-gray-200"
        >
          Rafraichir
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <Card label="Total baisses" value={data?.summary.total ?? 0} />
        <Card label="Raid non fait" value={data?.summary.raidNotDone ?? 0} />
        <Card label="Cible différente" value={data?.summary.differentTarget ?? 0} />
        <Card label="Cible inconnue" value={data?.summary.unknownTarget ?? 0} />
      </div>

      <div className="mt-4 rounded-xl border border-gray-700 bg-[#1a1a1d] p-4">
        <h2 className="mb-3 text-lg font-semibold">Vue mensuelle</h2>
        {loading ? (
          <p className="text-sm text-gray-300">Chargement...</p>
        ) : !data?.months.length ? (
          <p className="text-sm text-gray-300">Aucune donnée mensuelle sur la fenêtre.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-gray-400">
                <tr>
                  <th className="px-2 py-2">Mois</th>
                  <th className="px-2 py-2">Total</th>
                  <th className="px-2 py-2">Raid non fait</th>
                  <th className="px-2 py-2">Cible différente</th>
                  <th className="px-2 py-2">Cible inconnue</th>
                </tr>
              </thead>
              <tbody>
                {data.months.map((m) => (
                  <tr key={m.month} className="border-t border-white/10">
                    <td className="px-2 py-2 font-semibold text-white">{m.label}</td>
                    <td className="px-2 py-2">{m.total}</td>
                    <td className="px-2 py-2 text-amber-200">{m.raidNotDone}</td>
                    <td className="px-2 py-2 text-orange-200">{m.differentTarget}</td>
                    <td className="px-2 py-2 text-red-200">{m.unknownTarget}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-gray-700 bg-[#1a1a1d] p-4">
        <h2 className="mb-3 text-lg font-semibold">Détail des cas</h2>
        {loading ? (
          <p className="text-sm text-gray-300">Chargement...</p>
        ) : !data?.entries.length ? (
          <p className="text-sm text-gray-300">Aucun cas trouvé pour ce filtre.</p>
        ) : (
          <div className="space-y-2">
            {data.entries.map((entry) => (
              <article key={entry.id} className="rounded-lg border border-gray-700 bg-[#121216] p-3">
                <p className="text-sm font-semibold text-white">{entry.memberName}</p>
                <p className="mt-1 text-xs text-gray-400">
                  pseudo Twitch: {entry.memberLogin || "inconnu"} | id Twitch: {entry.twitchId} | fiche membre:{" "}
                  {entry.hasKnownMember ? "liée" : "inconnue"}
                </p>
                <p className="text-xs text-gray-500">date: {new Date(entry.revokedAt).toLocaleString("fr-FR")}</p>
                <p className={`mt-2 inline-flex rounded-md border px-2 py-1 text-xs ${badgeClass(entry.reasonKind)}`}>
                  {entry.reasonLabel}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-gray-700 bg-[#1a1a1d] p-4">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}

