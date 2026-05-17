"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Users,
  Plus,
  Trash2,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  X,
  Pencil,
  Mail,
  ScrollText,
  Sparkles,
  Search,
  ArrowUpDown,
  Copy,
  RefreshCw,
  LayoutGrid,
  UserCog,
} from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { administrationSiteHubNav } from "@/lib/admin/gestionAccesNav";

interface AdminAccess {
  discordId: string;
  role: "FONDATEUR" | "ADMIN_COORDINATEUR" | "MODERATEUR" | "MODERATEUR_EN_FORMATION" | "MODERATEUR_EN_PAUSE" | "SOUTIEN_TENF";
  addedAt: string;
  addedBy: string;
  username?: string;
  adminAlias?: string;
  avatar?: string;
  addedByUsername?: string;
  memberInSupabase?: boolean;
  hasStaffNotificationEmail?: boolean;
  moderationCharterValidated?: boolean;
  moderationCharterValidatedAt?: string | null;
  moderationCharterVersion?: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  FONDATEUR: "Fondateur",
  ADMIN_COORDINATEUR: "Admin Coordinateur",
  MODERATEUR: "Modérateur",
  MODERATEUR_EN_FORMATION: "Modérateur en formation",
  MODERATEUR_EN_PAUSE: "Modérateur en pause",
  SOUTIEN_TENF: "Soutien TENF",
};

const EDITABLE_ROLES: Array<Exclude<AdminAccess["role"], "FONDATEUR">> = [
  "ADMIN_COORDINATEUR",
  "MODERATEUR",
  "MODERATEUR_EN_FORMATION",
  "MODERATEUR_EN_PAUSE",
  "SOUTIEN_TENF",
];

type SortKey = "none" | "user" | "role" | "added";

const inputClass =
  "w-full min-h-[2.75rem] rounded-xl border border-zinc-700/90 bg-zinc-900/80 px-3 py-2.5 text-[length:clamp(0.8125rem,0.75rem+0.2vw,0.875rem)] text-zinc-100 outline-none transition focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/25";

export default function GestionAccesComptesPage() {
  const [accessList, setAccessList] = useState<AdminAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isFounder, setIsFounder] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newDiscordId, setNewDiscordId] = useState("");
  const [newAdminAlias, setNewAdminAlias] = useState("");
  const [newRole, setNewRole] = useState<
    "ADMIN_COORDINATEUR" | "MODERATEUR" | "MODERATEUR_EN_FORMATION" | "MODERATEUR_EN_PAUSE" | "SOUTIEN_TENF"
  >("MODERATEUR_EN_FORMATION");
  const [searchDiscord, setSearchDiscord] = useState("");
  const [discordMembers, setDiscordMembers] = useState<Array<{ id: string; username: string; avatar: string | null }>>([]);
  const [searchingDiscord, setSearchingDiscord] = useState(false);
  const [showAccessListModal, setShowAccessListModal] = useState(false);
  const [verifyingAccess, setVerifyingAccess] = useState(false);
  const [tableSearch, setTableSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | AdminAccess["role"]>("all");
  const [aliasFilter, setAliasFilter] = useState<"all" | "with_alias" | "without_alias">("all");
  const [updatingRoleDiscordId, setUpdatingRoleDiscordId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("none");
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedDiscordId, setSelectedDiscordId] = useState<string | null>(null);
  const [tableRefreshing, setTableRefreshing] = useState(false);
  const [deleteTargetDiscordId, setDeleteTargetDiscordId] = useState<string | null>(null);
  const [aliasModal, setAliasModal] = useState<{ access: AdminAccess; value: string } | null>(null);

  useEffect(() => {
    async function checkAccess() {
      try {
        const accessResponse = await fetch("/api/admin/access");
        if (accessResponse.status === 403) {
          window.location.href = "/unauthorized";
          return;
        }
        if (!accessResponse.ok) throw new Error("Erreur lors de la vérification");
        setIsFounder(true);
      } catch (err) {
        console.error("Error checking access:", err);
        setError("Erreur lors de la vérification des permissions");
        window.location.href = "/unauthorized";
      }
    }
    checkAccess();
  }, []);

  const loadAccessList = useCallback(async (soft = false) => {
    try {
      if (!soft) setLoading(true);
      setError(null);
      const response = await fetch("/api/admin/access", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (!response.ok) {
        if (response.status === 403) {
          setError("Accès refusé. Seuls les fondateurs peuvent accéder à cette page.");
          window.location.href = "/unauthorized";
          return;
        }
        throw new Error("Erreur lors du chargement");
      }
      const data = await response.json();
      setAccessList(data.accessList || []);
    } catch (err) {
      console.error("Error loading access list:", err);
      setError("Erreur lors du chargement de la liste des accès");
    } finally {
      if (!soft) setLoading(false);
    }
  }, []);

  const refreshTable = useCallback(async () => {
    try {
      setTableRefreshing(true);
      await loadAccessList(true);
    } finally {
      setTableRefreshing(false);
    }
  }, [loadAccessList]);

  useEffect(() => {
    if (!isFounder) return;
    void loadAccessList();
  }, [isFounder, loadAccessList]);

  async function handleSearchDiscord() {
    if (!searchDiscord.trim()) return;
    try {
      setSearchingDiscord(true);
      setError(null);
      const response = await fetch("/api/discord/members", { cache: "no-store" });
      if (!response.ok) throw new Error("Erreur lors de la recherche");
      const data = await response.json();
      const searchTerm = searchDiscord.toLowerCase().trim();
      const matches = (data.members || [])
        .filter((member: { discordUsername?: string; discordNickname?: string; discordId?: string }) => {
          const username = (member.discordUsername || "").toLowerCase();
          const nickname = (member.discordNickname || "").toLowerCase();
          const id = member.discordId || "";
          return username.includes(searchTerm) || nickname.includes(searchTerm) || id.includes(searchTerm);
        })
        .slice(0, 10)
        .map((member: { discordId: string; discordNickname?: string; discordUsername?: string; avatar?: string | null }) => ({
          id: member.discordId,
          username: member.discordNickname || member.discordUsername || "Inconnu",
          avatar: member.avatar || null,
        }));
      setDiscordMembers(matches);
      if (matches.length === 0) setError("Aucun membre Discord trouvé");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de la recherche";
      setError(msg);
    } finally {
      setSearchingDiscord(false);
    }
  }

  async function handleAddAccess() {
    if (!newDiscordId.trim()) {
      setError("L'ID Discord est requis");
      return;
    }
    try {
      setError(null);
      const response = await fetch("/api/admin/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discordId: newDiscordId.trim(),
          role: newRole,
          adminAlias: newAdminAlias.trim(),
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de l'ajout");
      }
      await loadAccessList();
      setNewDiscordId("");
      setNewAdminAlias("");
      setIsAdding(false);
      setSuccess("Accès ajouté avec succès !");
      setError(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de l'ajout de l'accès";
      setError(msg);
      setSuccess(null);
    }
  }

  async function handleVerifyAccess() {
    try {
      setVerifyingAccess(true);
      setError(null);
      await loadAccessList();
      setShowAccessListModal(true);
    } catch (err) {
      console.error("Error verifying access:", err);
      setError("Impossible de charger la liste des accès");
    } finally {
      setVerifyingAccess(false);
    }
  }

  async function confirmDeleteAccess(discordId: string) {
    try {
      setError(null);
      const response = await fetch(`/api/admin/access?discordId=${encodeURIComponent(discordId)}`, { method: "DELETE" });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la suppression");
      }
      await loadAccessList();
      setSuccess("Accès supprimé avec succès !");
      setError(null);
      setSelectedDiscordId((id) => (id === discordId ? null : id));
      setDeleteTargetDiscordId(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de la suppression de l'accès";
      setError(msg);
      setSuccess(null);
    }
  }

  async function handleUpdateRole(access: AdminAccess, newRole: AdminAccess["role"]) {
    if (newRole === access.role) return;
    if (access.role === "FONDATEUR" || newRole === "FONDATEUR") return;
    try {
      setUpdatingRoleDiscordId(access.discordId);
      setError(null);
      const response = await fetch("/api/admin/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discordId: access.discordId, role: newRole }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error((errorData as { error?: string }).error || "Erreur lors de la mise à jour du rôle");
      }
      await loadAccessList();
      setSuccess("Rôle mis à jour.");
      setError(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de la mise à jour du rôle";
      setError(msg);
      setSuccess(null);
      await loadAccessList();
    } finally {
      setUpdatingRoleDiscordId(null);
    }
  }

  async function submitAliasModal() {
    if (!aliasModal) return;
    const nextAlias = aliasModal.value;
    const access = aliasModal.access;
    try {
      setError(null);
      const response = await fetch("/api/admin/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discordId: access.discordId,
          role: access.role,
          adminAlias: nextAlias.trim(),
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la mise à jour du pseudo admin");
      }
      await loadAccessList();
      setSuccess("Pseudo admin mis à jour avec succès !");
      setError(null);
      setAliasModal(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de la mise à jour du pseudo admin";
      setError(msg);
      setSuccess(null);
    }
  }

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "FONDATEUR":
        return "role-badge role-badge--staff-founder role-badge--animated role-badge--shimmer";
      case "ADMIN_COORDINATEUR":
        return "role-badge role-badge--staff-coordinator role-badge--animated role-badge--shimmer";
      case "MODERATEUR":
        return "role-badge role-badge--staff-moderator role-badge--animated role-badge--shimmer";
      case "MODERATEUR_EN_FORMATION":
        return "role-badge role-badge--staff-trainee role-badge--animated role-badge--shimmer";
      case "MODERATEUR_EN_PAUSE":
        return "role-badge role-badge--staff-paused role-badge--animated role-badge--shimmer";
      case "SOUTIEN_TENF":
        return "role-badge role-badge--active-support role-badge--animated role-badge--shimmer";
      default:
        return "role-badge role-badge--default";
    }
  };

  const accessMetrics = useMemo(() => {
    const founderCount = accessList.filter((entry) => entry.role === "FONDATEUR").length;
    const lockedCount = accessList.filter(
      (entry) => entry.role === "FONDATEUR" || (entry.addedBy === "system" && new Date(entry.addedAt).getTime() === 0)
    ).length;
    const aliasCount = accessList.filter((entry) => String(entry.adminAlias || "").trim().length > 0).length;
    const noAliasCount = accessList.length - aliasCount;
    const noAvatarCount = accessList.filter((entry) => !entry.avatar).length;
    const staffEmailCount = accessList.filter((entry) => entry.hasStaffNotificationEmail === true).length;
    const charterOkCount = accessList.filter((entry) => entry.moderationCharterValidated === true).length;
    const noSupabaseMemberCount = accessList.filter((entry) => entry.memberInSupabase === false).length;
    return {
      total: accessList.length,
      founderCount,
      lockedCount,
      aliasCount,
      noAliasCount,
      noAvatarCount,
      staffEmailCount,
      charterOkCount,
      noSupabaseMemberCount,
    };
  }, [accessList]);

  const filteredAccessList = useMemo(() => {
    const query = tableSearch.trim().toLowerCase();
    return accessList.filter((entry) => {
      if (roleFilter !== "all" && entry.role !== roleFilter) return false;
      if (aliasFilter === "with_alias" && !String(entry.adminAlias || "").trim()) return false;
      if (aliasFilter === "without_alias" && String(entry.adminAlias || "").trim()) return false;
      if (!query) return true;
      return (
        String(entry.username || "").toLowerCase().includes(query) ||
        String(entry.discordId || "").toLowerCase().includes(query) ||
        String(entry.adminAlias || "").toLowerCase().includes(query) ||
        String(ROLE_LABELS[entry.role] || entry.role).toLowerCase().includes(query)
      );
    });
  }, [accessList, aliasFilter, roleFilter, tableSearch]);

  const sortedFilteredList = useMemo(() => {
    const list = [...filteredAccessList];
    if (sortKey === "none") return list;
    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "user") {
        cmp = (a.username || a.discordId).localeCompare(b.username || b.discordId, "fr", { sensitivity: "base" });
      } else if (sortKey === "role") {
        cmp = a.role.localeCompare(b.role);
      } else if (sortKey === "added") {
        cmp = new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
      }
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [filteredAccessList, sortKey, sortAsc]);

  const cycleSort = (key: Exclude<SortKey, "none">) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortAsc(true);
      return;
    }
    if (sortAsc) {
      setSortAsc(false);
    } else {
      setSortKey("none");
      setSortAsc(true);
    }
  };

  const copyDiscordId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setSuccess("ID Discord copié");
      setTimeout(() => setSuccess(null), 2000);
    } catch {
      setError("Impossible de copier dans le presse-papiers");
    }
  };

  const metricCards = useMemo(
    () => [
      { key: "total", label: "Comptes autorisés", value: accessMetrics.total, accent: "text-zinc-50", sub: "Total liste" },
      { key: "founders", label: "Fondateurs", value: accessMetrics.founderCount, accent: "text-violet-200" },
      { key: "locked", label: "Comptes verrouillés", value: accessMetrics.lockedCount, accent: "text-amber-200" },
      { key: "alias", label: "Pseudo admin défini", value: accessMetrics.aliasCount, accent: "text-emerald-200" },
      { key: "noav", label: "Sans avatar", value: accessMetrics.noAvatarCount, accent: "text-rose-200" },
      { key: "mail", label: "E-mail staff", value: accessMetrics.staffEmailCount, accent: "text-cyan-200" },
      { key: "charte", label: "Charte validée", value: accessMetrics.charterOkCount, accent: "text-teal-200" },
      { key: "nosb", label: "Sans fiche Supabase", value: accessMetrics.noSupabaseMemberCount, accent: "text-orange-200" },
    ],
    [accessMetrics]
  );

  if (loading && !isFounder) {
    return (
      <div
        className="relative flex min-h-screen items-center justify-center overflow-hidden"
        style={{ backgroundColor: "var(--color-bg)" }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.12),transparent_55%)]" />
        <div className="relative text-center">
          <div className="relative mx-auto mb-5 h-14 w-14">
            <div className="absolute inset-0 animate-ping rounded-full bg-violet-500/20" />
            <div className="relative h-14 w-14 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-400" />
          </div>
          <p className="text-[length:clamp(0.8125rem,0.75rem+0.35vw,0.9375rem)] font-medium text-zinc-400">
            Vérification des permissions…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-[calc(100dvh-4rem)] w-full min-w-0 overflow-x-hidden pb-[clamp(1.5rem,4vw,2.5rem)]"
      style={{ backgroundColor: "var(--color-bg)" }}
    >
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_100%_45%_at_50%_-8%,rgba(124,58,237,0.12),transparent)]" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(9,9,11,0.55))]" />

      <AdminHeader title="Comptes administrateurs" navLinks={administrationSiteHubNav("/admin/gestion-acces/comptes")} />

      <div className="relative z-[1] mx-auto w-full max-w-[min(100%,1680px)] px-[clamp(0.75rem,2.5vw,1.75rem)] py-[clamp(0.75rem,2vw,1.5rem)]">
        {error && (
          <div
            className="animate-fade-in mb-[clamp(0.75rem,2vw,1.25rem)] flex items-start gap-3 rounded-2xl border border-red-500/40 bg-red-950/35 p-[clamp(0.75rem,2vw,1rem)] shadow-lg shadow-red-950/25 backdrop-blur-md"
            role="alert"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
            <p className="min-w-0 flex-1 text-[length:clamp(0.8125rem,0.75rem+0.25vw,0.875rem)] leading-relaxed text-zinc-100">
              {error}
            </p>
            <button
              type="button"
              className="shrink-0 rounded-lg p-1.5 text-red-400 transition hover:bg-red-950/60 hover:text-red-200"
              onClick={() => setError(null)}
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        {success && (
          <div
            className="animate-fade-in mb-[clamp(0.75rem,2vw,1.25rem)] flex items-start gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-950/30 p-[clamp(0.75rem,2vw,1rem)] shadow-lg shadow-emerald-950/25 backdrop-blur-md"
            role="status"
          >
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
            <p className="min-w-0 flex-1 text-[length:clamp(0.8125rem,0.75rem+0.25vw,0.875rem)] text-zinc-100">{success}</p>
            <button
              type="button"
              className="shrink-0 rounded-lg p-1.5 text-emerald-400 transition hover:bg-emerald-950/50 hover:text-emerald-200"
              onClick={() => setSuccess(null)}
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Hero */}
        <header className="mb-[clamp(1rem,2.5vw,1.75rem)] overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-950/40 via-zinc-950/80 to-zinc-950/90 p-[clamp(1rem,2.5vw,1.5rem)] shadow-2xl shadow-violet-950/20 ring-1 ring-violet-500/10 backdrop-blur-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-950/35 px-3 py-1 text-[length:clamp(0.625rem,0.55rem+0.2vw,0.6875rem)] font-bold uppercase tracking-widest text-violet-200/90">
                <Sparkles className="h-3.5 w-3.5 text-violet-400" aria-hidden />
                Administration du site
              </div>
              <h1 className="bg-gradient-to-r from-zinc-50 via-zinc-200 to-violet-200 bg-clip-text text-[length:clamp(1.375rem,1.1rem+1.2vw,2rem)] font-bold tracking-tight text-transparent">
                Comptes administrateurs
              </h1>
              <p className="mt-2 max-w-3xl text-[length:clamp(0.8125rem,0.75rem+0.25vw,1rem)] leading-relaxed text-zinc-400">
                Rôles, pseudos admin, e-mail staff et validation charte (Mon compte / charte modération). Les métriques se mettent à jour
                avec la liste.
              </p>
            </div>
            <button
              type="button"
              onClick={handleVerifyAccess}
              disabled={verifyingAccess || loading}
              className="inline-flex min-h-[2.75rem] shrink-0 items-center justify-center gap-2 rounded-xl border border-violet-500/40 bg-violet-950/50 px-5 text-[length:clamp(0.8125rem,0.75rem+0.2vw,0.875rem)] font-bold text-violet-100 shadow-md shadow-violet-950/30 transition hover:bg-violet-900/60 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
              {verifyingAccess ? "Vérification…" : "Vérifier les accès"}
            </button>
          </div>
          <div className="mt-[clamp(1rem,2.5vw,1.35rem)] grid grid-cols-2 gap-[clamp(0.5rem,1.5vw,0.75rem)] sm:grid-cols-3 xl:grid-cols-4">
            {metricCards.map((m) => (
              <article
                key={m.key}
                className="group rounded-xl border border-zinc-800/90 bg-zinc-900/40 p-[clamp(0.65rem,1.5vw,1rem)] shadow-inner shadow-black/20 transition hover:border-violet-500/35 hover:bg-violet-950/15 hover:shadow-lg hover:shadow-violet-950/10"
              >
                <p className="text-[length:clamp(0.625rem,0.55rem+0.15vw,0.6875rem)] font-bold uppercase tracking-wide text-zinc-500">
                  {m.label}
                </p>
                <p className={`mt-1 font-mono text-[length:clamp(1.5rem,1.2rem+1vw,2rem)] font-bold tabular-nums ${m.accent}`}>
                  {m.value}
                </p>
              </article>
            ))}
          </div>
        </header>

        {/* Ajout */}
        <section className="mb-[clamp(1rem,2.5vw,1.75rem)] overflow-hidden rounded-2xl border border-zinc-800/90 bg-zinc-950/50 shadow-xl shadow-black/30 backdrop-blur-sm">
          <div className="flex flex-col gap-3 border-b border-zinc-800/80 bg-gradient-to-r from-zinc-900/90 via-violet-950/25 to-zinc-900/90 p-[clamp(1rem,2.5vw,1.35rem)] sm:flex-row sm:items-center sm:justify-between">
            <h2 className="flex items-center gap-2 text-[length:clamp(1rem,0.9rem+0.35vw,1.125rem)] font-bold text-zinc-50">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-950/40 text-violet-300">
                <Plus className="h-5 w-5" aria-hidden />
              </span>
              Ajouter un accès
            </h2>
            <button
              type="button"
              onClick={() => setIsAdding(!isAdding)}
              className="inline-flex min-h-[2.75rem] shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 text-[length:clamp(0.8125rem,0.75rem+0.2vw,0.875rem)] font-bold text-white shadow-md shadow-violet-950/35 transition hover:brightness-110 active:scale-[0.98]"
            >
              {isAdding ? "Fermer le formulaire" : "Nouveau"}
            </button>
          </div>
          {isAdding && (
            <div className="space-y-[clamp(1rem,2.5vw,1.25rem)] p-[clamp(1rem,2.5vw,1.35rem)]">
              <div>
                <label className="mb-2 flex items-center gap-2 text-[length:clamp(0.75rem,0.7rem+0.2vw,0.8125rem)] font-semibold text-zinc-200">
                  <Search className="h-4 w-4 text-violet-400" aria-hidden />
                  Rechercher un membre Discord (optionnel)
                </label>
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    value={searchDiscord}
                    onChange={(e) => setSearchDiscord(e.target.value)}
                    placeholder="Pseudo, surnom ou ID…"
                    className={`${inputClass} min-w-0 flex-1`}
                    onKeyDown={(e) => e.key === "Enter" && handleSearchDiscord()}
                  />
                  <button
                    type="button"
                    onClick={handleSearchDiscord}
                    disabled={searchingDiscord || !searchDiscord.trim()}
                    className="inline-flex min-h-[2.75rem] shrink-0 items-center justify-center rounded-xl border border-violet-600/50 bg-violet-950/50 px-5 text-[length:clamp(0.8125rem,0.75rem+0.2vw,0.875rem)] font-bold text-violet-100 transition hover:bg-violet-900/60 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {searchingDiscord ? "…" : "Rechercher"}
                  </button>
                </div>
                {discordMembers.length > 0 && (
                  <div className="mt-3 max-h-[min(40vh,16rem)] space-y-2 overflow-y-auto rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-2">
                    {discordMembers.map((member) => (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => {
                          setNewDiscordId(member.id);
                          setDiscordMembers([]);
                          setSearchDiscord("");
                        }}
                        className="flex w-full min-w-0 items-center gap-3 rounded-xl border border-transparent p-2.5 text-left transition hover:border-violet-500/30 hover:bg-violet-950/25 active:scale-[0.99]"
                      >
                        {member.avatar ? (
                          <img src={member.avatar} alt="" className="h-9 w-9 shrink-0 rounded-full ring-2 ring-zinc-700/80" />
                        ) : (
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-700 to-fuchsia-800 text-sm font-bold text-white">
                            {member.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-semibold text-zinc-100">{member.username}</div>
                          <div className="truncate font-mono text-[length:clamp(0.6875rem,0.65rem+0.15vw,0.75rem)] text-zinc-500">
                            {member.id}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="mb-2 block text-[length:clamp(0.75rem,0.7rem+0.2vw,0.8125rem)] font-semibold text-zinc-200">
                  ID Discord
                </label>
                <input
                  type="text"
                  value={newDiscordId}
                  onChange={(e) => setNewDiscordId(e.target.value)}
                  placeholder="123456789012345678"
                  className={`${inputClass} font-mono`}
                />
              </div>
              <div>
                <label className="mb-2 block text-[length:clamp(0.75rem,0.7rem+0.2vw,0.8125rem)] font-semibold text-zinc-200">Rôle</label>
                <select
                  value={newRole}
                  onChange={(e) =>
                    setNewRole(
                      e.target.value as
                        | "ADMIN_COORDINATEUR"
                        | "MODERATEUR"
                        | "MODERATEUR_EN_FORMATION"
                        | "MODERATEUR_EN_PAUSE"
                        | "SOUTIEN_TENF"
                    )
                  }
                  className={inputClass}
                >
                  <option value="ADMIN_COORDINATEUR">Admin Coordinateur</option>
                  <option value="MODERATEUR">Modérateur</option>
                  <option value="MODERATEUR_EN_FORMATION">Modérateur en formation</option>
                  <option value="MODERATEUR_EN_PAUSE">Modérateur en pause</option>
                  <option value="SOUTIEN_TENF">Soutien TENF</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-[length:clamp(0.75rem,0.7rem+0.2vw,0.8125rem)] font-semibold text-zinc-200">
                  Pseudo admin (optionnel)
                </label>
                <input
                  type="text"
                  value={newAdminAlias}
                  onChange={(e) => setNewAdminAlias(e.target.value)}
                  placeholder="Ex. Modo Luna"
                  maxLength={40}
                  className={inputClass}
                />
              </div>
              <button
                type="button"
                onClick={handleAddAccess}
                className="flex w-full min-h-[3rem] items-center justify-center rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-[length:clamp(0.875rem,0.8rem+0.25vw,0.9375rem)] font-bold text-white shadow-lg shadow-emerald-950/30 transition hover:brightness-110 active:scale-[0.99]"
              >
                Ajouter l&apos;accès
              </button>
            </div>
          )}
        </section>

        {/* Tableau */}
        <section className="overflow-hidden rounded-2xl border border-zinc-800/90 bg-zinc-950/45 shadow-2xl shadow-black/35 backdrop-blur-sm">
          <div className="flex flex-col gap-4 border-b border-zinc-800/80 bg-zinc-900/40 p-[clamp(0.85rem,2.2vw,1.15rem)] lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-700/80 bg-zinc-950/80 text-violet-400">
                <Users className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <h2 className="text-[length:clamp(1rem,0.9rem+0.35vw,1.125rem)] font-bold text-zinc-50">Membres autorisés</h2>
                <p className="text-[length:clamp(0.6875rem,0.65rem+0.15vw,0.75rem)] font-medium uppercase tracking-wide text-zinc-500">
                  {filteredAccessList.length} / {accessList.length} visibles
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void refreshTable()}
                disabled={tableRefreshing || loading}
                className="inline-flex min-h-[2.5rem] items-center gap-1.5 rounded-xl border border-zinc-600/80 bg-zinc-900/70 px-3 py-2 text-[length:clamp(0.75rem,0.7rem+0.2vw,0.8125rem)] font-semibold text-zinc-200 transition hover:border-violet-500/40 hover:bg-zinc-800 disabled:opacity-45"
                title="Recharger la liste"
              >
                <RefreshCw className={`h-4 w-4 shrink-0 ${tableRefreshing ? "animate-spin" : ""}`} aria-hidden />
                Rafraîchir
              </button>
            </div>
          </div>

          <div className="border-b border-zinc-800/60 px-[clamp(0.75rem,2vw,1rem)] py-3">
            <p className="mb-3 text-[length:clamp(0.6875rem,0.65rem+0.15vw,0.75rem)] leading-relaxed text-zinc-500">
              Colonnes <span className="font-semibold text-zinc-300">E-mail staff</span> et{" "}
              <span className="font-semibold text-zinc-300">Charte</span> : Mon compte (Supabase) et validations TENF.{" "}
              {accessMetrics.noAliasCount} sans alias, {accessMetrics.noAvatarCount} sans avatar.
            </p>
            <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
              <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" aria-hidden />
                  <input
                    type="search"
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    placeholder="Rechercher pseudo, alias, ID…"
                    className={`${inputClass} pl-10`}
                    aria-label="Filtrer le tableau"
                  />
                </div>
                <select
                  value={aliasFilter}
                  onChange={(e) => setAliasFilter(e.target.value as "all" | "with_alias" | "without_alias")}
                  className={`${inputClass} sm:max-w-[11rem]`}
                  aria-label="Filtre alias"
                >
                  <option value="all">Alias : tous</option>
                  <option value="with_alias">Alias : définis</option>
                  <option value="without_alias">Alias : manquants</option>
                </select>
              </div>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrer par rôle">
                <button
                  type="button"
                  onClick={() => setRoleFilter("all")}
                  className={`rounded-full border px-3 py-1.5 text-[length:clamp(0.6875rem,0.62rem+0.15vw,0.75rem)] font-semibold transition active:scale-[0.98] ${
                    roleFilter === "all"
                      ? "border-violet-500/50 bg-violet-950/50 text-violet-100"
                      : "border-zinc-700/80 bg-zinc-900/50 text-zinc-400 hover:border-zinc-600"
                  }`}
                >
                  Tous
                </button>
                {(Object.keys(ROLE_LABELS) as AdminAccess["role"][]).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setRoleFilter(role)}
                    className={`max-w-[10rem] truncate rounded-full border px-3 py-1.5 text-[length:clamp(0.6875rem,0.62rem+0.15vw,0.75rem)] font-semibold transition active:scale-[0.98] ${
                      roleFilter === role
                        ? "border-violet-500/50 bg-violet-950/50 text-violet-100"
                        : "border-zinc-700/80 bg-zinc-900/50 text-zinc-400 hover:border-zinc-600"
                    }`}
                  >
                    {ROLE_LABELS[role]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3 p-[clamp(1rem,2.5vw,1.5rem)]">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-xl bg-zinc-900/60"
                  style={{ animationDelay: `${i * 60}ms` }}
                />
              ))}
            </div>
          ) : sortedFilteredList.length === 0 ? (
            <div className="border-t border-dashed border-zinc-800/80 p-[clamp(2rem,5vw,3rem)] text-center">
              <LayoutGrid className="mx-auto mb-3 h-10 w-10 text-zinc-600" aria-hidden />
              <p className="text-[length:clamp(0.875rem,0.8rem+0.25vw,0.9375rem)] font-medium text-zinc-300">
                Aucun accès ne correspond aux filtres
              </p>
              <p className="mt-1 text-[length:clamp(0.75rem,0.7rem+0.2vw,0.8125rem)] text-zinc-500">
                Réinitialise la recherche ou les chips de rôle.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[72rem] border-collapse text-left">
                <thead>
                  <tr className="border-b border-zinc-800/90 bg-zinc-900/60">
                    <th className="sticky left-0 z-[2] bg-zinc-900/95 px-[clamp(0.65rem,1.8vw,1rem)] py-3 backdrop-blur-sm">
                      <button
                        type="button"
                        onClick={() => cycleSort("user")}
                        className="inline-flex items-center gap-1 text-[length:clamp(0.6875rem,0.65rem+0.15vw,0.75rem)] font-bold uppercase tracking-wider text-zinc-500 transition hover:text-violet-300"
                      >
                        Utilisateur
                        <ArrowUpDown
                          className={`h-3.5 w-3.5 ${sortKey === "user" ? "text-violet-400" : "opacity-40"}`}
                          aria-hidden
                        />
                      </button>
                    </th>
                    <th className="px-[clamp(0.65rem,1.8vw,1rem)] py-3">
                      <button
                        type="button"
                        onClick={() => cycleSort("role")}
                        className="inline-flex items-center gap-1 text-[length:clamp(0.6875rem,0.65rem+0.15vw,0.75rem)] font-bold uppercase tracking-wider text-zinc-500 transition hover:text-violet-300"
                      >
                        Rôle
                        <ArrowUpDown
                          className={`h-3.5 w-3.5 ${sortKey === "role" ? "text-violet-400" : "opacity-40"}`}
                          aria-hidden
                        />
                      </button>
                    </th>
                    <th className="px-[clamp(0.65rem,1.8vw,1rem)] py-3 text-center text-[length:clamp(0.6875rem,0.65rem+0.15vw,0.75rem)] font-bold uppercase tracking-wider text-zinc-500">
                      <span className="inline-flex items-center justify-center gap-1" title="E-mail notifications staff">
                        <Mail className="h-3.5 w-3.5 opacity-80" aria-hidden />
                        E-mail
                      </span>
                    </th>
                    <th className="px-[clamp(0.65rem,1.8vw,1rem)] py-3 text-center text-[length:clamp(0.6875rem,0.65rem+0.15vw,0.75rem)] font-bold uppercase tracking-wider text-zinc-500">
                      <span className="inline-flex items-center justify-center gap-1" title="Charte modération">
                        <ScrollText className="h-3.5 w-3.5 opacity-80" aria-hidden />
                        Charte
                      </span>
                    </th>
                    <th className="px-[clamp(0.65rem,1.8vw,1rem)] py-3">
                      <button
                        type="button"
                        onClick={() => cycleSort("added")}
                        className="inline-flex items-center gap-1 text-[length:clamp(0.6875rem,0.65rem+0.15vw,0.75rem)] font-bold uppercase tracking-wider text-zinc-500 transition hover:text-violet-300"
                      >
                        Ajouté le
                        <ArrowUpDown
                          className={`h-3.5 w-3.5 ${sortKey === "added" ? "text-violet-400" : "opacity-40"}`}
                          aria-hidden
                        />
                      </button>
                    </th>
                    <th className="px-[clamp(0.65rem,1.8vw,1rem)] py-3 text-[length:clamp(0.6875rem,0.65rem+0.15vw,0.75rem)] font-bold uppercase tracking-wider text-zinc-500">
                      Ajouté par
                    </th>
                    <th className="sticky right-0 z-[2] bg-zinc-900/95 px-[clamp(0.65rem,1.8vw,1rem)] py-3 text-right text-[length:clamp(0.6875rem,0.65rem+0.15vw,0.75rem)] font-bold uppercase tracking-wider text-zinc-500 backdrop-blur-sm">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedFilteredList.map((access) => {
                    const selected = selectedDiscordId === access.discordId;
                    return (
                      <tr
                        key={access.discordId}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedDiscordId((id) => (id === access.discordId ? null : access.discordId))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedDiscordId((id) => (id === access.discordId ? null : access.discordId));
                          }
                        }}
                        className={`group cursor-pointer border-b border-zinc-800/60 transition-colors hover:bg-violet-950/10 ${
                          selected ? "bg-violet-950/20 ring-1 ring-inset ring-violet-500/25" : ""
                        }`}
                      >
                        <td className="sticky left-0 z-[1] bg-zinc-950/80 px-[clamp(0.65rem,1.8vw,1rem)] py-[clamp(0.65rem,1.5vw,1rem)] align-middle backdrop-blur-sm">
                          <div className="flex items-center gap-3">
                            {access.avatar ? (
                              <img
                                src={access.avatar}
                                alt=""
                                className="h-11 w-11 shrink-0 rounded-full ring-2 ring-zinc-700/80 transition group-hover:ring-violet-500/30"
                              />
                            ) : (
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-700 text-sm font-bold text-white">
                                {(access.username || "U").charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="truncate font-semibold text-zinc-100">{access.username || "Inconnu"}</div>
                              {access.adminAlias ? (
                                <div className="truncate text-[length:clamp(0.6875rem,0.65rem+0.15vw,0.75rem)] font-medium text-violet-300/90">
                                  {access.adminAlias}
                                </div>
                              ) : null}
                              <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                                <span className="font-mono text-[length:clamp(0.6875rem,0.65rem+0.15vw,0.75rem)] text-zinc-500">
                                  {access.discordId}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void copyDiscordId(access.discordId);
                                  }}
                                  className="inline-flex shrink-0 items-center gap-0.5 rounded-md border border-zinc-700/80 bg-zinc-900/80 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-400 transition hover:border-violet-500/40 hover:text-violet-200"
                                  title="Copier l’ID Discord"
                                >
                                  <Copy className="h-3 w-3" aria-hidden />
                                  Copier
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td
                          className="px-[clamp(0.65rem,1.8vw,1rem)] py-[clamp(0.65rem,1.5vw,1rem)] align-middle"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {access.role === "FONDATEUR" ? (
                            <span className={getRoleBadgeClass(access.role)}>{ROLE_LABELS[access.role] || access.role}</span>
                          ) : (
                            <select
                              value={access.role}
                              disabled={updatingRoleDiscordId === access.discordId || loading}
                              onChange={(e) => {
                                const next = e.target.value as AdminAccess["role"];
                                void handleUpdateRole(access, next);
                              }}
                              className="max-w-[min(100%,16rem)] cursor-pointer rounded-xl border border-zinc-700/90 bg-zinc-900/90 px-2.5 py-2 text-[length:clamp(0.75rem,0.7rem+0.2vw,0.8125rem)] text-zinc-100 outline-none transition focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50"
                              aria-label={`Changer le rôle de ${access.username || access.discordId}`}
                            >
                              {EDITABLE_ROLES.map((r) => (
                                <option key={r} value={r}>
                                  {ROLE_LABELS[r]}
                                </option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td className="px-[clamp(0.65rem,1.8vw,1rem)] py-[clamp(0.65rem,1.5vw,1rem)] text-center align-middle">
                          {access.memberInSupabase === false ? (
                            <span className="text-[length:clamp(0.6875rem,0.65rem+0.15vw,0.75rem)] text-amber-400/95" title="Pas de fiche members">
                              Pas de fiche
                            </span>
                          ) : access.hasStaffNotificationEmail ? (
                            <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-400" aria-label="E-mail staff renseigné" />
                          ) : (
                            <span className="text-[length:clamp(0.6875rem,0.65rem+0.15vw,0.75rem)] text-zinc-500">Non</span>
                          )}
                        </td>
                        <td className="px-[clamp(0.65rem,1.8vw,1rem)] py-[clamp(0.65rem,1.5vw,1rem)] text-center align-middle">
                          {access.moderationCharterValidated ? (
                            <span
                              className="inline-flex flex-col items-center gap-0.5"
                              title={
                                access.moderationCharterValidatedAt
                                  ? `Validée le ${new Date(access.moderationCharterValidatedAt).toLocaleString("fr-FR")}${access.moderationCharterVersion ? ` · ${access.moderationCharterVersion}` : ""}`
                                  : "Charte validée"
                              }
                            >
                              <CheckCircle2 className="mx-auto h-5 w-5 text-teal-400" aria-label="Charte validée" />
                              {access.moderationCharterValidatedAt ? (
                                <span className="max-w-[5.5rem] truncate text-[10px] text-zinc-500">
                                  {new Date(access.moderationCharterValidatedAt).toLocaleDateString("fr-FR")}
                                </span>
                              ) : null}
                            </span>
                          ) : (
                            <span className="text-[length:clamp(0.6875rem,0.65rem+0.15vw,0.75rem)] text-zinc-500">Non</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-[clamp(0.65rem,1.8vw,1rem)] py-[clamp(0.65rem,1.5vw,1rem)] align-middle text-[length:clamp(0.75rem,0.7rem+0.2vw,0.8125rem)] text-zinc-400">
                          {access.addedAt && new Date(access.addedAt).getTime() > 0
                            ? new Date(access.addedAt).toLocaleDateString("fr-FR", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : "Initial"}
                        </td>
                        <td className="max-w-[10rem] px-[clamp(0.65rem,1.8vw,1rem)] py-[clamp(0.65rem,1.5vw,1rem)] align-middle text-[length:clamp(0.75rem,0.7rem+0.2vw,0.8125rem)] text-zinc-400">
                          {access.addedBy === "system" ? (
                            "Système"
                          ) : (
                            <div className="min-w-0">
                              <div className="truncate font-medium text-zinc-300">{access.addedByUsername || "Inconnu"}</div>
                              <div className="truncate font-mono text-[10px] text-zinc-600">{access.addedBy}</div>
                            </div>
                          )}
                        </td>
                        <td
                          className="sticky right-0 z-[1] bg-zinc-950/80 px-[clamp(0.65rem,1.8vw,1rem)] py-[clamp(0.65rem,1.5vw,1rem)] text-right align-middle backdrop-blur-sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setAliasModal({
                                  access,
                                  value: access.adminAlias || "",
                                })
                              }
                              className="inline-flex min-h-[2.5rem] items-center gap-1.5 rounded-xl border border-zinc-600/80 bg-zinc-900/70 px-3 py-2 text-[length:clamp(0.75rem,0.7rem+0.2vw,0.8125rem)] font-semibold text-zinc-200 transition hover:border-violet-500/40 hover:bg-zinc-800 active:scale-[0.98]"
                              title="Modifier le pseudo admin"
                            >
                              <Pencil className="h-4 w-4 shrink-0" aria-hidden />
                              Pseudo
                            </button>
                            {access.role === "FONDATEUR" ||
                            (access.addedBy === "system" && new Date(access.addedAt).getTime() === 0) ? (
                              <span className="max-w-[6rem] text-[length:clamp(0.625rem,0.58rem+0.12vw,0.6875rem)] italic text-zinc-500">
                                Verrouillé
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setDeleteTargetDiscordId(access.discordId)}
                                className="inline-flex min-h-[2.5rem] items-center gap-1.5 rounded-xl border border-red-500/35 bg-red-950/25 px-3 py-2 text-[length:clamp(0.75rem,0.7rem+0.2vw,0.8125rem)] font-semibold text-red-300 transition hover:bg-red-950/40 active:scale-[0.98]"
                                title="Supprimer l’accès"
                              >
                                <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
                                Supprimer
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Modal vérification */}
        {showAccessListModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-[clamp(0.75rem,3vw,1.5rem)] backdrop-blur-sm"
            style={{ backgroundColor: "rgba(0,0,0,0.65)" }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="verify-modal-title"
            onClick={() => setShowAccessListModal(false)}
          >
            <div
              className="flex max-h-[min(90dvh,720px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-zinc-700/80 bg-zinc-950/95 shadow-2xl shadow-violet-950/30 ring-1 ring-violet-500/15"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3 border-b border-zinc-800/80 p-[clamp(1rem,2.5vw,1.25rem)]">
                <div className="min-w-0">
                  <h3 id="verify-modal-title" className="flex items-center gap-2 text-lg font-bold text-zinc-50">
                    <UserCog className="h-5 w-5 shrink-0 text-violet-400" aria-hidden />
                    Personnes autorisées
                  </h3>
                  <p className="mt-1 text-sm text-zinc-400">
                    Liste synchronisée avec la page Comptes administrateurs ({accessList.length} entrée
                    {accessList.length !== 1 ? "s" : ""}).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAccessListModal(false)}
                  className="shrink-0 rounded-xl border border-zinc-700/80 p-2 text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-100"
                  aria-label="Fermer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-[clamp(0.75rem,2vw,1rem)]">
                <ul className="space-y-2">
                  {accessList.map((access) => (
                    <li
                      key={access.discordId}
                      className="flex items-center gap-3 rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3 transition hover:border-violet-500/25 hover:bg-violet-950/10"
                    >
                      {access.avatar ? (
                        <img src={access.avatar} alt="" className="h-10 w-10 shrink-0 rounded-full ring-2 ring-zinc-700/80" />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-700 text-sm font-bold text-white">
                          {(access.username || "U").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold text-zinc-100">{access.username || "Inconnu"}</div>
                        {access.adminAlias ? (
                          <div className="truncate text-xs font-medium text-violet-300/90">{access.adminAlias}</div>
                        ) : null}
                        <div className="truncate font-mono text-[11px] text-zinc-500">{access.discordId}</div>
                      </div>
                      <span className={`${getRoleBadgeClass(access.role)} shrink-0`}>
                        {ROLE_LABELS[access.role] || access.role}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {deleteTargetDiscordId ? (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"
            style={{ backgroundColor: "rgba(0,0,0,0.65)" }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-access-title"
            onClick={() => setDeleteTargetDiscordId(null)}
          >
            <div
              className="w-full max-w-md rounded-2xl border border-red-500/35 bg-zinc-950/95 p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 id="delete-access-title" className="text-lg font-bold text-zinc-50">
                Retirer l&apos;accès administrateur ?
              </h3>
              <p className="mt-2 text-sm text-zinc-400">
                Cette personne ne pourra plus ouvrir l&apos;espace admin. Tu peux réinviter l&apos;accès plus tard si besoin.
              </p>
              <div className="mt-5 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteTargetDiscordId(null)}
                  className="rounded-xl border border-zinc-600/80 bg-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-800"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => void confirmDeleteAccess(deleteTargetDiscordId)}
                  className="rounded-xl border border-red-500/50 bg-red-950/50 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-950/70"
                >
                  Confirmer la suppression
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {aliasModal ? (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"
            style={{ backgroundColor: "rgba(0,0,0,0.65)" }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="alias-modal-title"
            onClick={() => setAliasModal(null)}
          >
            <div
              className="w-full max-w-md rounded-2xl border border-zinc-700/80 bg-zinc-950/95 p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 id="alias-modal-title" className="text-lg font-bold text-zinc-50">
                Pseudo admin
              </h3>
              <p className="mt-1 text-sm text-zinc-400">
                {aliasModal.access.username || aliasModal.access.discordId} — laisse vide pour retirer le pseudo.
              </p>
              <input
                type="text"
                value={aliasModal.value}
                onChange={(e) => setAliasModal((m) => (m ? { ...m, value: e.target.value } : m))}
                maxLength={40}
                className={`${inputClass} mt-4`}
                aria-label="Pseudo admin"
              />
              <div className="mt-5 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAliasModal(null)}
                  className="rounded-xl border border-zinc-600/80 bg-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-800"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => void submitAliasModal()}
                  className="rounded-xl border border-violet-500/50 bg-violet-950/50 px-4 py-2 text-sm font-semibold text-violet-100 transition hover:bg-violet-900/60"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
