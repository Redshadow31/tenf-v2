"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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

export default function AdminRaidsSubPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [lastRefreshAt, setLastRefreshAt] = useState<Date | null>(null);

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const response = await fetch("/api/admin/engagement/raids-sub/summary", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Impossible de charger le suivi raids-sub.");
      setSummary(body);
      setLastRefreshAt(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur reseau.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
    const intervalId = window.setInterval(() => {
      void loadData();
    }, 30_000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <div className="min-h-screen bg-[#0e0e10] p-8 text-white">
      <Link href="/admin/raids" className="mb-3 inline-block text-sm text-gray-400 hover:text-white">
        ← Retour au suivi des raids
      </Link>
      <h1 className="text-4xl font-bold">Raids Sub - Dashboard</h1>
      <p className="mt-2 text-sm text-gray-400">
        Vue 100% dediee au systeme EventSub (sans declarations manuelles).
      </p>
      <p className="mt-1 text-xs text-gray-500">
        Auto-refresh: 30s
        {lastRefreshAt ? ` • derniere mise a jour ${lastRefreshAt.toLocaleTimeString("fr-FR")}` : ""}
      </p>

      {error ? (
        <div className="mt-4 rounded-lg border border-red-500/40 bg-red-900/20 px-4 py-3 text-sm text-red-200">{error}</div>
      ) : null}

      {!summary?.testEnabled ? (
        <div className="mt-4 rounded-lg border border-amber-500/40 bg-amber-900/20 px-4 py-3 text-sm text-amber-200">
          RAID_EVENTSUB_TEST_ENABLED est desactive.
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 md:grid-cols-5">
        <Card label="Events total" value={summary?.stats.eventsTotal ?? 0} />
        <Card label="Subscriptions active" value={summary?.stats.activeSubscriptions ?? 0} />
        <Card label="Live now" value={summary?.watchlist.liveNow ?? 0} />
        <Card label="Should monitor" value={summary?.watchlist.targetedByPolicy ?? 0} />
        <Card label="Remote subs enabled" value={summary?.watchlist.remoteSubscriptionsEnabled ?? 0} />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-5">
        <Mini label="received" value={summary?.eventStatus.received ?? 0} color="#e5e7eb" />
        <Mini label="matched" value={summary?.eventStatus.matched ?? 0} color="#34d399" />
        <Mini label="ignored" value={summary?.eventStatus.ignored ?? 0} color="#f59e0b" />
        <Mini label="duplicate" value={summary?.eventStatus.duplicate ?? 0} color="#93c5fd" />
        <Mini label="error" value={summary?.eventStatus.error ?? 0} color="#f87171" />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Link href="/admin/engagement/raids-sub/a-valider" className="rounded-xl border border-gray-700 bg-[#151519] p-4 hover:border-[#9146ff]/60">
          <p className="text-lg font-semibold">Raids Sub a valider</p>
          <p className="mt-1 text-sm text-gray-400">Page type “raids-a-valider” mais sur les events EventSub test.</p>
        </Link>
        <Link href="/admin/engagement/raids-test/watchlist" className="rounded-xl border border-gray-700 bg-[#151519] p-4 hover:border-[#9146ff]/60">
          <p className="text-lg font-semibold">Watchlist live vs surveille</p>
          <p className="mt-1 text-sm text-gray-400">Controle qui est live et qui est effectivement surveille.</p>
        </Link>
      </div>

      <div className="mt-3">
        <button
          type="button"
          onClick={() => void loadData()}
          disabled={loading}
          className="rounded-md border border-white/20 px-3 py-2 text-xs font-semibold text-gray-200 disabled:opacity-50"
        >
          {loading ? "Chargement..." : "Rafraichir"}
        </button>
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-gray-700 bg-[#1a1a1d] p-4">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
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

