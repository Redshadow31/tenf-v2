"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Save,
  Shield,
  AlertCircle,
  CheckCircle2,
  X,
  Lock,
  Unlock,
  Search,
  ChevronRight,
  Layers,
  UserPlus,
  Sparkles,
  Filter,
  Copy,
  ChevronsDownUp,
  ChevronsUpDown,
  BarChart3,
} from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { administrationSiteHubNav } from "@/lib/admin/gestionAccesNav";
import { adminNavigation, type NavItem } from "@/lib/admin/navigation";
import type { AdminRole } from "@/lib/adminRoles";
import type { SectionPermission } from "@/lib/sectionPermissions";

const ROLE_LABELS: Record<AdminRole, string> = {
  FONDATEUR: "Fondateurs TENF",
  ADMIN_COORDINATEUR: "Coordinateurs TENF",
  MODERATEUR: "Modérateur TENF",
  MODERATEUR_EN_FORMATION: "Modérateur en Accompagnement",
  MODERATEUR_EN_PAUSE: "Modérateur en pause",
  SOUTIEN_TENF: "Soutien TENF",
};

const ROLE_ORDER = Object.keys(ROLE_LABELS) as AdminRole[];

interface PermissionsData {
  sections: Record<string, SectionPermission>;
  lastUpdated?: string;
  updatedBy?: string;
}

interface AdminAccessEntry {
  discordId: string;
  role: AdminRole;
  username?: string;
  adminAlias?: string;
}

/** Une page = une route protégée dans l’arbre de navigation */
interface PageRow {
  href: string;
  label: string;
  breadcrumb: string;
}

interface PermissionSubgroup {
  id: string;
  title: string;
  pages: PageRow[];
}

interface PermissionCategory {
  /** Identifiant stable pour le DOM (href contient des « / ») */
  id: string;
  title: string;
  sectionLabel?: string;
  subgroups: PermissionSubgroup[];
}

function categoryDomId(href: string): string {
  return `hub-${href.replace(/^\//, "").replace(/\//g, "-")}`;
}

function dedupePagesByHref(pages: PageRow[]): PageRow[] {
  const seen = new Set<string>();
  const out: PageRow[] = [];
  for (const p of pages) {
    if (seen.has(p.href)) continue;
    seen.add(p.href);
    out.push(p);
  }
  return out;
}

/** Toutes les pages (nœuds avec href) d’un sous-arbre, avec fil d’Ariane */
function collectSubtreePages(node: NavItem, ancestors: string[]): PageRow[] {
  const breadcrumb = [...ancestors, node.label].join(" › ");
  const rows: PageRow[] = [{ href: node.href, label: node.label, breadcrumb }];
  if (node.children) {
    for (const child of node.children) {
      rows.push(...collectSubtreePages(child, [...ancestors, node.label]));
    }
  }
  return dedupePagesByHref(rows);
}

function navHubToCategory(hub: NavItem): PermissionCategory {
  const id = categoryDomId(hub.href);
  if (!hub.children?.length) {
    return {
      id,
      title: hub.label,
      sectionLabel: hub.sectionLabel,
      subgroups: [
        {
          id: `${id}-root`,
          title: "Pages",
          pages: [{ href: hub.href, label: hub.label, breadcrumb: hub.label }],
        },
      ],
    };
  }
  return {
    id,
    title: hub.label,
    sectionLabel: hub.sectionLabel,
    subgroups: hub.children.map((child, idx) => ({
      id: `${id}-sg-${idx}-${categoryDomId(child.href)}`,
      title: child.label,
      pages: collectSubtreePages(child, [hub.label]),
    })),
  };
}

function buildPermissionCategories(nav: NavItem[]): PermissionCategory[] {
  return nav.map(navHubToCategory);
}

/** Liste plate pour initialiser le store (clés = href) */
function flattenCategoriesToSections(categories: PermissionCategory[]): SectionPermission[] {
  const map = new Map<string, SectionPermission>();
  for (const cat of categories) {
    for (const sg of cat.subgroups) {
      for (const p of sg.pages) {
        if (!map.has(p.href)) {
          map.set(p.href, {
            href: p.href,
            label: p.breadcrumb,
            roles: [],
            supportDiscordIds: [],
            extraDiscordIds: [],
          });
        }
      }
    }
  }
  return [...map.values()];
}

function categoryMatchesQuery(cat: PermissionCategory, q: string): PermissionCategory | null {
  if (!q.trim()) return cat;
  const needle = q.trim().toLowerCase();
  const titleHit = cat.title.toLowerCase().includes(needle) || (cat.sectionLabel?.toLowerCase().includes(needle) ?? false);
  const filteredSubgroups = cat.subgroups
    .map((sg) => ({
      ...sg,
      pages: sg.pages.filter(
        (p) =>
          p.label.toLowerCase().includes(needle) ||
          p.breadcrumb.toLowerCase().includes(needle) ||
          p.href.toLowerCase().includes(needle)
      ),
    }))
    .filter((sg) => sg.pages.length > 0);
  if (filteredSubgroups.length === 0 && !titleHit) return null;
  if (filteredSubgroups.length === 0 && titleHit) return cat;
  return { ...cat, subgroups: filteredSubgroups };
}

type ViewFilter = "all" | "restricted" | "extra" | "open";

function sectionStateFromMap(sections: Record<string, SectionPermission>, href: string) {
  const s = sections[href];
  if (!s) return { restricted: false, extra: false };
  const restricted = s.roles.length > 0 || (s.supportDiscordIds || []).length > 0;
  const extra = (s.extraDiscordIds || []).length > 0;
  return { restricted, extra };
}

function setAllSubgroupDetailsOpen(open: boolean) {
  if (typeof document === "undefined") return;
  document.querySelectorAll<HTMLDetailsElement>("details.perm-subgroup").forEach((el) => {
    el.open = open;
  });
}

export default function PermissionsPage() {
  const categories = useMemo(() => buildPermissionCategories(adminNavigation), []);
  const allSectionsFlat = useMemo(() => flattenCategoriesToSections(categories), [categories]);

  const [permissions, setPermissions] = useState<PermissionsData>({ sections: {} });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isFounder, setIsFounder] = useState(false);
  const [adminAccessList, setAdminAccessList] = useState<AdminAccessEntry[]>([]);
  const [search, setSearch] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [viewFilter, setViewFilter] = useState<ViewFilter>("all");

  const supportMembers = useMemo(
    () => adminAccessList.filter((entry) => entry.role === "SOUTIEN_TENF"),
    [adminAccessList],
  );

  const filteredCategories = useMemo(() => {
    const q = search;
    if (!q.trim()) return categories;
    return categories.map((c) => categoryMatchesQuery(c, q)).filter((c): c is PermissionCategory => c !== null);
  }, [categories, search]);

  const permissionStats = useMemo(() => {
    let total = 0;
    let restricted = 0;
    let withExtra = 0;
    for (const cat of categories) {
      for (const sg of cat.subgroups) {
        for (const p of sg.pages) {
          total++;
          const st = sectionStateFromMap(permissions.sections, p.href);
          if (st.restricted) restricted++;
          if (st.extra) withExtra++;
        }
      }
    }
    return { total, restricted, withExtra, domains: categories.length };
  }, [categories, permissions.sections]);

  const displayCategories = useMemo(() => {
    if (viewFilter === "all") return filteredCategories;
    return filteredCategories
      .map((cat) => ({
        ...cat,
        subgroups: cat.subgroups
          .map((sg) => ({
            ...sg,
            pages: sg.pages.filter((page) => {
              const st = sectionStateFromMap(permissions.sections, page.href);
              if (viewFilter === "restricted") return st.restricted;
              if (viewFilter === "extra") return st.extra;
              if (viewFilter === "open") return !st.restricted && !st.extra;
              return true;
            }),
          }))
          .filter((sg) => sg.pages.length > 0),
      }))
      .filter((cat) => cat.subgroups.length > 0);
  }, [filteredCategories, viewFilter, permissions.sections]);

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

  useEffect(() => {
    if (!isFounder) return;
    loadAdminAccessList();
    loadPermissions();
  }, [isFounder]);

  async function loadAdminAccessList() {
    try {
      const response = await fetch("/api/admin/access", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (!response.ok) return;
      const data = await response.json();
      const allAccess: AdminAccessEntry[] = data.accessList || [];
      setAdminAccessList(allAccess);
    } catch (err) {
      console.error("Error loading admin access list:", err);
    }
  }

  const loadPermissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/admin/permissions", {
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
      const sectionsData: Record<string, SectionPermission> = {};
      allSectionsFlat.forEach((section) => {
        const stored = data.permissions?.sections?.[section.href] as SectionPermission | undefined;
        sectionsData[section.href] = {
          href: section.href,
          label: stored?.label || section.label,
          roles: stored?.roles ?? [],
          supportDiscordIds: stored?.supportDiscordIds ?? [],
          extraDiscordIds: stored?.extraDiscordIds ?? [],
        };
      });
      setPermissions({
        sections: sectionsData,
        lastUpdated: data.permissions?.lastUpdated,
        updatedBy: data.permissions?.updatedBy,
      });
    } catch (err) {
      console.error("Error loading permissions:", err);
      setError("Erreur lors du chargement des permissions");
    } finally {
      setLoading(false);
    }
  }, [allSectionsFlat]);

  async function handleSave() {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const response = await fetch("/api/admin/permissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          permissions: { sections: permissions.sections },
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la sauvegarde");
      }
      setSuccess("Permissions sauvegardées avec succès !");
      setTimeout(() => setSuccess(null), 3000);
      await loadPermissions();
    } catch (err: unknown) {
      console.error("Error saving permissions:", err);
      setError(err instanceof Error ? err.message : "Erreur lors de la sauvegarde");
      setSuccess(null);
    } finally {
      setSaving(false);
    }
  }

  function toggleRoleAccess(sectionHref: string, role: AdminRole) {
    setPermissions((prev) => {
      const section = prev.sections[sectionHref];
      if (!section) return prev;
      const newRoles = section.roles.includes(role)
        ? section.roles.filter((r) => r !== role)
        : [...section.roles, role];
      return {
        ...prev,
        sections: {
          ...prev.sections,
          [sectionHref]: { ...section, roles: newRoles },
        },
      };
    });
  }

  function setAllRolesForSection(sectionHref: string, enabled: boolean) {
    setPermissions((prev) => {
      const section = prev.sections[sectionHref];
      if (!section) return prev;
      return {
        ...prev,
        sections: {
          ...prev.sections,
          [sectionHref]: {
            ...section,
            roles: enabled ? [] : ["FONDATEUR"],
          },
        },
      };
    });
  }

  function isRoleAllowed(sectionHref: string, role: AdminRole): boolean {
    const section = permissions.sections[sectionHref];
    if (!section) return true;
    if (section.roles.length === 0) return true;
    return section.roles.includes(role);
  }

  function hasRestrictions(sectionHref: string): boolean {
    const section = permissions.sections[sectionHref];
    if (!section) return false;
    return section.roles.length > 0 || (section.supportDiscordIds || []).length > 0;
  }

  function isSupportMemberAllowed(sectionHref: string, discordId: string): boolean {
    const section = permissions.sections[sectionHref];
    if (!section) return false;
    return (section.supportDiscordIds || []).includes(discordId);
  }

  function toggleSupportMemberAccess(sectionHref: string, discordId: string) {
    setPermissions((prev) => {
      const section = prev.sections[sectionHref];
      if (!section) return prev;
      const currentSupportIds = section.supportDiscordIds || [];
      const hasAccess = currentSupportIds.includes(discordId);
      const nextSupportIds = hasAccess
        ? currentSupportIds.filter((id) => id !== discordId)
        : [...currentSupportIds, discordId];
      return {
        ...prev,
        sections: {
          ...prev.sections,
          [sectionHref]: { ...section, supportDiscordIds: nextSupportIds },
        },
      };
    });
  }

  function toggleExtraDiscordAccess(sectionHref: string, discordId: string) {
    setPermissions((prev) => {
      const section = prev.sections[sectionHref];
      if (!section) return prev;
      const current = section.extraDiscordIds || [];
      const has = current.includes(discordId);
      const next = has ? current.filter((id) => id !== discordId) : [...current, discordId];
      return {
        ...prev,
        sections: {
          ...prev.sections,
          [sectionHref]: { ...section, extraDiscordIds: next },
        },
      };
    });
  }

  function addExtraDiscordByRawId(sectionHref: string, raw: string): string | null {
    const trimmed = raw.trim();
    if (!/^\d{15,22}$/.test(trimmed)) {
      return "ID Discord invalide (attendu : 15 à 22 chiffres).";
    }
    const current = permissions.sections[sectionHref]?.extraDiscordIds || [];
    if (current.includes(trimmed)) {
      return "Cette personne est déjà dans la liste.";
    }
    setPermissions((prev) => {
      const section = prev.sections[sectionHref];
      if (!section) return prev;
      const cur = section.extraDiscordIds || [];
      if (cur.includes(trimmed)) return prev;
      return {
        ...prev,
        sections: {
          ...prev.sections,
          [sectionHref]: { ...section, extraDiscordIds: [...cur, trimmed] },
        },
      };
    });
    return null;
  }

  function hasExtraGrants(sectionHref: string): boolean {
    const section = permissions.sections[sectionHref];
    return (section?.extraDiscordIds || []).length > 0;
  }

  const scrollToCategory = (id: string) => {
    setActiveCategoryId(id);
    const el = document.getElementById(`perm-cat-${id}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const countPagesInCategory = (cat: PermissionCategory) =>
    cat.subgroups.reduce((n, sg) => n + sg.pages.length, 0);

  const countRestrictedInCategory = (cat: PermissionCategory) => {
    let n = 0;
    for (const sg of cat.subgroups) {
      for (const p of sg.pages) {
        if (hasRestrictions(p.href)) n += 1;
      }
    }
    return n;
  };

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
            <div
              className="relative h-14 w-14 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-400"
              aria-hidden
            />
          </div>
          <p className="text-sm font-medium tracking-wide text-zinc-400">Vérification des accès fondateur…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden pb-28 sm:pb-24" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_100%_40%_at_50%_-10%,rgba(124,58,237,0.14),transparent)]" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(9,9,11,0.65))]" />
      <AdminHeader title="Permissions par section" navLinks={administrationSiteHubNav("/admin/gestion-acces/permissions")} />

      <div className="relative mx-auto max-w-[1680px] px-4 py-6 sm:px-6 lg:px-8">
        {error && (
          <div
            className="animate-fade-in mb-5 flex items-center gap-3 rounded-2xl border border-red-500/40 bg-red-950/30 p-4 shadow-lg shadow-red-950/20 backdrop-blur-md"
            role="alert"
          >
            <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
            <p className="flex-1 text-sm text-zinc-100">{error}</p>
            <button
              type="button"
              onClick={() => setError(null)}
              className="rounded-lg p-1.5 text-red-400 transition hover:bg-red-950/50 hover:text-red-200"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {success && (
          <div
            className="animate-fade-in mb-5 flex items-center gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-950/30 p-4 shadow-lg shadow-emerald-950/20 backdrop-blur-md"
            role="status"
          >
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
            <p className="flex-1 text-sm text-zinc-100">{success}</p>
            <button
              type="button"
              onClick={() => setSuccess(null)}
              className="rounded-lg p-1.5 text-emerald-400 transition hover:bg-emerald-950/50 hover:text-emerald-200"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Hero + stats */}
        <div className="mb-8 grid gap-6 lg:grid-cols-[1fr,auto] lg:items-end">
          <div className="min-w-0">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-950/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-violet-200/90">
              <Sparkles className="h-3.5 w-3.5 text-violet-400" aria-hidden />
              Espace fondateurs
            </div>
            <h1 className="bg-gradient-to-r from-zinc-50 via-zinc-200 to-violet-200 bg-clip-text text-2xl font-bold tracking-tight text-transparent sm:text-3xl">
              Permissions par domaine
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-400 sm:text-base">
              Rôles, filtres Soutien TENF et <span className="font-medium text-violet-300">dérogations personnelles</span> sur chaque
              page — le tout aligné sur la navigation admin. Pense à sauvegarder après tes changements.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-zinc-500">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800/80 bg-zinc-950/50 px-2.5 py-1">
                <Unlock className="h-3.5 w-3.5 text-emerald-400/90" aria-hidden />
                Ouvert par défaut
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800/80 bg-zinc-950/50 px-2.5 py-1">
                <Lock className="h-3.5 w-3.5 text-amber-400/90" aria-hidden />
                Restriction par rôle
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800/80 bg-zinc-950/50 px-2.5 py-1">
                <UserPlus className="h-3.5 w-3.5 text-violet-400/90" aria-hidden />
                Dérogation ID
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:flex-col lg:items-stretch">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading}
              className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-950/40 transition hover:brightness-110 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/15 to-white/0 opacity-0 transition group-hover:translate-x-full group-hover:opacity-100 group-hover:duration-700" />
              <Save className="relative h-5 w-5" />
              <span className="relative">{saving ? "Sauvegarde…" : "Sauvegarder"}</span>
            </button>
            {permissions.lastUpdated && (
              <p className="text-center text-[11px] leading-snug text-zinc-500 sm:text-right lg:text-center">
                Dernière mise à jour
                <br />
                <span className="font-medium text-zinc-400">
                  {new Date(permissions.lastUpdated).toLocaleString("fr-FR")}
                  {permissions.updatedBy && ` · ${permissions.updatedBy}`}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Statistiques */}
        {!loading && (
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              {
                label: "Pages",
                value: permissionStats.total,
                icon: Layers,
                accent: "from-zinc-500/20 to-transparent",
                border: "border-zinc-700/50",
              },
              {
                label: "Domaines",
                value: permissionStats.domains,
                icon: BarChart3,
                accent: "from-sky-500/15 to-transparent",
                border: "border-sky-800/40",
              },
              {
                label: "Restreintes",
                value: permissionStats.restricted,
                icon: Lock,
                accent: "from-amber-500/15 to-transparent",
                border: "border-amber-800/40",
              },
              {
                label: "Dérogations",
                value: permissionStats.withExtra,
                icon: UserPlus,
                accent: "from-violet-500/20 to-transparent",
                border: "border-violet-700/45",
              },
            ].map((card) => (
              <div
                key={card.label}
                className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${card.accent} p-4 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 ${card.border}`}
              >
                <card.icon className="mb-2 h-5 w-5 text-zinc-500" aria-hidden />
                <p className="font-mono text-2xl font-bold tabular-nums text-zinc-100">{card.value}</p>
                <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">{card.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filtres + recherche */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              <Filter className="h-3.5 w-3.5" aria-hidden />
              Vue
            </span>
            {(
              [
                { id: "all" as const, label: "Tout" },
                { id: "restricted" as const, label: "Restreint" },
                { id: "extra" as const, label: "Dérogation" },
                { id: "open" as const, label: "Sans config" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setViewFilter(opt.id)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition active:scale-95 ${
                  viewFilter === opt.id
                    ? "border-violet-500/60 bg-violet-950/60 text-violet-100 shadow-[0_0_24px_rgba(139,92,246,0.2)]"
                    : "border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setAllSubgroupDetailsOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700/80 bg-zinc-900/60 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:border-zinc-500 hover:text-white active:scale-[0.98]"
            >
              <ChevronsUpDown className="h-4 w-4" aria-hidden />
              Tout ouvrir
            </button>
            <button
              type="button"
              onClick={() => setAllSubgroupDetailsOpen(false)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700/80 bg-zinc-900/60 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:border-zinc-500 hover:text-white active:scale-[0.98]"
            >
              <ChevronsDownUp className="h-4 w-4" aria-hidden />
              Tout fermer
            </button>
          </div>
        </div>

        <div className="relative mb-8">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une page, un domaine ou une URL…"
            className="w-full rounded-2xl border border-zinc-800/90 bg-zinc-950/70 py-3.5 pl-11 pr-4 text-sm text-zinc-100 shadow-inner shadow-black/30 outline-none ring-0 transition placeholder:text-zinc-600 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
            aria-label="Filtrer les permissions"
          />
        </div>

        {loading ? (
          <div className="grid gap-4 py-8 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-36 animate-pulse rounded-2xl border border-zinc-800/60 bg-zinc-950/40"
                style={{ animationDelay: `${i * 80}ms` }}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
            {/* Sommaire domaines — desktop */}
            <aside className="hidden w-[min(100%,300px)] shrink-0 lg:block" aria-label="Sommaire des domaines">
              <div className="sticky top-4 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-2xl border border-zinc-800/80 bg-zinc-950/50 p-3 shadow-xl shadow-black/30 backdrop-blur-md">
                <p className="mb-3 flex items-center gap-2 px-2 text-[11px] font-bold uppercase tracking-widest text-zinc-500">
                  <Layers className="h-3.5 w-3.5 text-violet-400" aria-hidden />
                  Domaines
                </p>
                <nav className="flex flex-col gap-1">
                  {displayCategories.map((cat) => {
                    const total = countPagesInCategory(cat);
                    const rest = countRestrictedInCategory(cat);
                    const active = activeCategoryId === cat.id;
                    const pct = total > 0 ? Math.round((rest / total) * 100) : 0;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => scrollToCategory(cat.id)}
                        className={`group flex w-full flex-col gap-1.5 rounded-xl border px-3 py-2.5 text-left text-sm transition active:scale-[0.99] ${
                          active
                            ? "border-violet-500/50 bg-violet-950/40 text-zinc-50 shadow-[inset_0_0_0_1px_rgba(139,92,246,0.35)]"
                            : "border-transparent bg-transparent text-zinc-300 hover:border-zinc-700/80 hover:bg-zinc-900/60"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <ChevronRight
                            className={`h-4 w-4 shrink-0 transition ${active ? "rotate-90 text-violet-400" : "text-zinc-600 group-hover:text-zinc-400"}`}
                            aria-hidden
                          />
                          <span className="min-w-0 flex-1 truncate font-semibold">{cat.title}</span>
                          <span className="shrink-0 tabular-nums text-[11px] font-medium text-zinc-500">
                            {rest > 0 ? `${rest}/${total}` : total}
                          </span>
                        </span>
                        <span className="ml-6 block h-1 overflow-hidden rounded-full bg-zinc-800">
                          <span
                            className={`block h-full rounded-full transition-all ${rest > 0 ? "bg-amber-500/80" : "bg-emerald-500/50"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </aside>

            {/* Liste principale par catégorie */}
            <div className="min-w-0 flex-1 space-y-10">
              {/* Sommaire horizontal — mobile / tablette */}
              <div className="flex gap-2 overflow-x-auto pb-2 lg:hidden" role="tablist" aria-label="Domaines">
                {displayCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => scrollToCategory(cat.id)}
                    className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition active:scale-95 ${
                      activeCategoryId === cat.id
                        ? "border-violet-500/60 bg-violet-950/70 text-violet-100"
                        : "border-zinc-800 bg-zinc-950/70 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                    }`}
                  >
                    {cat.sectionLabel ?? cat.title}
                  </button>
                ))}
              </div>

              {displayCategories.length === 0 && (
                <div className="rounded-2xl border border-dashed border-zinc-700/80 bg-zinc-950/40 p-12 text-center">
                  <Search className="mx-auto mb-3 h-10 w-10 text-zinc-600" aria-hidden />
                  <p className="text-sm font-medium text-zinc-300">Aucune page ne correspond</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {search.trim()
                      ? `Essaie un autre mot-clé ou enlève le filtre « ${viewFilter === "all" ? "tout" : viewFilter} ».`
                      : "Change le filtre de vue pour afficher plus de pages."}
                  </p>
                </div>
              )}

              {displayCategories.map((cat) => {
                const catRestricted = countRestrictedInCategory(cat);
                const catTotal = countPagesInCategory(cat);
                return (
                  <section
                    key={cat.id}
                    id={`perm-cat-${cat.id}`}
                    className="scroll-mt-28 overflow-hidden rounded-2xl border border-zinc-800/90 bg-zinc-950/40 shadow-2xl shadow-black/40 backdrop-blur-sm transition hover:border-zinc-700/90"
                  >
                    <header className="relative border-b border-zinc-800/80 bg-gradient-to-r from-zinc-900/90 via-violet-950/20 to-zinc-900/90 px-4 py-5 sm:px-6">
                      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(105deg,transparent,rgba(139,92,246,0.06),transparent)]" />
                      <div className="relative flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-700/80 bg-zinc-950/80 text-sm font-bold text-violet-300">
                              {cat.title.slice(0, 1).toUpperCase()}
                            </span>
                            <h2 className="text-lg font-bold tracking-tight text-zinc-50 sm:text-xl">{cat.title}</h2>
                            {cat.sectionLabel && (
                              <span className="rounded-lg border border-zinc-700/80 bg-zinc-950/60 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                                {cat.sectionLabel}
                              </span>
                            )}
                          </div>
                          <p className="mt-2 text-xs text-zinc-500 sm:text-sm">
                            {catTotal} page{catTotal > 1 ? "s" : ""}
                            {catRestricted > 0 ? (
                              <span className="text-amber-200/90"> · {catRestricted} avec restriction rôle / soutien</span>
                            ) : (
                              <span className="text-emerald-400/80"> · aucune restriction par rôle</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </header>

                    <div className="divide-y divide-zinc-800/80">
                      {cat.subgroups.map((sg) => (
                        <details key={sg.id} className="perm-subgroup group" open>
                          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 bg-zinc-950/30 px-4 py-3.5 marker:hidden transition hover:bg-zinc-900/50 sm:px-6 [&::-webkit-details-marker]:hidden">
                            <span className="flex min-w-0 items-center gap-2.5 text-sm font-semibold text-zinc-200">
                              <ChevronRight className="h-4 w-4 shrink-0 text-zinc-500 transition group-open:rotate-90 group-open:text-violet-400" />
                              <span className="truncate">{sg.title}</span>
                              <span className="shrink-0 rounded-full border border-zinc-700/80 bg-zinc-900/80 px-2 py-0.5 text-[10px] font-bold tabular-nums text-zinc-400">
                                {sg.pages.length}
                              </span>
                            </span>
                          </summary>
                          <div className="space-y-0 border-t" style={{ borderColor: "var(--color-border)" }}>
                            {sg.pages.map((page) => {
                              const sectionPerm = permissions.sections[page.href] || {
                                href: page.href,
                                label: page.breadcrumb,
                                roles: [],
                                supportDiscordIds: [],
                                extraDiscordIds: [],
                              };
                              const restricted = hasRestrictions(page.href);
                              const extraGrant = hasExtraGrants(page.href);
                              return (
                                <PagePermissionBlock
                                  key={page.href}
                                  page={page}
                                  sectionPerm={sectionPerm}
                                  restricted={restricted}
                                  extraGrant={extraGrant}
                                  ROLE_LABELS={ROLE_LABELS}
                                  ROLE_ORDER={ROLE_ORDER}
                                  supportMembers={supportMembers}
                                  adminAccessList={adminAccessList}
                                  isRoleAllowed={(role) => isRoleAllowed(page.href, role)}
                                  toggleRoleAccess={(role) => toggleRoleAccess(page.href, role)}
                                  setAllRolesForSection={(enabled) => setAllRolesForSection(page.href, enabled)}
                                  isSupportMemberAllowed={(id) => isSupportMemberAllowed(page.href, id)}
                                  toggleSupportMemberAccess={(id) => toggleSupportMemberAccess(page.href, id)}
                                  toggleExtraDiscordAccess={(id) => toggleExtraDiscordAccess(page.href, id)}
                                  addExtraDiscordByRawId={(raw) => addExtraDiscordByRawId(page.href, raw)}
                                />
                              );
                            })}
                          </div>
                        </details>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Barre sauvegarde mobile */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-800/90 bg-zinc-950/90 p-3 shadow-[0_-12px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:hidden">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || loading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-950/50 transition active:scale-[0.98] disabled:opacity-45"
        >
          <Save className="h-5 w-5" />
          {saving ? "Sauvegarde…" : "Sauvegarder les permissions"}
        </button>
      </div>
    </div>
  );
}

function displayNameForAdmin(discordId: string, list: AdminAccessEntry[]): string {
  const m = list.find((a) => a.discordId === discordId);
  if (!m) return discordId;
  const alias = typeof m.adminAlias === "string" ? m.adminAlias.trim() : "";
  const un = typeof m.username === "string" ? m.username.trim() : "";
  return alias || un || m.discordId;
}

function PagePermissionBlock({
  page,
  sectionPerm,
  restricted,
  extraGrant,
  ROLE_LABELS,
  ROLE_ORDER,
  supportMembers,
  adminAccessList,
  isRoleAllowed,
  toggleRoleAccess,
  setAllRolesForSection,
  isSupportMemberAllowed,
  toggleSupportMemberAccess,
  toggleExtraDiscordAccess,
  addExtraDiscordByRawId,
}: {
  page: PageRow;
  sectionPerm: SectionPermission;
  restricted: boolean;
  extraGrant: boolean;
  ROLE_LABELS: Record<AdminRole, string>;
  ROLE_ORDER: AdminRole[];
  supportMembers: AdminAccessEntry[];
  adminAccessList: AdminAccessEntry[];
  isRoleAllowed: (role: AdminRole) => boolean;
  toggleRoleAccess: (role: AdminRole) => void;
  setAllRolesForSection: (enabled: boolean) => void;
  isSupportMemberAllowed: (id: string) => boolean;
  toggleSupportMemberAccess: (id: string) => void;
  toggleExtraDiscordAccess: (id: string) => void;
  addExtraDiscordByRawId: (raw: string) => string | null;
}) {
  const [draftExtraId, setDraftExtraId] = useState("");
  const [extraInputError, setExtraInputError] = useState<string | null>(null);
  const founderOnlyLocked = restricted && sectionPerm.roles.length === 1 && sectionPerm.roles.includes("FONDATEUR");
  const extras = sectionPerm.extraDiscordIds || [];
  const [extrasDetailsOpen, setExtrasDetailsOpen] = useState(() => extras.length > 0);
  const extrasSig = extras.join(",");
  const pickableAdmins = useMemo(() => {
    const inExtras = new Set(extrasSig ? extrasSig.split(",") : []);
    return [...adminAccessList]
      .filter((a) => !inExtras.has(a.discordId))
      .sort((a, b) => {
        const la = ROLE_LABELS[a.role].localeCompare(ROLE_LABELS[b.role], "fr");
        if (la !== 0) return la;
        return displayNameForAdmin(a.discordId, adminAccessList).localeCompare(
          displayNameForAdmin(b.discordId, adminAccessList),
          "fr",
        );
      });
  }, [adminAccessList, extrasSig, ROLE_LABELS]);

  const [copiedHref, setCopiedHref] = useState(false);
  const accentClass = restricted ? "bg-amber-500" : extraGrant ? "bg-violet-500" : "bg-emerald-500/70";

  return (
    <div className="relative border-b border-zinc-800/50 bg-zinc-950/20 px-4 py-5 transition-colors hover:bg-zinc-900/25 sm:px-6">
      <div
        className={`absolute left-0 top-3 bottom-3 w-1 rounded-full ${accentClass} shadow-[0_0_12px_rgba(0,0,0,0.35)]`}
        aria-hidden
      />
      <div className="relative pl-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {restricted ? (
                <Lock className="h-4 w-4 shrink-0 text-amber-400" aria-hidden />
              ) : (
                <Unlock className="h-4 w-4 shrink-0 text-zinc-600" aria-hidden />
              )}
              <h3 className="text-base font-bold tracking-tight text-zinc-100">{page.label}</h3>
              {restricted && (
                <span className="rounded-full border border-amber-500/40 bg-amber-950/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-200">
                  Restreint
                </span>
              )}
              {extraGrant && (
                <span className="rounded-full border border-violet-500/40 bg-violet-950/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-200">
                  Dérogation
                </span>
              )}
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(page.href);
                    setCopiedHref(true);
                    setTimeout(() => setCopiedHref(false), 2000);
                  } catch {
                    /* ignore */
                  }
                }}
                className="ml-auto inline-flex items-center gap-1 rounded-lg border border-zinc-700/80 bg-zinc-900/60 px-2 py-1 text-[10px] font-medium text-zinc-400 transition hover:border-zinc-500 hover:text-zinc-200 lg:ml-0"
              >
                <Copy className="h-3 w-3" aria-hidden />
                {copiedHref ? "Copié !" : "Copier l’URL"}
              </button>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-zinc-500 sm:text-sm">{page.breadcrumb}</p>
            <p className="mt-1 truncate font-mono text-[10px] text-violet-300/80 sm:text-[11px]">{page.href}</p>
          </div>

          <div className="flex shrink-0 flex-col gap-3 lg:items-end">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setAllRolesForSection(true)}
                disabled={!restricted}
                className="rounded-xl border border-emerald-800/50 bg-emerald-950/40 px-3 py-2 text-xs font-semibold text-emerald-200 transition enabled:hover:bg-emerald-900/50 enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-35"
              >
                Tous les rôles
              </button>
              <button
                type="button"
                onClick={() => setAllRolesForSection(false)}
                disabled={founderOnlyLocked}
                className="rounded-xl border border-red-900/50 bg-red-950/35 px-3 py-2 text-xs font-semibold text-red-200 transition enabled:hover:bg-red-900/40 enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-35"
              >
                Fondateurs seul.
              </button>
            </div>

            <div className="flex max-w-full flex-wrap justify-end gap-1.5">
              {ROLE_ORDER.map((role) => {
                const allowed = isRoleAllowed(role);
                const onClasses =
                  role === "FONDATEUR"
                    ? "bg-red-700 ring-red-400/40"
                    : role === "ADMIN_COORDINATEUR"
                      ? "bg-orange-700 ring-orange-400/35"
                      : role === "MODERATEUR"
                        ? "bg-orange-600 ring-orange-300/30"
                        : role === "MODERATEUR_EN_FORMATION"
                          ? "bg-blue-700 ring-blue-400/35"
                          : role === "MODERATEUR_EN_PAUSE"
                            ? "bg-slate-600 ring-slate-400/30"
                            : role === "SOUTIEN_TENF"
                              ? "bg-teal-700 ring-teal-400/35"
                              : "bg-slate-700 ring-slate-400/25";
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggleRoleAccess(role)}
                    title={allowed ? `Retirer ${ROLE_LABELS[role]}` : `Autoriser ${ROLE_LABELS[role]}`}
                    className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[10px] font-semibold transition sm:text-xs ${
                      allowed
                        ? `text-white shadow-md ring-1 ${onClasses} hover:brightness-110 active:scale-95`
                        : "border border-zinc-700/90 bg-zinc-900/80 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300 active:scale-95"
                    }`}
                  >
                    {allowed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5 opacity-50" />}
                    <span className="max-w-[8.5rem] truncate sm:max-w-[10rem]">{ROLE_LABELS[role]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <details
          className="group mt-5 overflow-hidden rounded-2xl border border-violet-900/40 bg-gradient-to-br from-violet-950/30 to-zinc-950/40 open:shadow-[0_0_24px_rgba(91,33,182,0.15)]"
          open={extrasDetailsOpen}
          onToggle={(e) => setExtrasDetailsOpen(e.currentTarget.open)}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 marker:hidden transition hover:bg-violet-950/25 [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-violet-200/90">
              <UserPlus className="h-4 w-4 text-violet-400" aria-hidden />
              Dérogations personnelles
            </span>
            <ChevronRight className="h-4 w-4 text-zinc-500 transition group-open:rotate-90 group-open:text-violet-400" aria-hidden />
          </summary>
          <div className="space-y-3 border-t border-violet-900/30 px-4 py-4">
            <p className="text-[11px] leading-relaxed text-zinc-400">
              Accès à cette page <span className="font-semibold text-zinc-200">même si le rôle</span> n’est pas coché (formation,
              soutien, etc.).
            </p>
            {extras.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {extras.map((id) => (
                  <button
                    key={`extra-${page.href}-${id}`}
                    type="button"
                    onClick={() => toggleExtraDiscordAccess(id)}
                    className="inline-flex max-w-full items-center gap-2 rounded-xl border border-violet-500/40 bg-violet-950/60 px-3 py-1.5 text-left text-xs font-medium text-violet-100 shadow-sm transition hover:border-red-500/50 hover:bg-red-950/30 active:scale-[0.98]"
                    title="Retirer cette dérogation"
                  >
                    <span className="min-w-0 truncate">{displayNameForAdmin(id, adminAccessList)}</span>
                    <span className="shrink-0 font-mono text-[10px] text-violet-300/80">{id}</span>
                    <X className="h-3.5 w-3.5 shrink-0 text-violet-300" aria-hidden />
                  </button>
                ))}
              </div>
            )}
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <label className="min-w-0 flex-1 sm:max-w-[220px]">
                <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-zinc-500">Équipe admin</span>
                <select
                  className="w-full cursor-pointer rounded-xl border border-zinc-700/90 bg-zinc-950/80 px-3 py-2.5 text-xs text-zinc-100 outline-none transition focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20"
                  value=""
                  onChange={(e) => {
                    const v = e.target.value;
                    e.target.value = "";
                    if (!v) return;
                    toggleExtraDiscordAccess(v);
                    setExtraInputError(null);
                  }}
                  aria-label="Choisir un membre pour dérogation"
                >
                  <option value="">+ Ajouter depuis la liste</option>
                  {pickableAdmins.map((m) => (
                    <option key={m.discordId} value={m.discordId}>
                      {displayNameForAdmin(m.discordId, adminAccessList)} ({ROLE_LABELS[m.role]})
                    </option>
                  ))}
                </select>
              </label>
              <div className="min-w-0 flex-1 sm:max-w-[280px]">
                <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-zinc-500">ID Discord</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={draftExtraId}
                    onChange={(e) => {
                      setDraftExtraId(e.target.value);
                      setExtraInputError(null);
                    }}
                    placeholder="Coller l’ID…"
                    className="min-w-0 flex-1 rounded-xl border border-zinc-700/90 bg-zinc-950/80 px-3 py-2.5 font-mono text-xs text-zinc-100 outline-none transition focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20"
                    aria-label="Identifiant Discord"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const err = addExtraDiscordByRawId(draftExtraId);
                      if (err) {
                        setExtraInputError(err);
                        return;
                      }
                      setDraftExtraId("");
                      setExtraInputError(null);
                    }}
                    className="shrink-0 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-950/40 transition hover:bg-violet-500 active:scale-95"
                  >
                    OK
                  </button>
                </div>
                {extraInputError && <p className="mt-1.5 text-[11px] font-medium text-red-400">{extraInputError}</p>}
              </div>
            </div>
          </div>
        </details>

        {isRoleAllowed("SOUTIEN_TENF") && (
          <details className="group mt-4 overflow-hidden rounded-2xl border border-teal-900/40 bg-teal-950/15 open:shadow-[0_0_20px_rgba(15,118,110,0.12)]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 marker:hidden transition hover:bg-teal-950/25 [&::-webkit-details-marker]:hidden">
              <span className="text-xs font-bold uppercase tracking-wide text-teal-200/90">Soutien TENF — liste blanche</span>
              <ChevronRight className="h-4 w-4 text-zinc-500 transition group-open:rotate-90 group-open:text-teal-400" aria-hidden />
            </summary>
            <div className="border-t border-teal-900/30 px-4 py-4">
              {supportMembers.length === 0 ? (
                <p className="text-xs text-zinc-500">Aucun Soutien TENF dans la gestion des accès.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {supportMembers.map((member) => {
                    const allowed = isSupportMemberAllowed(member.discordId);
                    return (
                      <button
                        key={`${page.href}-${member.discordId}`}
                        type="button"
                        onClick={() => toggleSupportMemberAccess(member.discordId)}
                        className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
                          allowed
                            ? "border-teal-500/50 bg-teal-800/50 text-white shadow-md"
                            : "border-zinc-700/80 bg-zinc-900/60 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        {(member.username || member.discordId).trim()}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </details>
        )}

        {restricted && (
          <div className="mt-4 rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-3 py-2.5 text-[11px] text-zinc-400">
            {sectionPerm.roles.length > 0 ? (
              <>
                <span className="font-semibold text-zinc-200">Rôles autorisés :</span>{" "}
                {sectionPerm.roles.map((r) => ROLE_LABELS[r]).join(", ")}
              </>
            ) : (
              <>
                <span className="font-semibold text-zinc-200">Soutiens :</span> liste blanche ci-dessus.
              </>
            )}
            {(sectionPerm.extraDiscordIds || []).length > 0 && (
              <span className="mt-1 block text-violet-300/90">
                + dérogations personnelles actives sur cette page.
              </span>
            )}
          </div>
        )}
        {!restricted && (sectionPerm.supportDiscordIds || []).length > 0 && (
          <div className="mt-3 rounded-xl border border-emerald-800/40 bg-emerald-950/20 px-3 py-2 text-[11px] text-emerald-200/90">
            Tous les rôles autorisés, filtre Soutien TENF actif.
          </div>
        )}
      </div>
    </div>
  );
}
