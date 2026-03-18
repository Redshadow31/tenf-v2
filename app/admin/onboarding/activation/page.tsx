"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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
  }>;
};

const EMPTY_DATA: CorrelationData = {
  sessionsPastCount: 0,
  totalAttendances: 0,
  integratedMembersCount: 0,
  targetIntegration: null,
  reassignableCandidates: [],
};

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

  const topCandidates = useMemo(
    () => data.reassignableCandidates.slice(0, 25),
    [data.reassignableCandidates]
  );

  return (
    <div className="space-y-6 text-white">
      <section className="rounded-2xl border border-[#e6c773]/25 bg-[radial-gradient(circle_at_top_left,_rgba(230,199,115,0.18),_rgba(18,18,24,0.96)_45%)] p-5 md:p-6 shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
        <p className="text-xs uppercase tracking-[0.12em] text-[#e6c773]">Onboarding membres</p>
        <h1 className="mt-2 text-3xl font-bold md:text-4xl">Activation membres</h1>
        <p className="mt-2 text-sm text-gray-300">
          Réassignation et activation des membres présents sur les sessions passées.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/admin/onboarding/presences" className="rounded-lg border border-white/15 px-3 py-2 text-xs hover:bg-white/10">
            Ouvrir présences
          </Link>
          <button
            type="button"
            onClick={() => void runAutoReassign()}
            disabled={running || data.reassignableCandidates.length === 0}
            className="rounded-lg border border-cyan-400/35 px-3 py-2 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/10 disabled:opacity-50"
          >
            {running ? "Réassignation..." : `Réassigner automatiquement (${data.reassignableCandidates.length})`}
          </button>
        </div>
      </section>

      {error ? (
        <section className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </section>
      ) : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-[#1a1a1d] p-4">
          <p className="text-xs uppercase tracking-[0.08em] text-gray-400">Sessions passées</p>
          <p className="mt-2 text-3xl font-bold text-sky-300">{data.sessionsPastCount}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#1a1a1d] p-4">
          <p className="text-xs uppercase tracking-[0.08em] text-gray-400">Présences cumulées</p>
          <p className="mt-2 text-3xl font-bold text-fuchsia-300">{data.totalAttendances}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#1a1a1d] p-4">
          <p className="text-xs uppercase tracking-[0.08em] text-gray-400">Membres intégrés</p>
          <p className="mt-2 text-3xl font-bold text-emerald-300">{data.integratedMembersCount}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#1a1a1d] p-4">
          <p className="text-xs uppercase tracking-[0.08em] text-gray-400">Candidats réassignables</p>
          <p className="mt-2 text-3xl font-bold text-amber-300">{data.reassignableCandidates.length}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#1a1a1d] p-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-gray-200">Cible de réassignation</h2>
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
          <p className="mt-2 text-sm text-amber-300">Aucune session future publiée disponible.</p>
        )}
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#1a1a1d] p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.08em] text-gray-200">
          Top candidats à activer
        </h2>
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
                  <th className="px-2 py-2">Présences</th>
                </tr>
              </thead>
              <tbody>
                {topCandidates.map((candidate) => (
                  <tr key={candidate.twitchLogin} className="border-b border-white/5">
                    <td className="px-2 py-2">{candidate.displayName || candidate.discordUsername || "N/A"}</td>
                    <td className="px-2 py-2">@{candidate.twitchLogin}</td>
                    <td className="px-2 py-2 font-semibold text-amber-300">{candidate.attendanceCount}</td>
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

