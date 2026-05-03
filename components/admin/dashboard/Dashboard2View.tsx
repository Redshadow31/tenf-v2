"use client";

import { Fragment, useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
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
import {
  Activity,
  ArrowUpRight,
  BookOpen,
  CalendarRange,
  Compass,
  ExternalLink,
  Eye,
  HeartHandshake,
  LayoutDashboard,
  Radio,
  Scale,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
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

function formatMeetingDateTime(value?: string): string {
  if (!value) return "Non planifiée";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Non planifiée";
  return date.toLocaleString("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatLongFrenchDate(value: Date): string {
  return value.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const premiumCardStyle: CSSProperties = {
  borderColor: "rgba(148,163,184,0.22)",
  background:
    "radial-gradient(circle at 20% -40%, rgba(124,58,237,0.2), rgba(20,21,30,0.96) 46%), linear-gradient(155deg, rgba(30,30,42,0.95), rgba(16,17,25,0.98))",
  boxShadow: "0 16px 36px rgba(0, 0, 0, 0.22)",
};

const softCardStyle: CSSProperties = {
  borderColor: "rgba(148,163,184,0.2)",
  background:
    "radial-gradient(circle at 18% -45%, rgba(37,99,235,0.16), rgba(17,19,30,0.96) 52%), linear-gradient(160deg, rgba(22,24,36,0.95), rgba(14,16,24,0.96))",
};

const subtleMutedText: CSSProperties = {
  color: "rgba(214, 214, 224, 0.75)",
};

const focusRingClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-violet-300/80 focus-visible:ring-offset-[#121420]";

const DASHBOARD_VIEW_STORAGE_KEY = "tenf:admin:dashboard2:saved-views";
const OPS_OWNER_STORAGE_KEY = "tenf:admin:dashboard2:ops-owners";

export type Dashboard2Variant = "dashboard" | "pilotage";

type Dashboard2ViewProps = {
  /** `pilotage` : navigation par onglets, hero enrichi, workflow horizontal (route /admin/pilotage). */
  variant?: Dashboard2Variant;
};

function createToast(type: AdminToastType, title: string, description?: string): AdminToastItem {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    title,
    description,
  };
}

type StaffPersona = "moderateur" | "admin" | "soutien" | "general";

function deriveStaffPersona(role: string | null): StaffPersona {
  const normalized = (role || "").toUpperCase();
  if (normalized.includes("MODERATEUR")) return "moderateur";
  if (normalized.includes("SOUTIEN")) return "soutien";
  if (normalized.includes("ADMIN")) return "admin";
  return "general";
}

function formatRoleLabel(role: string | null): string {
  if (!role) return "Staff TENF";
  const u = role.toUpperCase();
  if (u.includes("MODERATEUR")) return "Modérateur";
  if (u.includes("SOUTIEN")) return "Soutien";
  if (u.includes("ADMIN")) return "Administrateur";
  return role.replace(/_/g, " ");
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

const QUICK_ACTION_DEFS: Record<
  string,
  { label: string; href: string }
> = {
  raids: { label: "Raids à valider", href: "/admin/engagement/raids-a-valider" },
  points: { label: "Points Discord", href: "/admin/engagement/points-discord" },
  presence: { label: "Présences événements", href: "/admin/events/presence" },
  propositions: { label: "Propositions événements", href: "/admin/communaute/evenements/propositions" },
  incomplets: { label: "Membres incomplets", href: "/admin/membres/incomplets" },
  gestion: { label: "Gestion membres", href: "/admin/membres/gestion" },
  postulations: { label: "Postulations staff", href: "/admin/membres/postulations" },
  validation: { label: "Validation profils", href: "/admin/membres/validation-profil" },
  formations: { label: "Demandes formation", href: "/admin/formation/demandes" },
  eval: { label: "Synthèse évaluation", href: "/admin/evaluation/d" },
  follow: { label: "Suivi follow", href: "/admin/follow" },
  audit: { label: "Audit", href: "/admin/founders/audit" },
  sync: { label: "Sync Discord", href: "/admin/membres/synchronisation" },
};

const QUICK_ACTION_ORDER: Record<Exclude<StaffPersona, "general">, string[]> = {
  moderateur: [
    "raids",
    "points",
    "presence",
    "propositions",
    "validation",
    "incomplets",
    "postulations",
    "formations",
    "gestion",
    "eval",
    "follow",
    "audit",
    "sync",
  ],
  admin: [
    "incomplets",
    "raids",
    "validation",
    "postulations",
    "points",
    "formations",
    "gestion",
    "eval",
    "follow",
    "presence",
    "propositions",
    "audit",
    "sync",
  ],
  soutien: [
    "incomplets",
    "validation",
    "gestion",
    "formations",
    "follow",
    "sync",
    "presence",
    "raids",
    "points",
    "postulations",
    "eval",
    "propositions",
    "audit",
  ],
};

export function Dashboard2View({ variant = "dashboard" }: Dashboard2ViewProps) {
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
    nextMeetingDateIso: string;
    nextMeetingLabel: string;
    nextEventRegistrations: number;
    nextEventLabel: string;
    upcomingSpotlights: number;
    pendingEventValidations: number;
  }>({
    nextMeetingRegistrations: 0,
    nextMeetingDateIso: "",
    nextMeetingLabel: "",
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
  const [pilotTab, setPilotTab] = useState<"cockpit" | "vitals" | "evenements">("cockpit");
  const [workflowExpandedId, setWorkflowExpandedId] = useState<string | null>(null);

  const currentMonth = monthKey();
  const evaluationMonth = previousMonthKey();
  const currentLongDate = formatLongFrenchDate(new Date());

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
        const [user, roleRes, aliasRes] = await Promise.all([
          getDiscordUser(),
          fetch("/api/user/role", { cache: "no-store" }),
          fetch("/api/admin/access/self", { cache: "no-store" }),
        ]);

        const roleData = roleRes.ok ? await roleRes.json() : null;
        const role = typeof roleData?.role === "string" ? roleData.role : null;

        const fallbackUsername = user?.username || "Admin";
        let displayName = fallbackUsername;

        if (aliasRes.ok) {
          const aliasData = await aliasRes.json();
          const alias = typeof aliasData?.adminAlias === "string" ? aliasData.adminAlias.trim() : "";
          if (alias) {
            displayName = alias;
          }
        }

        setCurrentAdmin({ username: displayName, role });
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
            nextMeetingDateIso: "",
            nextMeetingLabel: "",
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
  const isPilotage = variant === "pilotage";
  const staffPersona = useMemo(() => deriveStaffPersona(currentAdmin?.role ?? null), [currentAdmin?.role]);

  const personaLeadLine = useMemo(() => {
    switch (staffPersona) {
      case "moderateur":
        return "Tes raccourcis mettent en avant raids, points Discord et événements.";
      case "soutien":
        return "Tes raccourcis privilégient fiches membres, validations et suivis du quotidien.";
      case "admin":
        return "Vue étendue : données membres, recrutement staff et pilotage opérationnel.";
      default:
        return "Choisis une vue « à traiter » adaptée à ton rôle pour rester aligné avec l’équipe.";
    }
  }, [staffPersona]);

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

  const quickActions = useMemo(() => {
    const personaKey = staffPersona === "general" ? "admin" : staffPersona;
    const keys = QUICK_ACTION_ORDER[personaKey];
    const base: Array<{ label: string; href: string; accent?: boolean }> = keys.map((key) => {
      const def = QUICK_ACTION_DEFS[key];
      return { label: def.label, href: def.href };
    });
    if (!isPilotage) return base;
    return [
      ...base.slice(0, 4),
      {
        label: "Guide espace membre",
        href: "/rejoindre/guide-espace-membre/tableau-de-bord",
        accent: true,
      },
      ...base.slice(4),
    ];
  }, [isPilotage, staffPersona]);

  const statusStyle = (status: WorkflowStep["status"]) => {
    if (status === "done") return "bg-green-500/20 text-green-300 border-green-500/30";
    if (status === "in_progress") return "bg-blue-500/20 text-blue-300 border-blue-500/30";
    return "bg-gray-500/20 text-gray-300 border-gray-500/30";
  };

  const adminDisplayName = currentAdmin?.username || "Admin";
  const adminRoleLabel = useMemo(() => formatRoleLabel(currentAdmin?.role ?? null), [currentAdmin?.role]);

  const scrollToDashSection = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 text-white">
        <div
          className="animate-pulse rounded-3xl border p-8"
          style={{
            borderColor: "rgba(148,163,184,0.2)",
            background: "linear-gradient(145deg, rgba(22,23,35,0.9), rgba(15,16,24,0.95))",
          }}
        >
          <div className="h-4 w-40 rounded bg-white/10" />
          <div className="mt-4 h-10 max-w-md rounded bg-white/10" />
          <div className="mt-4 h-20 max-w-2xl rounded bg-white/5" />
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-white/5" />
            ))}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-40 rounded-2xl bg-white/5" />
          <div className="h-40 rounded-2xl bg-white/5" />
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
        className="relative overflow-hidden rounded-3xl border p-6 md:p-8"
        style={{
          borderColor: "rgba(148,163,184,0.24)",
          background:
            "radial-gradient(circle at 16% 12%, rgba(124,58,237,0.22), rgba(26,27,37,0.97) 44%), linear-gradient(145deg, rgba(22,23,35,0.96), rgba(15,16,24,0.98))",
          boxShadow: "0 20px 45px rgba(0, 0, 0, 0.28)",
        }}
      >
        <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-violet-600/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-amber-500/15 blur-3xl" />
        {isPilotage ? (
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/10 blur-3xl" />
        ) : null}
        <div className="relative z-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.18em]" style={{ color: "rgba(196,181,253,0.92)" }}>
                {isPilotage ? "Cockpit TENF · Staff" : "Tableau de bord · utilisateurs, modération, admin"}
              </p>
              <h1 className="mt-3 text-2xl font-semibold sm:text-3xl md:text-4xl">
                {isPilotage ? "Piloter TENF : membres, modération, administration" : `Bonjour ${adminDisplayName}`}
              </h1>
              {!isPilotage && (
                <p className="mt-1 text-xs uppercase tracking-[0.11em]" style={{ color: "rgba(191,219,254,0.86)" }}>
                  {adminRoleLabel}
                </p>
              )}
              {isPilotage && (
                <p className="mt-1 text-xs uppercase tracking-[0.11em]" style={{ color: "rgba(191,219,254,0.86)" }}>
                  Bonjour {adminDisplayName} · {adminRoleLabel}
                </p>
              )}
              <p className="mt-3 text-sm md:text-base leading-relaxed" style={{ color: "rgba(236, 236, 239, 0.84)" }}>
                {isPilotage ? (
                  <>
                    Trois angles complémentaires :{" "}
                    <strong className="text-violet-200/95">l&apos;utilisateur membre</strong> (parcours, confort),{" "}
                    <strong className="text-sky-200/95">la modération</strong> (files, présences, Discord live) et{" "}
                    <strong className="text-amber-200/90">l&apos;administration</strong> (données, recrutement, gouvernance).
                    Les sections ci-dessous regroupent les signaux utiles à chacun.
                    <span className="mt-2 block text-xs text-slate-400/95">
                      {currentLongDate.charAt(0).toUpperCase() + currentLongDate.slice(1)}
                    </span>
                  </>
                ) : (
                  <>
                    Cette page sert le <strong className="text-violet-200/95">membre TENF</strong> (expérience visible),
                    les <strong className="text-sky-200/95">modérateurs</strong> (files raids / points / événements) et les{" "}
                    <strong className="text-amber-200/90">administrateurs</strong> (données, évaluations, audit). Les KPI
                    et files « à traiter » reflètent l&apos;impact sur les utilisateurs ; les raccourcis sont ordonnés selon
                    ton rôle. <span className="text-slate-300/95">{personaLeadLine}</span>
                    <span className="mt-2 block text-xs text-slate-400/95">
                      {currentLongDate.charAt(0).toUpperCase() + currentLongDate.slice(1)}
                    </span>
                  </>
                )}
              </p>
              {isPilotage && (
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: "Membres actifs", value: kpis.total, icon: Users, tone: "text-violet-200" },
                    {
                      label: "Complétude moy.",
                      value: `${kpis.avgCompletion}%`,
                      icon: TrendingUp,
                      tone: "text-emerald-200",
                    },
                    { label: "Raids à traiter", value: kpis.raidsPendingCount, icon: Zap, tone: "text-amber-200" },
                    {
                      label: "Tâches (vue active)",
                      value: filteredOpsQueue.length,
                      icon: Activity,
                      tone: "text-sky-200",
                    },
                  ].map((cell) => {
                    const Icon = cell.icon;
                    return (
                      <div
                        key={cell.label}
                        className="rounded-2xl border border-white/10 bg-black/25 px-3 py-3 transition hover:border-violet-400/35 hover:bg-black/40"
                      >
                        <Icon className={`mb-2 h-4 w-4 ${cell.tone}`} aria-hidden />
                        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">{cell.label}</p>
                        <p className="mt-1 text-xl font-bold tabular-nums text-white">{cell.value}</p>
                      </div>
                    );
                  })}
                </div>
              )}
              {!isPilotage && (
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: "Membres actifs", value: kpis.total, icon: Users, tone: "text-violet-200" },
                    {
                      label: "Complétude moy.",
                      value: `${kpis.avgCompletion}%`,
                      icon: TrendingUp,
                      tone: "text-emerald-200",
                    },
                    { label: "Raids à traiter", value: kpis.raidsPendingCount, icon: Zap, tone: "text-amber-200" },
                    {
                      label: "Tâches (vue active)",
                      value: filteredOpsQueue.length,
                      icon: Activity,
                      tone: "text-sky-200",
                    },
                  ].map((cell) => {
                    const Icon = cell.icon;
                    return (
                      <button
                        key={cell.label}
                        type="button"
                        onClick={() => scrollToDashSection("admin-dash-ops")}
                        className="rounded-2xl border border-white/10 bg-black/25 px-3 py-3 text-left transition hover:border-violet-400/35 hover:bg-black/40"
                      >
                        <Icon className={`mb-2 h-4 w-4 ${cell.tone}`} aria-hidden />
                        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">{cell.label}</p>
                        <p className="mt-1 text-xl font-bold tabular-nums text-white">{cell.value}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <span
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.09em]"
                style={{
                  borderColor: "rgba(167,139,250,0.5)",
                  backgroundColor: "rgba(124,58,237,0.16)",
                  color: "rgba(221,214,254,0.95)",
                }}
              >
                {isPilotage ? <Radio size={14} className="shrink-0" /> : <ShieldCheck size={14} />}
                {isPilotage ? "Signaux temps réel" : "Rôle & priorités"}
              </span>
              <Link
                href="/admin/control-center"
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition hover:-translate-y-[1px] ${focusRingClass}`}
                style={{
                  background: "linear-gradient(135deg, rgba(124,58,237,0.96), rgba(37,99,235,0.96))",
                  color: "white",
                  boxShadow: "0 10px 20px rgba(76,29,149,0.35)",
                }}
              >
                Ouvrir le control center
                <ArrowUpRight size={14} />
              </Link>
              {isPilotage ? (
                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/admin/pilotage/backlog"
                    className={`inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition hover:-translate-y-[1px] hover:border-amber-400/45 ${focusRingClass}`}
                    style={{
                      borderColor: "rgba(212,175,55,0.35)",
                      backgroundColor: "rgba(0,0,0,0.2)",
                      color: "rgba(253,230,138,0.92)",
                    }}
                  >
                    File d&apos;actions
                    <ArrowUpRight size={12} />
                  </Link>
                  <Link
                    href="/admin/events/planification"
                    className={`inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition hover:-translate-y-[1px] ${focusRingClass}`}
                    style={{
                      borderColor: "rgba(148,163,184,0.3)",
                      backgroundColor: "rgba(0,0,0,0.18)",
                      color: "rgba(226,232,240,0.9)",
                    }}
                  >
                    Événements
                    <CalendarRange size={12} />
                  </Link>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/admin/events/planification"
                    className={`inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition hover:-translate-y-[1px] ${focusRingClass}`}
                    style={{
                      borderColor: "rgba(148,163,184,0.3)",
                      backgroundColor: "rgba(0,0,0,0.18)",
                      color: "rgba(226,232,240,0.9)",
                    }}
                  >
                    Planification
                    <CalendarRange size={12} />
                  </Link>
                  <Link
                    href="/admin/formation/demandes"
                    className={`inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition hover:-translate-y-[1px] hover:border-emerald-400/35 ${focusRingClass}`}
                    style={{
                      borderColor: "rgba(52,211,153,0.35)",
                      backgroundColor: "rgba(6,78,59,0.15)",
                      color: "rgba(167,243,208,0.95)",
                    }}
                  >
                    Demandes formation
                    <BookOpen size={12} />
                  </Link>
                  <Link
                    href="/admin/communaute/evenements/propositions"
                    className={`inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition hover:-translate-y-[1px] hover:border-sky-400/35 ${focusRingClass}`}
                    style={{
                      borderColor: "rgba(56,189,248,0.35)",
                      backgroundColor: "rgba(12,74,110,0.2)",
                      color: "rgba(186,230,253,0.95)",
                    }}
                  >
                    Propositions
                    <ExternalLink size={12} />
                  </Link>
                </div>
              )}
              <div
                className="rounded-xl border px-3 py-2 text-xs"
                style={{
                  borderColor: "rgba(148,163,184,0.28)",
                  backgroundColor: "rgba(255,255,255,0.03)",
                  color: "rgba(226,232,240,0.9)",
                }}
              >
                <p className="font-semibold uppercase tracking-[0.06em] text-[10px] text-violet-200/90">
                  Prochaine réunion
                </p>
                <p className="mt-1 text-[12px]">
                  {upcomingKpis.nextMeetingLabel || "Réunion staff"} ·{" "}
                  {formatMeetingDateTime(upcomingKpis.nextMeetingDateIso)}
                </p>
                <p className="mt-1 text-[11px] text-slate-300/90">
                  {upcomingKpis.nextMeetingRegistrations} inscrit(s)
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className={`rounded-full border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.07em] transition hover:-translate-y-[1px] sm:text-xs ${focusRingClass}`}
                style={{
                  borderColor: action.accent ? "rgba(230,199,115,0.45)" : "rgba(148,163,184,0.26)",
                  backgroundColor: action.accent ? "rgba(212,175,55,0.08)" : "rgba(255,255,255,0.03)",
                  color: action.accent ? "rgba(253,230,138,0.95)" : "rgba(226,232,240,0.92)",
                }}
              >
                {action.label}
              </Link>
            ))}
          </div>
          {!isPilotage && (
            <>
              <nav
                className="mt-6 flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-black/25 p-2 backdrop-blur-sm"
                aria-label="Sections du tableau de bord (membres, modération, admin)"
              >
                {(
                  [
                    { id: "admin-dash-alertes", label: "Alertes" },
                    { id: "admin-dash-ops", label: "À traiter" },
                    { id: "admin-dash-vitals", label: "Indicateurs" },
                    { id: "admin-dash-agenda", label: "Agenda" },
                    { id: "admin-dash-activite", label: "Activité & raids" },
                    { id: "admin-dash-graphs", label: "Graphiques" },
                    { id: "admin-dash-workflow", label: "Workflow" },
                    { id: "admin-dash-events", label: "Événements" },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => scrollToDashSection(item.id)}
                    className={`rounded-xl border border-transparent px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-300 transition hover:border-violet-400/35 hover:bg-violet-500/15 hover:text-white ${focusRingClass}`}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <Link
                  href="/member/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className={`group flex flex-col rounded-2xl border border-white/12 bg-gradient-to-br from-violet-950/40 to-black/30 p-4 transition hover:-translate-y-0.5 hover:border-violet-400/40 ${focusRingClass}`}
                >
                  <Eye className="h-6 w-6 text-violet-200" aria-hidden />
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-violet-300/80">
                    Utilisateur · membre TENF
                  </p>
                  <p className="mt-1 text-sm font-bold text-white">Voir comme un créateur</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400 group-hover:text-slate-300">
                    Tableau de bord membre, formations et parcours — pour vérifier ce que vivent les utilisateurs après
                    une action staff.
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-200/90">
                    Espace membre (nouvel onglet)
                    <ExternalLink className="h-3 w-3" />
                  </span>
                </Link>
                <Link
                  href="/admin/engagement/raids-a-valider"
                  className={`group flex flex-col rounded-2xl border border-white/12 bg-gradient-to-br from-sky-950/35 to-black/30 p-4 transition hover:-translate-y-0.5 hover:border-sky-400/40 ${focusRingClass}`}
                >
                  <Scale className="h-6 w-6 text-sky-200/90" aria-hidden />
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-sky-300/85">
                    Modérateur
                  </p>
                  <p className="mt-1 text-sm font-bold text-white">Files & événements live</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400 group-hover:text-slate-300">
                    Entrée rapide sur les raids à valider ; enchaîne avec points Discord, présences et propositions depuis
                    les pastilles ci-dessus.
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-sky-200/90">
                    Ouvrir les raids à valider
                    <ArrowUpRight className="h-3 w-3" />
                  </span>
                </Link>
                <Link
                  href="/admin/control-center"
                  className={`group flex flex-col rounded-2xl border border-white/12 bg-gradient-to-br from-amber-950/25 to-black/30 p-4 transition hover:-translate-y-0.5 hover:border-amber-400/35 ${focusRingClass}`}
                >
                  <ShieldCheck className="h-6 w-6 text-amber-200/90" aria-hidden />
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-300/80">
                    Administrateur
                  </p>
                  <p className="mt-1 text-sm font-bold text-white">Pilotage & gouvernance</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400 group-hover:text-slate-300">
                    Control center, audit, postulations et données sensibles — le prolongement naturel des sections
                    workflow et graphiques.
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-200/90">
                    Ouvrir le control center
                    <ArrowUpRight className="h-3 w-3" />
                  </span>
                </Link>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-400">
                <span className="font-semibold uppercase tracking-[0.08em] text-slate-500">Rappels utiles</span>
                <Link
                  href="/rejoindre/guide-espace-membre/tableau-de-bord"
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 text-slate-300 transition hover:border-amber-400/35 hover:text-white ${focusRingClass}`}
                >
                  <BookOpen className="h-3 w-3 shrink-0" aria-hidden />
                  Guide membre (public)
                  <ExternalLink className="h-3 w-3" />
                </Link>
                <Link
                  href="/member/formations"
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 text-slate-300 transition hover:border-emerald-400/35 hover:text-white ${focusRingClass}`}
                >
                  <Sparkles className="h-3 w-3 shrink-0" aria-hidden />
                  Formations côté membre
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </>
          )}
          {isPilotage && (
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                {
                  title: "Membres & utilisateurs",
                  body: "Fiches, validations, formations : chaque correction améliore l’expérience visible côté espace membre.",
                  icon: HeartHandshake,
                  href: "/admin/membres/gestion",
                  cta: "Gestion membres",
                },
                {
                  title: "Modération & live",
                  body: "Raids, points Discord, présences et propositions : le rythme du Discord et des événements.",
                  icon: Scale,
                  href: "/admin/engagement/raids-a-valider",
                  cta: "Files modération",
                },
                {
                  title: "Administration",
                  body: "Pilotage staff, communauté au sens large, audits : cadre et cohérence pour toute l’équipe.",
                  icon: Compass,
                  href: "/admin/communaute",
                  cta: "Hub communauté",
                },
              ].map((pillar) => {
                const PIcon = pillar.icon;
                return (
                  <Link
                    key={pillar.title}
                    href={pillar.href}
                    className={`group rounded-2xl border border-white/12 bg-black/20 p-4 transition hover:-translate-y-[2px] hover:border-violet-400/40 hover:bg-black/30 ${focusRingClass}`}
                  >
                    <PIcon className="h-8 w-8 text-violet-300/90 transition group-hover:text-amber-200/90" aria-hidden />
                    <h2 className="mt-3 text-base font-semibold text-white">{pillar.title}</h2>
                    <p className="mt-2 text-sm leading-snug text-slate-400 group-hover:text-slate-300">{pillar.body}</p>
                    <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.06em] text-amber-200/90">
                      {pillar.cta}
                      <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {isPilotage && (
        <nav
          className="sticky top-2 z-10 flex flex-wrap gap-2 rounded-2xl border border-white/12 bg-[#0f1119]/90 p-2 shadow-lg shadow-black/30 backdrop-blur-md"
          aria-label="Sections du pilotage"
        >
          {(
            [
              { id: "cockpit" as const, label: "Cockpit & actions", Icon: LayoutDashboard, desc: "Files, workflow, flux" },
              { id: "vitals" as const, label: "Pouls communauté", Icon: Activity, desc: "Discord, raids, graphiques" },
              { id: "evenements" as const, label: "Événements", Icon: CalendarRange, desc: "Recaps & anomalies" },
            ] as const
          ).map((tab) => {
            const active = pilotTab === tab.id;
            const TabIcon = tab.Icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setPilotTab(tab.id);
                  setWorkflowExpandedId(null);
                }}
                className={`flex min-w-[140px] flex-1 items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${focusRingClass} ${
                  active
                    ? "border-violet-400/50 bg-violet-600/20 text-white shadow-inner shadow-violet-900/40"
                    : "border-transparent bg-white/[0.03] text-slate-300 hover:border-white/15 hover:bg-white/[0.06]"
                }`}
              >
                <TabIcon className={`h-5 w-5 shrink-0 ${active ? "text-violet-200" : "text-slate-500"}`} aria-hidden />
                <span>
                  <span className="block text-sm font-semibold">{tab.label}</span>
                  <span className="block text-[11px] font-normal text-slate-500">{tab.desc}</span>
                </span>
              </button>
            );
          })}
        </nav>
      )}

      {(!isPilotage || pilotTab === "cockpit") &&
        (kpis.reviewOverdue > 0 ||
        kpis.missingDiscord > 0 ||
        kpis.missingTwitchId > 0 ||
        kpis.staffApplicationsPendingCount > 0 ||
        kpis.profileValidationPendingCount > 0 ||
        kpis.staffApplicationsRedFlagCount > 0) && (
        <div
          id="admin-dash-alertes"
          className="scroll-mt-24 rounded-2xl border p-4"
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

      {(!isPilotage || pilotTab === "cockpit") && (
      <section id="admin-dash-ops" className="scroll-mt-24 rounded-2xl border p-5" style={premiumCardStyle}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">À traiter maintenant</h2>
            <p className="text-xs text-gray-300/80">
              File partagée modérateurs / administrateurs — priorité, SLA et assignation ; filtre selon ton rôle avec la
              vue enregistrée.
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
              className="rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-violet-500/10"
              style={{ borderColor: "rgba(167,139,250,0.45)", color: "rgba(221,214,254,0.96)" }}
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
                    className="rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-violet-500/10"
                    style={{ borderColor: "rgba(167,139,250,0.36)", color: "rgba(221,214,254,0.92)" }}
                  >
                    Assigner à moi
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
      )}

      {(!isPilotage || pilotTab === "vitals") && (
      <Fragment>
      <section id="admin-dash-vitals" className="scroll-mt-24 rounded-2xl border p-4 md:p-5" style={softCardStyle}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-gray-200">Alertes immédiates</h3>
            <p className="text-xs text-gray-400">
              Impact direct sur les membres ; utile en priorité aux modérateurs et à l’administration des comptes
            </p>
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

      <section id="admin-dash-agenda" className="scroll-mt-24 rounded-2xl border p-4 md:p-5" style={softCardStyle}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-gray-200">Prévisions & agenda</h3>
            <p className="text-xs text-gray-400">Ce qui arrive pour les membres et la modération événementielle</p>
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

      <div id="admin-dash-activite" className="scroll-mt-24 grid grid-cols-1 gap-6 md:grid-cols-3">
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

      <div id="admin-dash-graphs" className="scroll-mt-24 grid grid-cols-1 gap-6 md:grid-cols-3">
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
      </Fragment>
      )}

      {(!isPilotage || pilotTab === "cockpit") && (
      <Fragment>
      <div id="admin-dash-workflow" className="scroll-mt-24 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border p-6 xl:col-span-2" style={premiumCardStyle}>
          <h2 className="mb-2 text-xl font-semibold">Workflow mensuel</h2>
          <p className="mb-4 text-xs text-slate-400">
            Touche une carte pour le détail — la plupart des étapes concernent surtout les administrateurs (données,
            évaluations) ; certaines tâches sont partagées avec la modération (profils, visibilité).
          </p>
          <div className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-violet-600/40">
            {workflow.map((step) => {
              const open = workflowExpandedId === step.id;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setWorkflowExpandedId((prev) => (prev === step.id ? null : step.id))}
                  className={`min-w-[240px] flex-shrink-0 rounded-2xl border p-4 text-left transition ${focusRingClass} ${
                    open
                      ? "border-amber-400/45 bg-amber-500/10 shadow-[0_0_24px_rgba(212,175,55,0.12)]"
                      : "border-white/12 bg-white/[0.02] hover:border-violet-400/35"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-white">{step.label}</p>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusStyle(step.status)}`}>
                      {step.status === "done" ? "OK" : step.status === "in_progress" ? "En cours" : "À faire"}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs text-slate-400">{step.helper}</p>
                </button>
              );
            })}
          </div>
          {workflowExpandedId ? (
            <div
              className="mt-4 rounded-2xl border border-violet-500/25 bg-violet-950/20 p-4"
              role="region"
              aria-live="polite"
            >
              {workflow
                .filter((s) => s.id === workflowExpandedId)
                .map((step) => (
                  <div key={`detail-${step.id}`}>
                    <p className="text-sm font-medium text-white">{step.label}</p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-300">{step.helper}</p>
                    <Link
                      href={step.href}
                      className={`mt-4 inline-flex items-center gap-1.5 rounded-full border border-amber-400/35 px-4 py-2 text-xs font-semibold uppercase tracking-[0.06em] text-amber-100 transition hover:bg-amber-500/10 ${focusRingClass}`}
                    >
                      Ouvrir la page dédiée
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                ))}
            </div>
          ) : null}
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
      </Fragment>
      )}

      {(!isPilotage || pilotTab === "evenements") && (
      <div id="admin-dash-events" className="scroll-mt-24 rounded-2xl border p-6" style={softCardStyle}>
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
      )}
    </div>
  );
}
