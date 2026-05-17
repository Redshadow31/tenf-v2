"use client";

import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronDown,
  MoreHorizontal,
  ListChecks,
  Sparkles,
  Search,
  Clock,
  AlertCircle,
  Inbox,
  Instagram,
  ExternalLink,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import AdminToastStack, { type AdminToastItem } from "@/components/admin/ui/AdminToastStack";
import { getRoleBadgeLabel } from "@/lib/roleBadgeSystem";
import { getRoleBadgeStyles } from "@/lib/roleColors";
import { isStaffRole } from "@/lib/admin/members-gestion/memberListHelpers";

/* ------------------------------------------------------------------------- */
/*  Types — API enrichie : chaque demande embarque un mini-snapshot membre   */
/* ------------------------------------------------------------------------- */

interface PendingMemberSnapshot {
  role: string | null;
  displayName: string | null;
  isActive: boolean | null;
  isVip: boolean | null;
  isArchived: boolean | null;
  profileValidationStatus: string | null;
  hasIntegrationDate: boolean;
  /** Photo de profil Twitch si présente dans twitch_status (API GET enrichie). */
  avatarUrl: string | null;
}

interface PendingItem {
  id: string;
  twitch_login: string;
  discord_id: string | null;
  description: string | null;
  instagram: string | null;
  tiktok: string | null;
  twitter: string | null;
  birthday: string | null;
  twitch_affiliate_date: string | null;
  status: string;
  submitted_at: string;
  member: PendingMemberSnapshot | null;
}

type PresetFilter =
  | "all"
  | "no_description"
  | "older_24h"
  | "with_socials"
  | "with_external_links"
  | "new_members"
  | "staff"
  | "community";

/* ------------------------------------------------------------------------- */
/*  Utilitaires de présentation                                              */
/* ------------------------------------------------------------------------- */

/** Format "il y a 2 h", "il y a 3 j" — relatif au moment d'appel. */
function formatRelative(iso: string | null | undefined, now: number = Date.now()): string {
  if (!iso) return "—";
  const ms = new Date(iso).getTime();
  if (!Number.isFinite(ms)) return "—";
  const diff = Math.max(0, now - ms);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return "à l'instant";
  if (diff < hour) return `il y a ${Math.floor(diff / minute)} min`;
  if (diff < day) return `il y a ${Math.floor(diff / hour)} h`;
  if (diff < 30 * day) return `il y a ${Math.floor(diff / day)} j`;
  const months = Math.floor(diff / (30 * day));
  return `il y a ${months} mois`;
}

function isOlderThan(iso: string | null | undefined, ms: number, now: number = Date.now()): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return false;
  return now - t >= ms;
}

function countSocials(item: PendingItem): number {
  let c = 0;
  if (item.instagram?.trim()) c += 1;
  if (item.tiktok?.trim()) c += 1;
  if (item.twitter?.trim()) c += 1;
  return c;
}

const URL_IN_TEXT = /https?:\/\//i;

/** Détecte un lien http(s) dans le descriptif ou un champ réseau (pas de filtre factice). */
function hasExternalLinkInItem(item: PendingItem): boolean {
  if (URL_IN_TEXT.test(item.description || "")) return true;
  for (const f of [item.instagram, item.tiktok, item.twitter]) {
    if (f && URL_IN_TEXT.test(f)) return true;
  }
  return false;
}

/** Recherche : pseudo Twitch, rôle (code ou libellé), nom affiché, contenu du descriptif proposé. */
function matchesSearchQuery(item: PendingItem, raw: string): boolean {
  const q = raw.trim().toLowerCase();
  if (!q) return true;
  if (item.twitch_login.toLowerCase().includes(q)) return true;
  const desc = (item.description || "").toLowerCase();
  if (desc.includes(q)) return true;
  if (item.member?.displayName?.toLowerCase().includes(q)) return true;
  const role = item.member?.role;
  if (role) {
    if (role.toLowerCase().includes(q)) return true;
    if (getRoleBadgeLabel(role).toLowerCase().includes(q)) return true;
  }
  return false;
}

/**
 * Message d'avertissement contextuel selon le rôle TENF du membre.
 * Si l'effet exact n'est pas couvert par un cas fiable, message neutre (ne pas inventer).
 */
function getRoleWarning(member: PendingMemberSnapshot | null): {
  tone: "neutral" | "amber" | "rose" | "indigo" | "emerald";
  message: string;
} | null {
  if (!member) return null;
  if (!member.role) {
    return {
      tone: "neutral",
      message: "Rôle TENF inconnu en base : vérifie le membre avant validation.",
    };
  }
  const role = member.role;
  if (role === "Nouveau") {
    return {
      tone: "amber",
      message:
        "Ce membre est Nouveau : la validation publie les informations proposées, mais ne finalise pas forcément son intégration (rôle final à attribuer en fiche).",
    };
  }
  if (role === "Communauté") {
    return {
      tone: "rose",
      message:
        "Ce membre est Communauté : il reste inactif après validation. Vérifie si la fiche doit rester hors parcours créateur actif.",
    };
  }
  if (isStaffRole(role)) {
    return {
      tone: "indigo",
      message:
        "Ce membre fait partie du staff TENF : vérifie les informations avant publication (annuaire et espace membre).",
    };
  }
  if (member.isActive === true) {
    return {
      tone: "emerald",
      message: "Ce membre est déjà actif : la validation met simplement à jour sa fiche publique.",
    };
  }
  return {
    tone: "neutral",
    message: "Vérifie le rôle et le statut du membre avant validation.",
  };
}

const warningToneClass: Record<NonNullable<ReturnType<typeof getRoleWarning>>["tone"], string> = {
  neutral: "border-white/10 bg-white/[0.04] text-slate-200",
  amber: "border-amber-400/35 bg-amber-500/10 text-amber-100",
  rose: "border-rose-400/35 bg-rose-500/10 text-rose-100",
  indigo: "border-indigo-400/35 bg-indigo-500/10 text-indigo-100",
  emerald: "border-emerald-400/35 bg-emerald-500/10 text-emerald-100",
};

function PendingItemDetail({
  item,
  isBusy,
  onApprove,
  onReject,
}: {
  item: PendingItem;
  isBusy: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const warning = getRoleWarning(item.member);
  const hasDescription = !!item.description && !!item.description.trim();
  const memberRole = item.member?.role || null;
  const isStaff = !!memberRole && isStaffRole(memberRole);

  return (
    <>
      {warning ? (
        <div
          className={`mb-3 flex items-start gap-2 rounded-lg border px-2.5 py-1.5 text-[11px] leading-snug ${warningToneClass[warning.tone]}`}
          role="note"
        >
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>{warning.message}</span>
        </div>
      ) : null}

      {/* TODO(diff): afficher Actuel vs Proposé quand l'API exposera les valeurs profil courantes côté demande. */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="md:col-span-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Contenu proposé · description</p>
          {hasDescription ? (
            <p className="mt-1 whitespace-pre-wrap rounded-lg border border-white/10 bg-[#0f1321] p-2 text-sm leading-relaxed text-slate-100">
              {item.description}
            </p>
          ) : (
            <p className="mt-1 rounded-lg border border-white/5 bg-white/[0.02] p-2 text-xs italic text-slate-500">Aucun descriptif proposé.</p>
          )}
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Réseaux proposés</p>
          <ul className="mt-1 space-y-1 text-xs">
            <DetailRow
              label="Instagram"
              value={item.instagram}
              icon={Instagram}
              hrefBuilder={(v) => `https://www.instagram.com/${v.replace(/^@/, "")}`}
            />
            <DetailRow
              label="TikTok"
              value={item.tiktok}
              hrefBuilder={(v) => `https://www.tiktok.com/@${v.replace(/^@/, "")}`}
            />
            <DetailRow
              label="Twitter / X"
              value={item.twitter}
              hrefBuilder={(v) => `https://twitter.com/${v.replace(/^@/, "")}`}
            />
          </ul>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Dates proposées</p>
          <ul className="mt-1 space-y-1 text-xs">
            <DetailRow
              label="Anniversaire"
              value={
                item.birthday
                  ? new Date(item.birthday).toLocaleDateString("fr-FR", { day: "2-digit", month: "long" })
                  : null
              }
            />
            <DetailRow
              label="Affiliation Twitch"
              value={
                item.twitch_affiliate_date
                  ? new Date(item.twitch_affiliate_date).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })
                  : null
              }
            />
            <li className="flex items-center justify-between gap-2 text-slate-400">
              <span className="text-slate-500">Soumise</span>
              <span title={new Date(item.submitted_at).toLocaleString("fr-FR")}>{formatRelative(item.submitted_at)}</span>
            </li>
          </ul>
        </div>

        {item.member ? (
          <div className="md:col-span-2 rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-2 text-[11px] text-slate-400">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Rôle actuel · membre en base</p>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
              {item.member.displayName ? (
                <span>
                  Nom affiché : <span className="text-slate-200">{item.member.displayName}</span>
                </span>
              ) : null}
              <span>
                Statut compte :{" "}
                <span className={item.member.isActive ? "text-emerald-200" : "text-rose-200"}>
                  {item.member.isActive === null ? "inconnu" : item.member.isActive ? "actif" : "inactif"}
                </span>
              </span>
              <span>
                Validation profil :{" "}
                <span className="text-slate-200">{item.member.profileValidationStatus || "non renseigné"}</span>
              </span>
              {item.member.hasIntegrationDate ? (
                <span className="text-emerald-200">Intégration renseignée</span>
              ) : (
                <span className="text-amber-200">Intégration manquante</span>
              )}
            </p>
          </div>
        ) : (
          <div
            className="md:col-span-2 rounded-lg border border-amber-400/30 bg-amber-500/10 px-2.5 py-2 text-[11px] text-amber-100"
            role="note"
          >
            Aucun membre correspondant en base pour <strong>@{item.twitch_login}</strong>. La validation créera ou liera la fiche selon les règles métier.
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
        <Link
          href={`/admin/membres/gestion?search=${encodeURIComponent(item.twitch_login)}`}
          className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-slate-200 transition hover:bg-white/[0.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/45"
        >
          Voir la fiche
          <ExternalLink className="h-3 w-3" aria-hidden />
        </Link>
        <button
          type="button"
          onClick={onReject}
          disabled={isBusy}
          aria-label={`Rejeter la demande de @${item.twitch_login}`}
          className="inline-flex items-center gap-1 rounded-lg border border-rose-400/30 bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-100 transition hover:bg-rose-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/45 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <XCircle className="h-3.5 w-3.5" aria-hidden />
          Rejeter
        </button>
        <button
          type="button"
          onClick={onApprove}
          disabled={isBusy}
          aria-label={`Valider la demande de @${item.twitch_login}`}
          className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/40 bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-50 transition hover:bg-emerald-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/45 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />}
          Valider
        </button>
      </div>
      {isStaff ? (
        <p className="mt-2 text-[10px] text-slate-500">
          Profil staff visible côté annuaire : vérifie l&apos;orthographe et les liens avant publication.
        </p>
      ) : null}
    </>
  );
}

function MobileDetailSheet({
  item,
  isBusy,
  onClose,
  onApprove,
  onReject,
}: {
  item: PendingItem | null;
  isBusy: boolean;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  if (!item) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden">
      <div
        className="absolute inset-0 bg-black/60"
        role="presentation"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`mobile-detail-${item.id}`}
        className="relative z-10 mt-auto max-h-[min(92vh,880px)] w-full overflow-y-auto overscroll-y-contain rounded-t-2xl border border-[#2f3244] border-b-0 bg-[#0f1118] px-4 pb-6 pt-3 shadow-[0_-8px_40px_rgba(0,0,0,0.45)]"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p id={`mobile-detail-${item.id}`} className="truncate text-sm font-semibold text-white">
              @{item.twitch_login}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">Contenu proposé · vérifier avant publication</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-white/10 px-2 py-1 text-xs font-semibold text-slate-200 transition hover:bg-white/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/45"
          >
            Fermer
          </button>
        </div>
        <PendingItemDetail
          item={item}
          isBusy={isBusy}
          onApprove={() => onApprove(item.id)}
          onReject={() => onReject(item.id)}
        />
      </div>
    </div>
  );
}

function getInitials(login: string): string {
  if (!login) return "?";
  const trimmed = login.trim();
  if (!trimmed) return "?";
  return trimmed.slice(0, 2).toUpperCase();
}

/* ------------------------------------------------------------------------- */
/*  Page                                                                     */
/* ------------------------------------------------------------------------- */

export default function ValidationProfilPage() {
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actioning, setActioning] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [presetFilter, setPresetFilter] = useState<PresetFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<AdminToastItem[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  function pushToast(
    type: "success" | "warning" | "info",
    title: string,
    description?: string,
    durationMs: number = 3500
  ) {
    const toast: AdminToastItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      title,
      description,
    };
    setToasts((prev) => [...prev, toast]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== toast.id));
    }, durationMs);
  }

  const loadPending = useCallback(async () => {
    try {
      setRefreshing(true);
      setErrorMsg(null);
      const res = await fetch("/api/admin/members/profile-validation", { cache: "no-store" });
      if (!res.ok) {
        setErrorMsg("Impossible de charger les demandes (HTTP " + res.status + ").");
        return;
      }
      const data = await res.json();
      setPending(data.pending || []);
    } catch (e) {
      console.error(e);
      setErrorMsg("Erreur de connexion. Vérifie ton réseau puis réessaie.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadPending();
  }, [loadPending]);

  /* --------- Filtrage --------- */

  const filteredPending = useMemo(() => {
    return pending.filter((item) => {
      if (!matchesSearchQuery(item, search)) return false;
      switch (presetFilter) {
        case "no_description":
          return !item.description || !item.description.trim();
        case "older_24h":
          return isOlderThan(item.submitted_at, 24 * 60 * 60 * 1000);
        case "with_socials":
          return countSocials(item) > 0;
        case "with_external_links":
          return hasExternalLinkInItem(item);
        case "new_members":
          return item.member?.role === "Nouveau";
        case "staff":
          return !!item.member?.role && isStaffRole(item.member.role);
        case "community":
          return item.member?.role === "Communauté";
        case "all":
        default:
          return true;
      }
    });
  }, [pending, search, presetFilter]);

  useEffect(() => {
    if (expandedId && !filteredPending.some((p) => p.id === expandedId)) {
      setExpandedId(null);
    }
  }, [filteredPending, expandedId]);

  /* --------- Compteurs --------- */

  const counts = useMemo(() => {
    let older24h = 0;
    let noDesc = 0;
    let withSocials = 0;
    let newMembers = 0;
    let staff = 0;
    let community = 0;
    let externalLinks = 0;
    for (const item of pending) {
      if (isOlderThan(item.submitted_at, 24 * 60 * 60 * 1000)) older24h += 1;
      if (!item.description || !item.description.trim()) noDesc += 1;
      if (countSocials(item) > 0) withSocials += 1;
      if (item.member?.role === "Nouveau") newMembers += 1;
      if (item.member?.role && isStaffRole(item.member.role)) staff += 1;
      if (item.member?.role === "Communauté") community += 1;
      if (hasExternalLinkInItem(item)) externalLinks += 1;
    }
    return { older24h, noDesc, withSocials, newMembers, staff, community, externalLinks };
  }, [pending]);

  /* --------- Sélection / navigation clavier --------- */

  useEffect(() => {
    if (filteredPending.length === 0) {
      setActiveId(null);
      return;
    }
    if (!activeId || !filteredPending.some((p) => p.id === activeId)) {
      setActiveId(filteredPending[0].id);
    }
  }, [filteredPending, activeId]);

  /* --------- Actions --------- */

  const handleAction = useCallback(
    async (id: string, action: "approve" | "reject" | "force_delete") => {
      const item = pending.find((p) => p.id === id);
      const label = item ? `@${item.twitch_login}` : "cette demande";

      if (action === "reject") {
        const confirmed = window.confirm(
          `Refuser la demande ${label} ?\n\nLa demande sera rejetée sans publier les modifications. Le membre pourra soumettre une nouvelle proposition.`
        );
        if (!confirmed) return;
      }

      if (action === "force_delete") {
        const confirmed = window.confirm(
          `Supprimer la demande ${label} sans validation ?\n\nCette action supprime la demande de validation sans publier les modifications sur le profil membre. L'entrée disparaît définitivement de la file.`
        );
        if (!confirmed) return;
      }

      setActioning(id);
      try {
        const res = await fetch("/api/admin/members/profile-validation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, action }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setPending((prev) => prev.filter((p) => p.id !== id));
          setOpenMenuId((prev) => (prev === id ? null : prev));
          setExpandedId((prev) => (prev === id ? null : prev));
          pushToast(
            "success",
            action === "approve"
              ? "Demande validée"
              : action === "reject"
              ? "Demande rejetée"
              : "Demande supprimée"
          );
        } else {
          pushToast(
            "warning",
            "Action impossible",
            data?.error || "Le serveur a refusé l'action. Réessaie ou actualise.",
            6000
          );
        }
      } catch (e) {
        console.error(e);
        pushToast("warning", "Erreur de connexion", "Réessaie une fois la connexion rétablie.", 6000);
      } finally {
        setActioning(null);
      }
    },
    [pending]
  );

  /* --------- Raccourcis clavier (V / R / J / K / Esc) --------- */

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      // Désactive si l'utilisateur tape dans un champ
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || target?.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "Escape") {
        if (expandedId) {
          setExpandedId(null);
          e.preventDefault();
        } else if (openMenuId) {
          setOpenMenuId(null);
          e.preventDefault();
        }
        return;
      }
      if (filteredPending.length === 0) return;
      const idx = activeId ? filteredPending.findIndex((p) => p.id === activeId) : -1;

      if (e.key === "j" || e.key === "ArrowDown") {
        const next = idx < 0 ? 0 : Math.min(filteredPending.length - 1, idx + 1);
        setActiveId(filteredPending[next].id);
        e.preventDefault();
      } else if (e.key === "k" || e.key === "ArrowUp") {
        const prev = idx < 0 ? 0 : Math.max(0, idx - 1);
        setActiveId(filteredPending[prev].id);
        e.preventDefault();
      } else if (e.key === "Enter") {
        if (activeId) {
          setExpandedId((cur) => (cur === activeId ? null : activeId));
          e.preventDefault();
        }
      } else if (e.key === "v" || e.key === "V") {
        if (activeId && actioning !== activeId) {
          void handleAction(activeId, "approve");
          e.preventDefault();
        }
      } else if (e.key === "r" || e.key === "R") {
        if (activeId && actioning !== activeId) {
          void handleAction(activeId, "reject");
          e.preventDefault();
        }
      } else if (e.key === "/") {
        searchInputRef.current?.focus();
        e.preventDefault();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeId, filteredPending, actioning, handleAction, expandedId, openMenuId]);

  /* --------- Fermeture menu au clic dehors --------- */

  useEffect(() => {
    if (!openMenuId) return;
    function onClick(e: MouseEvent) {
      const t = e.target as HTMLElement | null;
      if (!t || !t.closest("[data-menu-root]")) {
        setOpenMenuId(null);
      }
    }
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [openMenuId]);

  /* --------- Render --------- */

  const totalPending = pending.length;

  return (
    <div className="text-white">
      <AdminToastStack
        toasts={toasts}
        onClose={(id) => setToasts((prev) => prev.filter((item) => item.id !== id))}
      />

      <div className="space-y-3 p-3 md:p-4 xl:p-5">
        {/* Header compact — breadcrumb + titre + compteurs + actualiser */}
        <header className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-2xl border border-[#2f3244] bg-[#0f1118]/95 px-3 py-2">
          <Link
            href="/admin/membres/gestion"
            className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-xs text-slate-400 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/45"
            aria-label="Retour à la gestion des membres"
          >
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
            Membres
          </Link>
          <span className="text-slate-600" aria-hidden>
            /
          </span>
          <h1 className="flex items-center gap-2 text-sm font-semibold text-white">
            <ListChecks className="h-4 w-4 text-indigo-300" aria-hidden />
            Validation profil
          </h1>
          <span
            className="inline-flex items-center gap-1 rounded-full border border-indigo-400/35 bg-indigo-500/15 px-2 py-0.5 text-[11px] font-semibold text-indigo-100"
            title="Demandes actuellement en attente de décision"
          >
            <Inbox className="h-3 w-3" aria-hidden />
            {totalPending} demande{totalPending > 1 ? "s" : ""} en attente
          </span>
          {counts.older24h > 0 ? (
            <span
              className="inline-flex items-center gap-1 rounded-full border border-amber-400/45 bg-amber-500/12 px-2 py-0.5 text-[11px] font-semibold text-amber-100"
              title="Demandes soumises il y a plus de 24 heures"
            >
              <Clock className="h-3 w-3" aria-hidden />
              {counts.older24h} &gt; 24 h
            </span>
          ) : null}
          <div className="ml-auto flex items-center gap-2">
            <kbd className="hidden md:inline-flex items-center gap-1 rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-slate-400">
              V valider · R rejeter · J/K navig.
            </kbd>
            <button
              type="button"
              onClick={() => void loadPending()}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#353a50] bg-[#121623]/85 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition hover:border-indigo-400/35 hover:bg-[#1a2132] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/45 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} aria-hidden />
              {refreshing ? "Actualisation…" : "Actualiser"}
            </button>
          </div>
        </header>
        <p className="px-1 text-xs leading-relaxed text-slate-500">
          Les créateurs proposent des changements depuis leur espace membre. Vérifie le contenu — et le rôle TENF — avant publication.
        </p>

        {errorMsg ? (
          <div
            role="alert"
            aria-live="assertive"
            className="flex items-start gap-2 rounded-xl border border-rose-400/35 bg-rose-500/10 px-3 py-2 text-sm text-rose-100"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <div className="flex-1">{errorMsg}</div>
            <button
              type="button"
              onClick={() => void loadPending()}
              className="rounded border border-rose-300/40 bg-rose-500/15 px-2 py-0.5 text-xs font-semibold text-rose-50 hover:bg-rose-500/25"
            >
              Réessayer
            </button>
          </div>
        ) : null}

        {/* Filtres compacts */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#2f3244] bg-[#0f1118]/95 px-2.5 py-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500"
              aria-hidden
            />
            <input
              ref={searchInputRef}
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pseudo, rôle, nom affiché ou contenu proposé… ( / pour focus )"
              className="w-full rounded-lg border border-[#353a50] bg-[#121623]/85 pl-7 pr-2 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-300/55 focus-visible:ring-2 focus-visible:ring-indigo-400/35"
              aria-label="Rechercher par pseudo Twitch, rôle, nom affiché ou contenu proposé"
            />
          </div>
          {(
            [
              { key: "all", label: "Toutes", count: totalPending, tooltip: "Toutes les demandes en attente" },
              { key: "older_24h", label: "> 24 h", count: counts.older24h, tooltip: "Soumises il y a plus de 24 h" },
              { key: "no_description", label: "Sans descriptif", count: counts.noDesc, tooltip: "Demandes sans description proposée" },
              { key: "with_socials", label: "Avec réseaux", count: counts.withSocials, tooltip: "Au moins un réseau social fourni" },
              {
                key: "with_external_links",
                label: "Liens externes",
                count: counts.externalLinks,
                tooltip: "http(s) détecté dans le descriptif ou un champ réseau",
              },
              { key: "new_members", label: "Nouveaux", count: counts.newMembers, tooltip: "Membres au rôle Nouveau" },
              { key: "staff", label: "Staff", count: counts.staff, tooltip: "Rôles staff (modération, admin, etc.)" },
              { key: "community", label: "Communauté", count: counts.community, tooltip: "Rôle Communauté" },
            ] as Array<{ key: PresetFilter; label: string; count: number; tooltip: string }>
          ).map(({ key, label, count, tooltip }) => {
            const active = presetFilter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setPresetFilter(key)}
                aria-pressed={active}
                title={tooltip}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/45 ${
                  active
                    ? "border-indigo-400/55 bg-indigo-500/22 text-white shadow-[0_0_14px_rgba(99,102,241,0.22)]"
                    : "border-[#353a50] bg-[#151821]/90 text-slate-300 hover:border-indigo-400/35 hover:bg-[#1b2130] hover:text-white"
                }`}
              >
                {label}
                <span className={`tabular-nums ${active ? "text-indigo-100" : "text-slate-500"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Liste / loading / empty */}
        {loading ? (
          <div
            className="flex items-center justify-center rounded-2xl border border-[#2f3244] bg-[#0f1118]/95 py-10"
            role="status"
            aria-live="polite"
          >
            <Loader2 className="h-6 w-6 animate-spin text-indigo-300" aria-hidden />
            <span className="ml-2 text-sm text-slate-400">Chargement des demandes…</span>
          </div>
        ) : filteredPending.length === 0 ? (
          <EmptyState
            isFiltered={search.trim().length > 0 || presetFilter !== "all"}
            onClearFilters={() => {
              setSearch("");
              setPresetFilter("all");
            }}
          />
        ) : (
          <>
          <ul
            ref={listRef}
            role="list"
            aria-label="File des demandes de validation profil"
            className="min-w-0 overflow-x-auto rounded-2xl border border-[#2f3244] bg-[#0f1118]/95"
          >
            {filteredPending.map((item, idx) => {
              const isActive = activeId === item.id;
              const isExpanded = expandedId === item.id;
              const isBusy = actioning === item.id;
              const aged = isOlderThan(item.submitted_at, 24 * 60 * 60 * 1000);
              const socials = countSocials(item);
              const hasDescription = !!item.description && !!item.description.trim();
              const memberRole = item.member?.role || null;
              const roleStyles = memberRole ? getRoleBadgeStyles(memberRole) : null;
              const roleLabel = memberRole ? getRoleBadgeLabel(memberRole) : null;

              return (
                <li
                  key={item.id}
                  className={`relative border-b border-white/[0.05] last:border-b-0 transition-colors ${
                    isActive ? "bg-[#161b2a]/80" : idx % 2 === 0 ? "bg-transparent" : "bg-white/[0.012]"
                  } ${isExpanded ? "bg-[#161b2a]/95" : ""}`}
                  onMouseEnter={() => setActiveId(item.id)}
                  aria-current={isActive ? "true" : undefined}
                >
                  {isActive && (
                    <span
                      className="pointer-events-none absolute inset-y-0 left-0 w-0.5 bg-indigo-400/80"
                      aria-hidden
                    />
                  )}
                  <div className="flex flex-wrap items-center gap-2 px-3 py-2 sm:gap-3">
                    <div
                      className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-gradient-to-br from-indigo-500/30 to-violet-500/15"
                      aria-hidden
                    >
                      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-indigo-100">
                        {getInitials(item.twitch_login)}
                      </span>
                      {item.member?.avatarUrl ? (
                        <img
                          src={item.member.avatarUrl}
                          alt=""
                          className="relative z-10 h-full w-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : null}
                    </div>

                    {/* Pseudo + rôle + meta */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <Link
                          href={`/admin/membres/gestion?search=${encodeURIComponent(item.twitch_login)}`}
                          className="truncate text-sm font-semibold text-white hover:text-indigo-200 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/45 rounded"
                        >
                          @{item.twitch_login}
                        </Link>
                        {roleLabel && roleStyles ? (
                          <span
                            className="rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                            style={{
                              background: roleStyles.bg,
                              color: roleStyles.text,
                              borderColor: roleStyles.border || "transparent",
                            }}
                            title={`Rôle TENF actuel : ${roleLabel}`}
                          >
                            {roleLabel}
                          </span>
                        ) : item.member ? (
                          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                            Rôle inconnu
                          </span>
                        ) : null}
                        {item.member && item.member.isActive !== null ? (
                          <span
                            className={`rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${
                              item.member.isActive
                                ? "border-emerald-400/35 bg-emerald-500/12 text-emerald-100"
                                : "border-slate-500/40 bg-white/[0.04] text-slate-400"
                            }`}
                            title={item.member.isActive ? "Compte actif" : "Compte inactif"}
                          >
                            {item.member.isActive ? "Actif" : "Inactif"}
                          </span>
                        ) : null}
                        {item.member?.isVip ? (
                          <span className="rounded-full border border-fuchsia-400/40 bg-fuchsia-500/15 px-1.5 py-0.5 text-[10px] font-bold text-fuchsia-100">
                            VIP
                          </span>
                        ) : null}
                        {aged ? (
                          <span
                            className="inline-flex items-center gap-0.5 rounded-full border border-amber-400/45 bg-amber-500/12 px-1.5 py-0.5 text-[10px] font-semibold text-amber-100"
                            title="Demande ancienne : soumise il y a plus de 24 h"
                          >
                            <Clock className="h-2.5 w-2.5" aria-hidden />
                            Demande ancienne
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-slate-400">
                        <span>{formatRelative(item.submitted_at)}</span>
                        <span className="mx-1 text-slate-600" aria-hidden>·</span>
                        <span className={hasDescription ? "text-slate-300" : "text-slate-500"}>
                          {hasDescription ? "Descriptif proposé" : "Sans descriptif"}
                        </span>
                        <span className="mx-1 text-slate-600" aria-hidden>·</span>
                        <span className={socials > 0 ? "text-slate-300" : "text-slate-500"}>
                          {socials > 0 ? `${socials} réseau${socials > 1 ? "x" : ""}` : "0 réseau"}
                        </span>
                        {item.birthday ? (
                          <>
                            <span className="mx-1 text-slate-600" aria-hidden>·</span>
                            <span className="text-slate-300">anniversaire</span>
                          </>
                        ) : null}
                        {item.twitch_affiliate_date ? (
                          <>
                            <span className="mx-1 text-slate-600" aria-hidden>·</span>
                            <span className="text-slate-300">date affiliation</span>
                          </>
                        ) : null}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-1.5 shrink-0 sm:flex-nowrap">
                      <button
                        type="button"
                        onClick={() => void handleAction(item.id, "approve")}
                        disabled={isBusy}
                        aria-label={`Valider la demande de @${item.twitch_login}`}
                        title="Valider la demande (raccourci : V)"
                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/40 bg-emerald-500/18 px-2.5 py-1 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-500/28 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/45 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isBusy ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                        )}
                        Valider
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpandedId((prev) => (prev === item.id ? null : item.id))}
                        aria-expanded={isExpanded}
                        aria-controls={`detail-${item.id}`}
                        aria-label={`${isExpanded ? "Replier" : "Afficher"} le détail de la demande de @${item.twitch_login}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-xs font-semibold text-slate-200 transition hover:bg-white/[0.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/45"
                      >
                        <ChevronDown
                          className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                          aria-hidden
                        />
                        <span className="hidden sm:inline">Détails</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleAction(item.id, "reject")}
                        disabled={isBusy}
                        aria-label={`Rejeter la demande de @${item.twitch_login}`}
                        title="Rejeter la demande (raccourci : R) — le membre pourra resoumettre"
                        className="inline-flex items-center gap-1 rounded-md border border-rose-400/20 bg-transparent px-2 py-1 text-[11px] font-medium text-rose-200/90 transition hover:border-rose-400/35 hover:bg-rose-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/45 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <XCircle className="h-3 w-3 opacity-80" aria-hidden />
                        <span className="hidden sm:inline">Rejeter</span>
                      </button>
                      <div className="relative" data-menu-root>
                        <button
                          type="button"
                          onClick={() => setOpenMenuId((prev) => (prev === item.id ? null : item.id))}
                          aria-haspopup="menu"
                          aria-expanded={openMenuId === item.id}
                          aria-label={`Plus d'actions pour @${item.twitch_login}`}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 transition hover:bg-white/[0.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/45"
                        >
                          <MoreHorizontal className="h-4 w-4" aria-hidden />
                        </button>
                        {openMenuId === item.id ? (
                          <div
                            role="menu"
                            className="absolute right-0 z-30 mt-2 w-56 rounded-xl border border-[#2f3244] bg-[#0f1118] p-1 shadow-2xl"
                          >
                            <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                              Zone danger
                            </p>
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setOpenMenuId(null);
                                void handleAction(item.id, "force_delete");
                              }}
                              className="flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-rose-100 transition hover:bg-rose-500/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/45"
                            >
                              <Trash2 className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" aria-hidden />
                              <span className="flex-1">
                                <span className="block font-semibold">Forcer la suppression</span>
                                <span className="mt-0.5 block text-[11px] text-slate-400">
                                  Retire définitivement l'entrée. Confirmation requise.
                                </span>
                              </span>
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Détail déplié — desktop / tablette */}
                  {isExpanded ? (
                    <div
                      id={`detail-${item.id}`}
                      className="hidden border-t border-white/[0.06] bg-[#10131c] px-4 py-3 md:block"
                      role="region"
                      aria-label={`Détail de la demande @${item.twitch_login}`}
                    >
                      <PendingItemDetail
                        item={item}
                        isBusy={isBusy}
                        onApprove={() => void handleAction(item.id, "approve")}
                        onReject={() => void handleAction(item.id, "reject")}
                      />
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
          {expandedId ? (
            <MobileDetailSheet
              item={filteredPending.find((p) => p.id === expandedId) ?? null}
              isBusy={actioning === expandedId}
              onClose={() => setExpandedId(null)}
              onApprove={(id) => void handleAction(id, "approve")}
              onReject={(id) => void handleAction(id, "reject")}
            />
          ) : null}
          </>
        )}

        {/* Récap discret en bas */}
        {!loading && pending.length > 0 ? (
          <p className="px-1 text-[11px] text-slate-500">
            {filteredPending.length} demande{filteredPending.length > 1 ? "s" : ""} affichée
            {filteredPending.length > 1 ? "s" : ""} sur {pending.length}. {counts.noDesc} sans descriptif ·{" "}
            {counts.withSocials} avec réseaux · {counts.older24h} &gt; 24 h · {counts.staff} staff · {counts.community}{" "}
            communauté · {counts.externalLinks === 1 ? "1 lien externe" : `${counts.externalLinks} liens externes`}.
          </p>
        ) : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------- */
/*  Sous-composants locaux                                                   */
/* ------------------------------------------------------------------------- */

function DetailRow({
  label,
  value,
  icon: Icon,
  hrefBuilder,
}: {
  label: string;
  value: string | null | undefined;
  icon?: LucideIcon;
  hrefBuilder?: (v: string) => string;
}) {
  if (!value || !value.trim()) {
    return (
      <li className="flex items-center justify-between gap-2 text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          {Icon ? <Icon className="h-3 w-3 opacity-60" aria-hidden /> : null}
          {label}
        </span>
        <span className="italic">non fourni</span>
      </li>
    );
  }
  const href = hrefBuilder ? hrefBuilder(value.trim()) : null;
  return (
    <li className="flex items-center justify-between gap-2 text-slate-300">
      <span className="inline-flex items-center gap-1.5 text-slate-400">
        {Icon ? <Icon className="h-3 w-3 opacity-80" aria-hidden /> : null}
        {label}
      </span>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex max-w-[60%] items-center gap-1 truncate text-indigo-200 hover:text-indigo-100"
        >
          <span className="truncate">{value}</span>
          <ExternalLink className="h-3 w-3 shrink-0 opacity-80" aria-hidden />
        </a>
      ) : (
        <span className="max-w-[60%] truncate">{value}</span>
      )}
    </li>
  );
}

function EmptyState({
  isFiltered,
  onClearFilters,
}: {
  isFiltered: boolean;
  onClearFilters: () => void;
}) {
  if (isFiltered) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-[#2f3244] bg-[#0f1118]/95 px-4 py-10 text-center">
        <Search className="mb-3 h-8 w-8 text-slate-500" aria-hidden />
        <p className="text-sm font-semibold text-white">Aucune demande ne correspond aux filtres.</p>
        <p className="mt-1 max-w-sm text-xs text-slate-400">
          Réinitialise les filtres ou la recherche pour voir l'ensemble de la file.
        </p>
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-3 inline-flex items-center gap-1 rounded-lg border border-indigo-300/35 bg-indigo-500/15 px-3 py-1.5 text-xs font-semibold text-indigo-100 hover:bg-indigo-500/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/45"
        >
          Réinitialiser les filtres
        </button>
      </div>
    );
  }
  return (
    <div
      className="flex flex-col items-center justify-center rounded-2xl border border-emerald-400/25 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.10),_rgba(11,13,20,0.95)_55%)] px-4 py-10 text-center"
      role="status"
      aria-live="polite"
    >
      <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/15">
        <Sparkles className="h-6 w-6 text-emerald-300" aria-hidden />
      </div>
      <p className="text-sm font-semibold text-white">Tout est traité</p>
      <p className="mt-1 max-w-md text-xs text-slate-400">
        Aucune demande de modification de profil n'attend une validation. Beau travail.
      </p>
      <nav className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs" aria-label="Suite logique">
        <Link
          href="/admin/membres/gestion"
          className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 font-medium text-slate-200 transition hover:bg-white/[0.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/45"
        >
          Retour au hub membres
        </Link>
        <Link
          href="/admin/membres/gestion?search=&preset=incomplets"
          className="inline-flex items-center gap-1 rounded-lg border border-amber-400/30 bg-amber-500/10 px-2.5 py-1 font-medium text-amber-100 transition hover:bg-amber-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/45"
        >
          Voir les profils à compléter
        </Link>
        <Link
          href="/admin/membres/revues"
          className="inline-flex items-center gap-1 rounded-lg border border-sky-400/30 bg-sky-500/10 px-2.5 py-1 font-medium text-sky-100 transition hover:bg-sky-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/45"
        >
          Revues membres
        </Link>
        <Link
          href="/admin/membres/postulations"
          className="inline-flex items-center gap-1 rounded-lg border border-indigo-400/30 bg-indigo-500/10 px-2.5 py-1 font-medium text-indigo-100 transition hover:bg-indigo-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/45"
        >
          Postulations staff
        </Link>
      </nav>
    </div>
  );
}
