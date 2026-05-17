"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Users } from "lucide-react";
import {
  OnboardingActivationHubView,
  type ActivationCandidateRow,
} from "@/components/admin/OnboardingActivationHubView";

type CorrelationData = {
  sessionsPastCount: number;
  totalAttendances: number;
  integratedMembersCount: number;
  targetIntegration: { id: string; title: string; date: string } | null;
  reassignableCandidates: ActivationCandidateRow[];
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

const hubPanelClass =
  "rounded-2xl border border-white/[0.08] bg-zinc-950/55 shadow-sm shadow-black/20 ring-1 ring-inset ring-white/[0.03]";

export default function OnboardingActivationPage() {
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CorrelationData>(EMPTY_DATA);
  const priorityRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

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

  const needsActivation = useMemo(
    () =>
      data.reassignableCandidates
        .filter((c) => c.inMembersList && !c.consideredActivated)
        .slice(0, 12),
    [data.reassignableCandidates]
  );

  const missingFromAnnuaire = useMemo(
    () => data.reassignableCandidates.filter((c) => !c.inMembersList).slice(0, 12),
    [data.reassignableCandidates]
  );

  const activationProgress = useMemo(() => {
    const total = data.activationSummary.inMembersListCount;
    if (total <= 0) return 0;
    return Math.min(100, Math.round((data.activationSummary.consideredActivatedCount / total) * 100));
  }, [data.activationSummary.consideredActivatedCount, data.activationSummary.inMembersListCount]);

  const formatDateShort = (iso: string) =>
    new Date(iso).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  const scrollToPriority = () => {
    priorityRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToTable = () => {
    tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const candidatesTable = (
    <section className={`${hubPanelClass} p-4`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-xs uppercase tracking-wide text-zinc-500">Tableau détaillé</span>
        <span className="inline-flex items-center gap-1 rounded-full border border-cyan-400/35 bg-cyan-950/20 px-2 py-0.5 text-xs text-cyan-100">
          <Users className="h-3 w-3" aria-hidden />
          {topCandidates.length} affichés
        </span>
      </div>
      {loading ? (
        <p className="text-sm text-zinc-500" role="status" aria-live="polite">
          Chargement…
        </p>
      ) : topCandidates.length === 0 ? (
        <p className="text-sm text-zinc-500">Aucun candidat disponible.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase tracking-[0.08em] text-zinc-500">
                <th className="px-2 py-2">Membre</th>
                <th className="px-2 py-2">Twitch</th>
                <th className="px-2 py-2">Présences</th>
                <th className="px-2 py-2">Gestion membres</th>
                <th className="px-2 py-2">Activation</th>
              </tr>
            </thead>
            <tbody>
              {topCandidates.map((candidate) => (
                <tr key={candidate.twitchLogin} className="border-b border-white/5">
                  <td className="px-2 py-2">
                    {candidate.displayName || candidate.discordUsername || "N/A"}
                  </td>
                  <td className="px-2 py-2">
                    <a
                      href={`/admin/membres/gestion?search=${encodeURIComponent(candidate.twitchLogin)}`}
                      className="text-violet-200 hover:underline"
                    >
                      @{candidate.twitchLogin}
                    </a>
                  </td>
                  <td className="px-2 py-2 font-semibold tabular-nums text-amber-200">
                    {candidate.attendanceCount}
                  </td>
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
                        Actif
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full border border-amber-400/35 bg-amber-500/15 px-2 py-0.5 text-xs text-amber-100">
                        À activer
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
  );

  return (
    <OnboardingActivationHubView
      loading={loading}
      running={running}
      error={error}
      onRefresh={() => {
        setLoading(true);
        void loadData();
      }}
      onReassign={() => void runAutoReassign()}
      onSyncActivation={() => void runSyncMembersActivation()}
      sessionsPastCount={data.sessionsPastCount}
      totalAttendances={data.totalAttendances}
      integratedMembersCount={data.integratedMembersCount}
      reassignableCount={data.reassignableCandidates.length}
      activationSummary={data.activationSummary}
      activationProgress={activationProgress}
      targetIntegration={data.targetIntegration}
      needsActivation={needsActivation}
      missingFromAnnuaire={missingFromAnnuaire}
      priorityRef={priorityRef}
      tableRef={tableRef}
      onScrollToPriority={scrollToPriority}
      onScrollToTable={scrollToTable}
      formatDateShort={formatDateShort}
      onMemberLinked={() => {
        setLoading(true);
        void loadData();
      }}
    >
      {candidatesTable}
    </OnboardingActivationHubView>
  );
}
