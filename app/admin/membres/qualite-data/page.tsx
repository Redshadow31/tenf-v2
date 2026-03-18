"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type TabId = "diagnostic" | "discord" | "sync" | "reconciliation";

type QualitySnapshot = {
  incompleteAccounts: number;
  errors: number;
  technicalWarnings: number;
  discordTotal: number;
  discordMissingUsername: number;
  syncMissingInSupabase: number;
  syncExtraInSupabase: number;
};

const tabs: Array<{ id: TabId; label: string; hint: string }> = [
  { id: "diagnostic", label: "Diagnostic global", hint: "Vue consolidée des signaux qualité." },
  { id: "discord", label: "Discord", hint: "Cohérence discordId / pseudo Discord." },
  { id: "sync", label: "Sync legacy ↔ Supabase", hint: "Écarts de synchronisation membres." },
  { id: "reconciliation", label: "Réconciliation", hint: "Pont public vers gestion membres." },
];

export default function MembersDataQualityPage() {
  const [activeTab, setActiveTab] = useState<TabId>("diagnostic");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<QualitySnapshot>({
    incompleteAccounts: 0,
    errors: 0,
    technicalWarnings: 0,
    discordTotal: 0,
    discordMissingUsername: 0,
    syncMissingInSupabase: 0,
    syncExtraInSupabase: 0,
  });

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [alertsRes, discordRes, syncRes] = await Promise.allSettled([
          fetch("/api/admin/control-center/alerts", { cache: "no-store" }),
          fetch("/api/admin/members/discord-data", { cache: "no-store" }),
          fetch("/api/admin/migration/check-sync-members", { cache: "no-store" }),
        ]);

        if (!mounted) return;

        const next: QualitySnapshot = {
          incompleteAccounts: 0,
          errors: 0,
          technicalWarnings: 0,
          discordTotal: 0,
          discordMissingUsername: 0,
          syncMissingInSupabase: 0,
          syncExtraInSupabase: 0,
        };

        if (alertsRes.status === "fulfilled" && alertsRes.value.ok) {
          const payload = await alertsRes.value.json();
          next.incompleteAccounts = Number(payload?.incompleteAccounts || 0);
          next.errors = Number(payload?.errors || 0);
          next.technicalWarnings = Number(payload?.warnings || 0);
        }

        if (discordRes.status === "fulfilled" && discordRes.value.ok) {
          const payload = await discordRes.value.json();
          const members = Array.isArray(payload?.members) ? payload.members : [];
          next.discordTotal = members.length;
          next.discordMissingUsername = members.filter((m: any) => !String(m?.discordUsername || "").trim()).length;
        }

        if (syncRes.status === "fulfilled" && syncRes.value.ok) {
          const payload = await syncRes.value.json();
          const missing = payload?.data?.merged?.missingInSupabase;
          const extra = payload?.data?.merged?.extraInSupabase;
          next.syncMissingInSupabase = Array.isArray(missing) ? missing.length : 0;
          next.syncExtraInSupabase = Array.isArray(extra) ? extra.length : 0;
        }

        setSnapshot(next);
      } catch (loadError) {
        if (!mounted) return;
        setError(loadError instanceof Error ? loadError.message : "Erreur de chargement");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadData();
    return () => {
      mounted = false;
    };
  }, []);

  const healthScore = useMemo(() => {
    const penalty = snapshot.errors * 3 + snapshot.syncMissingInSupabase * 2 + snapshot.discordMissingUsername;
    return Math.max(0, 100 - penalty);
  }, [snapshot]);

  return (
    <div className="text-white space-y-6">
      <div className="rounded-2xl border border-[#2b2b36] bg-gradient-to-br from-[#191923] via-[#15151d] to-[#121218] p-6 shadow-[0_14px_34px_rgba(0,0,0,0.28)]">
        <Link href="/admin/membres" className="text-gray-300 hover:text-white transition-colors mb-4 inline-block">
          ← Retour au Dashboard membres
        </Link>
        <h1 className="text-3xl font-bold text-white mb-2">Gestion des membres - Qualité data</h1>
        <p className="text-gray-300">Fusion des pages techniques en onglets avec pilotage centralisé des écarts.</p>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          Chargement partiel: {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm text-gray-400">Score santé data</p>
          <p className="mt-2 text-3xl font-bold">{healthScore}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm text-gray-400">Incohérences</p>
          <p className="mt-2 text-3xl font-bold text-rose-300">{snapshot.errors}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm text-gray-400">Manquants Supabase</p>
          <p className="mt-2 text-3xl font-bold text-amber-300">{snapshot.syncMissingInSupabase}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm text-gray-400">Discord pseudo manquant</p>
          <p className="mt-2 text-3xl font-bold text-sky-300">{snapshot.discordMissingUsername}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-[#2b2b36] bg-[#14141b] p-3">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                activeTab === tab.id
                  ? "border-amber-400/50 bg-amber-500/15 text-amber-100"
                  : "border-white/10 bg-white/5 text-gray-300 hover:border-white/20 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">{tabs.find((tab) => tab.id === activeTab)?.hint}</p>
      </div>

      {loading ? <div className="text-sm text-gray-300">Chargement des onglets qualité...</div> : null}

      {!loading && activeTab === "diagnostic" ? (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5 space-y-4">
          <h2 className="text-xl font-semibold">Diagnostic global</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-gray-400">Comptes incomplets</p>
              <p className="mt-2 text-2xl font-semibold">{snapshot.incompleteAccounts}</p>
              <Link href="/admin/membres/incomplets" className="mt-3 inline-block text-amber-300 hover:text-amber-200">
                Ouvrir la liste →
              </Link>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-gray-400">Avertissements techniques</p>
              <p className="mt-2 text-2xl font-semibold">{snapshot.technicalWarnings}</p>
              <Link href="/admin/membres/erreurs" className="mt-3 inline-block text-amber-300 hover:text-amber-200">
                Vérifier les erreurs →
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {!loading && activeTab === "discord" ? (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5 space-y-4">
          <h2 className="text-xl font-semibold">Qualité des données Discord</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-gray-400">Membres avec discordId</p>
              <p className="mt-2 text-2xl font-semibold">{snapshot.discordTotal}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-gray-400">Pseudo Discord manquant</p>
              <p className="mt-2 text-2xl font-semibold text-amber-300">{snapshot.discordMissingUsername}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex items-end">
              <Link href="/admin/membres/donnee-discord" className="text-amber-300 hover:text-amber-200">
                Ouvrir le module Discord →
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {!loading && activeTab === "sync" ? (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5 space-y-4">
          <h2 className="text-xl font-semibold">Sync legacy ↔ Supabase</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-gray-400">Legacy absents Supabase</p>
              <p className="mt-2 text-2xl font-semibold text-rose-300">{snapshot.syncMissingInSupabase}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-gray-400">Supabase absents legacy</p>
              <p className="mt-2 text-2xl font-semibold text-sky-300">{snapshot.syncExtraInSupabase}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex items-end">
              <Link href="/admin/membres/synchronisation" className="text-amber-300 hover:text-amber-200">
                Ouvrir synchronisation →
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {!loading && activeTab === "reconciliation" ? (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5 space-y-4">
          <h2 className="text-xl font-semibold">Réconciliation public → gestion</h2>
          <p className="text-sm text-gray-300">
            Ce volet centralise la détection d&apos;écarts entre données publiques et données administratives pour sécuriser les mises à jour membres.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/membres/reconciliation" className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm text-white hover:border-white/25">
              Ouvrir la détection publique
            </Link>
            <Link href="/admin/membres/erreurs" className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm text-white hover:border-white/25">
              Ouvrir les incohérences
            </Link>
            <Link href="/admin/membres/historique" className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm text-white hover:border-white/25">
              Ouvrir l&apos;historique des modifications
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

