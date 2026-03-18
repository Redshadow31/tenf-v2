"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ConnectionsPayload = {
  summary?: {
    total?: number;
    success?: number;
    errors?: number;
    warnings?: number;
    notTestable?: number;
  };
  results?: Array<{ service?: string; status?: string; message?: string }>;
};

type SyncAllPayload = {
  data?: {
    events?: { missingInSupabase?: unknown[] };
    evaluations?: { missingInSupabase?: unknown[] };
    follows?: { missingInSupabase?: unknown[] };
    members?: { missingInSupabase?: unknown[] };
  };
};

type AggregatePayload = {
  data?: {
    recap?: { upcomingKpis?: { pendingEventValidations?: number } };
    ops?: { raidsPendingCount?: number; profileValidationPendingCount?: number };
  };
};

export default function PilotageReleaseReadinessPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connections, setConnections] = useState<ConnectionsPayload>({});
  const [sync, setSync] = useState<SyncAllPayload>({});
  const [aggregate, setAggregate] = useState<AggregatePayload>({});

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [connectionsRes, syncRes, aggregateRes] = await Promise.allSettled([
          fetch("/api/admin/system-test/connections", { cache: "no-store" }),
          fetch("/api/admin/migration/check-sync-all", { cache: "no-store" }),
          fetch("/api/admin/dashboard/aggregate", { cache: "no-store" }),
        ]);

        if (!mounted) return;

        if (connectionsRes.status === "fulfilled" && connectionsRes.value.ok) {
          setConnections((await connectionsRes.value.json()) as ConnectionsPayload);
        }
        if (syncRes.status === "fulfilled" && syncRes.value.ok) {
          setSync((await syncRes.value.json()) as SyncAllPayload);
        }
        if (aggregateRes.status === "fulfilled" && aggregateRes.value.ok) {
          setAggregate((await aggregateRes.value.json()) as AggregatePayload);
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

  const readiness = useMemo(() => {
    const serviceErrors = Number(connections?.summary?.errors || 0);
    const serviceWarnings = Number(connections?.summary?.warnings || 0);
    const missingTotal =
      (Array.isArray(sync?.data?.events?.missingInSupabase) ? sync.data.events!.missingInSupabase!.length : 0) +
      (Array.isArray(sync?.data?.evaluations?.missingInSupabase) ? sync.data.evaluations!.missingInSupabase!.length : 0) +
      (Array.isArray(sync?.data?.follows?.missingInSupabase) ? sync.data.follows!.missingInSupabase!.length : 0) +
      (Array.isArray(sync?.data?.members?.missingInSupabase) ? sync.data.members!.missingInSupabase!.length : 0);

    const pendingEvents = Number(aggregate?.data?.recap?.upcomingKpis?.pendingEventValidations || 0);
    const pendingRaids = Number(aggregate?.data?.ops?.raidsPendingCount || 0);
    const pendingProfiles = Number(aggregate?.data?.ops?.profileValidationPendingCount || 0);

    let score = 100;
    score -= serviceErrors * 20;
    score -= serviceWarnings * 8;
    score -= Math.min(20, missingTotal);
    score -= Math.min(20, Math.floor((pendingEvents + pendingRaids + pendingProfiles) / 5));
    score = Math.max(0, Math.min(100, score));

    const status = score >= 85 ? "GO" : score >= 65 ? "RISQUE" : "NO-GO";
    return { score, status, serviceErrors, serviceWarnings, missingTotal, pendingEvents, pendingRaids, pendingProfiles };
  }, [aggregate, connections, sync]);

  return (
    <div className="text-white space-y-6">
      <div className="rounded-2xl border border-[#2b2b36] bg-gradient-to-br from-[#191923] via-[#15151d] to-[#121218] p-6 shadow-[0_14px_34px_rgba(0,0,0,0.28)]">
        <Link href="/admin/pilotage" className="text-gray-300 hover:text-white transition-colors mb-4 inline-block">
          ← Retour au cockpit pilotage
        </Link>
        <h1 className="text-3xl font-bold text-white mb-2">Releases & tests</h1>
        <p className="text-gray-300">Lecture go/no-go selon connectivité, dette backlog et santé des données.</p>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          Chargement partiel: {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm text-gray-400">Score readiness</p>
          <p className={`mt-2 text-3xl font-bold ${readiness.score >= 85 ? "text-emerald-300" : readiness.score >= 65 ? "text-amber-300" : "text-rose-300"}`}>
            {readiness.score}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm text-gray-400">Décision</p>
          <p className={`mt-2 text-3xl font-bold ${readiness.status === "GO" ? "text-emerald-300" : readiness.status === "RISQUE" ? "text-amber-300" : "text-rose-300"}`}>
            {readiness.status}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm text-gray-400">Erreurs services</p>
          <p className={`mt-2 text-3xl font-bold ${readiness.serviceErrors > 0 ? "text-rose-300" : "text-emerald-300"}`}>{readiness.serviceErrors}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm text-gray-400">Objets non synchronisés</p>
          <p className={`mt-2 text-3xl font-bold ${readiness.missingTotal > 0 ? "text-amber-300" : "text-emerald-300"}`}>{readiness.missingTotal}</p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-300">Calcul readiness en cours...</div>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="rounded-2xl border border-[#2b2b36] bg-[#14141b] p-5">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-300 mb-3">Checklist technique</h3>
          <ul className="space-y-2 text-sm text-gray-200">
            <li className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
              Services en erreur: <strong>{readiness.serviceErrors}</strong>
            </li>
            <li className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
              Warnings techniques: <strong>{readiness.serviceWarnings}</strong>
            </li>
            <li className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
              Dette de synchronisation: <strong>{readiness.missingTotal}</strong>
            </li>
          </ul>
          <div className="mt-4">
            <Link href="/admin/system-test" className="rounded-lg border border-white/15 px-3 py-1.5 text-sm hover:border-[#d4af37] transition-colors">
              Lancer les tests système détaillés
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-[#2b2b36] bg-[#14141b] p-5">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-300 mb-3">Checklist opérationnelle</h3>
          <ul className="space-y-2 text-sm text-gray-200">
            <li className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
              Présences events à valider: <strong>{readiness.pendingEvents}</strong>
            </li>
            <li className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
              Raids à valider: <strong>{readiness.pendingRaids}</strong>
            </li>
            <li className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
              Profils en attente: <strong>{readiness.pendingProfiles}</strong>
            </li>
          </ul>
          <div className="mt-4 flex gap-2 flex-wrap">
            <Link href="/admin/pilotage/backlog" className="rounded-lg border border-white/15 px-3 py-1.5 text-sm hover:border-[#d4af37] transition-colors">
              Ouvrir backlog
            </Link>
            <Link href="/admin/migration" className="rounded-lg border border-white/15 px-3 py-1.5 text-sm hover:border-[#d4af37] transition-colors">
              Vérifier migration
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

