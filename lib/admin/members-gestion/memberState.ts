import { isInactiveExitMemberRole } from "@/lib/memberRoles";
import type { Member } from "./types";
import { getMemberCompleteness, isStaffRole } from "./memberListHelpers";

/**
 * État TENF synthétique d'un membre, dérivé des champs déjà disponibles.
 * L'objectif est de donner un repère humain unique (« quel est l'état de ce
 * membre dans la communauté ? ») sans avoir à lire 5 colonnes du tableau.
 *
 * La priorité va du plus engageant pour l'admin vers le plus neutre :
 *   archive → staff → revue due → nouveau → à compléter → en pause → vip → actif.
 *
 * Le calcul est volontairement pur et déterministe pour pouvoir être mémoïsé.
 */
export type MemberTenfStateId =
  | "archived"
  | "departed"
  | "banned"
  | "staff"
  | "review_due"
  | "new"
  | "incomplete"
  | "paused"
  | "community"
  | "vip"
  | "active";

export type MemberTenfStateTone =
  | "neutral"
  | "indigo"
  | "violet"
  | "amber"
  | "rose"
  | "emerald"
  | "slate"
  | "fuchsia";

export type MemberTenfState = {
  id: MemberTenfStateId;
  /** Libellé court utilisé dans les badges et la colonne dédiée. */
  label: string;
  /** Description courte pour le tooltip / l'aide contextuelle. */
  hint: string;
  tone: MemberTenfStateTone;
};

const STATE_BY_ID: Record<MemberTenfStateId, MemberTenfState> = {
  archived: {
    id: "archived",
    label: "Archivé",
    hint: "Membre retiré de la communauté active. Consulter ou désarchiver via la fiche.",
    tone: "slate",
  },
  departed: {
    id: "departed",
    label: "Départ",
    hint: "A quitté TENF. Compte inactif, hors suivi d'information.",
    tone: "slate",
  },
  banned: {
    id: "banned",
    label: "Banni",
    hint: "Compte sanctionné. Inactif, hors suivi et hors listings publics.",
    tone: "slate",
  },
  staff: {
    id: "staff",
    label: "Staff",
    hint: "Membre du staff TENF (modérateur, admin, mentor…). Compte gardé visible même si inactif.",
    tone: "indigo",
  },
  review_due: {
    id: "review_due",
    label: "À revoir",
    hint: "Une revue staff est planifiée ou en retard pour ce membre.",
    tone: "amber",
  },
  new: {
    id: "new",
    label: "Nouveau",
    hint: "Rôle « Nouveau » : intégration en cours, fiche à valider.",
    tone: "violet",
  },
  incomplete: {
    id: "incomplete",
    label: "À compléter",
    hint: "Fiche complétée à moins de 80 % : IDs, parrain ou description manquants.",
    tone: "amber",
  },
  paused: {
    id: "paused",
    label: "En pause",
    hint: "Statut inactif : membre sorti des listings actifs, suivi pause.",
    tone: "rose",
  },
  community: {
    id: "community",
    label: "Communauté",
    hint: "Rôle Communauté : en pause stable, fiche conservée pour référence.",
    tone: "slate",
  },
  vip: {
    id: "vip",
    label: "VIP",
    hint: "Membre mis en avant : visible en priorité dans l'annuaire et l'espace membre.",
    tone: "fuchsia",
  },
  active: {
    id: "active",
    label: "Actif",
    hint: "Membre actif, fiche correctement renseignée. Rien à faire.",
    tone: "emerald",
  },
};

/**
 * Retourne l'état TENF synthétique d'un membre.
 * Pure : n'effectue aucun fetch, juste de la dérivation à partir du Member.
 */
export function getMemberTenfState(member: Member, now: Date = new Date()): MemberTenfState {
  if (member.isArchived) return STATE_BY_ID.archived;
  if (member.role === "Départ") return STATE_BY_ID.departed;
  if (member.role === "Banni") return STATE_BY_ID.banned;
  if (member.role === "Communauté") return STATE_BY_ID.community;
  if (isStaffRole(member.role)) return STATE_BY_ID.staff;

  if (member.nextReviewAt) {
    const nextMs = new Date(member.nextReviewAt).getTime();
    if (Number.isFinite(nextMs) && nextMs <= now.getTime()) {
      return STATE_BY_ID.review_due;
    }
  }

  if (member.role === "Nouveau") return STATE_BY_ID.new;

  const completeness = getMemberCompleteness(member);
  if (completeness.percent < 80) return STATE_BY_ID.incomplete;

  if (member.statut === "Inactif") return STATE_BY_ID.paused;
  if (member.isVip) return STATE_BY_ID.vip;
  return STATE_BY_ID.active;
}

/** Tailwind classes par tonalité — gardé ici pour rester cohérent entre les usages. */
export const memberStateToneClasses: Record<MemberTenfStateTone, string> = {
  neutral: "border-white/10 bg-white/[0.05] text-slate-200",
  indigo: "border-indigo-400/45 bg-indigo-500/16 text-indigo-100",
  violet: "border-violet-400/45 bg-violet-500/16 text-violet-100",
  amber: "border-amber-400/45 bg-amber-500/16 text-amber-100",
  rose: "border-rose-400/45 bg-rose-500/16 text-rose-100",
  emerald: "border-emerald-400/45 bg-emerald-500/16 text-emerald-100",
  slate: "border-slate-500/45 bg-slate-500/16 text-slate-100",
  fuchsia: "border-fuchsia-400/45 bg-fuchsia-500/16 text-fuchsia-100",
};
