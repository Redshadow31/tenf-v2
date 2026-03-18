"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type SyncDataset = {
  inBlobs?: number;
  inSupabase?: number;
  totalInBlobs?: number;
  totalInSupabase?: number;
  missingInSupabase?: unknown[];
};

type SyncAllPayload = {
  data?: {
    events?: SyncDataset;
    evaluations?: SyncDataset;
    follows?: SyncDataset;
    members?: SyncDataset;
  };
};

type AlertsPayload = {
  incompleteAccounts?: number;
  errors?: number;
};

function datasetStats(dataset?: SyncDataset) {
  const blobs = Number(dataset?.inBlobs ?? dataset?.totalInBlobs ?? 0);
  const supabase = Number(dataset?.inSupabase ?? dataset?.totalInSupabase ?? 0);
  const missing = Array.isArray(dataset?.missingInSupabase) ? dataset!.missingInSupabase!.length : 0;
  const coverage = blobs > 0 ? Math.max(0, Math.min(100, Math.round(((blobs - missing) / blobs) * 100))) : 100;
  return { blobs, supabase, missing, coverage };
}

export default function PilotageDataHealthPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncAll, setSyncAll] = useState<SyncAllPayload>({});
  const [alerts, setAlerts] = useState<AlertsPayload>({});

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [syncRes, alertsRes] = await Promise.allSettled([
          fetch("/api/admin/migration/check-sync-all", { cache: "no-store" }),
          fetch("/api/admin/control-center/alerts", { cache: "no-store" }),
        ]);

        if (!mounted) return;

        if (syncRes.status === "fulfilled" && syncRes.value.ok) {
          setSyncAll((await syncRes.value.json()) as SyncAllPayload);
        }
        if (alertsRes.status === "fulfilled" && alertsRes.value.ok) {
          setAlerts((await alertsRes.value.json()) as AlertsPayload);
        }
      } catch (loadError) {
        if (!mounted) return;
        setError(loadError instanceof Error ? loadError.message : "Erreur de chargement");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const health = useMemo(() => {
    const events = datasetStats(syncAll?.data?.events);
    const evaluations = datasetStats(syncAll?.data?.evaluations);
    const follows = datasetStats(syncAll?.data?.follows);
    const members = datasetStats(syncAll?.data?.members);
    const incomplete = Number(alerts?.incompleteAccounts || 0);
    const dataErrors = Number(alerts?.errors || 0);

    const avgCoverage = Math.round((events.coverage + evaluations.coverage + follows.coverage + members.coverage) / 4);
    const penalty = Math.min(40, incomplete + dataErrors);
    const score = Math.max(0, Math.min(100, avgCoverage - penalty));

    return { events, evaluations, follows, members, incomplete, dataErrors, avgCoverage, score };
  }, [alerts, syncAll]);

  return (
    <div className="text-white space-y-6">
      <div className="rounded-2xl border border-[#2b2b36] bg-gradient-to-br from-[#191923] via-[#15151d] to-[#121218] p-6 shadow-[0_14px_34px_rgba(0,0,0,0.28)]">
        <Link href="/admin/pilotage" className="text-gray-300 hover:text-white transition-colors mb-4 inline-block">
          ← Retour au cockpit pilotage
        </Link>
        <h1 className="text-3xl font-bold text-white mb-2">Santé des données</h1>
        <p className="text-gray-300">Contrôle de cohérence entre legacy et Supabase + qualité profils.</p>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          Chargement partiel: {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm text-gray-400">Score santé data</p>
          <p className={`mt-2 text-3xl font-bold ${health.score >= 80 ? "text-emerald-300" : health.score >= 60 ? "text-amber-300" : "text-rose-300"}`}>
            {health.score}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm text-gray-400">Couverture sync moyenne</p>
          <p className="mt-2 text-3xl font-bold">{health.avgCoverage}%</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm text-gray-400">Comptes incomplets</p>
          <p className={`mt-2 text-3xl font-bold ${health.incomplete > 0 ? "text-amber-300" : "text-emerald-300"}`}>{health.incomplete}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm text-gray-400">Incohérences membres</p>
          <p className={`mt-2 text-3xl font-bold ${health.dataErrors > 0 ? "text-rose-300" : "text-emerald-300"}`}>{health.dataErrors}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-[#2b2b36] bg-[#14141b] overflow-hidden">
        <div className="grid grid-cols-[1.2fr_120px_120px_120px_120px] gap-2 px-4 py-3 text-xs uppercase tracking-wide text-gray-400 border-b border-white/10">
          <span>Domaine</span>
          <span>Legacy</span>
          <span>Supabase</span>
          <span>Manquants</span>
          <span>Couverture</span>
        </div>
        {[
          { label: "Membres", stats: health.members },
          { label: "Événements", stats: health.events },
          { label: "Évaluations", stats: health.evaluations },
          { label: "Follows", stats: health.follows },
        ].map((row) => (
          <div key={row.label} className="grid grid-cols-[1.2fr_120px_120px_120px_120px] gap-2 px-4 py-3 border-b border-white/5 items-center text-sm">
            <span className="font-medium">{row.label}</span>
            <span>{row.stats.blobs}</span>
            <span>{row.stats.supabase}</span>
            <span className={row.stats.missing > 0 ? "text-rose-300" : "text-emerald-300"}>{row.stats.missing}</span>
            <span className={row.stats.coverage >= 95 ? "text-emerald-300" : row.stats.coverage >= 80 ? "text-amber-300" : "text-rose-300"}>
              {row.stats.coverage}%
            </span>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-300">
          Analyse des données en cours...
        </div>
      ) : null}

      <div className="rounded-2xl border border-[#2b2b36] bg-[#14141b] p-5">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-300 mb-3">Actions recommandées</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <Link href="/admin/migration" className="rounded-lg border border-white/15 px-3 py-2 hover:border-[#d4af37] transition-colors">
            Ouvrir le hub migration
          </Link>
          <Link href="/admin/membres/incomplets" className="rounded-lg border border-white/15 px-3 py-2 hover:border-[#d4af37] transition-colors">
            Corriger les profils incomplets
          </Link>
          <Link href="/admin/membres/erreurs" className="rounded-lg border border-white/15 px-3 py-2 hover:border-[#d4af37] transition-colors">
            Traiter les incohérences membres
          </Link>
        </div>
      </div>
    </div>
  );
}

