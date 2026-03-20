"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, RefreshCw } from "lucide-react";

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

type SyncMemberItem = {
  twitchLogin: string;
  displayName: string;
  source: "admin" | "bot" | "both";
};

type SyncMembersModalData = {
  totalInBlobs: number;
  totalInSupabase: number;
  missingInSupabase: SyncMemberItem[];
  extraInSupabase: string[];
};

const tabs: Array<{ id: TabId; label: string; hint: string }> = [
  { id: "diagnostic", label: "Diagnostic global", hint: "Vue consolidée des signaux qualité." },
  { id: "discord", label: "Discord", hint: "Cohérence discordId / pseudo Discord." },
  { id: "sync", label: "Sync legacy ↔ Supabase", hint: "Écarts de synchronisation membres." },
  { id: "reconciliation", label: "Réconciliation", hint: "Pont public vers gestion membres." },
];

const glassCardClass =
  "rounded-2xl border border-indigo-300/20 bg-[linear-gradient(150deg,rgba(99,102,241,0.12),rgba(14,15,23,0.85)_45%,rgba(56,189,248,0.08))] shadow-[0_20px_50px_rgba(2,6,23,0.45)] backdrop-blur";
const sectionCardClass =
  "rounded-2xl border border-[#2f3244] bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.10),_rgba(11,13,20,0.95)_46%)] shadow-[0_16px_40px_rgba(2,6,23,0.45)]";
const subtleButtonClass =
  "inline-flex items-center gap-2 rounded-xl border border-indigo-300/25 bg-[linear-gradient(135deg,rgba(79,70,229,0.24),rgba(30,41,59,0.36))] px-3 py-2 text-sm font-medium text-indigo-100 transition hover:-translate-y-[1px] hover:border-indigo-200/45 hover:bg-[linear-gradient(135deg,rgba(99,102,241,0.34),rgba(30,41,59,0.54))]";

export default function MembersDataQualityPage() {
  const [activeTab, setActiveTab] = useState<TabId>("diagnostic");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncModalLoading, setSyncModalLoading] = useState(false);
  const [syncModalError, setSyncModalError] = useState<string | null>(null);
  const [syncModalData, setSyncModalData] = useState<SyncMembersModalData | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      setError(null);

      const [alertsRes, discordRes, syncRes] = await Promise.allSettled([
        fetch("/api/admin/control-center/alerts", { cache: "no-store" }),
        fetch("/api/admin/members/discord-data", { cache: "no-store" }),
        fetch("/api/admin/migration/check-sync-members", { cache: "no-store" }),
      ]);

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
      setError(loadError instanceof Error ? loadError.message : "Erreur de chargement");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const healthScore = useMemo(() => {
    const penalty = snapshot.errors * 3 + snapshot.syncMissingInSupabase * 2 + snapshot.discordMissingUsername;
    return Math.max(0, 100 - penalty);
  }, [snapshot]);

  const qualityProgress = useMemo(() => {
    const discordCoverage =
      snapshot.discordTotal > 0
        ? Math.max(0, Math.round(((snapshot.discordTotal - snapshot.discordMissingUsername) / snapshot.discordTotal) * 100))
        : 100;
    const syncIntegrity = Math.max(0, 100 - (snapshot.syncMissingInSupabase + snapshot.syncExtraInSupabase));
    const technicalStability = Math.max(0, 100 - (snapshot.errors * 4 + snapshot.technicalWarnings * 2));
    const profileCompleteness = Math.max(0, 100 - snapshot.incompleteAccounts);
    return { discordCoverage, syncIntegrity, technicalStability, profileCompleteness };
  }, [snapshot]);

  const priorities = useMemo(() => {
    return [
      {
        id: "errors",
        label: "Corriger les incohérences membres",
        count: snapshot.errors,
        href: "/admin/membres/erreurs",
        severity: snapshot.errors > 15 ? "critical" : snapshot.errors > 0 ? "important" : "ok",
      },
      {
        id: "sync-missing",
        label: "Résoudre les absents Supabase",
        count: snapshot.syncMissingInSupabase,
        href: "/admin/migration/members",
        action: "open-sync-modal",
        severity: snapshot.syncMissingInSupabase > 20 ? "critical" : snapshot.syncMissingInSupabase > 0 ? "important" : "ok",
      },
      {
        id: "discord-missing",
        label: "Compléter les pseudos Discord",
        count: snapshot.discordMissingUsername,
        href: "/admin/membres/donnee-discord",
        severity: snapshot.discordMissingUsername > 30 ? "critical" : snapshot.discordMissingUsername > 0 ? "important" : "ok",
      },
      {
        id: "incomplete",
        label: "Relancer les profils incomplets",
        count: snapshot.incompleteAccounts,
        href: "/admin/membres/incomplets",
        severity: snapshot.incompleteAccounts > 40 ? "critical" : snapshot.incompleteAccounts > 0 ? "important" : "ok",
      },
    ].sort((a, b) => b.count - a.count);
  }, [snapshot.errors, snapshot.discordMissingUsername, snapshot.incompleteAccounts, snapshot.syncMissingInSupabase]);

  const issueDonut = useMemo(() => {
    const segments = [
      { key: "errors", value: snapshot.errors, color: "#fb7185" },
      { key: "sync", value: snapshot.syncMissingInSupabase + snapshot.syncExtraInSupabase, color: "#f59e0b" },
      { key: "discord", value: snapshot.discordMissingUsername, color: "#22d3ee" },
      { key: "incomplete", value: snapshot.incompleteAccounts, color: "#a78bfa" },
    ];
    const total = segments.reduce((sum, segment) => sum + segment.value, 0);
    if (total === 0) {
      return { total, background: "conic-gradient(#1f2433 0% 100%)" };
    }
    let start = 0;
    const parts = segments.map((segment) => {
      const pct = (segment.value / total) * 100;
      const end = start + pct;
      const part = `${segment.color} ${start}% ${end}%`;
      start = end;
      return part;
    });
    return { total, background: `conic-gradient(${parts.join(", ")})` };
  }, [snapshot]);

  const openSyncModal = useCallback(async () => {
    setIsSyncModalOpen(true);
    setSyncModalLoading(true);
    setSyncModalError(null);
    try {
      const response = await fetch("/api/admin/migration/check-sync-members", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }
      const payload = await response.json();
      const merged = payload?.data?.merged;
      if (!merged) {
        throw new Error("Réponse synchronisation invalide");
      }
      setSyncModalData({
        totalInBlobs: Number(merged.totalInBlobs || 0),
        totalInSupabase: Number(merged.totalInSupabase || 0),
        missingInSupabase: Array.isArray(merged.missingInSupabase) ? merged.missingInSupabase : [],
        extraInSupabase: Array.isArray(merged.extraInSupabase) ? merged.extraInSupabase : [],
      });
    } catch (error) {
      setSyncModalError(error instanceof Error ? error.message : "Erreur inconnue");
      setSyncModalData(null);
    } finally {
      setSyncModalLoading(false);
    }
  }, []);

  return (
    <div className="text-white space-y-6">
      <section className={`${glassCardClass} p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <Link href="/admin/membres" className="mb-3 inline-block text-sm text-slate-300 transition hover:text-white">
              ← Retour au Dashboard membres
            </Link>
            <p className="text-xs uppercase tracking-[0.14em] text-indigo-200/90">Membres · Data Quality</p>
            <h1 className="mt-2 bg-gradient-to-r from-indigo-100 via-sky-200 to-cyan-200 bg-clip-text text-3xl font-semibold text-transparent md:text-4xl">
              Centre de qualité des données membres
            </h1>
            <p className="mt-3 text-sm text-slate-300">
              Pilotage unifié des incohérences, écarts de sync et fiabilité Discord avec plan d’action priorisé.
            </p>
          </div>
          <button type="button" onClick={() => void loadData()} disabled={refreshing} className={`${subtleButtonClass} disabled:opacity-60`}>
            <RefreshCw className="h-4 w-4" />
            {refreshing ? "Actualisation..." : "Actualiser"}
          </button>
        </div>
      </section>

      {error ? (
        <section className="rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          Chargement partiel: {error}
        </section>
      ) : null}

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Score santé data</p>
          <p className="mt-2 text-3xl font-bold">{healthScore}</p>
          <p className="mt-1 text-xs text-slate-400">Indice global consolidé</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Incohérences</p>
          <p className="mt-2 text-3xl font-bold text-rose-300">{snapshot.errors}</p>
          <p className="mt-1 text-xs text-slate-400">À corriger en priorité</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Manquants Supabase</p>
          <p className="mt-2 text-3xl font-bold text-amber-300">{snapshot.syncMissingInSupabase}</p>
          <p className="mt-1 text-xs text-slate-400">Legacy non réconciliés</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Discord pseudo manquant</p>
          <p className="mt-2 text-3xl font-bold text-sky-300">{snapshot.discordMissingUsername}</p>
          <p className="mt-1 text-xs text-slate-400">À compléter côté Discord</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Avertissements</p>
          <p className="mt-2 text-3xl font-bold text-indigo-300">{snapshot.technicalWarnings}</p>
          <p className="mt-1 text-xs text-slate-400">Signaux techniques à surveiller</p>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.9fr_1fr]">
        <article className={`${sectionCardClass} p-5`}>
          <h2 className="text-lg font-semibold text-slate-100">Progression qualité</h2>
          <div className="mt-4 space-y-3">
            <div>
              <div className="mb-1 flex justify-between text-xs text-slate-300"><span>Couverture Discord</span><span>{qualityProgress.discordCoverage}%</span></div>
              <div className="h-2.5 rounded-full bg-slate-800"><div className="h-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-sky-300" style={{ width: `${qualityProgress.discordCoverage}%` }} /></div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs text-slate-300"><span>Intégrité synchronisation</span><span>{qualityProgress.syncIntegrity}%</span></div>
              <div className="h-2.5 rounded-full bg-slate-800"><div className="h-2.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-300" style={{ width: `${qualityProgress.syncIntegrity}%` }} /></div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs text-slate-300"><span>Stabilité technique</span><span>{qualityProgress.technicalStability}%</span></div>
              <div className="h-2.5 rounded-full bg-slate-800"><div className="h-2.5 rounded-full bg-gradient-to-r from-rose-500 to-orange-300" style={{ width: `${qualityProgress.technicalStability}%` }} /></div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs text-slate-300"><span>Complétude des profils</span><span>{qualityProgress.profileCompleteness}%</span></div>
              <div className="h-2.5 rounded-full bg-slate-800"><div className="h-2.5 rounded-full bg-gradient-to-r from-violet-500 to-indigo-300" style={{ width: `${qualityProgress.profileCompleteness}%` }} /></div>
            </div>
          </div>
        </article>
        <article className={`${sectionCardClass} p-5`}>
          <h2 className="text-lg font-semibold text-slate-100">Répartition des écarts</h2>
          <div className="mt-4 flex items-center gap-4">
            <div className="relative h-32 w-32 rounded-full" style={{ background: issueDonut.background }}>
              <div className="absolute inset-4 flex items-center justify-center rounded-full bg-[#0f1321] text-center">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.08em] text-slate-400">Total</p>
                  <p className="text-xl font-semibold text-slate-100">{issueDonut.total}</p>
                </div>
              </div>
            </div>
            <div className="space-y-1.5 text-xs">
              <p className="text-rose-200">Incohérences: {snapshot.errors}</p>
              <p className="text-amber-200">Sync: {snapshot.syncMissingInSupabase + snapshot.syncExtraInSupabase}</p>
              <p className="text-cyan-200">Discord: {snapshot.discordMissingUsername}</p>
              <p className="text-violet-200">Profils incomplets: {snapshot.incompleteAccounts}</p>
            </div>
          </div>
        </article>
        <article className={`${sectionCardClass} p-5`}>
          <h2 className="text-lg font-semibold text-slate-100">Plan d’action priorisé</h2>
          <div className="mt-3 space-y-2">
            {priorities.map((item) => {
              const cardClass = `flex items-center justify-between rounded-xl border px-3 py-2 text-sm transition ${
                  item.severity === "critical"
                    ? "border-rose-300/35 bg-rose-300/10 text-rose-100 hover:bg-rose-300/15"
                    : item.severity === "important"
                    ? "border-amber-300/35 bg-amber-300/10 text-amber-100 hover:bg-amber-300/15"
                    : "border-emerald-300/35 bg-emerald-300/10 text-emerald-100 hover:bg-emerald-300/15"
                }`;
              if (item.action === "open-sync-modal") {
                return (
                  <button key={item.id} type="button" onClick={() => void openSyncModal()} className={cardClass}>
                    <span className="flex items-center gap-2">
                      {item.severity !== "ok" ? <AlertTriangle className="h-4 w-4" /> : null}
                      {item.label}
                    </span>
                    <span className="font-semibold">{item.count}</span>
                  </button>
                );
              }
              return (
                <Link key={item.id} href={item.href} className={cardClass}>
                  <span className="flex items-center gap-2">
                    {item.severity !== "ok" ? <AlertTriangle className="h-4 w-4" /> : null}
                    {item.label}
                  </span>
                  <span className="font-semibold">{item.count}</span>
                </Link>
              );
            })}
          </div>
        </article>
      </section>

      <section className={`${sectionCardClass} p-3`}>
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-lg border px-3 py-2 text-sm transition ${
                activeTab === tab.id
                  ? "border-indigo-300/50 bg-indigo-400/20 text-indigo-100"
                  : "border-[#353a50] bg-[#121623]/80 text-slate-300 hover:border-indigo-300/35 hover:text-indigo-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-400">{tabs.find((tab) => tab.id === activeTab)?.hint}</p>
      </section>

      {loading ? <section className={`${sectionCardClass} p-4 text-sm text-slate-300`}>Chargement des onglets qualité...</section> : null}

      {!loading && activeTab === "diagnostic" ? (
        <section className={`${sectionCardClass} p-5 space-y-4`}>
          <h2 className="text-xl font-semibold">Diagnostic global</h2>
          <p className="text-sm text-slate-300">
            Vision consolidée des dettes de données avec accès direct aux modules de correction.
          </p>
          <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-[#353a50] bg-[#121623]/80 p-4">
              <p className="text-slate-400">Comptes incomplets</p>
              <p className="mt-2 text-2xl font-semibold">{snapshot.incompleteAccounts}</p>
              <Link href="/admin/membres/incomplets" className="mt-3 inline-flex items-center gap-1 text-indigo-200 hover:text-indigo-100">
                Ouvrir <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="rounded-xl border border-[#353a50] bg-[#121623]/80 p-4">
              <p className="text-slate-400">Avertissements techniques</p>
              <p className="mt-2 text-2xl font-semibold">{snapshot.technicalWarnings}</p>
              <Link href="/admin/membres/erreurs" className="mt-3 inline-flex items-center gap-1 text-indigo-200 hover:text-indigo-100">
                Vérifier <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="rounded-xl border border-[#353a50] bg-[#121623]/80 p-4">
              <p className="text-slate-400">Anomalies critiques</p>
              <p className="mt-2 text-2xl font-semibold text-rose-300">{snapshot.errors + snapshot.syncMissingInSupabase}</p>
              <p className="mt-2 text-xs text-slate-400">Incohérences + absents Supabase</p>
            </div>
            <div className="rounded-xl border border-[#353a50] bg-[#121623]/80 p-4">
              <p className="text-slate-400">Indice de fiabilité</p>
              <p className="mt-2 text-2xl font-semibold text-cyan-300">{Math.round((healthScore + qualityProgress.technicalStability) / 2)}%</p>
              <p className="mt-2 text-xs text-slate-400">Synthèse score global + stabilité</p>
            </div>
          </div>
        </section>
      ) : null}

      {!loading && activeTab === "discord" ? (
        <section className={`${sectionCardClass} p-5 space-y-4`}>
          <h2 className="text-xl font-semibold">Qualité des données Discord</h2>
          <p className="text-sm text-slate-300">
            Contrôle de cohérence entre identité Discord et fiche membre pour éviter les pertes de traçabilité.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="rounded-xl border border-[#353a50] bg-[#121623]/80 p-4">
              <p className="text-slate-400">Membres avec discordId</p>
              <p className="mt-2 text-2xl font-semibold">{snapshot.discordTotal}</p>
            </div>
            <div className="rounded-xl border border-[#353a50] bg-[#121623]/80 p-4">
              <p className="text-slate-400">Pseudo Discord manquant</p>
              <p className="mt-2 text-2xl font-semibold text-amber-300">{snapshot.discordMissingUsername}</p>
              <p className="mt-2 text-xs text-slate-400">
                Couverture: {qualityProgress.discordCoverage}%
              </p>
            </div>
            <div className="rounded-xl border border-[#353a50] bg-[#121623]/80 p-4 flex items-end">
              <Link href="/admin/membres/donnee-discord" className="inline-flex items-center gap-1 text-indigo-200 hover:text-indigo-100">
                Ouvrir le module Discord <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {!loading && activeTab === "sync" ? (
        <section className={`${sectionCardClass} p-5 space-y-4`}>
          <h2 className="text-xl font-semibold">Sync legacy ↔ Supabase</h2>
          <p className="text-sm text-slate-300">
            Suivi des écarts de migration pour éviter les membres perdus entre les sources historiques et la base cible.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="rounded-xl border border-[#353a50] bg-[#121623]/80 p-4">
              <p className="text-slate-400">Legacy absents Supabase</p>
              <p className="mt-2 text-2xl font-semibold text-rose-300">{snapshot.syncMissingInSupabase}</p>
            </div>
            <div className="rounded-xl border border-[#353a50] bg-[#121623]/80 p-4">
              <p className="text-slate-400">Supabase absents legacy</p>
              <p className="mt-2 text-2xl font-semibold text-sky-300">{snapshot.syncExtraInSupabase}</p>
              <p className="mt-2 text-xs text-slate-400">
                Intégrité: {qualityProgress.syncIntegrity}%
              </p>
            </div>
            <div className="rounded-xl border border-[#353a50] bg-[#121623]/80 p-4 flex items-end">
              <button type="button" onClick={() => void openSyncModal()} className="inline-flex items-center gap-1 text-indigo-200 hover:text-indigo-100">
                Ouvrir détails sync <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {!loading && activeTab === "reconciliation" ? (
        <section className={`${sectionCardClass} p-5 space-y-4`}>
          <h2 className="text-xl font-semibold">Réconciliation public → gestion</h2>
          <p className="text-sm text-slate-300">
            Ce volet centralise la détection d&apos;écarts entre données publiques et données administratives pour sécuriser les mises à jour membres.
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Link href="/admin/membres/reconciliation" className="rounded-lg border border-[#353a50] bg-[#121623]/80 px-4 py-3 text-sm text-slate-100 hover:border-indigo-300/45">
              Détection publique
            </Link>
            <Link href="/admin/membres/erreurs" className="rounded-lg border border-[#353a50] bg-[#121623]/80 px-4 py-3 text-sm text-slate-100 hover:border-indigo-300/45">
              Incohérences membres
            </Link>
            <Link href="/admin/membres/historique" className="rounded-lg border border-[#353a50] bg-[#121623]/80 px-4 py-3 text-sm text-slate-100 hover:border-indigo-300/45">
              Historique modifications
            </Link>
          </div>
        </section>
      ) : null}

      {isSyncModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className={`${sectionCardClass} max-h-[85vh] w-full max-w-4xl overflow-hidden`}>
            <div className="flex items-center justify-between border-b border-[#353a50] px-5 py-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-100">Détails synchronisation legacy ↔ Supabase</h3>
                <p className="text-xs text-slate-400">Vue rapide intégrée à la page qualité data</p>
              </div>
              <button
                type="button"
                onClick={() => setIsSyncModalOpen(false)}
                className="rounded-lg border border-[#353a50] bg-[#121623]/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-indigo-300/35"
              >
                Fermer
              </button>
            </div>
            <div className="overflow-y-auto p-5">
              {syncModalLoading ? (
                <p className="text-sm text-slate-300">Chargement des détails de synchronisation...</p>
              ) : syncModalError ? (
                <p className="rounded-lg border border-rose-400/35 bg-rose-400/10 p-3 text-sm text-rose-200">{syncModalError}</p>
              ) : syncModalData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                    <div className="rounded-xl border border-[#353a50] bg-[#121623]/80 p-3">
                      <p className="text-xs uppercase tracking-[0.08em] text-slate-400">Total Blobs</p>
                      <p className="mt-1 text-2xl font-semibold text-indigo-200">{syncModalData.totalInBlobs}</p>
                    </div>
                    <div className="rounded-xl border border-[#353a50] bg-[#121623]/80 p-3">
                      <p className="text-xs uppercase tracking-[0.08em] text-slate-400">Total Supabase</p>
                      <p className="mt-1 text-2xl font-semibold text-cyan-200">{syncModalData.totalInSupabase}</p>
                    </div>
                    <div className="rounded-xl border border-[#353a50] bg-[#121623]/80 p-3">
                      <p className="text-xs uppercase tracking-[0.08em] text-slate-400">Manquants Supabase</p>
                      <p className="mt-1 text-2xl font-semibold text-rose-200">{syncModalData.missingInSupabase.length}</p>
                    </div>
                    <div className="rounded-xl border border-[#353a50] bg-[#121623]/80 p-3">
                      <p className="text-xs uppercase tracking-[0.08em] text-slate-400">Extra Supabase</p>
                      <p className="mt-1 text-2xl font-semibold text-amber-200">{syncModalData.extraInSupabase.length}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="rounded-xl border border-[#353a50] bg-[#121623]/80 p-4">
                      <h4 className="text-sm font-semibold text-slate-100">Manquants dans Supabase</h4>
                      <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
                        {syncModalData.missingInSupabase.length === 0 ? (
                          <p className="text-sm text-emerald-300">Aucun membre manquant.</p>
                        ) : (
                          syncModalData.missingInSupabase.slice(0, 80).map((item) => (
                            <div key={item.twitchLogin} className="flex items-center justify-between rounded-lg border border-[#2e354a] bg-[#0f1321]/80 px-3 py-2">
                              <div>
                                <p className="text-sm text-slate-100">{item.displayName}</p>
                                <p className="text-xs text-slate-400">{item.twitchLogin}</p>
                              </div>
                              <span className="rounded-full border border-indigo-300/35 bg-indigo-300/10 px-2 py-0.5 text-[11px] text-indigo-100">
                                {item.source}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                    <div className="rounded-xl border border-[#353a50] bg-[#121623]/80 p-4">
                      <h4 className="text-sm font-semibold text-slate-100">Extra dans Supabase</h4>
                      <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
                        {syncModalData.extraInSupabase.length === 0 ? (
                          <p className="text-sm text-emerald-300">Aucun extra détecté.</p>
                        ) : (
                          syncModalData.extraInSupabase.slice(0, 80).map((login) => (
                            <div key={login} className="rounded-lg border border-[#2e354a] bg-[#0f1321]/80 px-3 py-2 text-sm text-slate-200">
                              {login}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Link
                      href="/admin/migration/members"
                      className="inline-flex items-center gap-1 rounded-lg border border-indigo-300/35 bg-indigo-500/25 px-4 py-2 text-sm font-semibold text-indigo-100 hover:bg-indigo-500/35"
                    >
                      Ouvrir module complet
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

