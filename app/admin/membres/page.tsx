"use client";

import { useCallback, useEffect, useMemo, useState, type LucideIcon } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Award,
  CalendarDays,
  CalendarClock,
  ClipboardList,
  Compass,
  Database,
  ExternalLink,
  Eye,
  Globe2,
  HeartHandshake,
  History,
  LayoutGrid,
  Puzzle,
  RefreshCw,
  Sparkles,
  Star,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import AdminToastStack, { type AdminToastItem } from "@/components/admin/ui/AdminToastStack";
import AdminTableShell from "@/components/admin/ui/AdminTableShell";
import { getDiscordUser } from "@/lib/discord";

type OpsPriority = "haute" | "moyenne" | "basse";

type OpsItem = {
  id: string;
  title: string;
  description: string;
  count: number;
  priority: OpsPriority;
  impact: "bloquant_onboarding" | "risque_moderation" | "qualite_data" | "processus_interne";
  sla: string;
  owner: string;
  href: string;
};

type MemberSummary = {
  total: number;
  missingDiscord: number;
  missingTwitchId: number;
  incomplete: number;
  reviewOverdue: number;
  reviewDue7d: number;
  avgCompletion: number;
  validatedProfiles: number;
};

type MemberOps = {
  staffApplicationsPendingCount: number;
  staffApplicationsRedFlagCount: number;
  profileValidationPendingCount: number;
};

type MemberDataHealth = {
  errors: number;
  warnings: number;
  discordMissingUsername: number;
};

type DashboardView = {
  id: string;
  label: string;
  search: string;
  priorities: OpsPriority[];
  onlyBacklog: boolean;
  sortBy: "priority" | "volume";
};

type RoleView = "moderation" | "recrutement" | "operations" | "support";

const DEFAULT_SUMMARY: MemberSummary = {
  total: 0,
  missingDiscord: 0,
  missingTwitchId: 0,
  incomplete: 0,
  reviewOverdue: 0,
  reviewDue7d: 0,
  avgCompletion: 0,
  validatedProfiles: 0,
};

const DEFAULT_OPS: MemberOps = {
  staffApplicationsPendingCount: 0,
  staffApplicationsRedFlagCount: 0,
  profileValidationPendingCount: 0,
};

const DEFAULT_DATA_HEALTH: MemberDataHealth = {
  errors: 0,
  warnings: 0,
  discordMissingUsername: 0,
};

const PRIORITY_WEIGHT: Record<OpsPriority, number> = {
  haute: 3,
  moyenne: 2,
  basse: 1,
};

const glassCardClass =
  "rounded-2xl border border-indigo-300/20 bg-[linear-gradient(150deg,rgba(99,102,241,0.12),rgba(14,15,23,0.85)_45%,rgba(56,189,248,0.08))] shadow-[0_20px_50px_rgba(2,6,23,0.45)] backdrop-blur";
const sectionCardClass =
  "rounded-2xl border border-[#2f3244] bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.10),_rgba(11,13,20,0.95)_46%)] shadow-[0_16px_40px_rgba(2,6,23,0.45)]";
const subtleButtonClass =
  "inline-flex items-center gap-2 rounded-xl border border-indigo-300/25 bg-[linear-gradient(135deg,rgba(79,70,229,0.24),rgba(30,41,59,0.36))] px-3 py-2 text-sm font-medium text-indigo-100 transition hover:-translate-y-[1px] hover:border-indigo-200/45 hover:bg-[linear-gradient(135deg,rgba(99,102,241,0.34),rgba(30,41,59,0.54))]";

const focusRingClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/75 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0c12]";

type ToolCategory = "all" | "ops" | "qualite" | "communaute";

const MEMBER_EXPERIENCE_LINKS = [
  {
    href: "/member/dashboard",
    title: "Espace membre",
    description: "Le tableau de bord tel que le voit un créateur TENF.",
    icon: Eye,
    cardClass:
      "border-violet-500/35 bg-gradient-to-br from-violet-950/50 to-black/40 hover:border-violet-400/55 hover:shadow-lg hover:shadow-violet-950/25",
    iconClass: "bg-violet-500/20 text-violet-200",
  },
  {
    href: "/rejoindre/guide-public/presentation-rapide",
    title: "Parcours public",
    description: "Le message et les étapes visibles avant l’adhésion.",
    icon: Globe2,
    cardClass:
      "border-sky-500/35 bg-gradient-to-br from-sky-950/40 to-black/40 hover:border-sky-400/50 hover:shadow-lg hover:shadow-sky-950/20",
    iconClass: "bg-sky-500/18 text-sky-200",
  },
  {
    href: "/member/evenements",
    title: "Événements membres",
    description: "Inscriptions et rendez-vous côté compte connecté.",
    icon: CalendarDays,
    cardClass:
      "border-emerald-500/35 bg-gradient-to-br from-emerald-950/40 to-black/40 hover:border-emerald-400/50 hover:shadow-lg hover:shadow-emerald-950/20",
    iconClass: "bg-emerald-500/18 text-emerald-200",
  },
] as const;

const MM_NAV_SECTIONS = [
  { id: "mm-hero", label: "Accueil" },
  { id: "mm-kpis", label: "Indicateurs" },
  { id: "mm-window", label: "7 jours" },
  { id: "mm-analytics", label: "Analyses" },
  { id: "mm-anomalies", label: "Anomalies" },
  { id: "mm-filters", label: "Vues" },
  { id: "mm-treat", label: "À traiter" },
  { id: "mm-tools", label: "Outils" },
] as const;

const MEMBER_TOOL_SECTIONS: Array<{
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  iconBox: string;
  category: ToolCategory;
}> = [
  {
    href: "/admin/membres/actions",
    title: "Actions à traiter",
    description: "File unifiée : tout ce qui bloque ou attend côté membres.",
    icon: ClipboardList,
    gradient: "from-rose-500 to-amber-500",
    iconBox: "shadow-rose-500/30",
    category: "ops",
  },
  {
    href: "/admin/membres/gestion",
    title: "Liste & gestion",
    description: "Fiches, filtres et actions de masse sur la communauté.",
    icon: Users,
    gradient: "from-blue-500 to-indigo-600",
    iconBox: "shadow-blue-500/25",
    category: "ops",
  },
  {
    href: "/admin/membres/validation-profil",
    title: "Validation profils",
    description: "Demandes de changement visibles côté membre une fois validées.",
    icon: UserCheck,
    gradient: "from-emerald-500 to-teal-600",
    iconBox: "shadow-emerald-500/25",
    category: "ops",
  },
  {
    href: "/admin/membres/revues",
    title: "Revues membres",
    description: "SLA et accompagnement dans la durée.",
    icon: CalendarClock,
    gradient: "from-amber-500 to-orange-600",
    iconBox: "shadow-amber-500/25",
    category: "ops",
  },
  {
    href: "/admin/membres/postulations",
    title: "Postulations staff",
    description: "Recrutement modération / soutien — impact sur qui représente TENF.",
    icon: UserPlus,
    gradient: "from-indigo-500 to-purple-600",
    iconBox: "shadow-indigo-500/25",
    category: "ops",
  },
  {
    href: "/admin/membres/incomplets",
    title: "Profils incomplets",
    description: "Discord, Twitch, champs manquants : friction pour les membres.",
    icon: Puzzle,
    gradient: "from-yellow-500 to-amber-600",
    iconBox: "shadow-yellow-500/25",
    category: "ops",
  },
  {
    href: "/admin/membres/qualite-data",
    title: "Qualité data",
    description: "Vue fusionnée des contrôles techniques sur les fiches.",
    icon: Database,
    gradient: "from-cyan-500 to-teal-600",
    iconBox: "shadow-cyan-500/25",
    category: "qualite",
  },
  {
    href: "/admin/membres/synchronisation",
    title: "Synchronisation",
    description: "Écarts legacy / Supabase — données vues par les outils.",
    icon: RefreshCw,
    gradient: "from-purple-500 to-fuchsia-600",
    iconBox: "shadow-purple-500/25",
    category: "qualite",
  },
  {
    href: "/admin/membres/erreurs",
    title: "Erreurs & incohérences",
    description: "Anomalies à corriger avant qu’elles n’atteignent l’espace membre.",
    icon: AlertTriangle,
    gradient: "from-red-500 to-orange-600",
    iconBox: "shadow-red-500/25",
    category: "qualite",
  },
  {
    href: "/admin/membres/historique",
    title: "Historique membres",
    description: "Timeline des changements pour expliquer un état à un membre.",
    icon: History,
    gradient: "from-slate-500 to-indigo-600",
    iconBox: "shadow-slate-500/20",
    category: "qualite",
  },
  {
    href: "/admin/membres/reconciliation",
    title: "Réconciliation public → gestion",
    description: "Repérer les comptes publics pas encore bien reliés au back-office.",
    icon: Compass,
    gradient: "from-cyan-500 to-blue-600",
    iconBox: "shadow-cyan-500/25",
    category: "qualite",
  },
  {
    href: "/admin/membres/badges",
    title: "Badges & rôles",
    description: "Reconnaissance visible sur les profils et Discord.",
    icon: Award,
    gradient: "from-violet-500 to-pink-600",
    iconBox: "shadow-violet-500/25",
    category: "communaute",
  },
  {
    href: "/admin/membres/vip",
    title: "VIP & reconnaissances",
    description: "Mise en avant mensuelle côté communauté.",
    icon: Star,
    gradient: "from-amber-400 to-yellow-600",
    iconBox: "shadow-amber-400/25",
    category: "communaute",
  },
  {
    href: "/admin/membres/spotlight",
    title: "Spotlight",
    description: "Parcours événementiel côté membres créateurs.",
    icon: Sparkles,
    gradient: "from-fuchsia-500 to-violet-600",
    iconBox: "shadow-fuchsia-500/25",
    category: "communaute",
  },
];

export default function MembersControlPanelPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<MemberSummary>(DEFAULT_SUMMARY);
  const [ops, setOps] = useState<MemberOps>(DEFAULT_OPS);
  const [dataHealth, setDataHealth] = useState<MemberDataHealth>(DEFAULT_DATA_HEALTH);
  const [syncMissingCount, setSyncMissingCount] = useState(0);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [toasts, setToasts] = useState<AdminToastItem[]>([]);
  const [opsOwners, setOpsOwners] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [savedViews, setSavedViews] = useState<DashboardView[]>([]);
  const [selectedViewId, setSelectedViewId] = useState("");
  const [newViewLabel, setNewViewLabel] = useState("");
  const [currentRoleView, setCurrentRoleView] = useState<RoleView>("operations");
  const [roleLabel, setRoleLabel] = useState<string | null>(null);
  const [username, setUsername] = useState("Admin");
  const [impactFilter, setImpactFilter] = useState<OpsItem["impact"] | "all">("all");
  const [toolsCategory, setToolsCategory] = useState<ToolCategory>("all");

  const scrollToMm = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const toolCategoryCounts = useMemo(() => {
    return {
      ops: MEMBER_TOOL_SECTIONS.filter((s) => s.category === "ops").length,
      qualite: MEMBER_TOOL_SECTIONS.filter((s) => s.category === "qualite").length,
      communaute: MEMBER_TOOL_SECTIONS.filter((s) => s.category === "communaute").length,
    };
  }, []);

  const sections = useMemo(() => {
    if (toolsCategory === "all") return MEMBER_TOOL_SECTIONS;
    return MEMBER_TOOL_SECTIONS.filter((s) => s.category === toolsCategory);
  }, [toolsCategory]);

  const SAVED_VIEWS_KEY = "tenf-admin-members-pilotage-saved-views";
  const OWNERS_KEY = "tenf-admin-members-pilotage-owners";

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
    }, 4000);
  }

  function defaultViewForRole(roleView: RoleView): DashboardView {
    if (roleView === "moderation") {
      return {
        id: "default-moderation",
        label: "Vue Modération",
        search: "",
        priorities: ["haute", "moyenne"],
        onlyBacklog: true,
        sortBy: "priority",
      };
    }
    if (roleView === "recrutement") {
      return {
        id: "default-recrutement",
        label: "Vue Recrutement",
        search: "postulation",
        priorities: ["haute", "moyenne"],
        onlyBacklog: true,
        sortBy: "priority",
      };
    }
    if (roleView === "support") {
      return {
        id: "default-support",
        label: "Vue Support",
        search: "profil",
        priorities: ["haute", "moyenne", "basse"],
        onlyBacklog: false,
        sortBy: "volume",
      };
    }
    return {
      id: "default-operations",
      label: "Vue Opérations",
      search: "",
      priorities: ["haute", "moyenne", "basse"],
      onlyBacklog: false,
      sortBy: "priority",
    };
  }

  function detectRoleView(role?: string): RoleView {
    const normalized = String(role || "").toLowerCase();
    if (normalized.includes("modérateur") || normalized.includes("moderateur")) return "moderation";
    if (normalized.includes("recrut")) return "recrutement";
    if (normalized.includes("soutien")) return "support";
    return "operations";
  }

  const loadDashboard = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        const [roleRes, aggregateRes, syncRes, alertsRes, discordDataRes] = await Promise.all([
          fetch("/api/user/role", { cache: "no-store" }),
          fetch("/api/admin/dashboard/aggregate", { cache: "no-store" }),
          fetch("/api/admin/migration/check-sync-members", { cache: "no-store" }),
          fetch("/api/admin/control-center/alerts", { cache: "no-store" }),
          fetch("/api/admin/members/discord-data", { cache: "no-store" }),
        ]);

        if (roleRes.ok) {
          const roleData = await roleRes.json();
          const roleView = detectRoleView(roleData?.role);
          setCurrentRoleView(roleView);
          setRoleLabel(typeof roleData?.role === "string" ? roleData.role : null);
        }

        if (syncRes.ok) {
          const syncData = await syncRes.json();
          const missing = syncData?.data?.merged?.missingInSupabase;
          setSyncMissingCount(Array.isArray(missing) ? missing.length : 0);
        }

        if (aggregateRes.ok) {
          const aggregateData = await aggregateRes.json();
          setSummary(aggregateData?.data?.summary || DEFAULT_SUMMARY);
          setOps({
            staffApplicationsPendingCount: Number(aggregateData?.data?.ops?.staffApplicationsPendingCount || 0),
            staffApplicationsRedFlagCount: Number(aggregateData?.data?.ops?.staffApplicationsRedFlagCount || 0),
            profileValidationPendingCount: Number(aggregateData?.data?.ops?.profileValidationPendingCount || 0),
          });
          setGeneratedAt(typeof aggregateData?.meta?.generatedAt === "string" ? aggregateData.meta.generatedAt : null);
        }

        if (alertsRes.ok) {
          const alertsData = await alertsRes.json();
          setDataHealth((prev) => ({
            ...prev,
            errors: Number(alertsData?.errors || 0),
            warnings: Number(alertsData?.warnings || 0),
          }));
        }

        if (discordDataRes.ok) {
          const discordData = await discordDataRes.json();
          const members = Array.isArray(discordData?.members) ? discordData.members : [];
          const discordMissingUsername = members.filter(
            (member: any) => !String(member?.discordUsername || "").trim()
          ).length;
          setDataHealth((prev) => ({
            ...prev,
            discordMissingUsername,
          }));
        }
      } catch {
        pushToast("warning", "Chargement incomplet", "Certaines métriques du dashboard membres sont indisponibles.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadDashboard(false);
  }, []);

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
        // keep default fallback
      }
    }
    void loadUser();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    try {
      const ownersRaw = localStorage.getItem(OWNERS_KEY);
      if (ownersRaw) {
        const parsedOwners = JSON.parse(ownersRaw);
        if (parsedOwners && typeof parsedOwners === "object") {
          setOpsOwners(parsedOwners);
        }
      }
      const raw = localStorage.getItem(SAVED_VIEWS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSavedViews(parsed);
          setSelectedViewId(parsed[0].id);
          return;
        }
      }
    } catch {
      // Ignore invalid local data.
    }
    const defaultView = defaultViewForRole(currentRoleView);
    setSavedViews([defaultView]);
    setSelectedViewId(defaultView.id);
  }, [currentRoleView]);

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
    pushToast("info", "Owner mis à jour", owner ? `Assigné à ${owner}` : "Assignment retirée");
  }

  function persistViews(nextViews: DashboardView[]) {
    setSavedViews(nextViews);
    localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(nextViews));
  }

  function saveCurrentView() {
    if (!newViewLabel.trim()) {
      pushToast("warning", "Nom requis", "Ajoute un nom pour enregistrer la vue.");
      return;
    }
    const active = savedViews.find((v) => v.id === selectedViewId) || defaultViewForRole(currentRoleView);
    const view: DashboardView = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      label: newViewLabel.trim(),
      search: search || active.search,
      priorities: active.priorities,
      onlyBacklog: active.onlyBacklog,
      sortBy: active.sortBy,
    };
    const next = [view, ...savedViews].slice(0, 20);
    persistViews(next);
    setSelectedViewId(view.id);
    setNewViewLabel("");
    pushToast("success", "Vue sauvegardée", view.label);
  }

  function deleteView(viewId: string) {
    const next = savedViews.filter((v) => v.id !== viewId);
    persistViews(next);
    setSelectedViewId(next[0]?.id || "");
    pushToast("info", "Vue supprimée", "La configuration active a été mise à jour.");
  }

  const opsQueue: OpsItem[] = [
    {
      id: "profile-validation",
      title: "Valider les profils",
      description: "Demandes de modifications de profil en attente.",
      count: ops.profileValidationPendingCount,
      priority: ops.profileValidationPendingCount > 0 ? "haute" : "basse",
      impact: "bloquant_onboarding",
      sla: "24h",
      owner: opsOwners["profile-validation"] || "",
      href: "/admin/membres/validation-profil",
    },
    {
      id: "sync-missing",
      title: "Corriger la synchronisation",
      description: "Membres présents en source legacy mais absents Supabase.",
      count: syncMissingCount,
      priority: syncMissingCount > 0 ? "haute" : "moyenne",
      impact: "qualite_data",
      sla: "48h",
      owner: opsOwners["sync-missing"] || "",
      href: "/admin/membres/synchronisation",
    },
    {
      id: "new-postulations",
      title: "Traiter les postulations staff",
      description: "Nouvelles candidatures à instruire.",
      count: ops.staffApplicationsPendingCount,
      priority: ops.staffApplicationsPendingCount > 0 ? "haute" : "moyenne",
      impact: "risque_moderation",
      sla: "24h",
      owner: opsOwners["new-postulations"] || "",
      href: "/admin/membres/postulations",
    },
    {
      id: "review-due",
      title: "Lancer les revues membres",
      description: "Membres avec revue dépassée.",
      count: summary.reviewOverdue,
      priority: summary.reviewOverdue > 0 ? "moyenne" : "basse",
      impact: "processus_interne",
      sla: "7 jours",
      owner: opsOwners["review-due"] || "",
      href: "/admin/membres/revues",
    },
    {
      id: "review-due-7d",
      title: "Préparer les revues à 7 jours",
      description: "Membres qui arrivent à échéance de revue.",
      count: summary.reviewDue7d,
      priority: summary.reviewDue7d > 0 ? "moyenne" : "basse",
      impact: "processus_interne",
      sla: "7 jours",
      owner: opsOwners["review-due-7d"] || "",
      href: "/admin/membres/revues",
    },
    {
      id: "incomplete-profiles",
      title: "Compléter les profils",
      description: "Profils avec identifiants/champs essentiels manquants.",
      count: summary.incomplete,
      priority: summary.incomplete > 0 ? "moyenne" : "basse",
      impact: "bloquant_onboarding",
      sla: "7 jours",
      owner: opsOwners["incomplete-profiles"] || "",
      href: "/admin/membres/incomplets",
    },
    {
      id: "data-errors",
      title: "Corriger les incohérences data",
      description: "Anomalies détectées sur la donnée membres.",
      count: dataHealth.errors,
      priority: dataHealth.errors > 0 ? "haute" : "basse",
      impact: "qualite_data",
      sla: "48h",
      owner: opsOwners["data-errors"] || "",
      href: "/admin/membres/erreurs",
    },
  ];
  const queueTotal = useMemo(() => opsQueue.reduce((sum, item) => sum + item.count, 0), [opsQueue]);

  const activeView = savedViews.find((v) => v.id === selectedViewId) || defaultViewForRole(currentRoleView);
  const effectiveSearch = (search || activeView.search || "").trim().toLowerCase();

  const filteredQueue = useMemo(() => {
    const base = opsQueue.filter((item) => {
      if (!activeView.priorities.includes(item.priority)) return false;
      if (activeView.onlyBacklog && item.count <= 0) return false;
      if (impactFilter !== "all" && item.impact !== impactFilter) return false;
      if (!effectiveSearch) return true;
      return (
        item.title.toLowerCase().includes(effectiveSearch) ||
        item.description.toLowerCase().includes(effectiveSearch) ||
        item.id.toLowerCase().includes(effectiveSearch)
      );
    });
    return base.sort((a, b) => {
      if (activeView.sortBy === "volume") {
        if (b.count !== a.count) return b.count - a.count;
        return PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
      }
      const priorityDelta = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
      if (priorityDelta !== 0) return priorityDelta;
      return b.count - a.count;
    });
  }, [activeView.onlyBacklog, activeView.priorities, activeView.sortBy, effectiveSearch, impactFilter, opsQueue]);

  const paginatedQueue = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredQueue.slice(start, start + pageSize);
  }, [filteredQueue, page, pageSize]);

  const roleChecklist = useMemo(() => {
    if (currentRoleView === "moderation") {
      return [
        {
          id: "mod-postulations",
          label: "Traiter les postulations staff",
          done: ops.staffApplicationsPendingCount === 0,
          href: "/admin/membres/postulations",
        },
        {
          id: "mod-reviews",
          label: "Vérifier les revues en retard",
          done: summary.reviewOverdue === 0,
          href: "/admin/membres/revues",
        },
        {
          id: "mod-validation",
          label: "Clôturer les validations de profil",
          done: ops.profileValidationPendingCount === 0,
          href: "/admin/membres/validation-profil",
        },
      ];
    }
    if (currentRoleView === "recrutement") {
      return [
        {
          id: "recruit-postulations",
          label: "Prioriser les candidatures en attente",
          done: ops.staffApplicationsPendingCount === 0,
          href: "/admin/membres/postulations",
        },
        {
          id: "recruit-incomplete",
          label: "Relancer les profils incomplets",
          done: summary.incomplete === 0,
          href: "/admin/membres/incomplets",
        },
        {
          id: "recruit-sync",
          label: "Contrôler les écarts de synchronisation",
          done: syncMissingCount === 0,
          href: "/admin/membres/synchronisation",
        },
      ];
    }
    if (currentRoleView === "support") {
      return [
        {
          id: "support-validation",
          label: "Répondre aux demandes profil",
          done: ops.profileValidationPendingCount === 0,
          href: "/admin/membres/validation-profil",
        },
        {
          id: "support-errors",
          label: "Réduire les erreurs de données",
          done: dataHealth.errors === 0,
          href: "/admin/membres/erreurs",
        },
        {
          id: "support-discord",
          label: "Compléter les usernames Discord",
          done: dataHealth.discordMissingUsername === 0,
          href: "/admin/membres/donnee-discord",
        },
      ];
    }
    return [
      {
        id: "ops-backlog",
        label: "Résorber le backlog prioritaire",
        done: queueTotal === 0,
        href: "/admin/membres/actions",
      },
      {
        id: "ops-reviews",
        label: "Maintenir les revues dans le SLA",
        done: summary.reviewOverdue === 0,
        href: "/admin/membres/revues",
      },
      {
        id: "ops-quality",
        label: "Stabiliser la qualité data",
        done: dataHealth.errors === 0 && syncMissingCount === 0,
        href: "/admin/membres/qualite-data",
      },
    ];
  }, [
    currentRoleView,
    dataHealth.discordMissingUsername,
    dataHealth.errors,
    ops.profileValidationPendingCount,
    ops.staffApplicationsPendingCount,
    queueTotal,
    summary.incomplete,
    summary.reviewOverdue,
    syncMissingCount,
  ]);

  const progressMetrics = useMemo(() => {
    const completionRate = summary.total > 0 ? Math.round((summary.avgCompletion / 100) * 100) : 0;
    const validatedRate = summary.total > 0 ? Math.round((summary.validatedProfiles / summary.total) * 100) : 0;
    const reviewCoverageRate = summary.total > 0 ? Math.max(0, Math.round(((summary.total - summary.reviewOverdue) / summary.total) * 100)) : 0;
    const dataQualityRate = Math.max(
      0,
      100 - Math.round(((summary.missingDiscord + summary.missingTwitchId + syncMissingCount + dataHealth.errors) / Math.max(summary.total, 1)) * 100)
    );
    return { completionRate, validatedRate, reviewCoverageRate, dataQualityRate };
  }, [
    dataHealth.errors,
    summary.avgCompletion,
    summary.missingDiscord,
    summary.missingTwitchId,
    summary.reviewOverdue,
    summary.total,
    summary.validatedProfiles,
    syncMissingCount,
  ]);

  const impactBreakdown = useMemo(() => {
    const counts = {
      bloquant_onboarding: 0,
      risque_moderation: 0,
      qualite_data: 0,
      processus_interne: 0,
    };
    opsQueue.forEach((item) => {
      counts[item.impact] += item.count;
    });
    const total = Object.values(counts).reduce((acc, value) => acc + value, 0);
    const toPct = (value: number) => (total > 0 ? Math.round((value / total) * 100) : 0);
    return {
      counts,
      total,
      pct: {
        bloquant_onboarding: toPct(counts.bloquant_onboarding),
        risque_moderation: toPct(counts.risque_moderation),
        qualite_data: toPct(counts.qualite_data),
        processus_interne: toPct(counts.processus_interne),
      },
    };
  }, [opsQueue]);

  const impactDonutBackground = useMemo(() => {
    const p1 = impactBreakdown.pct.bloquant_onboarding;
    const p2 = impactBreakdown.pct.risque_moderation;
    const p3 = impactBreakdown.pct.qualite_data;
    const p4 = Math.max(0, 100 - (p1 + p2 + p3));
    if (impactBreakdown.total === 0) {
      return "conic-gradient(#1f2433 0% 100%)";
    }
    return `conic-gradient(#e879f9 0% ${p1}%, #fb923c ${p1}% ${p1 + p2}%, #22d3ee ${p1 + p2}% ${p1 + p2 + p3}%, #94a3b8 ${p1 + p2 + p3}% ${p1 + p2 + p3 + p4}%)`;
  }, [impactBreakdown]);

  const ownerLoad = useMemo(() => {
    const map = new Map<string, number>();
    opsQueue.forEach((item) => {
      if (item.count <= 0) return;
      const owner = item.owner.trim() || "Non assigné";
      map.set(owner, (map.get(owner) || 0) + item.count);
    });
    const rows = Array.from(map.entries())
      .map(([owner, total]) => ({ owner, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
    const max = rows[0]?.total || 1;
    return rows.map((row) => ({ ...row, pct: Math.round((row.total / max) * 100) }));
  }, [opsQueue]);

  const topAnomalies = useMemo(() => {
    return [
      { id: "missing-discord", label: "Discord manquant", value: summary.missingDiscord, href: "/admin/membres/incomplets" },
      { id: "missing-twitch", label: "Twitch ID manquant", value: summary.missingTwitchId, href: "/admin/membres/incomplets" },
      { id: "sync-gap", label: "Écarts de synchronisation", value: syncMissingCount, href: "/admin/membres/synchronisation" },
      { id: "data-errors", label: "Erreurs techniques data", value: dataHealth.errors, href: "/admin/membres/erreurs" },
      { id: "discord-username", label: "Username Discord vide", value: dataHealth.discordMissingUsername, href: "/admin/membres/donnee-discord" },
    ]
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [dataHealth.discordMissingUsername, dataHealth.errors, summary.missingDiscord, summary.missingTwitchId, syncMissingCount]);

  if (loading) {
    return (
      <div className="space-y-6 text-white">
        <div className={`${glassCardClass} animate-pulse p-6 md:p-8`}>
          <div className="h-4 w-48 rounded bg-white/10" />
          <div className="mt-4 h-10 max-w-lg rounded-lg bg-white/10" />
          <div className="mt-4 h-16 max-w-2xl rounded-lg bg-white/5" />
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-white/5" />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={`${sectionCardClass} h-28 animate-pulse`} />
          ))}
        </div>
        <div className="flex justify-center py-6">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-indigo-400/40 border-t-indigo-200" />
        </div>
      </div>
    );
  }

  const redCritical = summary.missingDiscord + summary.missingTwitchId + syncMissingCount + dataHealth.errors;
  const qualityScore = Math.max(
    0,
    100 - (dataHealth.errors * 4 + dataHealth.warnings * 2 + syncMissingCount + dataHealth.discordMissingUsername)
  );
  const generatedAtLabel = generatedAt
    ? new Date(generatedAt).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
    : "n/a";

  return (
    <div className="space-y-6 text-white">
      <AdminToastStack
        toasts={toasts}
        onClose={(id) => setToasts((prev) => prev.filter((item) => item.id !== id))}
      />
      <section id="mm-hero" className={`relative scroll-mt-24 overflow-hidden p-5 md:p-6 ${glassCardClass}`}>
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/4 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.14em] text-indigo-200/90">Membres TENF · hub staff</p>
            <h1 className="mt-2 bg-gradient-to-r from-indigo-100 via-sky-200 to-emerald-200 bg-clip-text text-3xl font-semibold text-transparent md:text-4xl">
              Bonjour {username} — pilotage communauté
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Chaque chiffre ici a un <strong className="font-medium text-white">effet côté créateurs</strong> : fiches,
              événements, Discord. Les vues « membre & public » t’aident à ne pas dériver du ressenti terrain avant une
              décision ou un message.
            </p>
            <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/20 px-2 py-1">
                <HeartHandshake className="h-3.5 w-3.5 text-violet-300" aria-hidden />
                Rôle vue : {roleLabel || "Opérations"}
              </span>
            </p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <button
              type="button"
              onClick={() => void loadDashboard(true)}
              disabled={refreshing}
              className={`${subtleButtonClass} disabled:opacity-60 ${focusRingClass}`}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Actualisation..." : "Actualiser les données"}
            </button>
            <p className="text-xs text-slate-400">Dernière synchro : {generatedAtLabel}</p>
          </div>
        </div>
        <div className="relative mt-4 flex flex-wrap items-center gap-2">
          <Link
            href="/admin/membres/actions"
            className={`rounded-lg border border-indigo-300/35 bg-indigo-300/10 px-3 py-1.5 text-xs font-semibold text-indigo-100 transition hover:bg-indigo-300/20 ${focusRingClass}`}
          >
            Queue unifiée : {queueTotal}
          </Link>
          <Link
            href="/admin/membres/qualite-data"
            className={`rounded-lg border border-cyan-300/35 bg-cyan-300/10 px-3 py-1.5 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-300/20 ${focusRingClass}`}
          >
            Qualité data : score {qualityScore}
          </Link>
          <Link
            href="/admin/membres/revues"
            className={`rounded-lg border border-amber-300/35 bg-amber-300/10 px-3 py-1.5 text-xs font-semibold text-amber-100 transition hover:bg-amber-300/20 ${focusRingClass}`}
          >
            Revues à planifier : {summary.reviewDue7d}
          </Link>
        </div>

        <div className="relative mt-8 border-t border-white/10 pt-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-300/90">
            Expérience membre & public (nouvel onglet)
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Compare ce que tu fais dans l’admin avec ce que voient les membres et les visiteurs.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {MEMBER_EXPERIENCE_LINKS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className={`group flex flex-col rounded-2xl border p-4 transition duration-200 hover:-translate-y-0.5 ${item.cardClass} ${focusRingClass}`}
                >
                  <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${item.iconClass}`}>
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <p className="mt-3 text-sm font-bold text-white">{item.title}</p>
                  <p className="mt-1 flex-1 text-xs leading-relaxed text-slate-400 group-hover:text-slate-300">
                    {item.description}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-200/90">
                    Ouvrir
                    <ExternalLink className="h-3 w-3" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <nav
        className="sticky top-2 z-10 flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-[#0a0c14]/92 p-2 shadow-lg shadow-black/40 backdrop-blur-md"
        aria-label="Sections du hub membres"
      >
        {MM_NAV_SECTIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => scrollToMm(item.id)}
            className={`rounded-xl border border-transparent px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400 transition hover:border-indigo-400/35 hover:bg-indigo-500/15 hover:text-white ${focusRingClass}`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <section id="mm-kpis" className="scroll-mt-24 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-8">
        <Link
          href="/admin/membres/gestion"
          className={`block transition hover:opacity-95 ${focusRingClass} rounded-2xl`}
          title="Annuaire membres"
        >
          <div className={`${sectionCardClass} h-full p-4 transition hover:border-indigo-400/30`}>
            <p className="text-xs uppercase tracking-[0.08em] text-slate-400">Membres total</p>
            <p className="mt-2 text-3xl font-bold text-white">{summary.total}</p>
            <p className="mt-1 text-xs text-slate-400">Base · clic pour la liste</p>
          </div>
        </Link>
        <Link href="/admin/membres/incomplets" className={`block ${focusRingClass} rounded-2xl`} title="Profils incomplets">
          <div className={`${sectionCardClass} h-full p-4 transition hover:border-amber-400/30`}>
            <p className="text-xs uppercase tracking-[0.08em] text-slate-400">Profils incomplets</p>
            <p className="mt-2 text-3xl font-bold text-amber-300">{summary.incomplete}</p>
            <p className="mt-1 text-xs text-slate-400">Friction côté membre</p>
          </div>
        </Link>
        <Link href="/admin/membres/revues" className={`block ${focusRingClass} rounded-2xl`} title="Revues">
          <div className={`${sectionCardClass} h-full p-4 transition hover:border-orange-400/30`}>
            <p className="text-xs uppercase tracking-[0.08em] text-slate-400">Revues en retard</p>
            <p className="mt-2 text-3xl font-bold text-orange-300">{summary.reviewOverdue}</p>
            <p className="mt-1 text-xs text-slate-400">SLA dépassé</p>
          </div>
        </Link>
        <Link href="/admin/membres/revues" className={`block ${focusRingClass} rounded-2xl`} title="Revues à venir">
          <div className={`${sectionCardClass} h-full p-4 transition hover:border-yellow-400/25`}>
            <p className="text-xs uppercase tracking-[0.08em] text-slate-400">Revues &lt; 7 jours</p>
            <p className="mt-2 text-3xl font-bold text-yellow-300">{summary.reviewDue7d}</p>
            <p className="mt-1 text-xs text-slate-400">Charge prévisionnelle</p>
          </div>
        </Link>
        <Link href="/admin/membres/validation-profil" className={`block ${focusRingClass} rounded-2xl`} title="Validations">
          <div className={`${sectionCardClass} h-full p-4 transition hover:border-cyan-400/30`}>
            <p className="text-xs uppercase tracking-[0.08em] text-slate-400">Validation profils</p>
            <p className="mt-2 text-3xl font-bold text-cyan-300">{ops.profileValidationPendingCount}</p>
            <p className="mt-1 text-xs text-slate-400">Demandes visibles après traitement</p>
          </div>
        </Link>
        <Link href="/admin/membres/postulations" className={`block ${focusRingClass} rounded-2xl`} title="Postulations">
          <div className={`${sectionCardClass} h-full p-4 transition hover:border-indigo-400/30`}>
            <p className="text-xs uppercase tracking-[0.08em] text-slate-400">Postulations staff</p>
            <p className="mt-2 text-3xl font-bold text-indigo-300">{ops.staffApplicationsPendingCount}</p>
            <p className="mt-1 text-xs text-slate-400">{ops.staffApplicationsRedFlagCount} red flag</p>
          </div>
        </Link>
        <Link href="/admin/membres/qualite-data" className={`block ${focusRingClass} rounded-2xl`} title="Qualité data">
          <div className={`${sectionCardClass} h-full p-4 transition hover:border-cyan-400/25`}>
            <p className="text-xs uppercase tracking-[0.08em] text-slate-300">Score qualité data</p>
            <p className="mt-2 text-3xl font-bold text-cyan-200">{qualityScore}</p>
            <p className="mt-1 text-xs text-slate-400">
              {dataHealth.errors} erreurs, {dataHealth.warnings} alertes
            </p>
          </div>
        </Link>
        <Link href="/admin/membres/incomplets" className={`block ${focusRingClass} rounded-2xl`} title="Données critiques">
          <div className={`${sectionCardClass} h-full p-4 transition hover:border-red-400/30`}>
            <p className="text-xs uppercase tracking-[0.08em] text-slate-300">Risque données</p>
            <p className="mt-2 text-3xl font-bold text-red-300">{redCritical}</p>
            <p className="mt-1 text-xs text-slate-400">IDs + sync</p>
          </div>
        </Link>
      </section>

      <section id="mm-window" className="scroll-mt-24 grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1fr]">
        <article className={`${sectionCardClass} p-5`}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-100">Fenêtre opérationnelle 7 jours</h2>
            <span className="rounded-full border border-indigo-300/30 bg-indigo-300/10 px-2.5 py-1 text-xs text-indigo-100">
              Pilotage court terme
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-400">
            Ce que tu stabilises ici évite aux <strong className="font-medium text-slate-200">membres</strong> des
            retards ou des incohérences visibles (profil, accès, événements).
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-[#353a50] bg-[#121623]/80 p-3">
              <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Revues à échéance</p>
              <p className="mt-1 text-2xl font-semibold text-amber-200">{summary.reviewDue7d}</p>
            </div>
            <div className="rounded-xl border border-[#353a50] bg-[#121623]/80 p-3">
              <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Profils à compléter</p>
              <p className="mt-1 text-2xl font-semibold text-sky-200">{summary.incomplete}</p>
            </div>
            <div className="rounded-xl border border-[#353a50] bg-[#121623]/80 p-3">
              <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Tickets validation profil</p>
              <p className="mt-1 text-2xl font-semibold text-indigo-200">{ops.profileValidationPendingCount}</p>
            </div>
            <div className="rounded-xl border border-[#353a50] bg-[#121623]/80 p-3">
              <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Risque qualité data</p>
              <p className="mt-1 text-2xl font-semibold text-rose-200">{dataHealth.errors + syncMissingCount}</p>
            </div>
          </div>
        </article>

        <article className={`${sectionCardClass} p-5`}>
          <h2 className="text-lg font-semibold text-slate-100">Checklist du rôle</h2>
          <p className="mt-1 text-sm text-slate-400">
            Trois gestes à cocher — pensés pour l’impact sur la communauté, pas seulement la file admin.
          </p>
          <div className="mt-4 space-y-2">
            {roleChecklist.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm transition ${
                  item.done
                    ? "border-emerald-300/35 bg-emerald-300/10 text-emerald-100 hover:bg-emerald-300/15"
                    : "border-amber-300/35 bg-amber-300/10 text-amber-100 hover:bg-amber-300/15"
                }`}
              >
                <span>{item.label}</span>
                <span className="text-xs font-semibold uppercase tracking-[0.08em]">{item.done ? "OK" : "À faire"}</span>
              </Link>
            ))}
          </div>
        </article>
      </section>

      <section id="mm-analytics" className="scroll-mt-24 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <article className={`${sectionCardClass} p-5`}>
          <h2 className="text-lg font-semibold text-slate-100">Progression parcours</h2>
          <div className="mt-4 space-y-3">
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
                <span>Complétion moyenne profil</span>
                <span>{progressMetrics.completionRate}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-800">
                <div className="h-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-sky-300" style={{ width: `${progressMetrics.completionRate}%` }} />
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
                <span>Profils validés</span>
                <span>{progressMetrics.validatedRate}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-800">
                <div className="h-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-lime-300" style={{ width: `${progressMetrics.validatedRate}%` }} />
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
                <span>Couverture des revues</span>
                <span>{progressMetrics.reviewCoverageRate}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-800">
                <div className="h-2.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-300" style={{ width: `${progressMetrics.reviewCoverageRate}%` }} />
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
                <span>Santé des données</span>
                <span>{progressMetrics.dataQualityRate}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-800">
                <div className="h-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-300" style={{ width: `${progressMetrics.dataQualityRate}%` }} />
              </div>
            </div>
          </div>
        </article>

        <article className={`${sectionCardClass} p-5`}>
          <h2 className="text-lg font-semibold text-slate-100">Camembert backlog impact</h2>
          <div className="mt-4 flex items-center gap-4">
            <div className="relative h-32 w-32 rounded-full" style={{ background: impactDonutBackground }}>
              <div className="absolute inset-4 flex items-center justify-center rounded-full bg-[#0f1321] text-center">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.08em] text-slate-400">Total</p>
                  <p className="text-xl font-semibold text-slate-100">{impactBreakdown.total}</p>
                </div>
              </div>
            </div>
            <div className="space-y-1.5 text-xs">
              <p className="text-fuchsia-200">Onboarding: {impactBreakdown.counts.bloquant_onboarding} ({impactBreakdown.pct.bloquant_onboarding}%)</p>
              <p className="text-orange-200">Modération: {impactBreakdown.counts.risque_moderation} ({impactBreakdown.pct.risque_moderation}%)</p>
              <p className="text-cyan-200">Qualité data: {impactBreakdown.counts.qualite_data} ({impactBreakdown.pct.qualite_data}%)</p>
              <p className="text-slate-300">Interne: {impactBreakdown.counts.processus_interne} ({impactBreakdown.pct.processus_interne}%)</p>
            </div>
          </div>
        </article>

        <article className={`${sectionCardClass} p-5`}>
          <h2 className="text-lg font-semibold text-slate-100">Charge par owner</h2>
          <p className="mt-1 text-xs text-slate-400">Top charge active sur les actions ouvertes.</p>
          <div className="mt-4 space-y-2">
            {ownerLoad.length === 0 ? (
              <p className="rounded-xl border border-slate-700 bg-[#121623]/80 p-3 text-sm text-slate-400">Aucune charge active détectée.</p>
            ) : (
              ownerLoad.map((row) => (
                <div key={row.owner}>
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
                    <span>{row.owner}</span>
                    <span>{row.total}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-800">
                    <div className="h-2.5 rounded-full bg-gradient-to-r from-violet-500 to-indigo-300" style={{ width: `${row.pct}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section id="mm-anomalies" className={`scroll-mt-24 ${sectionCardClass} p-5`}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-100">Top anomalies données</h2>
          <Link href="/admin/membres/qualite-data" className="text-xs text-indigo-200 hover:text-indigo-100">
            Ouvrir qualité data
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-5">
          {topAnomalies.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="rounded-xl border border-[#353a50] bg-[#121623]/80 p-3 transition hover:border-indigo-300/45 hover:bg-[#171d2f]"
            >
              <p className="text-xs uppercase tracking-[0.08em] text-slate-400">{item.label}</p>
              <p className="mt-1 text-2xl font-semibold text-slate-100">{item.value}</p>
            </Link>
          ))}
        </div>
      </section>

      <section id="mm-filters" className={`scroll-mt-24 ${sectionCardClass} flex flex-wrap items-center gap-2 p-3`}>
        <span className="rounded-md border border-[#353a50] bg-[#121623]/80 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-300">
          {roleLabel || "Operations"}
        </span>
        <select
          value={selectedViewId}
          onChange={(e) => setSelectedViewId(e.target.value)}
          className="rounded-lg border border-[#353a50] bg-[#121623]/80 px-3 py-2 text-sm text-white"
        >
          <option value="">Vues sauvegardées</option>
          {savedViews.map((view) => (
            <option key={view.id} value={view.id}>{view.label}</option>
          ))}
        </select>
        <input
          value={newViewLabel}
          onChange={(e) => setNewViewLabel(e.target.value)}
          placeholder="Nom de vue"
          className="rounded-lg border border-[#353a50] bg-[#121623]/80 px-3 py-2 text-sm text-white"
        />
        <button
          onClick={() => {
            const current = savedViews.find((v) => v.id === selectedViewId);
            if (!current) return;
            const updated = savedViews.map((v) =>
              v.id === current.id ? { ...v, onlyBacklog: !v.onlyBacklog } : v
            );
            persistViews(updated);
            pushToast("info", "Vue mise à jour", !current.onlyBacklog ? "Mode backlog actif" : "Toutes tâches affichées");
          }}
          className="rounded-lg border border-indigo-300/25 bg-indigo-300/5 px-3 py-2 text-xs font-semibold text-indigo-100 hover:bg-indigo-300/10"
        >
          {activeView.onlyBacklog ? "Tâches actives uniquement" : "Toutes les tâches"}
        </button>
        <button
          onClick={() => {
            const current = savedViews.find((v) => v.id === selectedViewId);
            if (!current) return;
            const nextSort: DashboardView["sortBy"] =
              current.sortBy === "priority" ? "volume" : "priority";
            const updated = savedViews.map((v) =>
              v.id === current.id ? { ...v, sortBy: nextSort } : v
            );
            persistViews(updated);
            pushToast("info", "Tri mis à jour", nextSort === "priority" ? "Tri par priorité" : "Tri par volume");
          }}
          className="rounded-lg border border-indigo-300/25 bg-indigo-300/5 px-3 py-2 text-xs font-semibold text-indigo-100 hover:bg-indigo-300/10"
        >
          Tri : {activeView.sortBy === "priority" ? "Priorité" : "Volume"}
        </button>
        {(["all", "bloquant_onboarding", "risque_moderation", "qualite_data", "processus_interne"] as const).map((impact) => (
          <button
            key={impact}
            type="button"
            onClick={() => setImpactFilter(impact)}
            className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
              impactFilter === impact
                ? "border-indigo-300/50 bg-indigo-400/20 text-indigo-100"
                : "border-[#353a50] bg-[#121623]/80 text-slate-300 hover:border-indigo-300/35 hover:text-indigo-100"
            }`}
          >
            {impact === "all"
              ? "Impact: Tous"
              : impact === "bloquant_onboarding"
              ? "Onboarding"
              : impact === "risque_moderation"
              ? "Modération"
              : impact === "qualite_data"
              ? "Qualité data"
              : "Interne"}
          </button>
        ))}
        <button
          onClick={saveCurrentView}
          className="rounded-lg border border-indigo-300/30 bg-indigo-500/25 px-3 py-2 text-sm font-semibold text-indigo-100 hover:bg-indigo-500/35"
        >
          Sauver vue
        </button>
        {selectedViewId && (
          <button
            onClick={() => deleteView(selectedViewId)}
            className="rounded-lg border border-rose-300/30 bg-rose-500/20 px-3 py-2 text-sm font-semibold text-rose-200 hover:bg-rose-500/30"
          >
            Suppr vue
          </button>
        )}
      </section>

      <section id="mm-treat" className={`scroll-mt-24 ${sectionCardClass} p-4`}>
        <AdminTableShell
          title="À traiter maintenant"
          subtitle="File priorisée (SLA, owner) — chaque ligne renvoie vers l’outil qui débloque un membre ou la donnée"
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
                <tr className="border-b border-gray-700">
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-300">Action</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-300">Priorité</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-300">Impact</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-300">Score</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-300">SLA</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-300">Volume</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-300">Owner</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-gray-300">Action rapide</th>
                </tr>
              </thead>
              <tbody>
                {paginatedQueue.map((item) => (
                  <tr key={item.id} className="border-b border-gray-800/80">
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
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          item.impact === "bloquant_onboarding"
                            ? "bg-fuchsia-500/20 text-fuchsia-200"
                            : item.impact === "risque_moderation"
                            ? "bg-orange-500/20 text-orange-200"
                            : item.impact === "qualite_data"
                            ? "bg-cyan-500/20 text-cyan-200"
                            : "bg-slate-500/20 text-slate-200"
                        }`}
                      >
                        {item.impact === "bloquant_onboarding"
                          ? "Bloquant onboarding"
                          : item.impact === "risque_moderation"
                          ? "Risque modération"
                          : item.impact === "qualite_data"
                          ? "Qualité data"
                          : "Processus interne"}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex rounded-full border border-indigo-300/35 bg-indigo-300/10 px-2 py-1 text-xs font-semibold text-indigo-100">
                        {Math.round(
                          item.count *
                            (item.priority === "haute" ? 3 : item.priority === "moyenne" ? 2 : 1) *
                            (item.impact === "bloquant_onboarding"
                              ? 1.4
                              : item.impact === "risque_moderation"
                              ? 1.3
                              : item.impact === "qualite_data"
                              ? 1.25
                              : 1.1)
                        )}
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
                    <td colSpan={8} className="px-3 py-8 text-center text-sm text-gray-400">
                      Aucune action trouvée avec cette vue.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </AdminTableShell>
      </section>

      <section id="mm-tools" className="scroll-mt-24 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-slate-200">
              <LayoutGrid className="h-5 w-5 text-indigo-300" aria-hidden />
              <h2 className="text-lg font-semibold">Outils membres</h2>
            </div>
            <p className="mt-1 max-w-2xl text-sm text-slate-400">
              Filtre par famille : <strong className="text-slate-300">Opérations</strong> (quotidien terrain),{" "}
              <strong className="text-slate-300">Qualité data</strong> (fiabilité),{" "}
              <strong className="text-slate-300">Communauté</strong> (reconnaissance & parcours).
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: "all" as const, label: "Tout", count: MEMBER_TOOL_SECTIONS.length },
              { id: "ops" as const, label: "Opérations", count: toolCategoryCounts.ops },
              { id: "qualite" as const, label: "Qualité data", count: toolCategoryCounts.qualite },
              { id: "communaute" as const, label: "Communauté", count: toolCategoryCounts.communaute },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setToolsCategory(tab.id)}
              className={`rounded-xl border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${focusRingClass} ${
                toolsCategory === tab.id
                  ? "border-indigo-400/50 bg-indigo-500/25 text-white shadow-inner shadow-indigo-950/40"
                  : "border-white/10 bg-black/25 text-slate-400 hover:border-indigo-400/35 hover:text-white"
              }`}
            >
              {tab.label}
              <span className="ml-1.5 tabular-nums text-[10px] text-slate-500">({tab.count})</span>
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Link
                key={section.href}
                href={section.href}
                className={`group rounded-2xl border border-indigo-300/20 bg-[linear-gradient(135deg,rgba(79,70,229,0.14),rgba(15,23,42,0.72))] p-5 transition hover:-translate-y-[3px] hover:border-indigo-200/45 hover:shadow-[0_18px_40px_rgba(67,56,202,0.38)] ${focusRingClass}`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${section.gradient} text-white shadow-lg ${section.iconBox}`}
                  >
                    <Icon className="h-6 w-6" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-indigo-300/80">
                      {section.category === "ops"
                        ? "Opérations"
                        : section.category === "qualite"
                          ? "Qualité data"
                          : "Communauté"}
                    </p>
                    <h3 className="mb-1 text-base font-semibold text-slate-100 transition-colors group-hover:text-indigo-200">
                      {section.title}
                    </h3>
                    <p className="text-sm leading-snug text-slate-400 group-hover:text-slate-300">{section.description}</p>
                  </div>
                  <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-slate-500 transition-colors group-hover:text-indigo-200" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
