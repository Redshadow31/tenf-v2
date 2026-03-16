"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type RunsResponse = {
  activeRun: { id: string; label: string; status: string; started_at?: string | null } | null;
  runs: Array<{ id: string; label: string; status: string; started_at?: string | null; ended_at?: string | null }>;
  testEnabled: boolean;
};

type SummaryResponse = {
  backendReady: boolean;
  testEnabled: boolean;
  activeRun: { id: string; label: string; status: string; started_at?: string | null } | null;
  stats: {
    eventsTotal: number;
    subscriptionsTotal: number;
    activeSubscriptions: number;
    failedSubscriptions: number;
    revokedSubscriptions: number;
    declarationsTotal: number;
    declarationsSnapshotTotal: number;
  };
  eventStatus: {
    matched: number;
    ignored: number;
    duplicate: number;
    error: number;
    received: number;
  };
};

type SyncResponse = {
  success?: boolean;
  message?: string;
  created?: number;
  revoked?: number;
  retained?: number;
  liveMembers?: number;
  eligibleMembers?: number;
};

type SyncDeclarationsResponse = {
  success?: boolean;
  runId?: string | null;
  synced?: number;
  windowDays?: number;
  message?: string;
  error?: string;
};

export default function AdminRaidsTestPage() {
  const [loading, setLoading] = useState(true);
  const [runningAction, setRunningAction] = useState<"" | "start" | "stop" | "sync" | "syncDeclarations">("");
  const [error, setError] = useState("");
  const [syncMessage, setSyncMessage] = useState("");
  const [runsData, setRunsData] = useState<RunsResponse | null>(null);
  const [summaryData, setSummaryData] = useState<SummaryResponse | null>(null);

  async function loadAll() {
    try {
      setLoading(true);
      setError("");
      const [runsRes, summaryRes] = await Promise.all([
        fetch("/api/admin/engagement/raids-test/runs", { cache: "no-store" }),
        fetch("/api/admin/engagement/raids-test/summary", { cache: "no-store" }),
      ]);
      const [runsBody, summaryBody] = await Promise.all([runsRes.json(), summaryRes.json()]);
      if (!runsRes.ok) throw new Error(runsBody.error || "Impossible de charger les runs.");
      if (!summaryRes.ok) throw new Error(summaryBody.error || "Impossible de charger le resume.");
      setRunsData(runsBody);
      setSummaryData(summaryBody);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur reseau.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  async function startRun() {
    setRunningAction("start");
    setError("");
    try {
      const response = await fetch("/api/admin/engagement/raids-test/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start",
          label: `Run test ${new Date().toLocaleString("fr-FR")}`,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Impossible de demarrer le run.");
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur reseau.");
    } finally {
      setRunningAction("");
    }
  }

  async function stopRun() {
    setRunningAction("stop");
    setError("");
    try {
      const response = await fetch("/api/admin/engagement/raids-test/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stop", status: "completed" }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Impossible de stopper le run.");
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur reseau.");
    } finally {
      setRunningAction("");
    }
  }

  async function runSyncNow() {
    setRunningAction("sync");
    setSyncMessage("");
    setError("");
    try {
      const response = await fetch("/api/admin/engagement/raids-test/sync", {
        method: "POST",
      });
      const body = (await response.json()) as SyncResponse & { error?: string };
      if (!response.ok) throw new Error(body.error || "Impossible de lancer la sync.");
      setSyncMessage(
        `Sync OK - created: ${body.created || 0}, retained: ${body.retained || 0}, revoked: ${body.revoked || 0}, live: ${
          body.liveMembers || 0
        }/${body.eligibleMembers || 0}`
      );
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur reseau.");
    } finally {
      setRunningAction("");
    }
  }

  async function syncDeclarationsSnapshot() {
    setRunningAction("syncDeclarations");
    setSyncMessage("");
    setError("");
    try {
      const response = await fetch("/api/admin/engagement/raids-test/declarations/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: 30 }),
      });
      const body = (await response.json()) as SyncDeclarationsResponse;
      if (!response.ok) throw new Error(body.error || "Impossible de synchroniser les declarations.");
      setSyncMessage(`Snapshot declarations OK - ${body.synced || 0} lignes (${body.windowDays || 30} jours).`);
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur reseau.");
    } finally {
      setRunningAction("");
    }
  }

  const activeRun = runsData?.activeRun || null;

  return (
    <div className="min-h-screen bg-[#0e0e10] p-8 text-white">
      <div className="mb-6">
        <Link href="/admin/raids" className="mb-3 inline-block text-sm text-gray-400 hover:text-white">
          ← Retour au suivi des raids
        </Link>
        <h1 className="text-4xl font-bold">Raids EventSub - Test</h1>
        <p className="mt-2 text-sm text-gray-400">
          Pipeline de test isole: les donnees de cette page ne sont pas comptabilisees dans les vrais raids.
        </p>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-red-500/40 bg-red-900/20 px-4 py-3 text-sm text-red-200">{error}</div>
      ) : null}
      {syncMessage ? (
        <div className="mb-4 rounded-lg border border-green-500/40 bg-green-900/20 px-4 py-3 text-sm text-green-200">
          {syncMessage}
        </div>
      ) : null}

      {!summaryData?.testEnabled ? (
        <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-900/20 px-4 py-3 text-sm text-amber-200">
          Mode test desactive. Passe `RAID_EVENTSUB_TEST_ENABLED=true` pour activer le suivi.
        </div>
      ) : null}

      <div className="mb-6 rounded-xl border border-gray-700 bg-[#1a1a1d] p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void startRun()}
            disabled={runningAction !== "" || !!activeRun}
            className="rounded-lg bg-[#9146ff] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {runningAction === "start" ? "Demarrage..." : "Demarrer un run"}
          </button>
          <button
            type="button"
            onClick={() => void stopRun()}
            disabled={runningAction !== "" || !activeRun}
            className="rounded-lg border border-red-400/50 px-3 py-2 text-sm font-semibold text-red-300 disabled:opacity-50"
          >
            {runningAction === "stop" ? "Arret..." : "Stopper le run"}
          </button>
          <button
            type="button"
            onClick={() => void runSyncNow()}
            disabled={runningAction !== "" || !activeRun}
            className="rounded-lg border border-sky-400/50 px-3 py-2 text-sm font-semibold text-sky-300 disabled:opacity-50"
          >
            {runningAction === "sync" ? "Sync..." : "Sync maintenant"}
          </button>
          <button
            type="button"
            onClick={() => void syncDeclarationsSnapshot()}
            disabled={runningAction !== "" || !activeRun}
            className="rounded-lg border border-emerald-400/50 px-3 py-2 text-sm font-semibold text-emerald-300 disabled:opacity-50"
          >
            {runningAction === "syncDeclarations" ? "Sync declarations..." : "Snapshot declarations"}
          </button>
          <button
            type="button"
            onClick={() => void loadAll()}
            disabled={loading}
            className="rounded-lg border border-white/20 px-3 py-2 text-sm font-semibold text-gray-200 disabled:opacity-50"
          >
            Rafraichir
          </button>
        </div>

        <p className="mt-3 text-xs text-gray-400">
          Run actif:{" "}
          {activeRun ? (
            <span className="text-green-300">
              {activeRun.label} ({activeRun.id.slice(0, 8)}...)
            </span>
          ) : (
            <span>Aucun run en cours</span>
          )}
        </p>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-3">
        <StatCard label="Events test" value={summaryData?.stats.eventsTotal ?? 0} />
        <StatCard label="Subscriptions actives" value={summaryData?.stats.activeSubscriptions ?? 0} />
        <StatCard label="Declarations actuelles" value={summaryData?.stats.declarationsTotal ?? 0} />
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-3">
        <StatCard label="Snapshot declarations test" value={summaryData?.stats.declarationsSnapshotTotal ?? 0} />
        <StatCard label="Subscriptions failed" value={summaryData?.stats.failedSubscriptions ?? 0} />
        <StatCard label="Subscriptions revoked" value={summaryData?.stats.revokedSubscriptions ?? 0} />
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-5">
        <MiniStat label="Matched" value={summaryData?.eventStatus.matched ?? 0} color="#34d399" />
        <MiniStat label="Ignored" value={summaryData?.eventStatus.ignored ?? 0} color="#f59e0b" />
        <MiniStat label="Duplicate" value={summaryData?.eventStatus.duplicate ?? 0} color="#93c5fd" />
        <MiniStat label="Error" value={summaryData?.eventStatus.error ?? 0} color="#f87171" />
        <MiniStat label="Received" value={summaryData?.eventStatus.received ?? 0} color="#e5e7eb" />
      </div>

      <div className="mb-6">
        <Link
          href="/admin/engagement/raids-sub/a-valider?status=ignored"
          className="inline-flex items-center rounded-md border border-amber-400/50 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/20"
        >
          Voir détail des ignorés
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Link
          href="/admin/engagement/raids-test/subscriptions"
          className="rounded-xl border border-gray-700 bg-[#151519] p-4 transition-colors hover:border-[#9146ff]/60"
        >
          <p className="text-lg font-semibold">Voir subscriptions test</p>
          <p className="mt-1 text-sm text-gray-400">Etat detaille des subscriptions EventSub dynamiques.</p>
        </Link>
        <Link
          href="/admin/engagement/raids-test/events"
          className="rounded-xl border border-gray-700 bg-[#151519] p-4 transition-colors hover:border-[#9146ff]/60"
        >
          <p className="text-lg font-semibold">Voir events test</p>
          <p className="mt-1 text-sm text-gray-400">Flux des raids recus par le webhook test EventSub.</p>
        </Link>
        <Link
          href="/admin/engagement/raids-test/watchlist"
          className="rounded-xl border border-gray-700 bg-[#151519] p-4 transition-colors hover:border-[#9146ff]/60"
        >
          <p className="text-lg font-semibold">Watchlist live vs surveille</p>
          <p className="mt-1 text-sm text-gray-400">
            Visualise qui est live et si le systeme le surveille bien avec les subscriptions.
          </p>
        </Link>
        <Link
          href="/admin/engagement/raids-test/coverage"
          className="rounded-xl border border-gray-700 bg-[#151519] p-4 transition-colors hover:border-[#9146ff]/60"
        >
          <p className="text-lg font-semibold">Couverture test vs declarations</p>
          <p className="mt-1 text-sm text-gray-400">
            Compare les declarations actuelles et les detections du nouveau systeme.
          </p>
        </Link>
        <Link
          href="/admin/engagement/raids-test/readiness"
          className="rounded-xl border border-gray-700 bg-[#151519] p-4 transition-colors hover:border-[#9146ff]/60"
        >
          <p className="text-lg font-semibold">Readiness go/no-go</p>
          <p className="mt-1 text-sm text-gray-400">
            KPI automatiques pour valider la bascule production sans risque.
          </p>
        </Link>
        <Link
          href="/admin/engagement/raids-a-valider"
          className="rounded-xl border border-gray-700 bg-[#151519] p-4 transition-colors hover:border-[#9146ff]/60"
        >
          <p className="text-lg font-semibold">Declarations actuelles</p>
          <p className="mt-1 text-sm text-gray-400">Ouvre le flux actuel des declarations membres.</p>
        </Link>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-gray-700 bg-[#1a1a1d] p-4">
      <p className="text-sm text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#121216] p-3">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-lg font-semibold" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

