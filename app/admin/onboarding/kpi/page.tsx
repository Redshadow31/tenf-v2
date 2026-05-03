"use client";

import { useEffect, useMemo, useState } from "react";

type IntegrationItem = {
  id: string;
  date: string;
  isPublished?: boolean;
};

type AttendanceData = {
  sessionsPastCount: number;
  totalAttendances: number;
  integratedMembersCount: number;
  reassignableCandidates: Array<{ twitchLogin: string }>;
};

export default function OnboardingKpiPage() {
  const [loading, setLoading] = useState(true);
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([]);
  const [attendance, setAttendance] = useState<AttendanceData>({
    sessionsPastCount: 0,
    totalAttendances: 0,
    integratedMembersCount: 0,
    reassignableCandidates: [],
  });
  const [pendingValidations, setPendingValidations] = useState(0);

  useEffect(() => {
    let mounted = true;
    async function loadKpis() {
      try {
        const [integrationsRes, correlationRes, aggregateRes] = await Promise.all([
          fetch("/api/integrations?admin=true", { cache: "no-store" }),
          fetch("/api/admin/integrations/attendance-correlation", { cache: "no-store" }),
          fetch("/api/admin/dashboard/aggregate", { cache: "no-store" }),
        ]);

        if (!mounted) return;
        if (integrationsRes.ok) {
          const payload = await integrationsRes.json();
          setIntegrations(Array.isArray(payload?.integrations) ? payload.integrations : []);
        }
        if (correlationRes.ok) {
          const payload = await correlationRes.json();
          setAttendance(
            payload?.data || {
              sessionsPastCount: 0,
              totalAttendances: 0,
              integratedMembersCount: 0,
              reassignableCandidates: [],
            }
          );
        }
        if (aggregateRes.ok) {
          const payload = await aggregateRes.json();
          setPendingValidations(Number(payload?.data?.recap?.upcomingKpis?.pendingEventValidations || 0));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void loadKpis();
    return () => {
      mounted = false;
    };
  }, []);

  const now = Date.now();
  const publishedCount = useMemo(
    () => integrations.filter((item) => item.isPublished).length,
    [integrations]
  );
  const futureCount = useMemo(
    () =>
      integrations.filter((item) => {
        const ts = new Date(item.date).getTime();
        return Number.isFinite(ts) && ts >= now;
      }).length,
    [integrations, now]
  );
  const publicationRate = integrations.length > 0 ? Math.round((publishedCount / integrations.length) * 100) : 0;
  const avgAttendancePerSession =
    attendance.sessionsPastCount > 0 ? Math.round((attendance.totalAttendances / attendance.sessionsPastCount) * 10) / 10 : 0;

  return (
    <div className="space-y-6 text-white">
      <section className="rounded-2xl border border-[#e6c773]/25 bg-[radial-gradient(circle_at_top_left,_rgba(230,199,115,0.18),_rgba(18,18,24,0.96)_45%)] p-5 md:p-6 shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
        <p className="text-xs uppercase tracking-[0.12em] text-[#e6c773]">Accueil & intégration</p>
        <h1 className="mt-2 text-3xl font-bold md:text-4xl">Indicateurs</h1>
        <p className="mt-2 text-sm text-gray-300">
          Synthèse pour la modération et l&apos;administration : sessions, présences, activation et suivi des relances.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-[#1a1a1d] p-4">
          <p className="text-xs uppercase tracking-[0.08em] text-gray-400">Sessions totales</p>
          <p className="mt-2 text-3xl font-bold">{integrations.length}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#1a1a1d] p-4">
          <p className="text-xs uppercase tracking-[0.08em] text-gray-400">Taux de publication</p>
          <p className="mt-2 text-3xl font-bold text-emerald-300">{publicationRate}%</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#1a1a1d] p-4">
          <p className="text-xs uppercase tracking-[0.08em] text-gray-400">Sessions futures</p>
          <p className="mt-2 text-3xl font-bold text-cyan-300">{futureCount}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#1a1a1d] p-4">
          <p className="text-xs uppercase tracking-[0.08em] text-gray-400">Présences à valider</p>
          <p className="mt-2 text-3xl font-bold text-red-300">{pendingValidations}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#1a1a1d] p-4">
          <p className="text-xs uppercase tracking-[0.08em] text-gray-400">Sessions passées</p>
          <p className="mt-2 text-3xl font-bold text-sky-300">{attendance.sessionsPastCount}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#1a1a1d] p-4">
          <p className="text-xs uppercase tracking-[0.08em] text-gray-400">Présences cumulées</p>
          <p className="mt-2 text-3xl font-bold text-fuchsia-300">{attendance.totalAttendances}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#1a1a1d] p-4">
          <p className="text-xs uppercase tracking-[0.08em] text-gray-400">Membres intégrés</p>
          <p className="mt-2 text-3xl font-bold text-violet-300">{attendance.integratedMembersCount}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#1a1a1d] p-4">
          <p className="text-xs uppercase tracking-[0.08em] text-gray-400">Moyenne présences/session</p>
          <p className="mt-2 text-3xl font-bold text-amber-300">{avgAttendancePerSession}</p>
        </div>
      </section>

      {loading ? <p className="text-sm text-gray-400">Chargement des KPI...</p> : null}
    </div>
  );
}

