"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ReadinessResponse = {
  runId: string | null;
  days: number;
  thresholds: {
    minCoveragePct: number;
    maxEventsOnlyRatePct: number;
    maxSubscriptionFailureRatePct: number;
    maxEventErrorRatePct: number;
    minDeclarationsCount: number;
  };
  verdict: {
    readyForProd: boolean;
    blockers: string[];
    warnings: string[];
  };
  metrics: {
    coveragePct: number;
    eventsOnlyRatePct: number;
    subscriptionFailureRatePct: number;
    eventErrorRatePct: number;
    declarationsCount: number;
    eventsCount: number;
  };
};

export default function AdminRaidsTestReadinessPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [days, setDays] = useState(14);
  const [data, setData] = useState<ReadinessResponse | null>(null);

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({ days: String(days) });
      const response = await fetch(`/api/admin/engagement/raids-test/readiness?${params.toString()}`, { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Impossible de charger les KPI readiness.");
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
      <h1 className="text-3xl font-bold">Readiness go/no-go</h1>
      <p className="mt-2 text-sm text-gray-400">
        Validation automatique des KPI avant bascule production du pipeline raids v2.
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
          onClick={() => void loadData()}
          className="rounded-md border border-white/20 px-3 py-1.5 text-xs font-semibold text-gray-200"
        >
          Rafraichir
        </button>
      </div>

      <div className="mt-4 rounded-xl border border-gray-700 bg-[#1a1a1d] p-4">
        {loading ? (
          <p className="text-sm text-gray-300">Chargement...</p>
        ) : (
          <>
            <p className="text-sm text-gray-400">Run: {data?.runId ? `${data.runId.slice(0, 8)}...` : "aucun run actif"}</p>
            <p
              className="mt-2 text-lg font-semibold"
              style={{ color: data?.verdict.readyForProd ? "#34d399" : "#f87171" }}
            >
              {data?.verdict.readyForProd ? "GO - pret pour la prod" : "NO-GO - rester en test"}
            </p>
          </>
        )}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <Metric label="Coverage %" value={data?.metrics.coveragePct ?? 0} threshold={`>= ${data?.thresholds.minCoveragePct ?? 0}`} />
        <Metric
          label="Events only %"
          value={data?.metrics.eventsOnlyRatePct ?? 0}
          threshold={`<= ${data?.thresholds.maxEventsOnlyRatePct ?? 0}`}
        />
        <Metric
          label="Sub failure %"
          value={data?.metrics.subscriptionFailureRatePct ?? 0}
          threshold={`<= ${data?.thresholds.maxSubscriptionFailureRatePct ?? 0}`}
        />
        <Metric
          label="Event error %"
          value={data?.metrics.eventErrorRatePct ?? 0}
          threshold={`<= ${data?.thresholds.maxEventErrorRatePct ?? 0}`}
        />
        <Metric
          label="Declarations"
          value={data?.metrics.declarationsCount ?? 0}
          threshold={`>= ${data?.thresholds.minDeclarationsCount ?? 0}`}
        />
        <Metric label="Pairs events" value={data?.metrics.eventsCount ?? 0} threshold="info" />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-red-500/30 bg-red-900/10 p-4">
          <p className="text-sm font-semibold text-red-300">Blockers</p>
          {data?.verdict.blockers.length ? (
            <ul className="mt-2 space-y-1 text-xs text-red-200">
              {data.verdict.blockers.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-red-100/80">Aucun blocker.</p>
          )}
        </div>
        <div className="rounded-xl border border-amber-500/30 bg-amber-900/10 p-4">
          <p className="text-sm font-semibold text-amber-300">Warnings</p>
          {data?.verdict.warnings.length ? (
            <ul className="mt-2 space-y-1 text-xs text-amber-200">
              {data.verdict.warnings.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-amber-100/80">Aucun warning.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, threshold }: { label: string; value: number; threshold: string }) {
  return (
    <div className="rounded-xl border border-gray-700 bg-[#1a1a1d] p-4">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
      <p className="text-xs text-gray-500">seuil: {threshold}</p>
    </div>
  );
}

