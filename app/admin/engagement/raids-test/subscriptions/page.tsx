"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type SubscriptionRow = {
  id: string;
  twitch_subscription_id?: string | null;
  monitored_twitch_login: string;
  monitored_twitch_id: string;
  condition_type: string;
  status: string;
  created_at: string;
  updated_at: string;
  revoked_at?: string | null;
  revoke_reason?: string | null;
};

export default function AdminRaidsTestSubscriptionsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rows, setRows] = useState<SubscriptionRow[]>([]);
  const [runId, setRunId] = useState<string | null>(null);

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({ status: statusFilter, limit: "300" });
      const response = await fetch(`/api/admin/engagement/raids-test/subscriptions?${params.toString()}`, {
        cache: "no-store",
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Impossible de charger les subscriptions.");
      setRows(body.subscriptions || []);
      setRunId(body.runId || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur reseau.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [statusFilter]);

  return (
    <div className="min-h-screen bg-[#0e0e10] p-8 text-white">
      <Link href="/admin/engagement/raids-test" className="mb-3 inline-block text-sm text-gray-400 hover:text-white">
        ← Retour au hub test
      </Link>
      <h1 className="text-3xl font-bold">Subscriptions EventSub test</h1>
      <p className="mt-2 text-sm text-gray-400">Run: {runId ? `${runId.slice(0, 8)}...` : "aucun run actif"}</p>

      {error ? (
        <div className="mt-4 rounded-lg border border-red-500/40 bg-red-900/20 px-4 py-3 text-sm text-red-200">{error}</div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {["all", "active", "pending", "revoked", "failed"].map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            className="rounded-md border px-3 py-1.5 text-xs font-semibold"
            style={{
              borderColor: statusFilter === status ? "rgba(145,70,255,0.65)" : "rgba(255,255,255,0.2)",
              color: statusFilter === status ? "#c4b5fd" : "#e5e7eb",
            }}
          >
            {status}
          </button>
        ))}
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
        ) : rows.length === 0 ? (
          <p className="text-sm text-gray-300">Aucune subscription test trouvee.</p>
        ) : (
          <div className="space-y-2">
            {rows.map((row) => (
              <article key={row.id} className="rounded-lg border border-gray-700 bg-[#121216] p-3">
                <p className="text-sm font-semibold text-white">
                  {row.monitored_twitch_login} ({row.monitored_twitch_id})
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  status: {row.status} | condition: {row.condition_type} | twitch_sub:{" "}
                  {row.twitch_subscription_id ? `${row.twitch_subscription_id.slice(0, 10)}...` : "-"}
                </p>
                <p className="text-xs text-gray-500">
                  created: {new Date(row.created_at).toLocaleString("fr-FR")} | updated:{" "}
                  {new Date(row.updated_at).toLocaleString("fr-FR")}
                  {row.revoked_at ? ` | revoked: ${new Date(row.revoked_at).toLocaleString("fr-FR")}` : ""}
                </p>
                {row.revoke_reason ? <p className="text-xs text-amber-300">raison: {row.revoke_reason}</p> : null}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

