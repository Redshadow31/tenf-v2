"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type WatchlistMember = {
  discordId: string | null;
  twitchLogin: string;
  twitchId: string;
  isLiveNow: boolean;
  wasRecentlyLive: boolean;
  shouldBeTargeted: boolean;
  localSubscriptionStatus: string | null;
  localSubscriptionId: string | null;
  remoteSubscriptionId: string | null;
};

type WatchlistResponse = {
  success: boolean;
  enabled: boolean;
  runId: string | null;
  callbackUrl: string;
  members: WatchlistMember[];
  summary: {
    eligibleMembers: number;
    liveNow: number;
    recentlyLive: number;
    targetedByPolicy: number;
    localSubscriptionsActiveOrPending: number;
    remoteSubscriptionsEnabled: number;
  };
};

export default function AdminRaidsTestWatchlistPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [data, setData] = useState<WatchlistResponse | null>(null);

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const response = await fetch("/api/admin/engagement/raids-test/watchlist", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Impossible de charger la watchlist.");
      setData(body);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur reseau.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const filteredMembers = useMemo(() => {
    const all = data?.members || [];
    const normalized = query.trim().toLowerCase();
    if (!normalized) return all;
    return all.filter(
      (row) =>
        row.twitchLogin.toLowerCase().includes(normalized) ||
        row.twitchId.toLowerCase().includes(normalized) ||
        (row.discordId || "").toLowerCase().includes(normalized)
    );
  }, [data?.members, query]);

  return (
    <div className="min-h-screen bg-[#0e0e10] p-8 text-white">
      <Link href="/admin/engagement/raids-test" className="mb-3 inline-block text-sm text-gray-400 hover:text-white">
        ← Retour au hub test
      </Link>
      <h1 className="text-3xl font-bold">Watchlist live vs surveille</h1>
      <p className="mt-2 text-sm text-gray-400">
        Controle en temps reel: qui est live, qui devrait etre surveille, et etat local/remote des subscriptions.
      </p>

      {error ? (
        <div className="mt-4 rounded-lg border border-red-500/40 bg-red-900/20 px-4 py-3 text-sm text-red-200">{error}</div>
      ) : null}

      {!data?.enabled ? (
        <div className="mt-4 rounded-lg border border-amber-500/40 bg-amber-900/20 px-4 py-3 text-sm text-amber-200">
          RAID_EVENTSUB_TEST_ENABLED est a false.
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 md:grid-cols-6">
        <Card label="Eligibles" value={data?.summary.eligibleMembers ?? 0} />
        <Card label="Live now" value={data?.summary.liveNow ?? 0} />
        <Card label="Recently live" value={data?.summary.recentlyLive ?? 0} />
        <Card label="Should monitor" value={data?.summary.targetedByPolicy ?? 0} />
        <Card label="Local subs active/pending" value={data?.summary.localSubscriptionsActiveOrPending ?? 0} />
        <Card label="Remote subs enabled" value={data?.summary.remoteSubscriptionsEnabled ?? 0} />
      </div>

      <div className="mt-4 rounded-xl border border-gray-700 bg-[#1a1a1d] p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filtrer login / twitchId / discordId"
            className="w-full max-w-md rounded-md border border-white/20 bg-[#0e0e10] px-3 py-2 text-sm text-white"
          />
          <button
            type="button"
            onClick={() => void loadData()}
            className="rounded-md border border-white/20 px-3 py-2 text-xs font-semibold text-gray-200"
          >
            Rafraichir
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-gray-300">Chargement...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-gray-400">
                <tr>
                  <th className="px-2 py-2">Login</th>
                  <th className="px-2 py-2">Live</th>
                  <th className="px-2 py-2">Should monitor</th>
                  <th className="px-2 py-2">Local status</th>
                  <th className="px-2 py-2">Remote sub</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((row) => (
                  <tr key={row.twitchId} className="border-t border-white/10">
                    <td className="px-2 py-2">
                      <p className="font-semibold text-white">{row.twitchLogin}</p>
                      <p className="text-xs text-gray-500">{row.twitchId}</p>
                    </td>
                    <td className="px-2 py-2">
                      <span
                        className="rounded-full px-2 py-1 text-xs font-semibold"
                        style={{
                          color: row.isLiveNow ? "#34d399" : "#e5e7eb",
                          backgroundColor: row.isLiveNow ? "rgba(52,211,153,0.12)" : "rgba(229,231,235,0.12)",
                        }}
                      >
                        {row.isLiveNow ? "LIVE" : row.wasRecentlyLive ? "RECENT" : "OFF"}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      <span
                        className="rounded-full px-2 py-1 text-xs font-semibold"
                        style={{
                          color: row.shouldBeTargeted ? "#93c5fd" : "#9ca3af",
                          backgroundColor: row.shouldBeTargeted ? "rgba(96,165,250,0.15)" : "rgba(156,163,175,0.15)",
                        }}
                      >
                        {row.shouldBeTargeted ? "YES" : "NO"}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      <span className="rounded bg-white/10 px-2 py-1 text-xs">{row.localSubscriptionStatus || "-"}</span>
                    </td>
                    <td className="px-2 py-2">
                      <span className="rounded bg-white/10 px-2 py-1 text-xs">
                        {row.remoteSubscriptionId ? `${row.remoteSubscriptionId.slice(0, 10)}...` : "-"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

