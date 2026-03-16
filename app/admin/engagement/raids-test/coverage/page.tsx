"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type CoverageResponse = {
  runId: string | null;
  days: number;
  summary: {
    declarationsSnapshotTotal: number;
    testMatchedTotal: number;
    matchedDeclarations: number;
    unmatchedDeclarations: number;
    eventsWithoutDeclaration: number;
    matchedPairs: number;
    declarationsCoveragePct: number;
  };
  declarationStatusBreakdown?: {
    processing: number;
    toStudy: number;
    validated: number;
    rejected: number;
  };
  declarationsOnly: Array<{
    id: string;
    member_twitch_login: string;
    target_twitch_login: string;
    raid_at: string;
    declaration_status: string;
  }>;
  eventsOnly: Array<{
    id: string;
    from_broadcaster_user_login: string;
    to_broadcaster_user_login: string;
    event_at: string;
    processing_status: string;
    viewers: number;
  }>;
  matchedPairs: Array<{
    key: string;
    declarationsCount: number;
    eventsCount: number;
  }>;
};

export default function AdminRaidsTestCoveragePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [days, setDays] = useState(7);
  const [data, setData] = useState<CoverageResponse | null>(null);

  async function loadCoverage() {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({ days: String(days) });
      const response = await fetch(`/api/admin/engagement/raids-test/coverage?${params.toString()}`, { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Impossible de charger la couverture.");
      setData(body);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur reseau.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCoverage();
  }, [days]);

  return (
    <div className="min-h-screen bg-[#0e0e10] p-8 text-white">
      <Link href="/admin/engagement/raids-test" className="mb-3 inline-block text-sm text-gray-400 hover:text-white">
        ← Retour au hub test
      </Link>
      <h1 className="text-3xl font-bold">Couverture test vs declarations</h1>
      <p className="mt-2 text-sm text-gray-400">
        Comparaison des declarations actuelles avec les detections du nouveau systeme test.
      </p>

      {error ? (
        <div className="mt-4 rounded-lg border border-red-500/40 bg-red-900/20 px-4 py-3 text-sm text-red-200">{error}</div>
      ) : null}

      <div className="mt-4 flex items-center gap-2">
        <label className="text-sm text-gray-300">Fenetre:</label>
        <select
          value={days}
          onChange={(event) => setDays(Number(event.target.value))}
          className="rounded-md border border-white/20 bg-[#121216] px-3 py-1.5 text-sm text-white"
        >
          <option value={7}>7 jours</option>
          <option value={14}>14 jours</option>
          <option value={30}>30 jours</option>
          <option value={60}>60 jours</option>
        </select>
        <button
          type="button"
          onClick={() => void loadCoverage()}
          className="rounded-md border border-white/20 px-3 py-1.5 text-xs font-semibold text-gray-200"
        >
          Rafraichir
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-5">
        <Card label="Declarations snapshot" value={data?.summary.declarationsSnapshotTotal ?? 0} />
        <Card label="Matched test" value={data?.summary.testMatchedTotal ?? 0} />
        <Card label="Pairs matchs" value={data?.summary.matchedPairs ?? 0} />
        <Card label="Declarations only" value={data?.summary.unmatchedDeclarations ?? 0} />
        <Card label="Events only" value={data?.summary.eventsWithoutDeclaration ?? 0} />
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-4">
        <Card label="Declarations couvertes" value={data?.summary.matchedDeclarations ?? 0} />
        <Card label="Couverture" value={`${data?.summary.declarationsCoveragePct ?? 0}%`} />
        <Card label="Declarations: validated" value={data?.declarationStatusBreakdown?.validated ?? 0} />
        <Card label="Declarations: to_study" value={data?.declarationStatusBreakdown?.toStudy ?? 0} />
      </div>

      <div className="mt-4 rounded-xl border border-gray-700 bg-[#1a1a1d] p-4">
        <h2 className="mb-3 text-lg font-semibold">Declarations sans event test</h2>
        {loading ? (
          <p className="text-sm text-gray-300">Chargement...</p>
        ) : !data?.runId ? (
          <p className="text-sm text-gray-300">Aucun run test actif. Demarre un run sur le hub test.</p>
        ) : data.declarationsOnly.length === 0 ? (
          <p className="text-sm text-gray-300">Aucune declaration non couverte dans la fenetre.</p>
        ) : (
          <div className="space-y-2">
            {data.declarationsOnly.map((row) => (
              <article key={row.id} className="rounded-lg border border-gray-700 bg-[#121216] p-3">
                <p className="text-sm font-semibold text-white">
                  {row.member_twitch_login} → {row.target_twitch_login}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {new Date(row.raid_at).toLocaleString("fr-FR")} | statut declaration: {row.declaration_status}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-gray-700 bg-[#1a1a1d] p-4">
        <h2 className="mb-3 text-lg font-semibold">Events test sans declaration</h2>
        {loading ? (
          <p className="text-sm text-gray-300">Chargement...</p>
        ) : !data?.runId ? (
          <p className="text-sm text-gray-300">Aucun run test actif.</p>
        ) : data.eventsOnly.length === 0 ? (
          <p className="text-sm text-gray-300">Aucun event test non rapproche dans la fenetre.</p>
        ) : (
          <div className="space-y-2">
            {data.eventsOnly.map((row) => (
              <article key={row.id} className="rounded-lg border border-gray-700 bg-[#121216] p-3">
                <p className="text-sm font-semibold text-white">
                  {row.from_broadcaster_user_login} → {row.to_broadcaster_user_login}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {new Date(row.event_at).toLocaleString("fr-FR")} | viewers: {row.viewers} | status: {row.processing_status}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-gray-700 bg-[#1a1a1d] p-4">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}

