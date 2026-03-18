"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import { ArrowUpRight, ShieldCheck, Sparkles } from "lucide-react";
import { getDiscordUser } from "@/lib/discord";
import AdminToastStack, { type AdminToastItem, type AdminToastType } from "@/components/admin/ui/AdminToastStack";
import AdminTableShell from "@/components/admin/ui/AdminTableShell";

interface MemberEventLite {
  id: string;
  memberId: string;
  type: string;
  createdAt: string;
  source?: string;
  actor?: string;
  payload?: Record<string, unknown>;
}

interface RecapEvent {
  event: {
    id: string;
    title: string;
    date: string;
    category: string;
    isPublished: boolean;
  };
  registrationCount: number;
  presenceCount: number;
}

interface EventWithRegistrationsLite {
  event: {
    id: string;
    title: string;
    date: string;
    category?: string;
    isPublished?: boolean;
  };
  registrationCount: number;
  presenceCount?: number;
}

interface WorkflowStep {
  id: string;
  label: string;
  href: string;
  status: "todo" | "in_progress" | "done";
  helper: string;
}

interface OpsQueueItem {
  id: string;
  title: string;
  href: string;
  count: number;
  priority: "P1" | "P2" | "P3";
  slaHours: number;
  owner?: string;
}

interface DashboardSavedView {
  id: string;
  label: string;
  roleScope: string;
  filters: {
    priorities: Array<OpsQueueItem["priority"]>;
    onlyWithCount: boolean;
  };
}

interface StaffApplicationLite {
  id: string;
  admin_status: "nouveau" | "a_contacter" | "entretien_prevu" | "accepte" | "refuse" | "archive";
  has_red_flag?: boolean;
}

interface RankedCountItem {
  rank: number;
  displayName: string;
  count: number;
}

interface DiscordRankedMessagesItem {
  rank: number;
  displayName: string;
  messages: number;
}

interface DiscordRankedVocalsItem {
  rank: number;
  displayName: string;
  display: string;
}

interface FollowSummaryItem {
  staffSlug: string;
  staffName: string;
  status: "up_to_date" | "obsolete" | "not_validated";
}

interface DashboardSummary {
  total: number;
  missingDiscord: number;
  missingTwitchId: number;
  incomplete: number;
  reviewOverdue: number;
  reviewDue7d: number;
  avgCompletion: number;
  validatedProfiles: number;
  communityMonthCount: number;
}

interface RaidDeclarationLite {
  id: string;
  status: "processing" | "to_study" | "validated" | "rejected";
}

function normalizeCategoryLabel(value: string | undefined): string {
  return (value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function monthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function previousMonthKey(date = new Date()): string {
  return monthKey(new Date(date.getFullYear(), date.getMonth() - 1, 1));
}

function monthLabelFromDate(date: Date): string {
  const names = ["Jan", "Fev", "Mar", "Avr", "Mai", "Juin", "Juil", "Aout", "Sep", "Oct", "Nov", "Dec"];
  return `${names[date.getMonth()]} ${String(date.getFullYear()).slice(-2)}`;
}

const premiumCardStyle: CSSProperties = {
  borderColor: "rgba(212,175,55,0.2)",
  background: "linear-gradient(155deg, rgba(30,30,36,0.95), rgba(19,19,24,0.98))",
  boxShadow: "0 16px 36px rgba(0, 0, 0, 0.22)",
};

const softCardStyle: CSSProperties = {
  borderColor: "rgba(255,255,255,0.1)",
  background: "linear-gradient(160deg, rgba(24,24,30,0.95), rgba(15,15,20,0.96))",
};

const subtleMutedText: CSSProperties = {
  color: "rgba(214, 214, 224, 0.75)",
};

const focusRingClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#e6c773] focus-visible:ring-offset-[#17171d]";

const DASHBOARD_VIEW_STORAGE_KEY = "tenf:admin:dashboard2:saved-views";
const OPS_OWNER_STORAGE_KEY = "tenf:admin:dashboard2:ops-owners";

function createToast(type: AdminToastType, title: string, description?: string): AdminToastItem {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    title,
    description,
  };
}

function defaultViewForRole(role: string | null): DashboardSavedView {
  const normalized = (role || "").toUpperCase();
  if (normalized.includes("MODERATEUR")) {
    return {
      id: "moderation",
      label: "Modération",
      roleScope: normalized || "ALL",
      filters: { priorities: ["P1", "P2"], onlyWithCount: true },
    };
  }
  if (normalized.includes("SOUTIEN")) {
    return {
      id: "support",
      label: "Support",
      roleScope: normalized || "ALL",
      filters: { priorities: ["P2", "P3"], onlyWithCount: true },
    };
  }
  if (normalized.includes("ADMIN")) {
    return {
      id: "operations",
      label: "Opérations",
      roleScope: normalized || "ALL",
      filters: { priorities: ["P1", "P2", "P3"], onlyWithCount: true },
    };
  }
  return {
    id: "default",
    label: "Vue globale",
    roleScope: normalized || "ALL",
    filters: { priorities: ["P1", "P2", "P3"], onlyWithCount: true },
  };
}

export default function Dashboard2Page() {
  const [currentAdmin, setCurrentAdmin] = useState<{ username: string; role: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingVisual, setLoadingVisual] = useState(true);
  const [loadingRecap, setLoadingRecap] = useState(true);
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary>({
    total: 0,
    missingDiscord: 0,
    missingTwitchId: 0,
    incomplete: 0,
    reviewOverdue: 0,
    reviewDue7d: 0,
    avgCompletion: 0,
    validatedProfiles: 0,
    communityMonthCount: 0,
  });
  const [events, setEvents] = useState<MemberEventLite[]>([]);
  const [finalNotesCount, setFinalNotesCount] = useState(0);
  const [followOverdueStaffNames, setFollowOverdueStaffNames] = useState<string[]>([]);
  const [vipMonthCount, setVipMonthCount] = useState(0);
  const [staffApplicationsPendingCount, setStaffApplicationsPendingCount] = useState(0);
  const [staffApplicationsRedFlagCount, setStaffApplicationsRedFlagCount] = useState(0);
  const [profileValidationPendingCount, setProfileValidationPendingCount] = useState(0);
  const [raidsPendingCount, setRaidsPendingCount] = useState(0);
  const [discordPointsPendingCount, setDiscordPointsPendingCount] = useState(0);
  const [raidsIgnoredToProcessCount, setRaidsIgnoredToProcessCount] = useState(0);
  const [discordGrowthData, setDiscordGrowthData] = useState<Array<{ month: string; value: number }>>([]);
  const [monthlyActivityData, setMonthlyActivityData] = useState<Array<{ month: string; messages: number; vocals: number }>>([]);
  const [spotlightProgressionData, setSpotlightProgressionData] = useState<Array<{ month: string; value: number }>>([]);
  const [raidStats, setRaidStats] = useState<{
    totalRaidsReceived: number;
    totalRaidsSent: number;
    topRaiders: RankedCountItem[];
    topTargets: RankedCountItem[];
  }>({ totalRaidsReceived: 0, totalRaidsSent: 0, topRaiders: [], topTargets: [] });
  const [discordMonthStats, setDiscordMonthStats] = useState<{
    totalMessages: number;
    totalVoiceHours: number;
    topMessages: DiscordRankedMessagesItem[];
    topVocals: DiscordRankedVocalsItem[];
  }>({
    totalMessages: 0,
    totalVoiceHours: 0,
    topMessages: [],
    topVocals: [],
  });
  const [recapEvents, setRecapEvents] = useState<RecapEvent[]>([]);
  const [recapMonthFilter, setRecapMonthFilter] = useState<"all" | string>("all");
  const [upcomingKpis, setUpcomingKpis] = useState<{
    nextMeetingRegistrations: number;
    nextEventRegistrations: number;
    nextEventLabel: string;
    upcomingSpotlights: number;
    pendingEventValidations: number;
  }>({
    nextMeetingRegistrations: 0,
    nextEventRegistrations: 0,
    nextEventLabel: "",
    upcomingSpotlights: 0,
    pendingEventValidations: 0,
  });
  const [opsOwners, setOpsOwners] = useState<Record<string, string>>({});
  const [toasts, setToasts] = useState<AdminToastItem[]>([]);
  const [savedViews, setSavedViews] = useState<DashboardSavedView[]>([]);
  const [selectedViewId, setSelectedViewId] = useState<string>("default");
  const [newViewLabel, setNewViewLabel] = useState("");
  const [recapSearch, setRecapSearch] = useState("");
  const [recapPage, setRecapPage] = useState(1);
  const [recapPageSize, setRecapPageSize] = useState(8);

  const currentMonth = monthKey();
  const evaluationMonth = previousMonthKey();

  const pushToast = (type: AdminToastType, title: string, description?: string) => {
    const toast = createToast(type, title, description);
    setToasts((prev) => [...prev, toast]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== toast.id));
    }, 3500);
  };

  useEffect(() => {
    try {
      const rawOwners = window.localStorage.getItem(OPS_OWNER_STORAGE_KEY);
      if (rawOwners) {
        const parsed = JSON.parse(rawOwners) as Record<string, string>;
        if (parsed && typeof parsed === "object") {
          setOpsOwners(parsed);
        }
      }
      const rawViews = window.localStorage.getItem(DASHBOARD_VIEW_STORAGE_KEY);
      if (rawViews) {
        const parsed = JSON.parse(rawViews) as DashboardSavedView[];
        if (Array.isArray(parsed)) {
          setSavedViews(parsed);
        }
      }
    } catch {
      // Ignore invalid localStorage payloads.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(OPS_OWNER_STORAGE_KEY, JSON.stringify(opsOwners));
    } catch {
      // Ignore storage errors.
    }
  }, [opsOwners]);

  useEffect(() => {
    async function loadCurrentAdminHeader() {
      try {
        const [user, roleRes] = await Promise.all([
          getDiscordUser(),
          fetch("/api/user/role", { cache: "no-store" }),
        ]);

        const roleData = roleRes.ok ? await roleRes.json() : null;
        const role = typeof roleData?.role === "string" ? roleData.role : null;

        if (user?.username) {
          setCurrentAdmin({ username: user.username, role });
        }
      } catch (error) {
        console.warn("[dashboard2] Impossible de charger le header admin personalise:", error);
      }
    }

    loadCurrentAdminHeader();
  }, []);

  useEffect(() => {
    const role = currentAdmin?.role || null;
    const fallback = defaultViewForRole(role);
    const existing =
      savedViews.find((view) => view.id === selectedViewId) ||
      savedViews.find((view) => view.roleScope === (role || "ALL"));
    setSelectedViewId(existing?.id || fallback.id);
  }, [currentAdmin?.role, savedViews, selectedViewId]);

  useEffect(() => {
    async function loadDashboardAggregate() {
      try {
        const response = await fetch(
          `/api/admin/dashboard/aggregate?month=${encodeURIComponent(currentMonth)}&evaluationMonth=${encodeURIComponent(
            evaluationMonth
          )}`,
          { cache: "no-store" }
        );
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const payload = await response.json();
        const data = payload?.data;

        if (!data) {
          throw new Error("Payload agrégé invalide");
        }

        setDashboardSummary(
          (data.summary || {
            total: 0,
            missingDiscord: 0,
            missingTwitchId: 0,
            incomplete: 0,
            reviewOverdue: 0,
            reviewDue7d: 0,
            avgCompletion: 0,
            validatedProfiles: 0,
            communityMonthCount: 0,
          }) as DashboardSummary
        );

        setEvents((data.ops?.events || []) as MemberEventLite[]);
        setFinalNotesCount(Number(data.ops?.finalNotesCount || 0));
        setFollowOverdueStaffNames((data.ops?.followOverdueStaffNames || []) as string[]);
        setVipMonthCount(Number(data.ops?.vipMonthCount || 0));
        setStaffApplicationsPendingCount(Number(data.ops?.staffApplicationsPendingCount || 0));
        setStaffApplicationsRedFlagCount(Number(data.ops?.staffApplicationsRedFlagCount || 0));
        setProfileValidationPendingCount(Number(data.ops?.profileValidationPendingCount || 0));
        setRaidsPendingCount(Number(data.ops?.raidsPendingCount || 0));
        setDiscordPointsPendingCount(Number(data.ops?.discordPointsPendingCount || 0));
        setRaidsIgnoredToProcessCount(Number(data.ops?.raidsIgnoredToProcessCount || 0));

        setDiscordGrowthData((data.visual?.discordGrowthData || []) as Array<{ month: string; value: number }>);
        setMonthlyActivityData(
          (data.visual?.monthlyActivityData || []) as Array<{ month: string; messages: number; vocals: number }>
        );
        setSpotlightProgressionData(
          (data.visual?.spotlightProgressionData || []) as Array<{ month: string; value: number }>
        );
        setRaidStats(
          data.visual?.raidStats || {
            totalRaidsReceived: 0,
            totalRaidsSent: 0,
            topRaiders: [],
            topTargets: [],
          }
        );
        setDiscordMonthStats(
          data.visual?.discordMonthStats || {
            totalMessages: 0,
            totalVoiceHours: 0,
            topMessages: [],
            topVocals: [],
          }
        );

        setRecapEvents((data.recap?.recapEvents || []) as RecapEvent[]);
        setUpcomingKpis(
          data.recap?.upcomingKpis || {
            nextMeetingRegistrations: 0,
            nextEventRegistrations: 0,
            nextEventLabel: "",
            upcomingSpotlights: 0,
            pendingEventValidations: 0,
          }
        );
      } catch (error) {
        console.error("Erreur chargement dashboard agrégé:", error);
      } finally {
        setLoading(false);
        setLoadingVisual(false);
        setLoadingRecap(false);
      }
    }

    loadDashboardAggregate();
    return undefined;
  }, [currentMonth, evaluationMonth]);
  const communityMonthCount = dashboardSummary.communityMonthCount;

  const kpis = useMemo(() => {
    return {
      total: dashboardSummary.total,
      missingDiscord: dashboardSummary.missingDiscord,
      missingTwitchId: dashboardSummary.missingTwitchId,
      incomplete: dashboardSummary.incomplete,
      reviewOverdue: dashboardSummary.reviewOverdue,
      reviewDue7d: dashboardSummary.reviewDue7d,
      avgCompletion: dashboardSummary.avgCompletion,
      validatedProfiles: dashboardSummary.validatedProfiles,
      staffApplicationsPendingCount,
      staffApplicationsRedFlagCount,
      profileValidationPendingCount,
      raidsPendingCount,
      discordPointsPendingCount,
      raidsIgnoredToProcessCount,
    };
  }, [
    dashboardSummary,
    staffApplicationsPendingCount,
    staffApplicationsRedFlagCount,
    profileValidationPendingCount,
    raidsPendingCount,
    discordPointsPendingCount,
    raidsIgnoredToProcessCount,
  ]);

  const activeView = useMemo(() => {
    const role = currentAdmin?.role || null;
    return (
      savedViews.find((view) => view.id === selectedViewId) ||
      defaultViewForRole(role)
    );
  }, [currentAdmin?.role, savedViews, selectedViewId]);

  const opsQueue = useMemo<OpsQueueItem[]>(() => {
    const queue: OpsQueueItem[] = [
      {
        id: "raids_pending",
        title: "Raids à valider",
        href: "/admin/engagement/raids-a-valider",
        count: kpis.raidsPendingCount,
        priority: "P1",
        slaHours: 12,
      },
      {
        id: "profile_validation",
        title: "Validations profil",
        href: "/admin/membres/validation-profil",
        count: kpis.profileValidationPendingCount,
        priority: "P1",
        slaHours: 24,
      },
      {
        id: "staff_applications",
        title: "Postulations staff",
        href: "/admin/membres/postulations",
        count: kpis.staffApplicationsPendingCount,
        priority: "P1",
        slaHours: 24,
      },
      {
        id: "members_incomplete",
        title: "Fiches membres incomplètes",
        href: "/admin/membres/incomplets",
        count: kpis.incomplete,
        priority: "P2",
        slaHours: 72,
      },
      {
        id: "points_pending",
        title: "Points Discord en attente",
        href: "/admin/engagement/points-discord",
        count: kpis.discordPointsPendingCount,
        priority: "P2",
        slaHours: 48,
      },
      {
        id: "events_pending_validation",
        title: "Événements sans présence validée",
        href: "/admin/events/presence",
        count: upcomingKpis.pendingEventValidations,
        priority: "P3",
        slaHours: 96,
      },
    ];

    return queue
      .map((item) => ({ ...item, owner: opsOwners[item.id] }))
      .sort((a, b) => {
        const p = { P1: 1, P2: 2, P3: 3 } as const;
        if (p[a.priority] !== p[b.priority]) return p[a.priority] - p[b.priority];
        return b.count - a.count;
      });
  }, [kpis, upcomingKpis.pendingEventValidations, opsOwners]);

  const filteredOpsQueue = useMemo(() => {
    const allowed = new Set(activeView.filters.priorities);
    return opsQueue.filter((item) => {
      if (!allowed.has(item.priority)) return false;
      if (activeView.filters.onlyWithCount && item.count <= 0) return false;
      return true;
    });
  }, [activeView.filters, opsQueue]);

  const assignOwner = (itemId: string) => {
    const defaultOwner = currentAdmin?.username || "non assigné";
    setOpsOwners((prev) => ({ ...prev, [itemId]: defaultOwner }));
    pushToast("success", "Owner mis à jour", `Assigné à ${defaultOwner}`);
  };

  const saveCurrentView = () => {
    const label = newViewLabel.trim();
    if (!label) {
      pushToast("warning", "Nom de vue requis", "Ajoute un libellé avant d'enregistrer.");
      return;
    }
    const roleScope = currentAdmin?.role || "ALL";
    const customView: DashboardSavedView = {
      id: `custom-${Date.now()}`,
      label,
      roleScope,
      filters: activeView.filters,
    };
    const nextViews = [...savedViews, customView];
    setSavedViews(nextViews);
    setSelectedViewId(customView.id);
    setNewViewLabel("");
    try {
      window.localStorage.setItem(DASHBOARD_VIEW_STORAGE_KEY, JSON.stringify(nextViews));
    } catch {
      // Ignore localStorage failures.
    }
    pushToast("success", "Vue enregistrée", `Vue "${label}" sauvegardée.`);
  };

  const filteredRecapEvents = useMemo(() => {
    const q = recapSearch.trim().toLowerCase();
    const byMonth =
      recapMonthFilter === "all"
        ? recapEvents
        : recapEvents.filter((item) => item.event.date.startsWith(recapMonthFilter));
    if (!q) return byMonth;
    return byMonth.filter((item) => {
      const title = item.event.title.toLowerCase();
      const category = item.event.category.toLowerCase();
      return title.includes(q) || category.includes(q);
    });
  }, [recapEvents, recapMonthFilter, recapSearch]);

  const sortedRecapEvents = useMemo(() => {
    return [...filteredRecapEvents]
      .map((item) => ({
        ...item,
        rate:
          item.registrationCount > 0
            ? Math.round((item.presenceCount / item.registrationCount) * 1000) / 10
            : 0,
      }))
      .sort((a, b) => b.rate - a.rate);
  }, [filteredRecapEvents]);

  const paginatedRecapEvents = useMemo(() => {
    const start = (recapPage - 1) * recapPageSize;
    return sortedRecapEvents.slice(start, start + recapPageSize);
  }, [sortedRecapEvents, recapPage, recapPageSize]);

  const recapCategoryStats = useMemo(() => {
    const byCategory = new Map<string, { count: number; registrations: number; presences: number }>();
    for (const item of filteredRecapEvents) {
      const category = item.event.category || "Sans catégorie";
      const current = byCategory.get(category) || { count: 0, registrations: 0, presences: 0 };
      current.count += 1;
      current.registrations += item.registrationCount;
      current.presences += item.presenceCount;
      byCategory.set(category, current);
    }
    return Array.from(byCategory.entries())
      .map(([category, value]) => ({
        category,
        ...value,
        avgPresence: value.count > 0 ? Math.round((value.presences / value.count) * 10) / 10 : 0,
      }))
      .sort((a, b) => b.presences - a.presences);
  }, [filteredRecapEvents]);

  const eventAnomalies = useMemo(() => {
    return filteredRecapEvents
      .map((item) => {
        const rate = item.registrationCount > 0 ? (item.presenceCount / item.registrationCount) * 100 : 0;
        return { ...item, rate: Math.round(rate * 10) / 10 };
      })
      .filter((item) => item.registrationCount > 0 && (item.presenceCount === 0 || item.rate < 30))
      .sort((a, b) => a.rate - b.rate);
  }, [filteredRecapEvents]);

  const monthOptions = useMemo(() => {
    const set = new Set<string>();
    for (const item of recapEvents) {
      set.add(item.event.date.slice(0, 7));
    }
    return Array.from(set).sort((a, b) => (a < b ? 1 : -1));
  }, [recapEvents]);

  useEffect(() => {
    setRecapPage(1);
  }, [recapMonthFilter, recapSearch, recapPageSize]);

  const workflow: WorkflowStep[] = useMemo(() => {
    const overduePreview =
      followOverdueStaffNames.length > 3
        ? `${followOverdueStaffNames.slice(0, 3).join(", ")} +${followOverdueStaffNames.length - 3}`
        : followOverdueStaffNames.join(", ");

    return [
      {
        id: "members_quality",
        label: "Qualité des fiches membres",
        href: "/admin/membres/incomplets",
        status: kpis.incomplete === 0 ? "done" : kpis.incomplete < 10 ? "in_progress" : "todo",
        helper: `${kpis.incomplete} incomplets`,
      },
      {
        id: "evaluation_monthly",
        label: "Évaluation mensuelle",
        href: "/admin/evaluation/d",
        status: finalNotesCount > 0 ? "done" : "todo",
        helper: `${finalNotesCount} note(s) manuelle(s)`,
      },
      {
        id: "vip_month",
        label: "VIP du mois",
        href: "/admin/membres/vip",
        status: vipMonthCount > 0 ? "done" : "todo",
        helper: `${vipMonthCount} VIP validé(s)`,
      },
      {
        id: "community_month",
        label: "Communauté du mois",
        href: "/admin/membres/badges",
        status: communityMonthCount > 0 ? "done" : "todo",
        helper: `${communityMonthCount} contributeur(s) du mois`,
      },
      {
        id: "follow",
        label: "Suivi des follows",
        href: "/admin/follow",
        status: followOverdueStaffNames.length === 0 ? "done" : "in_progress",
        helper:
          followOverdueStaffNames.length === 0
            ? "Aucun retard > 30 jours"
            : `${followOverdueStaffNames.length} en retard > 30 jours: ${overduePreview}`,
      },
      {
        id: "staff_applications",
        label: "Postulations staff",
        href: "/admin/membres/postulations",
        status: kpis.staffApplicationsPendingCount === 0 ? "done" : "todo",
        helper: `${kpis.staffApplicationsPendingCount} à traiter${kpis.staffApplicationsRedFlagCount > 0 ? ` · ${kpis.staffApplicationsRedFlagCount} red flag` : ""}`,
      },
      {
        id: "profile_validation",
        label: "Validation profils",
        href: "/admin/membres/validation-profil",
        status: kpis.profileValidationPendingCount === 0 ? "done" : "todo",
        helper: `${kpis.profileValidationPendingCount} demande(s)`,
      },
    ];
  }, [
    kpis.incomplete,
    kpis.staffApplicationsPendingCount,
    kpis.staffApplicationsRedFlagCount,
    kpis.profileValidationPendingCount,
    finalNotesCount,
    followOverdueStaffNames,
    vipMonthCount,
    communityMonthCount,
  ]);

  const priorityCards = [
    {
      title: "Comptes incomplets bloquants",
      value: kpis.incomplete,
      hint: "Membres actifs à corriger",
      href: "/admin/membres/incomplets",
      color: "text-amber-300",
    },
    {
      title: "Raids à valider",
      value: kpis.raidsPendingCount,
      hint: "Raids en attente sur validation staff",
      href: "/admin/engagement/raids-a-valider",
      color: "text-red-300",
    },
    {
      title: "Sans ID Twitch",
      value: kpis.missingTwitchId,
      hint: "Risque de mismatch Twitch",
      href: "/admin/membres/incomplets",
      color: "text-yellow-300",
    },
    {
      title: "Sans ID Discord",
      value: kpis.missingDiscord,
      hint: "Liaison Discord manquante",
      href: "/admin/membres/incomplets",
      color: "text-orange-300",
    },
    {
      title: "Profils en attente de validation",
      value: kpis.profileValidationPendingCount,
      hint: "Demandes à traiter",
      href: "/admin/membres/validation-profil",
      color: "text-cyan-300",
    },
    {
      title: "Postulations staff",
      value: kpis.staffApplicationsPendingCount,
      hint: "Candidatures en attente",
      href: "/admin/membres/postulations",
      color: "text-indigo-300",
    },
    {
      title: "Points à valider",
      value: kpis.discordPointsPendingCount,
      hint: "Commandes raids-sub en attente",
      href: "/admin/engagement/points-discord",
      color: "text-fuchsia-300",
    },
    {
      title: "Raids ignorés à traiter",
      value: kpis.raidsIgnoredToProcessCount,
      hint: "Raids-sub ignorés à revoir",
      href: "/admin/engagement/raids-sub/a-valider?status=ignored",
      color: "text-rose-300",
    },
  ];

  const upcomingCards = [
    {
      title: "Inscrits prochaine réunion",
      value: upcomingKpis.nextMeetingRegistrations,
      hint: "Depuis Évaluations > Inscriptions",
      href: "/admin/onboarding/inscriptions",
      color: "text-blue-300",
    },
    {
      title: "Inscrits prochain event",
      value: upcomingKpis.nextEventRegistrations,
      hint: upcomingKpis.nextEventLabel
        ? `Prochain event: ${upcomingKpis.nextEventLabel}`
        : "Aucun event futur publie",
      href: "/admin/events/presence",
      color: "text-emerald-300",
    },
    {
      title: "Futurs Spotlights à venir",
      value: upcomingKpis.upcomingSpotlights,
      hint: "Nombre d'événements Spotlight futurs",
      href: "/admin/events/presence",
      color: "text-purple-300",
    },
    {
      title: "Événements en attente de validation",
      value: upcomingKpis.pendingEventValidations,
      hint: "Événements passés sans présence validée",
      href: "/admin/events/presence",
      color: "text-rose-300",
    },
  ];

  const quickActions = [
    { label: "Membres incomplets", href: "/admin/membres/incomplets" },
    { label: "Gestion membres", href: "/admin/membres/gestion" },
    { label: "Postulations staff", href: "/admin/membres/postulations" },
    { label: "Validation profils", href: "/admin/membres/validation-profil" },
    { label: "Synthèse évaluation", href: "/admin/evaluation/d" },
    { label: "Suivi follow", href: "/admin/follow" },
    { label: "Audit", href: "/admin/founders/audit" },
    { label: "Sync Discord", href: "/admin/membres/synchronisation" },
  ];

  const statusStyle = (status: WorkflowStep["status"]) => {
    if (status === "done") return "bg-green-500/20 text-green-300 border-green-500/30";
    if (status === "in_progress") return "bg-blue-500/20 text-blue-300 border-blue-500/30";
    return "bg-gray-500/20 text-gray-300 border-gray-500/30";
  };

  const adminDisplayName = currentAdmin?.username || "Admin";
  const adminRoleLabel = currentAdmin?.role || "Administrateur TENF";

  if (loading) {
    return (
      <div className="text-white">
        <div
          className="flex h-64 items-center justify-center rounded-2xl border"
          style={{
            borderColor: "rgba(212,175,55,0.24)",
            background: "linear-gradient(145deg, rgba(20,20,24,0.95), rgba(33,33,40,0.95))",
          }}
        >
          <div className="h-10 w-10 animate-spin rounded-full border-b-2" style={{ borderBottomColor: "rgba(230, 199, 115, 0.95)" }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white">
      <AdminToastStack
        toasts={toasts}
        onClose={(id) => setToasts((prev) => prev.filter((toast) => toast.id !== id))}
      />
      <section
        className="rounded-3xl border p-6 md:p-8"
        style={{
          borderColor: "rgba(212,175,55,0.24)",
          background: "radial-gradient(circle at 16% 12%, rgba(212,175,55,0.2), rgba(27,27,33,0.97) 44%)",
          boxShadow: "0 20px 45px rgba(0, 0, 0, 0.28)",
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.18em]" style={{ color: "rgba(230, 201, 128, 0.9)" }}>
              Espace administration premium
            </p>
            <h1 className="mt-3 text-2xl font-semibold sm:text-3xl md:text-4xl">Bonjour {adminDisplayName}</h1>
            <p className="mt-1 text-xs uppercase tracking-[0.11em]" style={{ color: "rgba(222, 209, 170, 0.86)" }}>
              {adminRoleLabel}
            </p>
            <p className="mt-3 text-sm md:text-base" style={{ color: "rgba(236, 236, 239, 0.84)" }}>
              Vue orientee priorites, actions et qualite des operations pour {currentMonth}.
            </p>
          </div>
          <div className="grid gap-2">
            <span
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.09em]"
              style={{
                borderColor: "rgba(212,175,55,0.45)",
                backgroundColor: "rgba(212,175,55,0.12)",
                color: "rgba(244, 219, 151, 0.95)",
              }}
            >
              <ShieldCheck size={14} />
              Pilotage operationnel
            </span>
            <Link
              href="/admin/control-center"
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition hover:-translate-y-[1px] ${focusRingClass}`}
              style={{ backgroundColor: "rgba(212,175,55,0.95)", color: "#201b12" }}
            >
              Ouvrir le control center
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className={`rounded-full border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.07em] transition hover:-translate-y-[1px] sm:text-xs ${focusRingClass}`}
                style={{
                  borderColor: "rgba(255,255,255,0.15)",
                  backgroundColor: "rgba(255,255,255,0.04)",
                  color: "rgba(228,228,236,0.9)",
                }}
              >
                {action.label}
              </Link>
            ))}
          </div>
      </section>

      {(kpis.reviewOverdue > 0 ||
        kpis.missingDiscord > 0 ||
        kpis.missingTwitchId > 0 ||
        kpis.staffApplicationsPendingCount > 0 ||
        kpis.profileValidationPendingCount > 0 ||
        kpis.staffApplicationsRedFlagCount > 0) && (
        <div
          className="rounded-2xl border p-4"
          style={{
            borderColor: "rgba(248,113,113,0.4)",
            background: "linear-gradient(145deg, rgba(54,26,29,0.75), rgba(26,16,20,0.9))",
          }}
        >
          <h2 className="mb-2 text-lg font-semibold text-red-200">Alertes critiques</h2>
          <div className="flex flex-wrap gap-4 text-sm text-red-100/95">
            {kpis.reviewOverdue > 0 && <span>{kpis.reviewOverdue} revue(s) en retard</span>}
            {kpis.missingDiscord > 0 && <span>{kpis.missingDiscord} membre(s) sans ID Discord</span>}
            {kpis.missingTwitchId > 0 && <span>{kpis.missingTwitchId} membre(s) sans ID Twitch</span>}
            {kpis.staffApplicationsPendingCount > 0 && <span>{kpis.staffApplicationsPendingCount} postulation(s) staff en attente</span>}
            {kpis.staffApplicationsRedFlagCount > 0 && <span>{kpis.staffApplicationsRedFlagCount} postulation(s) en red flag</span>}
            {kpis.profileValidationPendingCount > 0 && <span>{kpis.profileValidationPendingCount} validation(s) profil en attente</span>}
          </div>
        </div>
      )}

      <section className="rounded-2xl border p-5" style={premiumCardStyle}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">À traiter maintenant</h2>
            <p className="text-xs text-gray-300/80">
              Vue pilotage avec priorité, SLA et owner.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedViewId}
              onChange={(e) => setSelectedViewId(e.target.value)}
              className={`rounded-lg border px-3 py-2 text-sm text-white ${focusRingClass}`}
              style={{ backgroundColor: "rgba(0,0,0,0.22)", borderColor: "rgba(255,255,255,0.12)" }}
            >
              {[defaultViewForRole(currentAdmin?.role || null), ...savedViews].map((view) => (
                <option key={view.id} value={view.id}>
                  {view.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={newViewLabel}
              onChange={(e) => setNewViewLabel(e.target.value)}
              placeholder="Nom de vue"
              className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-gray-500"
            />
            <button
              type="button"
              onClick={saveCurrentView}
              className="rounded-lg border border-[#e6c773]/40 px-3 py-2 text-sm font-semibold text-[#edd38d] hover:bg-[#e6c773]/10"
            >
              Sauver la vue
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {filteredOpsQueue.length === 0 ? (
            <div className="rounded-xl border border-white/10 p-4 text-sm text-gray-300">
              Rien d'urgent selon cette vue.
            </div>
          ) : (
            filteredOpsQueue.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-white/10 bg-black/25 p-4"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      item.priority === "P1"
                        ? "bg-red-500/20 text-red-200"
                        : item.priority === "P2"
                        ? "bg-amber-500/20 text-amber-200"
                        : "bg-sky-500/20 text-sky-200"
                    }`}
                  >
                    {item.priority}
                  </span>
                </div>
                <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-gray-300">
                  <span>Volume: {item.count}</span>
                  <span>SLA: {item.slaHours}h</span>
                  <span>Owner: {item.owner || "non assigné"}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={item.href}
                    className={`rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10 ${focusRingClass}`}
                  >
                    Ouvrir
                  </Link>
                  <button
                    type="button"
                    onClick={() => assignOwner(item.id)}
                    className="rounded-lg border border-[#e6c773]/30 px-3 py-1.5 text-xs font-semibold text-[#edd38d] hover:bg-[#e6c773]/10"
                  >
                    Assigner à moi
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border p-4 md:p-5" style={softCardStyle}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-gray-200">Alertes immédiates</h3>
            <p className="text-xs text-gray-400">Priorités opérationnelles à traiter maintenant</p>
          </div>
          <span className="rounded-full border border-white/15 bg-black/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-300">
            Temps réel
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {priorityCards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className={`group flex min-h-[136px] flex-col justify-between rounded-2xl border p-4 transition-all hover:-translate-y-[1px] hover:border-[#e6c773]/45 ${focusRingClass}`}
              style={premiumCardStyle}
            >
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-300">
                  {card.title}
                </p>
                <p className={`text-3xl font-bold leading-none ${card.color}`}>{card.value}</p>
              </div>
              <p className="mt-3 text-xs text-gray-400 group-hover:text-gray-300">{card.hint}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border p-4 md:p-5" style={softCardStyle}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-gray-200">Prévisions & agenda</h3>
            <p className="text-xs text-gray-400">Ce qui arrive prochainement côté membres et événements</p>
          </div>
          <span className="rounded-full border border-white/15 bg-black/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-300">
            Horizon court terme
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {upcomingCards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className={`group flex min-h-[136px] flex-col justify-between rounded-2xl border p-4 transition-all hover:-translate-y-[1px] hover:border-[#e6c773]/35 ${focusRingClass}`}
              style={softCardStyle}
            >
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-300">
                  {card.title}
                </p>
                <p className={`text-3xl font-bold leading-none ${card.color}`}>{card.value}</p>
              </div>
              <p className="mt-3 text-xs text-gray-400 group-hover:text-gray-300">{card.hint}</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-2xl border p-6" style={premiumCardStyle}>
          <h3 className="text-lg font-semibold mb-3 text-center">Raids envoyés</h3>
          <p className="text-4xl font-bold text-center text-white">{raidStats.totalRaidsSent}</p>
          <p className="mt-2 text-center text-xs" style={subtleMutedText}>Mois courant</p>
          <div className="mt-4 border-t border-white/10 pt-3">
            <p className="mb-2 text-xs" style={subtleMutedText}>Top 5 streamers (envoyés)</p>
            {raidStats.topRaiders.length === 0 ? (
              <p className="text-xs" style={subtleMutedText}>Aucune donnée disponible</p>
            ) : (
              <div className="space-y-1.5">
                {raidStats.topRaiders.slice(0, 5).map((item) => (
                  <div key={`sent-${item.rank}-${item.displayName}`} className="flex items-center justify-between text-sm">
                    <span className="truncate pr-2 text-gray-200">#{item.rank} {item.displayName}</span>
                    <span style={subtleMutedText}>{item.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="rounded-2xl border p-6" style={premiumCardStyle}>
          <h3 className="text-lg font-semibold mb-3 text-center">Raids reçus</h3>
          <p className="text-4xl font-bold text-center text-white">{raidStats.totalRaidsReceived}</p>
          <p className="mt-2 text-center text-xs" style={subtleMutedText}>Mois courant</p>
          <div className="mt-4 border-t border-white/10 pt-3">
            <p className="mb-2 text-xs" style={subtleMutedText}>Top 5 streamers (reçus)</p>
            {raidStats.topTargets.length === 0 ? (
              <p className="text-xs" style={subtleMutedText}>Aucune donnée disponible</p>
            ) : (
              <div className="space-y-1.5">
                {raidStats.topTargets.slice(0, 5).map((item) => (
                  <div key={`recv-${item.rank}-${item.displayName}`} className="flex items-center justify-between text-sm">
                    <span className="truncate pr-2 text-gray-200">#{item.rank} {item.displayName}</span>
                    <span style={subtleMutedText}>{item.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="rounded-2xl border p-6" style={premiumCardStyle}>
          <h3 className="text-lg font-semibold mb-3 text-center">Activité Discord</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/10 p-3" style={{ backgroundColor: "rgba(0,0,0,0.18)" }}>
              <p className="text-[11px] text-center" style={subtleMutedText}>Messages</p>
              <p className="text-2xl font-bold text-white text-center">{discordMonthStats.totalMessages.toLocaleString()}</p>
              <div className="mt-3 border-t border-white/10 pt-2">
                <p className="mb-2 text-xs" style={subtleMutedText}>Top 5 messages</p>
                {discordMonthStats.topMessages.length === 0 ? (
                  <p className="text-xs" style={subtleMutedText}>Aucune donnée disponible</p>
                ) : (
                  <div className="space-y-1.5">
                    {discordMonthStats.topMessages.slice(0, 5).map((item) => (
                      <div key={`msg-${item.rank}-${item.displayName}`} className="flex items-center justify-between text-sm">
                        <span className="truncate pr-2 text-gray-200">#{item.rank} {item.displayName}</span>
                        <span style={subtleMutedText}>{item.messages.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 p-3" style={{ backgroundColor: "rgba(0,0,0,0.18)" }}>
              <p className="text-[11px] text-center" style={subtleMutedText}>Heures vocales</p>
              <p className="text-2xl font-bold text-white text-center">{discordMonthStats.totalVoiceHours.toFixed(1)}</p>
              <div className="mt-3 border-t border-white/10 pt-2">
                <p className="mb-2 text-xs" style={subtleMutedText}>Top 5 vocaux</p>
                {discordMonthStats.topVocals.length === 0 ? (
                  <p className="text-xs" style={subtleMutedText}>Aucune donnée disponible</p>
                ) : (
                  <div className="space-y-1.5">
                    {discordMonthStats.topVocals.slice(0, 5).map((item) => (
                      <div key={`voc-${item.rank}-${item.displayName}`} className="flex items-center justify-between text-sm">
                        <span className="truncate pr-2 text-gray-200">#{item.rank} {item.displayName}</span>
                        <span style={subtleMutedText}>{item.display}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-2xl border p-6" style={premiumCardStyle}>
          <h3 className="text-lg font-semibold mb-3">Activité Discord</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyActivityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} tickLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#17171d", border: "1px solid rgba(212,175,55,0.2)", borderRadius: "8px" }} />
                <Line type="monotone" dataKey="messages" stroke="#5865F2" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="vocals" stroke="#57F287" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border p-6" style={premiumCardStyle}>
          <h3 className="text-lg font-semibold mb-3">Croissance Discord</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={discordGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} tickLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#17171d", border: "1px solid rgba(212,175,55,0.2)", borderRadius: "8px" }} />
                <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border p-6" style={premiumCardStyle}>
          <h3 className="text-lg font-semibold mb-3">Progression Spotlight</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spotlightProgressionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} tickLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#17171d", border: "1px solid rgba(212,175,55,0.2)", borderRadius: "8px" }} />
                <Bar dataKey="value" fill="#9146ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 rounded-2xl border p-6" style={premiumCardStyle}>
          <h2 className="text-xl font-semibold mb-4">Workflow mensuel</h2>
          <div className="space-y-3">
            {workflow.map((step) => (
              <Link
                key={step.id}
                href={step.href}
                className={`flex items-center justify-between rounded-xl border p-3 transition-colors hover:border-[#c9a85b] ${focusRingClass}`}
                style={{ borderColor: "rgba(255,255,255,0.12)", backgroundColor: "rgba(255,255,255,0.02)" }}
              >
                <div>
                  <p className="font-medium">{step.label}</p>
                  <p className="text-xs" style={subtleMutedText}>{step.helper}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs border ${statusStyle(step.status)}`}>
                  {step.status === "done" ? "Terminé" : step.status === "in_progress" ? "En cours" : "À faire"}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border p-6" style={premiumCardStyle}>
          <h2 className="text-xl font-semibold mb-4">Santé des données</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span style={subtleMutedText}>Membres actifs</span>
              <span className="font-semibold">{kpis.total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span style={subtleMutedText}>Complétude moyenne</span>
              <span className="font-semibold">{kpis.avgCompletion}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span style={subtleMutedText}>Profils validés</span>
              <span className="font-semibold">{kpis.validatedProfiles}</span>
            </div>
            <div className="flex items-center justify-between">
              <span style={subtleMutedText}>Revues dues &lt; 7 jours</span>
              <span className="font-semibold">{kpis.reviewDue7d}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border p-6" style={softCardStyle}>
        <h2 className="mb-4 inline-flex items-center gap-2 text-xl font-semibold">
          <Sparkles size={16} style={{ color: "rgba(230, 199, 115, 0.92)" }} />
          Activité récente (24-48h)
        </h2>
        {events.length === 0 ? (
          <p className="text-sm" style={subtleMutedText}>Aucune activité récente.</p>
        ) : (
          <div className="space-y-2">
            {events.slice(0, 10).map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between text-sm border-b border-gray-800 pb-2"
              >
                <div className="min-w-0 pr-2">
                  <p className="truncate text-gray-200">
                    {event.type} · {event.memberId}
                  </p>
                  <p className="text-xs" style={subtleMutedText}>
                    {event.actor || "system"} · {event.source || "n/a"}
                  </p>
                </div>
                <span className="whitespace-nowrap text-xs" style={subtleMutedText}>
                  {new Date(event.createdAt).toLocaleString("fr-FR")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border p-6" style={softCardStyle}>
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <h2 className="text-xl font-semibold">Suivi événements (tableaux)</h2>
          <div className="flex items-center gap-2">
            <select
              value={recapMonthFilter}
              onChange={(e) => setRecapMonthFilter(e.target.value)}
              className={`rounded-lg border px-3 py-2 text-sm text-white ${focusRingClass}`}
              style={{ backgroundColor: "rgba(0,0,0,0.22)", borderColor: "rgba(255,255,255,0.12)" }}
            >
              <option value="all">Tous les mois</option>
              {monthOptions.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <Link
              href="/admin/events/recap"
              className={`rounded-lg border px-3 py-2 text-sm font-semibold ${focusRingClass}`}
              style={{
                backgroundColor: "rgba(0,0,0,0.22)",
                borderColor: "rgba(212,175,55,0.24)",
                color: "rgba(238, 211, 138, 0.95)",
              }}
            >
              Ouvrir recap complet
            </Link>
          </div>
        </div>

        {loadingRecap ? (
          <div className="py-10 text-center" style={subtleMutedText}>Chargement recap événements...</div>
        ) : filteredRecapEvents.length === 0 ? (
          <div className="py-10 text-center" style={subtleMutedText}>Aucune donnée événement disponible pour ce filtre.</div>
        ) : (
          <div className="space-y-6">
            <AdminTableShell
              title="Top événements"
              subtitle="Table standardisée: filtres + pagination"
              searchValue={recapSearch}
              onSearchChange={setRecapSearch}
              page={recapPage}
              pageSize={recapPageSize}
              total={sortedRecapEvents.length}
              onPageChange={setRecapPage}
              onPageSizeChange={setRecapPageSize}
              searchPlaceholder="Filtrer par titre/catégorie..."
            >
              <div className="overflow-x-auto rounded-xl border border-white/12">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/12" style={{ backgroundColor: "rgba(0,0,0,0.22)" }}>
                      <th className="text-left py-3 px-4">Événement</th>
                      <th className="text-left py-3 px-4">Catégorie</th>
                      <th className="text-left py-3 px-4">Date</th>
                      <th className="text-right py-3 px-4">Inscriptions</th>
                      <th className="text-right py-3 px-4">Présents</th>
                      <th className="text-right py-3 px-4">Taux</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRecapEvents.map((item) => (
                        <tr key={item.event.id} className="border-b border-white/8">
                          <td className="py-3 px-4">{item.event.title}</td>
                          <td className="py-3 px-4" style={subtleMutedText}>{item.event.category}</td>
                          <td className="py-3 px-4" style={subtleMutedText}>{new Date(item.event.date).toLocaleDateString("fr-FR")}</td>
                          <td className="py-3 px-4 text-right">{item.registrationCount}</td>
                          <td className="py-3 px-4 text-right">{item.presenceCount}</td>
                          <td className="py-3 px-4 text-right">
                            <span className={item.rate >= 70 ? "text-green-400" : item.rate >= 40 ? "text-yellow-400" : "text-red-400"}>
                              {item.rate.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    {paginatedRecapEvents.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-6 px-4 text-center" style={subtleMutedText}>
                          Aucune ligne sur cette page.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </AdminTableShell>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Statistiques par catégorie</h3>
                <div className="overflow-x-auto rounded-xl border border-white/12">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/12" style={{ backgroundColor: "rgba(0,0,0,0.22)" }}>
                        <th className="text-left py-3 px-4">Catégorie</th>
                        <th className="text-right py-3 px-4">Events</th>
                        <th className="text-right py-3 px-4">Inscriptions</th>
                        <th className="text-right py-3 px-4">Présences</th>
                        <th className="text-right py-3 px-4">Moyenne</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recapCategoryStats.map((row) => (
                        <tr key={row.category} className="border-b border-white/8">
                          <td className="py-3 px-4">{row.category}</td>
                          <td className="py-3 px-4 text-right">{row.count}</td>
                          <td className="py-3 px-4 text-right">{row.registrations}</td>
                          <td className="py-3 px-4 text-right">{row.presences}</td>
                          <td className="py-3 px-4 text-right text-gray-200">{row.avgPresence.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Anomalies de suivi</h3>
                <div className="overflow-x-auto rounded-xl border border-white/12">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/12" style={{ backgroundColor: "rgba(0,0,0,0.22)" }}>
                        <th className="text-left py-3 px-4">Événement</th>
                        <th className="text-right py-3 px-4">Inscrits</th>
                        <th className="text-right py-3 px-4">Présents</th>
                        <th className="text-right py-3 px-4">Taux</th>
                        <th className="text-left py-3 px-4">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eventAnomalies.slice(0, 8).map((item) => (
                        <tr key={item.event.id} className="border-b border-white/8">
                          <td className="py-3 px-4">{item.event.title}</td>
                          <td className="py-3 px-4 text-right">{item.registrationCount}</td>
                          <td className="py-3 px-4 text-right">{item.presenceCount}</td>
                          <td className="py-3 px-4 text-right text-red-300">{item.rate.toFixed(1)}%</td>
                          <td className="py-3 px-4">
                            <Link
                              href="/admin/events/presence"
                              className={`text-[#e6c773] underline-offset-4 hover:text-[#f0d79b] hover:underline ${focusRingClass}`}
                            >
                              Corriger
                            </Link>
                          </td>
                        </tr>
                      ))}
                      {eventAnomalies.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-6 px-4 text-center" style={subtleMutedText}>
                            Aucune anomalie détectée 🎉
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
