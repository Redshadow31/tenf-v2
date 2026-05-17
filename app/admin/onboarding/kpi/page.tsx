"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { OnboardingKpiHubView } from "@/components/admin/OnboardingKpiHubView";

type IntegrationItem = {
  id: string;
  date: string;
  isPublished?: boolean;
};

type CorrelationSession = {
  integrationId: string;
  title: string;
  date: string;
  attendedCount: number;
  registrationsCount: number;
};

type AttendanceData = {
  sessionsPastCount: number;
  totalAttendances: number;
  integratedMembersCount: number;
  reassignableCandidates: Array<{ twitchLogin: string }>;
  activationSummary: {
    toActivateCount: number;
  };
  sessions: CorrelationSession[];
};

const EMPTY_ATTENDANCE: AttendanceData = {
  sessionsPastCount: 0,
  totalAttendances: 0,
  integratedMembersCount: 0,
  reassignableCandidates: [],
  activationSummary: { toActivateCount: 0 },
  sessions: [],
};

const hubPanelClass =
  "rounded-2xl border border-white/[0.08] bg-zinc-950/55 shadow-sm shadow-black/20 ring-1 ring-inset ring-white/[0.03]";

type MetricTile = {
  id: string;
  label: string;
  value: string | number;
  hint: string;
  tone: string;
};

export default function OnboardingKpiPage() {
  const [loading, setLoading] = useState(true);
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([]);
  const [attendance, setAttendance] = useState<AttendanceData>(EMPTY_ATTENDANCE);
  const [profileValidationPending, setProfileValidationPending] = useState(0);
  const metricsRef = useRef<HTMLDivElement>(null);

  const loadKpis = useCallback(async () => {
    try {
      setLoading(true);
      const [integrationsRes, correlationRes, aggregateRes] = await Promise.all([
        fetch("/api/integrations?admin=true", { cache: "no-store" }),
        fetch("/api/admin/integrations/attendance-correlation", { cache: "no-store" }),
        fetch("/api/admin/dashboard/aggregate", { cache: "no-store" }),
      ]);

      if (integrationsRes.ok) {
        const payload = await integrationsRes.json();
        setIntegrations(Array.isArray(payload?.integrations) ? payload.integrations : []);
      }
      if (correlationRes.ok) {
        const payload = await correlationRes.json();
        const data = payload?.data;
        setAttendance({
          sessionsPastCount: Number(data?.sessionsPastCount ?? 0),
          totalAttendances: Number(data?.totalAttendances ?? 0),
          integratedMembersCount: Number(data?.integratedMembersCount ?? 0),
          reassignableCandidates: Array.isArray(data?.reassignableCandidates) ? data.reassignableCandidates : [],
          activationSummary: {
            toActivateCount: Number(data?.activationSummary?.toActivateCount ?? 0),
          },
          sessions: Array.isArray(data?.sessions) ? data.sessions : [],
        });
      } else {
        setAttendance(EMPTY_ATTENDANCE);
      }
      if (aggregateRes.ok) {
        const payload = await aggregateRes.json();
        setProfileValidationPending(Number(payload?.data?.ops?.profileValidationPendingCount ?? 0));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadKpis();
  }, [loadKpis]);

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
    attendance.sessionsPastCount > 0
      ? Math.round((attendance.totalAttendances / attendance.sessionsPastCount) * 10) / 10
      : 0;

  const sessionsMissingPresences = useMemo(
    () =>
      attendance.sessions.filter((s) => s.registrationsCount > 0 && s.attendedCount === 0).length,
    [attendance.sessions]
  );

  const metricsGrid = useMemo((): MetricTile[] => {
    return [
      {
        id: "sessions-total",
        label: "Sessions totales",
        value: integrations.length,
        hint: "Créneaux d'accueil (tous statuts)",
        tone: "text-zinc-100",
      },
      {
        id: "publication-rate",
        label: "Taux de publication",
        value: `${publicationRate}%`,
        hint: `${publishedCount} publiées sur ${integrations.length}`,
        tone: "text-emerald-200",
      },
      {
        id: "future",
        label: "Sessions futures",
        value: futureCount,
        hint: "Date ≥ aujourd'hui",
        tone: "text-cyan-200",
      },
      {
        id: "missing-presences",
        label: "Sans saisie présences",
        value: sessionsMissingPresences,
        hint: "Inscrits mais attendedCount = 0",
        tone: sessionsMissingPresences > 0 ? "text-rose-200" : "text-zinc-300",
      },
      {
        id: "past",
        label: "Sessions passées",
        value: attendance.sessionsPastCount,
        hint: "Corrélation post-session",
        tone: "text-sky-200",
      },
      {
        id: "attendances",
        label: "Présences cumulées",
        value: attendance.totalAttendances,
        hint: "Total des présents enregistrés",
        tone: "text-fuchsia-200",
      },
      {
        id: "integrated",
        label: "Membres intégrés",
        value: attendance.integratedMembersCount,
        hint: "Reconnus dans le parcours",
        tone: "text-violet-200",
      },
      {
        id: "avg",
        label: "Moyenne présences / session",
        value: avgAttendancePerSession,
        hint: "Sur sessions passées uniquement",
        tone: "text-amber-200",
      },
      {
        id: "to-activate",
        label: "À activer (gestion)",
        value: attendance.activationSummary.toActivateCount,
        hint: "activationSummary.toActivateCount",
        tone: attendance.activationSummary.toActivateCount > 0 ? "text-amber-200" : "text-zinc-300",
      },
      {
        id: "reassignable",
        label: "Candidats réassignables",
        value: attendance.reassignableCandidates.length,
        hint: "Éligibles réassignation auto",
        tone: "text-zinc-200",
      },
      {
        id: "profile-validation",
        label: "Validations profil en attente",
        value: profileValidationPending,
        hint: "Dashboard ops (hors événements)",
        tone: profileValidationPending > 0 ? "text-amber-200" : "text-zinc-300",
      },
    ];
  }, [
    integrations.length,
    publicationRate,
    publishedCount,
    futureCount,
    sessionsMissingPresences,
    attendance,
    avgAttendancePerSession,
    profileValidationPending,
  ]);

  const scrollToMetrics = () => {
    metricsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const metricsContent = (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {metricsGrid.map((tile) => (
        <article key={tile.id} className={`${hubPanelClass} p-4`}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-500">{tile.label}</p>
          <p className={`mt-2 text-3xl font-bold tabular-nums ${tile.tone}`}>{tile.value}</p>
          <p className="mt-2 text-xs leading-snug text-zinc-600">{tile.hint}</p>
        </article>
      ))}
    </div>
  );

  return (
    <OnboardingKpiHubView
      loading={loading}
      onRefresh={() => void loadKpis()}
      heroStats={{
        sessionsTotal: integrations.length,
        sessionsPast: attendance.sessionsPastCount,
        totalAttendances: attendance.totalAttendances,
        integratedMembers: attendance.integratedMembersCount,
      }}
      publicationRate={publicationRate}
      futureSessions={futureCount}
      sessionsMissingPresences={sessionsMissingPresences}
      toActivateCount={attendance.activationSummary.toActivateCount}
      profileValidationPending={profileValidationPending}
      metricsRef={metricsRef}
      onScrollToMetrics={scrollToMetrics}
    >
      {metricsContent}
    </OnboardingKpiHubView>
  );
}
