"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminToastStack, { type AdminToastItem } from "@/components/admin/ui/AdminToastStack";
import AdminTableShell from "@/components/admin/ui/AdminTableShell";
import { getDiscordUser } from "@/lib/discord";

type IntegrationItem = {
  id: string;
  title?: string;
  date: string;
  isPublished?: boolean;
};

type OpsPriority = "haute" | "moyenne" | "basse";

type OpsItem = {
  id: string;
  title: string;
  description: string;
  count: number;
  priority: OpsPriority;
  sla: string;
  owner: string;
  href: string;
};

type SavedView = {
  id: string;
  label: string;
  search: string;
  priorities: OpsPriority[];
};

type AggregateUpcomingKpis = {
  nextMeetingRegistrations: number;
  nextEventRegistrations: number;
  nextEventLabel: string;
  pendingEventValidations: number;
};

type AttendanceCorrelationData = {
  sessionsPastCount: number;
  totalAttendances: number;
  integratedMembersCount: number;
  targetIntegration: { id: string; title: string; date: string } | null;
  reassignableCandidates: Array<{
    twitchLogin: string;
    displayName: string;
    attendanceCount: number;
  }>;
};

function defaultView(): SavedView {
  return {
    id: "default-integration",
    label: "Vue Onboarding",
    search: "",
    priorities: ["haute", "moyenne", "basse"],
  };
}

export default function IntegrationDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([]);
  const [upcomingKpis, setUpcomingKpis] = useState<AggregateUpcomingKpis>({
    nextMeetingRegistrations: 0,
    nextEventRegistrations: 0,
    nextEventLabel: "",
    pendingEventValidations: 0,
  });
  const [attendanceStats, setAttendanceStats] = useState<AttendanceCorrelationData>({
    sessionsPastCount: 0,
    totalAttendances: 0,
    integratedMembersCount: 0,
    targetIntegration: null,
    reassignableCandidates: [],
  });
  const [dataMeta, setDataMeta] = useState<{ generatedAt: string | null; partial: boolean; errors: string[] }>({
    generatedAt: null,
    partial: false,
    errors: [],
  });
  const [toasts, setToasts] = useState<AdminToastItem[]>([]);
  const [opsOwners, setOpsOwners] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [selectedViewId, setSelectedViewId] = useState("");
  const [newViewLabel, setNewViewLabel] = useState("");
  const [username, setUsername] = useState("Admin");

  const SAVED_VIEWS_KEY = "tenf-admin-integration-dashboard-saved-views";
  const OWNERS_KEY = "tenf-admin-integration-dashboard-owners";

  function pushToast(type: "success" | "warning" | "info", title: string, description?: string) {
    const toast: AdminToastItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      title,
      description,
    };
    setToasts((prev) => [...prev, toast]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== toast.id));
    }, 3500);
  }

  const loadDashboard = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        const [aggregateRes, integrationsRes, attendanceRes] = await Promise.all([
          fetch("/api/admin/dashboard/aggregate", { cache: "no-store" }),
          fetch("/api/integrations?admin=true", { cache: "no-store" }),
          fetch("/api/admin/integrations/attendance-correlation", { cache: "no-store" }),
        ]);

        if (aggregateRes.ok) {
          const aggregateData = await aggregateRes.json();
          setUpcomingKpis(
            aggregateData?.data?.recap?.upcomingKpis || {
              nextMeetingRegistrations: 0,
              nextEventRegistrations: 0,
              nextEventLabel: "",
              pendingEventValidations: 0,
            }
          );
          setDataMeta({
            generatedAt: typeof aggregateData?.meta?.generatedAt === "string" ? aggregateData.meta.generatedAt : null,
            partial: aggregateData?.meta?.partial === true,
            errors: Array.isArray(aggregateData?.meta?.errors) ? aggregateData.meta.errors : [],
          });
        }

        if (integrationsRes.ok) {
          const integrationsData = await integrationsRes.json();
          setIntegrations(Array.isArray(integrationsData?.integrations) ? integrationsData.integrations : []);
        }

        if (attendanceRes.ok) {
          const attendanceData = await attendanceRes.json();
          setAttendanceStats(
            attendanceData?.data || {
              sessionsPastCount: 0,
              totalAttendances: 0,
              integratedMembersCount: 0,
              targetIntegration: null,
              reassignableCandidates: [],
            }
          );
        }
      } catch {
        pushToast("warning", "Chargement partiel", "Certaines données d'intégration sont indisponibles.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadDashboard(false);
  }, [loadDashboard]);

  useEffect(() => {
    let mounted = true;
    async function loadUser() {
      try {
        const [user, aliasRes] = await Promise.all([
          getDiscordUser(),
          fetch("/api/admin/access/self", { cache: "no-store" }),
        ]);
        if (!mounted) return;

        let displayName = user?.username || "Admin";
        if (aliasRes.ok) {
          const aliasData = await aliasRes.json();
          const alias = typeof aliasData?.adminAlias === "string" ? aliasData.adminAlias.trim() : "";
          if (alias) {
            displayName = alias;
          }
        }
        setUsername(displayName);
      } catch {
        // keep fallback
      }
    }
    void loadUser();
    return () => {
      mounted = false;
    };
  }, []);

  async function runAutoReassign() {
    try {
      setRefreshing(true);
      const response = await fetch("/api/admin/integrations/attendance-correlation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun: false, minAttendances: 1 }),
      });
      const data = await response.json();
      if (!response.ok) {
        pushToast("warning", "Réassignation échouée", data?.error || "Erreur serveur");
        return;
      }
      pushToast("success", "Réassignation automatique terminée", data?.message || "Traitement terminé.");
      await loadDashboard(true);
    } catch (error) {
      pushToast("warning", "Réassignation échouée", error instanceof Error ? error.message : "Erreur inconnue");
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    try {
      const ownersRaw = localStorage.getItem(OWNERS_KEY);
      if (ownersRaw) {
        const parsedOwners = JSON.parse(ownersRaw);
        if (parsedOwners && typeof parsedOwners === "object") {
          setOpsOwners(parsedOwners);
        }
      }

      const viewsRaw = localStorage.getItem(SAVED_VIEWS_KEY);
      if (viewsRaw) {
        const parsedViews = JSON.parse(viewsRaw);
        if (Array.isArray(parsedViews) && parsedViews.length > 0) {
          setSavedViews(parsedViews);
          setSelectedViewId(parsedViews[0].id);
          return;
        }
      }
    } catch {
      // Ignore malformed local data.
    }

    const baseView = defaultView();
    setSavedViews([baseView]);
    setSelectedViewId(baseView.id);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, selectedViewId, pageSize]);

  function persistOwners(nextOwners: Record<string, string>) {
    setOpsOwners(nextOwners);
    localStorage.setItem(OWNERS_KEY, JSON.stringify(nextOwners));
  }

  function assignOwner(itemId: string, owner: string) {
    const next = { ...opsOwners, [itemId]: owner };
    persistOwners(next);
    pushToast("info", "Owner mis à jour", owner ? `Assigné à ${owner}` : "Assignation supprimée");
  }

  function persistViews(nextViews: SavedView[]) {
    setSavedViews(nextViews);
    localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(nextViews));
  }

  function saveCurrentView() {
    if (!newViewLabel.trim()) {
      pushToast("warning", "Nom requis", "Renseigne un nom de vue.");
      return;
    }

    const active = savedViews.find((v) => v.id === selectedViewId) || defaultView();
    const newView: SavedView = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      label: newViewLabel.trim(),
      search: search || active.search,
      priorities: active.priorities,
    };
    const next = [newView, ...savedViews].slice(0, 20);
    persistViews(next);
    setSelectedViewId(newView.id);
    setNewViewLabel("");
    pushToast("success", "Vue sauvegardée", newView.label);
  }

  function deleteView(viewId: string) {
    const next = savedViews.filter((v) => v.id !== viewId);
    persistViews(next);
    setSelectedViewId(next[0]?.id || "");
    pushToast("info", "Vue supprimée");
  }

  const nowTs = Date.now();
  const totalIntegrations = integrations.length;
  const publishedCount = integrations.filter((item) => item.isPublished).length;
  const draftCount = integrations.filter((item) => !item.isPublished).length;
  const publicationRate = totalIntegrations > 0 ? Math.round((publishedCount / totalIntegrations) * 100) : 0;
  const upcomingIntegrations = integrations.filter((item) => {
    const ts = new Date(item.date).getTime();
    return Number.isFinite(ts) && ts >= nowTs;
  });
  const nextIntegration = upcomingIntegrations
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  const usefulAlerts = useMemo(() => {
    const alerts: Array<{ id: string; level: "critical" | "warning" | "info"; message: string; href: string }> = [];
    if (upcomingKpis.pendingEventValidations > 0) {
      alerts.push({
        id: "presence-pending",
        level: "critical",
        message: `${upcomingKpis.pendingEventValidations} événement(s) passé(s) sans présence validée.`,
        href: "/admin/onboarding/presences",
      });
    }
    if (draftCount > 0) {
      alerts.push({
        id: "drafts",
        level: "warning",
        message: `${draftCount} session(s) en brouillon à publier.`,
        href: "/admin/onboarding/sessions",
      });
    }
    if (!nextIntegration) {
      alerts.push({
        id: "no-next-session",
        level: "warning",
        message: "Aucune session future planifiée.",
        href: "/admin/onboarding/sessions",
      });
    }
    if (upcomingKpis.nextMeetingRegistrations === 0) {
      alerts.push({
        id: "no-registration",
        level: "info",
        message: "Aucune inscription pour la prochaine réunion d'intégration.",
        href: "/admin/onboarding/inscriptions",
      });
    }
    if (attendanceStats.reassignableCandidates.length > 0 && attendanceStats.targetIntegration?.id) {
      alerts.push({
        id: "auto-reassign",
        level: "info",
        message: `${attendanceStats.reassignableCandidates.length} membre(s) éligible(s) à la réassignation automatique vers la prochaine session.`,
        href: "/admin/onboarding/activation",
      });
    }
    return alerts;
  }, [
    attendanceStats.reassignableCandidates.length,
    attendanceStats.targetIntegration?.id,
    draftCount,
    nextIntegration,
    upcomingKpis.nextMeetingRegistrations,
    upcomingKpis.pendingEventValidations,
  ]);

  const opsQueue: OpsItem[] = [
    {
      id: "presence-retour",
      title: "Valider présences et retours",
      description: "Événements passés sans validation de présence.",
      count: upcomingKpis.pendingEventValidations,
      priority: upcomingKpis.pendingEventValidations > 0 ? "haute" : "moyenne",
      sla: "24h",
      owner: opsOwners["presence-retour"] || "",
      href: "/admin/onboarding/presences",
    },
    {
      id: "publish-drafts",
      title: "Publier les sessions en brouillon",
      description: "Intégrations prêtes mais non publiées.",
      count: draftCount,
      priority: draftCount > 0 ? "haute" : "basse",
      sla: "48h",
      owner: opsOwners["publish-drafts"] || "",
      href: "/admin/onboarding/sessions",
    },
    {
      id: "next-meeting-registrations",
      title: "Suivre la prochaine réunion",
      description: "Inscriptions de la prochaine session d'intégration.",
      count: upcomingKpis.nextMeetingRegistrations,
      priority: upcomingKpis.nextMeetingRegistrations === 0 ? "moyenne" : "basse",
      sla: "72h",
      owner: opsOwners["next-meeting-registrations"] || "",
      href: "/admin/onboarding/inscriptions",
    },
    {
      id: "moderator-enrollments",
      title: "Coordonner les modérateurs",
      description: "Inscriptions staff modération à vérifier.",
      count: upcomingKpis.nextEventRegistrations,
      priority: "moyenne",
      sla: "72h",
      owner: opsOwners["moderator-enrollments"] || "",
      href: "/admin/onboarding/staff",
    },
    {
      id: "next-event-push",
      title: "Animer le prochain event",
      description: upcomingKpis.nextEventLabel
        ? `Suivi inscription sur "${upcomingKpis.nextEventLabel}".`
        : "Suivi des inscriptions du prochain événement.",
      count: upcomingKpis.nextEventRegistrations,
      priority: upcomingKpis.nextEventRegistrations === 0 ? "moyenne" : "basse",
      sla: "72h",
      owner: opsOwners["next-event-push"] || "",
      href: "/admin/onboarding/inscriptions",
    },
    {
      id: "auto-reassign",
      title: "Réassigner automatiquement les présents",
      description: attendanceStats.targetIntegration?.title
        ? `Cibles proposées vers "${attendanceStats.targetIntegration.title}".`
        : "Cibles proposées vers la prochaine session publiée.",
      count: attendanceStats.reassignableCandidates.length,
      priority: attendanceStats.reassignableCandidates.length > 0 ? "haute" : "basse",
      sla: "24h",
      owner: opsOwners["auto-reassign"] || "",
      href: "/admin/onboarding/activation",
    },
    {
      id: "refresh-discours",
      title: "Mettre à jour présentation et discours",
      description: "Assurer la cohérence des supports d'intégration.",
      count: 1,
      priority: "basse",
      sla: "14 jours",
      owner: opsOwners["refresh-discours"] || "",
      href: "/admin/onboarding/contenus",
    },
  ];

  const activeView = savedViews.find((v) => v.id === selectedViewId) || defaultView();
  const effectiveSearch = (search || activeView.search || "").trim().toLowerCase();

  const filteredQueue = useMemo(() => {
    return opsQueue.filter((item) => {
      if (!activeView.priorities.includes(item.priority)) return false;
      if (!effectiveSearch) return true;
      return (
        item.title.toLowerCase().includes(effectiveSearch) ||
        item.description.toLowerCase().includes(effectiveSearch)
      );
    });
  }, [activeView.priorities, effectiveSearch, opsQueue]);

  const paginatedQueue = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredQueue.slice(start, start + pageSize);
  }, [filteredQueue, page, pageSize]);

  const sections = [
    {
      href: "/admin/onboarding/sessions",
      title: "Sessions",
      description: "Planifier les sessions d'onboarding.",
      icon: "📅",
      color: "from-blue-500 to-blue-600",
    },
    {
      href: "/admin/onboarding/inscriptions",
      title: "Inscriptions membres",
      description: "Piloter les inscriptions aux sessions.",
      icon: "📝",
      color: "from-green-500 to-green-600",
    },
    {
      href: "/admin/onboarding/staff",
      title: "Staff onboarding",
      description: "Coordonner la présence des modérateurs.",
      icon: "🛡️",
      color: "from-indigo-500 to-indigo-600",
    },
    {
      href: "/admin/onboarding/presences",
      title: "Présences",
      description: "Valider les présences et retours post-session.",
      icon: "👥",
      color: "from-purple-500 to-purple-600",
    },
    {
      href: "/admin/onboarding/activation",
      title: "Activation membres",
      description: "Réassigner et activer automatiquement les membres présents.",
      icon: "⚡",
      color: "from-fuchsia-500 to-violet-600",
    },
    {
      href: "/admin/onboarding/kpi",
      title: "KPI onboarding",
      description: "Suivre les indicateurs de performance du parcours.",
      icon: "📊",
      color: "from-amber-500 to-amber-600",
    },
    {
      href: "/admin/onboarding/contenus",
      title: "Contenus onboarding",
      description: "Centraliser présentation et trame de discours.",
      icon: "🎬",
      color: "from-teal-500 to-teal-600",
    },
    {
      href: "/admin/onboarding/discours2",
      title: "Discours (direct)",
      description: "Accès direct aux parties de discours onboarding.",
      icon: "🎤",
      color: "from-rose-500 to-rose-600",
    },
  ];

  if (loading) {
  return (
    <div className="text-white">
        <div className="flex h-64 items-center justify-center rounded-2xl border border-white/10">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-[#9146ff]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white integration-dashboard-premium">
      <AdminToastStack
        toasts={toasts}
        onClose={(id) => setToasts((prev) => prev.filter((toast) => toast.id !== id))}
      />

      <section className="rounded-2xl border border-[#e6c773]/25 bg-[radial-gradient(circle_at_top_left,_rgba(230,199,115,0.18),_rgba(18,18,24,0.96)_45%)] p-5 md:p-6 shadow-[0_18px_45px_rgba(0,0,0,0.35)] premium-hero-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-[#e6c773]">Onboarding membres</p>
            <h1 className="mt-2 text-3xl font-bold md:text-4xl premium-title-gradient">
              Bienvenue {username} dans l&apos;espace onboarding membres
            </h1>
          </div>
          <div className="grid w-full gap-2 sm:w-auto sm:min-w-[280px]">
            <button
              type="button"
              onClick={() => void loadDashboard(true)}
              disabled={refreshing}
              className="rounded-lg border border-[#e6c773]/35 px-3 py-2 text-xs font-semibold text-[#edd38d] hover:bg-[#e6c773]/10 disabled:opacity-60"
            >
              {refreshing ? "Actualisation..." : "Rafraîchir les données"}
            </button>
            <button
              type="button"
              onClick={() => void runAutoReassign()}
              disabled={refreshing || attendanceStats.reassignableCandidates.length === 0}
              className="rounded-lg border border-cyan-400/35 px-3 py-2 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/10 disabled:opacity-50"
            >
              Réassignation automatique ({attendanceStats.reassignableCandidates.length})
            </button>
            <p className="text-right text-xs text-gray-400">
              Dernière synchro :{" "}
              {dataMeta.generatedAt
                ? new Date(dataMeta.generatedAt).toLocaleString("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "n/a"}
            </p>
          </div>
        </div>
        {dataMeta.partial && (
          <p className="mt-3 inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-300">
            Chargement partiel ({dataMeta.errors.length} source(s) en erreur).
          </p>
        )}
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-[#1a1a1d] p-5 premium-kpi-card min-h-[128px]">
          <p className="text-xs uppercase tracking-[0.08em] text-gray-400">Sessions total</p>
          <p className="mt-2 text-3xl font-bold text-white premium-kpi-number">{totalIntegrations}</p>
          <p className="mt-2 text-xs text-gray-500">Historique d’intégration</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#1a1a1d] p-5 premium-kpi-card min-h-[128px]">
          <p className="text-xs uppercase tracking-[0.08em] text-gray-400">Membres intégrés</p>
          <p className="mt-2 text-3xl font-bold text-fuchsia-300 premium-kpi-number">
            {attendanceStats.integratedMembersCount}
          </p>
          <p className="mt-2 text-xs text-gray-500">{attendanceStats.totalAttendances} présences cumulées</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#1a1a1d] p-5 premium-kpi-card min-h-[128px]">
          <p className="text-xs uppercase tracking-[0.08em] text-gray-400">Sessions publiées</p>
          <p className="mt-2 text-3xl font-bold text-emerald-300 premium-kpi-number">{publishedCount}</p>
          <p className="mt-2 text-xs text-gray-500">Sessions visibles côté intégration</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#1a1a1d] p-5 premium-kpi-card min-h-[128px]">
          <p className="text-xs uppercase tracking-[0.08em] text-gray-400">Brouillons à publier</p>
          <p className="mt-2 text-3xl font-bold text-amber-300 premium-kpi-number">{draftCount}</p>
          <p className="mt-2 text-xs text-gray-500">À finaliser en planification</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#1a1a1d] p-5 premium-kpi-card min-h-[128px]">
          <p className="text-xs uppercase tracking-[0.08em] text-gray-400">Taux de publication</p>
          <p className="mt-2 text-3xl font-bold text-violet-300 premium-kpi-number">{publicationRate}%</p>
          <p className="mt-2 text-xs text-gray-500">Sessions publiées / total</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#1a1a1d] p-5 premium-kpi-card min-h-[128px]">
          <p className="text-xs uppercase tracking-[0.08em] text-gray-400">Prochaine réunion</p>
          <p className="mt-2 text-3xl font-bold text-cyan-300 premium-kpi-number">{upcomingKpis.nextMeetingRegistrations}</p>
          <p className="mt-2 text-xs text-gray-500">Inscriptions prévues</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#1a1a1d] p-5 premium-kpi-card min-h-[128px]">
          <p className="text-xs uppercase tracking-[0.08em] text-gray-400">Présences à valider</p>
          <p className="mt-2 text-3xl font-bold text-red-300 premium-kpi-number">{upcomingKpis.pendingEventValidations}</p>
          <p className="mt-2 text-xs text-gray-500">Événements passés à traiter</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#1a1a1d] p-5 premium-kpi-card min-h-[128px]">
          <p className="text-xs uppercase tracking-[0.08em] text-gray-400">Prochaine session</p>
          <p className="mt-2 text-3xl font-bold leading-none text-indigo-300 premium-kpi-number">
            {nextIntegration?.date
              ? new Date(nextIntegration.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
              : "Aucune"}
          </p>
          <p className="mt-2 truncate text-xs text-gray-500">{nextIntegration?.title || "Planification requise"}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#1a1a1d] p-5 premium-kpi-card min-h-[128px]">
          <p className="text-xs uppercase tracking-[0.08em] text-gray-400">Sessions passées</p>
          <p className="mt-2 text-3xl font-bold text-sky-300 premium-kpi-number">{attendanceStats.sessionsPastCount}</p>
          <p className="mt-2 text-xs text-gray-500">Base de corrélation présence</p>
        </div>
      </section>

      {usefulAlerts.length > 0 && (
        <section className="rounded-2xl border border-white/10 bg-[#1a1a1d] p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.08em] text-gray-200">Points de vigilance</h3>
          <div className="space-y-2">
            {usefulAlerts.map((alert) => (
              <Link
                key={alert.id}
                href={alert.href}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors ${
                  alert.level === "critical"
                    ? "border-red-500/35 bg-red-500/10 text-red-200 hover:bg-red-500/15"
                    : alert.level === "warning"
                    ? "border-amber-500/35 bg-amber-500/10 text-amber-200 hover:bg-amber-500/15"
                    : "border-sky-500/30 bg-sky-500/10 text-sky-200 hover:bg-sky-500/15"
                }`}
              >
                <span>{alert.message}</span>
                <span className="text-xs font-semibold uppercase tracking-[0.08em]">Ouvrir</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-[#17171d] p-3">
        <select
          value={selectedViewId}
          onChange={(e) => setSelectedViewId(e.target.value)}
          className="rounded-lg border border-gray-700 bg-[#0e0e10] px-3 py-2 text-sm text-white"
        >
          <option value="">Vues sauvegardées</option>
          {savedViews.map((view) => (
            <option key={view.id} value={view.id}>
              {view.label}
            </option>
          ))}
        </select>
        <input
          value={newViewLabel}
          onChange={(e) => setNewViewLabel(e.target.value)}
          placeholder="Nom de vue"
          className="rounded-lg border border-gray-700 bg-[#0e0e10] px-3 py-2 text-sm text-white"
        />
        <button
          onClick={saveCurrentView}
          className="rounded-lg bg-purple-600 px-3 py-2 text-sm font-semibold text-white hover:bg-purple-700"
        >
          Sauver vue
        </button>
        {selectedViewId && (
          <button
            onClick={() => deleteView(selectedViewId)}
            className="rounded-lg bg-red-600/20 px-3 py-2 text-sm font-semibold text-red-300 hover:bg-red-600/30"
          >
            Suppr vue
          </button>
        )}
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#1a1a1d] p-4">
        <AdminTableShell
          title="À traiter maintenant"
          subtitle="Priorités d'intégration avec SLA et owner"
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Filtrer les actions..."
          page={page}
          pageSize={pageSize}
          total={filteredQueue.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-3 py-2 text-left text-xs uppercase tracking-[0.08em] text-gray-300">Action</th>
                  <th className="px-3 py-2 text-left text-xs uppercase tracking-[0.08em] text-gray-300">Priorité</th>
                  <th className="px-3 py-2 text-left text-xs uppercase tracking-[0.08em] text-gray-300">SLA</th>
                  <th className="px-3 py-2 text-left text-xs uppercase tracking-[0.08em] text-gray-300">Volume</th>
                  <th className="px-3 py-2 text-left text-xs uppercase tracking-[0.08em] text-gray-300">Owner</th>
                  <th className="px-3 py-2 text-right text-xs uppercase tracking-[0.08em] text-gray-300">Action rapide</th>
                </tr>
              </thead>
              <tbody>
                {paginatedQueue.map((item) => (
                  <tr key={item.id} className="border-b border-white/5">
                    <td className="px-3 py-3">
                      <p className="font-semibold text-white">{item.title}</p>
                      <p className="text-xs text-gray-400">{item.description}</p>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          item.priority === "haute"
                            ? "bg-red-500/20 text-red-300"
                            : item.priority === "moyenne"
                            ? "bg-yellow-500/20 text-yellow-300"
                            : "bg-blue-500/20 text-blue-300"
                        }`}
                      >
                        {item.priority}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-300">{item.sla}</td>
                    <td className="px-3 py-3 text-sm font-semibold text-white">{item.count}</td>
                    <td className="px-3 py-3">
                      <input
                        value={item.owner}
                        onChange={(e) => assignOwner(item.id, e.target.value)}
                        placeholder="@owner"
                        className="w-40 rounded border border-gray-700 bg-[#0e0e10] px-2 py-1 text-xs text-white"
                      />
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Link
                        href={item.href}
                        className="inline-flex rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                      >
                        Ouvrir
                      </Link>
                    </td>
                  </tr>
                ))}
                {paginatedQueue.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-sm text-gray-400">
                      Aucune action correspondante pour cette vue.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </AdminTableShell>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="group rounded-xl border border-gray-700 bg-[#1a1a1d] p-5 transition-all hover:-translate-y-[1px] hover:border-[#9146ff] hover:shadow-lg hover:shadow-[#9146ff]/20 premium-module-card"
          >
            <div className="flex items-start gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${section.color} text-2xl`}>
                {section.icon}
              </div>
              <div className="flex-1">
                <h2 className="mb-1 text-base font-bold text-white transition-colors group-hover:text-[#9146ff]">
                  {section.title}
                </h2>
                <p className="text-gray-400 text-sm">{section.description}</p>
              </div>
              <svg
                className="w-6 h-6 text-gray-400 group-hover:text-[#9146ff] transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>
        ))}
      </div>

      <style jsx global>{`
        .integration-dashboard-premium .premium-title-gradient {
          background: linear-gradient(100deg, #ffffff 0%, #f8e4ab 45%, #e6c773 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .integration-dashboard-premium .premium-hero-card {
          position: relative;
          overflow: hidden;
        }

        .integration-dashboard-premium .premium-hero-card::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(120deg, transparent 0%, rgba(255, 255, 255, 0.06) 38%, transparent 62%);
          transform: translateX(-120%);
          animation: premium-sheen 7s ease-in-out infinite;
        }

        .integration-dashboard-premium .premium-kpi-card {
          position: relative;
          overflow: hidden;
          transition: transform 220ms ease, border-color 220ms ease, box-shadow 220ms ease;
        }

        .integration-dashboard-premium .premium-kpi-card:hover {
          transform: translateY(-2px);
          border-color: rgba(230, 199, 115, 0.4);
          box-shadow: 0 14px 28px rgba(0, 0, 0, 0.24);
        }

        .integration-dashboard-premium .premium-kpi-number {
          text-shadow: 0 0 18px rgba(255, 255, 255, 0.1);
        }

        .integration-dashboard-premium .premium-module-card {
          transition: transform 220ms ease, border-color 220ms ease, box-shadow 220ms ease;
        }

        .integration-dashboard-premium .premium-module-card:hover {
          box-shadow: 0 14px 30px rgba(16, 16, 24, 0.45);
        }

        @keyframes premium-sheen {
          0% {
            transform: translateX(-120%);
          }
          45% {
            transform: translateX(-120%);
          }
          62% {
            transform: translateX(120%);
          }
          100% {
            transform: translateX(120%);
          }
        }
      `}</style>
    </div>
  );
}
