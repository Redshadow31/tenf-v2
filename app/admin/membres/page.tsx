"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
    if (normalized.includes("modérateur")) return "moderation";
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
        const user = await getDiscordUser();
        if (!mounted) return;
        if (user?.username) {
          setUsername(user.username);
        }
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
      sla: "48h",
      owner: opsOwners["data-errors"] || "",
      href: "/admin/membres/erreurs",
    },
  ];

  const activeView = savedViews.find((v) => v.id === selectedViewId) || defaultViewForRole(currentRoleView);
  const effectiveSearch = (search || activeView.search || "").trim().toLowerCase();

  const filteredQueue = useMemo(() => {
    const base = opsQueue.filter((item) => {
      if (!activeView.priorities.includes(item.priority)) return false;
      if (activeView.onlyBacklog && item.count <= 0) return false;
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
  }, [activeView.onlyBacklog, activeView.priorities, activeView.sortBy, effectiveSearch, opsQueue]);

  const paginatedQueue = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredQueue.slice(start, start + pageSize);
  }, [filteredQueue, page, pageSize]);

  const sections = [
    { href: "/admin/membres/actions", title: "Actions à traiter", description: "Queue unifiée profil/postulations/sync/erreurs.", icon: "🎯", color: "from-rose-500 to-amber-500" },
    { href: "/admin/membres/gestion", title: "Liste & gestion", description: "CRUD complet, filtres métiers et actions de masse.", icon: "🗂️", color: "from-blue-500 to-blue-600" },
    { href: "/admin/membres/validation-profil", title: "Validation profils", description: "Demandes profil en attente avec traitement rapide.", icon: "✅", color: "from-green-500 to-green-600" },
    { href: "/admin/membres/revues", title: "Revues membres", description: "Retards, SLA et attribution des responsables.", icon: "📆", color: "from-amber-500 to-orange-600" },
    { href: "/admin/membres/qualite-data", title: "Qualité data", description: "Fusion des contrôles techniques en onglets.", icon: "🧬", color: "from-cyan-500 to-teal-600" },
    { href: "/admin/membres/postulations", title: "Postulations staff", description: "Candidatures modération/soutien à prioriser.", icon: "🧲", color: "from-indigo-500 to-purple-600" },
    { href: "/admin/membres/incomplets", title: "Profils incomplets", description: "Corrections ciblées Discord/Twitch/intégration.", icon: "🧩", color: "from-yellow-500 to-amber-600" },
    { href: "/admin/membres/synchronisation", title: "Synchronisation", description: "Contrôle migration legacy/Supabase et écarts.", icon: "🔄", color: "from-purple-500 to-fuchsia-600" },
    { href: "/admin/membres/erreurs", title: "Erreurs & incohérences", description: "Détection qualité des données et anomalies.", icon: "🚨", color: "from-red-500 to-orange-600" },
    { href: "/admin/membres/reconciliation", title: "Réconciliation public → gestion", description: "Repérer les membres publics non référencés admin.", icon: "🧭", color: "from-cyan-500 to-blue-600" },
  ];

  if (loading) {
    return (
      <div className="text-white">
        <div className="flex h-64 items-center justify-center">
          <div className="h-9 w-9 animate-spin rounded-full border-b-2 border-[#9146ff]" />
        </div>
      </div>
    );
  }

  const redCritical = summary.missingDiscord + summary.missingTwitchId + syncMissingCount + dataHealth.errors;
  const qualityScore = Math.max(
    0,
    100 - (dataHealth.errors * 4 + dataHealth.warnings * 2 + syncMissingCount + dataHealth.discordMissingUsername)
  );
  const queueTotal = opsQueue.reduce((sum, item) => sum + item.count, 0);
  const generatedAtLabel = generatedAt
    ? new Date(generatedAt).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
    : "n/a";

  return (
    <div className="space-y-6 text-white">
      <AdminToastStack
        toasts={toasts}
        onClose={(id) => setToasts((prev) => prev.filter((item) => item.id !== id))}
      />
      <section className="rounded-2xl border border-[#e6c773]/25 bg-[radial-gradient(circle_at_top_left,_rgba(230,199,115,0.18),_rgba(18,18,24,0.96)_45%)] p-5 md:p-6 shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-[#e6c773]">Gestion des membres</p>
            <h1 className="mt-2 text-3xl font-bold md:text-4xl">
              Bienvenue {username} dans l&apos;espace de gestion des membres
            </h1>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button
              type="button"
              onClick={() => void loadDashboard(true)}
              disabled={refreshing}
              className="rounded-lg border border-[#e6c773]/35 px-3 py-2 text-xs font-semibold text-[#edd38d] hover:bg-[#e6c773]/10 disabled:opacity-60"
            >
              {refreshing ? "Actualisation..." : "Rafraîchir les métriques"}
            </button>
            <p className="text-xs text-gray-400">Dernière synchro: {generatedAtLabel}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Link
            href="/admin/membres/actions"
            className="rounded-lg border border-[#e6c773]/35 bg-[#e6c773]/10 px-3 py-1.5 text-xs font-semibold text-[#f0dca1] hover:bg-[#e6c773]/20"
          >
            Queue unifiée: {queueTotal}
          </Link>
          <Link
            href="/admin/membres/qualite-data"
            className="rounded-lg border border-cyan-400/35 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold text-cyan-100 hover:bg-cyan-400/20"
          >
            Qualité data: score {qualityScore}
          </Link>
          <Link
            href="/admin/membres/revues"
            className="rounded-lg border border-amber-400/35 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-100 hover:bg-amber-400/20"
          >
            Revues à planifier: {summary.reviewDue7d}
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-8">
        <div className="rounded-xl border border-white/10 bg-[#1a1a1d] p-4">
          <p className="text-xs uppercase tracking-[0.08em] text-gray-400">Membres total</p>
          <p className="mt-2 text-3xl font-bold text-white">{summary.total}</p>
          <p className="mt-1 text-xs text-gray-500">Base consolidée admin</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#1a1a1d] p-4">
          <p className="text-xs uppercase tracking-[0.08em] text-gray-400">Profils incomplets</p>
          <p className="mt-2 text-3xl font-bold text-amber-300">{summary.incomplete}</p>
          <p className="mt-1 text-xs text-gray-500">Priorité de complétion</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#1a1a1d] p-4">
          <p className="text-xs uppercase tracking-[0.08em] text-gray-400">Revues en retard</p>
          <p className="mt-2 text-3xl font-bold text-orange-300">{summary.reviewOverdue}</p>
          <p className="mt-1 text-xs text-gray-500">Revue due dépassée</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#1a1a1d] p-4">
          <p className="text-xs uppercase tracking-[0.08em] text-gray-400">Revues &lt; 7 jours</p>
          <p className="mt-2 text-3xl font-bold text-yellow-300">{summary.reviewDue7d}</p>
          <p className="mt-1 text-xs text-gray-500">Charge prévisionnelle</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#1a1a1d] p-4">
          <p className="text-xs uppercase tracking-[0.08em] text-gray-400">Validation profils</p>
          <p className="mt-2 text-3xl font-bold text-cyan-300">{ops.profileValidationPendingCount}</p>
          <p className="mt-1 text-xs text-gray-500">Demandes à traiter</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#1a1a1d] p-4">
          <p className="text-xs uppercase tracking-[0.08em] text-gray-400">Postulations staff</p>
          <p className="mt-2 text-3xl font-bold text-indigo-300">{ops.staffApplicationsPendingCount}</p>
          <p className="mt-1 text-xs text-gray-500">{ops.staffApplicationsRedFlagCount} red flag</p>
        </div>
        <div className="rounded-xl border border-cyan-500/25 bg-[#1a1a1d] p-4">
          <p className="text-xs uppercase tracking-[0.08em] text-gray-300">Score qualité data</p>
          <p className="mt-2 text-3xl font-bold text-cyan-200">{qualityScore}</p>
          <p className="mt-1 text-xs text-gray-500">
            {dataHealth.errors} erreurs, {dataHealth.warnings} alertes
          </p>
        </div>
        <div className="rounded-xl border border-red-500/30 bg-[#1a1a1d] p-4">
          <p className="text-xs uppercase tracking-[0.08em] text-gray-300">Risque données</p>
          <p className="mt-2 text-3xl font-bold text-red-300">{redCritical}</p>
          <p className="mt-1 text-xs text-gray-500">IDs manquants + sync</p>
        </div>
      </section>

      <section className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-[#17171d]/95 p-3">
        <span className="rounded-md border border-white/10 bg-black/20 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-300">
          {roleLabel || "Operations"}
        </span>
        <select
          value={selectedViewId}
          onChange={(e) => setSelectedViewId(e.target.value)}
          className="rounded-lg border border-gray-700 bg-[#0e0e10] px-3 py-2 text-sm text-white"
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
          className="rounded-lg border border-gray-700 bg-[#0e0e10] px-3 py-2 text-sm text-white"
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
          className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-gray-200 hover:bg-white/10"
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
          className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-gray-200 hover:bg-white/10"
        >
          Tri : {activeView.sortBy === "priority" ? "Priorité" : "Volume"}
        </button>
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

      <section className="rounded-2xl border border-gray-700 bg-[#1a1a1d] p-4">
        <AdminTableShell
          title="À traiter maintenant"
          subtitle="File priorisée avec SLA, responsable et accès direct"
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
                      Aucune action trouvée avec cette vue.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </AdminTableShell>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="group rounded-xl border border-gray-700 bg-[#1a1a1d] p-5 transition-all hover:-translate-y-[1px] hover:border-[#9146ff] hover:shadow-lg hover:shadow-[#9146ff]/20"
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
      </section>
    </div>
  );
}
