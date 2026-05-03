"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, RefreshCw, ShieldCheck, Users } from "lucide-react";

type CorrelationData = {
  sessionsPastCount: number;
  totalAttendances: number;
  integratedMembersCount: number;
  targetIntegration: { id: string; title: string; date: string } | null;
  reassignableCandidates: Array<{
    twitchLogin: string;
    displayName: string;
    attendanceCount: number;
    discordUsername?: string;
    inMembersList: boolean;
    consideredActivated: boolean;
    memberRole?: string;
    memberStatus?: "actif" | "inactif";
  }>;
  activationSummary: {
    inMembersListCount: number;
    consideredActivatedCount: number;
    toActivateCount: number;
    missingInMembersListCount: number;
  };
};

const EMPTY_DATA: CorrelationData = {
  sessionsPastCount: 0,
  totalAttendances: 0,
  integratedMembersCount: 0,
  targetIntegration: null,
  reassignableCandidates: [],
  activationSummary: {
    inMembersListCount: 0,
    consideredActivatedCount: 0,
    toActivateCount: 0,
    missingInMembersListCount: 0,
  },
};

const glassCardClass =
  "rounded-2xl border border-indigo-300/20 bg-[linear-gradient(150deg,rgba(99,102,241,0.12),rgba(14,15,23,0.85)_45%,rgba(56,189,248,0.08))] shadow-[0_20px_50px_rgba(2,6,23,0.45)] backdrop-blur";
const sectionCardClass =
  "rounded-2xl border border-[#2f3244] bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.10),_rgba(11,13,20,0.95)_46%)] shadow-[0_16px_40px_rgba(2,6,23,0.45)]";
const subtleButtonClass =
  "inline-flex items-center gap-2 rounded-xl border border-indigo-300/25 bg-[linear-gradient(135deg,rgba(79,70,229,0.24),rgba(30,41,59,0.36))] px-3 py-2 text-sm font-medium text-indigo-100 transition hover:-translate-y-[1px] hover:border-indigo-200/45 hover:bg-[linear-gradient(135deg,rgba(99,102,241,0.34),rgba(30,41,59,0.54))]";

export default function OnboardingActivationPage() {
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CorrelationData>(EMPTY_DATA);

  async function loadData() {
    try {
      setError(null);
      const response = await fetch("/api/admin/integrations/attendance-correlation", {
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      setData(payload?.data || EMPTY_DATA);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function runAutoReassign() {
    try {
      setRunning(true);
      const response = await fetch("/api/admin/integrations/attendance-correlation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun: false, minAttendances: 1 }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Réassignation échouée");
      }
      await loadData();
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Erreur de réassignation");
    } finally {
      setRunning(false);
    }
  }

  async function runSyncMembersActivation() {
    try {
      setRunning(true);
      const response = await fetch("/api/admin/integrations/attendance-correlation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun: false, minAttendances: 1, syncMembers: true }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Synchronisation activation échouée");
      }
      await loadData();
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Erreur de synchronisation");
    } finally {
      setRunning(false);
    }
  }

  const topCandidates = useMemo(
    () => data.reassignableCandidates.slice(0, 25),
    [data.reassignableCandidates]
  );
  const activationProgress = useMemo(() => {
    const total = data.activationSummary.inMembersListCount;
    if (total <= 0) return 0;
    return Math.min(100, Math.round((data.activationSummary.consideredActivatedCount / total) * 100));
  }, [data.activationSummary.consideredActivatedCount, data.activationSummary.inMembersListCount]);

  return (
    <div className="space-y-6 text-white">
      <section className={`${glassCardClass} p-5 md:p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.14em] text-indigo-200/90">Accueil & intégration</p>
            <h1 className="mt-2 bg-gradient-to-r from-indigo-100 via-sky-200 to-cyan-200 bg-clip-text text-3xl font-semibold text-transparent md:text-4xl">
              Rôles & activation
            </h1>
            <p className="mt-3 text-sm text-slate-300">
              Pilotage pour réassigner automatiquement les participants aux sessions passées et synchroniser
              l&apos;activation dans la gestion des membres.
            </p>
          </div>
          <button type="button" onClick={() => void loadData()} disabled={running} className={subtleButtonClass}>
            <RefreshCw className="h-4 w-4" />
            Actualiser les données
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/admin/onboarding/presences" className={subtleButtonClass}>
            Ouvrir les présences
            <ArrowRight className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={() => void runAutoReassign()}
            disabled={running || data.reassignableCandidates.length === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/35 bg-cyan-300/10 px-3 py-2 text-sm font-medium text-cyan-100 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {running ? "Réassignation..." : `Réassigner automatiquement (${data.reassignableCandidates.length})`}
          </button>
          <button
            type="button"
            onClick={() => void runSyncMembersActivation()}
            disabled={running || data.activationSummary.toActivateCount === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-300/35 bg-emerald-300/10 px-3 py-2 text-sm font-medium text-emerald-100 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {running ? "Synchronisation..." : `Synchroniser activation gestion membres (${data.activationSummary.toActivateCount})`}
          </button>
        </div>
      </section>

      {error ? (
        <section className="rounded-2xl border border-rose-400/35 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </section>
      ) : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.08em] text-slate-400">Sessions passees</p>
          <p className="mt-2 text-3xl font-bold text-sky-300">{data.sessionsPastCount}</p>
        </div>
        <div className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.08em] text-slate-400">Presences cumulees</p>
          <p className="mt-2 text-3xl font-bold text-fuchsia-300">{data.totalAttendances}</p>
        </div>
        <div className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.08em] text-slate-400">Membres integres</p>
          <p className="mt-2 text-3xl font-bold text-emerald-300">{data.integratedMembersCount}</p>
        </div>
        <div className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.08em] text-slate-400">Candidats reassignables</p>
          <p className="mt-2 text-3xl font-bold text-amber-300">{data.reassignableCandidates.length}</p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.08em] text-gray-400">Dans gestion membres</p>
          <p className="mt-2 text-3xl font-bold text-sky-300">{data.activationSummary.inMembersListCount}</p>
        </div>
        <div className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.08em] text-gray-400">Consideres actives</p>
          <p className="mt-2 text-3xl font-bold text-emerald-300">{data.activationSummary.consideredActivatedCount}</p>
        </div>
        <div className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.08em] text-gray-400">A activer</p>
          <p className="mt-2 text-3xl font-bold text-amber-300">{data.activationSummary.toActivateCount}</p>
        </div>
        <div className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.08em] text-gray-400">Hors gestion membres</p>
          <p className="mt-2 text-3xl font-bold text-rose-300">{data.activationSummary.missingInMembersListCount}</p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_1fr]">
        <article className={`${sectionCardClass} p-4`}>
          <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-gray-200">Regles d'activation appliquees</h2>
          <div className="mt-2 space-y-1 text-sm text-gray-300">
            <p>- Synchronisation avec la liste de gestion des membres.</p>
            <p>- Un profil est considere active si son statut est actif.</p>
            <p>- Un profil est aussi considere active si son role est Actif, Affilie ou Developpement.</p>
            <p>- Les profils presents en sessions passees mais non actives peuvent etre synchronises en un clic.</p>
          </div>
        </article>

        <article className={`${sectionCardClass} p-4`}>
          <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-gray-200">Qualite d'activation</h2>
          <p className="mt-2 text-xs text-slate-400">Progression des membres deja actives dans la gestion membres.</p>
          <div className="mt-3 h-2 rounded-full bg-slate-800/80">
            <div
              className="h-2 rounded-full bg-[linear-gradient(90deg,rgba(16,185,129,0.9),rgba(56,189,248,0.9))]"
              style={{ width: `${activationProgress}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-emerald-200">{activationProgress}% de couverture active</p>
          <div className="mt-3 rounded-xl border border-indigo-300/25 bg-indigo-400/10 p-3 text-xs text-indigo-100">
            <div className="inline-flex items-center gap-2 font-medium">
              <ShieldCheck className="h-3.5 w-3.5" />
              Explication de la page
            </div>
            <p className="mt-1">
              Cette vue sert a decider qui doit etre active maintenant, a tracer les exceptions et a fiabiliser la transition
              entre onboarding et gestion membres.
            </p>
          </div>
        </article>
      </section>

      <section className={`${sectionCardClass} p-4`}>
        <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-gray-200">Cible de reassignation</h2>
        {data.targetIntegration ? (
          <p className="mt-2 text-sm text-gray-300">
            {data.targetIntegration.title} -{" "}
            {new Date(data.targetIntegration.date).toLocaleString("fr-FR", {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        ) : (
          <p className="mt-2 text-sm text-amber-300">Aucune session future publiee disponible.</p>
        )}
      </section>

      <section className={`${sectionCardClass} p-4`}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-gray-200">Top candidats a activer</h2>
          <span className="inline-flex items-center gap-1 rounded-full border border-cyan-300/35 bg-cyan-300/10 px-2 py-0.5 text-xs text-cyan-100">
            <Users className="h-3 w-3" />
            {topCandidates.length} affiches
          </span>
        </div>
        {loading ? (
          <p className="text-sm text-gray-400">Chargement...</p>
        ) : topCandidates.length === 0 ? (
          <p className="text-sm text-gray-400">Aucun candidat disponible.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase tracking-[0.08em] text-gray-400">
                  <th className="px-2 py-2">Membre</th>
                  <th className="px-2 py-2">Twitch</th>
                  <th className="px-2 py-2">Presences</th>
                  <th className="px-2 py-2">Gestion membres</th>
                  <th className="px-2 py-2">Activation</th>
                </tr>
              </thead>
              <tbody>
                {topCandidates.map((candidate) => (
                  <tr key={candidate.twitchLogin} className="border-b border-white/5">
                    <td className="px-2 py-2">{candidate.displayName || candidate.discordUsername || "N/A"}</td>
                    <td className="px-2 py-2">@{candidate.twitchLogin}</td>
                    <td className="px-2 py-2 font-semibold text-amber-300">{candidate.attendanceCount}</td>
                    <td className="px-2 py-2">
                      {candidate.inMembersList ? (
                        <span className="inline-flex rounded-full border border-sky-400/35 bg-sky-500/15 px-2 py-0.5 text-xs text-sky-100">
                          Oui
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full border border-rose-400/35 bg-rose-500/15 px-2 py-0.5 text-xs text-rose-100">
                          Non
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      {candidate.consideredActivated ? (
                        <span className="inline-flex rounded-full border border-emerald-400/35 bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-100">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full border border-amber-400/35 bg-amber-500/15 px-2 py-0.5 text-xs text-amber-100">
                          A activer
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

